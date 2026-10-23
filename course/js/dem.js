/*
 * dem.js —— 真实 DEM 解码、采样与高度网格。
 * 数据来自 data/dem/regions.js（构建脚本生成）；页面不联网、不 fetch。
 * 高程单位：米。场景高度 = 高程 × 水平比例 × 垂直夸张；垂直夸张只用于可视化。
 */
(function () {
  "use strict";

  var HS = (window.HS = window.HS || {});
  var U = HS.util;

  var D = (HS.dem = {
    _grids: {},
    _decoded: {},
    data: function () { return window.HISTORY_DEM || {}; }
  });

  /* ------------------------------------------------------------------ *
   * 解码：int16 LE base64 -> Int16Array
   * ------------------------------------------------------------------ */
  function decode(def) {
    if (D._decoded[def.id]) return D._decoded[def.id];
    var bin = atob(def.data);
    var n = bin.length;
    var bytes = new Uint8Array(n);
    for (var i = 0; i < n; i++) bytes[i] = bin.charCodeAt(i);
    var len = n >> 1;
    var arr = new Int16Array(len);
    for (var j = 0; j < len; j++) {
      var v = bytes[j * 2] | (bytes[j * 2 + 1] << 8);
      if (v & 0x8000) v -= 0x10000;
      arr[j] = v;
    }
    D._decoded[def.id] = arr;
    return arr;
  }

  D.get = function (id) {
    if (!id) return null;
    if (D._grids[id]) return D._grids[id];
    var def = D.data()[id];
    if (!def) return null;
    var grid = { def: def, values: decode(def) };
    D._grids[id] = grid;
    return grid;
  };

  D.def = function (id) {
    var g = D.get(id);
    return g ? g.def : null;
  };

  D.has = function (id) { return !!D.get(id); };

  /* ------------------------------------------------------------------ *
   * 双线性采样（米）
   * ------------------------------------------------------------------ */
  D.sampleMeters = function (id, lon, lat) {
    var g = D.get(id);
    if (!g) return 0;
    var def = g.def, b = def.bounds;
    if (!(lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north)) return 0;
    var fx = ((lon - b.west) / (b.east - b.west)) * (def.cols - 1);
    var fy = ((b.north - lat) / (b.north - b.south)) * (def.rows - 1);
    var i0 = Math.floor(fx), j0 = Math.floor(fy);
    var i1 = Math.min(def.cols - 1, i0 + 1), j1 = Math.min(def.rows - 1, j0 + 1);
    var tx = fx - i0, ty = fy - j0;
    var v = g.values;
    var a = v[j0 * def.cols + i0], bb = v[j0 * def.cols + i1];
    var c = v[j1 * def.cols + i0], d = v[j1 * def.cols + i1];
    return a * (1 - tx) * (1 - ty) + bb * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  };

  D.land = function (id, lon, lat) { return D.sampleMeters(id, lon, lat) > 0.5; };

  /* ------------------------------------------------------------------ *
   * 网格构建
   * opts:
   *   dem, bounds, width, depth, step, exaggeration, yBase,
   *   zNorth: "negative"(默认，主图) | "positive"(战场，配合 root.scale.z=-1)
   *   maxHeight, edgeFalloff (场景单位), uvFlip
   * ------------------------------------------------------------------ */
  D.buildMesh = function (opts) {
    var def = D.def(opts.dem);
    if (!def) return null;
    var bounds = opts.bounds || def.bounds;
    var width = opts.width || 100;
    var depth = opts.depth || 100;
    var step = opts.step || 0.1;
    var exaggeration = opts.exaggeration == null ? 1 : opts.exaggeration;
    var yBase = opts.yBase || 0;
    var zNorth = opts.zNorth || "negative";
    var cLat = (bounds.north + bounds.south) / 2;
    var spanKm = Math.max(1, (bounds.east - bounds.west) * 111.32 * Math.cos(cLat * U.deg));
    var unitsPerKm = width / spanKm;
    var verticalScale = (unitsPerKm / 1000) * exaggeration;
    var maxHeight = opts.maxHeight == null ? 4.5 : opts.maxHeight;
    var edge = opts.edgeFalloff == null ? 0 : opts.edgeFalloff;

    var cols = Math.max(2, Math.round((bounds.east - bounds.west) / step) + 1);
    var rows = Math.max(2, Math.round((bounds.north - bounds.south) / step) + 1);
    var count = cols * rows;
    var pos = new Float32Array(count * 3);
    var uv = new Float32Array(count * 2);
    var idx = [];
    var n = 0;

    function toX(lon) { return -width / 2 + ((lon - bounds.west) / (bounds.east - bounds.west)) * width; }
    function toZ(lat) {
      var t = (lat - bounds.south) / (bounds.north - bounds.south);
      return zNorth === "positive" ? -depth / 2 + t * depth : depth / 2 - t * depth;
    }
    function toLon(x) { return bounds.west + ((x + width / 2) / width) * (bounds.east - bounds.west); }
    function toLat(z) {
      var t = zNorth === "positive" ? (z + depth / 2) / depth : (depth / 2 - z) / depth;
      return bounds.south + t * (bounds.north - bounds.south);
    }
    function edgeFactor(x, z) {
      if (edge <= 0) return 1;
      var dx = Math.min(x + width / 2, width / 2 - x);
      var dz = Math.min(z + depth / 2, depth / 2 - z);
      var d = Math.min(dx, dz) / edge;
      return U.smooth(U.clamp(d, 0, 1));
    }
    function heightAtLonLat(lon, lat) {
      var h = D.sampleMeters(opts.dem, lon, lat);
      if (!(h > 0)) h = 0;
      var y = Math.min(maxHeight, h * verticalScale);
      return yBase + y * edgeFactor(toX(lon), toZ(lat));
    }
    function heightAtXZ(x, z) { return heightAtLonLat(toLon(x), toLat(z)); }

    for (var j = 0; j < rows; j++) {
      var lat = bounds.north - (j / (rows - 1)) * (bounds.north - bounds.south);
      for (var i = 0; i < cols; i++, n++) {
        var lon = bounds.west + (i / (cols - 1)) * (bounds.east - bounds.west);
        var x = toX(lon), z = toZ(lat);
        pos[n * 3] = x;
        pos[n * 3 + 1] = heightAtLonLat(lon, lat);
        pos[n * 3 + 2] = z;
        uv[n * 2] = i / (cols - 1);
        uv[n * 2 + 1] = 1 - j / (rows - 1);
      }
    }
    var flip = zNorth === "positive";
    for (j = 0; j < rows - 1; j++) {
      for (i = 0; i < cols - 1; i++) {
        var a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
        if (flip) idx.push(a, b, c, b, d, c);
        else idx.push(a, c, b, b, c, d);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    return {
      geometry: geo,
      bounds: bounds,
      width: width,
      depth: depth,
      cols: cols,
      rows: rows,
      step: step,
      verticalScale: verticalScale,
      exaggeration: exaggeration,
      toXZ: function (lon, lat) { return { x: toX(lon), z: toZ(lat) }; },
      toLonLat: function (x, z) { return { lon: toLon(x), lat: toLat(z) }; },
      heightAtLonLat: heightAtLonLat,
      heightAtXZ: heightAtXZ,
      heightMeters: function (lon, lat) { return D.sampleMeters(opts.dem, lon, lat); },
      land: function (lon, lat) { return D.land(opts.dem, lon, lat); }
    };
  };

  /* ------------------------------------------------------------------ *
   * 网格纹理辅助：按经纬度在 canvas 上绘制
   * ------------------------------------------------------------------ */
  D.paintGrid = function (grid, canvas, fn) {
    var b = grid.bounds, w = canvas.width, h = canvas.height;
    var g = canvas.getContext("2d");
    var x = function (lon) { return ((lon - b.west) / (b.east - b.west)) * w; };
    var y = function (lat) { return ((b.north - lat) / (b.north - b.south)) * h; };
    fn(g, x, y, w, h);
  };
})();
