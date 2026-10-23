/*
 * scene.js —— 全知视角 3D 场景（当前支持 battlefield）。
 * 独立 canvas + renderer，不干扰主沙盘；进入时暂停地图控制，退出时恢复。
 * 视觉全部由 Three.js 基础几何体 + Canvas 纹理生成，无外部图片。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util;
  var S = (HS.scene = {
    active: false, playing: false, t: 0, data: null, event: null,
    renderer: null, scene: null, camera: null, controls: null, root: null,
    raf: 0, last: 0, fx: [], clashDone: false, _resizeBound: false
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

  function loop(now) {
    if (!S.active) return;
    S.raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - S.last) / 1000);
    S.last = now;
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
    if (!data || data.type !== "battlefield") return false;
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
    S.playing = !S.playing;
    if (S.playing && S.t >= 1) {
      S.t = 0;
      S.clashDone = false;
    }
    if (HS.ui && HS.ui.setScenePlaying) HS.ui.setScenePlaying(S.playing);
    return S.playing;
  };

  S.setTime = function (t) {
    S.t = Math.max(0, Math.min(1, t || 0));
    updateUnits(S.t);
    if (HS.ui && HS.ui.setScenePhase) HS.ui.setScenePhase(phaseAt(S.t), S.t);
  };

  S.state = function () {
    return { active: S.active, playing: S.playing, t: S.t, eventId: S.event ? S.event.id : "" };
  };

  function teardown() {
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
