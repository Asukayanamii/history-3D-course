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
    version: "0.1.0-demo"
  },

  aiStatement: "插画与封面为 AI 生成的艺术复原示意，不是历史影像。",
  mapStatement: "历史地图为示意性简化，不是精确疆域；势力色块未核订前由引擎按「中心点 + 半径」生成。",

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
    "沙盘底座纹理、沙粒、等高线、海岸示意：Canvas 程序化生成（无外部底图、无 DEM）",
    "音效：Web Audio API 实时合成，无音频文件、无背景音乐",
    "字体：仅使用操作系统自带字体，无 Web Font"
  ]
};
