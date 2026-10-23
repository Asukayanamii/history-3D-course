/*
 * 主题索引 —— 顶栏的时期标签按 HISTORY_THEME_ORDER 生成。
 * 新增时期：新建 data/theme.<id>.js，在 index.html 里加一行 <script>，再把 id 加到下面的数组。
 */
window.HISTORY_PROJECT = {
  name: "史境",                       // 占位项目名（R09，可替换）
  fullName: "史境 · 三维历史沙盘",
  subtitle: "面向中学历史课堂的三维时空交互课件",
  version: "0.2.0-demo",
  revision: "v0.2",
  updated: "2026-10-23",
  status: "demo",
  disclaimer: "历史地图为示意性简化，不是精确疆域；外部地图参考见「来源与授权」；插画与封面为 AI 生成的艺术复原示意，不是历史影像。"
};

window.HISTORY_THEME_ORDER = ["wudai", "suitang", "song"];

window.HISTORY_DEFAULT_THEME = "wudai";
