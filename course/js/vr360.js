/*
 * vr360.js —— 360° 图片环视。使用 CSS 2:1 全景背景 + 2D 尘埃层，
 * 避免 file:// 下 WebGL 外部纹理的 CORS 风险。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util;
  var V = (HS.vr360 = { active: false, auto: true, speed: 1 });

  var stage, sky, pan, dust, spotsBox, tip;
  var raf = 0, last = 0, yaw = 0.5, pitch = 0, zoom = 1;
  var panW = 2000, viewW = 1, viewH = 1, dragging = false, lastX = 0, lastY = 0;
  var autoIdle = 0, baseImage = "", hotspots = [], spotEls = [];
  var dustParticles = [];

  function el(id) { return document.getElementById(id); }

  function init() {
    if (stage) return true;
    stage = el("vrStage"); sky = el("vrSky"); pan = el("vrPan");
    dust = el("vrDustCanvas"); spotsBox = el("vrSpots"); tip = el("vrSpotTip");
    if (!stage || !pan) return false;
    bind();
    resize();
    return true;
  }

  function resize() {
    viewW = window.innerWidth; viewH = window.innerHeight;
    if (dust) {
      dust.width = Math.max(1, Math.round(viewW * Math.min(2, window.devicePixelRatio || 1)));
      dust.height = Math.max(1, Math.round(viewH * Math.min(2, window.devicePixelRatio || 1)));
      dust.style.width = viewW + "px";
      dust.style.height = viewH + "px";
    }
    updatePan();
  }

  function imageAspect(src, cb) {
    var img = new Image();
    img.onload = function () { cb(img.naturalWidth / Math.max(1, img.naturalHeight), src); };
    img.onerror = function () { cb(2, ""); };
    img.src = src;
  }

  function setPanorama(pano, fallback) {
    hotspots = [];
    spotEls = [];
    if (spotsBox) spotsBox.innerHTML = "";
    baseImage = pano || fallback || "";
    if (!baseImage) return;

    function apply(src) {
      baseImage = src;
      pan.style.backgroundImage = "url('" + src.replace(/'/g, "\\'") + "')";
      imageAspect(src, function (aspect, ok) {
        if (!ok && fallback && src !== fallback) {
          apply(fallback);
          return;
        }
        var ar = aspect || 2;
        panW = ar * viewH * 1.28 * zoom;
        updatePan();
      });
    }
    apply(baseImage);
  }

  function setHotspots(list) {
    hotspots = (list || []).slice(0, 8);
    spotEls = [];
    if (!spotsBox) return;
    spotsBox.innerHTML = "";
    hotspots.forEach(function (h, i) {
      var b = document.createElement("button");
      b.className = "vr-spot";
      b.type = "button";
      b.innerHTML = "<i></i><span>" + U.esc(h.label || "") + "</span>";
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        showTip(h, b);
      });
      spotsBox.appendChild(b);
      spotEls.push(b);
    });
  }

  function showTip(h, anchor) {
    if (!tip) return;
    tip.innerHTML = "<b>" + U.esc(h.label || "") + "</b>" + (h.text ? "<p>" + U.esc(h.text) + "</p>" : "");
    tip.hidden = false;
    var r = anchor.getBoundingClientRect();
    tip.style.left = Math.min(viewW - 300, Math.max(12, r.left + 18)) + "px";
    tip.style.top = Math.min(viewH - 160, Math.max(12, r.top - 10)) + "px";
    clearTimeout(showTip._t);
    showTip._t = setTimeout(function () { tip.hidden = true; }, 7000);
  }

  function updatePan() {
    if (!pan) return;
    if (!panW || !isFinite(panW)) panW = 2 * viewH * 1.28 * zoom;
    var x = viewW / 2 - yaw * panW;
    pan.style.backgroundSize = "auto " + (128 * zoom) + "%";
    pan.style.backgroundPositionX = x.toFixed(1) + "px";
    pan.style.backgroundPositionY = (50 - pitch * 90).toFixed(2) + "%";

    // Hotspots: x is the pano fraction; y is vertical fraction.
    spotEls.forEach(function (b, i) {
      var h = hotspots[i];
      if (!h) return;
      var rel = ((h.x - yaw) % 1 + 1) % 1;
      if (rel > 0.5) rel -= 1;
      var sx = viewW / 2 + rel * panW;
      var sy = (h.y + pitch * 0.45) * viewH;
      var visible = sx > -120 && sx < viewW + 120 && sy > -80 && sy < viewH + 80;
      b.style.display = visible ? "" : "none";
      b.style.left = sx.toFixed(1) + "px";
      b.style.top = sy.toFixed(1) + "px";
    });
  }

  function bind() {
    if (stage.__bound) return;
    stage.__bound = true;

    stage.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
      V.auto = false;
      autoIdle = 0;
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      yaw = ((yaw - dx / Math.max(1, panW)) % 1 + 1) % 1;
      pitch = U.clamp(pitch - dy / Math.max(1, viewH) * 1.1, -0.32, 0.32);
      autoIdle = 0;
      updatePan();
    });
    function up() {
      dragging = false;
      stage.classList.remove("is-dragging");
      clearTimeout(autoIdle);
      autoIdle = setTimeout(function () { V.auto = true; }, 2600);
    }
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("pointerleave", function () { if (dragging) up(); });
    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoom = U.clamp(zoom * (1 - e.deltaY * 0.0011), 1, 1.85);
      autoIdle = 0;
      updatePan();
    }, { passive: false });
    window.addEventListener("resize", resize);
  }

  function dustStep(dt, t) {
    if (!dust) return;
    var g = dust.getContext("2d");
    var w = dust.width, h = dust.height, dpr = w / Math.max(1, viewW);
    g.clearRect(0, 0, w, h);
    if (!dustParticles.length) {
      var rnd = U.rng(360);
      for (var i = 0; i < 42; i++) dustParticles.push({ x: rnd() * w, y: rnd() * h, r: (0.5 + rnd() * 1.6) * dpr, s: (2 + rnd() * 8) * dpr, a: 0.05 + rnd() * 0.16, p: rnd() * 6.28 });
    }
    g.fillStyle = "rgba(238,226,200,1)";
    for (var j = 0; j < dustParticles.length; j++) {
      var p = dustParticles[j];
      p.y -= p.s * dt;
      p.x += Math.sin(t * 0.4 + p.p) * 4 * dt;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      g.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 0.9 + p.p));
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function loop(now) {
    if (!V.active) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (V.auto && !dragging) {
      yaw = (yaw + dt * 0.012 * V.speed) % 1;
      updatePan();
    }
    dustStep(dt, now / 1000);
  }

  V.show = function (opts) {
    opts = opts || {};
    if (!init()) return false;
    V.active = true;
    V.auto = opts.auto !== false;
    V.speed = opts.speed || 1;
    yaw = 0.5; pitch = 0; zoom = 1;
    stage.hidden = false;
    var sv = el("sceneView");
    if (sv) sv.classList.add("is-vr");
    setPanorama(opts.pano, opts.image);
    setHotspots(opts.hotspots || []);
    if (opts.sky) sky.style.background = opts.sky;
    last = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    resize();
    return true;
  };

  V.hide = function () {
    if (!stage) return;
    V.active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    stage.hidden = true;
    var sv = el("sceneView");
    if (sv) sv.classList.remove("is-vr");
    if (tip) tip.hidden = true;
    if (spotsBox) spotsBox.innerHTML = "";
    spotEls = [];
    hotspots = [];
  };

  V.setAuto = function (on) { V.auto = !!on; };
  V.setSpeed = function (n) { V.speed = n === 4 ? 4 : n === 2 ? 2 : 1; };
  V.reset = function () { yaw = 0.5; pitch = 0; zoom = 1; updatePan(); };
  V.state = function () { return { active: V.active, auto: V.auto, speed: V.speed, yaw: yaw, pitch: pitch, zoom: zoom }; };
  V.resize = resize;
})();
