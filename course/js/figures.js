/*
 * figures.js —— 低多边形小人：士兵/骑兵/文官/皇帝/侍卫，编队动画与地图微缩情景。
 * 全部程序化几何 + 纯色材质；不加载外部模型/贴图。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util;
  var DEG = Math.PI / 180;

  var _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
  var _e = new THREE.Euler(), _m = new THREE.Matrix4();

  function stdMat(color, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: color instanceof THREE.Color ? color.clone() : color,
      roughness: rough == null ? 0.9 : rough,
      metalness: metal == null ? 0.05 : metal,
      flatShading: true
    });
  }

  function bake(geo, x, y, z, rx, ry, rz) {
    _e.set(rx || 0, ry || 0, rz || 0);
    _q.setFromEuler(_e);
    _p.set(x || 0, y || 0, z || 0);
    _s.set(1, 1, 1);
    _m.compose(_p, _q, _s);
    geo.applyMatrix4(_m);
    return geo;
  }

  function mergeGeoms(list) {
    var pos = [], norm = [];
    list.forEach(function (g) {
      var ng = g.index ? g.toNonIndexed() : g;
      var p = ng.getAttribute("position"), n = ng.getAttribute("normal");
      for (var i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        if (n) norm.push(n.getX(i), n.getY(i), n.getZ(i));
      }
      if (ng !== g) ng.dispose();
      g.dispose();
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    if (norm.length) out.setAttribute("normal", new THREE.Float32BufferAttribute(norm, 3));
    out.computeBoundingSphere();
    return out;
  }

  function setInst(im, idx, x, y, z, ex, ey, ez, sx, sy, sz) {
    _e.set(ex || 0, ey || 0, ez || 0);
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    _s.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz);
    _m.compose(_p, _q, _s);
    im.setMatrixAt(idx, _m);
  }

  function inst(geo, mat, count) {
    var im = new THREE.InstancedMesh(geo, mat, count);
    im.castShadow = true;
    im.receiveShadow = true;
    im.frustumCulled = false;
    return im;
  }

  /* ================================================================== *
   * 步兵 / 骑兵编队
   * ================================================================== */
  function buildFormation(opts) {
    opts = opts || {};
    var count = Math.max(1, opts.count || 24);
    var type = opts.type === "cavalry" ? "cavalry" : "infantry";
    var color = new THREE.Color(opts.color || "#c8402f");
    var scale = opts.scale || 1;
    var group = new THREE.Group();
    var dark = color.clone().multiplyScalar(0.62);
    var cloth = stdMat(color, 0.92, 0.02);
    var robeDark = stdMat(dark, 0.95, 0.02);
    var skin = stdMat(0xd8b98a, 0.92, 0);
    var armor = stdMat(0x3c403b, 0.85, 0.18);
    var wood = stdMat(0x5b3b24, 0.95, 0);
    var metal = stdMat(0xb9b3a2, 0.45, 0.55);
    var horseMat = stdMat(0x4a3a2c, 0.95, 0.02);

    var cols = Math.max(1, Math.ceil(Math.sqrt(count * (type === "cavalry" ? 0.85 : 1.3))));
    var rows = Math.max(1, Math.ceil(count / cols));
    var spacing = opts.spacing || (type === "cavalry" ? 1.05 : 0.62);
    var base = [];
    var rnd = U.rng(U.hash((opts.seed || 1) + ":" + count + ":" + type));
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols && base.length < count; c++) {
        base.push({
          x: (c - (cols - 1) / 2) * spacing + (rnd() - 0.5) * 0.08,
          z: (r - (rows - 1) / 2) * spacing + (rnd() - 0.5) * 0.08,
          phase: rnd() * Math.PI * 2,
          tone: rnd()
        });
      }
    }

    var bodyGeo = new THREE.CylinderGeometry(type === "cavalry" ? 0.16 : 0.16, type === "cavalry" ? 0.22 : 0.23, type === "cavalry" ? 0.52 : 0.55, 5);
    var headGeo = new THREE.IcosahedronGeometry(0.13, 0);
    var helmetGeo = new THREE.ConeGeometry(0.19, 0.16, 5);
    var legGeo = new THREE.BoxGeometry(0.09, 0.42, 0.09);
    var armGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
    var shieldGeo = new THREE.BoxGeometry(0.34, 0.44, 0.06);
    var spearGeo = mergeGeoms([
      bake(new THREE.CylinderGeometry(0.022, 0.022, 1.45, 4), 0, 0, 0),
      bake(new THREE.ConeGeometry(0.055, 0.18, 4), 0, 0.815, 0)
    ]);

    var countN = base.length;
    var body = inst(bodyGeo, cloth, countN);
    var head = inst(headGeo, skin, countN);
    var helmet = inst(helmetGeo, armor, countN);
    var legL = inst(legGeo, robeDark, countN);
    var legR = inst(legGeo, robeDark, countN);
    var armL = inst(armGeo, cloth, countN);
    var armR = inst(armGeo, cloth, countN);
    var shield = inst(shieldGeo, robeDark, countN);
    var spear = inst(spearGeo, wood, countN);
    group.add(body, head, helmet, legL, legR, armL, armR, shield, spear);

    var horse = null, riderBody = null, riderHead = null, riderHelmet = null;
    if (type === "cavalry") {
      var horseGeo = mergeGeoms([
        bake(new THREE.BoxGeometry(0.36, 0.4, 0.86), 0, 0.72, 0),
        bake(new THREE.BoxGeometry(0.22, 0.34, 0.32), 0, 0.96, 0.44),
        bake(new THREE.BoxGeometry(0.18, 0.2, 0.3), 0, 1.12, 0.66),
        bake(new THREE.BoxGeometry(0.1, 0.5, 0.1), -0.12, 0.26, -0.28),
        bake(new THREE.BoxGeometry(0.1, 0.5, 0.1), 0.12, 0.26, -0.28),
        bake(new THREE.BoxGeometry(0.1, 0.5, 0.1), -0.12, 0.26, 0.28),
        bake(new THREE.BoxGeometry(0.1, 0.5, 0.1), 0.12, 0.26, 0.28)
      ]);
      horse = inst(horseGeo, horseMat, countN);
      group.add(horse);
      group.remove(body, legL, legR);
      riderBody = inst(bodyGeo, cloth, countN);
      riderHead = inst(headGeo, skin, countN);
      riderHelmet = inst(helmetGeo, armor, countN);
      group.add(riderBody, riderHead, riderHelmet);
    }

    // 军旗（每个单位两面）
    var poleGeo = new THREE.CylinderGeometry(0.026, 0.034, 3.2, 5);
    var poleMat = stdMat(0x5a3b24, 0.95, 0);
    var flagMat = new THREE.MeshStandardMaterial({ color: color.clone(), roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
    var flags = [];
    [-1, 1].forEach(function (side) {
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(side * (cols * spacing * 0.5 + 0.5), 1.6, -rows * spacing * 0.5 - 0.2);
      pole.castShadow = true;
      group.add(pole);
      var flag = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.75, 5, 1), flagMat);
      flag.position.set(pole.position.x + 0.68, 2.85, pole.position.z);
      flag.castShadow = true;
      group.add(flag);
      flags.push(flag);
    });

    var shadow = new THREE.Mesh(new THREE.CircleGeometry(Math.max(1.6, cols * spacing * 0.62), 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);

    function update(t, state) {
      state = state || "idle";
      var march = state === "march" || state === "charge";
      var fight = state === "fight";
      var rout = state === "rout";
      var speed = march ? 7.2 : fight ? 4.6 : 1.4;

      for (var i = 0; i < countN; i++) {
        var b = base[i];
        var ph = b.phase + t * speed;
        var bob = march ? Math.abs(Math.sin(ph)) * 0.055 : Math.sin(t * 1.5 + b.phase) * 0.012;
        var leg = march ? Math.sin(ph) * 0.62 : 0;
        var arm = march ? -Math.sin(ph) * 0.35 : 0;
        var lean = state === "charge" ? -0.18 : rout ? 0.48 : 0;
        var fall = rout && (i % 3 === 0);
        var px = b.x, pz = b.z, py = bob;
        var s = 1;

        if (type === "cavalry") {
          setInst(horse, i, px, 0.02 + bob * 0.6, pz, 0, 0, 0, 1, 1, 1);
          setInst(riderBody, i, px, 1.24 + bob, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
          setInst(riderHead, i, px, 1.62 + bob, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
          setInst(riderHelmet, i, px, 1.75 + bob, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
          setInst(spear, i, px + 0.3, 1.45 + bob, pz + 0.02, fight ? -1.25 + Math.sin(ph * 2) * 0.25 : state === "charge" ? -1.4 : -0.08, 0, 0, 1, 1, 1);
          setInst(shield, i, px - 0.25, 1.18 + bob, pz + 0.12, 0, -0.2, fall ? 0.8 : 0, fall ? 0 : 1, 1, 1);
          continue;
        }

        setInst(body, i, px, 0.72 + py, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
        setInst(head, i, px, 1.08 + py, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
        setInst(helmet, i, px, 1.21 + py, pz, lean, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
        setInst(legL, i, px - 0.08, 0.25 + py, pz, leg, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
        setInst(legR, i, px + 0.08, 0.25 + py, pz, -leg, 0, fall ? Math.PI / 2 : 0, 1, 1, 1);
        setInst(armL, i, px - 0.23, 0.78 + py, pz, arm, 0, 0.08, 1, 1, 1);
        setInst(armR, i, px + 0.23, 0.78 + py, pz, -arm, 0, -0.08, 1, 1, 1);
        setInst(shield, i, px - 0.25, 0.62 + py, pz + 0.12, 0, -0.2, fall ? 0.8 : 0, fall ? 0 : 1, 1, 1);
        setInst(spear, i, px + 0.28, 0.95 + py, pz + 0.02,
          fight ? -1.2 + Math.sin(ph * 2) * 0.28 : state === "charge" ? -1.35 : -0.08,
          0, 0, 1, 1, 1);
        s += 0;
      }
      body.instanceMatrix.needsUpdate = true;
      head.instanceMatrix.needsUpdate = true;
      helmet.instanceMatrix.needsUpdate = true;
      legL.instanceMatrix.needsUpdate = true;
      legR.instanceMatrix.needsUpdate = true;
      armL.instanceMatrix.needsUpdate = true;
      armR.instanceMatrix.needsUpdate = true;
      shield.instanceMatrix.needsUpdate = true;
      spear.instanceMatrix.needsUpdate = true;
      if (horse) { horse.instanceMatrix.needsUpdate = true; riderBody.instanceMatrix.needsUpdate = true; riderHead.instanceMatrix.needsUpdate = true; riderHelmet.instanceMatrix.needsUpdate = true; }
      for (var f = 0; f < flags.length; f++) {
        flags[f].rotation.y = Math.sin(t * 4.2 + f * 1.7) * 0.16;
        flags[f].rotation.z = Math.sin(t * 3.1 + f) * 0.04;
      }
    }

    update(0, "idle");
    group.rotation.y = (opts.facing == null ? 0 : opts.facing) * DEG;
    group.scale.setScalar(scale);
    group.userData = { count: count, type: type, formation: true, update: update, state: "idle" };
    return group;
  }

  /* ================================================================== *
   * 文官 / 皇帝 / 侍卫
   * ================================================================== */
  function buildOfficial(opts) {
    opts = opts || {};
    var color = opts.color || "#3d5a50";
    var group = new THREE.Group();
    var robeMat = stdMat(color, 0.95, 0.02);
    var trimMat = stdMat(new THREE.Color(color).clone().lerp(new THREE.Color(0xe3c86c), 0.45), 0.85, 0.12);
    var skinMat = stdMat(0xd8b98a, 0.92, 0);
    var hatMat = stdMat(0x191b18, 0.9, 0.05);
    var tabletMat = stdMat(0xcbb27a, 0.7, 0.15);

    var robe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.43, 1.0, 6), robeMat);
    robe.position.y = 0.5;
    robe.castShadow = true;
    group.add(robe);
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.22), robeMat);
    torso.position.y = 0.98;
    torso.castShadow = true;
    group.add(torso);
    var belt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.24), trimMat);
    belt.position.y = 0.78;
    group.add(belt);
    var head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), skinMat);
    head.position.y = 1.28;
    head.castShadow = true;
    group.add(head);
    var hat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.2), hatMat);
    hat.position.y = 1.43;
    hat.castShadow = true;
    group.add(hat);
    var wing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.08), hatMat);
    wing.position.y = 1.42;
    group.add(wing);

    var armL = new THREE.Group(), armR = new THREE.Group();
    armL.position.set(-0.23, 1.08, 0);
    armR.position.set(0.23, 1.08, 0);
    var armGeo = new THREE.BoxGeometry(0.08, 0.42, 0.09);
    var al = new THREE.Mesh(armGeo, robeMat); al.position.y = -0.2; al.castShadow = true; armL.add(al);
    var ar = new THREE.Mesh(armGeo, robeMat); ar.position.y = -0.2; ar.castShadow = true; armR.add(ar);
    group.add(armL, armR);
    var tablet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.03), tabletMat);
    tablet.position.set(-0.04, 0.88, 0.24);
    tablet.rotation.x = -0.25;
    group.add(tablet);

    var pose = opts.pose || "listen";
    var target = { l: 0, r: 0, bow: 0, head: 0 };
    function setPose(p) {
      pose = p || "listen";
      if (pose === "speak") { target.l = 0.55; target.r = 1.25; target.bow = -0.05; target.head = -0.06; }
      else if (pose === "bow") { target.l = 0.9; target.r = 0.9; target.bow = 0.48; target.head = 0.2; }
      else if (pose === "point") { target.l = 0.15; target.r = 1.45; target.bow = 0; target.head = 0; }
      else if (pose === "spread") { target.l = 0.9; target.r = 0.9; target.bow = 0; target.head = 0; }
      else { target.l = 0.1; target.r = 0.1; target.bow = 0; target.head = 0.05; }
    }
    setPose(pose);
    var cur = { l: target.l, r: target.r, bow: target.bow, head: target.head };
    function update(t, p) {
      if (p && p !== pose) setPose(p);
      var k = 0.12;
      cur.l += (target.l - cur.l) * k;
      cur.r += (target.r - cur.r) * k;
      cur.bow += (target.bow - cur.bow) * k;
      cur.head += (target.head - cur.head) * k;
      var bob = Math.sin(t * 1.7 + (opts.phase || 0)) * 0.008;
      armL.rotation.x = cur.l;
      armR.rotation.x = cur.r;
      group.rotation.x = cur.bow;
      head.rotation.y = cur.head + Math.sin(t * 0.8 + (opts.phase || 0)) * 0.03;
      hat.rotation.y = head.rotation.y;
      wing.rotation.y = head.rotation.y;
      group.position.y = bob;
    }
    update(0, pose);
    group.userData = { official: true, pose: pose, setPose: setPose, update: update };
    return group;
  }

  function buildEmperor(opts) {
    opts = opts || {};
    var group = buildOfficial({ color: opts.color || "#8c3a32", pose: "seat", phase: 0.3 });
    group.scale.setScalar(1.12);
    var crownMat = stdMat(0xe0bc62, 0.45, 0.55);
    var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 6), crownMat);
    crown.position.y = 1.53;
    group.add(crown);
    for (var i = 0; i < 5; i++) {
      var bead = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), crownMat);
      bead.position.set(Math.cos(i / 5 * Math.PI * 2) * 0.2, 1.62, Math.sin(i / 5 * Math.PI * 2) * 0.2);
      group.add(bead);
    }
    group.userData.emperor = true;
    return group;
  }

  function buildGuard(opts) {
    opts = opts || {};
    var group = new THREE.Group();
    var armor = stdMat(opts.color || 0x4a4f47, 0.82, 0.2);
    var skin = stdMat(0xd8b98a, 0.92, 0);
    var wood = stdMat(0x5b3b24, 0.95, 0);
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.9, 6), armor);
    body.position.y = 0.62; body.castShadow = true; group.add(body);
    var head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), skin);
    head.position.y = 1.18; head.castShadow = true; group.add(head);
    var helmet = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 5), armor);
    helmet.position.y = 1.31; helmet.castShadow = true; group.add(helmet);
    var halberd = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.8, 4), wood);
    halberd.position.set(0.3, 0.95, 0); halberd.castShadow = true; group.add(halberd);
    var blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), stdMat(0xb9b3a2, 0.4, 0.6));
    blade.position.set(0.3, 1.86, 0); group.add(blade);
    group.userData = { guard: true, update: function (t) { group.position.y = Math.sin(t * 1.3 + (opts.phase || 0)) * 0.006; } };
    return group;
  }

  /* ================================================================== *
   * 地图微缩情景
   * ================================================================== */
  function buildVignette(kind, opts) {
    opts = opts || {};
    var group = new THREE.Group();
    var bronze = stdMat(0x8a6a3a, 0.55, 0.25);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.42, 0.1, 28), bronze);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.035, 6, 36), stdMat(0xd1ab68, 0.35, 0.5));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.11;
    group.add(ring);

    if (kind === "war") {
      var a = buildFormation({ count: 5, type: "infantry", color: opts.accent || "#c8402f", facing: 90, scale: 0.3, seed: 11 });
      a.position.set(-0.5, 0.11, 0.05);
      var b = buildFormation({ count: 5, type: "infantry", color: "#6f8399", facing: -90, scale: 0.3, seed: 22 });
      b.position.set(0.5, 0.11, -0.05);
      group.add(a, b);
      group.userData.update = function (t) {
        a.userData.update(t, "fight");
        b.userData.update(t, "fight");
        group.rotation.y = Math.sin(t * 0.25) * 0.05;
      };
    } else {
      // 小朝堂：四柱、屋顶、案几、文官
      var wood = stdMat(0x4a2a20, 0.9, 0.05);
      var roofMat = stdMat(0x2f4038, 0.92, 0.05);
      var gold = stdMat(0xc9a865, 0.45, 0.35);
      [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.42], [0.55, 0.42]].forEach(function (p) {
        var col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.95, 6), wood);
        col.position.set(p[0], 0.58, p[1]);
        col.castShadow = true;
        group.add(col);
      });
      var roof = new THREE.Mesh(new THREE.ConeGeometry(1.02, 0.38, 4), roofMat);
      roof.position.y = 1.16;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      var roof2 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 1.18), gold);
      roof2.position.y = 1.03;
      group.add(roof2);
      var table = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.36), wood);
      table.position.y = 0.28;
      group.add(table);
      var o1 = buildOfficial({ color: "#5a3a34", pose: "speak", phase: 0.1 });
      o1.position.set(-0.28, 0.12, 0.08); o1.scale.setScalar(0.3); o1.rotation.y = 1.1;
      var o2 = buildOfficial({ color: "#35534c", pose: "listen", phase: 1.7 });
      o2.position.set(0.3, 0.12, -0.05); o2.scale.setScalar(0.3); o2.rotation.y = -1.2;
      var o3 = buildOfficial({ color: "#6b5a3a", pose: "bow", phase: 2.4 });
      o3.position.set(0.02, 0.12, -0.32); o3.scale.setScalar(0.3); o3.rotation.y = 0.1;
      group.add(o1, o2, o3);
      group.userData.update = function (t) {
        o1.userData.update(t, "speak");
        o2.userData.update(t, "listen");
        o3.userData.update(t, "bow");
        group.rotation.y = Math.sin(t * 0.18) * 0.04;
      };
    }
    group.userData.kind = kind;
    return group;
  }

  HS.figures = {
    buildFormation: buildFormation,
    buildOfficial: buildOfficial,
    buildEmperor: buildEmperor,
    buildGuard: buildGuard,
    buildVignette: buildVignette
  };
})();
