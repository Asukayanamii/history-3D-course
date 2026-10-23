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
  var USAGE_TEXT = { reference: "参考", image: "图片", data: "随附使用" };

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
      fire(act);
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
    var key = (theme.map.regions || []).filter(function (r) { return r.highlight; }).map(function (r) { return r.name; });
    $("legendNote").innerHTML =
      (key.length ? "<span class='key-swatch'></span>重点政权：" + U.esc(key.join("、")) + "<br>" : "") +
      U.esc(m.periodLabel || "") + " 形势示意<br>" + U.esc(m.sourceNote || "");

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
    var ul = $("cardDetail");
    ul.innerHTML = "";
    (ev.detail || []).slice(0, 5).forEach(function (d) { ul.appendChild(U.el("li", "", U.esc(d))); });

    var chips = [];
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
      body.innerHTML = h.join("");
      return;
    }
    var t = themes[id];
    if (!t) { body.innerHTML = ""; return; }
    var cr = t.credits || {};
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
