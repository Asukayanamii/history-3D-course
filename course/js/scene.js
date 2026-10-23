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
          var p1 = new THREE.Vector3(from.cx, 0.9, from.cz);
          var p2 = new THREE.Vector3(to.cx, 0.9, to.cz);
          var retreat = o.type === "retreat";
          var color = retreat ? "#9fb3c9" : sideColor(war, u.side);
          if (retreat) {
            var mid = p1.clone().lerp(p2, 0.5); mid.y = 1.5;
            var lineGeo = new THREE.BufferGeometry().setFromPoints([p1, mid, p2]);
            var line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({
              color: color, dashSize: 1.0, gapSize: 0.7, transparent: true, opacity: 0.8
            }));
            line.computeLineDistances();
            g.add(line);
          } else {
            var mid2 = p1.clone().lerp(p2, 0.5); mid2.y = 1.9;
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
      var pts = b.points.map(function (p) { return new THREE.Vector3(p[0], 0.32, p[1]); });
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
    return new THREE.Vector3(x + ox, 2.9, z + oz);
  }
  function warBuild(data) {
    teardown();
    var war = warReset(data);
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07100e);
    scene.fog = new THREE.Fog(0x07100e, 120, 220);
    S.scene = scene;

    var c = data.camera || {};
    var dist = Math.max(20, Math.min(120, c.dist || 62));
    var polar = (c.polar == null ? 52 : c.polar) * U.deg;
    var az = (c.az == null ? 0 : c.az) * U.deg;
    var target = c.target || [0, 0];
    var cam = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    cam.position.set(target[0] + dist * Math.sin(polar) * Math.sin(az), dist * Math.cos(polar), target[1] + dist * Math.sin(polar) * Math.cos(az));
    cam.lookAt(target[0], 0, target[1]);
    S.camera = cam;
    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enableDamping = true; oc.dampingFactor = 0.08; oc.enablePan = false;
    oc.rotateSpeed = 0.45; oc.zoomSpeed = 0.8;
    oc.minDistance = 22; oc.maxDistance = 130;
    oc.minPolarAngle = 18 * U.deg; oc.maxPolarAngle = 74 * U.deg;
    oc.autoRotate = false;
    oc.target.set(target[0], 0, target[1]);
    oc.update();
    S.controls = oc;

    var root = new THREE.Group(); S.root = root; root.scale.z = -1; scene.add(root);
    scene.add(new THREE.HemisphereLight(0xd8e8d8, 0x22170f, 0.8));
    var key = new THREE.DirectionalLight(0xffe0b0, 0.9);
    key.position.set(-40, 70, 30); scene.add(key);

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 90),
      new THREE.MeshBasicMaterial({ color: 0x0b1714 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.25; root.add(ground);
    var grid = new THREE.GridHelper(90, 18, 0x1b302a, 0x10231f);
    grid.position.y = -0.18; grid.material.transparent = true; grid.material.opacity = 0.35; root.add(grid);

    // 省份
    war.provinceList.forEach(function (p) {
      var shape = new THREE.Shape(p.def.polygon.map(function (pt) { return new THREE.Vector2(pt[0], -pt[1]); }));
      var geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      var mat = new THREE.MeshBasicMaterial({
        color: sideColor(war, p.owner), transparent: true, opacity: 0.38,
        depthWrite: false, side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.02;
      mesh.userData.provinceId = p.id;
      root.add(mesh);
      p.fill = mesh;
      var pts = p.def.polygon.map(function (pt) { return new THREE.Vector3(pt[0], 0.08, pt[1]); });
      var bgeo = new THREE.BufferGeometry().setFromPoints(pts);
      var border = new THREE.LineLoop(bgeo, new THREE.LineBasicMaterial({ color: 0xb7a37b, transparent: true, opacity: 0.55 }));
      root.add(border);
      p.border = border;
      var lb = makeLabelSprite(p.def.name, "#f3e9d2");
      lb.position.set(p.cx, 1.15, p.cz + 6.5);
      lb.scale.set(Math.max(6, p.def.name.length * 3.2), 3.2, 1);
      root.add(lb);
      p.label = lb;
    });

    // 城市点 + 河流
    (data.map.cities || []).forEach(function (city) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.9, 20),
        new THREE.MeshBasicMaterial({ color: 0xd8b56a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(city.pos[0], 0.14, city.pos[1]);
      root.add(ring);
    });
    (data.map.rivers || []).forEach(function (r) {
      var pts = r.points.map(function (p) { return new THREE.Vector3(p[0], 0.15, p[1]); });
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x6fb7c0, transparent: true, opacity: 0.7 }));
      root.add(line);
    });

    war.frontGroup = new THREE.Group();
    war.frontGroup.userData = { on: true };
    root.add(war.frontGroup);
    war.battleGroup = new THREE.Group(); root.add(war.battleGroup);
    war.unitGroup = new THREE.Group(); root.add(war.unitGroup);

    // 单位
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
      sp.position.copy(warUnitPos(war, u));
      war.unitGroup.add(sp);
      war.unitSprites.push(sp);
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
    warLog(war, p.def.name + "易手：" + s.name, "occupy", war.phaseIndex);
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
    ring.position.set(p.cx, 0.5, p.cz);
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
    war.provinceList.forEach(function (p) {
      if (p.fill) p.fill.material.color.lerp(p.targetColor, 0.08);
    });
    war.units.forEach(function (u) {
      if (!u.sprite) return;
      u.sprite.position.copy(warUnitPos(war, u));
      u.sprite.material.opacity = u.routed ? 0.42 : 1;
      if (u.routed) u.sprite.material.color.set(0x9a9a9a); else u.sprite.material.color.set(0xffffff);
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
    war.provinceList.forEach(function (p) {
      if (p.fill) p.fill.material.color.copy(p.targetColor);
    });
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
      var provMeshes = war.provinceList.map(function (p) { return p.fill; }).filter(Boolean);
      var ph = ray.intersectObjects(provMeshes, false);
      if (ph.length) {
        var p = war.provinces[ph[0].object.userData.provinceId];
        if (p && HS.ui && HS.ui.showWarTip) {
          var s = sideOf(war, p.owner);
          var units = warUnitsIn(war, p.id).map(function (u) { return u.name; }).join("、") || "无";
          HS.ui.showWarTip("<b>" + p.def.name + "</b><br>控制：" + s.name + " · 地形：" + p.def.terrain + "<br>驻军：" + units, e.clientX, e.clientY);
          canvas.style.cursor = "help";
          return;
        }
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
    if (data.type === "war") {
      init();
      S.data = data;
      S.event = ev;
      S.t = 0;
      S.speed = 1;
      S.warAcc = 0;
      S.playing = true;
      S.active = true;
      warBuild(data);
      if (HS.ui && HS.ui.openWarScene) HS.ui.openWarScene(data, ev);
      else if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
      if (HS.stage && HS.stage.controls) HS.stage.controls.enabled = false;
      if (HS.labels && HS.labels.root) HS.labels.root.style.display = "none";
      view.hidden = false;
      resize();
      applyViewOffset();
      S.last = performance.now();
      S.raf = requestAnimationFrame(loop);
      return true;
    }
    if (data.type !== "battlefield") return false;
    init();
    S.data = data;
    S.event = ev;
    S.t = 0;
    S.clashDone = false;
    S.playing = true;
    S.active = true;
    build(data);
    if (HS.ui && HS.ui.openScene) HS.ui.openScene(data, ev);
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
      if (target < S.war.time) {
        warBuild(S.data);
      }
      warFastForward(S.war, target);
      S.playing = false;
      if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
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
    if (HS.ui && HS.ui.setWarSpeed) HS.ui.setWarSpeed(n);
    return n;
  };

  S.restart = function () {
    if (!S.data || S.data.type !== "war") return false;
    warBuild(S.data);
    S.playing = true;
    S.warAcc = 0;
    if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(true);
    if (HS.ui && HS.ui.setWarSpeed) HS.ui.setWarSpeed(S.speed);
    return true;
  };

  S.goToPhase = function (index) {
    if (!S.data || S.data.type !== "war") return false;
    var phases = S.data.phases || [];
    if (!phases[index]) return false;
    var target = phases[index].at * (S.data.duration || 30);
    warBuild(S.data);
    warFastForward(S.war, target);
    S.playing = false;
    if (HS.ui && HS.ui.setWarPlaying) HS.ui.setWarPlaying(false);
    return true;
  };

  S.setWarLayer = function (name, on) {
    var w = S.war;
    if (!w) return;
    if (name === "front") {
      w.frontGroup.userData.on = !!on;
      w.frontGroup.visible = !!on && w.frontGroup.children.length > 0;
    } else if (name === "routes" && w.routeGroup) w.routeGroup.visible = !!on;
    else if (name === "units" && w.unitGroup) w.unitGroup.visible = !!on;
    else if (name === "battles" && w.battleGroup) w.battleGroup.visible = !!on;
    else if (name === "labels") w.provinceList.forEach(function (p) { if (p.label) p.label.visible = !!on; });
    else if (name === "territory") w.provinceList.forEach(function (p) { if (p.fill) p.fill.visible = !!on; });
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
    warTeardown();
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
