/*
 * ui.js —— 顶栏、时期标签、当前事件胶囊、图例、时间轴、事件卡片、课堂提问、来源与授权、图层、帮助、首屏。
 * 只负责 DOM；所有动作通过 HS.ui.on(act, fn) 交给 main.js。
 */
(function () {
  "use strict";

  var HS = window.HS, U = HS.util;
  var $ = function (id) { return document.getElementById(id); };

  var ui = (HS.ui = { handlers: {}, askStage: 0, cardOpen: false, srcTheme: "" });

  ui.on = function (act, fn) { ui.handlers[act] = fn; };
  function fire(act, arg) { var fn = ui.handlers[act]; if (fn) fn(arg); }

  var LEVEL_TEXT = { consensus: "教材共识", debate: "学界有争议", tradition: "后世传说 / 文学叙述", uncertain: "存疑" };
  var STATUS_TEXT = { placeholder: "占位 · 待核订", sourced: "已补来源 · 待审核", reviewed: "已审核" };
  var KIND_TEXT = { war: "战争", politics: "政治", reform: "改革", diplomacy: "外交" };
  var USAGE_TEXT = { reference: "参考", image: "图片", data: "随附使用" };
  var SIDE_COLOR = { reform: "#c9a865", cautious: "#8a9b6a", neutral: "#7f8b9a", conservative: "#9a6a55" };

  ui.init = function () {
    var proj = window.HISTORY_PROJECT || {};
    $("projName").textContent = proj.fullName || "史境 · 三维历史沙盘";
    $("introTitle").textContent = proj.fullName || "史境 · 三维历史沙盘";
    $("introSub").textContent = proj.subtitle || "";
    $("introNote").textContent = proj.disclaimer || "";
    $("footNote").textContent = proj.disclaimer || "";
    $("footVer").textContent = "v" + (proj.version || "0.1");

    // 所有带 data-act 的按钮
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      var act = b.getAttribute("data-act");
      if (b.tagName === "BUTTON") b.blur(); // 避免空格键再次触发按钮
      if (act === "close") {
        var modal = b.closest(".modal");
        if (modal) ui.closeModal(modal.id);
        else if (b.closest("#card")) fire("close-card");
        return;
      }
      fire(act, b);
    });

    // 点遮罩空白处关闭弹窗
    document.querySelectorAll(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) { if (e.target === m) ui.closeModal(m.id); });
    });

    $("layers").addEventListener("change", function (e) {
      var inp = e.target;
      if (inp.matches("input[data-layer]")) fire("layer", { name: inp.getAttribute("data-layer"), on: inp.checked });
    });

    $("introStart").addEventListener("click", function () { fire("start"); });
  };

  /* ---------------- 时期标签 ---------------- */
  ui.renderTabs = function (order, themes, current) {
    var nav = $("tabs"), intro = $("introThemes");
    nav.innerHTML = "";
    intro.innerHTML = "";
    order.forEach(function (id, i) {
      var t = themes[id];
      if (!t) return;
      var b = U.el("button", "tab" + (id === current ? " is-on" : ""),
        "<kbd>" + (i + 1) + "</kbd><span>" + U.esc(t.meta.tabLabel || t.meta.title) + "</span>");
      b.title = (t.meta.subtitle || "") + "（快捷键 " + (i + 1) + "）";
      b.addEventListener("click", function () { fire("theme", id); });
      nav.appendChild(b);

      var c = U.el("button", "intro-theme" + (id === current ? " is-on" : ""),
        "<span class='it-cover' data-cover='" + U.esc(t.meta.cover || "") + "'></span>" +
        "<b>" + U.esc(t.meta.title) + "</b><small>" + U.esc(t.meta.subtitle || "") + "</small>");
      c.style.setProperty("--accent", t.meta.accent || "#c8402f");
      c.addEventListener("click", function () { fire("intro-theme", id); });
      intro.appendChild(c);
      var cov = c.querySelector(".it-cover");
      HS.assets.load(t.meta.cover, function (url) { cov.style.backgroundImage = "url('" + url + "')"; cov.classList.add("has-img"); });
    });
  };

  ui.markTab = function (id) {
    var order = window.HISTORY_THEME_ORDER;
    document.querySelectorAll("#tabs .tab").forEach(function (b, i) { b.classList.toggle("is-on", order[i] === id); });
    document.querySelectorAll("#introThemes .intro-theme").forEach(function (b, i) { b.classList.toggle("is-on", order[i] === id); });
  };

  /* ---------------- 主题 ---------------- */
  ui.setTheme = function (theme) {
    ui.theme = theme;
    var m = theme.meta;
    document.documentElement.style.setProperty("--accent", m.accent || "#c8402f");
    $("themeTitle").textContent = m.title + (m.subtitle ? " · " + m.subtitle : "");
    $("themePeriod").textContent = m.periodLabel || "";
    ui.markTab(m.id);

    // 首屏封面
    var cover = $("introCover");
    cover.classList.remove("has-img");
    cover.style.backgroundImage = "";
    HS.assets.load(m.cover, function (url) { cover.style.backgroundImage = "url('" + url + "')"; cover.classList.add("has-img"); });

    // 图例
    var ul = $("legendRoutes");
    ul.innerHTML = "";
    (theme.routes || []).forEach(function (r) {
      var li = U.el("li", "", "<i style='--c:" + U.esc(r.color) + "'></i><span>" + U.esc(r.name) + "</span>");
      li.title = "跳到这条路线的第一个事件";
      li.addEventListener("click", function () { fire("route", r.id); });
      ul.appendChild(li);
    });
    var key = (theme.map.regions || []).filter(function (r) { return r.highlight; }).map(function (r) {
      return r.name + (r.highlightReason ? "（" + r.highlightReason + "）" : "");
    });
    var omitted = (theme.map.omitted || []).map(function (o) { return o.name; }).filter(Boolean);
    var snap = theme.map.mapSnapshot || m.periodLabel || "";
    var terr = theme.map.terrain && theme.map.terrain.mode === "dem"
      ? "地形：SRTM/GMTED/ETOPO1 真实高程（垂直夸张 " + (theme.map.terrain.exaggeration || 14) + "×，非导航数据）"
      : "地形：程序化示意";
    $("legendNote").innerHTML =
      (key.length ? "<span class='key-swatch'></span>重点政权：" + U.esc(key.join("、")) + "<br>" : "") +
      (snap ? "地图快照：" + U.esc(snap) + "<br>" : "") +
      (omitted.length ? "未单列：" + U.esc(omitted.join("、")) + "<br>" : "") +
      U.esc(terr) + "<br>" +
      U.esc(m.periodLabel || "") + " 形势示意<br><span class='muted'>历史疆域为示意；外部来源与许可见「来源与授权」</span>";

    // 时间轴
    var evs = HS.eventsOf(theme);
    $("tlStart").textContent = (theme.timeline && theme.timeline.start) || (evs[0] && evs[0].shortDate) || "";
    $("tlEnd").textContent = (theme.timeline && theme.timeline.end) || (evs[evs.length - 1] && evs[evs.length - 1].shortDate) || "";
    var dots = $("tlDots");
    dots.innerHTML = "";
    var ticks = {};
    ((theme.timeline && theme.timeline.ticks) || []).forEach(function (t) { if (t.eventId) ticks[t.eventId] = t; });
    evs.forEach(function (ev, i) {
      var t = ticks[ev.id] || {};
      var pct = evs.length > 1 ? (i / (evs.length - 1)) * 100 : 50;
      var d = U.el("button", "tl-dot",
        "<span class='tl-date'>" + U.esc(t.at || ev.shortDate || "") + "</span><i></i><span class='tl-name'>" + U.esc(t.label || ev.title) + "</span>");
      d.style.left = pct + "%";
      d.setAttribute("data-ev", ev.id);
      d.title = (ev.date || "") + " " + ev.title;
      d.addEventListener("click", function () { fire("goto", ev.id); });
      dots.appendChild(d);
    });
    $("tlFill").style.width = "0%";
    ui.setNow(null);
    ui.srcTheme = m.id;
  };

  /* ---------------- 当前事件 ---------------- */
  ui.setNow = function (ev, idx, total) {
    var box = $("now");
    box.classList.toggle("is-empty", !ev);
    $("nowNo").textContent = ev ? "第 " + (idx + 1) + " / " + total + " 站" : "—";
    $("nowDate").textContent = ev ? ev.date || "" : "";
    $("nowTitle").textContent = ev ? ev.title : "按 → 或点击地图上的地名开始";
    var st = $("nowStatus");
    st.hidden = !ev || ev.status === "reviewed";
    if (ev) st.textContent = STATUS_TEXT[ev.status] || STATUS_TEXT.placeholder;

    var dots = document.querySelectorAll("#tlDots .tl-dot");
    dots.forEach(function (d, i) {
      d.classList.toggle("is-cur", ev && i === idx);
      d.classList.toggle("is-done", ev && i < idx);
    });
    $("tlFill").style.width = ev && total > 1 ? (idx / (total - 1)) * 100 + "%" : "0%";
  };

  /* ---------------- 事件卡片 ---------------- */
  ui.fillCard = function (ev, idx, total) {
    var no = String(ev.order != null ? ev.order : idx + 1);
    if (no.length < 2) no = "0" + no;
    $("phNo").textContent = no;
    $("phTitle").textContent = ev.title;
    $("cardNo").textContent = "第 " + (idx + 1) + " 站";
    $("cardDate").textContent = ev.date || "";
    $("cardPlace").textContent = ev.place || "";
    $("cardTitle").textContent = ev.title;
    $("cardSum").textContent = ev.summary || "";
    var figs = ev.figures || [];
    var fbox = $("cardFigures");
    if (figs.length) {
      fbox.hidden = false;
      fbox.innerHTML = "<b>主要人物</b>：" + figs.map(function (f) { return U.esc(f); }).join("、");
    } else {
      fbox.hidden = true;
      fbox.innerHTML = "";
    }
    var ul = $("cardDetail");
    ul.innerHTML = "";
    (ev.detail || []).slice(0, 5).forEach(function (d) { ul.appendChild(U.el("li", "", U.esc(d))); });

    var chips = [];
    if (ev.kind) chips.push("<span class='chip chip-kind kind-" + U.esc(ev.kind) + "'>" + U.esc(KIND_TEXT[ev.kind] || ev.kind) + "</span>");
    if (ev.status !== "reviewed") chips.push("<span class='chip chip-ph'>" + U.esc(STATUS_TEXT[ev.status] || STATUS_TEXT.placeholder) + "</span>");
    var lv = ev.historiography && ev.historiography.level;
    if (lv && lv !== "consensus") chips.push("<span class='chip chip-hist' title='" + U.esc(ev.historiography.note || "") + "'>" + U.esc(LEVEL_TEXT[lv] || lv) + "</span>");
    $("cardChips").innerHTML = chips.join("");

    // 配图：清单里不是 missing 才加载；失败时保持设计过的占位图
    var pic = $("cardPic"), img = $("picImg"), badge = $("picBadge");
    pic.classList.remove("has-img");
    img.style.backgroundImage = "";
    badge.hidden = true;
    var file = ev.image && ev.image.file;
    pic.setAttribute("aria-label", (ev.image && ev.image.alt) || ev.title);
    var token = (ui._imgToken = (ui._imgToken || 0) + 1);
    HS.assets.load(file, function (url) {
      if (token !== ui._imgToken) return;
      img.style.backgroundImage = "url('" + url + "')";
      img.style.backgroundPosition = (ev.image && ev.image.position) || "center";
      pic.classList.add("has-img");
      var st = HS.assets.status(file);
      if (st === "placeholder") { badge.textContent = "占位 · 待替换"; badge.hidden = false; }
      else if (st === "needs-review") { badge.textContent = "待审"; badge.hidden = false; }
    });

    var prev = document.querySelector("#card [data-act=prev]"), next = document.querySelector("#card [data-act=next]");
    prev.disabled = idx <= 0;
    next.disabled = idx >= total - 1;
    var scene = HS.sceneFor ? HS.sceneFor(ev, ui.theme) : ev.scene;
    var sb = $("sceneBtn"), sbn = $("sceneBtnNote");
    if (sb) {
      sb.disabled = !scene;
      sb.title = scene ? "进入 3D 全知场景（E）" : (ev.kind === "war" ? "该战争场景数据缺失" : "该事件暂无 3D 场景，待补");
      if (sbn) sbn.hidden = !!scene;
    }
    var vrb = $("vrBtn");
    if (vrb) {
      vrb.hidden = !(ev.image && ev.image.file);
      vrb.title = "360° 环视（V）";
    }
    document.querySelector("#card .card-body").scrollTop = 0;
  };

  ui.openCard = function () {
    $("card").classList.add("is-open");
    ui.cardOpen = true;
  };
  ui.closeCard = function () {
    $("card").classList.remove("is-open");
    ui.cardOpen = false;
  };
  ui.cardWidth = function () {
    var c = $("card");
    if (window.innerWidth < 900) return 0; // 小屏为底部抽屉，不需要左移
    return c.offsetWidth + 28;
  };

  /* ---------------- 3D 场景 UI ---------------- */
  ui.isSceneOpen = function () { return !$("sceneView").hidden; };

  ui.openScene = function (data, ev) {
    data = data || {};
    ["warSides", "warTimeline", "warSpeed", "warRestart", "warLogWrap", "warLayersWrap", "courtSpeakerWrap"].forEach(function (id) {
      var el = $(id); if (el) el.hidden = true;
    });
    var vrb = $("sceneVrBtn"); if (vrb) vrb.hidden = true;
    if ($("courtSpeaker")) $("courtSpeaker").textContent = "";
    if (HS.vr360) HS.vr360.hide();
    var t = data.text || {};
    $("sceneTitle").textContent = data.title || (ev && ev.title) || "3D 场景";
    $("sceneSub").textContent = data.subtitle || "";
    $("sceneTime").textContent = t.time || (ev && ev.date) || "";
    $("scenePlace").textContent = t.place || (ev && ev.place) || "";
    $("sceneFigures").textContent = (t.figures || (ev && ev.figures) || []).join("、") || "待补";
    $("sceneResult").textContent = t.result || (ev && ev.result) || "待补";
    $("sceneImpact").textContent = t.impact || (ev && ev.impact) || "待补";
    $("sceneNote").textContent = data.note || "";
    var legend = $("sceneLegend");
    legend.innerHTML = "";
    (data.units || []).forEach(function (u) {
      legend.appendChild(U.el("span", "unit", "<i style='--c:" + U.esc(u.color || "#888") + "'></i>" + U.esc(u.name || u.id)));
    });
    $("scenePhase").textContent = (data.phases && data.phases[0] && data.phases[0].label) || "战况";
    $("sceneProgress").style.width = "0%";
    $("sceneView").hidden = false;
    ui.setScenePlaying(true);
  };

  ui.closeScene = function () {
    $("sceneView").hidden = true;
    ["warSides", "warTimeline", "warSpeed", "warRestart", "warLogWrap", "warLayersWrap", "courtSpeakerWrap"].forEach(function (id) {
      var el = $(id); if (el) el.hidden = true;
    });
    if (HS.vr360) HS.vr360.hide();
    ui.hideWarTip();
  };
  ui.setScenePlaying = function (on) {
    var label = $("scenePlayLabel");
    if (label) label.textContent = on ? "暂停" : "继续";
    var btn = $("scenePlayBtn");
    if (btn) btn.classList.toggle("is-play", on);
  };
  ui.setScenePhase = function (label, progress) {
    $("scenePhase").textContent = label || "战况";
    $("sceneProgress").style.width = Math.max(0, Math.min(1, progress || 0)) * 100 + "%";
  };

  /* ---------------- 兵棋 UI ---------------- */
  ui.warPhases = [];

  ui.openWarScene = function (data, ev) {
    ui.openScene(data, ev);
    $("warSides").hidden = false;
    $("warTimeline").hidden = false;
    $("warSpeed").hidden = false;
    $("warRestart").hidden = false;
    $("warLogWrap").hidden = false;
    $("warLayersWrap").hidden = false;
    var panel = $("scenePanel");
    if (panel) {
      panel.appendChild($("warLogWrap"));
      panel.appendChild($("warLayersWrap"));
    }
    $("warLog").innerHTML = "";
    var legend = $("sceneLegend");
    legend.innerHTML = "";
    (data.sides || []).forEach(function (s) {
      legend.appendChild(U.el("span", "unit", "<i style='--c:" + U.esc(s.color) + "'></i>" + U.esc(s.name)));
    });
    var wrap = $("warPhases");
    wrap.innerHTML = "";
    ui.warPhases = data.phases || [];
    ui.warPhases.forEach(function (p, i) {
      var b = U.el("button", "war-phase", "<i></i><span>" + U.esc(p.date || "") + "</span><b>" + U.esc(p.label || "") + "</b>");
      b.addEventListener("click", function () { fire("war-phase", i); });
      wrap.appendChild(b);
    });
    ui.buildWarLayers();
    ui.setWarSpeed(1);
    ui.setScenePlaying(true);
    ui.setWarPhase(null, 0, -1, ui.warPhases);
    ui.setSceneVrAvailable(!!(ev && ev.image));
    ui.setSceneKicker("兵棋推演 · 战术示意");
  };

  ui.setSceneVrAvailable = function (on) {
    var b = $("sceneVrBtn");
    if (b) b.hidden = !on;
  };

  ui.setSceneKicker = function (text) {
    var el = $("sceneKicker");
    if (el) el.textContent = text || "";
  };

  function buildPhaseStrip(data) {
    var wrap = $("warPhases");
    wrap.innerHTML = "";
    ui.warPhases = data.phases || [];
    ui.warPhases.forEach(function (p, i) {
      var b = U.el("button", "war-phase", "<i></i><span>" + U.esc(p.date || "") + "</span><b>" + U.esc(p.label || "") + "</b>");
      b.addEventListener("click", function () { fire("war-phase", i); });
      wrap.appendChild(b);
    });
  }

  ui.openBattleScene = function (data, ev) {
    ui.openScene(data, ev);
    ["warSides", "courtSpeakerWrap"].forEach(function (id) { var e = $(id); if (e) e.hidden = true; });
    ["warTimeline", "warSpeed", "warRestart", "warLogWrap", "warLayersWrap"].forEach(function (id) { var e = $(id); if (e) e.hidden = false; });
    var panel = $("scenePanel");
    if (panel && $("warLogWrap") && $("warLayersWrap")) panel.insertBefore($("warLayersWrap"), $("warLogWrap"));
    ui.setSceneVrAvailable(!!(ev && ev.image));
    ui.setSceneKicker("战场情景 · 真实地形");
    $("warLog").innerHTML = "";
    var legend = $("sceneLegend");
    legend.innerHTML = "";
    (data.sides || []).forEach(function (s) {
      legend.appendChild(U.el("span", "unit", "<i style='--c:" + U.esc(s.color || "#888") + "'></i>" + U.esc(s.name)));
    });
    legend.appendChild(U.el("p", "war-legend-note", "占地网格、兵/气条为战术示意，不是精确历史疆域或阵图。"));
    buildPhaseStrip(data);
    ui.buildBattleLayers();
    ui.setWarSpeed(1);
    ui.setScenePlaying(true);
    ui.setWarPhase(null, 0, -1, ui.warPhases);
  };

  ui.openCourtScene = function (data, ev) {
    ui.openScene(data, ev);
    ["warSides", "warLayersWrap"].forEach(function (id) { var e = $(id); if (e) e.hidden = true; });
    ["warTimeline", "warSpeed", "warRestart", "warLogWrap", "courtSpeakerWrap"].forEach(function (id) { var e = $(id); if (e) e.hidden = false; });
    ui.setSceneVrAvailable(!!(ev && ev.image));
    ui.setSceneKicker("朝堂议政 · 情景复原");
    $("warLog").innerHTML = "";
    var legend = $("sceneLegend");
    legend.innerHTML = "";
    (data.roles || []).forEach(function (r) {
      var c = SIDE_COLOR[r.side] || "#7f8b9a";
      legend.appendChild(U.el("span", "unit", "<i style='--c:" + U.esc(c) + "'></i>" + U.esc(r.name + (r.rank ? " · " + r.rank : ""))));
    });
    buildPhaseStrip(data);
    ui.setWarSpeed(1);
    ui.setScenePlaying(true);
    ui.setWarPhase(null, 0, -1, ui.warPhases);
    ui.setCourtSpeaker("朝堂", data.note || "");
  };

  ui.setCourtSpeaker = function (name, text) {
    var box = $("courtSpeakerWrap"), p = $("courtSpeaker");
    if (!box || !p) return;
    box.hidden = false;
    p.innerHTML = (name ? "<b>" + U.esc(name) + "</b>：" : "") + U.esc(text || "");
  };

  ui.openVRScene = function (data, ev) {
    ui.openScene(data, ev);
    ["warSides", "warTimeline", "warSpeed", "warRestart", "warLogWrap", "warLayersWrap", "courtSpeakerWrap"].forEach(function (id) {
      var e = $(id); if (e) e.hidden = true;
    });
    ui.setSceneVrAvailable(false);
    ui.setSceneKicker("360° 环视 · 图片扩展");
    var legend = $("sceneLegend");
    legend.innerHTML = "";
    (data.hotspots || []).forEach(function (h) {
      legend.appendChild(U.el("span", "unit", "<i style='--c:#d8b56a'></i>" + U.esc(h.label || "")));
    });
    $("scenePhase").textContent = "360° 环视";
    $("sceneProgress").style.width = "0%";
    ui.setScenePlaying(true);
  };

  ui.setWarStats = function (stats, sides) {
    var box = $("warSides");
    if (!box) return;
    var h = "";
    (sides || []).forEach(function (s) {
      var st = (stats && stats.sides && stats.sides[s.id]) || { pct: 100, provinces: 0, control: 0, units: 0 };
      h += "<div class='war-side' style='--c:" + U.esc(s.color) + "'>" +
        "<div class='ws-head'><b>" + U.esc(s.name) + "</b><span>兵力 " + Math.round(st.pct) + "%</span></div>" +
        "<div class='ws-bar'><i style='width:" + Math.round(st.pct) + "%'></i></div>" +
        "<div class='ws-sub'>控制 " + st.provinces + " 省 · " + Math.round(st.control) + "% · 单位 " + st.units + "</div></div>";
    });
    box.innerHTML = h;
  };

  ui.setWarPhase = function (phase, progress, index, phases) {
    $("scenePhase").textContent = phase ? phase.label : "战况";
    $("sceneProgress").style.width = Math.max(0, Math.min(1, progress || 0)) * 100 + "%";
    var btns = document.querySelectorAll("#warPhases .war-phase");
    btns.forEach(function (b, i) {
      b.classList.toggle("is-on", i === index);
      b.classList.toggle("is-done", index >= 0 && i < index);
    });
  };

  ui.appendWarLog = function (msg, kind, phaseIndex) {
    var box = $("warLog");
    if (!box) return;
    var d = U.el("div", "war-log-item kind-" + (kind || "info"), U.esc(msg));
    if (phaseIndex != null && phaseIndex >= 0) {
      d.classList.add("is-link");
      d.title = "跳到该阶段";
      d.addEventListener("click", function () { fire("war-phase", phaseIndex); });
    }
    box.appendChild(d);
    while (box.children.length > 80) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  };

  ui.setWarSpeed = function (n) {
    document.querySelectorAll("#warSpeed button").forEach(function (b) {
      b.classList.toggle("is-on", +b.getAttribute("data-speed") === n);
    });
  };

  ui.setWarPlaying = function (on) { ui.setScenePlaying(on); };

  ui.showWarTip = function (html, x, y) {
    var tip = $("warUnitTip");
    if (!tip) return;
    tip.innerHTML = html;
    tip.hidden = false;
    var w = tip.offsetWidth || 240, h = tip.offsetHeight || 70;
    tip.style.left = Math.min(window.innerWidth - w - 12, Math.max(12, x + 16)) + "px";
    tip.style.top = Math.min(window.innerHeight - h - 12, Math.max(12, y + 16)) + "px";
  };
  ui.hideWarTip = function () { var tip = $("warUnitTip"); if (tip) tip.hidden = true; };

  ui.buildWarLayers = function () {
    var box = $("warLayersBody");
    if (!box) return;
    box.innerHTML = "";
    [
      ["front", "战线"], ["routes", "路线"], ["units", "单位"],
      ["battles", "战斗"], ["labels", "地名"], ["territory", "领土"]
    ].forEach(function (pair) {
      var lab = U.el("label", "", "<input type='checkbox' data-war-layer='" + pair[0] + "' checked><span>" + pair[1] + "</span>");
      lab.querySelector("input").addEventListener("change", function (e) {
        fire("war-layer", { name: pair[0], on: e.target.checked });
      });
      box.appendChild(lab);
    });
  };
  ui.buildBattleLayers = function () {
    var box = $("warLayersBody");
    if (!box) return;
    box.innerHTML = "";
    [
      ["grid", "占地网格"], ["units", "单位"], ["labels", "名字"]
    ].forEach(function (pair) {
      var lab = U.el("label", "", "<input type='checkbox' data-war-layer='" + pair[0] + "' checked><span>" + pair[1] + "</span>");
      lab.querySelector("input").addEventListener("change", function (e) {
        fire("war-layer", { name: pair[0], on: e.target.checked });
      });
      box.appendChild(lab);
    });
  };
  ui.toggleWarLayers = function (force) {
    var el = $("warLayersWrap");
    if (el) el.hidden = force != null ? !force : !el.hidden;
  };
  ui.setWarLayerBox = function (name, on) {
    var b = document.querySelector("#warLayersBody input[data-war-layer=" + name + "]");
    if (b) b.checked = on;
  };

  /* ---------------- 弹窗 ---------------- */
  ui.anyModal = function () {
    return ["ask", "sources", "help"].filter(function (id) { return !$(id).hidden; })[0] || "";
  };
  ui.openModal = function (id) {
    ["ask", "sources", "help"].forEach(function (m) { if (m !== id) $(m).hidden = true; });
    $(id).hidden = false;
  };
  ui.closeModal = function (id) {
    if (!id) return;
    $(id).hidden = true;
    if (id === "ask") ui.askStage = 0;
  };

  ui.openAsk = function (ev) {
    var a = ev.ask || {};
    $("askFrom").textContent = (ev.date ? ev.date + " · " : "") + ev.title;
    $("askQ").textContent = a.q || "（本事件暂无课堂提问，待 DeepSeek 补全）";
    $("askAText").textContent = a.a || "（待补全）";
    $("askA").hidden = true;
    $("askReveal").hidden = false;
    ui.askStage = 1;
    ui.openModal("ask");
  };
  ui.revealAsk = function () {
    $("askA").hidden = false;
    $("askReveal").hidden = true;
    ui.askStage = 2;
  };

  ui.toggleLayers = function (force) {
    var p = $("layers");
    p.hidden = force != null ? !force : !p.hidden;
    document.querySelector(".tool[data-act=layers]").classList.toggle("is-on", !p.hidden);
  };
  ui.setLayerBox = function (name, on) {
    var b = document.querySelector("#layers input[data-layer=" + name + "]");
    if (b) b.checked = on;
  };

  /* ---------------- 来源与授权 ---------------- */
  ui.openSources = function (themes, order, currentId) {
    var lic = window.HISTORY_LICENSE || {};
    $("srcLead").innerHTML = U.esc(lic.mapStatement || "") + "<br>" + U.esc(lic.aiStatement || "") +
      "<br>外部网站、地图与史料逐项列在下面；AI 生成的插画与封面不逐张标注。";
    var tabs = $("srcTabs");
    tabs.innerHTML = "";
    var pick = ui.srcTheme && themes[ui.srcTheme] ? ui.srcTheme : currentId;
    order.concat(["_code"]).forEach(function (id) {
      var label = id === "_code" ? "代码 / 字体 / 音效" : themes[id] ? themes[id].meta.tabLabel : id;
      var b = U.el("button", "src-tab" + (id === pick ? " is-on" : ""), U.esc(label));
      b.addEventListener("click", function () {
        ui.srcTheme = id;
        tabs.querySelectorAll(".src-tab").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        renderSrc(themes, id);
      });
      tabs.appendChild(b);
    });
    renderSrc(themes, pick);
    ui.openModal("sources");
  };

  function link(url) {
    if (!url) return "<span class='muted'>（无链接）</span>";
    return "<a class='mono' href='" + U.esc(url) + "' target='_blank' rel='noopener noreferrer'>" + U.esc(url) + "</a>";
  }

  function demTable(d) {
    return "<h4>地形数据（DEM）</h4><table>" +
      "<tr><th>名称</th><td>" + U.esc(d.name) + "</td></tr>" +
      "<tr><th>链接</th><td>" + link(d.url) + "</td></tr>" +
      "<tr><th>许可</th><td>" + U.esc(d.license) + "</td></tr>" +
      "<tr><th>署名</th><td>" + U.esc(d.attribution) + "</td></tr>" +
      "<tr><th>修改</th><td>" + U.esc(d.modifications) + "</td></tr>" +
      "<tr><th>访问日期</th><td>" + U.esc(d.accessed) + "</td></tr>" +
      "</table>";
  }

  function renderSrc(themes, id) {
    var body = $("srcBody"), h = [];
    var lic = window.HISTORY_LICENSE || {};
    if (id === "_code") {
      h.push("<h4>代码库</h4><table><tr><th>名称</th><th>版本</th><th>许可</th><th>文件</th></tr>");
      (lic.code || []).forEach(function (c) {
        h.push("<tr><td>" + U.esc(c.name) + "<br><small>" + U.esc(c.copyright || "") + "</small></td><td>" + U.esc(c.version) +
          "</td><td>" + U.esc(c.license) + "</td><td class='mono'>" + U.esc((c.files || []).join(", ")) + "</td></tr>");
      });
      h.push("</table><h4>程序生成的内容</h4><ul>");
      (lic.generated || []).forEach(function (g) { h.push("<li>" + U.esc(g) + "</li>"); });
      h.push("</ul><h4>项目</h4><p>" + U.esc((lic.project && lic.project.name) || "") + " · " + U.esc((lic.project && lic.project.usage) || "") + "</p>");
      if (lic.dem) h.push(demTable(lic.dem));
      body.innerHTML = h.join("");
      return;
    }
    var t = themes[id];
    if (!t) { body.innerHTML = ""; return; }
    var cr = t.credits || {};
    if (lic.dem) h.push(demTable(lic.dem));
    h.push("<h4>外部网站 / 历史地图参考</h4>");
    var recs = cr.sourceRecords || [];
    if (!recs.length) h.push("<p class='todo'>待补全</p>");
    else {
      h.push("<table><tr><th>名称</th><th>链接</th><th>用途</th><th>参考内容</th><th>授权状态</th><th>访问日期</th></tr>");
      recs.forEach(function (r) {
        h.push("<tr><td>" + U.esc(r.name) + "</td><td>" + link(r.url) + "</td><td>" + U.esc(USAGE_TEXT[r.usage] || r.usage || "") +
          "</td><td>" + U.esc(r.what || "") + "</td><td>" + U.esc(r.license || "") + "</td><td>" + U.esc(r.accessed || "") + "</td></tr>");
      });
      h.push("</table>");
    }
    if ((cr.mapSources || []).length) {
      h.push("<ul class='src-map'>");
      cr.mapSources.forEach(function (s) { h.push("<li>" + U.esc(s) + "</li>"); });
      h.push("</ul>");
    }
    h.push("<p class='muted'>" + U.esc(t.meta.sourceNote || "") + "</p>");

    h.push("<h4>事件史料来源</h4>");
    HS.eventsOf(t).forEach(function (ev) {
      var src = ev.sources || [];
      h.push("<div class='src-ev'><b>" + U.esc(ev.id) + " · " + U.esc(ev.title) + "</b>");
      if (!src.length) h.push("<span class='todo'>待 DeepSeek 补全</span>");
      else {
        h.push("<ol>");
        src.forEach(function (s) {
          var parts = [s.author, s.title ? "《" + s.title.replace(/^《|》$/g, "") + "》" : "", s.publisher, s.year, s.locator].filter(Boolean);
          h.push("<li>" + U.esc(parts.join("，")) + (s.url ? " · " + link(s.url) : "") +
            (s.confidence ? " <span class='chip chip-conf c-" + U.esc(s.confidence) + "'>置信度 " + U.esc(s.confidence) + "</span>" : "") +
            (s.note ? "<br><small>" + U.esc(s.note) + "</small>" : "") + "</li>");
        });
        h.push("</ol>");
      }
      h.push("</div>");
    });
    h.push("<h4>插画与封面</h4><p>" + U.esc(cr.imageNote || lic.aiStatement || "") + "</p>");
    h.push("<p class='muted'>代码许可：" + U.esc(cr.codeLicense || "") + "</p>");
    body.innerHTML = h.join("");
    body.scrollTop = 0;
  }

  /* ---------------- 首屏 / 提示 ---------------- */
  ui.hideIntro = function () { $("intro").classList.add("is-gone"); };
  ui.introVisible = function () { return !$("intro").classList.contains("is-gone"); };

  var toastTimer = 0;
  ui.toast = function (msg, ms) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    t.classList.remove("is-out");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("is-out"); toastTimer = setTimeout(function () { t.hidden = true; }, 400); }, ms || 2200);
  };

  ui.setDemo = function (on) {
    $("demoBadge").hidden = !on;
    document.querySelector(".tool[data-act=demo]").classList.toggle("is-on", on);
  };
  ui.setMuted = function (m) {
    document.querySelector(".tool[data-act=sound]").classList.toggle("is-off", m);
  };
  ui.setFade = function (on) { $("fade").classList.toggle("is-on", on); };

  ui.loadBackdrop = function () {
    var art = document.querySelector("#backdrop .bd-art");
    HS.assets.load("assets/ui/bg.jpg", function (url) { art.style.backgroundImage = "url('" + url + "')"; art.classList.add("has-img"); });
  };
})();
