/*
 * 主题索引 —— 顶栏的时期标签按 HISTORY_THEME_ORDER 生成。
 * 新增时期：新建 data/theme.<id>.js，在 index.html 里加一行 <script>，再把 id 加到下面的数组。
 */
window.HISTORY_PROJECT = {
  name: "史境",                       // 占位项目名（R09，可替换）
  fullName: "史境 · 三维历史沙盘",
  subtitle: "面向中学历史课堂的三维时空交互课件",
  version: "0.5.0-demo",
  revision: "v0.5",
  updated: "2026-10-23",
  status: "demo",
  disclaimer: "地形为 SRTM/GMTED/ETOPO1 真实高程（垂直夸张，非导航数据）；历史疆域、占地网格与兵力为示意，不是精确阵图；插画/全景为 AI 或程序化艺术复原示意，不是历史影像/全景摄影。"
};

window.HISTORY_THEME_ORDER = ["suitang", "wudai", "song"];

window.HISTORY_DEFAULT_THEME = "wudai";
