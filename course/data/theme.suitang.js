window.HISTORY_THEMES = window.HISTORY_THEMES || {};
/*
 * 主题：隋唐 · 安史之乱（薄主题）
 * 数据状态：sourced —— 有来源、待耿雨史实审核；不是 reviewed。
 * 定位：用 6 个事件讲清“唐由盛转衰”的转折，不展开完整唐史。
 * 地图：755 年前后的“安史之乱形势”示意图；唐廷、燕、回纥、吐蕃均为示意色块。
 * 说明：路线与节点 ID 沿用 Claude 第一轮；只修正文字、来源、坐标与少量节点。
 */
window.HISTORY_THEMES.suitang = {
  schemaVersion: "1.0.0",

  meta: {
    id: "suitang",
    order: 2,
    tabLabel: "隋唐",
    title: "隋唐",
    subtitle: "安史之乱 · 盛唐转折",
    periodLabel: "唐天宝年间（约 755 年）",
    defaultEventId: "e01",
    accent: "#d09a3a",
    status: "sourced",
    sourceNote: "事件文字以统编《中外历史纲要（上）》第6课为教学口径，参考《旧唐书》《新唐书》《资治通鉴》；势力范围为安史之乱形势示意，不是精确疆域；待耿雨史实审核。",
    licenseNote: "仅用于课堂教学演示；历史地图为示意性简化；插画与封面为 AI 艺术复原示意，不是历史影像。",
    cover: "assets/ui/cover-suitang.jpg",
    home: { dist: 40, az: 0, polar: 40 }
  },

  map: {
    projection: "equirect",
    bounds: { west: 100, east: 123, south: 28, north: 45 },
    relief: { mode: "stylized", amplitude: 1.0, texture: "" },
    regions: [
      { id: "tang", name: "唐廷", color: "#c39a3e", opacity: 0.40, highlight: true,
        labelAt: [109.0, 32.2], labelSize: "large", radiusKm: 720, polygon: [],
        status: "approx",
        sourceNote: "示意唐廷控制区（关中、河东、中原、江南、巴蜀等），非精确疆域；安史之乱期间河北、河南部分地区的实际控制随战局变化。" },
      { id: "yan", name: "燕（安禄山）", color: "#9a4636", opacity: 0.46, highlight: false,
        labelAt: [115.8, 38.4], labelSize: "normal", radiusKm: 330, polygon: [],
        status: "approx",
        sourceNote: "示意安禄山起兵后控制的河北一带；范围随战局变化，非精确疆域。安禄山在洛阳称帝，国号大燕。" },
      { id: "huihu", name: "回纥", color: "#7a8a6a", opacity: 0.40, highlight: false,
        labelAt: [107.5, 43.3], labelSize: "normal", radiusKm: 480, polygon: [],
        status: "approx",
        sourceNote: "回纥汗国中心在漠北，图中只示意其南境与援唐方向；非精确疆域。" },
      { id: "tubo", name: "吐蕃", color: "#6f7f99", opacity: 0.40, highlight: false,
        labelAt: [101.8, 33.6], labelSize: "normal", radiusKm: 380, polygon: [],
        status: "approx",
        sourceNote: "吐蕃东境示意；安史之乱后吐蕃趁虚攻占陇右、河西部分州县，图中不逐年变化。" }
    ],
    rivers: [
      { id: "huanghe", name: "黄河", color: "#7fb4b8",
        pts: [[103.8, 36.1], [105.2, 37.5], [106.4, 38.6], [106.9, 39.6], [107.6, 40.7], [109.8, 40.6],
              [111.2, 40.2], [111.3, 39.0], [110.6, 37.6], [110.4, 36.2], [110.3, 34.7], [111.2, 34.8],
              [112.4, 34.85], [113.6, 34.95], [114.6, 35.2], [115.5, 35.7], [116.3, 36.2], [117.0, 36.7],
              [118.0, 37.3], [118.9, 37.7]],
        labelAt: [111.0, 39.6], status: "approx" },
      { id: "weihe", name: "渭水", color: "#7fb4b8",
        pts: [[104.6, 35.0], [105.2, 34.8], [105.9, 34.6], [106.5, 34.5], [107.2, 34.4], [108.2, 34.35], [109.2, 34.45], [110.2, 34.6]],
        labelAt: [107.2, 34.6], status: "approx" },
      { id: "luoshui", name: "洛水", color: "#7fb4b8",
        pts: [[110.4, 34.0], [110.9, 34.1], [111.4, 34.2], [111.9, 34.4], [112.4, 34.6], [112.8, 34.7], [113.1, 34.8], [113.3, 34.9]],
        labelAt: [111.8, 34.5], status: "approx" },
      { id: "changjiang", name: "长江", color: "#7fb4b8",
        pts: [[104.0, 28.3], [104.6, 28.8], [105.4, 28.9], [106.5, 29.6], [107.5, 30.0], [108.4, 30.8],
              [109.5, 31.0], [110.4, 30.9], [111.3, 30.7], [112.2, 30.3], [113.1, 29.4], [114.3, 30.6],
              [115.1, 30.1], [116.0, 29.8], [117.0, 30.5], [118.4, 31.3], [118.8, 32.1], [119.4, 32.2],
              [120.3, 31.9], [121.0, 31.7]],
        labelAt: [112.2, 30.3], status: "approx" }
    ],
    places: [
      { id: "fanyang", name: "范阳", lon: 116.35, lat: 39.85, kind: "camp", label: true, coordAccuracy: "approx", note: "安禄山起兵地；范阳节度使驻地，今北京一带。" },
      { id: "luoyang", name: "洛阳", lon: 112.45, lat: 34.62, kind: "capital", label: true, coordAccuracy: "approx", note: "唐东都；756 年正月被叛军攻占。" },
      { id: "tongguan", name: "潼关", lon: 110.29, lat: 34.48, kind: "pass", label: true, coordAccuracy: "approx", note: "关中门户；756 年六月失守。" },
      { id: "changan", name: "长安", lon: 108.94, lat: 34.34, kind: "capital", label: true, coordAccuracy: "approx", note: "唐都城；756 年陷落。" },
      { id: "lingwu", name: "灵武", lon: 106.34, lat: 38.10, kind: "city", label: true, coordAccuracy: "approx", note: "756 年七月李亨在此即位，是为唐肃宗。" },
      { id: "xiangjisi", name: "香积寺", lon: 108.85, lat: 34.12, kind: "battlefield", label: true, coordAccuracy: "approx", note: "757 年唐军与叛军决战地，长安由此收复。" },
      { id: "taiyuan", name: "太原", lon: 112.55, lat: 37.87, kind: "city", label: true, coordAccuracy: "approx", note: "唐北都，河东重镇。" },
      { id: "yecheng", name: "邺城", lon: 114.35, lat: 36.25, kind: "city", label: false, coordAccuracy: "approx", note: "安庆绪退守之地；唐军在此遭遇挫折。" },
      { id: "suiyang", name: "睢阳", lon: 115.65, lat: 34.42, kind: "battlefield", label: true, coordAccuracy: "approx", note: "张巡、许远坚守睢阳，屏蔽江淮。" },
      { id: "chengdu", name: "成都", lon: 104.06, lat: 30.66, kind: "city", label: true, coordAccuracy: "approx", note: "唐玄宗入蜀方向；唐南京成都府。" },
      { id: "maweiyi", name: "马嵬驿", lon: 108.35, lat: 34.30, kind: "post", label: true, coordAccuracy: "approx", note: "756 年禁军哗变、杨贵妃被赐死处；今陕西兴平西。" },
      { id: "fengxiang", name: "凤翔", lon: 107.39, lat: 34.52, kind: "city", label: false, coordAccuracy: "approx", note: "唐军反攻基地之一。" },
      { id: "bianzhou", name: "汴州", lon: 114.31, lat: 34.80, kind: "city", label: true, coordAccuracy: "approx", note: "中原漕运枢纽；安史之乱中反复争夺。" },
      { id: "yangzhou", name: "扬州", lon: 119.42, lat: 32.39, kind: "city", label: false, coordAccuracy: "approx", note: "江淮财赋重镇。" },
      { id: "heyang", name: "河阳", lon: 112.79, lat: 34.91, kind: "pass", label: false, coordAccuracy: "approx", note: "黄河渡口与河阳三城，洛阳北面要地。" },
      { id: "pingyuan", name: "平原", lon: 116.43, lat: 37.16, kind: "city", label: false, coordAccuracy: "approx", note: "颜真卿在河北组织义军抵抗叛军之地。" }
    ]
  },

  routes: [
    {
      id: "r-rebel", name: "叛军西进", color: "#cf4a3a", side: "rebel",
      nodes: [
        { id: "fanyang", name: "范阳", lon: 116.35, lat: 39.85, label: true, eventId: "e01" },
        { id: "luoyang", name: "洛阳", lon: 112.45, lat: 34.62, label: true, eventId: "e02" },
        { id: "tongguan", name: "潼关", lon: 110.29, lat: 34.48, label: true, eventId: "e03" },
        { id: "changan", name: "长安", lon: 108.94, lat: 34.34, label: true, eventId: "e04" }
      ]
    },
    {
      id: "r-tang", name: "唐军反攻", color: "#e3c164", side: "tang",
      nodes: [
        { id: "lingwu", name: "灵武", lon: 106.34, lat: 38.10, label: true, eventId: "e05" },
        { id: "xiangjisi", name: "香积寺", lon: 108.85, lat: 34.12, label: true },
        { id: "luoyang", name: "洛阳", lon: 112.45, lat: 34.62, label: true, eventId: "e06" }
      ]
    }
  ],

  events: [
    {
      id: "e01", order: 1, date: "755年11月", shortDate: "755.11", title: "范阳起兵",
      place: "范阳（今北京一带）", regionId: "yan", routeId: "r-rebel", nodeId: "fanyang",
      lon: 116.35, lat: 39.85,
      summary: "755年十一月，安禄山以讨杨国忠为名，在范阳起兵南下。他兼任平卢、范阳、河东三镇节度使，掌握重兵，叛军迅速席卷河北；安史之乱由此爆发，唐朝由盛转衰。",
      detail: [
        "安禄山兼任平卢、范阳、河东三镇节度使，长期掌握河北军政。",
        "755年十一月，他以讨杨国忠为名，在范阳起兵。",
        "据《资治通鉴》记载，安禄山率蕃汉步骑十五万，号称二十万。",
        "叛军南下，河北州县多不战而降，很快逼近洛阳。"
      ],
      ask: { q: "安禄山起兵的名义是什么？他为什么能迅速南下？", a: "以讨杨国忠为名；他长期经营河北，掌握三镇重兵，唐朝内地武备空虚，州县多不战而降。" },
      image: { file: "assets/events/suitang/e01.jpg", alt: "范阳边镇唐军集结、安禄山起兵的艺术复原示意。", promptId: "suitang-e01", credit: "AI 艺术复原示意" },
      focus: { dist: 20, az: 10, polar: 48 },
      historiography: { level: "consensus", note: "起兵兵力依《资治通鉴》记载；实际人数可能有夸大。“讨杨国忠”是起兵口号，不是唯一原因。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：安史之乱是唐由盛转衰的转折。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "安禄山传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "逆臣传·安禄山", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "天宝十四载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：起兵兵力、‘奉密诏’口号、三镇节度使范围。"
    },
    {
      id: "e02", order: 2, date: "756年1月", shortDate: "756.1", title: "洛阳失守",
      place: "洛阳", regionId: "yan", routeId: "r-rebel", nodeId: "luoyang",
      lon: 112.45, lat: 34.62,
      summary: "756年正月，叛军攻占洛阳，安禄山在洛阳称帝，国号大燕，年号圣武。洛阳失守使唐朝失去东都，关中门户暴露；唐廷急调哥舒翰守潼关，战争进入相持阶段。",
      detail: [
        "755年底至756年初，叛军渡过黄河，攻占洛阳。",
        "756年正月，安禄山在洛阳称帝，国号大燕，年号圣武。",
        "唐廷急调哥舒翰率军守潼关，阻止叛军西进。",
        "洛阳失守使唐朝失去东都，关中门户暴露。"
      ],
      ask: { q: "叛军攻占洛阳后，安禄山建立了什么政权？", a: "大燕；安禄山在洛阳称帝，年号圣武。" },
      image: { file: "assets/events/suitang/e02.jpg", alt: "叛军进入洛阳城的艺术复原示意。", promptId: "suitang-e02", credit: "AI 艺术复原示意" },
      focus: { dist: 20, az: -6, polar: 50 },
      historiography: { level: "consensus", note: "月份为公历近似；安禄山称帝的具体礼仪细节各书略有差异。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "安禄山传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "逆臣传·安禄山", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "至德元载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：洛阳失守与安禄山称帝的月份。"
    },
    {
      id: "e03", order: 3, date: "756年6月", shortDate: "756.6", title: "潼关失守",
      place: "潼关", regionId: "tang", routeId: "r-rebel", nodeId: "tongguan",
      lon: 110.29, lat: 34.48,
      summary: "756年六月，唐玄宗与杨国忠催逼哥舒翰出关迎战，唐军在灵宝西原中伏大败，潼关失守。关中门户洞开，长安危急；唐廷的战略失误加速了长安陷落。",
      detail: [
        "哥舒翰主张坚守潼关，但唐玄宗、杨国忠怀疑他拥兵自重，催其出战。",
        "756年六月，唐军出关，在灵宝西原遭叛军伏击，大败。",
        "潼关失守，关中门户洞开，长安震动。",
        "哥舒翰被俘，后降安禄山；唐军主力损失惨重。"
      ],
      ask: { q: "潼关失守的主要原因是什么？", a: "唐玄宗、杨国忠催逼哥舒翰放弃坚守、出关决战；唐军在中伏后大败，潼关失守。战略决策失误是主因。" },
      image: { file: "assets/events/suitang/e03.jpg", alt: "潼关山隘唐军溃败的艺术复原示意。", promptId: "suitang-e03", credit: "AI 艺术复原示意" },
      focus: { dist: 16, az: -12, polar: 52 },
      historiography: { level: "consensus", note: "哥舒翰被俘后投降的细节各书略有差异；“被迫出关”为教材共识。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "哥舒翰传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "哥舒翰传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "至德元载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：灵宝西原之战的兵力与哥舒翰投降细节。"
    },
    {
      id: "e04", order: 4, date: "756年7月", shortDate: "756.7", title: "长安陷落",
      place: "长安（今陕西西安）", regionId: "tang", routeId: "r-rebel", nodeId: "changan",
      lon: 108.94, lat: 34.34,
      summary: "756年，潼关失守后，唐玄宗弃长安西逃入蜀。途中马嵬驿发生兵变，杨国忠被杀，杨贵妃被迫自尽；叛军随后进入长安，唐朝中央权威受到沉重打击，肃宗在灵武另立朝廷。",
      detail: [
        "潼关失守后，唐玄宗率皇室与百官仓皇离开长安，向西逃往蜀地。",
        "行至马嵬驿，禁军哗变，杀杨国忠，逼唐玄宗赐死杨贵妃。",
        "玄宗继续入蜀；太子李亨北上灵武，另行组织抵抗。",
        "叛军进入长安，唐朝失去首都，中央权威受到沉重打击。"
      ],
      ask: { q: "马嵬驿兵变与长安陷落有什么关系？", a: "潼关失守后玄宗西逃，禁军在马嵬驿哗变，逼死杨贵妃；玄宗入蜀、太子北上，长安随后陷落。兵变是逃亡途中的政治危机。" },
      image: { file: "assets/events/suitang/e04.jpg", alt: "马嵬驿秋日山道、禁军围拢的艺术复原示意。", promptId: "suitang-e04", credit: "AI 艺术复原示意" },
      focus: { dist: 18, az: -16, polar: 50 },
      historiography: { level: "consensus", note: "马嵬驿兵变的具体策划者有不同说法；杨贵妃之死在正史中有记载，文学叙述有夸张。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：安史之乱期间长安陷落、玄宗入蜀。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "玄宗本纪、杨贵妃传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "玄宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "至德元载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：马嵬驿兵变细节、长安陷落与玄宗入蜀的时间。"
    },
    {
      id: "e05", order: 5, date: "756年7月", shortDate: "756.7", title: "灵武即位",
      place: "灵武（今宁夏灵武一带）", regionId: "tang", routeId: "r-tang", nodeId: "lingwu",
      lon: 106.34, lat: 38.10,
      summary: "756年七月，太子李亨在灵武即位，是为唐肃宗，遥尊玄宗为太上皇。灵武朝廷重新集结唐军，成为平叛的政治中心；此后唐军借回纥兵反攻，逐步收复两京。",
      detail: [
        "马嵬驿兵变后，太子李亨与玄宗分道，北上灵武。",
        "756年七月，李亨在灵武即位，改元至德，是为唐肃宗。",
        "肃宗遥尊玄宗为太上皇，重新集结西北边军与各路勤王军。",
        "灵武朝廷成为平叛的政治中心，但财政与军力都很紧张。"
      ],
      ask: { q: "唐肃宗为什么在灵武即位？", a: "长安陷落、玄宗入蜀后，唐廷需要一个就近指挥平叛的中心；李亨在灵武得到西北边军支持，于是即位，遥尊玄宗为太上皇。" },
      image: { file: "assets/events/suitang/e05.jpg", alt: "灵武边城简陋即位礼的艺术复原示意。", promptId: "suitang-e05", credit: "AI 艺术复原示意" },
      focus: { dist: 20, az: -10, polar: 48 },
      historiography: { level: "consensus", note: "灵武即位是否事先得到玄宗同意，史籍表述不一；“遥尊太上皇”是既成事实后的安排。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "肃宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "肃宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "至德元载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：灵武即位的合法性表述、玄宗与肃宗的关系。"
    },
    {
      id: "e06", order: 6, date: "757年9—10月", shortDate: "757.9", title: "收复两京",
      place: "长安、洛阳", regionId: "tang", routeId: "r-tang", nodeId: "luoyang",
      lon: 112.45, lat: 34.62,
      summary: "757年，唐军借回纥兵反攻，先在香积寺之战收复长安，随后收复洛阳。两京光复扭转了战局，但安史之乱直到763年才最终结束；唐朝由盛转衰、藩镇割据加深的局面已难挽回。",
      detail: [
        "757年，唐肃宗调集西北边军与回纥援军，准备反攻。",
        "九月，唐军在香积寺之战大败叛军，收复长安。",
        "十月，唐军继续东进，收复洛阳；安庆绪退守邺城。",
        "回纥军参与作战，战后获得大量掠获；唐廷为此付出外交代价。",
        "安史之乱至763年才结束，唐朝从此由盛转衰，藩镇割据加深。"
      ],
      ask: { q: "唐军收复两京借助了哪支外部力量？安史之乱何时结束？", a: "回纥兵；安史之乱至763年结束。两京收复是重要转折，但没有立即结束战争。" },
      image: { file: "assets/events/suitang/e06.jpg", alt: "香积寺黎明战场上唐军与回纥骑兵并肩反攻的艺术复原示意。", promptId: "suitang-e06", credit: "AI 艺术复原示意" },
      focus: { dist: 26, az: 0, polar: 46 },
      historiography: { level: "consensus", note: "回纥出兵条件与掠获细节各书有差异；“借兵”是教材概括，实际有政治交换。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第6课 从隋唐盛世到五代十国", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：唐军借回纥兵收复两京，安史之乱至763年结束。" },
        { title: "旧唐书", author: "刘昫等", publisher: "中华书局", year: "1975", locator: "肃宗本纪、郭子仪传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "新唐书", author: "欧阳修、宋祁", publisher: "中华书局", year: "1975", locator: "肃宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "资治通鉴", author: "司马光", publisher: "中华书局", year: "1956", locator: "至德二载条", url: "", accessed: "2026-10-23", confidence: "high", note: "编年叙事；只标年份条目。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：香积寺之战、回纥出兵条件、两京收复时间。"
    }
  ],

  timeline: {
    start: "755",
    end: "763",
    ticks: [
      { at: "755.11", label: "范阳起兵", eventId: "e01" },
      { at: "756.1", label: "洛阳失守", eventId: "e02" },
      { at: "756.6", label: "潼关失守", eventId: "e03" },
      { at: "756.7", label: "长安陷落", eventId: "e04" },
      { at: "756.7", label: "灵武即位", eventId: "e05" },
      { at: "757.9", label: "收复两京", eventId: "e06" }
    ]
  },

  credits: {
    mapSources: [
      "《中外历史纲要（上）》第6课（教育部组织编写，人民教育出版社 2019 年版）——教学口径",
      "《中国历史地图集》第五册（谭其骧主编，中国地图出版社 1982 年版）——唐代形势核对参考，未复制图幅",
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
        what: "中国历史地图在线检索；站点当前展示春秋、战国、明朝，未用于唐代边界核对",
        license: "站点声明数据据《中国历史地图集》矢量化；二次分发许可未确认；未复制",
        accessed: "2026-10-23" },
      { id: "src-txlzp", name: "txlzp 历史地图", url: "http://www.txlzp.com/lishi/", usage: "reference",
        what: "静态地图素材（计划参考）",
        license: "2026-10-23 访问超时（504），授权未确认；未使用",
        accessed: "2026-10-23" },
      { id: "src-tanqixiang", name: "《中国历史地图集》第五册", url: "", usage: "reference",
        what: "唐代形势核对依据；只作文字核对，未复制图幅",
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
