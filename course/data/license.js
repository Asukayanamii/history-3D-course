/*
 * 署名与授权 —— 供「来源与授权」弹窗读取。内容需与各主题 credits 保持一致。
 * 原则：外部网站/地图/史料必须可追溯；AI 生成的插画与封面只做统一声明，不逐图标注。
 * 许可核实：谁取用谁核实；无法确认授权的资源不落地。
 */
window.HISTORY_LICENSE = {
  project: {
    name: "史境 · 三维历史沙盘（占位名）",
    team: "history-3D-course 大创项目组",
    usage: "仅用于课堂教学演示与项目汇报，不商用",
    version: "0.4.0-demo"
  },

  aiStatement: "插画、封面与 2:1 全景为 AI 或程序化艺术复原示意，不是历史影像，也不是全景摄影。",
  mapStatement: "地形为 SRTM/GMTED/ETOPO1 真实高程（垂直夸张，仅课堂可视化，非导航数据）；历史疆域仍为示意性简化，不是精确边界。",
  dem: {
    name: "Mapzen / Joerd Terrain Tiles（AWS Open Data）",
    url: "https://registry.opendata.aws/terrain-tiles/",
    license: "SRTM/GMTED2010/3DEP（USGS）与 ETOPO1（NOAA）为公有领域；瓦片打包 attribution 按 Joerd 要求保留。",
    attribution: "Terrain Tiles by Mapzen / Linux Foundation, accessed 2026-10-23 from AWS Open Data. SRTM, GMTED2010 and 3DEP terrain data courtesy of the U.S. Geological Survey; ETOPO1 terrain data courtesy of NOAA/NCEI.",
    modifications: "降采样/重采样为 Int16 网格，并在场景中做垂直夸张；不用于导航或测绘。",
    accessed: "2026-10-23"
  },

  code: [
    { name: "Three.js", version: "r147", license: "MIT License", copyright: "Copyright 2010-2022 Three.js Authors",
      url: "https://threejs.org/", files: ["js/lib/three.min.js"] },
    { name: "OrbitControls（three.js examples/js）", version: "r147", license: "MIT License", copyright: "Copyright 2010-2022 Three.js Authors",
      url: "https://threejs.org/", files: ["js/lib/OrbitControls.js"] },
    { name: "课件引擎（core/map/route/ui/sfx/main）", version: "0.1.0", license: "项目组自有代码", copyright: "history-3D-course",
      url: "", files: ["js/*.js", "css/app.css"] }
  ],

  mapReferences: [
    { name: "Historiqly", url: "https://map.historiqly.com/zh/", status: "参考，未复制原图；授权未确认" },
    { name: "wowhistorymap", url: "https://www.wowhistorymap.com/", status: "参考，未复制原图；授权未确认" },
    { name: "historiamap", url: "https://www.historiamap.com/", status: "参考，未复制原图；授权未确认" },
    { name: "txlzp 历史地图", url: "http://www.txlzp.com/lishi/", status: "仅参考；若使用图片，由取用者自行核实授权，未确认就不用" },
    { name: "《中国历史地图集》（谭其骧主编）", url: "", status: "核对参考，未复制图幅" }
  ],

  generated: [
    "沙盘纹理、沙粒、等高线、海陆掩膜：Canvas 基于 DEM 现场绘制",
    "地形：Mapzen/Joerd Terrain Tiles 派生 Int16 高程网格（见 dem 段）",
    "小人、朝堂、军阵、微缩情景：Three.js 基础几何程序化生成",
    "2:1 全景：由现有 16:9 插画扩展生成的教学示意，不是全景摄影；真全景槽位见 assets/vr/",
    "音效：Web Audio API 实时合成，无音频文件、无背景音乐",
    "字体：仅使用操作系统自带字体，无 Web Font"
  ]
};
