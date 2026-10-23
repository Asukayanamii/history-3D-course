/*
 * scene.js —— 3D 场景：war 兵棋推演（省份/战线/兵力/自动战斗）+ battlefield 兼容。
 * 独立 canvas + renderer，不干扰主沙盘；进入时暂停地图控制，退出时恢复。
 * 视觉全部由 Three.js 基础几何体 + Canvas 纹理生成，无外部图片。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util;
  var S = (HS.scene = {
    active: false, playing: false, t: 0, data: null, event: null,
    renderer: null, scene: null, camera: null, controls: null, root: null,
    raf: 0, last: 0, fx: [], clashDone: false, _resizeBound: false,
    speed: 1, war: null, warAcc: 0
  });

  var canvas = null, view = null, DPR = 1;

  function init() {
    if (S.renderer) return;
    canvas = document.getElementById("sceneCanvas");
    view = document.getElementById("sceneView");
    if (!canvas || !view) throw new Error("scene canvas missing");
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setClearColor(0x07100e, 1);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    S.renderer = r;
    if (!S._resizeBound) {
      S._resizeBound = true;
      window.addEventListener("resize", resize);
    }
  }

  function applyViewOffset() {
    if (!S.camera) return;
    var w = window.innerWidth, h = window.innerHeight;
    var panel = document.getElementById("scenePanel");
    var off = panel && w > 900 ? Math.min(panel.offsetWidth, 380) * 0.5 : 0;
    if (off > 1) S.camera.setViewOffset(w, h, off, 0, w, h);
    else S.camera.clearViewOffset();
    S.camera.updateProjectionMatrix();
  }

  function resize() {
    if (!S.renderer || !S.camera) return;
    var w = window.innerWidth, h = window.innerHeight;
    S.renderer.setSize(w, h, false);
    S.camera.aspect = w / h;
    applyViewOffset();
  }

  function groundTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 512;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(256, 236, 40, 256, 256, 300);
    g.addColorStop(0, "#8b7650");
    g.addColorStop(0.55, "#6f5c3d");
    g.addColorStop(1, "#4b3d2b");
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    // 沙粒
    var seed = U.rng(1907);
    for (var i = 0; i < 9000; i++) {
      var a = seed() * Math.PI * 2, r = Math.sqrt(seed()) * 250;
      var px = 256 + Math.cos(a) * r, py = 256 + Math.sin(a) * r;
      var v = 30 + seed() * 70;
      x.fillStyle = "rgba(" + (v + 30) + "," + (v + 10) + "," + v + "," + (0.05 + seed() * 0.12) + ")";
      x.fillRect(px, py, 1 + seed() * 2, 1 + seed() * 2);
    }
    // 等高线
    x.strokeStyle = "rgba(220,200,160,.12)";
    x.lineWidth = 1;
    for (var k = 0; k < 14; k++) {
      x.beginPath();
      var rr = 30 + k * 17;
      for (var t = 0; t <= 64; t++) {
        var aa = (t / 64) * Math.PI * 2;
        var wob = 1 + 0.04 * Math.sin(aa * 5 + k * 1.7) + 0.03 * Math.cos(aa * 9 - k);
        var xx = 256 + Math.cos(aa) * rr * wob, yy = 256 + Math.sin(aa) * rr * wob;
        if (t === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      x.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = S.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  function build(data) {
    // 释放上一场
    teardown();

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07100e);
    scene.fog = new THREE.Fog(0x07100e, 62, 150);
    S.scene = scene;

    var cam = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
    var c = data.camera || {};
    var dist = Math.max(12, Math.min(80, c.dist || 34));
    var polar = (c.polar == null ? 58 : c.polar) * U.deg;
    var az = (c.az == null ? 35 : c.az) * U.deg;
    cam.position.set(dist * Math.sin(polar) * Math.sin(az), dist * Math.cos(polar), dist * Math.sin(polar) * Math.cos(az));
    cam.lookAt(0, 0, 0);
    S.camera = cam;

    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true;
    oc.dampingFactor = 0.08;
    oc.enablePan = false;
    oc.rotateSpeed = 0.5;
    oc.zoomSpeed = 0.8;
    oc.minDistance = 12;
    oc.maxDistance = 85;
    oc.minPolarAngle = 16 * U.deg;
    oc.maxPolarAngle = 78 * U.deg;
    oc.autoRotate = true;
    oc.autoRotateSpeed = 0.22;
    oc.addEventListener("start", function () { oc.autoRotate = false; });
    S.controls = oc;

    var root = new THREE.Group();
    S.root = root;
    scene.add(root);

    // 灯光：顶灯 + 冷补光
    scene.add(new THREE.HemisphereLight(0xd8e8d8, 0x2a1d12, 0.72));
    var key = new THREE.DirectionalLight(0xffe0b0, 1.35);
    key.position.set(-34, 52, 26);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera;
    sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 160;
    key.shadow.bias = -0.0006;
    key.shadow.radius = 4;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x8fc8d4, 0.38);
    fill.position.set(40, 26, -34);
    scene.add(fill);

    // 圆形沙盘
    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(46, 80),
      new THREE.MeshStandardMaterial({ map: groundTexture(), color: 0xffffff, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(46, 0.38, 8, 96),
      new THREE.MeshStandardMaterial({ color: 0xc9a865, roughness: 0.55, metalness: 0.25 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    root.add(rim);

    // 低多边形山脊
    var hillMats = [
      new THREE.MeshStandardMaterial({ color: 0x3f5b4d, roughness: 1, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x4f6049, roughness: 1, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x5d634c, roughness: 1, flatShading: true })
    ];
    var rng = U.rng(954);
    for (var i = 0; i < 26; i++) {
      var a = rng() * Math.PI * 2;
      var rad = 32 + rng() * 12;
      var h = 2.5 + rng() * 6;
      var cone = new THREE.Mesh(new THREE.ConeGeometry(1.8 + rng() * 3.4, h, 5), hillMats[i % 3]);
      cone.position.set(Math.cos(a) * rad, h / 2 - 0.1, Math.sin(a) * rad);
      cone.rotation.y = rng() * Math.PI;
      cone.castShadow = true;
      cone.receiveShadow = true;
      root.add(cone);
    }

    // 中央战场地面标记
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(8.4, 8.7, 64),
      new THREE.MeshBasicMaterial({ color: 0xc9a865, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    root.add(ring);

    // 单位
    (data.units || []).forEach(function (u, idx) {
      root.add(makeUnit(u, idx));
    });

    // 战况粒子容器
    S.fx = [];

    resize();
    if (S.controls) S.controls.update();
  }

  function ease(t) { return U.easeInOutCubic(U.clamp(t, 0, 1)); }

  function posAt(u, t) {
    var sx = u.start ? u.start[0] : 0, sz = u.start ? u.start[1] : 0;
    var mx = u.moveTo ? u.moveTo[0] : sx, mz = u.moveTo ? u.moveTo[1] : sz;
    var rx = u.retreatTo ? u.retreatTo[0] : mx, rz = u.retreatTo ? u.retreatTo[1] : mz;
    var ma = u.moveAt == null ? 0.1 : u.moveAt, md = u.moveDur == null ? 0.4 : u.moveDur;
    if (t < ma) return [sx, sz];
    if (t < ma + md) {
      var k = ease((t - ma) / md);
      return [U.lerp(sx, mx, k), U.lerp(sz, mz, k)];
    }
    var ra = u.retreatAt == null ? 0.9 : u.retreatAt, rd = u.retreatDur == null ? 0.1 : u.retreatDur;
    if (t < ra) return [mx, mz];
    if (t < ra + rd) {
      var k2 = ease((t - ra) / rd);
      return [U.lerp(mx, rx, k2), U.lerp(mz, rz, k2)];
    }
    return [rx, rz];
  }

  function makeUnit(u, idx) {
    var group = new THREE.Group();
    var count = Math.max(12, u.count || 40);
    var color = new THREE.Color(u.color || "#c8402f").getHex();
    var isCav = u.formation === "cavalry";
    var spacing = isCav ? 1.05 : 0.62;
    var cols = Math.ceil(Math.sqrt(count * (isCav ? 0.8 : 1.25)));
    var rows = Math.ceil(count / cols);
    var bodyGeo = new THREE.BoxGeometry(isCav ? 0.42 : 0.2, isCav ? 0.38 : 0.52, isCav ? 0.86 : 0.22);
    var headGeo = new THREE.SphereGeometry(isCav ? 0.11 : 0.1, 6, 4);
    var bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9, flatShading: true });
    var headMat = new THREE.MeshStandardMaterial({ color: 0xd9c8a5, roughness: 0.95 });
    var body = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
    var head = new THREE.InstancedMesh(headGeo, headMat, count);
    body.castShadow = true; body.receiveShadow = true;
    head.castShadow = true;
    var m = new THREE.Matrix4();
    var n = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols && n < count; c++, n++) {
        var x = (c - (cols - 1) / 2) * spacing;
        var z = (r - (rows - 1) / 2) * spacing;
        m.makeTranslation(x, isCav ? 0.32 : 0.3, z);
        body.setMatrixAt(n, m);
        m.makeTranslation(x, isCav ? 0.62 : 0.64, z);
        head.setMatrixAt(n, m);
      }
    }
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    group.add(body, head);

    // 军旗
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 3.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4e2e, roughness: 0.9 })
    );
    pole.position.set(0, 1.9, 0);
    pole.castShadow = true;
    group.add(pole);
    var flagMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9, side: THREE.DoubleSide });
    var flag = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.95, 6, 1), flagMat);
    flag.position.set(0.9, 3.25, 0);
    flag.castShadow = true;
    group.add(flag);
    var finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xd8b56a, roughness: 0.35, metalness: 0.45 })
    );
    finial.position.set(0, 3.86, 0);
    group.add(finial);

    // 地面阴影圈
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(isCav ? 3.4 : 2.8, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);

    group.userData = { u: u, flag: flag, body: body, head: head, idx: idx };
    group.rotation.y = (u.facing == null ? 0 : u.facing) * U.deg;
    var p = posAt(u, 0);
    group.position.set(p[0], 0, p[1]);
    return group;
  }

  function spawnClash() {
    if (!S.scene) return;
    var count = 140;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var vel = [];
    var rng = U.rng(954045);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * 1.2;
      pos[i * 3 + 1] = 0.5 + rng() * 1.5;
      pos[i * 3 + 2] = (rng() - 0.5) * 1.2;
      var a = rng() * Math.PI * 2, s = 0.4 + rng() * 2.2;
      vel.push([Math.cos(a) * s, 0.3 + rng() * 2.4, Math.sin(a) * s]);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffd28a, size: 0.13, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(geo, mat);
    pts.position.set(0, 0.2, 0);
    S.scene.add(pts);
    S.fx.push({ mesh: pts, vel: vel, age: 0, life: 3.2, base: pos.slice(0) });
  }

  function updateFx(dt) {
    for (var i = S.fx.length - 1; i >= 0; i--) {
      var f = S.fx[i];
      f.age += dt;
      var k = f.age / f.life;
      if (k >= 1) {
        S.scene.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
        S.fx.splice(i, 1);
        continue;
      }
      var p = f.mesh.geometry.attributes.position;
      for (var j = 0; j < f.vel.length; j++) {
        p.array[j * 3] = f.base[j * 3] + f.vel[j][0] * f.age;
        p.array[j * 3 + 1] = f.base[j * 3 + 1] + f.vel[j][1] * f.age - 0.35 * f.age * f.age;
        p.array[j * 3 + 2] = f.base[j * 3 + 2] + f.vel[j][2] * f.age;
      }
      p.needsUpdate = true;
      f.mesh.material.opacity = 0.85 * (1 - k);
    }
  }

  function updateUnits(t) {
    if (!S.root) return;
    S.root.children.forEach(function (g) {
      if (!g.userData || !g.userData.u) return;
      var u = g.userData.u;
      var p = posAt(u, t);
      g.position.set(p[0], 0, p[1]);
      var f = g.userData.flag;
      if (f) {
        f.rotation.y = Math.sin(t * 11 + (g.userData.idx || 0) * 1.7) * 0.18;
        f.rotation.z = Math.sin(t * 7 + (g.userData.idx || 0)) * 0.05;
      }
    });
  }

  function phaseAt(t) {
    var phases = (S.data && S.data.phases) || [];
    var label = "战况";
    for (var i = 0; i < phases.length; i++) if (t >= phases[i].at) label = phases[i].label;
    return label;
  }

  /* ================================================================== *
   *  WAR · 轻量兵棋：省份控制 + 单位兵力/士气 + 自动战斗 + 派生战线
   * ================================================================== */
  function sideOf(war, id) {
    return war.sides[id] || { id: id, name: id, color: "#888888", short: id };
  }
  function sideColor(war, id) { return sideOf(war, id).color; }
  function coalition(id) { return id === "liao" ? "beihan" : id; }
  function sameCoalition(a, b) { return coalition(a) === coalition(b); }
  function clamp100(v) { return U.clamp(v, 0, 100); }
  function polyCenter(poly) {
    var x = 0, z = 0;
    poly.forEach(function (p) { x += p[0]; z += p[1]; });
    return [x / poly.length, z / poly.length];
  }
  function curveFromPoints(pts) {
    return pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function makeLabelSprite(text, color) {
    var c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    var x = c.getContext("2d");
    x.clearRect(0, 0, 256, 128);
    x.font = "600 44px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "rgba(0,0,0,.55)";
    x.fillText(text, 128, 66);
    x.fillStyle = color || "#f3e9d2";
    x.fillText(text, 128, 62);
    var tex = new THREE.CanvasTexture(c);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    var sp = new THREE.Sprite(mat);
    sp.scale.set(8, 4, 1);
    sp.renderOrder = 8;
    return sp;
  }
  function drawUnitCard(u, side) {
    var c = u.canvas, x = u.ctx, W = c.width, H = c.height;
    x.clearRect(0, 0, W, H);
    x.fillStyle = "rgba(5,13,11,.92)";
    roundRect(x, 4, 4, W - 8, H - 8, 16); x.fill();
    x.fillStyle = side.color;
    x.fillRect(4, 4, 12, H - 8);
    x.fillStyle = "#f3e9d2";
    x.font = "700 34px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.fillText(side.short, 26, 46);
    x.font = "600 20px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.fillText(u.name, 78, 38);
    x.font = "16px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.fillStyle = "#b8b4a4";
    x.fillText(u.status || "待命", 78, 64);
    function bar(y, v, color, label) {
      x.fillStyle = "rgba(255,255,255,.12)";
      roundRect(x, 78, y, 150, 8, 4); x.fill();
      x.fillStyle = color;
      roundRect(x, 78, y, Math.max(3, 150 * U.clamp(v, 0, 1)), 8, 4); x.fill();
      x.fillStyle = "#b8b4a4";
      x.font = "13px 'Microsoft YaHei', sans-serif";
      x.fillText(label, 22, y + 8);
    }
    bar(80, u.strength / 100, "#e07a5f", "兵");
    bar(100, u.morale / 100, "#8cc3b1", "气");
    u.texture.needsUpdate = true;
  }
  function warLog(war, msg, kind, phaseIndex) {
    if (!msg || war.logSet[msg]) return;
    war.logSet[msg] = true;
    war.log.push({ msg: msg, kind: kind || "info", phase: phaseIndex });
    if (HS.ui && HS.ui.appendWarLog) HS.ui.appendWarLog(msg, kind || "info", phaseIndex);
  }
  function warReset(data) {
    var war = {
      data: data, time: 0, acc: 0, speed: 1, phaseIndex: -1,
      sides: {}, sideMods: {}, provinces: {}, provinceList: [],
      units: [], unitSprites: [], unitGroup: null, routeGroup: null,
      frontGroup: null, battleGroup: null, routeObjs: [], battles: [],
      log: [], logSet: {}, rng: U.rng(data.seed || 1), lastUI: -1,
      raycaster: null, pointer: null, listeners: null, stats: null,
      terrain: null, provinceMesh: null, provinceCanvas: null, provinceCtx: null,
      provinceTexture: null, mapDirty: false,
      moveTime: data.moveTime || 1.4
    };
    (data.sides || []).forEach(function (s) {
      war.sides[s.id] = s;
      war.sideMods[s.id] = { attack: 1 };
    });
    (data.map.provinces || []).forEach(function (p) {
      var c = polyCenter(p.polygon);
      var st = {
        def: p, id: p.id, owner: p.owner, cx: c[0], cz: c[1],
        fill: null, border: null, label: null, targetColor: new THREE.Color(sideColor(war, p.owner)),
        engaged: false
      };
      war.provinces[p.id] = st;
      war.provinceList.push(st);
    });
    war.initialStrength = {};
    (data.units || []).forEach(function (u) {
      war.initialStrength[u.side] = (war.initialStrength[u.side] || 0) + u.strength;
    });
    (data.units || []).forEach(function (u, i) {
      war.units.push({
        def: u, id: u.id, name: u.name, side: u.side, type: u.type,
        provinceId: u.provinceId, strength: u.strength, morale: u.morale,
        attack: u.attack, defense: u.defense, speed: u.speed || 1,
        orderIndex: -1, target: null, moving: false, moveT: 0,
        status: "待命", routed: false, index: i, sprite: null,
        canvas: null, ctx: null, texture: null, lastDraw: -1
      });
    });
    S.war = war;
    war.speed = S.speed || 1;
    return war;
  }
  function warBuildRoutes(war) {
    var group = new THREE.Group();
    war.routeGroup = group;
    S.root.add(group);
    war.units.forEach(function (u) {
      var prev = u.def.provinceId;
      (u.def.orders || []).forEach(function (o, i) {
        var from = war.provinces[prev], to = war.provinces[o.to];
        var next = u.def.orders[i + 1];
        if (from && to && from.id !== to.id) {
          var g = new THREE.Group();
          var p1 = new THREE.Vector3(from.cx, warHeight(war, from.cx, from.cz) + 1.2, from.cz);
          var p2 = new THREE.Vector3(to.cx, warHeight(war, to.cx, to.cz) + 1.2, to.cz);
          var retreat = o.type === "retreat";
          var color = retreat ? "#9fb3c9" : sideColor(war, u.side);
          if (retreat) {
            var mid = p1.clone().lerp(p2, 0.5); mid.y = Math.max(p1.y, p2.y) + 1.2;
            var lineGeo = new THREE.BufferGeometry().setFromPoints([p1, mid, p2]);
            var line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({
              color: color, dashSize: 1.0, gapSize: 0.7, transparent: true, opacity: 0.8
            }));
            line.computeLineDistances();
            g.add(line);
          } else {
            var mid2 = p1.clone().lerp(p2, 0.5); mid2.y = Math.max(p1.y, p2.y) + 2.2;
            var curve = new THREE.CatmullRomCurve3([p1, mid2, p2]);
            var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.2, 5, false),
              new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.92 }));
            g.add(tube);
            var dir = p2.clone().sub(p1).normalize();
            var cone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.6, 8),
              new THREE.MeshBasicMaterial({ color: color }));
            cone.position.copy(p2).sub(dir.clone().multiplyScalar(0.35));
            cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            g.add(cone);
          }
          g.visible = false;
          group.add(g);
          war.routeObjs.push({ group: g, start: o.at, end: next ? next.at : 1, unit: u, type: o.type });
        }
        prev = o.to;
      });
    });
  }
  function warRebuildFront(war) {
    if (!war.frontGroup) return;
    while (war.frontGroup.children.length) {
      var c = war.frontGroup.children[war.frontGroup.children.length - 1];
      HS.dispose(c);
    }
    (war.data.map.borders || []).forEach(function (b) {
      var A = war.provinces[b.a], B = war.provinces[b.b];
      if (!A || !B || sameCoalition(A.owner, B.owner)) return;
      var pts = b.points.map(function (p) { return new THREE.Vector3(p[0], warHeight(war, p[0], p[1]) + 0.3, p[1]); });
      var curve = curveFromPoints(pts);
      var core = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.14, 4, false),
        new THREE.MeshBasicMaterial({ color: 0xf0c36a, transparent: true, opacity: 0.95 }));
      var glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.46, 4, false),
        new THREE.MeshBasicMaterial({ color: 0xf0c36a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      war.frontGroup.add(core, glow);
    });
    war.frontGroup.visible = war.frontGroup.children.length > 0 && (!war.frontGroup.userData || war.frontGroup.userData.on !== false);
  }
  function warUnitPos(war, u) {
    var p = war.provinces[u.provinceId], q = u.target ? war.provinces[u.target] : p;
    if (!p) return new THREE.Vector3(0, 3, 0);
    var k = u.moving ? U.easeInOutCubic(U.clamp(u.moveT, 0, 1)) : 0;
    var x = U.lerp(p.cx, q.cx, k);
    var z = U.lerp(p.cz, q.cz, k);
    var ox = ((u.index % 3) - 1) * 8.0;
    var oz = ((Math.floor(u.index / 3) % 3) - 1) * 4.2;
    var px = x + ox, pz = z + oz;
    return new THREE.Vector3(px, warHeight(war, px, pz), pz);
  }
  /* ================================================================== *
   * 真实地形纹理 / 省份覆盖层
   * ================================================================== */
  function warCanvasPoint(T, x, z, cw, ch) {
    return {
      x: ((x + T.width / 2) / T.width) * cw,
      y: ((T.depth / 2 - z) / T.depth) * ch
    };
  }

  function warTerrainTexture(T) {
    var gw = 240, gh = Math.max(2, Math.round((gw * T.depth) / T.width));
    var field = new Float32Array((gw + 1) * (gh + 1));
    var meters = new Float32Array((gw + 1) * (gh + 1));
    for (var j = 0; j <= gh; j++) {
      var z = T.depth / 2 - (j / gh) * T.depth;
      for (var i = 0; i <= gw; i++) {
        var x = -T.width / 2 + (i / gw) * T.width;
        var o = j * (gw + 1) + i;
        field[o] = T.heightAtXZ(x, z);
        var ll = T.toLonLat(x, z);
        meters[o] = T.heightMeters(ll.lon, ll.lat);
      }
    }
    var small = document.createElement("canvas");
    small.width = gw + 1; small.height = gh + 1;
    var sg = small.getContext("2d");
    var img = sg.createImageData(gw + 1, gh + 1);
    for (j = 0; j <= gh; j++) for (i = 0; i <= gw; i++) {
      o = j * (gw + 1) + i;
      var m = meters[o];
      var c = m < 120 ? [102, 112, 80] : m < 450 ? [116, 111, 78] : m < 1000 ? [130, 121, 89] : m < 1800 ? [158, 148, 118] : [196, 188, 164];
      var dx = i > 0 && i < gw ? field[o + 1] - field[o - 1] : 0;
      var dy = j > 0 && j < gh ? field[o + gw + 1] - field[o - gw - 1] : 0;
      var nx = -dx * 12, ny = 1, nz = -dy * 12;
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var dot = (nx * -0.48 + ny * 0.72 + nz * -0.5) / len;
      var k = U.clamp(0.52 + dot * 0.62, 0.3, 1.08);
      var q = o * 4;
      img.data[q] = Math.round(c[0] * k);
      img.data[q + 1] = Math.round(c[1] * k);
      img.data[q + 2] = Math.round(c[2] * k);
      img.data[q + 3] = 255;
    }
    sg.putImageData(img, 0, 0);

    var cw = 1024, ch = Math.round((cw * T.depth) / T.width);
    var c = document.createElement("canvas"); c.width = cw; c.height = ch;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.drawImage(small, 0, 0, cw, ch);
    // 沙土颗粒
    var rnd = U.rng(1907);
    for (var n = 0; n < 4200; n++) {
      var px = rnd() * cw, py = rnd() * ch;
      var v = 28 + rnd() * 55;
      g.fillStyle = "rgba(" + Math.round(v + 34) + "," + Math.round(v + 20) + "," + Math.round(v) + "," + (0.03 + rnd() * 0.1).toFixed(3) + ")";
      g.fillRect(px, py, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    // 等高线（每 1.5 个场景高度单位）
    g.strokeStyle = "rgba(225,213,178,.10)";
    g.lineWidth = 1.1;
    for (var L = 1.5; L < 8; L += 1.5) {
      g.beginPath();
      for (j = 0; j < gh; j++) for (i = 0; i < gw; i++) {
        o = j * (gw + 1) + i;
        var a = field[o], b = field[o + 1], cc = field[o + gw + 2], d = field[o + gw + 1];
        var idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var x0 = (i / gw) * cw, y0 = (j / gh) * ch, cw1 = cw / gw, ch1 = ch / gh;
        var e = function (p, q) { return (L - p) / (q - p); };
        var Tp = [x0 + e(a, b) * cw1, y0], Rp = [x0 + cw1, y0 + e(b, cc) * ch1];
        var Bp = [x0 + e(d, cc) * cw1, y0 + ch1], Lp = [x0, y0 + e(a, d) * ch1];
        var segs = {
          1: [Lp, Bp], 2: [Bp, Rp], 3: [Lp, Rp], 4: [Tp, Rp], 5: [Lp, Tp, Bp, Rp], 6: [Tp, Bp], 7: [Lp, Tp],
          8: [Lp, Tp], 9: [Tp, Bp], 10: [Tp, Rp, Lp, Bp], 11: [Tp, Rp], 12: [Lp, Rp], 13: [Bp, Rp], 14: [Lp, Bp]
        }[idx];
        for (var s = 0; s < segs.length; s += 2) { g.moveTo(segs[s][0], segs[s][1]); g.lineTo(segs[s + 1][0], segs[s + 1][1]); }
      }
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function paintWarProvinces(war) {
    var T = war.terrain, c = war.provinceCanvas, g = war.provinceCtx;
    if (!T || !c) return;
    var cw = c.width, ch = c.height;
    g.clearRect(0, 0, cw, ch);
    war.provinceList.forEach(function (p) {
      var col = new THREE.Color(sideColor(war, p.owner));
      g.beginPath();
      p.def.polygon.forEach(function (pt, i) {
        var q = warCanvasPoint(T, pt[0], pt[1], cw, ch);
        if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y);
      });
      g.closePath();
      g.fillStyle = "rgba(" + Math.round(col.r * 255) + "," + Math.round(col.g * 255) + "," + Math.round(col.b * 255) + ",0.34)";
      g.fill();
      var lite = col.clone().lerp(new THREE.Color(0xfff2d0), 0.5);
      g.strokeStyle = "rgba(" + Math.round(lite.r * 255) + "," + Math.round(lite.g * 255) + "," + Math.round(lite.b * 255) + ",0.85)";
      g.lineWidth = 2.2;
      g.stroke();
    });
    war.provinceTexture.needsUpdate = true;
    war.mapDirty = false;
  }

  function warBuildProvinceOverlay(war) {
    var T = war.terrain;
    var cw = 1024, ch = Math.round((cw * T.depth) / T.width);
    var c = document.createElement("canvas"); c.width = cw; c.height = ch;
    war.provinceCanvas = c;
    war.provinceCtx = c.getContext("2d");
    war.provinceTexture = new THREE.CanvasTexture(c);
    paintWarProvinces(war);
    var geo = T.geometry.clone();
    geo.translate(0, 0.055, 0);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: war.provinceTexture, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide
    }));
    mesh.renderOrder = 2;
    S.root.add(mesh);
    war.provinceMesh = mesh;
  }

  function warHeight(war, x, z) {
    return war.terrain ? war.terrain.heightAtXZ(x, z) : 0;
  }

  function warBuild(data) {
    teardown();
    var war = warReset(data);
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07100e);
    scene.fog = new THREE.Fog(0x07100e, 120, 220);
    S.scene = scene;

    var tcfg = data.terrain || {};
    var T = null;
    if (tcfg.dem && HS.dem && HS.dem.has(tcfg.dem)) {
      T = HS.dem.buildMesh({
        dem: tcfg.dem,
        bounds: tcfg.bounds,
        width: (tcfg.size && tcfg.size[0]) || 110,
        depth: (tcfg.size && tcfg.size[1]) || 90,
        step: tcfg.meshStep || 0.012,
        exaggeration: tcfg.exaggeration || 9,
        zNorth: "positive",
        maxHeight: tcfg.maxHeight || 7,
        edgeFalloff: tcfg.edgeFalloff || 0
      });
    }
    war.terrain = T;

    var c = data.camera || {};
    var dist = Math.max(20, Math.min(120, c.dist || 62));
    var polar = (c.polar == null ? 52 : c.polar) * U.deg;
    var az = (c.az == null ? 0 : c.az) * U.deg;
    var target = c.target || [0, 0];
    var groundY = T ? T.heightAtXZ(target[0], target[1]) : 0;
    var cam = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    cam.position.set(target[0] + dist * Math.sin(polar) * Math.sin(az), groundY + dist * Math.cos(polar), target[1] + dist * Math.sin(polar) * Math.cos(az));
    cam.lookAt(target[0], groundY, target[1]);
    S.camera = cam;
    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true; oc.dampingFactor = 0.08; oc.enablePan = false;
    oc.rotateSpeed = 0.45; oc.zoomSpeed = 0.8;
    oc.minDistance = 22; oc.maxDistance = 130;
    oc.minPolarAngle = 18 * U.deg; oc.maxPolarAngle = 74 * U.deg;
    oc.autoRotate = false;
    oc.target.set(target[0], groundY, target[1]);
    oc.update();
    S.controls = oc;

    var root = new THREE.Group(); S.root = root; root.scale.z = -1; scene.add(root);
    scene.add(new THREE.HemisphereLight(0xd8e8d8, 0x22170f, 0.8));
    var key = new THREE.DirectionalLight(0xffe0b0, 0.9);
    key.position.set(-40, 70, 30); scene.add(key);
    var fill = new THREE.DirectionalLight(0x8fc8d4, 0.22);
    fill.position.set(40, 26, -34); scene.add(fill);

    if (T) {
      var terrainMesh = new THREE.Mesh(T.geometry,
        new THREE.MeshStandardMaterial({ map: warTerrainTexture(T), roughness: 1, metalness: 0, flatShading: false }));
      terrainMesh.receiveShadow = true;
      root.add(terrainMesh);
      T.mesh = terrainMesh;
      var base = new THREE.Mesh(new THREE.PlaneGeometry(T.width + 16, T.depth + 16),
        new THREE.MeshBasicMaterial({ color: 0x0a1411 }));
      base.rotation.x = Math.PI / 2;
      base.position.y = -1.4;
      root.add(base);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(Math.max(T.width, T.depth) * 0.52, 0.22, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.55, metalness: 0.25 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -1.2;
      root.add(rim);
      warBuildProvinceOverlay(war);
    } else {
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 90),
        new THREE.MeshBasicMaterial({ color: 0x0b1714 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.25; root.add(ground);
      var grid = new THREE.GridHelper(90, 18, 0x1b302a, 0x10231f);
      grid.position.y = -0.18; grid.material.transparent = true; grid.material.opacity = 0.35; root.add(grid);
      war.provinceList.forEach(function (p) {
        var shape = new THREE.Shape(p.def.polygon.map(function (pt) { return new THREE.Vector2(pt[0], -pt[1]); }));
        var geo = new THREE.ShapeGeometry(shape);
        geo.rotateX(-Math.PI / 2);
        p.fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
          color: sideColor(war, p.owner), transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide
        }));
        p.fill.position.y = 0.02;
        root.add(p.fill);
      });
    }

    // 省份标签（贴地）
    war.provinceList.forEach(function (p) {
      var lb = makeLabelSprite(p.def.name, "#f3e9d2");
      lb.position.set(p.cx, warHeight(war, p.cx, p.cz) + (T ? 4.4 : 1.15), p.cz + 6.5);
      lb.scale.set(Math.max(6, p.def.name.length * 3.2), 3.2, 1);
      root.add(lb);
      p.label = lb;
    });

    // 城市点 + 河流（贴地）
    (data.map.cities || []).forEach(function (city) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.9, 20),
        new THREE.MeshBasicMaterial({ color: 0xd8b56a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(city.pos[0], warHeight(war, city.pos[0], city.pos[1]) + 0.18, city.pos[1]);
      root.add(ring);
    });
    (data.map.rivers || []).forEach(function (r) {
      var pts = r.points.map(function (p) { return new THREE.Vector3(p[0], warHeight(war, p[0], p[1]) + 0.16, p[1]); });
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x6fb7c0, transparent: true, opacity: 0.7 }));
      root.add(line);
    });

    war.frontGroup = new THREE.Group();
    war.frontGroup.userData = { on: true };
    root.add(war.frontGroup);
    war.battleGroup = new THREE.Group(); root.add(war.battleGroup);
    war.unitGroup = new THREE.Group(); root.add(war.unitGroup);

    // 单位：精灵牌 + 小人编队
    war.units.forEach(function (u) {
      var cvs = document.createElement("canvas");
      cvs.width = 256; cvs.height = 128;
      var tex = new THREE.CanvasTexture(cvs);
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
      var sp = new THREE.Sprite(mat);
      sp.scale.set(7, 3.5, 1);
      sp.renderOrder = 20;
      sp.userData.unitId = u.id;
      u.canvas = cvs; u.ctx = cvs.getContext("2d"); u.texture = tex; u.sprite = sp;
      drawUnitCard(u, sideOf(war, u.side));
      var gp = warUnitPos(war, u);
      sp.position.set(gp.x, gp.y + 4.4, gp.z);
      war.unitGroup.add(sp);
      war.unitSprites.push(sp);

      var form = HS.figures.buildFormation({
        count: u.type === "cavalry" ? 10 : 20,
        type: u.type,
        color: sideColor(war, u.side),
        seed: U.hash(u.id),
        spacing: u.type === "cavalry" ? 1.2 : 0.75,
        facing: u.side === (data.sides[0] && data.sides[0].id) ? 0 : 180
      });
      form.scale.setScalar(1.15);
      form.position.copy(gp);
      form.userData.state = "idle";
      war.unitGroup.add(form);
      u.formation = form;
    });

    warBuildRoutes(war);
    warRebuildFront(war);
    warBindPointer(war);
    resize();
    applyViewOffset();
    warUpdateUI(war, true);
  }

  function warApplyOrder(war, u, o) {
    if (!o) return;
    if (o.to === u.provinceId) {
      u.status = o.type === "defend" ? "防守" : "待命";
      return;
    }
    u.target = o.to;
    u.moving = true;
    u.moveT = 0;
    u.status = o.type === "retreat" ? "溃退" : o.type === "attack" ? "进攻" : "推进";
  }
  function warApplyPhase(war, ph) {
    (ph.effects || []).forEach(function (e) {
      if (e.type === "morale") {
        war.units.forEach(function (u) {
          if (u.side === e.side && (!e.unit || u.id === e.unit)) u.morale = clamp100(u.morale + e.value);
        });
      } else if (e.type === "attack") {
        war.sideMods[e.side] = war.sideMods[e.side] || { attack: 1 };
        war.sideMods[e.side].attack *= (1 + e.value);
      }
    });
    if (ph.log) warLog(war, ph.log, "phase", war.phaseIndex);
  }
  function warUnitsIn(war, provinceId) {
    return war.units.filter(function (u) { return u.provinceId === provinceId && !u.routed; });
  }
  function warRout(war, u) {
    if (u.routed) return;
    u.routed = true;
    u.status = "溃退";
    u.moving = false; u.target = null; u.moveT = 0;
    var p = war.provinces[u.provinceId];
    var neighbors = (p && p.def.neighbors) || [];
    var best = null;
    neighbors.forEach(function (id) {
      var q = war.provinces[id];
      if (!q || !sameCoalition(q.owner, u.side)) return;
      var enemies = war.units.some(function (x) { return x.provinceId === id && !x.routed && !sameCoalition(x.side, u.side); });
      if (!enemies && !best) best = id;
    });
    if (best) { u.target = best; u.moving = true; }
    else { u.strength = 0; }
    warLog(war, u.name + "溃退", "rout", war.phaseIndex);
  }
  function warSetOwner(war, p, side) {
    if (!p || p.owner === side) return;
    p.owner = side;
    p.targetColor = new THREE.Color(sideColor(war, side));
    var s = sideOf(war, side);
    if (p.label) p.label.material.color = new THREE.Color(0xffffff);
    war.mapDirty = true;
    warLog(war, p.def.name + "易手：" + s.name, "occupy", war.phaseIndex);
    var ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.5, 28),
      new THREE.MeshBasicMaterial({ color: sideColor(war, side), transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.cx, warHeight(war, p.cx, p.cz) + 0.4, p.cz);
    war.battleGroup.add(ring);
    war.battles.push({ mesh: ring, age: 0, life: 1.6 });
    warRebuildFront(war);
  }
  function warUpdateControl(war) {
    war.provinceList.forEach(function (p) {
      var units = warUnitsIn(war, p.id);
      if (!units.length) return;
      var first = coalition(units[0].side);
      var mixed = units.some(function (u) { return coalition(u.side) !== first; });
      if (!mixed) {
        var ownerSide = units[0].side;
        if (p.owner !== ownerSide) warSetOwner(war, p, ownerSide);
      }
    });
  }
  function warResolveCombat(war, p, dt) {
    var units = warUnitsIn(war, p.id);
    if (units.length < 2) { p.engaged = false; return; }
    var sides = {};
    units.forEach(function (u) { sides[coalition(u.side)] = true; });
    if (Object.keys(sides).length < 2) return;
    if (!p.engaged) {
      p.engaged = true;
      warLog(war, p.def.name + "接战", "battle", war.phaseIndex);
      warSpawnBattle(war, p);
    }
    var terrainDef = { plain: 0, hill: 0.15, mountain: 0.3, river_valley: 0.1 }[p.def.terrain] || 0;
    var hits = [];
    units.forEach(function (u) {
      var enemy = units.filter(function (x) { return !sameCoalition(x.side, u.side) && !x.routed; })[0];
      if (!enemy) return;
      var moraleFactor = 0.5 + 0.5 * (u.morale / 100);
      var mod = war.sideMods[u.side] ? war.sideMods[u.side].attack : 1;
      var dmg = 0.85 * dt * u.attack * (u.strength / 100) * (1 - terrainDef) * moraleFactor * mod * (0.85 + war.rng() * 0.3);
      hits.push({ attacker: u, enemy: enemy, dmg: dmg });
    });
    hits.forEach(function (h) {
      h.enemy.strength = clamp100(h.enemy.strength - h.dmg);
      h.enemy.morale = clamp100(h.enemy.morale - h.dmg * 0.55);
      h.attacker.strength = clamp100(h.attacker.strength - h.dmg * 0.32);
      h.attacker.morale = clamp100(h.attacker.morale - h.dmg * 0.12);
      if (!h.enemy.routed && (h.enemy.strength <= 20 || h.enemy.morale <= 25)) warRout(war, h.enemy);
      if (!h.attacker.routed && (h.attacker.strength <= 20 || h.attacker.morale <= 25)) warRout(war, h.attacker);
    });
  }
  function warSpawnBattle(war, p) {
    var ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.cx, warHeight(war, p.cx, p.cz) + 0.45, p.cz);
    war.battleGroup.add(ring);
    war.battles.push({ mesh: ring, age: 0, life: 2.2 });
  }
  function warUpdateBattles(war, dt) {
    for (var i = war.battles.length - 1; i >= 0; i--) {
      var b = war.battles[i]; b.age += dt;
      var k = b.age / b.life;
      if (k >= 1) {
        war.battleGroup.remove(b.mesh);
        b.mesh.geometry.dispose(); b.mesh.material.dispose();
        war.battles.splice(i, 1); continue;
      }
      var s = 1 + k * 2.4;
      b.mesh.scale.set(s, s, s);
      b.mesh.material.opacity = 0.9 * (1 - k);
    }
  }
  function warComputeStats(war) {
    var out = { sides: {}, provinces: 0, time: war.time };
    (war.data.sides || []).forEach(function (s) {
      out.sides[s.id] = { id: s.id, name: s.name, strength: 0, provinces: 0, units: 0 };
    });
    war.units.forEach(function (u) {
      var s = out.sides[u.side]; if (!s) return;
      s.strength += Math.max(0, u.strength);
      s.units++;
    });
    war.provinceList.forEach(function (p) {
      var s = out.sides[p.owner]; if (s) s.provinces++;
      out.provinces++;
    });
    Object.keys(out.sides).forEach(function (id) {
      var s = out.sides[id];
      s.control = out.provinces ? s.provinces / out.provinces * 100 : 0;
      s.max = (war.initialStrength && war.initialStrength[id]) || 1;
      s.pct = U.clamp(s.strength / s.max * 100, 0, 100);
    });
    war.stats = out;
    return out;
  }
  function warUpdateUI(war, force) {
    var now = performance.now();
    if (!force && war.lastUI > 0 && now - war.lastUI < 180) return;
    war.lastUI = now;
    var t = war.time / (war.data.duration || 30);
    var ph = null, pi = -1;
    (war.data.phases || []).forEach(function (p, i) { if (t >= p.at) { ph = p; pi = i; } });
    if (HS.ui) {
      if (HS.ui.setWarStats) HS.ui.setWarStats(warComputeStats(war), war.data.sides);
      if (HS.ui.setWarPhase) HS.ui.setWarPhase(ph, t, pi, war.data.phases);
      if (HS.ui.setWarSpeed) HS.ui.setWarSpeed(war.speed);
      if (HS.ui.setWarPlaying) HS.ui.setWarPlaying(S.playing);
    }
  }
  function warStep(war, dt) {
    war.time = Math.min(war.data.duration || 30, war.time + dt);
    var t = war.time / (war.data.duration || 30);
    while (war.phaseIndex + 1 < (war.data.phases || []).length && t >= war.data.phases[war.phaseIndex + 1].at) {
      war.phaseIndex++;
      warApplyPhase(war, war.data.phases[war.phaseIndex]);
    }
    war.units.forEach(function (u) {
      if (u.routed) return;
      while (u.orderIndex + 1 < (u.def.orders || []).length && t >= u.def.orders[u.orderIndex + 1].at) {
        u.orderIndex++;
        warApplyOrder(war, u, u.def.orders[u.orderIndex]);
      }
    });
    war.units.forEach(function (u) {
      if (!u.moving || !u.target) return;
      u.moveT += dt * (u.speed || 1) / war.moveTime;
      if (u.moveT >= 1) {
        u.provinceId = u.target;
        u.target = null; u.moving = false; u.moveT = 0;
        if (!u.routed) u.status = "待命";
      }
    });
    war.provinceList.forEach(function (p) { warResolveCombat(war, p, dt); });
    warUpdateControl(war);
    warComputeStats(war);
    warUpdateUI(war, false);
    if (war.time >= (war.data.duration || 30)) {
      S.playing = false;
      warLog(war, "推演结束", "end", war.phaseIndex);
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
    }
  }
  function warUpdateVisuals(war, dt) {
    if (war.mapDirty && war.provinceTexture) paintWarProvinces(war);
    war.units.forEach(function (u) {
      var gp = warUnitPos(war, u);
      if (u.sprite) {
        u.sprite.position.set(gp.x, gp.y + 4.4, gp.z);
        u.sprite.material.opacity = u.routed ? 0.42 : 1;
        if (u.routed) u.sprite.material.color.set(0x9a9a9a); else u.sprite.material.color.set(0xffffff);
      }
      if (u.formation) {
        u.formation.position.copy(gp);
        var p = war.provinces[u.provinceId];
        var state = u.routed ? "rout" : (u.moving ? (u.status === "进攻" ? "charge" : "march") : (p && p.engaged ? "fight" : "idle"));
        u.formation.userData.update(war.time + u.index * 0.7, state);
        if (u.moving && u.target && p) {
          var q = war.provinces[u.target];
          if (q) u.formation.rotation.y = Math.atan2(q.cx - p.cx, q.cz - p.cz);
        }
      }
    });
    if (war.time - (war._lastCard || -1) > 0.22) {
      war._lastCard = war.time;
      war.units.forEach(function (u) { if (u.canvas) drawUnitCard(u, sideOf(war, u.side)); });
    }
    var t = war.time / (war.data.duration || 30);
    (war.routeObjs || []).forEach(function (r) {
      if (r.group) r.group.visible = t >= r.start && t <= r.end;
    });
    warUpdateBattles(war, dt);
    warUpdateUI(war, false);
  }
  function warFastForward(war, target) {
    var guard = 0;
    while (war.time < target && guard++ < 5000) warStep(war, war.data.tick || 0.1);
    war.mapDirty = true;
    warUpdateVisuals(war, 0);
  }
  function warBindPointer(war) {
    var ray = new THREE.Raycaster();
    var ptr = new THREE.Vector2();
    war.raycaster = ray; war.pointer = ptr;
    function onMove(e) {
      if (!S.active || !S.war) return;
      var rect = canvas.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ptr, S.camera);
      var hits = ray.intersectObjects(war.unitSprites, false);
      if (hits.length) {
        var id = hits[0].object.userData.unitId;
        var u = war.units.filter(function (x) { return x.id === id; })[0];
        if (u && HS.ui && HS.ui.showWarTip) {
          var side = sideOf(war, u.side);
          HS.ui.showWarTip("<b>" + side.name + " · " + u.name + "</b><br>兵力 " + Math.round(u.strength) + " / 士气 " + Math.round(u.morale) + "<br>" + u.status + " · " + (war.provinces[u.provinceId] ? war.provinces[u.provinceId].def.name : ""), e.clientX, e.clientY);
          canvas.style.cursor = "pointer";
          return;
        }
      }
      var hitProv = null;
      if (war.terrain && war.terrain.mesh) {
        var th = ray.intersectObject(war.terrain.mesh, false);
        if (th.length) {
          var lx = th[0].point.x, lz = -th[0].point.z;
          for (var pi = 0; pi < war.provinceList.length; pi++) {
            if (U.pointInPoly(lx, lz, war.provinceList[pi].def.polygon)) { hitProv = war.provinceList[pi]; break; }
          }
        }
      } else {
        var provMeshes = war.provinceList.map(function (p) { return p.fill; }).filter(Boolean);
        var ph = ray.intersectObjects(provMeshes, false);
        if (ph.length) hitProv = war.provinces[ph[0].object.userData.provinceId];
      }
      if (hitProv && HS.ui && HS.ui.showWarTip) {
        var p = hitProv;
        var s = sideOf(war, p.owner);
        var units = warUnitsIn(war, p.id).map(function (u) { return u.name; }).join("、") || "无";
        HS.ui.showWarTip("<b>" + p.def.name + "</b><br>控制：" + s.name + " · 地形：" + p.def.terrain + "<br>驻军：" + units, e.clientX, e.clientY);
        canvas.style.cursor = "help";
        return;
      }
      if (HS.ui && HS.ui.hideWarTip) HS.ui.hideWarTip();
      canvas.style.cursor = "";
    }
    function onLeave() { if (HS.ui && HS.ui.hideWarTip) HS.ui.hideWarTip(); canvas.style.cursor = ""; }
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    war.listeners = { move: onMove, leave: onLeave };
  }
  function warTeardown() {
    if (S.war && S.war.listeners) {
      canvas.removeEventListener("pointermove", S.war.listeners.move);
      canvas.removeEventListener("pointerleave", S.war.listeners.leave);
    }
    if (HS.ui && HS.ui.hideWarTip) HS.ui.hideWarTip();
    S.war = null;
    S.warAcc = 0;
  }

  /* ================================================================== *
   * 通用战场 battle（所有 war 事件兜底）
   * ================================================================== */
  function battleSide(data, s) {
    if (typeof s === "number") return (data.sides || [])[s] || (data.sides || [])[0] || {};
    var arr = data.sides || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === s) return arr[i];
    return arr[0] || {};
  }

  function battlePresetUnits(data) {
    var preset = data.preset || "field";
    var u = [];
    function add(side, type, label, sx, sz, tx, tz, at, dur, wall) {
      u.push({ side: side, type: type, label: label, count: type === "cavalry" ? 8 : 12, wall: !!wall, start: { x: sx, z: sz }, end: { x: tx, z: tz }, moveAt: at, moveDur: dur });
    }
    if (preset === "siege") {
      add(0, "infantry", "攻城中军", 0, -17, 0, 1, 0.15, 0.58);
      add(0, "infantry", "攻城左军", -11, -17, -8, 1, 0.20, 0.58);
      add(0, "infantry", "攻城右军", 11, -17, 8, 1, 0.24, 0.58);
      add(1, "infantry", "守城左", -8, 4, -8, 4, 0, 0, true);
      add(1, "infantry", "守城中", 0, 4, 0, 4, 0, 0, true);
      add(1, "infantry", "守城右", 8, 4, 8, 4, 0, 0, true);
    } else if (preset === "cavalry") {
      add(0, "cavalry", "左翼", -15, -15, -6, -1, 0.18, 0.52);
      add(0, "cavalry", "中军", 0, -17, 0, 1, 0.22, 0.52);
      add(0, "cavalry", "右翼", 15, -15, 6, -1, 0.26, 0.52);
      add(1, "cavalry", "左翼", -15, 15, -6, 1, 0.20, 0.52);
      add(1, "cavalry", "中军", 0, 17, 0, -1, 0.24, 0.52);
      add(1, "cavalry", "右翼", 15, 15, 6, 1, 0.28, 0.52);
    } else if (preset === "ambush") {
      add(0, "infantry", "前队", 0, -17, 0, -2, 0.18, 0.6);
      add(0, "infantry", "后队", 0, -23, 0, 3, 0.28, 0.6);
      add(1, "infantry", "伏兵左", -14, 4, -6, 0, 0.48, 0.32);
      add(1, "infantry", "伏兵右", 14, 4, 6, 0, 0.48, 0.32);
    } else if (preset === "river") {
      add(0, "infantry", "渡河左军", -10, -17, -7, -3, 0.20, 0.6);
      add(0, "infantry", "渡河中军", 0, -17, 0, -3, 0.24, 0.6);
      add(1, "infantry", "守岸左", -10, 11, -7, 5, 0, 0);
      add(1, "infantry", "守岸中", 0, 11, 0, 5, 0, 0);
    } else {
      add(0, "infantry", "中军", 0, -15, 0, -1, 0.18, 0.55);
      add(0, "cavalry", "左翼", -13, -13, -8, 0, 0.22, 0.55);
      add(0, "infantry", "右翼", 13, -13, 8, 0, 0.26, 0.55);
      add(1, "infantry", "中军", 0, 15, 0, 1, 0.18, 0.55);
      add(1, "cavalry", "左翼", -13, 13, -8, 0, 0.22, 0.55);
      add(1, "infantry", "右翼", 13, 13, 8, 0, 0.26, 0.55);
    }
    return u;
  }

  function battleSideIndex(data, side) {
    if (typeof side === "number") return side;
    var arr = data.sides || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === side) return i;
    return 0;
  }

  function battleMotion(data, d, t) {
    var ma = d.moveAt == null ? 0.15 : d.moveAt;
    var md = d.moveDur == null ? 0.5 : d.moveDur;
    var move = U.easeInOutCubic(U.clamp((t - ma) / md, 0, 1));
    var x = U.lerp(d.start.x, d.end.x, move);
    var z = U.lerp(d.start.z, d.end.z, move);
    var retreat = 0;
    if (battleSideIndex(data, d.side) === 1 && t > 0.8) {
      retreat = U.clamp((t - 0.8) / 0.2, 0, 1);
      x = U.lerp(d.end.x, d.start.x, retreat);
      z = U.lerp(d.end.z, d.start.z, retreat);
    }
    return { x: x, z: z, move: move, retreat: retreat > 0 };
  }

  function battleHealth(B, unit, t) {
    var d = unit.def;
    var base = d.strength == null ? 100 : d.strength;
    var baseMorale = d.morale == null ? 100 : d.morale;
    var after = U.clamp((t - 0.46) / 0.54, 0, 1);
    var defender = battleSideIndex(B.data, d.side) === 1;
    var wall = !!d.wall;
    var cavalry = (d.type || "infantry") === "cavalry";
    var river = (B.data.preset || "") === "river";
    var strengthLoss, moraleLoss;
    if (defender) {
      strengthLoss = wall ? 55 : 70;
      if (river) strengthLoss *= 0.85;
      if (cavalry) strengthLoss *= 0.92;
      moraleLoss = 100;
      if (river) moraleLoss *= 0.98;
      var late = U.clamp((t - 0.66) / 0.34, 0, 1);
      strengthLoss += late * 30;
      moraleLoss += late * (wall ? 50 : 40);
    } else {
      strengthLoss = cavalry ? 32 : 26;
      if (river) strengthLoss *= 1.15;
      moraleLoss = cavalry ? 20 : 17;
      if (river) moraleLoss *= 1.1;
    }
    var strength = U.clamp(base - after * strengthLoss, 0, 100);
    var morale = U.clamp(baseMorale - after * moraleLoss, 0, 100);
    return {
      strength: strength, morale: morale,
      routed: strength <= 20 || morale <= 25,
      defender: defender, wall: wall
    };
  }

  function battleStatus(unit, t, hp) {
    if (unit.retreating || hp.routed) return "溃退";
    if (t > 0.55) return "接战";
    if (t > (unit.def.moveAt == null ? 0.15 : unit.def.moveAt)) return "推进";
    return "待命";
  }

  function drawBattleHealth(unit, side, hp, status) {
    var c = unit.canvas, x = unit.ctx;
    if (!c || !x) return;
    var W = c.width, H = c.height;
    x.clearRect(0, 0, W, H);
    x.fillStyle = "rgba(5,13,11,.9)";
    roundRect(x, 3, 3, W - 6, H - 6, 15); x.fill();
    x.strokeStyle = side.color || "#888888";
    x.lineWidth = 3;
    roundRect(x, 3, 3, W - 6, H - 6, 15); x.stroke();
    x.fillStyle = side.color || "#888888";
    roundRect(x, 11, 11, 7, H - 22, 4); x.fill();
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillStyle = side.color || "#888888";
    x.font = "700 19px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.fillText(side.short || "", 26, 27);
    x.fillStyle = "#f3e9d2";
    x.font = "700 22px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.fillText(unit.def.label || unit.def.name || "单位", 61, 27);
    x.textAlign = "right";
    x.fillStyle = hp.routed ? "#ff9b82" : "#b8b4a4";
    x.font = "600 16px 'Microsoft YaHei', sans-serif";
    x.fillText(status || "待命", W - 14, 27);
    function bar(y, v, color, label) {
      x.fillStyle = "rgba(255,255,255,.13)";
      roundRect(x, 44, y, W - 44, 15, 7); x.fill();
      if (v > 0) {
        x.fillStyle = color;
        roundRect(x, 44, y, Math.max(2, (W - 44) * U.clamp(v, 0, 1)), 15, 7); x.fill();
      }
      x.fillStyle = "#b8b4a4";
      x.font = "600 15px 'Microsoft YaHei', sans-serif";
      x.textAlign = "left";
      x.fillText(label, 15, y + 8);
      x.fillStyle = "#f3e9d2";
      x.font = "600 14px 'Microsoft YaHei', sans-serif";
      x.textAlign = "right";
      x.fillText(String(Math.round(v * 100)), W - 16, y + 8);
    }
    bar(52, hp.strength / 100, "#e07a5f", "兵");
    bar(88, hp.morale / 100, "#8cc3b1", "气");
    unit.texture.needsUpdate = true;
  }

  function makeBattleHealthSprite(B, unit, side) {
    var c = document.createElement("canvas");
    c.width = 320; c.height = 136;
    var tex = new THREE.CanvasTexture(c);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    var sp = new THREE.Sprite(mat);
    sp.scale.set(6.6, 2.805, 1);
    sp.renderOrder = 30;
    unit.canvas = c; unit.ctx = c.getContext("2d"); unit.texture = tex;
    var hp = battleHealth(B, unit, 0);
    drawBattleHealth(unit, side, hp, battleStatus(unit, 0, hp));
    return sp;
  }

  function battlePlaceUnits(B, t) {
    B.units.forEach(function (unit) {
      var d = unit.def;
      var m = battleMotion(B.data, d, t);
      var y = B.terrain ? B.terrain.heightAtXZ(m.x, m.z) : 0;
      if (d.wall) y += 4.25;
      unit.x = m.x; unit.z = m.z; unit.y = y; unit.retreating = m.retreat;
      unit.formation.position.set(m.x, y, m.z);
      unit.formation.rotation.y = Math.atan2(d.end.x - d.start.x, d.end.z - d.start.z);
      if (unit.label) unit.label.position.set(m.x, y + 5.4 + (unit.labelOffset || 0), m.z);
    });
  }

  function battleOwnerAt(B, x, z) {
    var G = B.gridCfg, best = null, bestD = Infinity;
    if (!G) return null;
    B.units.forEach(function (u) {
      var dx = u.x - x, dz = u.z - z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bestD) { bestD = d2; best = u; }
    });
    if (best && Math.sqrt(bestD) <= G.captureRadius) return best.side.id;
    return null;
  }

  function paintBattleGrid(B) {
    var G = B.gridCfg, c = B.gridCanvas, g = B.gridCtx;
    if (!G || !c) return;
    var cw = c.width, ch = c.height;
    g.clearRect(0, 0, cw, ch);
    g.fillStyle = "rgba(120,130,122,.10)";
    g.fillRect(0, 0, cw, ch);
    var cellW = cw / G.cols, cellH = ch / G.rows;
    var sideColors = {};
    (B.data.sides || []).forEach(function (s) { sideColors[s.id] = new THREE.Color(s.color || "#888888"); });
    for (var r = 0; r < G.rows; r++) {
      var wz = G.depth / 2 - (r + 0.5) * G.depth / G.rows;
      for (var i = 0; i < G.cols; i++) {
        var wx = -G.width / 2 + (i + 0.5) * G.width / G.cols;
        var owner = battleOwnerAt(B, wx, wz);
        var col = owner ? sideColors[owner] : null;
        g.fillStyle = col
          ? "rgba(" + Math.round(col.r * 255) + "," + Math.round(col.g * 255) + "," + Math.round(col.b * 255) + ",0.34)"
          : "rgba(128,138,130,.10)";
        g.fillRect(i * cellW + 0.5, r * cellH + 0.5, cellW - 1, cellH - 1);
        if (col) {
          var lite = col.clone().lerp(new THREE.Color(0xfff2d0), 0.5);
          g.strokeStyle = "rgba(" + Math.round(lite.r * 255) + "," + Math.round(lite.g * 255) + "," + Math.round(lite.b * 255) + ",0.45)";
          g.lineWidth = 1;
          g.strokeRect(i * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }
    g.strokeStyle = "rgba(240,232,210,.16)";
    g.lineWidth = 1;
    for (var x = 0; x <= G.cols; x++) {
      g.beginPath(); g.moveTo(x * cellW, 0); g.lineTo(x * cellW, ch); g.stroke();
    }
    for (var y = 0; y <= G.rows; y++) {
      g.beginPath(); g.moveTo(0, y * cellH); g.lineTo(cw, y * cellH); g.stroke();
    }
    g.strokeStyle = "rgba(240,232,210,.3)";
    g.lineWidth = 2;
    g.strokeRect(1, 1, cw - 2, ch - 2);
    B.gridTexture.needsUpdate = true;
  }

  function battleBuildGrid(B) {
    var T = B.terrain;
    var cfg = B.data.grid || {};
    var width = T ? T.width : 92, depth = T ? T.depth : 74;
    var cols = Math.max(8, Math.min(40, cfg.cols || 20));
    var rows = Math.max(6, Math.min(32, cfg.rows || 16));
    var cell = Math.min(width / cols, depth / rows);
    B.gridCfg = {
      cols: cols, rows: rows, width: width, depth: depth,
      captureRadius: cfg.captureRadius == null ? cell * 2.4 : cfg.captureRadius
    };
    var cw = 768, ch = Math.round((cw * depth) / width);
    var c = document.createElement("canvas"); c.width = cw; c.height = ch;
    B.gridCanvas = c;
    B.gridCtx = c.getContext("2d");
    B.gridTexture = new THREE.CanvasTexture(c);
    B.gridTexture.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy());
    var geo;
    if (T) {
      geo = T.geometry.clone();
      geo.translate(0, 0.07, 0);
    } else {
      geo = new THREE.PlaneGeometry(width, depth);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0.04, 0);
    }
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: B.gridTexture, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide
    }));
    mesh.renderOrder = 3;
    S.root.add(mesh);
    B.gridMesh = mesh;
  }

  function battleRefreshHealth(B) {
    var t = B.time / (B.data.duration || 24);
    B.units.forEach(function (unit) {
      var hp = battleHealth(B, unit, t);
      drawBattleHealth(unit, unit.side, hp, battleStatus(unit, t, hp));
    });
  }

  function battleSpawnFx(B) {
    if (!S.scene) return;
    spawnClash();
  }

  function battleBuild(data) {
    teardown();
    var B = {
      data: data, time: 0, speed: S.speed || 1, phaseIndex: -1,
      units: [], unitGroup: null, labelGroup: null, terrain: null, clash: false,
      lastUI: -1, logSet: {}, gridMesh: null, gridCfg: null, gridCanvas: null,
      gridCtx: null, gridTexture: null, lastHealthT: 0, lastGridT: 0
    };
    S.battle = B;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07100e);
    scene.fog = new THREE.Fog(0x07100e, 100, 210);
    S.scene = scene;
    S.fx = [];

    var tcfg = data.terrain || {};
    var T = null;
    if (tcfg.dem && HS.dem && HS.dem.has(tcfg.dem)) {
      T = HS.dem.buildMesh({
        dem: tcfg.dem, bounds: tcfg.bounds,
        width: (tcfg.size && tcfg.size[0]) || 92,
        depth: (tcfg.size && tcfg.size[1]) || 74,
        step: tcfg.meshStep || 0.012,
        exaggeration: tcfg.exaggeration || 9,
        zNorth: "positive",
        maxHeight: tcfg.maxHeight || 7,
        edgeFalloff: tcfg.edgeFalloff == null ? 0.5 : tcfg.edgeFalloff
      });
    }
    B.terrain = T;

    var c = data.camera || {};
    var dist = Math.max(22, Math.min(110, c.dist || 56));
    var polar = (c.polar == null ? 58 : c.polar) * U.deg;
    var az = (c.az == null ? 0 : c.az) * U.deg;
    var target = c.target || (data.preset === "siege" ? [0, 6] : [0, 4]);
    var gy = T ? T.heightAtXZ(target[0], target[1]) : 0;
    var cam = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    cam.position.set(target[0] + dist * Math.sin(polar) * Math.sin(az), gy + dist * Math.cos(polar), target[1] + dist * Math.sin(polar) * Math.cos(az));
    cam.lookAt(target[0], gy, target[1]);
    S.camera = cam;
    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true; oc.dampingFactor = 0.08; oc.enablePan = false;
    oc.rotateSpeed = 0.45; oc.zoomSpeed = 0.8;
    oc.minDistance = 16; oc.maxDistance = 110;
    oc.minPolarAngle = 14 * U.deg; oc.maxPolarAngle = 76 * U.deg;
    oc.autoRotate = true; oc.autoRotateSpeed = 0.16;
    oc.addEventListener("start", function () { oc.autoRotate = false; });
    oc.target.set(target[0], gy, target[1]);
    oc.update();
    S.controls = oc;

    var root = new THREE.Group(); S.root = root; root.scale.z = -1; scene.add(root);
    scene.add(new THREE.HemisphereLight(0xd8e8d8, 0x22170f, 0.75));
    var key = new THREE.DirectionalLight(0xffe0b0, 0.95);
    key.position.set(-40, 70, 30);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x8fc8d4, 0.28);
    fill.position.set(40, 26, -34); scene.add(fill);

    if (T) {
      var terrain = new THREE.Mesh(T.geometry,
        new THREE.MeshStandardMaterial({ map: warTerrainTexture(T), roughness: 1, metalness: 0, flatShading: false }));
      terrain.receiveShadow = true;
      root.add(terrain);
      T.mesh = terrain;
      var base = new THREE.Mesh(new THREE.PlaneGeometry(T.width + 16, T.depth + 16),
        new THREE.MeshBasicMaterial({ color: 0x0a1411 }));
      base.rotation.x = Math.PI / 2; base.position.y = -1.4; root.add(base);
    } else {
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 80), new THREE.MeshBasicMaterial({ color: 0x0b1714 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.25; root.add(ground);
    }

    // 战场道具
    if (data.preset === "siege") battleAddWall(root, T);
    else if (data.preset === "river") battleAddRiver(root, T);
    else if (data.preset === "ambush") battleAddRocks(root, T);

    battleBuildGrid(B);
    B.unitGroup = new THREE.Group();
    root.add(B.unitGroup);
    B.labelGroup = new THREE.Group();
    root.add(B.labelGroup);
    var defs = data.units || battlePresetUnits(data);
    defs.forEach(function (d, i) {
      var side = battleSide(data, d.side);
      var form = HS.figures.buildFormation({
        count: d.count || (d.type === "cavalry" ? 8 : 12),
        type: d.type || "infantry",
        color: side.color || "#888",
        seed: 700 + i * 13,
        spacing: d.type === "cavalry" ? 1.25 : 0.95,
        facing: 0
      });
      form.scale.setScalar(1.3);
      var p = { x: d.start.x, z: d.start.z };
      var y = T ? T.heightAtXZ(p.x, p.z) : 0;
      if (d.wall) y += 4.25;
      form.position.set(p.x, y, p.z);
      B.unitGroup.add(form);
      var sideIdx = battleSideIndex(data, d.side);
      var unit = {
        def: d, formation: form, side: side, x: p.x, z: p.z, y: y,
        retreating: false, labelOffset: sideIdx === 1 && !d.wall ? 3.0 : 0,
        label: null, canvas: null, ctx: null, texture: null
      };
      var hp = makeBattleHealthSprite(B, unit, side);
      hp.position.set(p.x, y + 5.4 + unit.labelOffset, p.z);
      hp.renderOrder = 30 + sideIdx;
      unit.label = hp;
      B.labelGroup.add(hp);
      B.units.push(unit);
    });

    battlePlaceUnits(B, 0);
    paintBattleGrid(B);
    battleRefreshHealth(B);
    B.lastHealthT = 0;
    B.lastGridT = 0;

    resize();
    applyViewOffset();
    battleUpdateUI(B, true);
    if (HS.ui && HS.ui.buildBattleLayers) HS.ui.buildBattleLayers();
  }

  function battleAddWall(root, T) {
    var stone = new THREE.MeshStandardMaterial({ color: 0x6f6a58, roughness: 0.95, flatShading: true });
    var dark = new THREE.MeshStandardMaterial({ color: 0x4d4a3c, roughness: 1 });
    for (var x = -18; x <= 18; x += 4) {
      var h = 4.2;
      var y = T ? T.heightAtXZ(x, 4) : 0;
      var seg = new THREE.Mesh(new THREE.BoxGeometry(4.05, h, 1.2), stone);
      seg.position.set(x, y + h / 2, 4);
      seg.castShadow = true; seg.receiveShadow = true;
      root.add(seg);
      var merlon = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.3), dark);
      merlon.position.set(x, y + h + 0.35, 4);
      root.add(merlon);
    }
    [-18, 18].forEach(function (x) {
      var y = T ? T.heightAtXZ(x, 4) : 0;
      var tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 6.5, 8), stone);
      tower.position.set(x, y + 3.2, 4);
      tower.castShadow = true; root.add(tower);
      var cap = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.8, 8), dark);
      cap.position.set(x, y + 7.0, 4); root.add(cap);
    });
    var gate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.4), dark);
    gate.position.set(0, (T ? T.heightAtXZ(0, 4) : 0) + 1.6, 3.35);
    root.add(gate);
  }

  function battleAddRiver(root, T) {
    var pts = [];
    for (var x = -31; x <= 31; x += 1.4) pts.push({ x: x, z: Math.sin(x * 0.09) * 1.15 });
    var hAt = T ? T.heightAtXZ : null;
    var bank = new THREE.Mesh(HS.ribbon(pts, 10.5, false, 0.07, hAt),
      new THREE.MeshBasicMaterial({ color: 0x3b4b37, transparent: true, opacity: 0.38, depthWrite: false }));
    root.add(bank);
    var water = new THREE.Mesh(HS.ribbon(pts, 7.2, false, 0.16, hAt),
      new THREE.MeshStandardMaterial({ color: 0x3f8891, roughness: 0.28, metalness: 0.2, transparent: true, opacity: 0.76, side: THREE.DoubleSide }));
    root.add(water);

    var y = T ? T.heightAtXZ(0, 0) : 0;
    var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x5b3b24, roughness: 0.95 });
    var bridge = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.45, 9), bridgeMat);
    bridge.position.set(0, y + 0.62, 0);
    bridge.castShadow = true; root.add(bridge);
    [-2.8, 2.8].forEach(function (bx) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 9), bridgeMat);
      rail.position.set(bx, y + 1.22, 0);
      root.add(rail);
    });
  }

  function battleAddRocks(root, T) {
    var rnd = U.rng(1717);
    for (var i = 0; i < 18; i++) {
      var x = (rnd() - 0.5) * 34, z = (rnd() - 0.5) * 26;
      if (Math.abs(x) < 5) continue;
      var h = 0.6 + rnd() * 2.2;
      var y = T ? T.heightAtXZ(x, z) : 0;
      var rock = new THREE.Mesh(new THREE.DodecahedronGeometry(h, 0), new THREE.MeshStandardMaterial({ color: 0x5c5c4e, roughness: 1, flatShading: true }));
      rock.position.set(x, y + h * 0.42, z);
      rock.rotation.set(rnd() * 2, rnd() * 6, rnd() * 2);
      root.add(rock);
    }
  }

  function battleStep(B, dt) {
    var dur = B.data.duration || 24;
    B.time = Math.min(dur, B.time + dt);
    if (B.time >= dur) {
      S.playing = false;
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
    }
  }

  function battlePhase(B) {
    var t = B.time / (B.data.duration || 24);
    var ph = null, pi = -1;
    (B.data.phases || []).forEach(function (p, i) { if (t >= p.at) { ph = p; pi = i; } });
    return { t: t, phase: ph, index: pi };
  }

  function battleUpdate(B, dt) {
    var P = battlePhase(B), t = P.t;
    battlePlaceUnits(B, t);
    B.units.forEach(function (unit, i) {
      var state = unit.retreating ? "rout" : (t > 0.55 ? "fight" : (t > (unit.def.moveAt == null ? 0.15 : unit.def.moveAt) ? "march" : "idle"));
      unit.formation.userData.update(B.time + i * 0.8, state);
    });
    if (B.time < B.lastHealthT || B.time - B.lastHealthT >= 0.24) {
      B.lastHealthT = B.time;
      battleRefreshHealth(B);
    }
    if (B.time < B.lastGridT || B.time - B.lastGridT >= 0.24) {
      B.lastGridT = B.time;
      paintBattleGrid(B);
    }
    if (t > 0.52 && !B.clash) { B.clash = true; battleSpawnFx(B); }
    updateFx(dt);
    if (B.phase !== P.index) {
      B.phase = P.index;
      if (P.phase && P.phase.log && HS.ui && HS.ui.appendWarLog) HS.ui.appendWarLog(P.phase.log, "phase", P.index);
    }
    if (HS.ui && HS.ui.setWarPhase) HS.ui.setWarPhase(P.phase, t, P.index, B.data.phases);
    battleUpdateUI(B, false);
  }

  function battleUpdateUI(B, force) {
    var now = performance.now();
    if (!force && B.lastUI > 0 && now - B.lastUI < 180) return;
    B.lastUI = now;
    if (HS.ui) {
      if (HS.ui.setWarSpeed) HS.ui.setWarSpeed(S.speed || 1);
      if (HS.ui.setWarPlaying) HS.ui.setWarPlaying(S.playing);
    }
  }

  function battleFastForward(B, target) {
    var guard = 0;
    while (B.time < target && guard++ < 4000) battleStep(B, 0.1);
    battleUpdate(B, 0);
  }

  /* ================================================================== *
   * 朝堂 court
   * ================================================================== */
  function courtFloorTexture() {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 768;
    var g = c.getContext("2d");
    g.fillStyle = "#3a2c20"; g.fillRect(0, 0, 1024, 768);
    for (var y = 0; y < 768; y += 48) for (var x = 0; x < 1024; x += 48) {
      var v = 38 + ((x + y) / 48) % 2 * 8;
      g.fillStyle = "rgb(" + (v + 14) + "," + (v + 7) + "," + (v) + ")";
      g.fillRect(x + 1, y + 1, 46, 46);
    }
    g.strokeStyle = "rgba(200,170,110,.10)"; g.lineWidth = 1;
    for (var i = 0; i < 1024; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 768); g.stroke(); }
    for (i = 0; i < 768; i += 48) { g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
    var carpet = g.createLinearGradient(0, 280, 0, 620);
    carpet.addColorStop(0, "#5a1f1a"); carpet.addColorStop(0.5, "#7a2b22"); carpet.addColorStop(1, "#4a1a16");
    g.fillStyle = carpet; g.fillRect(360, 250, 304, 400);
    g.strokeStyle = "rgba(214,177,96,.65)"; g.lineWidth = 5; g.strokeRect(360, 250, 304, 400);
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function courtScreenTexture() {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    var g = c.getContext("2d");
    var bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, "#243c34"); bg.addColorStop(1, "#14241f");
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = "rgba(206,171,92,.35)"; g.lineWidth = 2;
    for (var i = 0; i < 7; i++) {
      g.beginPath();
      for (var x = 0; x <= 1024; x += 16) {
        var y = 260 + Math.sin(x / 90 + i) * (40 + i * 8) + i * 10;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = "rgba(206,171,92,.10)";
    for (i = 0; i < 12; i++) {
      var x = 70 + (i * 263) % 900, y = 80 + (i * 97) % 300, r = 50 + (i * 31) % 90;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  var COURT_SIDE_COLOR = { reform: "#c9a865", cautious: "#8a9b6a", neutral: "#7f8b9a", conservative: "#9a6a55" };

  function courtRoleLabel(role) {
    return role.name + (role.rank ? " · " + role.rank : "");
  }

  function makeCourtNameplate(role) {
    var text = courtRoleLabel(role);
    var color = role.id === "emperor" ? "#e2c06a" : (COURT_SIDE_COLOR[role.side] || "#8a9b8f");
    var c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    var x = c.getContext("2d");
    x.font = "700 30px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    var w = Math.min(492, Math.max(260, x.measureText(text).width + 92));
    var left = (512 - w) / 2;
    x.clearRect(0, 0, 512, 128);
    x.fillStyle = "rgba(4,10,8,.92)";
    roundRect(x, left, 20, w, 88, 18); x.fill();
    x.strokeStyle = color;
    x.lineWidth = 3;
    if (role.roleOnly) x.setLineDash([8, 5]);
    roundRect(x, left, 20, w, 88, 18); x.stroke();
    x.setLineDash([]);
    x.fillStyle = color;
    roundRect(x, left + 18, 46, 8, 36, 4); x.fill();
    x.fillStyle = "#f6edd8";
    x.font = "700 30px 'Microsoft YaHei', 'PingFang SC', sans-serif";
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillText(text, left + 38, 65);
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy());
    var mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.32
    });
    var sp = new THREE.Sprite(mat);
    sp.renderOrder = 16;
    return { sprite: sp, worldW: 8.8, worldH: 2.2 };
  }

  function attachCourtNameplate(entry) {
    var np = makeCourtNameplate(entry.role);
    var s = entry.group.scale.x || 1;
    entry.nameplate = np.sprite;
    entry.npBaseW = np.worldW / s;
    entry.npBaseH = np.worldH / s;
    entry.nameplate.scale.set(entry.npBaseW, entry.npBaseH, 1);
    entry.nameplate.position.set(0, entry.role.id === "emperor" ? 2.45 : 2.24, 0);
    entry.group.add(entry.nameplate);
  }

  function courtFocus(C, ph) {
    C.roleList.forEach(function (r) {
      var active = !!(ph && r.role.id === ph.speaker);
      var mat = r.nameplate.material;
      mat.opacity = active ? 1 : 0.28;
      mat.color.setHex(active ? 0xffffff : 0x7f8983);
      var k = active ? 1.08 : 0.88;
      r.nameplate.scale.set(r.npBaseW * k, r.npBaseH * k, 1);
      r.nameplate.renderOrder = active ? 26 : 16;
    });
    var sp = ph && C.roles[ph.speaker];
    if (sp && sp.group && C.halo) {
      if (sp.role.id === "emperor") {
        C.halo.position.set(sp.group.position.x, 1.12, sp.group.position.z + 1.5);
        C.haloBase = 1.5;
      } else {
        C.halo.position.set(sp.group.position.x, sp.group.position.y + 0.05, sp.group.position.z);
        C.haloBase = 1;
      }
      C.halo.scale.setScalar(C.haloBase);
      C.halo.visible = true;
    } else if (C.halo) {
      C.halo.visible = false;
    }
  }

  function courtBuild(data) {
    teardown();
    var C = { data: data, time: 0, speed: S.speed || 1, phaseIndex: -1, roles: {}, roleList: [], flames: [], lights: [], lastUI: -1, halo: null };
    S.court = C;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d0b);
    scene.fog = new THREE.Fog(0x0b0d0b, 38, 110);
    S.scene = scene;

    var c = data.camera || {};
    var dist = Math.max(20, Math.min(70, c.dist || 34));
    var polar = (c.polar == null ? 70 : c.polar) * U.deg;
    var az = (c.az == null ? 0 : c.az) * U.deg;
    var cam = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
    cam.position.set(dist * Math.sin(polar) * Math.sin(az), 2.0 + dist * Math.cos(polar), dist * Math.sin(polar) * Math.cos(az));
    cam.lookAt(0, 2.0, 0);
    S.camera = cam;
    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true; oc.dampingFactor = 0.08; oc.enablePan = false;
    oc.rotateSpeed = 0.4; oc.zoomSpeed = 0.8;
    oc.minDistance = 16; oc.maxDistance = 60;
    oc.minPolarAngle = 26 * U.deg; oc.maxPolarAngle = 82 * U.deg;
    oc.autoRotate = true; oc.autoRotateSpeed = 0.12;
    oc.addEventListener("start", function () { oc.autoRotate = false; });
    oc.target.set(0, 2.0, 0);
    oc.update();
    S.controls = oc;

    var root = new THREE.Group(); S.root = root; scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffe8c8, 0x2a1c12, 0.7));
    var key = new THREE.DirectionalLight(0xffd9a0, 1.05);
    key.position.set(-8, 18, 14);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9fc8c0, 0.28);
    fill.position.set(14, 10, -14); scene.add(fill);
    var glow = new THREE.PointLight(0xffc27a, 0.7, 34, 2);
    glow.position.set(0, 4.5, 4); scene.add(glow);

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 34),
      new THREE.MeshStandardMaterial({ map: courtFloorTexture(), roughness: 0.92, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);

    var screen = new THREE.Mesh(new THREE.PlaneGeometry(20, 8),
      new THREE.MeshBasicMaterial({ map: courtScreenTexture(), transparent: true }));
    screen.position.set(0, 4.2, -13.8);
    root.add(screen);

    var wood = new THREE.MeshStandardMaterial({ color: 0x56291f, roughness: 0.9, metalness: 0.05 });
    var woodDark = new THREE.MeshStandardMaterial({ color: 0x2f2018, roughness: 0.95 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xc9a865, roughness: 0.42, metalness: 0.4 });
    // 柱
    [[-15, -9], [15, -9], [-15, 0], [15, 0], [-15, 9], [15, 9]].forEach(function (p) {
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 6.8, 8), wood);
      col.position.set(p[0], 3.4, p[1]); col.castShadow = true; root.add(col);
      var cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 1.3), gold);
      cap.position.set(p[0], 6.9, p[1]); root.add(cap);
      var base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.5), gold);
      base.position.set(p[0], 0.18, p[1]); root.add(base);
    });
    // 只保留四周檐梁，避免横梁挡住朝堂人物。
    [-9, 9].forEach(function (z) {
      var beam = new THREE.Mesh(new THREE.BoxGeometry(32, 0.5, 0.7), woodDark);
      beam.position.set(0, 6.75, z); root.add(beam);
    });
    [-15, 15].forEach(function (x) {
      var beam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 19), woodDark);
      beam.position.set(x, 6.75, 0); root.add(beam);
    });
    // 御座台
    var plat = new THREE.Mesh(new THREE.BoxGeometry(10, 1.1, 6), woodDark);
    plat.position.set(0, 0.55, -9.5); plat.castShadow = true; root.add(plat);
    var step1 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 1.2), wood);
    step1.position.set(0, 0.18, -6.2); root.add(step1);
    var step2 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 1.2), wood);
    step2.position.set(0, 0.35, -7.1); root.add(step2);
    var throne = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 2.2), wood);
    throne.position.set(0, 2.6, -10.4); throne.castShadow = true; root.add(throne);
    var throneBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 0.3), gold);
    throneBack.position.set(0, 3.6, -11.4); root.add(throneBack);

    // 皇帝
    var emp = HS.figures.buildEmperor({ color: "#8c3a32" });
    emp.position.set(0, 1.25, -8.8);
    emp.rotation.y = 0;
    emp.scale.setScalar(1.3);
    root.add(emp);
    C.roles.emperor = { role: (data.roles || []).filter(function (r) { return r.id === "emperor"; })[0] || { id: "emperor", name: "皇帝", rank: "" }, group: emp, pose: "seat", baseY: 1.25 };
    C.roleList.push(C.roles.emperor);
    attachCourtNameplate(C.roles.emperor);

    var colors = ["#3d5a50", "#5a4a36", "#4a3b58", "#36545a", "#5a3a3a"];
    var slots = [
      [-4.2, 0, 2.2], [4.2, 0, 2.2], [-6.4, 0, 5.8], [6.4, 0, 5.8],
      [-2.8, 0, 7.8], [2.8, 0, 7.8]
    ];
    var roles = (data.roles || []).filter(function (r) { return r.id !== "emperor" && r.id !== "guard"; });
    roles.forEach(function (r, idx) {
      var g = HS.figures.buildOfficial({ color: colors[idx % colors.length], pose: "listen", phase: idx * 0.7 });
      var p = slots[idx % slots.length];
      g.position.set(p[0], 0, p[2]);
      g.rotation.y = Math.PI;
      g.scale.setScalar(1.22);
      root.add(g);
      C.roles[r.id] = { role: r, group: g, pose: "listen", baseY: 0 };
      C.roleList.push(C.roles[r.id]);
      attachCourtNameplate(C.roles[r.id]);
    });

    // 侍卫
    [[-12.5, -5.5], [12.5, -5.5], [-12.5, 5.5], [12.5, 5.5]].forEach(function (p, idx) {
      var gd = HS.figures.buildGuard({ color: 0x3f463e, phase: idx });
      gd.position.set(p[0], 0, p[1]);
      gd.rotation.y = p[0] < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      gd.scale.setScalar(1.15);
      root.add(gd);
    });

    var halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.84, 48),
      new THREE.MeshBasicMaterial({
        color: 0xe8c46a, transparent: true, opacity: 0.7, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.045;
    halo.visible = false;
    halo.renderOrder = 4;
    root.add(halo);
    C.halo = halo;

    // 烛台
    [[-9, -2], [9, -2], [-9, 4.5], [9, 4.5]].forEach(function (p, idx) {
      var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6), wood);
      stand.position.set(p[0], 1.1, p[1]); root.add(stand);
      var flame = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0.95 }));
      flame.position.set(p[0], 2.35, p[1]);
      root.add(flame);
      C.flames.push(flame);
      if (idx < 2) {
        var pl = new THREE.PointLight(0xffb35c, 0.55, 16, 2);
        pl.position.set(p[0], 2.5, p[1]);
        scene.add(pl);
        C.lights.push(pl);
      }
    });

    var first = (data.phases || [])[0];
    if (first) courtApplyPhase(C, first, 0, true);

    resize();
    applyViewOffset();
    courtUpdateUI(C, true);
  }

  function courtApplyPhase(C, ph, pi, silent) {
    if (!ph) return;
    C.roleList.forEach(function (r) {
      var pose = "listen";
      if (r.role.id === "emperor") pose = ph.speaker === "emperor" ? (ph.gesture || "speak") : "seat";
      else if (r.role.id === ph.speaker) pose = ph.gesture || "speak";
      if (pose === "raise") pose = "speak";
      if (pose === "seat") pose = "listen";
      r.pose = pose;
      if (r.group.userData.setPose) r.group.userData.setPose(pose);
    });
    courtFocus(C, ph);
    var sp = C.roles[ph.speaker];
    var text = ph.log || "";
    if (sp) {
      var prefix = sp.role.name + "：";
      if (text.indexOf(prefix) === 0) text = text.slice(prefix.length);
    }
    if (HS.ui && HS.ui.setCourtSpeaker) {
      HS.ui.setCourtSpeaker(sp ? courtRoleLabel(sp.role) : "朝堂", text);
    }
    if (!silent && ph.log && HS.ui && HS.ui.appendWarLog) HS.ui.appendWarLog(ph.log, "phase", pi);
  }

  function courtStep(C, dt) {
    var dur = C.data.duration || 26;
    C.time = Math.min(dur, C.time + dt);
    var t = C.time / dur;
    var ph = null, pi = -1;
    (C.data.phases || []).forEach(function (p, i) { if (t >= p.at) { ph = p; pi = i; } });
    if (pi !== C.phaseIndex) {
      C.phaseIndex = pi;
      courtApplyPhase(C, ph, pi);
    }
    if (C.time >= dur) {
      S.playing = false;
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
    }
  }

  function courtUpdate(C, dt) {
    var t = C.time / (C.data.duration || 26);
    C.roleList.forEach(function (r) {
      if (r.group.userData.update) r.group.userData.update(C.time, r.pose);
      r.group.position.y += r.baseY || 0;
    });
    C.flames.forEach(function (f, i) {
      var s = 0.85 + Math.sin(C.time * 7 + i * 1.7) * 0.15;
      f.scale.set(s, s * (1.15 + Math.sin(C.time * 9 + i) * 0.2), s);
      f.material.opacity = 0.8 + Math.sin(C.time * 6 + i) * 0.15;
    });
    C.lights.forEach(function (l, i) { l.intensity = 0.48 + Math.sin(C.time * 5 + i * 2) * 0.08; });
    if (C.halo && C.halo.visible) {
      var pulse = (C.haloBase || 1) * (1 + Math.sin(C.time * 3.2) * 0.08);
      C.halo.scale.set(pulse, pulse, pulse);
      C.halo.material.opacity = 0.6 + Math.sin(C.time * 3.2) * 0.2;
    }
    var ph = null, pi = -1;
    (C.data.phases || []).forEach(function (p, i) { if (t >= p.at) { ph = p; pi = i; } });
    if (HS.ui && HS.ui.setWarPhase) HS.ui.setWarPhase(ph, t, pi, C.data.phases);
    courtUpdateUI(C, false);
  }

  function courtUpdateUI(C, force) {
    var now = performance.now();
    if (!force && C.lastUI > 0 && now - C.lastUI < 180) return;
    C.lastUI = now;
    if (HS.ui) {
      if (HS.ui.setWarSpeed) HS.ui.setWarSpeed(S.speed || 1);
      if (HS.ui.setWarPlaying) HS.ui.setWarPlaying(S.playing);
    }
  }

  function courtFastForward(C, target) {
    var guard = 0;
    while (C.time < target && guard++ < 4000) courtStep(C, 0.1);
    courtUpdate(C, 0);
  }

  /* ================================================================== *
   * 360° VR
   * ================================================================== */
  function enterVRScene(data, ev) {
    if (!view) {
      view = document.getElementById("sceneView");
      canvas = document.getElementById("sceneCanvas");
    }
    teardown();
    S.data = data; S.event = ev; S.t = 0; S.speed = 1; S.playing = true; S.active = true;
    S.war = null; S.battle = null; S.court = null;
    if (HS.stage && HS.stage.controls) HS.stage.controls.enabled = false;
    if (HS.labels && HS.labels.root) HS.labels.root.style.display = "none";
    view.hidden = false;
    if (HS.ui && HS.ui.openVRScene) HS.ui.openVRScene(data, ev);
    if (HS.vr360) HS.vr360.show({ pano: data.pano, image: data.image, hotspots: data.hotspots || [], auto: true, speed: 1 });
    return true;
  }

  function loop(now) {
    if (!S.active) return;
    S.raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - S.last) / 1000);
    S.last = now;
    if (S.data && S.data.type === "war" && S.war) {
      if (S.playing) {
        S.warAcc += dt * (S.war.speed || 1);
        var tick = S.data.tick || 0.1, guard = 0;
        while (S.warAcc >= tick && guard++ < 20) {
          warStep(S.war, tick);
          S.warAcc -= tick;
        }
      }
      warUpdateVisuals(S.war, dt);
      if (S.controls) S.controls.update();
      if (S.renderer && S.scene && S.camera) S.renderer.render(S.scene, S.camera);
      return;
    }
    if (S.data && S.data.type === "battle" && S.battle) {
      if (S.playing) battleStep(S.battle, dt * (S.speed || 1));
      battleUpdate(S.battle, dt);
      if (S.controls) S.controls.update();
      if (S.renderer && S.scene && S.camera) S.renderer.render(S.scene, S.camera);
      return;
    }
    if (S.data && S.data.type === "court" && S.court) {
      if (S.playing) courtStep(S.court, dt * (S.speed || 1));
      courtUpdate(S.court, dt);
      if (S.controls) S.controls.update();
      if (S.renderer && S.scene && S.camera) S.renderer.render(S.scene, S.camera);
      return;
    }
    if (S.playing) {
      S.t = Math.min(1, S.t + dt / ((S.data && S.data.duration) || 16));
      if (S.t >= 0.44 && !S.clashDone) { S.clashDone = true; spawnClash(); }
    }
    updateUnits(S.t);
    updateFx(dt);
    if (S.controls) S.controls.update();
    if (S.renderer && S.scene && S.camera) S.renderer.render(S.scene, S.camera);
    if (HS.ui && HS.ui.setScenePhase) HS.ui.setScenePhase(phaseAt(S.t), S.t);
  }

  S.enter = function (data, ev) {
    if (!data) return false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (data.type === "vr") return enterVRScene(data, ev);
    init();
    S.data = data;
    S.event = ev;
    S.t = 0;
    S.speed = 1;
    S.warAcc = 0;
    S.playing = true;
    S.active = true;
    if (data.type === "war") {
      warBuild(data);
      if (HS.ui && HS.ui.openWarScene) HS.ui.openWarScene(data, ev);
      else if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
    } else if (data.type === "battle") {
      battleBuild(data);
      if (HS.ui && HS.ui.openBattleScene) HS.ui.openBattleScene(data, ev);
      else if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
    } else if (data.type === "court") {
      courtBuild(data);
      if (HS.ui && HS.ui.openCourtScene) HS.ui.openCourtScene(data, ev);
      else if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
    } else if (data.type === "battlefield") {
      S.clashDone = false;
      build(data);
      if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
    } else {
      return false;
    }
    if (HS.stage && HS.stage.controls) HS.stage.controls.enabled = false;
    if (HS.labels && HS.labels.root) HS.labels.root.style.display = "none";
    view.hidden = false;
    resize();
    applyViewOffset();
    S.last = performance.now();
    S.raf = requestAnimationFrame(loop);
    return true;
  };

  S.exit = function () {
    if (!S.active) return false;
    S.active = false;
    S.playing = false;
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = 0;
    if (HS.vr360) HS.vr360.hide();
    if (HS.ui && HS.ui.closeScene) HS.ui.closeScene();
    if (HS.stage && HS.stage.controls) HS.stage.controls.enabled = true;
    if (HS.labels && HS.labels.root) HS.labels.root.style.display = "";
    teardown();
    S.data = null;
    S.event = null;
    S.t = 0;
    return true;
  };

  S.toggle = function () {
    if (!S.active) return false;
    if (S.data && S.data.type === "vr") {
      var st = HS.vr360 ? HS.vr360.state() : { auto: false };
      var on = !st.auto;
      if (HS.vr360) HS.vr360.setAuto(on);
      if (HS.ui && HS.ui.setScenePlaying) HS.ui.setScenePlaying(on);
      return on;
    }
    if (S.data && (S.data.type === "battle" || S.data.type === "court")) {
      var obj = S.data.type === "battle" ? S.battle : S.court;
      if (!S.playing && obj && obj.time >= (S.data.duration || 24)) {
        S.restart();
        return true;
      }
      S.playing = !S.playing;
      if (HS.ui && HS.ui.setScenePlaying) HS.ui.setScenePlaying(S.playing);
      return S.playing;
    }
    if (S.data && S.data.type === "war" && S.war) {
      if (!S.playing && S.war.time >= (S.data.duration || 30)) {
        S.restart();
        return true;
      }
      S.playing = !S.playing;
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(S.playing);
      return S.playing;
    }
    S.playing = !S.playing;
    if (S.playing && S.t >= 1) {
      S.t = 0;
      S.clashDone = false;
    }
    if (HS.ui && HS.ui.setScenePlaying) HS.ui.setScenePlaying(S.playing);
    return S.playing;
  };

  S.setTime = function (t) {
    t = Math.max(0, Math.min(1, t || 0));
    if (S.data && S.data.type === "war" && S.war) {
      var target = t * (S.data.duration || 30);
      if (target < S.war.time) warBuild(S.data);
      warFastForward(S.war, target);
      S.playing = false;
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
      return;
    }
    if (S.data && S.data.type === "battle" && S.battle) {
      battleBuild(S.data);
      battleFastForward(S.battle, t * (S.data.duration || 24));
      S.playing = false;
      return;
    }
    if (S.data && S.data.type === "court" && S.court) {
      courtBuild(S.data);
      courtFastForward(S.court, t * (S.data.duration || 26));
      S.playing = false;
      return;
    }
    S.t = t;
    updateUnits(S.t);
    if (HS.ui && HS.ui.setScenePhase) HS.ui.setScenePhase(phaseAt(S.t), S.t);
  };

  S.setSpeed = function (n) {
    n = n === 4 ? 4 : n === 2 ? 2 : 1;
    S.speed = n;
    if (S.war) S.war.speed = n;
    if (S.data && S.data.type === "vr" && HS.vr360) HS.vr360.setSpeed(n);
    if (HS.ui && HS.ui.setWarSpeed) HS.ui.setWarSpeed(n);
    return n;
  };

  S.restart = function () {
    if (!S.data) return false;
    if (S.data.type === "war") {
      warBuild(S.data);
      S.playing = true;
      S.warAcc = 0;
    } else if (S.data.type === "battle") {
      battleBuild(S.data);
      S.playing = true;
    } else if (S.data.type === "court") {
      courtBuild(S.data);
      S.playing = true;
    } else if (S.data.type === "vr") {
      if (HS.vr360) HS.vr360.reset();
      S.playing = true;
    } else {
      return false;
    }
    if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(true);
    if (HS.ui && HS.ui.setWarSpeed) HS.ui.setWarSpeed(S.speed);
    return true;
  };

  S.goToPhase = function (index) {
    if (!S.data) return false;
    if (S.data.type === "vr") { if (HS.vr360) HS.vr360.reset(); return true; }
    var phases = S.data.phases || [];
    if (!phases[index]) return false;
    var target = phases[index].at * (S.data.duration || 30);
    if (S.data.type === "battle") {
      battleBuild(S.data);
      battleFastForward(S.battle, target);
    } else if (S.data.type === "court") {
      courtBuild(S.data);
      courtFastForward(S.court, target);
    } else {
      warBuild(S.data);
      warFastForward(S.war, target);
    }
    S.playing = false;
    if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
    return true;
  };

  S.setWarLayer = function (name, on) {
    if (S.data && S.data.type === "battle" && S.battle) {
      var b = S.battle;
      if (name === "units" && b.unitGroup) b.unitGroup.visible = !!on;
      else if (name === "labels" && b.labelGroup) b.labelGroup.visible = !!on;
      else if (name === "grid" && b.gridMesh) b.gridMesh.visible = !!on;
      if (HS.ui && HS.ui.setWarLayerBox) HS.ui.setWarLayerBox(name, on);
      return;
    }
    var w = S.war;
    if (!w) return;
    if (name === "front") {
      w.frontGroup.userData.on = !!on;
      w.frontGroup.visible = !!on && w.frontGroup.children.length > 0;
    } else if (name === "routes" && w.routeGroup) w.routeGroup.visible = !!on;
    else if (name === "units" && w.unitGroup) w.unitGroup.visible = !!on;
    else if (name === "battles" && w.battleGroup) w.battleGroup.visible = !!on;
    else if (name === "labels") w.provinceList.forEach(function (p) { if (p.label) p.label.visible = !!on; });
    else if (name === "territory") {
      if (w.provinceMesh) w.provinceMesh.visible = !!on;
      w.provinceList.forEach(function (p) { if (p.fill) p.fill.visible = !!on; });
    }
    if (HS.ui && HS.ui.setWarLayerBox) HS.ui.setWarLayerBox(name, on);
  };

  S.warUnitScreen = function (id) {
    if (!S.war || !S.camera) return null;
    var u = S.war.units.filter(function (x) { return x.id === id; })[0];
    if (!u || !u.sprite) return null;
    var p = u.sprite.getWorldPosition(new THREE.Vector3()).project(S.camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
      visible: p.z < 1
    };
  };

  S.state = function () {
    if (S.data && S.data.type === "vr") {
      var vs = HS.vr360 ? HS.vr360.state() : { auto: false, speed: 1 };
      return { active: S.active, playing: vs.auto, type: "vr", t: 0, eventId: S.event ? S.event.id : "", speed: vs.speed };
    }
    if (S.data && S.data.type === "battle" && S.battle) {
      var PB = battlePhase(S.battle), b = S.battle;
      return {
        active: S.active, playing: S.playing, type: "battle", t: PB.t,
        eventId: S.event ? S.event.id : "", phase: PB.phase ? PB.phase.label : "", phaseIndex: PB.index,
        progress: PB.t, speed: S.speed,
        grid: b.gridMesh ? {
          cols: b.gridCfg.cols, rows: b.gridCfg.rows,
          captureRadius: b.gridCfg.captureRadius, visible: b.gridMesh.visible
        } : null,
        unitsVisible: !!(b.unitGroup && b.unitGroup.visible),
        labelsVisible: !!(b.labelGroup && b.labelGroup.visible),
        units: b.units.map(function (u) {
          var hp = battleHealth(b, u, PB.t);
          return {
            label: u.def.label, side: u.side.id,
            strength: Math.round(hp.strength), morale: Math.round(hp.morale),
            routed: hp.routed
          };
        })
      };
    }
    if (S.data && S.data.type === "court" && S.court) {
      var C = S.court, ct = C.time / (S.data.duration || 26);
      var cph = null, cpi = -1;
      (S.data.phases || []).forEach(function (p, i) { if (ct >= p.at) { cph = p; cpi = i; } });
      var sp = cph && C.roles[cph.speaker];
      return {
        active: S.active, playing: S.playing, type: "court", t: ct,
        eventId: S.event ? S.event.id : "", phase: cph ? cph.label : "", phaseIndex: cpi,
        progress: ct, speed: S.speed,
        speaker: cph ? cph.speaker : "", speakerLabel: sp ? courtRoleLabel(sp.role) : "",
        halo: !!(C.halo && C.halo.visible),
        roles: C.roleList.map(function (r) {
          return {
            id: r.role.id, name: r.role.name, rank: r.role.rank || "",
            label: courtRoleLabel(r.role), active: !!(cph && r.role.id === cph.speaker),
            nameplateOpacity: r.nameplate ? r.nameplate.material.opacity : 0
          };
        })
      };
    }
    if (S.data && S.data.type === "war" && S.war) {
      var w = S.war;
      var t = w.time / (S.data.duration || 30);
      var ph = null, pi = -1;
      (S.data.phases || []).forEach(function (p, i) { if (t >= p.at) { ph = p; pi = i; } });
      return {
        active: S.active, playing: S.playing, type: "war", t: t,
        eventId: S.event ? S.event.id : "",
        warTime: w.time, phase: ph ? ph.label : "", phaseIndex: pi,
        progress: t, speed: w.speed, stats: w.stats
      };
    }
    return { active: S.active, playing: S.playing, type: S.data ? S.data.type : "", t: S.t, eventId: S.event ? S.event.id : "" };
  };

  function teardown() {
    if (HS.vr360 && HS.vr360.active) HS.vr360.hide();
    warTeardown();
    S.battle = null;
    S.court = null;
    if (S.controls && S.controls.dispose) S.controls.dispose();
    S.controls = null;
    if (S.root) HS.dispose(S.root);
    S.root = null;
    if (S.scene) {
      S.scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function (m) { if (m) m.dispose(); });
        }
      });
      S.scene = null;
    }
    S.camera = null;
    S.fx = [];
    S.clashDone = false;
  }
})();
