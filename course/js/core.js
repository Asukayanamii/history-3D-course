/*
 * core.js —— 渲染器、场景、相机、投影、补间、HTML 标签层与公共工具。
 * 所有模块挂在 window.HS（History Sandbox）命名空间下；对外 API 见 main.js 的 HISTORY_APP。
 */
(function () {
  "use strict";

  var HS = (window.HS = window.HS || {});

  /* ------------------------------------------------------------------ *
   * 小工具
   * ------------------------------------------------------------------ */
  var U = (HS.util = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    smooth: function (t) { return t * t * (3 - 2 * t); },
    easeInOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    easeOutCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    deg: Math.PI / 180,
    // 稳定的字符串哈希，用于让示意色块、山体散布每次刷新都一样
    hash: function (str) {
      var h = 2166136261;
      for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    },
    rng: function (seed) {
      var s = seed >>> 0 || 1;
      return function () {
        s = (s + 0x6d2b79f5) >>> 0;
        var t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // 最短路径的角度插值（弧度）
    angleLerp: function (a, b, t) {
      var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      return a + d * t;
    },
    pointInPoly: function (x, y, poly) {
      var inside = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    },
    el: function (tag, cls, html) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    sleep: function (ms) { return new Promise(function (r) { HS.timers.set(r, ms); }); }
  });

  /* ------------------------------------------------------------------ *
   * 计时器：主题切换时统一清理
   * ------------------------------------------------------------------ */
  HS.timers = {
    _ids: new Set(),
    set: function (fn, ms) {
      var self = this;
      var id = setTimeout(function () { self._ids.delete(id); fn(); }, ms);
      this._ids.add(id);
      return id;
    },
    clear: function (id) { clearTimeout(id); this._ids.delete(id); },
    clearAll: function () { this._ids.forEach(function (id) { clearTimeout(id); }); this._ids.clear(); }
  };

  /* ------------------------------------------------------------------ *
   * 投影：等距圆柱（equirect），沙盘宽固定 W=100
   * 注：纬向按 cos(中心纬度) 拉伸，使经纬两个方向的 km 比例一致。
   * ------------------------------------------------------------------ */
  var P = (HS.proj = {
    W: 100, H: 100, bounds: null, cLat: 35, kmUnit: 1,
    set: function (b) {
      this.bounds = b;
      this.cLat = (b.north + b.south) / 2;
      var c = Math.cos(this.cLat * U.deg);
      this.H = (this.W * (b.north - b.south)) / ((b.east - b.west) * c);
      // 1 km 对应的场景单位
      this.kmUnit = this.W / ((b.east - b.west) * 111.32 * c);
    },
    x: function (lon) { var b = this.bounds; return ((lon - b.west) / (b.east - b.west)) * this.W - this.W / 2; },
    z: function (lat) { var b = this.bounds; return ((b.north - lat) / (b.north - b.south)) * this.H - this.H / 2; },
    lon: function (x) { var b = this.bounds; return b.west + ((x + this.W / 2) / this.W) * (b.east - b.west); },
    lat: function (z) { var b = this.bounds; return b.north - ((z + this.H / 2) / this.H) * (b.north - b.south); },
    vec: function (lon, lat, y) { return new THREE.Vector3(this.x(lon), y || 0, this.z(lat)); },
    inBounds: function (lon, lat) {
      var b = this.bounds;
      return lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
    }
  });

  // 数据里的 dist 以「沙盘宽 / 36」为单位：dist≈42 看全图
  HS.DIST_UNIT = P.W / 36;

  /* ------------------------------------------------------------------ *
   * 补间
   * ------------------------------------------------------------------ */
  var tweens = [];
  HS.tween = function (o) {
    var tw = {
      t0: performance.now() + (o.delay || 0), dur: Math.max(1, o.dur || 600), ease: o.ease || U.easeInOutCubic,
      update: o.update, done: o.done, tag: o.tag || "", dead: false,
      kill: function () { this.dead = true; }
    };
    tweens.push(tw);
    return tw;
  };
  HS.tween.killTag = function (tag) { tweens.forEach(function (t) { if (t.tag === tag) t.dead = true; }); };
  function stepTweens(now) {
    for (var i = tweens.length - 1; i >= 0; i--) {
      var tw = tweens[i];
      if (tw.dead) { tweens.splice(i, 1); continue; }
      if (now < tw.t0) continue;
      var k = U.clamp((now - tw.t0) / tw.dur, 0, 1);
      tw.update && tw.update(tw.ease(k), k);
      if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
    }
  }

  /* ------------------------------------------------------------------ *
   * 事件总线
   * ------------------------------------------------------------------ */
  var bus = {};
  HS.on = function (name, fn) { (bus[name] = bus[name] || []).push(fn); };
  HS.emit = function (name, data) { (bus[name] || []).forEach(function (fn) { fn(data); }); };

  /* ------------------------------------------------------------------ *
   * 舞台
   * ------------------------------------------------------------------ */
  var S = (HS.stage = {
    renderer: null, scene: null, camera: null, controls: null, root: null,
    frameHooks: [], viewOffset: 0, viewOffsetTarget: 0, clock: 0
  });

  S.init = function (canvas) {
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setClearColor(0x000000, 0);
    // 保持线性输出：r147 的 Color 不做色彩空间转换，这样数据里的十六进制颜色与屏幕所见一致
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    S.renderer = r;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1514, 120, 320);
    S.scene = scene;

    var cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 500);
    cam.position.set(0, 90, 90);
    S.camera = cam;

    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true;
    oc.dampingFactor = 0.08;
    oc.rotateSpeed = 0.55;
    oc.zoomSpeed = 0.9;
    oc.panSpeed = 0.9;
    oc.screenSpacePanning = false;
    oc.minDistance = 10;
    oc.maxDistance = 190;
    oc.minPolarAngle = 6 * U.deg;
    oc.maxPolarAngle = 78 * U.deg;
    oc.autoRotateSpeed = 0.35;
    oc.addEventListener("start", function () { HS.camera.cancel(); HS.emit("user-interact", "orbit"); });
    oc.addEventListener("change", clampTarget);
    S.controls = oc;

    // 灯光：暖色主光 + 冷色补光 + 天光，模仿展柜顶灯
    var hemi = new THREE.HemisphereLight(0xe4ece2, 0x2a2418, 0.62);
    scene.add(hemi);
    var key = new THREE.DirectionalLight(0xffe7c4, 1.05);
    key.position.set(-46, 90, 38);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera;
    sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 260;
    key.shadow.bias = -0.0006;
    key.shadow.radius = 3;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9cc8d0, 0.32);
    fill.position.set(60, 40, -50);
    scene.add(fill);

    S.root = new THREE.Group();
    scene.add(S.root);

    window.addEventListener("resize", S.resize);
    S.resize();
    requestAnimationFrame(loop);
  };

  function clampTarget() {
    var t = S.controls.target;
    var hw = P.W / 2 + 4, hh = P.H / 2 + 4;
    t.x = U.clamp(t.x, -hw, hw);
    t.z = U.clamp(t.z, -hh, hh);
    t.y = 0;
  }

  S.resize = function () {
    var w = window.innerWidth, h = window.innerHeight;
    S.renderer.setSize(w, h, false);
    S.camera.aspect = w / h;
    applyViewOffset();
    S.camera.updateProjectionMatrix();
    HS.emit("resize", { w: w, h: h });
  };

  // 卡片打开时把画面中心左移（px），避免卡片遮住当前节点
  S.setViewOffset = function (px) { S.viewOffsetTarget = px; };
  function applyViewOffset() {
    var w = window.innerWidth, h = window.innerHeight;
    if (Math.abs(S.viewOffset) < 0.5) S.camera.clearViewOffset();
    else S.camera.setViewOffset(w, h, S.viewOffset, 0, w, h);
  }

  var last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.clock += dt;
    stepTweens(now);
    HS.camera.step(now);

    if (Math.abs(S.viewOffset - S.viewOffsetTarget) > 0.3) {
      S.viewOffset = U.lerp(S.viewOffset, S.viewOffsetTarget, 1 - Math.pow(0.0015, dt));
      applyViewOffset();
      S.camera.updateProjectionMatrix();
    } else if (S.viewOffset !== S.viewOffsetTarget) {
      S.viewOffset = S.viewOffsetTarget;
      applyViewOffset();
      S.camera.updateProjectionMatrix();
    }

    if (!HS.camera.flying) S.controls.update();

    // 雾随相机距离调整，让沙盘远端柔和地融进背景
    var d = S.camera.position.distanceTo(S.controls.target);
    S.scene.fog.near = d * 0.85;
    S.scene.fog.far = d * 2.4 + 40;

    for (var i = 0; i < S.frameHooks.length; i++) S.frameHooks[i](dt, S.clock);
    S.renderer.render(S.scene, S.camera);
    HS.labels.update();
  }

  /* ------------------------------------------------------------------ *
   * 相机：球坐标视角 + 飞行
   * view = { lon, lat, dist, az, polar }（dist 为数据单位，az/polar 为度）
   * ------------------------------------------------------------------ */
  var C = (HS.camera = { flying: false, _fly: null });

  C.current = function () {
    var cam = S.camera, t = S.controls.target;
    var off = cam.position.clone().sub(t);
    var d = off.length();
    return {
      target: t.clone(),
      dist: d,
      polar: Math.acos(U.clamp(off.y / d, -1, 1)),
      az: Math.atan2(off.x, off.z)
    };
  };

  C.resolve = function (v) {
    var target = v.lon != null && v.lat != null ? P.vec(v.lon, v.lat, 0) : new THREE.Vector3(0, 0, 0);
    return {
      target: target,
      dist: U.clamp((v.dist || 40) * HS.DIST_UNIT, S.controls.minDistance, S.controls.maxDistance),
      polar: U.clamp(v.polar == null ? 45 : v.polar, 12, 78) * U.deg,
      az: (v.az || 0) * U.deg
    };
  };

  function place(st) {
    var sp = Math.sin(st.polar);
    S.camera.position.set(
      st.target.x + st.dist * sp * Math.sin(st.az),
      st.target.y + st.dist * Math.cos(st.polar),
      st.target.z + st.dist * sp * Math.cos(st.az)
    );
    S.controls.target.copy(st.target);
    S.camera.lookAt(st.target);
  }

  C.set = function (v) { C.cancel(); place(C.resolve(v)); S.controls.update(); };

  C.flyTo = function (v, opts) {
    opts = opts || {};
    C.cancel();
    var a = C.current(), b = C.resolve(v);
    var travel = a.target.distanceTo(b.target);
    var dur = opts.dur || 900 + 500 * U.clamp(travel / 60 + Math.abs(a.dist - b.dist) / 160, 0, 1);
    // 先拉远再落下：抬升量随飞行距离增加
    var lift = opts.lift != null ? opts.lift : U.clamp(travel / (a.dist + b.dist + 1) * 0.9, 0, 0.45);
    return new Promise(function (resolve) {
      C.flying = true;
      S.controls.enabled = false;
      C._fly = { a: a, b: b, t0: performance.now(), dur: dur, lift: lift, resolve: resolve };
    });
  };

  C.step = function (now) {
    var f = C._fly;
    if (!f) return;
    var k = U.clamp((now - f.t0) / f.dur, 0, 1);
    var e = U.easeInOutCubic(k);
    var bump = Math.sin(Math.PI * e);
    place({
      target: f.a.target.clone().lerp(f.b.target, e),
      dist: U.lerp(f.a.dist, f.b.dist, e) * (1 + f.lift * bump),
      polar: U.lerp(f.a.polar, f.b.polar, e) - f.lift * 0.35 * bump,
      az: U.angleLerp(f.a.az, f.b.az, e)
    });
    if (k >= 1) finishFly(true);
  };

  function finishFly(ok) {
    var f = C._fly;
    if (!f) return;
    C._fly = null;
    C.flying = false;
    S.controls.enabled = true;
    S.controls.update();
    f.resolve(ok);
  }
  C.cancel = function () { finishFly(false); };

  /* ------------------------------------------------------------------ *
   * HTML 覆盖层标签
   * 每帧用 Vector3.project(camera) 更新位置；相机后方隐藏；按优先级做简单避让。
   * ------------------------------------------------------------------ */
  var L = (HS.labels = { root: null, items: [], layers: {}, _tmp: new THREE.Vector3(), _frame: 0 });

  L.init = function (root) { L.root = root; };

  // opt: { el, pos(Vector3), layer, priority, anchor: "center"|"bottom"|"left", scaleWithDist, onClick }
  L.add = function (opt) {
    var it = {
      el: opt.el, pos: opt.pos, layer: opt.layer || "misc", priority: opt.priority || 0,
      anchor: opt.anchor || "center", scaleWithDist: !!opt.scaleWithDist, w: 0, h: 0,
      x: 0, y: 0, onScreen: false, hidden: false, force: false
    };
    it.el.classList.add("lb");
    L.root.appendChild(it.el);
    L.items.push(it);
    return it;
  };

  L.clear = function () {
    L.items.forEach(function (it) { it.el.remove(); });
    L.items.length = 0;
  };

  L.setLayer = function (name, on) {
    L.layers[name] = on;
    L.items.forEach(function (it) { if (it.layer === name) it.el.classList.toggle("is-layer-off", !on); });
  };
  L.layerOn = function (name) { return L.layers[name] !== false; };

  L.project = function (v) {
    var p = L._tmp.copy(v).project(S.camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
      visible: p.z < 1 && p.z > -1
    };
  };

  L.update = function () {
    if (!L.root) return;
    var W = window.innerWidth, H = window.innerHeight;
    var dist = S.camera.position.distanceTo(S.controls.target);
    var distScale = U.clamp((60 * HS.DIST_UNIT) / dist, 0.55, 1.7);
    var items = L.items;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var p = L.project(it.pos);
      it.x = p.x; it.y = p.y;
      it.onScreen = p.visible && p.x > -200 && p.x < W + 200 && p.y > -100 && p.y < H + 100;
      if (!it.onScreen) { if (it.el.style.display !== "none") it.el.style.display = "none"; continue; }
      if (it.el.style.display === "none") it.el.style.display = "";
      var s = it.scaleWithDist ? distScale : 1;
      it.scale = s;
      it.el.style.transform = "translate3d(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0)" + (s !== 1 ? " scale(" + s.toFixed(3) + ")" : "");
    }
    if (++L._frame % 5 === 0) L.declutter();
  };

  // 简单避让：高优先级先占位，被压住的低优先级标签淡出
  L.declutter = function () {
    // 势力名是铺在沙盘上的大字，低透明度，不参与避让
    var list = L.items.filter(function (it) { return it.onScreen && it.layer !== "regions" && L.layerOn(it.layer); });
    list.sort(function (a, b) { return b.priority - a.priority; });
    var placed = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it.w) { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; }
      var s = it.scale || 1, w = it.w * s, h = it.h * s, x0, y0;
      if (it.anchor === "left") { x0 = it.x - 8; y0 = it.y - h / 2; }
      else if (it.anchor === "bottom") { x0 = it.x - w / 2; y0 = it.y - h; }
      else { x0 = it.x - w / 2; y0 = it.y - h / 2; }
      var r = { x0: x0 - 3, y0: y0 - 2, x1: x0 + w + 3, y1: y0 + h + 2 };
      var hit = false;
      if (!it.force) {
        for (var j = 0; j < placed.length; j++) {
          var q = placed[j];
          if (r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0) { hit = true; break; }
        }
      }
      if (hit !== it.hidden) { it.hidden = hit; it.el.classList.toggle("is-occluded", hit); }
      if (!hit) placed.push(r);
    }
  };
  L.remeasure = function () { L.items.forEach(function (it) { it.w = 0; }); };

  /* ------------------------------------------------------------------ *
   * 资源释放
   * ------------------------------------------------------------------ */
  HS.dispose = function (obj) {
    if (!obj) return;
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          for (var k in m) {
            var v = m[k];
            if (v && v.isTexture) v.dispose();
          }
          if (m.uniforms) {
            for (var u in m.uniforms) {
              var uv = m.uniforms[u] && m.uniforms[u].value;
              if (uv && uv.isTexture) uv.dispose();
            }
          }
          m.dispose();
        });
      }
    });
    if (obj.parent) obj.parent.remove(obj);
  };

  /* ------------------------------------------------------------------ *
   * 资源清单查询
   * ------------------------------------------------------------------ */
  HS.assets = {
    byPath: function (path) {
      var m = window.ASSET_MANIFEST;
      if (!m || !m.items || !path) return null;
      for (var i = 0; i < m.items.length; i++) if (m.items[i].path === path) return m.items[i];
      return null;
    },
    // 只有清单里不是 missing 的文件才去加载，避免 file:// 下产生 404 报错
    usable: function (path) {
      if (!path) return false;
      if (HS.params && HS.params.probeAssets) return true;
      var it = HS.assets.byPath(path);
      return !!it && it.status !== "missing";
    },
    status: function (path) { var it = HS.assets.byPath(path); return it ? it.status : "missing"; },
    // 预加载；成功回调 url，失败静默（不显示破图）
    load: function (path, ok, fail) {
      if (!HS.assets.usable(path)) { fail && fail(); return; }
      var img = new Image();
      img.onload = function () { ok && ok(path, img); };
      img.onerror = function () {
        console.warn("[史境] 图片未能加载，继续使用占位：", path);
        fail && fail();
      };
      img.src = path;
    }
  };
})();
