/*
 * route.js —— 路线曲线（累计弧长参数化）、生长 shader、事件节点标记与当前节点信标。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util, P = HS.proj;

  var INACTIVE_OPACITY = 0.22;

  /* 累计弧长参数化的折线曲线：getPoint(t) 中的 t 就是走过的路程比例 */
  class ArcPath extends THREE.Curve {
    constructor(samples) {
      super();
      this.samples = samples;
      this.cum = [0];
      for (var i = 1; i < samples.length; i++) this.cum.push(this.cum[i - 1] + samples[i].distanceTo(samples[i - 1]));
      this.total = this.cum[this.cum.length - 1] || 1;
    }
    getPoint(t, target) {
      target = target || new THREE.Vector3();
      var s = U.clamp(t, 0, 1) * this.total, cum = this.cum, lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] < s) lo = mid; else hi = mid; }
      var seg = cum[hi] - cum[lo] || 1;
      return target.copy(this.samples[lo]).lerp(this.samples[hi], (s - cum[lo]) / seg);
    }
  }

  var VERT = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "uniform vec3 uColor;",
    "uniform float uProgress, uTime, uOpacity, uGhost, uLen, uShadow;",
    "varying vec2 vUv;",
    "void main() {",
    "  float x = vUv.x;",
    "  float grown = 1.0 - step(uProgress, x);",
    "  float behind = max((uProgress - x) * uLen, 0.0);",
    "  float head = grown * exp(-behind * 0.8);",
    "  float flow = 0.5 + 0.5 * sin(x * uLen * 1.1 - uTime * 4.5);",
    "  float rim = 0.6 + 0.4 * abs(sin(vUv.y * 3.14159));",
    "  vec3 col = uColor * (0.82 + 0.28 * flow) * rim + vec3(1.0, 0.93, 0.78) * head * 0.9;",
    "  float a = grown * uOpacity;",
    "  float dash = step(0.5, fract(x * uLen * 0.42 - uTime * 0.35));",
    "  float ga = (1.0 - grown) * uGhost * dash * uOpacity;",
    "  if (uShadow > 0.5) { col = vec3(0.16, 0.11, 0.06); a = grown * uOpacity * 0.42; ga = 0.0; }",
    "  float alpha = max(a, ga);",
    "  if (alpha < 0.01) discard;",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  function routeMaterial(color, len, shadow) {
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(color) }, uProgress: { value: 1 }, uTime: { value: 0 },
        uOpacity: { value: INACTIVE_OPACITY }, uGhost: { value: 0 }, uLen: { value: len }, uShadow: { value: shadow ? 1 : 0 }
      }
    });
  }

  function near(a, b, eps) { return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps; }

  HS.buildRoutes = function (theme, mapApi) {
    var group = new THREE.Group();
    group.name = "routes:" + theme.meta.id;
    var routeGroup = new THREE.Group(), eventGroup = new THREE.Group();
    group.add(routeGroup, eventGroup);
    var api = { group: group, routes: {}, order: [], active: null, markers: [], labels: [], layers: { routes: [routeGroup], events: [eventGroup] } };
    var glow = HS.glowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)");
    var accent = theme.meta.accent || "#c8402f";

    /* ---- 路线 ---- */
    (theme.routes || []).forEach(function (rt) {
      var nodes = (rt.nodes || []).filter(function (n) { return isFinite(n.lon) && isFinite(n.lat); });
      if (nodes.length < 2) { console.warn("[史境] 路线节点不足 2 个，已跳过：", rt.id); return; }
      var pts = nodes.map(function (n) { return P.vec(n.lon, n.lat, 0); });
      // 避免零长度段
      for (var i = 1; i < pts.length; i++) if (pts[i].distanceTo(pts[i - 1]) < 0.06) pts[i].x += 0.08;
      var cr = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      var segs = pts.length - 1, per = 48, samples = [], segStart = [];
      for (var s = 0; s < segs; s++) {
        segStart.push(samples.length);
        var chord = pts[s].distanceTo(pts[s + 1]);
        var hSeg = U.clamp(chord * 0.14, 0.12, 4);
        for (var k = 0; k < per; k++) {
          var f = k / per, v = cr.getPoint((s + f) / segs);
          v.y = 0.32 + hSeg * Math.sin(Math.PI * f);
          samples.push(v);
        }
      }
      var end = pts[pts.length - 1].clone();
      end.y = 0.32;
      samples.push(end);
      segStart.push(samples.length - 1);

      var path = new ArcPath(samples);
      var nodeT = {};
      nodes.forEach(function (n, idx) { if (nodeT[n.id] == null) nodeT[n.id] = path.cum[segStart[idx]] / path.total; });

      var tubeMat = routeMaterial(rt.color || accent, path.total, false);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(path, U.clamp(Math.round(path.total * 5), 60, 1500), 0.17, 8, false), tubeMat);
      tube.renderOrder = 20;
      routeGroup.add(tube);

      // 投在沙面上的影子，弧长比例与管道保持一致
      var flat = samples.map(function (v) { return { x: v.x, z: v.z }; });
      var sgeo = HS.ribbon(flat, 0.2, false, 0.06);
      var uv = sgeo.getAttribute("uv");
      for (i = 0; i < samples.length; i++) { uv.setX(i * 2, path.cum[i] / path.total); uv.setX(i * 2 + 1, path.cum[i] / path.total); }
      uv.needsUpdate = true;
      var shadowMat = routeMaterial("#000", path.total, true);
      var shadow = new THREE.Mesh(sgeo, shadowMat);
      shadow.renderOrder = 6;
      routeGroup.add(shadow);

      var head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(rt.color || accent), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      head.scale.set(3.4, 3.4, 1);
      head.renderOrder = 22;
      head.visible = false;
      var headCore = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff4dc }));
      head.add(headCore);
      headCore.scale.set(1 / 3.4, 1 / 3.4, 1);
      routeGroup.add(head);

      var R = {
        data: rt, path: path, nodeT: nodeT, tube: tube, shadow: shadow, head: head,
        mats: [tubeMat, shadowMat], progress: 1, op: INACTIVE_OPACITY, opTarget: INACTIVE_OPACITY, ghost: 0, tw: null
      };
      api.routes[rt.id] = R;
      api.order.push(rt.id);
    });

    api.nodeT = function (routeId, nodeId) {
      var R = api.routes[routeId];
      if (!R || R.nodeT[nodeId] == null) return null;
      return R.nodeT[nodeId];
    };
    api.nodeOf = function (routeId, nodeId) {
      var R = api.routes[routeId];
      if (!R) return null;
      for (var i = 0; i < R.data.nodes.length; i++) if (R.data.nodes[i].id === nodeId) return R.data.nodes[i];
      return null;
    };

    /* ---- 事件节点：按位置合并（共享节点只绑定第一个事件，编号可单独点击） ---- */
    var events = (theme.events || []).slice().sort(function (a, b) { return a.order - b.order; });
    var groups = [];
    events.forEach(function (ev) {
      var node = api.nodeOf(ev.routeId, ev.nodeId);
      var at = node ? [node.lon, node.lat] : [ev.lon, ev.lat];
      if (!isFinite(at[0]) || !isFinite(at[1])) return;
      var g = null;
      for (var i = 0; i < groups.length; i++) if (near(groups[i].at, at, 0.14)) { g = groups[i]; break; }
      if (!g) {
        g = { at: at, events: [], name: node ? node.name : String(ev.place || "").split(/[（(，,]/)[0], color: (api.routes[ev.routeId] && api.routes[ev.routeId].data.color) || accent };
        groups.push(g);
      }
      g.events.push(ev);
    });

    var discGeo = new THREE.CircleGeometry(0.5, 24);
    discGeo.rotateX(-Math.PI / 2);
    var ringGeo = new THREE.RingGeometry(0.62, 0.78, 32);
    ringGeo.rotateX(-Math.PI / 2);
    groups.forEach(function (g) {
      var pos = P.vec(g.at[0], g.at[1], 0.11);
      var disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(g.color), transparent: true, opacity: 0.85, depthWrite: false }));
      disc.position.copy(pos);
      disc.renderOrder = 8;
      var ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf4ead2, transparent: true, opacity: 0.7, depthWrite: false }));
      ring.position.copy(pos);
      ring.renderOrder = 8;
      eventGroup.add(disc, ring);

      var nos = g.events.map(function (ev) {
        return "<b data-ev='" + U.esc(ev.id) + "' title='" + U.esc(ev.title) + "'>" + ev.order + "</b>";
      }).join("");
      var el = U.el("div", "lb-mark",
        "<div class='lb-in'><span class='mk-pin'></span><span class='mk-name'>" + U.esc(g.name) + "</span>" +
        "<span class='mk-nos'>" + nos + "</span><span class='mk-title'></span></div>");
      el.addEventListener("click", function (e) {
        var b = e.target.closest("b[data-ev]");
        HS.emit("pick-event", b ? b.getAttribute("data-ev") : g.events[0].id);
        e.stopPropagation();
      });
      g.item = HS.labels.add({ el: el, pos: P.vec(g.at[0], g.at[1], 0.4), layer: "events", priority: 10, anchor: "left" });
      g.el = el;
      g.disc = disc;
      api.labels.push(g.item);
    });
    api.markers = groups;

    /* ---- 途经点（无事件的路线节点） ---- */
    var placePts = (mapApi && mapApi.placePoints) || [];
    var wayTaken = groups.map(function (g) { return g.at; });
    var dotGeo = new THREE.CircleGeometry(0.28, 16);
    dotGeo.rotateX(-Math.PI / 2);
    api.order.forEach(function (id) {
      var R = api.routes[id];
      R.data.nodes.forEach(function (n) {
        var at = [n.lon, n.lat];
        if (wayTaken.some(function (t) { return near(t, at, 0.14); })) return;
        wayTaken.push(at);
        var dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(R.data.color || accent), transparent: true, opacity: 0.8, depthWrite: false }));
        dot.position.copy(P.vec(n.lon, n.lat, 0.1));
        dot.renderOrder = 7;
        routeGroup.add(dot);
        if (n.label === false || placePts.some(function (t) { return near(t, at, 0.14); })) return;
        var el = U.el("div", "lb-way", "<div class='lb-in'><i></i><span>" + U.esc(n.name) + "</span></div>");
        api.labels.push(HS.labels.add({ el: el, pos: P.vec(n.lon, n.lat, 0.3), layer: "routes", priority: 4, anchor: "left" }));
      });
    });

    /* ---- 当前节点信标 ---- */
    var beacon = new THREE.Group();
    var bRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    bRing.rotation.x = -Math.PI / 2;
    bRing.position.y = 0.14;
    var bc = document.createElement("canvas");
    bc.width = 4; bc.height = 128;
    var bg = bc.getContext("2d"), grd = bg.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, "rgba(255,255,255,0)");
    grd.addColorStop(1, "rgba(255,255,255,0.85)");
    bg.fillStyle = grd;
    bg.fillRect(0, 0, 4, 128);
    var beamTex = new THREE.CanvasTexture(bc);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.32, 7, 12, 1, true),
      new THREE.MeshBasicMaterial({ map: beamTex, color: new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.35), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.y = 3.6;
    beacon.add(bRing, beam);
    beacon.visible = false;
    eventGroup.add(beacon);

    /* ---- 状态切换 ---- */
    function fade(R, target, dur, done) {
      HS.tween({ dur: dur, tag: "route", ease: U.easeOutCubic,
        update: (function (from) { return function (e) { R.op = U.lerp(from, target, e); }; })(R.op),
        done: done });
      R.opTarget = target;
    }

    // 激活某条路线并把进度推进到 t；返回动画时长（ms）
    api.go = function (routeId, t, opts) {
      opts = opts || {};
      var R = api.routes[routeId];
      if (!R) return 0;
      if (R.tw) R.tw.kill();
      var from, dur;
      if (api.active === routeId) {
        from = R.progress;
        var d = Math.abs(t - from);
        dur = d < 0.001 ? 0 : U.clamp(800 + d * 900, 800, 1200);
      } else {
        var old = api.routes[api.active];
        if (old) {
          if (old.tw) old.tw.kill();
          old.ghost = 0;
          fade(old, 0, 260, function () { old.progress = 1; fade(old, INACTIVE_OPACITY, 420); });
        }
        api.active = routeId;
        R.op = 1;
        R.opTarget = 1;
        R.ghost = 0.45;
        from = 0;
        dur = t < 0.001 ? 0 : U.clamp(900 + t * 1100, 900, 1800);
      }
      if (opts.instant) dur = 0;
      if (dur === 0) { R.progress = t; return 0; }
      R.progress = from;
      R.tw = HS.tween({ dur: dur, tag: "route", ease: U.easeInOutCubic,
        update: function (e) { R.progress = U.lerp(from, t, e); HS.emit("route-step", R.progress); } });
      return dur;
    };

    api.state = function () {
      var R = api.routes[api.active];
      return { routeId: api.active || "", progress: R ? +R.progress.toFixed(4) : 0 };
    };

    api.setCurrent = function (ev) {
      var cur = ev ? ev.order : -1;
      groups.forEach(function (g) {
        var has = ev && g.events.indexOf(ev) >= 0;
        g.el.classList.toggle("is-current", !!has);
        g.el.classList.toggle("is-visited", !has && g.events.some(function (e) { return e.order < cur; }));
        g.item.force = !!has;
        g.item.priority = has ? 20 : 10;
        g.el.querySelector(".mk-title").textContent = has ? ev.title : "";
        g.item.w = 0;
        g.el.querySelectorAll("b[data-ev]").forEach(function (b) {
          var e = g.events.filter(function (x) { return x.id === b.getAttribute("data-ev"); })[0];
          b.classList.toggle("is-cur", !!(ev && e === ev));
          b.classList.toggle("is-done", !!(ev && e.order < cur));
        });
        if (has) { beacon.position.set(P.x(g.at[0]), 0, P.z(g.at[1])); beacon.visible = true; }
      });
      if (!ev) beacon.visible = false;
    };

    api.update = function (dt, t) {
      api.order.forEach(function (id) {
        var R = api.routes[id];
        R.mats.forEach(function (m) {
          m.uniforms.uProgress.value = R.progress >= 0.9999 ? 1.001 : R.progress;
          m.uniforms.uTime.value = t;
          m.uniforms.uOpacity.value = R.op;
          m.uniforms.uGhost.value = R.ghost;
        });
        R.head.visible = id === api.active && R.progress > 0.002;
        if (R.head.visible) {
          R.path.getPoint(Math.min(R.progress, 1), R.head.position);
          var s = 3 + Math.sin(t * 5) * 0.4;
          R.head.scale.set(s, s, 1);
        }
      });
      var pulse = (t * 0.8) % 1;
      bRing.scale.setScalar(1 + pulse * 1.6);
      bRing.material.opacity = 0.85 * (1 - pulse);
      beam.material.opacity = 0.55 + 0.2 * Math.sin(t * 2.4);
    };

    api.setLayer = function (name, on) { (api.layers[name] || []).forEach(function (o) { o.visible = on; }); };

    api.dispose = function () {
      HS.tween.killTag("route");
      discGeo.dispose(); ringGeo.dispose(); dotGeo.dispose(); glow.dispose(); beamTex.dispose();
      HS.dispose(group);
    };

    return api;
  };
})();
