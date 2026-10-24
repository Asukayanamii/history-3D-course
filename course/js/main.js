/*
 * main.js —— 启动、主题切换、事件切换、键盘/翻页笔、自动演示、图层、公开 API（HISTORY_APP / __sandbox）。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util, ui = HS.ui, sfx = HS.sfx;
  var THEMES = window.HISTORY_THEMES || {};
  var ORDER = (window.HISTORY_THEME_ORDER || Object.keys(THEMES)).filter(function (id) {
    if (!THEMES[id]) console.warn("[史境] HISTORY_THEME_ORDER 中的主题未加载：", id);
    return !!THEMES[id];
  });

  HS.eventsOf = function (theme) {
    return (theme.events || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  };

  /* ---------------- URL 参数（只在首次加载时读取） ---------------- */
  var q = new URLSearchParams(location.search);
  var params = (HS.params = {
    theme: q.get("theme") || "",
    event: q.get("event") || "",
    demo: q.get("demo") === "1",
    dwell: parseInt(q.get("dwell"), 10),
    nointro: q.get("nointro") === "1",
    probeAssets: q.get("probeAssets") === "1"
  });
  if (!(params.dwell >= 1500 && params.dwell <= 60000)) {
    if (q.get("dwell")) console.info("[史境] dwell 参数无效，使用默认 6800ms");
    params.dwell = 6800;
  }

  var st = {
    themeId: "", theme: null, events: [], idx: -1, map: null, routes: null,
    playing: false, switching: false, seq: 0, demoTimer: 0, started: false,
    layers: { routes: true, regions: true, rivers: true, places: true, events: true, relief: true, vignette: true, spin: false }
  };

  /* ---------------- 场景工厂 ---------------- */
  function battleTerrain(ev, cfg) {
    var id = cfg.terrain;
    if (id && HS.dem && HS.dem.has(id)) {
      var def = HS.dem.def(id);
      return { dem: id, bounds: def.bounds, size: [92, 74], exaggeration: 9, meshStep: 0.012, edgeFalloff: 0 };
    }
    return {
      dem: "east-asia",
      bounds: { west: ev.lon - 1.35, east: ev.lon + 1.35, south: ev.lat - 0.95, north: ev.lat + 0.95 },
      size: [92, 74], exaggeration: 9, meshStep: 0.03, edgeFalloff: 0
    };
  }

  function makeBattleScene(ev) {
    var cfg = ev.battle || {};
    var theme = st.theme || {};
    var sides = cfg.sides || [
      { id: "a", name: "攻方", color: (theme.meta && theme.meta.accent) || "#c8402f", short: "攻" },
      { id: "b", name: "守方", color: "#6f8399", short: "守" }
    ];
    var detail = ev.detail || [];
    var phases = cfg.phases || [
      { at: 0.00, date: ev.shortDate || ev.date || "", label: "接战", log: detail[0] || ev.summary || "" },
      { at: 0.28, date: ev.shortDate || ev.date || "", label: "相持", log: detail[1] || "" },
      { at: 0.58, date: ev.shortDate || ev.date || "", label: "转折", log: detail[2] || ev.result || "" },
      { at: 0.82, date: ev.shortDate || ev.date || "", label: "收束", log: detail[3] || ev.result || "" }
    ];
    return {
      type: "battle",
      title: ev.title + " · 战场情景",
      subtitle: (ev.shortDate || ev.date || "") + " · " + sides.map(function (s) { return s.name; }).join(" vs "),
      note: "地形为真实 DEM；兵力、编制、阵型、占地网格、地标与兵/气条为教学情景示意，不是精确历史阵图或历史疆域。",
      duration: cfg.duration || 24,
      seed: cfg.seed || (U.hash(ev.id) % 100000),
      preset: cfg.preset || "field",
      terrain: battleTerrain(ev, cfg),
      grid: cfg.grid || null,
      landmarks: cfg.landmarks || null,
      sides: sides,
      phases: phases,
      text: { time: ev.date, place: ev.place, figures: ev.figures, result: ev.result, impact: ev.impact },
      image: ev.image && ev.image.file
    };
  }

  HS.sceneFor = function (ev, theme) {
    if (!ev) return null;
    if (ev.scene) return ev.scene;
    if (ev.kind === "war") return makeBattleScene(ev, theme || st.theme);
    return null;
  };

  HS.sceneForVR = function (ev) {
    if (!ev || !ev.image || !ev.image.file) return null;
    var pano = ev.vr && ev.vr.pano;
    if (!pano) {
      var m = /^assets\/events\/([^/]+)\/([^/.]+)\.jpg$/.exec(ev.image.file);
      if (m) pano = "assets/vr/" + m[1] + "/" + m[2] + ".jpg";
    }
    var item = pano ? HS.assets.byPath(pano) : null;
    var usable = !!item && (item.status === "ready" || item.status === "needs-review");
    return {
      type: "vr",
      title: ev.title + " · 360° 环视",
      subtitle: (ev.shortDate || ev.date || "") + " · " + (ev.place || ""),
      note: usable ? "360° 环视：2:1 全景由 AI 插画扩展生成，不是全景摄影；可替换为 GPT-Image2 真全景。" : "图片环视，不是 360° 全景。",
      pano: usable ? pano : "",
      image: ev.image.file,
      hotspots: (ev.vr && ev.vr.hotspots) || [],
      text: { time: ev.date, place: ev.place, figures: ev.figures, result: ev.result, impact: ev.impact },
      auto: true
    };
  };

  /* ---------------- 场景构建 / 释放 ---------------- */
  function build(theme) {
    HS.proj.set(theme.map.bounds);
    st.map = HS.buildMap(theme);
    st.routes = HS.buildRoutes(theme, st.map);
    HS.stage.root.add(st.map.group, st.routes.group);
    st.theme = theme;
    st.themeId = theme.meta.id;
    st.events = HS.eventsOf(theme);
    st.idx = -1;
    validate(theme);
    Object.keys(st.layers).forEach(function (k) { applyLayer(k, st.layers[k]); });
    HS.labels.remeasure();
  }

  function teardown() {
    HS.tween.killTag("route");
    HS.timers.clearAll();
    HS.labels.clear();
    if (st.map) st.map.dispose();
    if (st.routes) st.routes.dispose();
    st.map = st.routes = null;
  }

  // 数据引用检查：找不到 routeId/nodeId 时回退到事件经纬度，只警告不崩溃
  function validate(theme) {
    var b = theme.map.bounds;
    st.events.forEach(function (ev) {
      if (st.routes.nodeT(ev.routeId, ev.nodeId) == null)
        console.warn("[史境] " + theme.meta.id + "/" + ev.id + " 的 routeId/nodeId 无法解析（" + ev.routeId + " / " + ev.nodeId + "），将回退到事件经纬度");
      if (!(ev.lon >= b.west && ev.lon <= b.east && ev.lat >= b.south && ev.lat <= b.north))
        console.warn("[史境] " + theme.meta.id + "/" + ev.id + " 的坐标不在 map.bounds 内");
    });
  }

  HS.stage.frameHooks.push(function (dt, t) {
    if (st.map) st.map.update(dt, t);
    if (st.routes) st.routes.update(dt, t);
  });

  /* ---------------- 图层 ---------------- */
  function applyLayer(name, on) {
    st.layers[name] = on;
    if (name === "spin") { HS.stage.controls.autoRotate = on; ui.setLayerBox(name, on); return; }
    if (st.map) st.map.setLayer(name, on);
    if (st.routes) st.routes.setLayer(name, on);
    HS.labels.setLayer(name, on);
    ui.setLayerBox(name, on);
  }

  /* ---------------- 卡片 ---------------- */
  function openCard(ev) {
    ui.fillCard(ev, st.idx, st.events.length);
    ui.openCard();
    HS.stage.setViewOffset(ui.cardWidth() / 2);
    sfx.card();
    if (st.playing) scheduleNext();
  }
  function closeCard() {
    ui.closeCard();
    HS.stage.setViewOffset(0);
  }

  /* ---------------- 事件切换 ---------------- */
  function locate(ev) {
    var node = st.routes.nodeOf(ev.routeId, ev.nodeId);
    return node ? { lon: node.lon, lat: node.lat } : { lon: ev.lon, lat: ev.lat };
  }

  function goTo(id, opts) {
    opts = opts || {};
    if (st.switching || !st.theme) return false;
    var idx = -1;
    for (var i = 0; i < st.events.length; i++) if (st.events[i].id === id) idx = i;
    if (idx < 0) { console.warn("[史境] 找不到事件：", id); return false; }
    if (opts.user && st.playing) pause(true);
    var ev = st.events[idx], my = ++st.seq;
    HS.timers.clear(st.demoTimer);
    st.idx = idx;
    ui.closeCard();
    ui.closeModal("ask");
    ui.setNow(ev, idx, st.events.length);
    st.routes.setCurrent(ev);
    st.map.highlight(ev.regionId);
    if (st.map.setVignette) st.map.setVignette(ev);
    sfx.step();

    var t = st.routes.nodeT(ev.routeId, ev.nodeId), dur = 0;
    if (t != null) dur = st.routes.go(ev.routeId, t, { instant: opts.instant });

    var at = locate(ev), f = ev.focus || {};
    var fly = opts.fly === false ? Promise.resolve() :
      HS.camera.flyTo({ lon: at.lon, lat: at.lat, dist: f.dist || 22, az: f.az || 0, polar: f.polar || 48 });
    Promise.all([fly, U.sleep(dur + 60)]).then(function () {
      if (my !== st.seq || st.switching) return;
      openCard(ev);
    });
    return true;
  }

  function next(opts) {
    if (!st.events.length) return;
    if (st.idx >= st.events.length - 1) { ui.toast("已经是最后一站"); return false; }
    return goTo(st.events[st.idx + 1].id, opts);
  }
  function prev(opts) {
    if (!st.events.length) return;
    if (st.idx <= 0) { ui.toast("已经是第一站"); return false; }
    return goTo(st.events[st.idx - 1].id, opts);
  }

  function goHome() {
    if (!st.theme) return;
    closeCard();
    return HS.camera.flyTo(st.theme.meta.home || { dist: 44, polar: 40 });
  }

  function enterVR(ev) {
    ev = ev || st.events[st.idx];
    if (!ev) { ui.toast("请先选择一个事件"); return false; }
    var data = HS.sceneForVR(ev);
    if (!data) { ui.toast("该事件暂无可用的 360° 图景"); return false; }
    if (st.playing) pause(true);
    return HS.scene.enter(data, ev);
  }

  /* ---------------- 主题切换 ---------------- */
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function liftedHome(theme) {
    var h = theme.meta.home || { dist: 44, az: 0, polar: 40 };
    return { dist: (h.dist || 44) * 1.45, az: (h.az || 0) - 18, polar: Math.max(14, (h.polar || 40) - 14) };
  }

  // opts.eventId：切换后打开的事件；opts.enter === false：只重建，不开卡片（首屏里选时期用）
  function switchTheme(id, opts) {
    opts = opts || {};
    if (!THEMES[id]) { console.warn("[史境] 未知主题：", id); return Promise.resolve(false); }
    if (st.switching) return Promise.resolve(false);
    if (HS.scene && HS.scene.active) HS.scene.exit();
    if (id === st.themeId && !opts.force) {
      if (opts.enter !== false) goTo(opts.eventId || st.theme.meta.defaultEventId);
      return Promise.resolve(true);
    }
    st.switching = true;
    st.seq++;
    pause(false);
    closeCard();
    ui.closeModal(ui.anyModal());
    ui.toggleLayers(false);
    ui.setFade(true);
    return wait(opts.quick ? 0 : 320).then(function () {
      teardown();
      var theme = THEMES[id];
      build(theme);
      ui.setTheme(theme);
      HS.camera.set(liftedHome(theme));
      ui.setFade(false);
      st.switching = false;
      if (opts.enter === false) return true;
      return enter(opts.eventId);
    });
  }

  // 飞到全景，然后打开默认事件（或指定事件）的卡片
  function enter(eventId) {
    var theme = st.theme, my = ++st.seq;
    sfx.enter();
    st.switching = true;
    return HS.camera.flyTo(theme.meta.home || { dist: 44, polar: 40 }, { dur: 1300, lift: 0 })
      .then(function () { return wait(300); })
      .then(function () {
        st.switching = false;
        if (my !== st.seq) return true;
        var target = eventId && st.events.some(function (e) { return e.id === eventId; }) ? eventId : theme.meta.defaultEventId;
        if (!st.events.some(function (e) { return e.id === target; })) target = st.events[0] && st.events[0].id;
        if (target) goTo(target, { fly: !!eventId && eventId !== theme.meta.defaultEventId });
        return true;
      });
  }

  /* ---------------- 自动演示 ---------------- */
  function scheduleNext() {
    HS.timers.clear(st.demoTimer);
    st.demoTimer = HS.timers.set(function () {
      if (!st.playing) return;
      if (st.idx >= st.events.length - 1) { pause(false); ui.toast("演示结束", 3200); return; }
      goTo(st.events[st.idx + 1].id);
    }, params.dwell);
  }
  function play() {
    if (!st.theme || st.switching) return;
    st.playing = true;
    ui.setDemo(true);
    if (st.idx < 0 || st.idx >= st.events.length - 1 && ui.cardOpen) goTo(st.events[0].id);
    else if (!ui.cardOpen) goTo(st.events[st.idx].id);
    else scheduleNext();
  }
  function pause(byUser) {
    if (!st.playing) return;
    st.playing = false;
    HS.timers.clear(st.demoTimer);
    ui.setDemo(false);
    if (byUser) ui.toast("自动演示已暂停，按 P 继续");
  }
  HS.on("user-interact", function () { if (st.playing) pause(true); });

  /* ---------------- 课堂提问 ---------------- */
  function ask() {
    var ev = st.events[st.idx];
    if (ui.askStage === 1) { ui.revealAsk(); sfx.ask(); return; }
    if (ui.askStage === 2) { ui.closeModal("ask"); return; }
    if (!ev) { ui.toast("请先选择一个事件"); return; }
    if (st.playing) pause(true);
    ui.openAsk(ev);
    sfx.ask();
  }

  /* ---------------- 其他动作 ---------------- */
  function toggleFull() {
    if (!document.fullscreenElement) {
      var p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () { ui.toast("浏览器拒绝了全屏请求，可按 F11"); });
    } else if (document.exitFullscreen) document.exitFullscreen();
  }
  function toggleMute() {
    sfx.unlock();
    var m = sfx.toggle();
    ui.setMuted(m);
    ui.toast(m ? "已静音" : "音效已开启");
  }
  function start() {
    if (st.started) return;
    st.started = true;
    ui.hideIntro(); // 音频在第一次点击/按键时才启动（见下方 unlock 监听）
    enter(params.event).then(function () {
      if (params.demo) setTimeout(play, 1200);
    });
  }

  /* ---------------- UI 绑定 ---------------- */
  ui.init();
  ui.on("start", start);
  ui.on("intro-theme", function (id) { switchTheme(id, { enter: false, quick: true }); });
  ui.on("theme", function (id) { switchTheme(id); });
  ui.on("goto", function (id) { goTo(id, { user: true }); });
  ui.on("next", function () { next({ user: true }); });
  ui.on("prev", function () { prev({ user: true }); });
  ui.on("home", goHome);
  ui.on("close-card", closeCard);
  ui.on("ask", ask);
  ui.on("reveal", ask);
  ui.on("scene", function () {
    var ev = st.events[st.idx];
    if (!ev) { ui.toast("请先选择一个事件"); return; }
    var scene = HS.sceneFor(ev, st.theme);
    if (!scene) { ui.toast("该事件暂无 3D 场景，待补"); return; }
    if (st.playing) pause(true);
    if (!HS.scene.enter(scene, ev)) ui.toast("场景数据不完整");
  });
  ui.on("vr", function () { enterVR(); });
  ui.on("scene-vr", function () { enterVR(); });
  ui.on("scene-exit", function () { HS.scene.exit(); });
  ui.on("scene-play", function () { HS.scene.toggle(); });
  ui.on("war-speed", function (btn) {
    var n = btn && btn.getAttribute ? +btn.getAttribute("data-speed") : 1;
    HS.scene.setSpeed(n);
  });
  ui.on("war-restart", function () { HS.scene.restart(); });
  ui.on("war-phase", function (i) { HS.scene.goToPhase(i); });
  ui.on("war-layer", function (o) { HS.scene.setWarLayer(o.name, o.on); });
  ui.on("layers", function () { ui.toggleLayers(); });
  ui.on("layer", function (o) { applyLayer(o.name, o.on); });
  ui.on("sound", toggleMute);
  ui.on("demo", function () { st.playing ? pause(false) : play(); });
  ui.on("full", toggleFull);
  ui.on("sources", function () { ui.openSources(THEMES, ORDER, st.themeId); });
  ui.on("help", function () { ui.openModal("help"); });
  ui.on("route", function (rid) {
    var ev = st.events.filter(function (e) { return e.routeId === rid; })[0];
    if (ev) goTo(ev.id, { user: true });
  });
  HS.on("pick-event", function (id) { goTo(id, { user: true }); });
  HS.on("resize", function () { if (ui.cardOpen) HS.stage.setViewOffset(ui.cardWidth() / 2); HS.labels.remeasure(); });

  ["pointerdown", "keydown"].forEach(function (t) { window.addEventListener(t, function () { sfx.unlock(); }, { once: true }); });

  /* ---------------- 键盘 / 翻页笔 ---------------- */
  window.addEventListener("keydown", function (e) {
    var tg = e.target;
    if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, handled = true;

    if (HS.scene && HS.scene.active) {
      var sc = HS.scene.state();
      if (sc.type === "vr") {
        if (k === "Escape" || k === "e" || k === "E" || k === "v" || k === "V") HS.scene.exit();
        else if (k === " " || k === "Spacebar") HS.scene.toggle();
        else if (k === "1" || k === "2" || k === "3") HS.scene.setSpeed(k === "3" ? 4 : +k);
        else if (k === "Home") HS.vr360.reset();
      } else if (sc.type === "war") {
        if (k === "1" || k === "2" || k === "3") HS.scene.setSpeed(k === "3" ? 4 : +k);
        else if (k === "r" || k === "R") HS.scene.restart();
        else if (k === "l" || k === "L") ui.toggleWarLayers();
        else if (k === "v" || k === "V") enterVR();
        else if (k === "Escape" || k === "e" || k === "E") HS.scene.exit();
        else if (k === " " || k === "Spacebar") HS.scene.toggle();
      } else if (sc.type === "battle" || sc.type === "court") {
        if (k === "1" || k === "2" || k === "3") HS.scene.setSpeed(k === "3" ? 4 : +k);
        else if (k === "r" || k === "R") HS.scene.restart();
        else if ((k === "l" || k === "L") && sc.type === "battle") ui.toggleWarLayers();
        else if (k === "v" || k === "V") enterVR();
        else if (k === "Escape" || k === "e" || k === "E") HS.scene.exit();
        else if (k === " " || k === "Spacebar") HS.scene.toggle();
      } else if (k === "Escape" || k === "e" || k === "E") {
        HS.scene.exit();
      } else if (k === " " || k === "Spacebar") {
        HS.scene.toggle();
      }
      e.preventDefault();
      return;
    }

    if (ui.introVisible()) {
      if (k === "Enter" || k === " " || k === "ArrowRight" || k === "PageDown") start();
      else if (k === "1" || k === "2" || k === "3") { var tid = ORDER[+k - 1]; if (tid) switchTheme(tid, { enter: false, quick: true }); }
      else handled = false;
      if (handled) e.preventDefault();
      return;
    }

    switch (k) {
      case "ArrowRight": case "PageDown": case " ": case "Spacebar": next({ user: true }); break;
      case "ArrowLeft": case "PageUp": case "Backspace": prev({ user: true }); break;
      case "Home": goHome(); break;
      case "q": case "Q": ask(); break;
      case "e": case "E":
        var sev = st.events[st.idx];
        var sscene = sev && HS.sceneFor(sev, st.theme);
        if (sscene) { if (st.playing) pause(true); HS.scene.enter(sscene, sev); }
        else ui.toast("该事件暂无 3D 场景，待补");
        break;
      case "v": case "V":
        enterVR();
        break;
      case "p": case "P": st.playing ? pause(false) : play(); break;
      case "l": case "L": ui.toggleLayers(); break;
      case "m": case "M": toggleMute(); break;
      case "f": case "F": toggleFull(); break;
      case "?": ui.openModal("help"); break;
      case "1": case "2": case "3": var id = ORDER[+k - 1]; if (id) switchTheme(id); break;
      case "Escape":
        var m = ui.anyModal();
        if (m) ui.closeModal(m);
        else if (!document.getElementById("layers").hidden) ui.toggleLayers(false);
        else if (ui.cardOpen) closeCard();
        else if (document.fullscreenElement) document.exitFullscreen();
        break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  /* ---------------- 启动 ---------------- */
  HS.stage.init(document.getElementById("stage"));
  HS.labels.init(document.getElementById("labels"));
  ui.loadBackdrop();

  var first = params.theme && THEMES[params.theme] ? params.theme : window.HISTORY_DEFAULT_THEME;
  if (params.theme && !THEMES[params.theme]) console.info("[史境] theme 参数无效，回退到默认主题：", first);
  if (!THEMES[first]) first = ORDER[0];
  if (params.event && !(THEMES[first].events || []).some(function (e) { return e.id === params.event; })) {
    console.info("[史境] event 参数无效，回退到默认事件：", params.event);
    params.event = "";
  }
  ui.renderTabs(ORDER, THEMES, first);
  build(THEMES[first]);
  ui.setTheme(THEMES[first]);
  HS.camera.set(liftedHome(THEMES[first]));
  if (params.nointro) start();

  /* ---------------- 公开 API ---------------- */
  window.HISTORY_APP = {
    switchTheme: function (id, opts) { if (!st.started) { st.started = true; ui.hideIntro(); } return switchTheme(id, opts); },
    goTo: function (id) { return goTo(id, { user: false }); },
    next: function () { return next(); },
    prev: function () { return prev(); },
    play: play,
    pause: function () { pause(false); },
    goHome: goHome,
    start: start,
    ask: ask,
    toggleLayer: function (name, on) { applyLayer(name, on == null ? !st.layers[name] : !!on); },
    enterScene: function (id) {
      var ev = id ? st.events.filter(function (e) { return e.id === id; })[0] : st.events[st.idx];
      var scene = ev && HS.sceneFor(ev, st.theme);
      if (!scene) return false;
      return HS.scene.enter(scene, ev);
    },
    enterVR: function (id) {
      var ev = id ? st.events.filter(function (e) { return e.id === id; })[0] : st.events[st.idx];
      return enterVR(ev);
    },
    exitVR: function () { return HS.scene.exit(); },
    sceneFor: function (id) {
      var ev = id ? st.events.filter(function (e) { return e.id === id; })[0] : st.events[st.idx];
      return ev ? HS.sceneFor(ev, st.theme) : null;
    },
    sceneForVR: function (id) {
      var ev = id ? st.events.filter(function (e) { return e.id === id; })[0] : st.events[st.idx];
      return ev ? HS.sceneForVR(ev) : null;
    },
    exitScene: function () { return HS.scene.exit(); },
    toggleScene: function () { return HS.scene.toggle(); },
    setSceneSpeed: function (n) { return HS.scene.setSpeed(n); },
    restartScene: function () { return HS.scene.restart(); },
    goToScenePhase: function (i) { return HS.scene.goToPhase(i); },
    state: function () {
      var ev = st.events[st.idx], r = st.routes ? st.routes.state() : { routeId: "", progress: 0 };
      var ss = HS.scene ? HS.scene.state() : { active: false, type: "" };
      return {
        theme: st.themeId, eventId: ev ? ev.id : "", routeId: r.routeId, progress: r.progress,
        playing: st.playing, muted: sfx.muted, index: st.idx, total: st.events.length,
        cardOpen: ui.cardOpen, flying: HS.camera.flying, switching: st.switching, modal: ui.anyModal(), dwell: params.dwell,
        scene: !!ss.active, sceneType: ss.type || "", sceneState: ss,
        war: ss.type === "war" ? ss : null
      };
    },
    screenOf: function (lon, lat) {
      var p = HS.labels.project(HS.proj.vec(lon, lat, 0));
      return { x: Math.round(p.x), y: Math.round(p.y), visible: p.visible };
    },
    isFlying: function () { return HS.camera.flying; },
    themes: function () { return ORDER.slice(); }
  };
  window.__sandbox = window.HISTORY_APP;
})();
