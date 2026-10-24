/*
 * map.js —— 博物馆沙盘：真实 DEM 地形、海陆、等高线、势力覆盖层、河流、地名。
 * 有 DEM 时使用 data/dem/regions.js 的真实高程；无 DEM 时回退到旧的手写山脊 + 噪声。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util, P = HS.proj;

  /* ------------------------------------------------------------------ *
   * 示意海岸线（仅 fallback；有 DEM 时用高程海陆掩膜）
   * ------------------------------------------------------------------ */
  var COAST = {
    sea: [
      [124.3, 39.9], [123.3, 39.6], [122.3, 39.2], [121.6, 38.9], [121.2, 38.8], [121.6, 39.5], [122.0, 40.3],
      [122.2, 40.7], [121.8, 41.0], [121.1, 40.9], [120.6, 40.4], [119.6, 39.9], [118.9, 39.2], [118.0, 39.1],
      [117.7, 38.9], [117.6, 38.4], [118.0, 38.0], [118.9, 37.7], [119.2, 37.2], [119.8, 37.2], [120.3, 37.6],
      [120.8, 37.8], [121.4, 37.5], [122.1, 37.5], [122.6, 37.3], [122.4, 36.9], [121.5, 36.7], [120.6, 36.2],
      [120.2, 35.9], [119.6, 35.4], [119.3, 34.8], [119.8, 34.4], [120.4, 33.6], [120.9, 32.7], [121.4, 32.3],
      [121.9, 31.7], [121.9, 30.9], [121.3, 30.7], [120.9, 30.4], [121.6, 30.0], [122.0, 29.8], [121.9, 29.1],
      [121.5, 28.4], [120.9, 27.9], [120.5, 27.2], [120.0, 26.6], [119.7, 26.0], [119.6, 25.4], [118.9, 24.9],
      [118.2, 24.5], [117.6, 24.0], [117.0, 23.6], [116.6, 23.2], [115.6, 22.8], [114.9, 22.6], [114.2, 22.3],
      [113.7, 22.4], [113.2, 22.0], [112.4, 21.7], [111.3, 21.5], [110.5, 21.2], [110.3, 20.6], [110.0, 20.3],
      [109.7, 21.0], [109.6, 21.5], [109.0, 21.6], [108.3, 21.6], [107.4, 21.3], [106.7, 20.7], [106.1, 20.0],
      [105.8, 19.1], [105.7, 18.4], [106.4, 17.6], [107.1, 16.8], [108.2, 16.1], [108.9, 15.0],
      [140, 15], [140, 34], [126.3, 34.4], [126.4, 35.0], [126.2, 36.5], [126.5, 37.6], [125.3, 37.7],
      [124.7, 38.1], [125.1, 38.8], [124.7, 39.6]
    ],
    islands: [
      [[108.6, 19.1], [109.2, 18.4], [109.6, 18.2], [110.4, 18.6], [111.0, 19.6], [110.7, 20.1], [110.0, 20.1], [109.3, 19.9], [108.7, 19.6]],
      [[120.1, 23.0], [120.7, 22.0], [121.0, 22.5], [121.5, 23.4], [121.9, 24.6], [121.8, 25.1], [121.4, 25.3], [120.8, 24.6], [120.3, 23.8]]
    ]
  };

  var DEM_ID = "", TERRAIN = null;

  function hasDem() { return !!(DEM_ID && HS.dem && HS.dem.has(DEM_ID)); }

  function isSea(lon, lat, coast) {
    if (hasDem()) return !HS.dem.land(DEM_ID, lon, lat);
    if (!U.pointInPoly(lon, lat, coast.sea)) return false;
    for (var i = 0; i < coast.islands.length; i++) if (U.pointInPoly(lon, lat, coast.islands[i])) return false;
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 风格化起伏（fallback）：几条大山系的高斯脊 + 噪声。
   * ------------------------------------------------------------------ */
  var RIDGES = [
    [97.5, 33, 4.5, 6, 0, 1.15], [100.6, 28.5, 1.3, 3.2, 0, 0.9], [100.5, 38.6, 3, 0.9, -28, 0.8],
    [108, 33.8, 3.6, 0.55, 0, 0.72], [108.6, 32.1, 2.6, 0.5, -18, 0.5], [113.6, 37, 0.55, 2.6, 22, 0.62],
    [111.3, 37.6, 0.45, 1.8, 0, 0.45], [117.6, 40.6, 2.6, 0.5, 6, 0.55], [110.2, 41.2, 3.2, 0.55, 0, 0.5],
    [121.6, 44.5, 1.1, 3.2, 28, 0.62], [112.6, 25.3, 3.6, 0.65, 0, 0.52], [117.6, 27.4, 0.65, 2.6, 34, 0.56],
    [104.6, 26.4, 3, 2, 0, 0.55], [115.6, 31.2, 1.2, 0.4, 10, 0.38], [117.3, 36.2, 0.9, 0.5, 0, 0.32],
    [110.4, 28, 0.6, 2.1, 28, 0.42], [106, 38.8, 0.3, 1.0, 0, 0.42], [106.2, 35.6, 0.3, 1.0, 0, 0.36],
    [109.7, 18.9, 0.5, 0.4, 0, 0.42], [121, 23.6, 0.3, 1.2, 15, 0.6], [127.5, 41.5, 1.5, 1.2, 0, 0.55],
    [103.2, 31.2, 0.8, 1.6, 30, 0.7]
  ];

  function vnoise(seed) {
    function h(ix, iy) {
      var n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    return function (x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      var a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }
  var noise = vnoise(1337);
  function fbm(x, y) { return noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15; }

  function relief(lon, lat) {
    if (hasDem()) {
      var h = HS.dem.sampleMeters(DEM_ID, lon, lat);
      return U.clamp(h / 5000, 0, 1.2);
    }
    var v = 0;
    for (var i = 0; i < RIDGES.length; i++) {
      var r = RIDGES[i], a = r[4] * U.deg;
      var dx = lon - r[0], dy = lat - r[1];
      var u = dx * Math.cos(a) - dy * Math.sin(a), w = dx * Math.sin(a) + dy * Math.cos(a);
      v += r[5] * Math.exp(-(u * u) / (2 * r[2] * r[2]) - (w * w) / (2 * r[3] * r[3]));
    }
    return v + (fbm(lon * 0.9, lat * 0.9) - 0.5) * 0.28;
  }
  HS.relief = relief;

  /* ------------------------------------------------------------------ *
   * 共享小纹理
   * ------------------------------------------------------------------ */
  function glowTexture(inner, outer) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  HS.glowTexture = glowTexture;

  function washTexture() {
    var n = 256, c = document.createElement("canvas");
    c.width = c.height = n;
    var g = c.getContext("2d"), img = g.createImageData(n, n), nz = vnoise(77);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var v = nz(x / 32, y / 32) * 0.6 + nz(x / 11, y / 11) * 0.4;
      var k = Math.round(200 + v * 55), i = (y * n + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = k;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    t.repeat.set(1 / 18, 1 / 18);
    return t;
  }

  /* ------------------------------------------------------------------ *
   * 高程场：DEM 或 fallback
   * ------------------------------------------------------------------ */
  function buildField(coast, gw, gh) {
    var b = P.bounds;
    var field = new Float32Array((gw + 1) * (gh + 1));
    var sea = new Uint8Array((gw + 1) * (gh + 1));
    for (var j = 0; j <= gh; j++) {
      var lat = b.north - (j / gh) * (b.north - b.south);
      for (var i = 0; i <= gw; i++) {
        var lon = b.west + (i / gw) * (b.east - b.west);
        var o = j * (gw + 1) + i;
        if (hasDem()) {
          var h = HS.dem.sampleMeters(DEM_ID, lon, lat);
          field[o] = U.clamp(h / 5000, 0, 1.2);
          sea[o] = h > 0.5 ? 0 : 1;
        } else {
          field[o] = Math.max(0, relief(lon, lat));
          sea[o] = isSea(lon, lat, coast) ? 1 : 0;
        }
      }
    }
    return { field: field, sea: sea, gw: gw, gh: gh };
  }

  /* ------------------------------------------------------------------ *
   * 沙面纹理：真实高程明暗 + 海陆 + 计里画方 + 沙粒
   * ------------------------------------------------------------------ */
  function paintSand(coast, seed) {
    var b = P.bounds;
    var cw = 2048, ch = Math.round((2048 * P.H) / P.W);
    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var g = c.getContext("2d");
    var rnd = U.rng(seed);
    var gw = 300, gh = Math.round((gw * ch) / cw);
    var F = buildField(coast, gw, gh);

    // 1. 沙金底色
    var gr = g.createRadialGradient(cw * 0.5, ch * 0.48, 0, cw * 0.5, ch * 0.5, Math.max(cw, ch) * 0.75);
    gr.addColorStop(0, "#d9c497");
    gr.addColorStop(0.6, "#c9b07e");
    gr.addColorStop(1, "#a88f62");
    g.fillStyle = gr;
    g.fillRect(0, 0, cw, ch);

    // 2. 真实高程 hillshade（低分辨率灰度图，放大后 multiply）
    var shade = document.createElement("canvas");
    shade.width = gw + 1; shade.height = gh + 1;
    var sg = shade.getContext("2d");
    var simg = sg.createImageData(gw + 1, gh + 1);
    for (var j = 0; j <= gh; j++) for (var i = 0; i <= gw; i++) {
      var o = j * (gw + 1) + i, k = 255;
      if (!F.sea[o]) {
        var dx = i > 0 && i < gw ? F.field[o + 1] - F.field[o - 1] : 0;
        var dy = j > 0 && j < gh ? F.field[o + gw + 1] - F.field[o - gw - 1] : 0;
        var nx = -dx * 16, ny = 1, nz = -dy * 16;
        var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        var dot = (nx * -0.46 + ny * 0.72 + nz * -0.52) / len;
        k = Math.round(255 * U.clamp(0.55 + dot * 0.55, 0.32, 1));
      }
      var q = o * 4;
      simg.data[q] = simg.data[q + 1] = simg.data[q + 2] = k;
      simg.data[q + 3] = 255;
    }
    sg.putImageData(simg, 0, 0);
    g.save();
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = 0.72;
    g.imageSmoothingEnabled = true;
    g.drawImage(shade, 0, 0, cw, ch);
    g.restore();

    // 3. 高程暖色：高处偏赭/米白
    for (j = 0; j <= gh; j += 2) for (i = 0; i <= gw; i += 2) {
      o = j * (gw + 1) + i;
      if (F.sea[o]) continue;
      var v = F.field[o];
      if (v < 0.2) continue;
      var cellW = cw / gw, cellH = ch / gh;
      var a = U.clamp((v - 0.2) * 0.24, 0, 0.18);
      var rr = cellW * (3 + rnd() * 3);
      var gg = g.createRadialGradient(i * cellW, j * cellH, 0, i * cellW, j * cellH, rr);
      gg.addColorStop(0, "rgba(120,92,58," + a.toFixed(3) + ")");
      gg.addColorStop(1, "rgba(120,92,58,0)");
      g.fillStyle = gg;
      g.fillRect(i * cellW - rr, j * cellH - rr, rr * 2, rr * 2);
      if (v > 0.72) {
        var a2 = U.clamp((v - 0.72) * 0.5, 0, 0.18);
        var gg2 = g.createRadialGradient(i * cellW, j * cellH, 0, i * cellW, j * cellH, rr * 0.9);
        gg2.addColorStop(0, "rgba(240,232,210," + a2.toFixed(3) + ")");
        gg2.addColorStop(1, "rgba(240,232,210,0)");
        g.fillStyle = gg2;
        g.fillRect(i * cellW - rr, j * cellH - rr, rr * 2, rr * 2);
      }
    }

    // 3b. 低地微绿：让平原/盆地与高地有颜色区分，仍保持沙盘调性
    for (j = 0; j <= gh; j += 2) for (i = 0; i <= gw; i += 2) {
      o = j * (gw + 1) + i;
      if (F.sea[o] || F.field[o] > 0.18) continue;
      var lv = 1 - F.field[o] / 0.18;
      if (lv <= 0.05) continue;
      var lx = (i / gw) * cw, ly = (j / gh) * ch;
      var lr = (cw / gw) * (4 + rnd() * 4);
      var lg = g.createRadialGradient(lx, ly, 0, lx, ly, lr);
      lg.addColorStop(0, "rgba(86,108,82," + (0.085 * lv).toFixed(3) + ")");
      lg.addColorStop(1, "rgba(86,108,82,0)");
      g.fillStyle = lg;
      g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    }

    // 4. 水墨晕染
    for (var n = 0; n < 26; n++) {
      var x = rnd() * cw, y = rnd() * ch, r = (0.08 + rnd() * 0.18) * cw;
      var wash = g.createRadialGradient(x, y, 0, x, y, r);
      wash.addColorStop(0, "rgba(70,96,88," + (0.04 + rnd() * 0.05).toFixed(3) + ")");
      wash.addColorStop(1, "rgba(70,96,88,0)");
      g.fillStyle = wash;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // 5. 计里画方
    g.strokeStyle = "rgba(96,72,40,0.10)";
    g.lineWidth = 1.2;
    g.beginPath();
    for (var lo = Math.ceil(b.west); lo <= b.east; lo++) { g.moveTo(((lo - b.west) / (b.east - b.west)) * cw, 0); g.lineTo(((lo - b.west) / (b.east - b.west)) * cw, ch); }
    for (var la = Math.ceil(b.south); la <= b.north; la++) { g.moveTo(0, ((b.north - la) / (b.north - b.south)) * ch); g.lineTo(cw, ((b.north - la) / (b.north - b.south)) * ch); }
    g.stroke();

    // 6. 海陆掩膜 + 海域
    var mask = document.createElement("canvas");
    mask.width = gw + 1; mask.height = gh + 1;
    var mg = mask.getContext("2d"), mimg = mg.createImageData(gw + 1, gh + 1);
    for (var q = 0; q < F.sea.length; q++) {
      var a = F.sea[q] ? 255 : 0;
      mimg.data[q * 4] = mimg.data[q * 4 + 1] = mimg.data[q * 4 + 2] = 255;
      mimg.data[q * 4 + 3] = a;
    }
    mg.putImageData(mimg, 0, 0);

    var seaCanvas = document.createElement("canvas");
    seaCanvas.width = cw; seaCanvas.height = ch;
    var sc = seaCanvas.getContext("2d");
    var sgrd = sc.createLinearGradient(cw, 0, cw * 0.6, ch);
    sgrd.addColorStop(0, "#5d8a84");
    sgrd.addColorStop(1, "#42706d");
    sc.fillStyle = sgrd;
    sc.fillRect(0, 0, cw, ch);
    sc.strokeStyle = "rgba(220,236,226,0.16)";
    sc.lineWidth = 1.6;
    for (var wy = 0; wy < ch; wy += 22) {
      sc.beginPath();
      var off = (wy / 22) % 2 ? 18 : 0;
      for (var wx = -40 + off; wx < cw; wx += 36) {
        sc.moveTo(wx, wy);
        sc.quadraticCurveTo(wx + 9, wy - 7, wx + 18, wy);
      }
      sc.stroke();
    }
    sc.globalCompositeOperation = "destination-in";
    sc.imageSmoothingEnabled = true;
    sc.drawImage(mask, 0, 0, cw, ch);
    sc.globalCompositeOperation = "source-over";
    g.drawImage(seaCanvas, 0, 0);

    // 海岸边缘（低分辨率边缘蒙版放大）
    var edge = document.createElement("canvas");
    edge.width = gw + 1; edge.height = gh + 1;
    var eg = edge.getContext("2d"), eimg = eg.createImageData(gw + 1, gh + 1);
    for (j = 0; j <= gh; j++) for (i = 0; i <= gw; i++) {
      o = j * (gw + 1) + i;
      if (!F.sea[o]) continue;
      var nb = (i > 0 && !F.sea[o - 1]) || (i < gw && !F.sea[o + 1]) || (j > 0 && !F.sea[o - gw - 1]) || (j < gh && !F.sea[o + gw + 1]);
      if (!nb) continue;
      var e = o * 4;
      eimg.data[e] = 42; eimg.data[e + 1] = 58; eimg.data[e + 2] = 50; eimg.data[e + 3] = 230;
    }
    eg.putImageData(eimg, 0, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalAlpha = 0.2;
    if ("filter" in g) g.filter = "blur(2px)";
    g.drawImage(edge, 0, 0, cw, ch);
    if ("filter" in g) g.filter = "none";
    g.globalAlpha = 0.62;
    g.drawImage(edge, 0, 0, cw, ch);
    g.restore();

    // 7. 沙粒
    var img = g.getImageData(0, 0, cw, ch), dta = img.data;
    for (var d = 0; d < dta.length; d += 4) {
      var qq = (rnd() - 0.5) * 26;
      if (rnd() < 0.012) qq -= 38;
      dta[d] = U.clamp(dta[d] + qq, 0, 255);
      dta[d + 1] = U.clamp(dta[d + 1] + qq, 0, 255);
      dta[d + 2] = U.clamp(dta[d + 2] + qq * 0.85, 0, 255);
    }
    g.putImageData(img, 0, 0);

    // 8. 边缘压暗
    var ev = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, cw / 2, ch / 2, Math.max(cw, ch) * 0.74);
    ev.addColorStop(0, "rgba(40,28,14,0)");
    ev.addColorStop(1, "rgba(40,28,14,0.32)");
    g.fillStyle = ev;
    g.fillRect(0, 0, cw, ch);

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, HS.stage.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  /* ------------------------------------------------------------------ *
   * 等高线：独立透明贴图，可由 relief 图层开关
   * ------------------------------------------------------------------ */
  function paintContours(coast, seed) {
    var b = P.bounds;
    var cw = 2048, ch = Math.round((2048 * P.H) / P.W);
    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var g = c.getContext("2d");
    var gw = 400, gh = Math.round((gw * ch) / cw);
    var F = buildField(coast, gw, gh);
    var px = function (lon) { return ((lon - b.west) / (b.east - b.west)) * cw; };
    var py = function (lat) { return ((b.north - lat) / (b.north - b.south)) * ch; };
    var levels = [];
    if (hasDem()) [200, 500, 1000, 1500, 2000, 3000, 4000].forEach(function (m) { levels.push(m / 5000); });
    else { for (var lv = 0.16; lv < 1.3; lv += 0.12) levels.push(lv); }

    levels.forEach(function (L, li) {
      g.beginPath();
      for (var j = 0; j < gh; j++) for (var i = 0; i < gw; i++) {
        var o = j * (gw + 1) + i;
        if (F.sea[o] || F.sea[o + 1] || F.sea[o + gw + 1] || F.sea[o + gw + 2]) continue;
        var a = F.field[o], bb = F.field[o + 1], cc = F.field[o + gw + 2], dd = F.field[o + gw + 1];
        var idx = (a > L ? 8 : 0) | (bb > L ? 4 : 0) | (cc > L ? 2 : 0) | (dd > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var x0 = (i / gw) * cw, y0 = (j / gh) * ch;
        var cw1 = cw / gw, ch1 = ch / gh;
        var e = function (p, q) { return (L - p) / (q - p); };
        var T = [x0 + e(a, bb) * cw1, y0], R = [x0 + cw1, y0 + e(bb, cc) * ch1];
        var B = [x0 + e(dd, cc) * cw1, y0 + ch1], Lp = [x0, y0 + e(a, dd) * ch1];
        var segs = {
          1: [Lp, B], 2: [B, R], 3: [Lp, R], 4: [T, R], 5: [Lp, T, B, R], 6: [T, B], 7: [Lp, T],
          8: [Lp, T], 9: [T, B], 10: [T, R, Lp, B], 11: [T, R], 12: [Lp, R], 13: [B, R], 14: [Lp, B]
        }[idx];
        for (var s = 0; s < segs.length; s += 2) { g.moveTo(segs[s][0], segs[s][1]); g.lineTo(segs[s + 1][0], segs[s + 1][1]); }
      }
      var major = li % 2 === 1;
      g.strokeStyle = major ? "rgba(92,64,34,0.36)" : "rgba(104,76,44,0.22)";
      g.lineWidth = major ? 2.0 : 1.15;
      g.stroke();
    });
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, HS.stage.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  /* ------------------------------------------------------------------ *
   * 势力覆盖层：按经纬度画到透明纹理，贴在与地形相同的几何上
   *
   * 语义：这里的 canvas 是“势力色块”的唯一来源，和边界 ribbon 分开。
   * 不变量：draw() 改写 canvas 后必须把 texture.needsUpdate 置 true，
   * 否则 WebGL 仍用上一帧上传的旧纹理；v0.4 改成 DEM 覆盖层后漏了这一步，
   * 导致高亮切换只改了 canvas、屏幕上的色块却一直是空白。
   * 坐标：p.x/p.z 是主沙盘世界坐标；canvas y 与 zNorth:"negative" 的地形 UV
   * 方向一致（北在上），不要在这里再翻一次 z。
   * ------------------------------------------------------------------ */
  function paintRegionLayer(outlines, W, H) {
    var cw = 1024, ch = Math.round((cw * H) / W);
    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var g = c.getContext("2d");
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, HS.stage.renderer.capabilities.getMaxAnisotropy());
    function draw(highlightId) {
      g.clearRect(0, 0, cw, ch);
      outlines.forEach(function (o) {
        var r = o.r;
        var alpha = (r.opacity != null ? r.opacity : 0.42);
        if (highlightId) alpha *= r.id === highlightId ? 1.48 : 0.55;
        g.beginPath();
        o.poly.forEach(function (p, i) {
          var x = ((p.x + W / 2) / W) * cw, y = ((p.z + H / 2) / H) * ch;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        });
        g.closePath();
        var col = new THREE.Color(r.color || "#888");
        g.fillStyle = "rgba(" + Math.round(col.r * 255) + "," + Math.round(col.g * 255) + "," + Math.round(col.b * 255) + "," + U.clamp(alpha, 0, 0.9).toFixed(3) + ")";
        g.fill();
        var hot = !!(highlightId && r.id === highlightId);
        var lite = col.clone().lerp(new THREE.Color(0xfff6e0), hot ? 0.72 : 0.38);
        var lineAlpha = hot ? 0.95 : (highlightId ? 0.32 : 0.5);
        g.strokeStyle = "rgba(" + Math.round(lite.r * 255) + "," + Math.round(lite.g * 255) + "," + Math.round(lite.b * 255) + "," + lineAlpha + ")";
        g.lineWidth = hot ? 3.6 : 2;
        g.stroke();
      });
      tex.needsUpdate = true;
    }
    return { canvas: c, texture: tex, draw: draw };
  }

  /* ------------------------------------------------------------------ *
   * 折线加密
   * ------------------------------------------------------------------ */
  function densify(pts, maxStep, closed) {
    if (!pts || pts.length < 2) return pts || [];
    var out = [], n = pts.length;
    var segs = closed ? n : n - 1;
    for (var i = 0; i < segs; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      var dx = b.x - a.x, dz = b.z - a.z;
      var len = Math.hypot(dx, dz);
      var steps = Math.max(1, Math.ceil(len / maxStep));
      for (var k = 0; k < steps; k++) {
        var t = k / steps;
        out.push({ x: a.x + dx * t, z: a.z + dz * t });
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }

  /* ------------------------------------------------------------------ *
   * 平面条带；heightAt(x,z) 可选，用于贴地
   * ------------------------------------------------------------------ */
  function ribbon(pts, width, closed, y, heightAt) {
    var n = pts.length;
    if (n < 2) return new THREE.BufferGeometry();
    var len = [0];
    for (var i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    var total = len[n - 1] + (closed ? Math.hypot(pts[0].x - pts[n - 1].x, pts[0].z - pts[n - 1].z) : 0);
    var pos = [], uv = [], idx = [];
    var count = closed ? n + 1 : n;
    for (i = 0; i < count; i++) {
      var k = i % n;
      var prev = pts[closed ? (k - 1 + n) % n : Math.max(0, k - 1)];
      var next = pts[closed ? (k + 1) % n : Math.min(n - 1, k + 1)];
      var dx = next.x - prev.x, dz = next.z - prev.z, dl = Math.hypot(dx, dz) || 1;
      var nx = -dz / dl, nz = dx / dl;
      var u = (i === n ? total : len[k]) / (total || 1);
      var w = (typeof width === "function" ? width(u) : width) / 2;
      var yy = y + (heightAt ? heightAt(pts[k].x, pts[k].z) : 0);
      pos.push(pts[k].x + nx * w, yy, pts[k].z + nz * w, pts[k].x - nx * w, yy, pts[k].z - nz * w);
      uv.push(u, 0, u, 1);
      if (i > 0) { var a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.userData.length = total;
    return geo;
  }
  HS.ribbon = ribbon;

  function lighten(hex, k) {
    var c = new THREE.Color(hex);
    return c.lerp(new THREE.Color(0xfff6e0), k);
  }

  /* ------------------------------------------------------------------ *
   * 势力轮廓：polygon 优先；否则 blob（示意）
   * ------------------------------------------------------------------ */
  function regionOutlines(regions, coast) {
    var hw = P.W / 2 - 0.5, hh = P.H / 2 - 0.5;
    var info = regions.map(function (r) {
      var c = r.labelAt || [0, 0];
      var o = { r: r, cx: P.x(c[0]), cz: P.z(c[1]), rad: (r.radiusKm || 200) * P.kmUnit, poly: null };
      if (r.polygon && r.polygon.length >= 3) {
        o.poly = r.polygon.map(function (p) {
          return { x: U.clamp(P.x(p[0]), -hw, hw), z: U.clamp(P.z(p[1]), -hh, hh) };
        });
        var s = 0;
        o.poly.forEach(function (p) { s += Math.hypot(p.x - o.cx, p.z - o.cz); });
        o.rad = s / o.poly.length;
      }
      return o;
    });

    var landAt = function (x, z) { return !isSea(P.lon(x), P.lat(z), coast); };

    info.forEach(function (o) {
      if (o.poly) return;
      var rnd = U.rng(U.hash(o.r.id));
      var ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
      var N = 72, ts = [];
      for (var k = 0; k < N; k++) {
        var th = (k / N) * Math.PI * 2, dx = Math.cos(th), dz = Math.sin(th);
        var t = o.rad * (1 + 0.1 * Math.sin(2 * th + ph[0]) + 0.07 * Math.sin(3 * th + ph[1]) + 0.05 * Math.sin(5 * th + ph[2]) + 0.03 * Math.sin(7 * th + ph[3]));
        info.forEach(function (q) {
          if (q === o) return;
          var Dx = q.cx - o.cx, Dz = q.cz - o.cz, dd = dx * Dx + dz * Dz;
          if (dd <= 1e-6) return;
          var tb = (Dx * Dx + Dz * Dz + o.rad * o.rad - q.rad * q.rad) / (2 * dd);
          t = Math.min(t, tb - 0.35);
        });
        if (dx > 1e-6) t = Math.min(t, (hw - o.cx) / dx);
        if (dx < -1e-6) t = Math.min(t, (-hw - o.cx) / dx);
        if (dz > 1e-6) t = Math.min(t, (hh - o.cz) / dz);
        if (dz < -1e-6) t = Math.min(t, (-hh - o.cz) / dz);
        for (var s = 0.4; s < t; s += 0.35) {
          if (!landAt(o.cx + dx * s, o.cz + dz * s)) { t = Math.max(0.2, s - 0.25); break; }
        }
        ts.push(Math.max(t, o.rad * 0.12));
      }
      var sm = ts.map(function (t, k) { return Math.min(t, (ts[(k + N - 1) % N] + t + ts[(k + 1) % N]) / 3); });
      o.poly = sm.map(function (t, k) {
        var th = (k / N) * Math.PI * 2;
        return { x: o.cx + Math.cos(th) * t, z: o.cz + Math.sin(th) * t };
      });
    });
    return info;
  }

  /* ------------------------------------------------------------------ *
   * 构建一个主题的沙盘
   * ------------------------------------------------------------------ */
  HS.buildMap = function (theme) {
    var map = theme.map || {};
    var coast = map.coastline && map.coastline.sea ? { sea: map.coastline.sea, islands: map.coastline.islands || [] } : COAST;
    var tcfg = map.terrain || {};
    DEM_ID = tcfg.mode === "dem" && HS.dem && HS.dem.has(tcfg.dem) ? tcfg.dem : "";
    TERRAIN = null;
    var group = new THREE.Group();
    group.name = "map:" + theme.meta.id;
    var W = P.W, H = P.H, seed = U.hash(theme.meta.id);
    var api = { group: group, regions: {}, layers: {}, labels: [], terrain: null };

    /* ---- 底座 ---- */
    var m = 3.4, R = 3.2;
    var outer = new THREE.Shape();
    var ox = W / 2 + m, oz = H / 2 + m;
    outer.moveTo(-ox + R, -oz);
    outer.lineTo(ox - R, -oz); outer.quadraticCurveTo(ox, -oz, ox, -oz + R);
    outer.lineTo(ox, oz - R); outer.quadraticCurveTo(ox, oz, ox - R, oz);
    outer.lineTo(-ox + R, oz); outer.quadraticCurveTo(-ox, oz, -ox, oz - R);
    outer.lineTo(-ox, -oz + R); outer.quadraticCurveTo(-ox, -oz, -ox + R, -oz);
    var hole = new THREE.Path();
    hole.moveTo(-W / 2, -H / 2); hole.lineTo(-W / 2, H / 2); hole.lineTo(W / 2, H / 2); hole.lineTo(W / 2, -H / 2); hole.lineTo(-W / 2, -H / 2);
    outer.holes.push(hole);
    var frameGeo = new THREE.ExtrudeGeometry(outer, { depth: 3.4, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.35, bevelSegments: 3, curveSegments: 10 });
    frameGeo.rotateX(Math.PI / 2);
    frameGeo.translate(0, 0.32, 0);
    var frame = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({ color: 0x1c2a26, roughness: 0.5, metalness: 0.15 }));
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    var ix = W / 2 + m * 0.5, iz = H / 2 + m * 0.5;
    var inlayPts = [{ x: -ix, z: -iz }, { x: ix, z: -iz }, { x: ix, z: iz }, { x: -ix, z: iz }];
    var inlay = new THREE.Mesh(ribbon(inlayPts, 0.16, true, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xc9a865, transparent: true, opacity: 0.75, fog: true }));
    group.add(inlay);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.9, H * 1.9),
      new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,0,0,0.6)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -3.9;
    group.add(shadow);

    var base = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, H + 0.2), new THREE.MeshBasicMaterial({ color: 0x0b1210 }));
    base.rotation.x = Math.PI / 2;
    base.position.y = -3.1;
    group.add(base);

    /* ---- 地形 ---- */
    var sandTex = paintSand(coast, seed);
    var terrainGroup = new THREE.Group();
    group.add(terrainGroup);
    var contourMesh = null;

    if (DEM_ID) {
      TERRAIN = HS.dem.buildMesh({
        dem: DEM_ID, bounds: P.bounds, width: W, depth: H, step: tcfg.meshStep || 0.10,
        exaggeration: tcfg.exaggeration || 14, zNorth: "negative",
        maxHeight: tcfg.maxHeight || 4.5, edgeFalloff: tcfg.edgeFalloff || 1.8
      });
      HS.mapHeightAt = TERRAIN.heightAtLonLat;
      HS.mapHeightAtXZ = TERRAIN.heightAtXZ;
      HS.mapTerrain = TERRAIN;
      api.heightAt = TERRAIN.heightAtLonLat;
      api.heightAtXZ = TERRAIN.heightAtXZ;
      api.terrain = TERRAIN;

      var terrainMesh = new THREE.Mesh(TERRAIN.geometry,
        new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.98, metalness: 0, flatShading: false }));
      terrainMesh.receiveShadow = true;
      terrainGroup.add(terrainMesh);

      var contourTex = paintContours(coast, seed);
      var contourGeo = TERRAIN.geometry.clone();
      contourGeo.translate(0, 0.035, 0);
      contourMesh = new THREE.Mesh(contourGeo, new THREE.MeshBasicMaterial({
        map: contourTex, transparent: true, opacity: 0.9, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
      }));
      contourMesh.renderOrder = 3;
      terrainGroup.add(contourMesh);
      api.layers.relief = [contourMesh];
    } else {
      HS.mapHeightAt = null;
      HS.mapHeightAtXZ = null;
      api.heightAt = function () { return 0; };
      api.heightAtXZ = function () { return 0; };
      var sand = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
        new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.96, metalness: 0 }));
      sand.rotation.x = -Math.PI / 2;
      sand.receiveShadow = true;
      terrainGroup.add(sand);

      var amp = (map.relief && map.relief.amplitude != null ? map.relief.amplitude : 1) || 0;
      var reliefGroup = new THREE.Group();
      terrainGroup.add(reliefGroup);
      if (amp > 0) {
        var avoid = [];
        (theme.routes || []).forEach(function (rt) {
          var ns = rt.nodes || [];
          for (var i = 0; i < ns.length; i++) {
            var p0 = { x: P.x(ns[i].lon), z: P.z(ns[i].lat) };
            avoid.push([p0, i + 1 < ns.length ? { x: P.x(ns[i + 1].lon), z: P.z(ns[i + 1].lat) } : p0]);
          }
        });
        (theme.events || []).forEach(function (ev) { var p = { x: P.x(ev.lon), z: P.z(ev.lat) }; avoid.push([p, p]); });
        var segDist = function (x, z, s) {
          var ax = s[0].x, az = s[0].z, bx = s[1].x - ax, bz = s[1].z - az, l2 = bx * bx + bz * bz;
          var t = l2 ? U.clamp(((x - ax) * bx + (z - az) * bz) / l2, 0, 1) : 0;
          return Math.hypot(x - ax - bx * t, z - az - bz * t);
        };
        var rnd = U.rng(seed ^ 0x51ed);
        var b = P.bounds, step = 0.4, mats = [];
        for (var lat = b.south + step / 2; lat < b.north; lat += step) {
          for (var lon = b.west + step / 2; lon < b.east; lon += step) {
            var jl = lon + (rnd() - 0.5) * step, jt = lat + (rnd() - 0.5) * step;
            var h = relief(jl, jt);
            if (h < 0.5 + rnd() * 0.12 || isSea(jl, jt, coast)) continue;
            var x = P.x(jl), z = P.z(jt);
            if (Math.abs(x) > W / 2 - 0.9 || Math.abs(z) > H / 2 - 0.9) continue;
            var near = false;
            for (var q = 0; q < avoid.length && !near; q++) if (segDist(x, z, avoid[q]) < 1.3) near = true;
            if (near) continue;
            var ht = ((h - 0.42) * 2.8 + 0.35) * amp * (0.7 + rnd() * 0.5);
            var rad = 0.6 + rnd() * 0.45 + ht * 0.3;
            mats.push({ x: x, z: z, h: Math.min(ht, 3.4), r: rad, rot: rnd() * 6.28, tone: rnd() });
          }
        }
        if (mats.length) {
          var cone = new THREE.ConeGeometry(1, 1, 5, 1);
          cone.translate(0, 0.5, 0);
          var im = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, flatShading: true }), mats.length);
          var mtx = new THREE.Matrix4(), qn = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
          var cLow = new THREE.Color(0xa58b60), cHigh = new THREE.Color(0x7a684c), cTip = new THREE.Color(0xe6dcc4), col = new THREE.Color();
          mats.forEach(function (o, i) {
            qn.setFromAxisAngle(up, o.rot);
            sc.set(o.r, o.h, o.r * (0.8 + o.tone * 0.4));
            ps.set(o.x, 0, o.z);
            mtx.compose(ps, qn, sc);
            im.setMatrixAt(i, mtx);
            col.copy(cLow).lerp(cHigh, U.clamp(o.h / 3, 0, 1) * 0.8 + o.tone * 0.2);
            if (o.h > 2.6) col.lerp(cTip, 0.35);
            im.setColorAt(i, col);
          });
          im.castShadow = true;
          im.receiveShadow = true;
          reliefGroup.add(im);
        }
      }
      contourMesh = reliefGroup;
      api.layers.relief = [reliefGroup];
    }

    /* ---- 势力覆盖层 / 边界 / 标签 ---- */
    var regionGroup = new THREE.Group();
    group.add(regionGroup);
    var wash = washTexture();
    var outlines = regionOutlines(map.regions || [], coast);
    var regionPaint = null;
    if (DEM_ID) {
      regionPaint = paintRegionLayer(outlines, W, H);
      regionPaint.draw(""); // 先画一次空高亮，避免首屏/主题切换时色块纹理是空白
      var regionGeo = TERRAIN.geometry.clone();
      regionGeo.translate(0, 0.06, 0);
      var regionMesh = new THREE.Mesh(regionGeo, new THREE.MeshBasicMaterial({
        map: regionPaint.texture, transparent: true, opacity: 0.98, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide
      }));
      regionMesh.renderOrder = 2;
      regionGroup.add(regionMesh);
    }

    outlines.forEach(function (o, i) {
      var r = o.r;
      var fill = null;
      if (!DEM_ID) {
        var shape = new THREE.Shape(o.poly.map(function (p) { return new THREE.Vector2(p.x, -p.z); }));
        var geo = new THREE.ShapeGeometry(shape, 1);
        geo.rotateX(-Math.PI / 2);
        var baseOp = r.opacity != null ? r.opacity : 0.42;
        fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
          color: new THREE.Color(r.color || "#888"), map: wash, transparent: true, opacity: baseOp,
          depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 - i, polygonOffsetUnits: -1
        }));
        fill.position.y = 0.04 + i * 0.002;
        fill.renderOrder = 2;
        regionGroup.add(fill);
      }

      // 边界 ribbon 必须 DoubleSide：ribbon 的三角形绕序由多边形方向决定，
      // 单面材质从沙盘上方看会被背面剔除，表现为“边界完全消失”。
      var lineMat = new THREE.MeshBasicMaterial({
        color: lighten(r.color || "#888", 0.46), transparent: true, opacity: 0.8,
        depthWrite: false, side: THREE.DoubleSide
      });
      var dense = densify(o.poly, 0.22, true);
      var hAt = TERRAIN ? TERRAIN.heightAtXZ : null;
      var half = r.highlight ? 0.5 : 0.32;
      // 竖向抬高 0.16，避开 DEM 三角面与等高线覆盖层；再垫一条加法混合的宽光带，
      // 让 1920/1366 的远景也能分辨边界，而不是只靠 1–2 像素的细线。
      var glow = new THREE.Mesh(ribbon(dense, half * 2.6, true, 0.1, hAt), new THREE.MeshBasicMaterial({
        color: lighten(r.color || "#888", 0.6), transparent: true, opacity: 0.08,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
      }));
      glow.renderOrder = 3;
      regionGroup.add(glow);
      var line = new THREE.Mesh(ribbon(dense, half, true, 0.16, hAt), lineMat);
      line.renderOrder = 4;
      regionGroup.add(line);

      var lbl = U.el("div", "lb-region size-" + (r.labelSize || "normal") + (r.highlight ? " is-key" : ""),
        "<span>" + U.esc(r.name) + "</span>");
      var ly = TERRAIN ? TERRAIN.heightAtLonLat(r.labelAt[0], r.labelAt[1]) + 0.3 : 0.3;
      var item = HS.labels.add({ el: lbl, pos: P.vec(r.labelAt[0], r.labelAt[1], ly), layer: "regions", priority: 1, scaleWithDist: false });
      api.labels.push(item);
      api.regions[r.id] = {
        data: r, fill: fill, line: line, glow: glow, label: lbl,
        baseOp: r.opacity != null ? r.opacity : 0.42, op: r.opacity != null ? r.opacity : 0.42,
        lineOp: 0.8, glowOp: 0.08, target: 1
      };
    });

    /* ---- 河流 ---- */
    var riverGroup = new THREE.Group();
    group.add(riverGroup);
    (map.rivers || []).forEach(function (rv) {
      var pts = (rv.pts || []).filter(function (p) { return P.inBounds(p[0], p[1]); })
        .map(function (p) { return P.vec(p[0], p[1], 0); });
      if (pts.length < 2) return;
      var curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      var smp = curve.getPoints(pts.length * 10).map(function (v) { return { x: v.x, z: v.z }; });
      var hAt = TERRAIN ? TERRAIN.heightAtXZ : null;
      var col = new THREE.Color(rv.color || "#7fb4b8");
      var halo = new THREE.Mesh(ribbon(smp, function (u) { return 0.9 + u * 0.9; }, false, 0.05, hAt),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14, depthWrite: false }));
      var core = new THREE.Mesh(ribbon(smp, function (u) { return 0.16 + u * 0.3; }, false, 0.08, hAt),
        new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xe8f6f2), 0.25), transparent: true, opacity: 0.92, depthWrite: false }));
      halo.renderOrder = 5; core.renderOrder = 6;
      riverGroup.add(halo, core);
      if (rv.labelAt && P.inBounds(rv.labelAt[0], rv.labelAt[1])) {
        var lb = U.el("div", "lb-river", "<span>" + U.esc(rv.name) + "</span>");
        var ry = TERRAIN ? TERRAIN.heightAtLonLat(rv.labelAt[0], rv.labelAt[1]) + 0.22 : 0.2;
        api.labels.push(HS.labels.add({ el: lb, pos: P.vec(rv.labelAt[0], rv.labelAt[1], ry), layer: "rivers", priority: 2, scaleWithDist: true }));
      }
    });
    api.layers.rivers = [riverGroup];

    /* ---- 地名 ---- */
    var taken = [];
    (theme.events || []).forEach(function (ev) { taken.push([ev.lon, ev.lat]); });
    api.placePoints = [];
    (map.places || []).forEach(function (pl) {
      if (pl.label === false || !P.inBounds(pl.lon, pl.lat)) return;
      api.placePoints.push([pl.lon, pl.lat]);
      var dup = taken.some(function (t) { return Math.abs(t[0] - pl.lon) < 0.14 && Math.abs(t[1] - pl.lat) < 0.14; });
      if (dup) return;
      var py = TERRAIN ? TERRAIN.heightAtLonLat(pl.lon, pl.lat) + 0.18 : 0.15;
      var lb = U.el("div", "lb-place kind-" + (pl.kind || "city"), "<div class='lb-in'><i></i><span>" + U.esc(pl.name) + "</span></div>");
      lb.title = pl.note || "";
      api.labels.push(HS.labels.add({ el: lb, pos: P.vec(pl.lon, pl.lat, py), layer: "places", priority: pl.kind === "capital" ? 5 : 3, anchor: "left" }));
    });

    /* ------------------------------------------------------------------ *
     * 高亮链路（完整数据流，改这里前先读一遍）：
     *
     *   theme.events[].regionId
     *     -> main.goTo() 调用 st.map.highlight(ev.regionId)
     *     -> api.highlight 设置 api.current / 每区 target
     *     -> regionPaint.draw(current) 重画色块 canvas（必须 needsUpdate）
     *     -> API.update 每帧插值：色块 alpha、边界 lineOp 脉冲、光带 glowOp
     *     -> DOM 标签切换 .is-hl / .is-dim（app.css 控制字号、颜色、透明度）
     *
     * 空 regionId 表示“该事件没有单一政权可高亮”（例如 907/923 的事件，
     * 当时的主角后梁/后唐不在 955 年地图快照里）。此时不能静默什么都不做：
     * 取消所有 dim、恢复默认色块，并由 main/ui 在事件胶囊显示明确提示。
     * 未知 regionId 按空值处理，避免拼写错误时只亮一半。
     * ------------------------------------------------------------------ */
    function repaintRegions() { if (regionPaint) regionPaint.draw(api.current || ""); }
    api.highlight = function (regionId) {
      var has = !!(regionId && api.regions[regionId]);
      Object.keys(api.regions).forEach(function (id) {
        var R = api.regions[id];
        R.target = !has ? 1 : id === regionId ? 1.55 : 0.55;
        R.label.classList.toggle("is-hl", has && id === regionId);
        R.label.classList.toggle("is-dim", has && id !== regionId);
      });
      api.current = has ? regionId : "";
      repaintRegions();
      return api.current;
    };

    api.update = function (dt, t) {
      var k = 1 - Math.pow(0.02, dt);
      Object.keys(api.regions).forEach(function (id) {
        var R = api.regions[id];
        if (R.fill) {
          var goal = U.clamp(R.baseOp * R.target, 0.06, 0.72);
          R.op = U.lerp(R.op, goal, k);
          R.fill.material.opacity = R.op;
        }
        var active = id === api.current;
        var lineGoal = active ? 0.78 + 0.22 * Math.sin(t * 3.2) : R.target < 1 ? 0.3 : 0.72;
        R.lineOp = U.lerp(R.lineOp, lineGoal, k * 2);
        R.line.material.opacity = R.lineOp;
        var glowGoal = active ? 0.16 + 0.1 * Math.sin(t * 3.2) : R.target < 1 ? 0.015 : 0.06;
        R.glowOp = U.lerp(R.glowOp, glowGoal, k * 2);
        R.glow.material.opacity = R.glowOp;
      });
      if (api.vignette && api.vignette.userData.update) api.vignette.userData.update(t);
    };

    api.setLayer = function (name, on) {
      if (name === "relief") {
        (api.layers.relief || []).forEach(function (o) { o.visible = on; });
      } else if (name === "vignette") {
        if (api.vignette) api.vignette.visible = on;
      } else if (name === "regions") {
        regionGroup.visible = on;
      } else if (name === "rivers") {
        riverGroup.visible = on;
      }
    };

    /* ---- 当前事件微缩情景（figures.js 提供工厂） ---- */
    api.setVignette = function (ev) {
      if (api.vignette) { HS.dispose(api.vignette); api.vignette = null; }
      if (!ev || !HS.figures || !HS.figures.buildVignette) return;
      var kind = ev.kind === "war" ? "war" : (ev.scene && ev.scene.type === "court") || ev.kind === "reform" ? "court" : "";
      if (!kind) return;
      var v = HS.figures.buildVignette(kind, {
        theme: theme.meta.id,
        accent: theme.meta.accent,
        event: ev
      });
      if (!v) return;
      var y = TERRAIN ? TERRAIN.heightAtLonLat(ev.lon, ev.lat) + 0.08 : 0.08;
      v.position.set(P.x(ev.lon) - 0.8, y, P.z(ev.lat) + 3.4);
      v.scale.setScalar(2.0);
      v.userData.update = v.userData.update || function () {};
      api.vignette = v;
      group.add(v);
      v.visible = true;
    };

    api.dispose = function () {
      HS.mapHeightAt = null;
      HS.mapHeightAtXZ = null;
      HS.mapTerrain = null;
      DEM_ID = "";
      TERRAIN = null;
      HS.dispose(group);
      if (regionPaint) regionPaint.texture.dispose();
      if (api.vignette) { HS.dispose(api.vignette); api.vignette = null; }
    };

    return api;
  };
})();
