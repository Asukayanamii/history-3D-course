/*
 * sfx.js —— Web Audio 实时合成音效，不加载任何音频文件，不含背景音乐。
 * 浏览器要求用户先有一次交互才能出声：unlock() 在第一次点击/按键时调用。
 */
(function () {
  "use strict";

  var HS = window.HS;
  var ctx = null, master = null, windGain = null, droneGain = null, noiseBuf = null;

  var S = (HS.sfx = { muted: false, ready: false });

  function makeNoise() {
    var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    // 褐噪声：比白噪声柔和，适合做风声
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    return buf;
  }

  S.unlock = function () {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = S.muted ? 0 : 0.8;
    master.connect(ctx.destination);
    noiseBuf = makeNoise();
    S.ready = true;
    startBed();
  };

  // 环境铺底：低频持续音 + 带通滤波的风声，缓慢起伏
  function startBed() {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.6;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    src.connect(bp).connect(windGain).connect(master);
    src.start();
    var lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();

    droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    [55, 82.4].forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = i ? "triangle" : "sine";
      o.frequency.value = f;
      var g = ctx.createGain();
      g.gain.value = i ? 0.25 : 0.5;
      o.connect(g).connect(droneGain);
      o.start();
    });
    droneGain.connect(master);
  }

  // 进入/切换主题：铺底淡入一次，然后停留在很低的音量
  S.enter = function () {
    if (!ctx) return;
    var t = ctx.currentTime;
    [[windGain, 0.16, 0.05], [droneGain, 0.09, 0.025]].forEach(function (p) {
      p[0].gain.cancelScheduledValues(t);
      p[0].gain.setValueAtTime(p[0].gain.value, t);
      p[0].gain.linearRampToValueAtTime(p[1], t + 1.2);
      p[0].gain.linearRampToValueAtTime(p[2], t + 5);
    });
  };

  // 路线推进：短促的木鱼/鼓点
  S.step = function () {
    if (!ctx || S.muted) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.3);
    var n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
    n.buffer = noiseBuf;
    hp.type = "bandpass";
    hp.frequency.value = 1800;
    hp.Q.value = 1.2;
    ng.gain.setValueAtTime(0.35, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(hp).connect(ng).connect(master);
    n.start(t, Math.random());
    n.stop(t + 0.08);
  };

  // 卡片打开：一声轻响（类似磬）
  S.card = function () {
    if (!ctx || S.muted) return;
    var t = ctx.currentTime;
    [[660, 0.16], [990, 0.08], [1485, 0.04]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p[1], t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 1.5);
    });
  };

  // 课堂提问：两声上行
  S.ask = function () {
    if (!ctx || S.muted) return;
    var t = ctx.currentTime;
    [523, 784].forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t0 = t + i * 0.12;
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g).connect(master);
      o.start(t0);
      o.stop(t0 + 0.55);
    });
  };

  S.setMuted = function (m) {
    S.muted = !!m;
    if (master) master.gain.setTargetAtTime(S.muted ? 0 : 0.8, ctx.currentTime, 0.05);
    return S.muted;
  };
  S.toggle = function () { return S.setMuted(!S.muted); };
})();
