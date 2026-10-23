window.HISTORY_THEMES = window.HISTORY_THEMES || {};
/*
 * 主题：五代十国（默认、重点）
 * 数据状态：sourced —— 有来源、待耿雨史实审核；不是 reviewed。
 * 地图快照：约 955 年（后周显德二年），只画该年实际存在的政权/势力。
 * 说明：
 *   - 楚已于 951 年被南唐所灭，湖南由武平（周行逢）控制；闽已于 945 年灭亡，
 *     建、汀属南唐，福州属吴越，泉、漳由清源军留从效实际控制（名义属南唐）。
 *     因此不再保留 chu / min 两个已亡政权。
 *   - 西夏尚未建立（1038 年李元昊称帝）；五代十国地图上的党项势力写作
 *     “定难军（党项）”，不使用“西夏”作为 955 年的政权名。
 *   - 所有势力边界均为 labelAt + radiusKm 生成的示意色块，不是精确疆域。
 *   - 镜头参数含义见 Claude 第一轮文件头；dist≈42 看全图，≈20 看区域。
 */
window.HISTORY_THEMES.wudai = {
  schemaVersion: "1.0.0",

  meta: {
    id: "wudai",
    order: 2,
    tabLabel: "五代十国",
    title: "五代十国",
    subtitle: "907—979 · 分裂与重组",
    periodLabel: "后周世宗时期（约 955 年）",
    defaultEventId: "e01",
    accent: "#c8402f",
    status: "sourced",
    sourceNote: "事件文字以统编《中外历史纲要（上）》第6课为教学口径，参考《旧五代史》《新五代史》《资治通鉴》；疆域按约 955 年（后周显德二年）示意，不是精确边界；待耿雨史实审核。",
    licenseNote: "仅用于课堂教学演示；历史地图为示意性简化；插画与封面为 AI 艺术复原示意，不是历史影像。",
    cover: "assets/ui/cover-wudai.jpg",
    home: { dist: 44, az: 0, polar: 40 }
  },

  map: {
    projection: "equirect",
    bounds: { west: 100, east: 123, south: 21, north: 43 },
    relief: { mode: "stylized", amplitude: 1.0, texture: "" },
    terrain: { mode: "dem", dem: "east-asia", exaggeration: 22, meshStep: 0.10, maxHeight: 5.2, edgeFalloff: 1.8 },
    mapSnapshot: "约 955 年（后周显德二年）",
    omitted: [
      { name: "大理", note: "约 955 年据云南；不在本课重点，未单列色块。" },
      { name: "吐蕃", note: "青藏高原；约 955 年吐蕃已分裂，未单列。" },
      { name: "河西归义军 / 甘州回鹘", note: "河西走廊；未单列，避免与中原政权边界混淆。" },
      { name: "清源军（泉、漳）", note: "名义属南唐，实际由留从效控制；未单列。" }
    ],
    regions: [
      { id: "houzhou", name: "后周", color: "#b0563c", opacity: 0.46, highlight: true,
        labelAt: [113.4, 33.0], labelSize: "large", radiusKm: 520, highlightReason: "世宗改革与北伐，教材重点",
        polygon: [[104.6,35.2],[106.0,37.2],[108.2,38.6],[110.4,39.2],[111.6,37.8],[113.0,37.4],[114.2,38.8],[116.0,38.8],[118.2,38.0],[119.8,36.8],[120.4,35.0],[119.2,33.2],[117.4,32.4],[115.0,32.3],[112.8,32.2],[110.6,33.0],[108.4,33.6],[106.2,34.2],[104.6,35.2]],
        status: "approx",
        sourceNote: "约 955 年控制中原、关中、河北南部与山东大部；南界大体沿淮河，西界至秦岭—陇右一线，北界与辽在河北中部—雁门关一线对峙。后周于 955 年发动秦凤之战，至 956 年初夺取秦、凤、阶、成四州；图中不逐州外扩色块。示意色块，非精确边界。" },
      { id: "beihan", name: "北汉", color: "#6d7f9a", opacity: 0.42, highlight: false,
        labelAt: [112.2, 38.2], labelSize: "normal", radiusKm: 170, highlightReason: "依附辽以自保，与后周对抗",
        polygon: [[110.9,38.9],[112.1,39.5],[113.6,38.9],[113.9,37.4],[112.9,36.1],[111.5,36.5],[110.9,38.9]],
        status: "approx",
        sourceNote: "据太原、汾河上游一带，依附辽以自保；约 955 年为刘承钧（刘钧）在位。示意色块，非精确边界。" },
      { id: "nantang", name: "南唐", color: "#4f8a78", opacity: 0.42, highlight: false,
        labelAt: [117.0, 30.2], labelSize: "large", radiusKm: 430, highlightReason: "南方最强政权，后周三征南唐",
        polygon: [[113.6,32.4],[115.2,32.5],[117.4,32.6],[119.0,33.2],[120.4,32.2],[121.2,30.2],[120.6,28.0],[119.0,26.4],[117.0,26.0],[115.2,26.8],[113.8,28.4],[113.0,30.2],[113.6,32.4]],
        status: "approx",
        sourceNote: "约 955 年据江南、淮南、江西及福建建、汀等州；泉州、漳州由清源军留从效实际控制，名义上属南唐。示意图，非精确边界。" },
      { id: "wuyue", name: "吴越", color: "#5c86a8", opacity: 0.42, highlight: false,
        labelAt: [120.0, 29.6], labelSize: "normal", radiusKm: 230, highlightReason: "偏安两浙，经济文化发达",
        polygon: [[118.6,31.2],[120.0,31.6],[121.8,30.8],[122.4,29.4],[121.2,27.8],[119.4,27.0],[118.2,28.4],[118.0,29.8],[118.6,31.2]],
        status: "approx",
        sourceNote: "据两浙，947 年后兼有福州；约 955 年为钱弘俶（钱俶）在位。示意色块，非精确边界。" },
      { id: "houshu", name: "后蜀", color: "#8c6a9a", opacity: 0.40, highlight: false,
        labelAt: [104.6, 30.6], labelSize: "normal", radiusKm: 380, highlightReason: "据四川盆地，965 年为宋所灭",
        polygon: [[102.3,33.6],[104.0,34.3],[106.0,33.8],[107.4,32.2],[107.0,30.0],[105.4,28.4],[103.4,28.2],[101.8,29.6],[101.4,31.4],[102.3,33.6]],
        status: "approx",
        sourceNote: "据四川盆地及汉中一带；约 955 年为孟昶在位。后周于 955 年发动秦凤之战，至 956 年初夺取秦、凤、阶、成四州；图中按战后结果示意，不逐州外扩色块。示意图，非精确边界。" },
      { id: "nanhan", name: "南汉", color: "#b98a3a", opacity: 0.42, highlight: false,
        labelAt: [111.8, 23.8], labelSize: "normal", radiusKm: 360, highlightReason: "据岭南，971 年为宋所灭",
        polygon: [[108.8,25.4],[110.8,25.8],[112.8,25.4],[114.8,24.2],[115.4,22.6],[113.8,21.4],[111.4,21.0],[109.2,21.6],[108.2,23.2],[108.8,25.4]],
        status: "approx",
        sourceNote: "据岭南（今广东、广西大部）；约 955 年为刘晟在位。海南岛南端超出地图范围，色块未覆盖。示意图，非精确边界。" },
      { id: "jingnan", name: "荆南（南平）", color: "#a86a5a", opacity: 0.46, highlight: false,
        labelAt: [111.9, 30.4], labelSize: "small", radiusKm: 95, highlightReason: "十国中最小，地处交通要冲",
        polygon: [[110.7,31.2],[112.0,31.6],[113.4,31.0],[113.6,30.0],[112.5,29.4],[111.0,29.6],[110.7,31.2]],
        status: "approx",
        sourceNote: "据江陵府及荆、峡、归等州，是五代十国中最小政权之一；约 955 年为高保融在位。示意色块，非精确边界。" },
      { id: "wuping", name: "武平（湖南）", color: "#7e9a52", opacity: 0.42, highlight: false,
        labelAt: [112.4, 27.8], labelSize: "normal", radiusKm: 230, highlightReason: "楚亡后的湖南地方势力",
        polygon: [[109.2,29.4],[110.8,30.0],[112.6,29.6],[113.8,28.6],[114.0,26.8],[112.4,25.4],[110.2,25.6],[108.9,27.2],[109.2,29.4]],
        status: "approx",
        sourceNote: "楚亡后湖南的地方势力；约 955 年由武平节度使周行逢控制，名义上臣属后周。不用已亡的“楚”作为 955 年的政权名。示意图，非精确边界。" },
      { id: "dingnan", name: "定难军（党项）", color: "#a08a4a", opacity: 0.40, highlight: false,
        labelAt: [107.8, 37.6], labelSize: "small", radiusKm: 170, highlightReason: "党项定难军，西夏前身",
        polygon: [[106.3,39.0],[107.8,39.7],[109.6,39.0],[109.8,37.4],[108.4,36.4],[106.6,36.8],[105.9,37.8],[106.3,39.0]],
        status: "approx",
        sourceNote: "党项拓跋部夏州政权，据夏、绥、银、宥等州；约 955 年为李彝殷（李彝兴）在位，名义上臣属中原，实际自治。西夏尚未建立（1038 年李元昊称帝）。示意图，非精确边界。" },
      { id: "qidan", name: "契丹（辽）", color: "#8a7a5a", opacity: 0.40, highlight: false,
        labelAt: [119.0, 41.0], labelSize: "large", radiusKm: 480, highlightReason: "燕云十六州与后周北伐对象",
        polygon: [[109.8,42.8],[113.8,43.0],[118.4,42.6],[122.0,41.4],[122.6,39.4],[120.4,38.6],[118.0,38.8],[115.6,39.2],[113.0,39.8],[110.4,40.4],[109.8,42.8]],
        status: "approx",
        sourceNote: "947 年改国号大辽；约 955 年为辽穆宗耶律璟在位。南境据燕云十六州，与后周在河北中部—雁门关一线对峙；955 年仍控制瀛、莫等州，959 年才被后周收复部分。示意色块，非精确边界。" }
    ],
    rivers: [
      { id: "huanghe", name: "黄河", color: "#7fb4b8",
        pts: [[103.8, 36.1], [105.2, 37.5], [106.4, 38.6], [106.9, 39.6], [107.6, 40.7], [109.8, 40.6],
              [111.2, 40.2], [111.3, 39.0], [110.6, 37.6], [110.4, 36.2], [110.3, 34.7], [111.2, 34.8],
              [112.4, 34.85], [113.6, 34.95], [114.6, 35.2], [115.5, 35.7], [116.3, 36.2], [117.0, 36.7],
              [118.0, 37.3], [118.9, 37.7]],
        labelAt: [114.6, 35.2], status: "approx" },
      { id: "changjiang", name: "长江", color: "#7fb4b8",
        pts: [[100.2, 27.0], [101.6, 26.3], [103.0, 26.6], [104.0, 28.3], [104.6, 28.8], [105.4, 28.9],
              [106.5, 29.6], [107.5, 30.0], [108.4, 30.8], [109.5, 31.0], [110.4, 30.9], [111.3, 30.7],
              [112.2, 30.3], [113.1, 29.4], [114.3, 30.6], [115.1, 30.1], [116.0, 29.8], [117.0, 30.5],
              [118.4, 31.3], [119.4, 32.2]],
        labelAt: [112.2, 30.3], status: "approx" },
      { id: "huaihe", name: "淮河", color: "#7fb4b8",
        pts: [[113.4, 32.4], [114.5, 32.4], [115.5, 32.6], [116.4, 32.8], [117.4, 32.95], [118.5, 33.2],
              [119.1, 33.6], [120.2, 34.2]],
        labelAt: [115.5, 32.6], status: "approx" },
      { id: "weihe", name: "渭水", color: "#7fb4b8",
        pts: [[104.6, 35.0], [105.2, 34.8], [105.9, 34.6], [106.5, 34.5], [107.2, 34.4], [108.2, 34.35], [109.2, 34.45], [110.2, 34.6]],
        labelAt: [107.2, 34.6], status: "approx" }
    ],
    places: [
      { id: "bianzhou", name: "汴州", lon: 114.31, lat: 34.80, kind: "capital", label: true, coordAccuracy: "approx", note: "后周东京开封府；后梁、后晋、后汉、后周均以此为都或重镇。" },
      { id: "luoyang", name: "洛阳", lon: 112.45, lat: 34.62, kind: "capital", label: true, coordAccuracy: "approx", note: "后唐都城；后周西京。" },
      { id: "changan", name: "长安", lon: 108.94, lat: 34.34, kind: "city", label: true, coordAccuracy: "approx", note: "后周京兆府，关中重镇。" },
      { id: "youzhou", name: "幽州", lon: 116.35, lat: 39.90, kind: "capital", label: true, coordAccuracy: "approx", note: "辽南京（燕京），燕云十六州核心。" },
      { id: "taiyuan", name: "太原", lon: 112.55, lat: 37.87, kind: "capital", label: true, coordAccuracy: "approx", note: "北汉都城。" },
      { id: "jinling", name: "金陵", lon: 118.78, lat: 32.05, kind: "capital", label: true, coordAccuracy: "approx", note: "南唐都城江宁府。" },
      { id: "hangzhou", name: "杭州", lon: 120.16, lat: 30.27, kind: "capital", label: true, coordAccuracy: "approx", note: "吴越都城。" },
      { id: "chengdu", name: "成都", lon: 104.06, lat: 30.66, kind: "capital", label: true, coordAccuracy: "approx", note: "后蜀都城。" },
      { id: "guangzhou", name: "广州", lon: 113.26, lat: 23.13, kind: "capital", label: true, coordAccuracy: "approx", note: "南汉兴王府。" },
      { id: "jiangling", name: "江陵", lon: 112.19, lat: 30.35, kind: "capital", label: true, coordAccuracy: "approx", note: "荆南（南平）都城。" },
      { id: "tanzhou", name: "潭州", lon: 112.98, lat: 28.20, kind: "city", label: true, coordAccuracy: "approx", note: "武平（湖南）重心。" },
      { id: "xiazhou", name: "夏州", lon: 108.85, lat: 37.99, kind: "city", label: true, coordAccuracy: "approx", note: "定难军（党项）核心。" },
      { id: "gaoping", name: "高平", lon: 112.92, lat: 35.80, kind: "battlefield", label: true, coordAccuracy: "approx", note: "954 年高平之战战场，今山西高平。" },
      { id: "shouzhou", name: "寿州", lon: 116.78, lat: 32.60, kind: "battlefield", label: true, coordAccuracy: "approx", note: "955—958 年后周攻南唐的淮南重镇。" },
      { id: "yangzhou", name: "扬州", lon: 119.42, lat: 32.39, kind: "city", label: true, coordAccuracy: "approx", note: "淮南重镇，958 年后归后周。" },
      { id: "waqiaoguan", name: "瓦桥关", lon: 116.00, lat: 39.00, kind: "pass", label: true, coordAccuracy: "approx", note: "959 年后周收复；今河北雄县一带。" },
      { id: "yijinguan", name: "益津关", lon: 116.40, lat: 39.10, kind: "pass", label: true, coordAccuracy: "approx", note: "959 年后周收复；今河北霸州一带。" },
      { id: "yukouguan", name: "淤口关", lon: 116.60, lat: 39.15, kind: "pass", label: true, coordAccuracy: "approx", note: "959 年后周收复；与瓦桥、益津合称三关。" },
      { id: "mozhou", name: "莫州", lon: 116.10, lat: 38.70, kind: "city", label: false, coordAccuracy: "approx", note: "959 年后周收复；今河北任丘一带。" },
      { id: "yingzhou", name: "瀛州", lon: 116.00, lat: 38.40, kind: "city", label: false, coordAccuracy: "approx", note: "959 年后周收复；今河北河间。" },
      { id: "cangzhou", name: "沧州", lon: 116.84, lat: 38.30, kind: "city", label: false, coordAccuracy: "approx", note: "后周北伐出发地之一。" },
      { id: "chenqiao", name: "陈桥", lon: 114.50, lat: 34.95, kind: "post", label: true, coordAccuracy: "approx", note: "960 年陈桥兵变发生地；今河南封丘陈桥镇。" },
      { id: "qinzhou", name: "秦州", lon: 105.72, lat: 34.58, kind: "city", label: false, coordAccuracy: "approx", note: "后周于 955 年发动秦凤之战，至 956 年初攻取秦、凤、阶、成四州之一；今甘肃天水。" },
      { id: "fuzhou", name: "福州", lon: 119.30, lat: 26.08, kind: "city", label: false, coordAccuracy: "approx", note: "947 年后属吴越；今福建福州。" },
      { id: "daizhou", name: "代州", lon: 112.96, lat: 39.07, kind: "pass", label: false, coordAccuracy: "approx", note: "雁门关所在，北汉与辽、后周之间的要地。" }
    ]
  },

  routes: [
    {
      id: "r-capitals", name: "五代更迭", color: "#d4553b", side: "other",
      nodes: [
        { id: "bianzhou-907", name: "汴州", lon: 114.31, lat: 34.80, label: true, eventId: "e01" },
        { id: "luoyang-923", name: "洛阳", lon: 112.45, lat: 34.62, label: true, eventId: "e02" },
        { id: "youzhou-936", name: "幽州", lon: 116.35, lat: 39.90, label: true, eventId: "e03" },
        { id: "bianzhou-947", name: "汴州", lon: 114.36, lat: 34.85, label: true, eventId: "e04" },
        { id: "chenqiao-960", name: "陈桥", lon: 114.50, lat: 34.95, label: true, eventId: "e10" }
      ]
    },
    {
      id: "r-north", name: "后周北伐", color: "#e2b552", side: "other",
      nodes: [
        { id: "bianzhou-n", name: "汴州", lon: 114.31, lat: 34.80, label: false },
        { id: "gaoping", name: "高平", lon: 112.92, lat: 35.80, label: true, eventId: "e06" },
        { id: "cangzhou", name: "沧州", lon: 116.84, lat: 38.30, label: true },
        { id: "waqiaoguan", name: "瓦桥关", lon: 116.00, lat: 39.00, label: true, eventId: "e08" },
        { id: "yijinguan", name: "益津关", lon: 116.40, lat: 39.10, label: true },
        { id: "yukouguan", name: "淤口关", lon: 116.60, lat: 39.15, label: true },
        { id: "mozhou", name: "莫州", lon: 116.10, lat: 38.70, label: true },
        { id: "yingzhou", name: "瀛州", lon: 116.00, lat: 38.40, label: true }
      ]
    },
    {
      id: "r-south", name: "三征南唐", color: "#56b3c4", side: "other",
      nodes: [
        { id: "bianzhou-s", name: "汴州", lon: 114.31, lat: 34.80, label: false },
        { id: "shouzhou", name: "寿州", lon: 116.78, lat: 32.60, label: true, eventId: "e07" },
        { id: "yangzhou", name: "扬州", lon: 119.42, lat: 32.39, label: true }
      ]
    }
  ],

  events: [
    {
      id: "e01", order: 1, date: "907年", shortDate: "907", title: "后梁代唐",
      kind: "politics",
      place: "汴州（今河南开封）", regionId: "", routeId: "r-capitals", nodeId: "bianzhou-907",
      lon: 114.31, lat: 34.80,
      summary: "907年，朱温废唐哀帝，建立后梁，定都汴州，唐朝灭亡。此后中原相继出现后梁、后唐、后晋、后汉、后周五个短命王朝，史称五代；南方与河东则分裂为多个割据政权。",
      detail: [
        "朱温出身黄巢起义军，后降唐，被赐名“全忠”，逐步控制中原藩镇。",
        "901年以后，朱温挟持唐昭宗，杀昭宗、立哀帝，掌握朝政。",
        "907年，朱温废哀帝，称帝建梁，定都汴州，唐朝灭亡。",
        "后梁只控制中原部分地区；河东李克用、李存勖父子与它长期对峙。",
        "五代十国是唐末藩镇割据的延续，不是一次简单的改朝换代。"
      ],
      figures: ["朱温（后梁太祖）", "唐哀帝"],
      result: "朱温废唐哀帝，建立后梁，定都汴州，唐朝灭亡。",
      impact: "中原进入五代更迭；五代十国是唐末藩镇割据的延续。",
      ask: { q: "后梁建立是否意味着唐朝的制度与割据势力一夜消失？", a: "不是。后梁只控制中原部分地区，河东李克用父子、凤翔李茂贞、淮南杨氏等仍割据一方；五代十国是唐末藩镇割据的延续。" },
      image: { file: "assets/events/wudai/e01.jpg", alt: "后梁军队进入汴州城的艺术复原示意。", promptId: "wudai-e01", credit: "AI 艺术复原示意" },
      focus: { dist: 20, az: -8, polar: 50 },
      historiography: { level: "consensus", note: "五代起始年以 907 年为准；具体月份与禅让程序各书记载略有差异。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：五代十国是唐末藩镇割据的延续。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "梁书·太祖本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对，卷次为通行定位。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "梁本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "卷二六六，后梁开平元年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；卷二六六为五代部分起始卷。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：五代起始表述、朱温称谓与禅让细节。"
    },
    {
      id: "e02", order: 2, date: "923年", shortDate: "923", title: "后唐灭梁",
      kind: "war",
      battle: { preset: "field", terrain: "guanzhong", sides: [{ id: "tang", name: "后唐", color: "#b0563c", short: "唐" }, { id: "liang", name: "后梁", color: "#6f8399", short: "梁" }] },
      place: "洛阳", regionId: "", routeId: "r-capitals", nodeId: "luoyang-923",
      lon: 112.45, lat: 34.62,
      summary: "923年，李存勖在魏州称帝，国号唐，随后攻破汴州，后梁末帝自杀，后梁灭亡。后唐定都洛阳，控制中原、关中与河北大部，是五代中疆域最广的王朝之一。",
      detail: [
        "李克用、李存勖父子据河东，长期与后梁争战；908年李克用死，李存勖继位。",
        "923年四月，李存勖在魏州称帝，国号唐，史称后唐。",
        "同年十月，后唐军奇袭汴州，后梁末帝朱友贞自杀，后梁亡。",
        "后唐迁都洛阳，控制中原、关中、河北大部；但内部猜忌与兵变不断。"
      ],
      figures: ["李存勖（后唐庄宗）", "朱友贞（后梁末帝）"],
      result: "后唐军攻破汴州，后梁灭亡；后唐定都洛阳。",
      impact: "后唐成为五代中疆域较广的王朝，河东集团取代中原集团。",
      ask: { q: "后唐为什么能迅速灭梁？", a: "后唐掌握河东精兵，趁后梁主力在外、汴州空虚时奇袭；后梁内部腐败、将领离心，也是重要原因。" },
      image: { file: "assets/events/wudai/e02.jpg", alt: "后唐军队进入汴州、后梁旗帜降下的艺术复原示意。", promptId: "wudai-e02", credit: "AI 艺术复原示意" },
      focus: { dist: 20, az: -18, polar: 50 },
      historiography: { level: "consensus", note: "后梁末帝之死有自杀、被杀等不同记载，教材一般只述后梁灭亡。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "唐书·庄宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "唐本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "同光元年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目，不标页码。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：后梁末帝之死的表述、后唐疆域范围。"
    },
    {
      id: "e03", order: 3, date: "936年", shortDate: "936", title: "割让燕云",
      kind: "diplomacy",
      place: "幽州（今北京）", regionId: "qidan", routeId: "r-capitals", nodeId: "youzhou-936",
      lon: 116.35, lat: 39.90,
      summary: "936年，后唐河东节度使石敬瑭向契丹求援，许割燕云十六州、称臣称儿；契丹出兵助他灭后唐、建立后晋。938年燕云十六州正式交割，中原失去北方屏障。",
      detail: [
        "石敬瑭任河东节度使，遭后唐末帝李从珂猜忌，遂向契丹求援。",
        "契丹太宗耶律德光册立石敬瑭为帝，国号晋；石敬瑭称臣称儿，许割燕云十六州。",
        "936年，后晋与契丹联军进逼洛阳，后唐末帝自焚，后唐亡。",
        "燕云十六州包括幽、蓟、瀛、莫、涿、檀、顺、新、妫、儒、武、云、应、寰、朔、蔚等州，大致今北京、天津、河北北部和山西北部。",
        "938年正式交割后，中原王朝长期失去燕山—长城一线屏障；北宋也未能收复。"
      ],
      figures: ["石敬瑭（后晋高祖）", "耶律德光（辽太宗）", "李从珂（后唐末帝）"],
      result: "后晋建立；936 年许割燕云十六州，938 年正式交割。",
      impact: "中原失去燕山—长城一线屏障，长期影响北宋边防。",
      ask: { q: "燕云十六州为什么重要？", a: "它位于燕山—长城一线，是中原抵御北方骑兵的天然屏障；失去后华北平原门户洞开，北宋多次北伐也未能收复。" },
      image: { file: "assets/events/wudai/e03.jpg", alt: "后晋官员与契丹使者在关城前交接舆图的艺术复原示意。", promptId: "wudai-e03", credit: "AI 艺术复原示意" },
      focus: { dist: 24, az: 10, polar: 48 },
      historiography: { level: "consensus", note: "割地承诺在 936 年，正式交割在天福三年（938 年）；教材常以 936 年概括此事。“儿皇帝”是当时政治关系的表述，不作道德化讨论。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：石敬瑭割燕云十六州。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "晋书·高祖本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "晋本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "太宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对契丹侧记载。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "天福元年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：936 年承诺 / 938 年交割的表述、十六州州名与范围。"
    },
    {
      id: "e04", order: 4, date: "947年", shortDate: "947", title: "契丹灭晋",
      kind: "war",
      battle: { preset: "siege", terrain: "huainan", sides: [{ id: "liao", name: "契丹（辽）", color: "#8a7a5a", short: "辽" }, { id: "jin", name: "后晋", color: "#6f8399", short: "晋" }] },
      place: "汴州", regionId: "", routeId: "r-capitals", nodeId: "bianzhou-947",
      lon: 114.36, lat: 34.85,
      summary: "947年，契丹军攻入汴州，后晋出帝被俘，后晋灭亡。辽太宗耶律德光一度在中原称帝，因军民反抗被迫北撤；刘知远在太原称帝，建立后汉。",
      detail: [
        "后晋出帝石重贵不愿继续称臣，契丹太宗耶律德光三次南下。",
        "946年底至947年初，契丹军攻入汴州，后晋出帝被俘，后晋亡。",
        "耶律德光改国号大辽，在汴州称帝；契丹军纵兵掠夺，激起中原反抗。",
        "947年四月，耶律德光北撤途中病死于栾城；刘知远在太原称帝，建立后汉，随后迁都汴州。"
      ],
      figures: ["耶律德光（辽太宗）", "刘知远（后汉高祖）", "石重贵（后晋出帝）"],
      result: "契丹攻入汴州，后晋灭亡；刘知远在太原建立后汉。",
      impact: "中原短暂被契丹占领；契丹北撤后，后汉成为中原新政权。",
      ask: { q: "契丹为什么没能长期占据中原？", a: "契丹军以掠夺为主，缺乏在中原的统治基础；中原军民反抗强烈，耶律德光只得北撤。" },
      image: { file: "assets/events/wudai/e04.jpg", alt: "契丹骑兵进入汴州城的艺术复原示意。", promptId: "wudai-e04", credit: "AI 艺术复原示意" },
      focus: { dist: 22, az: 6, polar: 46 },
      historiography: { level: "consensus", note: "辽国号改易与耶律德光称帝的具体时间有不同表述；教材以 947 年契丹灭晋为要点。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "晋书·少帝本纪、汉书·高祖本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "太宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对契丹侧记载。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "开运三年至天福十二年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：辽国号改易时间、耶律德光称帝与北撤细节。"
    },
    {
      id: "e05", order: 5, date: "951年", shortDate: "951", title: "后周建立",
      kind: "politics",
      place: "汴州", regionId: "houzhou", routeId: "r-capitals", nodeId: "bianzhou-947",
      lon: 114.36, lat: 34.85,
      summary: "951年，后汉枢密使郭威起兵攻入汴州，称帝建立后周。后周整顿吏治、减轻赋税、废除苛法，为柴荣改革和北宋统一奠定了基础；后周是五代最后一个中原王朝。",
      detail: [
        "后汉隐帝刘承祐猜忌功臣，杀郭威家属，郭威被迫起兵。",
        "950年底，郭威攻入汴州，后汉隐帝被杀；951年正月，郭威称帝，国号周。",
        "郭威出身贫寒，即位后废苛法、减赋税、惩贪吏、倡节俭。",
        "后周控制中原大部，但北有北汉、辽，南有南唐、后蜀等割据政权。"
      ],
      figures: ["郭威（后周太祖）", "刘承祐（后汉隐帝）"],
      result: "郭威建立后周，定都汴州。",
      impact: "后周开始整顿军政、发展生产，为世宗改革与北宋统一奠定基础。",
      ask: { q: "后周在五代中为什么重要？", a: "后周虽短，但郭威、柴荣相继改革军政、发展生产，增强了国力，为北宋结束分裂局面准备了条件。" },
      image: { file: "assets/events/wudai/e05.jpg", alt: "郭威在汴州简朴朝堂即位的艺术复原示意。", promptId: "wudai-e05", credit: "AI 艺术复原示意" },
      focus: { dist: 30, az: 0, polar: 44 },
      historiography: { level: "consensus", note: "郭威起兵与后汉隐帝之死的细节各书略有差异；以军士拥立的方式在此前已有先例。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：后周改革为北宋统一奠定基础。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·太祖本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "周本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "广顺元年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：郭威起兵原因、后汉隐帝之死的表述。"
    },
    {
      id: "e06", order: 6, date: "954年", shortDate: "954", title: "高平之战",
      kind: "war",
      place: "高平（今山西高平）", regionId: "houzhou", routeId: "r-north", nodeId: "gaoping",
      lon: 112.92, lat: 35.80,
      summary: "954年，北汉联合辽军南下，后周世宗柴荣亲征，在高平大败联军。此战巩固了柴荣的统治，也成为他整顿禁军、推进改革的起点，后周由此转危为安。",
      detail: [
        "954年正月郭威去世，养子柴荣即位；北汉刘崇联合辽军南下。",
        "两军在高平相遇，后周右军将领樊爱能、何徽临阵脱逃，形势危急。",
        "柴荣亲自督战，赵匡胤等率军奋战，后周军转败为胜，北汉军大溃。",
        "战后柴荣斩逃将、赏有功，整顿禁军，后周军力增强。"
      ],
      figures: ["柴荣（后周世宗）", "刘崇（北汉世祖）", "杨衮（辽将）", "赵匡胤（后周将领）"],
      result: "后周军在高平击败北汉与辽联军，北汉退守太原。",
      impact: "柴荣借此树立权威，整顿禁军，为后周改革与北伐奠定基础。",
      scene: {
        type: "war",
        title: "高平之战 · 兵棋推演",
        subtitle: "954 年 · 后周 vs 北汉 / 辽",
        note: "地形为 SRTM 真实高程（垂直夸张），省份、兵力、战线为战术示意，不是精确历史阵图。",
        duration: 30,
        tick: 0.1,
        seed: 954,
        terrain: { dem: "gaoping", bounds: { west: 111.4, east: 114.6, south: 34.8, north: 38.2 }, size: [96, 108], exaggeration: 9, meshStep: 0.01 },
        camera: { dist: 90, az: 0, polar: 50, target: [0, 0] },
        sides: [
          { id: "zhou", name: "后周", color: "#d4553b", short: "周" },
          { id: "beihan", name: "北汉", color: "#6f8399", short: "汉" },
          { id: "liao", name: "辽", color: "#8a7a5a", short: "辽" }
        ],
        map: {
          provinces: [
            { id: "taiyuan", name: "太原", terrain: "mountain", owner: "beihan", vp: 3,
              polygon: [[-36,30],[-12,30],[-12,10],[-36,10]],
              neighbors: ["daizhou", "qinshui"] },
            { id: "daizhou", name: "代州", terrain: "mountain", owner: "liao", vp: 1,
              polygon: [[-12,30],[12,30],[12,10],[-12,10]],
              neighbors: ["taiyuan", "luzhou", "gaoping"] },
            { id: "luzhou", name: "潞州", terrain: "hill", owner: "beihan", vp: 3,
              polygon: [[12,30],[36,30],[36,10],[12,10]],
              neighbors: ["daizhou", "huguan"] },
            { id: "qinshui", name: "沁水", terrain: "mountain", owner: "zhou", vp: 1,
              polygon: [[-36,10],[-12,10],[-12,-10],[-36,-10]],
              neighbors: ["taiyuan", "gaoping", "duanshi"] },
            { id: "gaoping", name: "高平", terrain: "river_valley", owner: "zhou", vp: 3,
              polygon: [[-12,10],[12,10],[12,-10],[-12,-10]],
              neighbors: ["daizhou", "qinshui", "huguan", "zezhou"] },
            { id: "huguan", name: "壶关", terrain: "hill", owner: "beihan", vp: 2,
              polygon: [[12,10],[36,10],[36,-10],[12,-10]],
              neighbors: ["luzhou", "gaoping", "lingchuan"] },
            { id: "duanshi", name: "端氏", terrain: "hill", owner: "zhou", vp: 1,
              polygon: [[-36,-10],[-12,-10],[-12,-30],[-36,-30]],
              neighbors: ["qinshui", "zezhou"] },
            { id: "zezhou", name: "泽州", terrain: "plain", owner: "zhou", vp: 3,
              polygon: [[-12,-10],[12,-10],[12,-30],[-12,-30]],
              neighbors: ["gaoping", "duanshi", "lingchuan"] },
            { id: "lingchuan", name: "陵川", terrain: "mountain", owner: "zhou", vp: 1,
              polygon: [[12,-10],[36,-10],[36,-30],[12,-30]],
              neighbors: ["huguan", "zezhou"] }
          ],
          borders: [
            { a: "taiyuan", b: "daizhou", points: [[-12,30],[-12,10]] },
            { a: "daizhou", b: "luzhou", points: [[12,30],[12,10]] },
            { a: "taiyuan", b: "qinshui", points: [[-36,10],[-12,10]] },
            { a: "daizhou", b: "gaoping", points: [[-12,10],[12,10]] },
            { a: "luzhou", b: "huguan", points: [[12,10],[36,10]] },
            { a: "qinshui", b: "gaoping", points: [[-12,10],[-12,-10]] },
            { a: "gaoping", b: "huguan", points: [[12,10],[12,-10]] },
            { a: "qinshui", b: "duanshi", points: [[-36,-10],[-12,-10]] },
            { a: "gaoping", b: "zezhou", points: [[-12,-10],[12,-10]] },
            { a: "huguan", b: "lingchuan", points: [[12,-10],[36,-10]] },
            { a: "duanshi", b: "zezhou", points: [[-12,-10],[-12,-30]] },
            { a: "zezhou", b: "lingchuan", points: [[12,-10],[12,-30]] }
          ],
          cities: [
            { id: "gaoping-city", name: "高平", provinceId: "gaoping", pos: [0, 0] },
            { id: "zezhou-city", name: "晋城", provinceId: "zezhou", pos: [0, -20] },
            { id: "luzhou-city", name: "潞州", provinceId: "luzhou", pos: [24, 20] },
            { id: "taiyuan-city", name: "太原", provinceId: "taiyuan", pos: [-24, 20] },
            { id: "daizhou-city", name: "代州", provinceId: "daizhou", pos: [0, 20] }
          ],
          rivers: [
            { id: "danhe", name: "丹河", points: [[-30,-6],[-16,-2],[0,2],[16,6],[30,10]] }
          ]
        },
        units: [
          { id: "zhou-center", name: "后周中军", side: "zhou", type: "infantry",
            provinceId: "zezhou", strength: 100, morale: 100, attack: 12, defense: 11, speed: 1.0,
            orders: [
              { at: 0.00, type: "defend", to: "zezhou" },
              { at: 0.55, type: "attack", to: "gaoping" },
              { at: 0.82, type: "advance", to: "huguan" },
              { at: 0.95, type: "advance", to: "luzhou" }
            ] },
          { id: "zhou-right", name: "后周右军", side: "zhou", type: "infantry",
            provinceId: "gaoping", strength: 65, morale: 70, attack: 8, defense: 8, speed: 0.9,
            orders: [
              { at: 0.00, type: "defend", to: "gaoping" },
              { at: 0.42, type: "retreat", to: "zezhou" }
            ] },
          { id: "zhou-left", name: "后周左军", side: "zhou", type: "infantry",
            provinceId: "qinshui", strength: 75, morale: 85, attack: 10, defense: 9, speed: 1.0,
            orders: [
              { at: 0.00, type: "defend", to: "qinshui" },
              { at: 0.60, type: "attack", to: "gaoping" },
              { at: 0.88, type: "advance", to: "huguan" }
            ] },
          { id: "beihan-main", name: "北汉军", side: "beihan", type: "infantry",
            provinceId: "luzhou", strength: 90, morale: 90, attack: 11, defense: 9, speed: 1.0,
            orders: [
              { at: 0.05, type: "advance", to: "huguan" },
              { at: 0.20, type: "advance", to: "gaoping" },
              { at: 0.75, type: "retreat", to: "huguan" },
              { at: 0.88, type: "retreat", to: "luzhou" },
              { at: 0.96, type: "retreat", to: "daizhou" }
            ] },
          { id: "beihan-forward", name: "北汉前锋", side: "beihan", type: "infantry",
            provinceId: "huguan", strength: 60, morale: 80, attack: 9, defense: 8, speed: 1.1,
            orders: [
              { at: 0.00, type: "defend", to: "huguan" },
              { at: 0.10, type: "advance", to: "gaoping" },
              { at: 0.75, type: "retreat", to: "huguan" },
              { at: 0.92, type: "retreat", to: "luzhou" }
            ] },
          { id: "liao-flank", name: "辽军", side: "liao", type: "cavalry",
            provinceId: "daizhou", strength: 55, morale: 80, attack: 10, defense: 8, speed: 1.3,
            orders: [
              { at: 0.12, type: "advance", to: "gaoping" },
              { at: 0.78, type: "retreat", to: "daizhou" }
            ] }
        ],
        phases: [
          { at: 0.00, date: "954.3 初", label: "北汉南下",
            log: "北汉与辽军越过太平驿，向高平推进。", effects: [] },
          { at: 0.22, date: "954.3 上", label: "高平接战",
            log: "两军在高平接战，后周右军承受压力。", effects: [] },
          { at: 0.42, date: "954.3 中", label: "右军溃退",
            log: "樊爱能、何徽率右军退走，后周阵线出现缺口。",
            effects: [{ type: "morale", side: "zhou", unit: "zhou-right", value: -40 }] },
          { at: 0.55, date: "954.3 下", label: "柴荣督战",
            log: "柴荣亲临阵前，赵匡胤等率军反击。",
            effects: [{ type: "attack", side: "zhou", value: 0.2 }, { type: "morale", side: "zhou", value: 10 }] },
          { at: 0.75, date: "954.3 末", label: "北汉溃退",
            log: "北汉军阵线崩溃，辽军后撤。",
            effects: [{ type: "morale", side: "beihan", value: -30 }, { type: "morale", side: "liao", value: -20 }] },
          { at: 0.92, date: "战后", label: "战后",
            log: "后周军追击，北汉退守太原。", effects: [] }
        ],
        text: {
          time: "954 年三月",
          place: "高平（今山西高平）",
          figures: ["柴荣（后周世宗）", "刘崇（北汉世祖）", "杨衮（辽将）"],
          result: "后周军在高平击败北汉与辽联军，北汉退守太原。",
          impact: "柴荣借此树立权威，整顿禁军，为后周改革与北伐奠定基础。"
        }
      },
      ask: { q: "高平之战对柴荣意味着什么？", a: "它既是生死考验，也是改革契机；柴荣借此树立权威，开始整顿军队、削弱藩镇，为后续南征北伐打基础。" },
      image: { file: "assets/events/wudai/e06.jpg", alt: "高平山地战场上后周军反击北汉与辽军的艺术复原示意。", promptId: "wudai-e06", credit: "AI 艺术复原示意" },
      vr: {
        pano: "assets/vr/wudai/e06.jpg",
        hotspots: [
          { x: 0.40, y: 0.50, label: "柴荣督战", text: "后周世宗柴荣亲临阵前，督军反击。" },
          { x: 0.35, y: 0.62, label: "后周盾阵", text: "后周步兵结阵，承受北汉与辽军冲击。" },
          { x: 0.62, y: 0.52, label: "北汉 / 辽骑兵", text: "北汉与辽军骑兵从侧翼压来，队形为情景示意。" }
        ]
      },
      focus: { dist: 20, az: -14, polar: 52 },
      historiography: { level: "consensus", note: "赵匡胤在高平之战中的作用见于宋人史籍，细节或有夸大；后周获胜为共识。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·世宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "周本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "显德元年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：赵匡胤作用的表述、樊爱能/何徽临阵脱逃的细节。"
    },
    {
      id: "e11", order: 7, date: "955年起（显德年间）", shortDate: "955", title: "世宗改革",
      kind: "reform",
      place: "汴州（今河南开封）", regionId: "houzhou", routeId: "r-capitals", nodeId: "bianzhou-947",
      lon: 114.36, lat: 34.85,
      summary: "高平之战后，后周世宗柴荣着手整顿军政与财政：裁汰冗兵、选练禁军，均定田赋、惩办贪吏，限制佛教、毁佛铸钱，编定《大周刑统》，疏浚汴河。改革增强了后周国力，为北宋统一奠定了基础。",
      detail: [
        "954 年高平之战后，柴荣整顿禁军，裁汰老弱，选练精锐，加强中央对军队的控制。",
        "955 年，均定田赋，减轻部分农民负担，增加财政收入；同时整顿吏治、惩办贪吏。",
        "955—956 年，限制佛教，废寺、勒僧尼还俗、毁佛铸钱，缓解铜荒；评价需并陈财政收益与社会代价。",
        "命臣僚编定《大周刑统》，统一法律；疏浚汴河等漕运，恢复开封的交通与经济。",
        "改革增强了后周国力，为北宋统一南方与结束分裂局面准备了条件。"
      ],
      figures: ["柴荣（后周世宗）", "王溥", "范质", "赵匡胤（禁军将领）"],
      result: "后周军政、财政、法律与漕运得到整顿，国力增强。",
      impact: "为北宋统一奠定制度与军事基础；限制佛教等措施也有社会代价，需并陈。",
      ask: { q: "世宗改革包括哪些方面？为什么说它为北宋统一奠定了基础？", a: "包括整顿禁军、均定田赋、整顿吏治、限制佛教与铸钱、编定刑统、疏浚漕运等；这些措施增强了后周的财政与军力，也为北宋承接制度与统一条件打下基础。" },
      image: { file: "assets/events/wudai/e11.jpg", alt: "后周世宗柴荣与大臣在汴州朝堂议政的艺术复原占位图。", promptId: "wudai-e11", credit: "占位 · 待 GPT-Image2 替换" },
      focus: { dist: 28, az: 0, polar: 46 },
      historiography: { level: "debate", note: "改革措施与为统一奠定基础是教材共识；限佛/废寺的规模、社会代价与评价存在不同侧重，课堂应并陈。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：后周世宗改革为北宋统一奠定基础。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·世宗本纪、食货志", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "周本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "显德二年至六年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：均定田赋、限佛/废寺、刑统、整顿禁军的表述与评价；朝堂人物称谓与台词为情景复原。",
      vr: {
        pano: "assets/vr/wudai/e11.jpg",
        hotspots: [
          { x: 0.50, y: 0.47, label: "柴荣", text: "后周世宗，主持军政、赋税、法制与漕运整顿。" },
          { x: 0.40, y: 0.60, label: "宰相", text: "朝堂议政的角色化呈现，不是史料原文。" },
          { x: 0.62, y: 0.61, label: "大臣", text: "户部、御史、禁军将领围绕改革措施发言。" }
        ]
      },
      scene: {
        type: "court",
        variant: "court",
        title: "世宗改革 · 朝堂议政",
        subtitle: "955 年起 · 后周 · 汴州",
        note: "人物称谓、台词与场景为教学情景复原，不是史料原文；改革措施以教材与正史概括为准。",
        duration: 26,
        camera: { dist: 34, az: 0, polar: 70 },
        roles: [
          { id: "emperor", name: "柴荣", rank: "后周世宗", side: "reform", pose: "seat" },
          { id: "chancellor", name: "宰相", rank: "中书", side: "reform", pose: "listen" },
          { id: "finance", name: "户部官员", rank: "三司", side: "cautious", pose: "listen" },
          { id: "censor", name: "御史", rank: "御史台", side: "reform", pose: "listen" },
          { id: "general", name: "禁军将领", rank: "殿前", side: "reform", pose: "listen" },
          { id: "guard", name: "侍卫", rank: "宿卫", side: "neutral", pose: "guard" }
        ],
        phases: [
          { at: 0.00, speaker: "emperor", label: "高平之后", log: "柴荣：高平一战，禁军老弱与临阵脱逃之弊，必须整顿。", gesture: "raise" },
          { at: 0.18, speaker: "general", label: "整顿禁军", log: "禁军将领：请裁汰老弱，选练精锐，统一号令。", gesture: "point" },
          { at: 0.40, speaker: "finance", label: "均定田赋", log: "户部官员：均田赋可纾民困，但州县隐户未清，须先核田。", gesture: "spread" },
          { at: 0.60, speaker: "censor", label: "惩贪与法制", log: "御史：贪吏不惩，诏令难行；请颁统一刑统。", gesture: "raise" },
          { at: 0.78, speaker: "emperor", label: "限佛铸钱", log: "柴荣：限佛、毁佛铸钱以济国用；此事有社会代价，须慎行。", gesture: "raise" },
          { at: 0.92, speaker: "emperor", label: "改革收束", log: "改革增强后周国力，为统一准备条件；评价应并陈收益与代价。", gesture: "seat" }
        ],
        text: {
          time: "955 年起（显德年间）",
          place: "汴州（今河南开封）",
          figures: ["柴荣（后周世宗）", "宰相", "户部官员", "御史", "禁军将领"],
          result: "后周军政、财政、法律与漕运得到整顿，国力增强。",
          impact: "为北宋统一奠定制度与军事基础；限制佛教等措施也有社会代价，需并陈。"
        }
      }
    },
    {
      id: "e07", order: 8, date: "955—958年", shortDate: "955", title: "三征南唐",
      kind: "war",
      battle: { preset: "siege", terrain: "huainan", sides: [{ id: "zhou", name: "后周", color: "#b0563c", short: "周" }, { id: "tang", name: "南唐", color: "#4f8a78", short: "唐" }] },
      place: "寿州（今安徽寿县）", regionId: "houzhou", routeId: "r-south", nodeId: "shouzhou",
      lon: 116.78, lat: 32.60,
      summary: "955年至958年，后周世宗柴荣三次亲征南唐，攻下寿州等地，夺取江北十四州。南唐去帝号称臣，后周国力大增，为北宋统一南方铺路；此战是五代末年规模最大的战争之一。",
      detail: [
        "955年，柴荣下诏征南唐，目标直指南唐江北重镇寿州。",
        "寿州守将刘仁赡坚守经年，后周军多次强攻，伤亡很大。",
        "957年寿州陷落；后周军继续攻取扬州、楚州等地，兵临长江。",
        "958年，南唐主李璟去帝号，改称江南国主，割江北十四州，向后周称臣。",
        "后周获得淮南富庶地区，增强了财政与军事实力。"
      ],
      figures: ["柴荣（后周世宗）", "李璟（南唐元宗）", "刘仁赡（南唐守将）"],
      result: "后周夺取江北十四州，南唐去帝号称臣。",
      impact: "后周获得淮南财赋，为北宋统一南方铺路。",
      ask: { q: "后周为什么要先打南唐？", a: "南唐占据江淮富庶之地，又相对虚弱；夺取淮南既能削弱南方最大割据政权，又能增强后周财力，为统一战争提供基地。" },
      image: { file: "assets/events/wudai/e07.jpg", alt: "后周军队在淮河与寿州城下作战的艺术复原示意。", promptId: "wudai-e07", credit: "AI 艺术复原示意" },
      vr: {
        pano: "assets/vr/wudai/e07.jpg",
        hotspots: [
          { x: 0.58, y: 0.48, label: "寿州城楼", text: "南唐守军据城坚守，后周军多次强攻。" },
          { x: 0.42, y: 0.59, label: "淮河浮桥", text: "后周军队渡河、攻城，画面为艺术复原示意。" },
          { x: 0.34, y: 0.64, label: "后周军", text: "后周军以步兵、水军与民夫协同攻城。" }
        ]
      },
      focus: { dist: 24, az: 12, polar: 48 },
      historiography: { level: "consensus", note: "“三征”一般指 955—958 年间三次亲征；江北十四州的州名单与交割细节各书略有出入。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：后周夺取江淮，南唐去帝号称臣。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·世宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "南唐世家", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "显德二年至五年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：江北十四州州名、“江南国主”称谓、寿州陷落时间。"
    },
    {
      id: "e08", order: 9, date: "959年", shortDate: "959", title: "北伐契丹",
      kind: "war",
      battle: { preset: "cavalry", terrain: "hebei", sides: [{ id: "zhou", name: "后周", color: "#b0563c", short: "周" }, { id: "liao", name: "辽", color: "#8a7a5a", short: "辽" }] },
      place: "瓦桥关（今河北雄县一带）", regionId: "houzhou", routeId: "r-north", nodeId: "waqiaoguan",
      lon: 116.00, lat: 39.00,
      summary: "959年，柴荣北伐辽，收复瀛、莫等州及瓦桥关、益津关、淤口关，兵锋逼近幽州。正当准备进攻幽州时，柴荣病重，北伐中止；这是五代末年中原政权对辽最有力的一次反击。",
      detail: [
        "后周在淮南得手后，柴荣转向北方，目标收复燕云。",
        "959年，后周军北上，辽守将相继投降，瓦桥、益津、淤口三关被收复。",
        "后周军攻取瀛、莫等州，逼近辽南京幽州。",
        "柴荣在军中病倒，后周军撤回；已收复的关南之地得以保留。"
      ],
      figures: ["柴荣（后周世宗）", "耶律璟（辽穆宗）"],
      result: "后周收复瀛、莫等州及瓦桥、益津、淤口三关，逼近幽州；因柴荣病重撤军。",
      impact: "这是五代末年中原对辽最有力的一次反击，关南之地得以保留。",
      ask: { q: "如果柴荣没有病倒，后周能收复幽州吗？", a: "不能简单假设。后周军进展顺利，但辽军主力未受重创，幽州城防坚固；历史没有如果，课堂应关注北伐反映的统一趋势与后周军力。" },
      image: { file: "assets/events/wudai/e08.jpg", alt: "后周骑兵北出瓦桥关、辽军远退的艺术复原示意。", promptId: "wudai-e08", credit: "AI 艺术复原示意" },
      vr: {
        pano: "assets/vr/wudai/e08.jpg",
        hotspots: [
          { x: 0.58, y: 0.49, label: "瓦桥关", text: "后周收复瓦桥、益津、淤口三关，逼近幽州。" },
          { x: 0.38, y: 0.61, label: "后周骑兵", text: "后周骑兵北出关城，辽军远退。" },
          { x: 0.66, y: 0.39, label: "燕山", text: "燕山—长城一线是中原与辽对峙的地理屏障。" }
        ]
      },
      focus: { dist: 18, az: 14, polar: 50 },
      historiography: { level: "consensus", note: "收复州数与三关名称各书记载略有差异；有作瀛、莫、易三州者，本数据采用较保守的“瀛、莫等州”。“关南”指瓦桥、益津、淤口三关以南地区。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：后周世宗北伐，收复部分燕云失地。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·世宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "穆宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对辽侧记载。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "显德六年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：瀛、莫等州（有作瀛、莫、易三州）与三关的具体表述，北伐起止时间。"
    },
    {
      id: "e09", order: 10, date: "959年6月", shortDate: "959", title: "柴荣病逝",
      kind: "politics",
      place: "汴州", regionId: "houzhou", routeId: "r-capitals", nodeId: "bianzhou-947",
      lon: 114.36, lat: 34.85,
      summary: "959年六月，柴荣病逝，年仅三十九岁。年幼的柴宗训即位，符太后临朝听政，后周政局出现权力真空，为次年的陈桥兵变埋下伏笔；北伐随即中止。",
      detail: [
        "柴荣北伐途中病重，返回汴京后于显德六年六月去世，年仅三十九岁。",
        "年幼的柴宗训即位，符太后临朝听政，范质、王溥等辅政。",
        "柴荣临终前调整宰辅与禁军将领，但未能消除权力隐患。",
        "赵匡胤出任殿前都点检，掌握禁军精锐，成为后周政局的关键人物。"
      ],
      figures: ["柴荣（后周世宗）", "柴宗训（后周恭帝）", "赵匡胤（殿前都点检）"],
      result: "柴荣病逝，幼主柴宗训即位，符太后临朝，后周出现权力真空。",
      impact: "为次年陈桥兵变与北宋建立埋下伏笔。",
      ask: { q: "柴荣之死为什么被视为五代末年的转折点？", a: "柴荣的改革和军事胜利使后周具备统一条件，但他早逝、幼主即位，权力落到禁军将领手中，统一最终由赵匡胤完成。" },
      image: { file: "assets/events/wudai/e09.jpg", alt: "柴荣病榻与帐外等候将领的艺术复原示意。", promptId: "wudai-e09", credit: "AI 艺术复原示意" },
      focus: { dist: 22, az: -6, polar: 46 },
      historiography: { level: "consensus", note: "柴荣卒年三十九岁、幼主年岁依传统记载；具体宫廷安排细节有不同表述。月份为农历六月，公历约 7 月。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：柴荣改革为北宋统一奠定基础。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·世宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新五代史", author: "欧阳修", publisher: "中华书局", year: "1974", locator: "周本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "显德六年条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：柴荣卒月（农历六月/公历 7 月）、幼主年岁与辅政安排。"
    },
    {
      id: "e10", order: 11, date: "960年", shortDate: "960", title: "陈桥兵变",
      kind: "politics",
      place: "陈桥（今河南封丘一带）", regionId: "houzhou", routeId: "r-capitals", nodeId: "chenqiao-960",
      lon: 114.50, lat: 34.95,
      summary: "960年，赵匡胤率禁军北上御敌，在陈桥驿被部下黄袍加身，回师汴州，迫使后周恭帝禅位，建立宋朝。五代结束，北宋统一进程开始；兵变几乎兵不血刃。",
      detail: [
        "960年正月，传言辽与北汉联军南下，后周派赵匡胤率禁军北上。",
        "军至陈桥驿，部下将黄袍披在赵匡胤身上，拥立他为帝。",
        "赵匡胤回师汴州，约束军纪，后周恭帝禅位，宋朝建立，改元建隆。",
        "宋朝继承后周的政治与军事基础，逐步消灭南方割据政权。",
        "“黄袍加身”细节主要见于宋人史籍，带有事后建构色彩。"
      ],
      figures: ["赵匡胤（宋太祖）", "柴宗训（后周恭帝）", "赵普、石守信等（拥立者）"],
      result: "赵匡胤在陈桥驿被拥立为帝，回师汴州，后周恭帝禅位，北宋建立。",
      impact: "五代结束，北宋统一进程开始；宋朝继承后周的政治与军事基础。",
      ask: { q: "陈桥兵变为什么能几乎兵不血刃地完成？", a: "赵匡胤掌握禁军精锐，后周幼主新立、中央权威薄弱；兵变前已有联络与准备，回师时又严明军纪，减少了阻力。" },
      image: { file: "assets/events/wudai/e10.jpg", alt: "陈桥驿清晨士兵拥立赵匡胤的艺术复原示意。", promptId: "wudai-e10", credit: "AI 艺术复原示意" },
      focus: { dist: 16, az: 10, polar: 50 },
      historiography: { level: "debate", note: "兵变为史实；是否为赵匡胤集团预谋，学界有不同看法。教材采用“兵变”叙述，细节多据宋人记载。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：赵匡胤建立北宋，五代结束。" },
        { title: "宋史", author: "脱脱等", publisher: "中华书局", year: "1977", locator: "太祖本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "续资治通鉴长编", author: "李焘", publisher: "中华书局", year: "2004", locator: "卷一，建隆元年条", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；陈桥兵变细节的主要史源之一。" },
        { title: "旧五代史", author: "薛居正等", publisher: "中华书局", year: "1976", locator: "周书·恭帝本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对后周末年的记载。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：陈桥兵变是否预谋、黄袍加身细节、后周恭帝禅位程序。"
    }
  ],

  timeline: {
    start: "907",
    end: "960",
    ticks: [
      { at: "907", label: "后梁代唐", eventId: "e01" },
      { at: "923", label: "后唐灭梁", eventId: "e02" },
      { at: "936", label: "割让燕云", eventId: "e03" },
      { at: "947", label: "契丹灭晋", eventId: "e04" },
      { at: "951", label: "后周建立", eventId: "e05" },
      { at: "954", label: "高平之战", eventId: "e06" },
      { at: "955", label: "世宗改革", eventId: "e11" },
      { at: "955", label: "三征南唐", eventId: "e07" },
      { at: "959", label: "北伐契丹", eventId: "e08" },
      { at: "959", label: "柴荣病逝", eventId: "e09" },
      { at: "960", label: "陈桥兵变", eventId: "e10" }
    ]
  },

  credits: {
    mapSources: [
      "《中外历史纲要（上）》第6课（教育部组织编写，人民教育出版社 2019 年版）——教学口径",
      "《中国历史地图集》第五册（谭其骧主编，中国地图出版社 1982 年版）——边界核对参考，未复制图幅",
      "Historiqly（https://map.historiqly.com/zh/）——参考疆域切换与配色；其疆界数据来源标注为 Historical Basemaps（GPL-3.0），本项目未复制其数据",
      "wowhistorymap（https://www.wowhistorymap.com/）——访问超时，仅记录，未使用",
      "historiamap（https://www.historiamap.com/）——站点声明数据据《中国历史地图集》矢量化；未确认可二次分发，未复制",
      "txlzp（http://www.txlzp.com/lishi/）——访问超时，授权未确认，未使用"
    ],
    sourceRecords: [
      { id: "src-historiqly", name: "Historiqly", url: "https://map.historiqly.com/zh/", usage: "reference",
        what: "按时期切换疆域的交互逻辑与配色思路参考；其页面注明疆界几何来自 Historical Basemaps（GPL-3.0）",
        license: "站点整体条款未逐条核对；疆界数据来源标注为 GPL-3.0；本项目未复制、未分发其数据，仅参考",
        accessed: "2026-10-23" },
      { id: "src-wowhistorymap", name: "wowhistorymap", url: "https://www.wowhistorymap.com/", usage: "reference",
        what: "历史地图检索与核对参考（计划）",
        license: "2026-10-23 访问超时（504），许可未确认；未使用",
        accessed: "2026-10-23" },
      { id: "src-historiamap", name: "historiamap", url: "https://www.historiamap.com/", usage: "reference",
        what: "中国历史地图在线检索；站点当前展示春秋、战国、明朝，未用于五代十国边界核对",
        license: "站点声明数据据《中国历史地图集》矢量化；二次分发许可未确认；未复制",
        accessed: "2026-10-23" },
      { id: "src-txlzp", name: "txlzp 历史地图", url: "http://www.txlzp.com/lishi/", usage: "reference",
        what: "静态地图素材（计划参考）",
        license: "2026-10-23 访问超时（504），授权未确认；未使用",
        accessed: "2026-10-23" },
      { id: "src-tanqixiang", name: "《中国历史地图集》第五册", url: "", usage: "reference",
        what: "五代十国疆域核对依据；只作文字核对，未复制图幅",
        license: "核对参考，未复制图幅；图集版权归原编者/出版者",
        accessed: "2026-10-23" },
      { id: "src-textbook", name: "《中外历史纲要（上）》", url: "", usage: "reference",
        what: "第6课教学口径与事件分期",
        license: "教材引用，仅用于课堂教学；不复制版面",
        accessed: "2026-10-23" },
      { id: "src-threejs", name: "Three.js r147 + OrbitControls", url: "https://threejs.org/", usage: "data",
        what: "三维渲染库（代码），随课件放在 js/lib/",
        license: "MIT License",
        accessed: "2026-10-23" }
    ],
    imageNote: "插画与封面为 AI 生成的艺术复原示意，不是历史影像。",
    codeLicense: "Three.js r147 (MIT)"
  }
};
