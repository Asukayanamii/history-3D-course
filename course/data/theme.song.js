window.HISTORY_THEMES = window.HISTORY_THEMES || {};
/*
 * 主题：宋朝 · 澶渊之盟（薄主题）
 * 数据状态：sourced —— 有来源、待耿雨史实审核；不是 reviewed。
 * 定位：用 4 个事件讲清澶渊之盟的背景、内容与影响，不展开完整宋史。
 * 地图：1004 年前后的宋辽对峙示意图。注意：1004 年西夏尚未建立（1038 年李元昊称帝），
 *   图中第三个势力写作“定难军（党项，西夏前身）”；id 仍沿用 xixia，以保持引擎兼容。
 * 说明：路线与节点 ID 沿用 Claude 第一轮；只修正文字、来源、坐标与少量节点。
 */
window.HISTORY_THEMES.song = {
  schemaVersion: "1.0.0",

  meta: {
    id: "song",
    order: 3,
    tabLabel: "宋朝",
    title: "宋朝",
    subtitle: "澶渊之盟 · 1004—1005",
    periodLabel: "北宋真宗时期（约 1004 年）",
    defaultEventId: "e01",
    accent: "#d06a3a",
    status: "sourced",
    sourceNote: "事件文字以统编《中外历史纲要（上）》第9课为教学口径，参考《宋史》《辽史》《续资治通鉴长编》；势力范围为 1004 年前后示意，不是精确疆域；待耿雨史实审核。",
    licenseNote: "仅用于课堂教学演示；历史地图为示意性简化；插画与封面为 AI 艺术复原示意，不是历史影像。",
    cover: "assets/ui/cover-song.jpg",
    home: { dist: 44, az: 0, polar: 40 }
  },

  map: {
    projection: "equirect",
    bounds: { west: 100, east: 125, south: 20, north: 44 },
    relief: { mode: "stylized", amplitude: 1.0, texture: "" },
    terrain: { mode: "dem", dem: "east-asia", exaggeration: 22, meshStep: 0.10, maxHeight: 5.2, edgeFalloff: 1.8 },
    regions: [
      { id: "song", name: "北宋", color: "#b05a3c", opacity: 0.42, highlight: true,
        labelAt: [113.6, 31.2], labelSize: "large", radiusKm: 820, polygon: [],
        status: "approx",
        sourceNote: "示意北宋控制区（中原、江南、巴蜀、岭南等），非精确疆域；北界与辽大致以白沟河—雁门关一线对峙。" },
      { id: "liao", name: "辽", color: "#6f8399", opacity: 0.42, highlight: false,
        labelAt: [118.6, 41.6], labelSize: "large", radiusKm: 560, polygon: [],
        status: "approx",
        sourceNote: "示意辽控制区，南境据燕云十六州；非精确疆域。" },
      { id: "xixia", name: "定难军（党项）", color: "#a08a4a", opacity: 0.42, highlight: false,
        labelAt: [105.8, 38.4], labelSize: "small", radiusKm: 180, polygon: [],
        status: "approx",
        sourceNote: "1004 年西夏尚未建立（1038 年李元昊称帝）；图中示意的政权为党项定难军（夏州政权），首领李德明，名义上臣属宋、辽。id 沿用 xixia 以保持引擎兼容，name 与 note 已按史实修正。" }
    ],
    rivers: [
      { id: "huanghe", name: "黄河", color: "#7fb4b8",
        pts: [[103.8, 36.1], [105.2, 37.5], [106.4, 38.6], [106.9, 39.6], [107.6, 40.7], [109.8, 40.6],
              [111.2, 40.2], [111.3, 39.0], [110.6, 37.6], [110.4, 36.2], [110.3, 34.7], [111.2, 34.8],
              [112.4, 34.85], [113.6, 34.95], [114.6, 35.2], [115.5, 35.7], [116.3, 36.2], [117.0, 36.7],
              [118.0, 37.3], [118.9, 37.7]],
        labelAt: [111.0, 39.6], status: "approx" },
      { id: "changjiang", name: "长江", color: "#7fb4b8",
        pts: [[100.2, 27.0], [101.6, 26.3], [103.0, 26.6], [104.0, 28.3], [104.6, 28.8], [105.4, 28.9],
              [106.5, 29.6], [107.5, 30.0], [108.4, 30.8], [109.5, 31.0], [110.4, 30.9], [111.3, 30.7],
              [112.2, 30.3], [113.1, 29.4], [114.3, 30.6], [115.1, 30.1], [116.0, 29.8], [117.0, 30.5],
              [118.4, 31.3], [119.4, 32.2]],
        labelAt: [112.2, 30.3], status: "approx" },
      { id: "huaihe", name: "淮河", color: "#7fb4b8",
        pts: [[113.4, 32.4], [114.5, 32.4], [115.5, 32.6], [116.4, 32.8], [117.4, 32.95], [118.5, 33.2],
              [119.1, 33.6], [120.2, 34.2]],
        labelAt: [116.0, 32.7], status: "approx" },
      { id: "baigouhe", name: "白沟河", color: "#7fb4b8",
        pts: [[115.2, 39.38], [115.4, 39.35], [115.6, 39.32], [115.8, 39.30], [116.0, 39.28], [116.2, 39.24], [116.6, 39.18], [117.0, 39.10], [117.2, 39.05]],
        labelAt: [116.2, 39.38], status: "approx" }
    ],
    places: [
      { id: "bianjing", name: "汴京", lon: 114.31, lat: 34.80, kind: "capital", label: true, coordAccuracy: "approx", note: "北宋都城东京开封府。" },
      { id: "yanjing", name: "燕京", lon: 116.40, lat: 39.90, kind: "capital", label: true, coordAccuracy: "approx", note: "辽南京，幽州。" },
      { id: "yingzhou", name: "瀛州", lon: 116.00, lat: 38.40, kind: "city", label: true, coordAccuracy: "approx", note: "1004 年瀛州之战发生地；今河北河间。" },
      { id: "chanzhou", name: "澶州", lon: 115.00, lat: 35.70, kind: "city", label: true, coordAccuracy: "approx", note: "宋真宗亲征与澶渊之盟发生地；今河南濮阳一带。" },
      { id: "dingzhou", name: "定州", lon: 114.99, lat: 38.52, kind: "city", label: true, coordAccuracy: "approx", note: "河北重镇，宋辽对峙前沿。" },
      { id: "zhending", name: "真定", lon: 114.57, lat: 38.14, kind: "city", label: false, coordAccuracy: "approx", note: "河北重镇；今河北正定。" },
      { id: "damingfu", name: "大名府", lon: 115.15, lat: 36.28, kind: "city", label: true, coordAccuracy: "approx", note: "北宋北京大名府，河北路要地。" },
      { id: "taiyuan", name: "太原", lon: 112.55, lat: 37.87, kind: "city", label: true, coordAccuracy: "approx", note: "河东重镇；979 年后归北宋。" },
      { id: "luoyang", name: "洛阳", lon: 112.45, lat: 34.62, kind: "city", label: false, coordAccuracy: "approx", note: "北宋西京河南府。" },
      { id: "changan", name: "长安", lon: 108.94, lat: 34.34, kind: "city", label: false, coordAccuracy: "approx", note: "北宋京兆府。" },
      { id: "xiazhou", name: "夏州", lon: 108.85, lat: 37.99, kind: "city", label: true, coordAccuracy: "approx", note: "定难军（党项）核心。" },
      { id: "lingzhou", name: "灵州", lon: 106.23, lat: 38.10, kind: "city", label: true, coordAccuracy: "approx", note: "党项李继迁 1002 年攻取，后为西平府。" },
      { id: "xiongzhou", name: "雄州（瓦桥关）", lon: 116.00, lat: 39.00, kind: "pass", label: true, coordAccuracy: "approx", note: "宋辽边界关隘；今河北雄县。" },
      { id: "mozhou", name: "莫州", lon: 116.10, lat: 38.70, kind: "city", label: false, coordAccuracy: "approx", note: "宋辽边界州；今河北任丘一带。" },
      { id: "cangzhou", name: "沧州", lon: 116.84, lat: 38.30, kind: "city", label: false, coordAccuracy: "approx", note: "河北东路沿边州。" }
    ]
  },

  routes: [
    {
      id: "r-liao", name: "辽军南下", color: "#78acd8", side: "liao",
      nodes: [
        { id: "yanjing", name: "燕京", lon: 116.40, lat: 39.90, label: true, eventId: "e01" },
        { id: "yingzhou", name: "瀛州", lon: 116.00, lat: 38.40, label: true, eventId: "e02" },
        { id: "chanzhou", name: "澶州", lon: 115.00, lat: 35.70, label: true }
      ]
    },
    {
      id: "r-song", name: "真宗亲征", color: "#d4553b", side: "song",
      nodes: [
        { id: "bianjing", name: "汴京", lon: 114.31, lat: 34.80, label: true },
        { id: "chanzhou", name: "澶州", lon: 115.00, lat: 35.70, label: true, eventId: "e03" }
      ]
    }
  ],

  events: [
    {
      id: "e01", order: 1, date: "1004年9月", shortDate: "1004.9", title: "辽军南下",
      kind: "war",
      battle: { preset: "cavalry", terrain: "hebei", sides: [{ id: "liao", name: "辽", color: "#6f8399", short: "辽" }, { id: "song", name: "北宋", color: "#b05a3c", short: "宋" }] },
      place: "燕京（今北京）", regionId: "liao", routeId: "r-liao", nodeId: "yanjing",
      lon: 116.40, lat: 39.90,
      summary: "1004年秋，辽圣宗与萧太后率军南下，宋辽战事再起。辽军绕过宋军坚固城防，一路南进，直逼黄河沿岸的澶州；北宋朝廷震动，真宗面临和战抉择，这是澶渊之盟的直接背景。",
      detail: [
        "1004年闰九月，辽圣宗耶律隆绪与萧太后率军南下攻宋。",
        "辽军避开宋军坚守的城池，快速南进，力图逼迫宋廷议和或迁都。",
        "宋廷内部出现迁都避战与亲征抵抗两种主张，真宗犹豫不决。",
        "辽军进抵澶州附近，黄河防线告急，北宋朝廷震动。"
      ],
      figures: ["辽圣宗", "萧太后", "宋真宗"],
      result: "辽军南下，宋辽战事再起。",
      impact: "河北告急，宋廷在亲征与议和之间摇摆。",
      ask: { q: "辽军南下的直接目的是什么？", a: "以军事压力迫使北宋让步，取得岁币与边界利益；辽军并不以长期占领中原为目标。" },
      image: { file: "assets/events/song/e01.jpg", alt: "辽军骑兵越过北方平原南下的艺术复原示意。", promptId: "song-e01", credit: "AI 艺术复原示意" },
      focus: { dist: 22, az: 8, polar: 48 },
      historiography: { level: "consensus", note: "辽军南下的战略目标有不同解释；教材以“宋辽战事再起、直逼澶州”为要点。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第9课 两宋的政治和军事", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：澶渊之盟的背景与宋辽关系。" },
        { title: "宋史", author: "脱脱等", publisher: "中华书局", year: "1977", locator: "真宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "圣宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对辽侧记载。" },
        { title: "续资治通鉴长编", author: "李焘", publisher: "中华书局", year: "2004", locator: "景德元年条", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；北宋一方编年史料。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：辽军南下的时间、路线与战略目的。"
    },
    {
      id: "e02", order: 2, date: "1004年11月", shortDate: "1004.11", title: "瀛州之战",
      kind: "war",
      battle: { preset: "siege", terrain: "hebei", sides: [{ id: "liao", name: "辽", color: "#6f8399", short: "辽" }, { id: "song", name: "北宋", color: "#b05a3c", short: "宋" }] },
      place: "瀛州（今河北河间）", regionId: "song", routeId: "r-liao", nodeId: "yingzhou",
      lon: 116.00, lat: 38.40,
      summary: "1004年十一月，辽军进攻瀛州，宋知州李延渥率军民坚守，辽军攻城十余日不下，伤亡较重。瀛州之战迟滞了辽军南下，但未能改变整体战局；辽军随后绕过瀛州继续南进。",
      detail: [
        "辽军南下后进攻瀛州，试图打开河北通道。",
        "宋知州李延渥组织军民坚守，辽军昼夜攻城，伤亡较大。",
        "瀛州久攻不下，辽军被迫绕过，继续向澶州方向南进。",
        "此战显示宋军城防仍有一定韧性，但未能改变战略被动。"
      ],
      figures: ["辽圣宗", "萧太后", "瀛州守将"],
      result: "辽军攻瀛州十余日不下，绕过瀛州继续南进。",
      impact: "战事胶着，为澶州对峙争取时间。",
      ask: { q: "瀛州之战的结果如何？", a: "宋军坚守瀛州，辽军攻城十余日不下、伤亡较重，随后绕过瀛州继续南进；战事仍未决出胜负。" },
      image: { file: "assets/events/song/e02.jpg", alt: "瀛州城墙攻防、宋军坚守的艺术复原示意。", promptId: "song-e02", credit: "AI 艺术复原示意" },
      focus: { dist: 18, az: 12, polar: 50 },
      historiography: { level: "consensus", note: "辽军攻瀛州的具体伤亡数字各书不一，教材未给出精确数字；“坚守”为共识。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第9课 两宋的政治和军事", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "宋史", author: "脱脱等", publisher: "中华书局", year: "1977", locator: "真宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "圣宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对辽侧记载。" },
        { title: "续资治通鉴长编", author: "李焘", publisher: "中华书局", year: "2004", locator: "景德元年条", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；北宋一方编年史料。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：瀛州之战的时间、守将李延渥的记载。"
    },
    {
      id: "e03", order: 3, date: "1004年12月", shortDate: "1004.12", title: "澶州亲征",
      kind: "war",
      battle: { preset: "river", terrain: "huainan", sides: [{ id: "song", name: "北宋", color: "#b05a3c", short: "宋" }, { id: "liao", name: "辽", color: "#6f8399", short: "辽" }] },
      place: "澶州（今河南濮阳一带）", regionId: "song", routeId: "r-song", nodeId: "chanzhou",
      lon: 115.00, lat: 35.70,
      summary: "1004年十二月，宋真宗在寇准等人力劝下亲征澶州，渡过黄河登上北城门楼，宋军士气大振。真宗亲征为宋辽议和提供了军事与政治筹码；辽军孤军深入，也面临补给与退路压力。",
      detail: [
        "辽军进逼澶州，宋廷内部迁都之议再起；寇准力主真宗亲征。",
        "1004年十二月，真宗抵达澶州，渡过黄河，登上北城门楼。",
        "宋军见皇帝亲临，士气大振；辽军前锋受挫。",
        "真宗亲征增强了宋方议和地位，但宋廷仍以尽快结束战争为目标。"
      ],
      figures: ["宋真宗", "寇准", "辽军将领"],
      result: "宋真宗亲征澶州，宋军士气大振。",
      impact: "宋辽进入议和窗口。",
      ask: { q: "宋真宗亲征对澶渊之盟有什么影响？", a: "亲征提振了宋军士气，使宋方在议和中不至于完全被动；但真宗与部分大臣仍倾向求和，最终以岁币换取和平。" },
      image: { file: "assets/events/song/e03.jpg", alt: "宋真宗亲征澶州、黄河渡口营帐与军阵的艺术复原示意。", promptId: "song-e03", credit: "AI 艺术复原示意" },
      vr: {
        pano: "assets/vr/song/e03.jpg",
        hotspots: [
          { x: 0.50, y: 0.52, label: "澶州城楼", text: "1004 年冬，宋真宗亲临澶州，提振宋军士气。城楼为艺术复原示意。" },
          { x: 0.23, y: 0.56, label: "黄河浮桥", text: "黄河渡口与浮桥连接两岸，画面不代表精确历史水道与桥位。" },
          { x: 0.84, y: 0.54, label: "宋军阵列", text: "宋军驻守河岸；兵力、甲胄细节与阵型为教学情景示意。" }
        ]
      },
      focus: { dist: 18, az: -8, polar: 50 },
      historiography: { level: "consensus", note: "真宗亲征的具体日期与渡河细节各书略有差异；寇准力主亲征为教材共识。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第9课 两宋的政治和军事", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径。" },
        { title: "宋史", author: "脱脱等", publisher: "中华书局", year: "1977", locator: "真宗本纪、寇准传", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "续资治通鉴长编", author: "李焘", publisher: "中华书局", year: "2004", locator: "景德元年条", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；北宋一方编年史料。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：真宗亲征的日期、寇准与议和派的分歧。"
    },
    {
      id: "e04", order: 4, date: "1005年1月", shortDate: "1005.1", title: "澶渊之盟",
      kind: "diplomacy",
      place: "澶州", regionId: "song", routeId: "r-song", nodeId: "chanzhou",
      lon: 115.00, lat: 35.70,
      summary: "1005年一月，宋辽在澶州订立盟约：约为兄弟之国，宋每年给辽银十万两、绢二十万匹，双方以白沟河为界。此后宋辽边境相对安定，榷场贸易发展；岁币也加重了北宋财政负担，评价应并陈和平红利与财政代价。",
      detail: [
        "1005年一月，宋辽在澶州议和，史称澶渊之盟。",
        "盟约规定：约为兄弟之国，宋每年给辽银十万两、绢二十万匹。",
        "双方以白沟河为界，撤兵，禁止越界侵扰，开放榷场贸易。",
        "此后宋辽边境长期相对安定，但岁币成为北宋财政负担。",
        "对澶渊之盟的评价应避免简单化为“屈辱”或“胜利”，要兼顾和平红利与财政代价。"
      ],
      figures: ["宋真宗", "寇准", "辽圣宗", "萧太后"],
      result: "宋辽约为兄弟之国，宋给岁币，以白沟河为界。",
      impact: "边境相对安定、榷场贸易发展，但岁币加重北宋财政负担。",
      ask: { q: "澶渊之盟的内容和影响是什么？", a: "宋辽约为兄弟之国，宋给辽岁币银十万两、绢二十万匹，以白沟河为界；此后边境相对安定、榷场贸易发展，但岁币加重了北宋财政负担。" },
      image: { file: "assets/events/song/e04.jpg", alt: "宋辽使者在澶州议和帐篷中对坐的艺术复原示意。", promptId: "song-e04", credit: "AI 艺术复原示意" },
      focus: { dist: 24, az: 0, polar: 46 },
      historiography: { level: "consensus", note: "盟约条款为教材共识；对影响的评价有不同侧重：一种强调和平与交融，一种强调岁币负担与北宋积贫。课堂应并陈。" },
      sources: [
        { title: "中外历史纲要（上）", author: "教育部组织编写", publisher: "人民教育出版社", year: "2019", locator: "第9课 两宋的政治和军事", url: "", accessed: "2026-10-23", confidence: "high", note: "教学口径：澶渊之盟的内容与影响。" },
        { title: "宋史", author: "脱脱等", publisher: "中华书局", year: "1977", locator: "真宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；未逐页核对。" },
        { title: "辽史", author: "脱脱等", publisher: "中华书局", year: "1974", locator: "圣宗本纪", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；用于核对辽侧记载。" },
        { title: "续资治通鉴长编", author: "李焘", publisher: "中华书局", year: "2004", locator: "景德元年至二年条", url: "", accessed: "2026-10-23", confidence: "medium", note: "中华书局点校本；北宋一方编年史料。" }
      ],
      status: "sourced",
      reviewNote: "待耿雨审核：岁币数额、白沟河边界、盟约称谓与影响评价。"
    }
  ],

  timeline: {
    start: "1004",
    end: "1005",
    ticks: [
      { at: "1004.9", label: "辽军南下", eventId: "e01" },
      { at: "1004.11", label: "瀛州之战", eventId: "e02" },
      { at: "1004.12", label: "澶州亲征", eventId: "e03" },
      { at: "1005.1", label: "澶渊之盟", eventId: "e04" }
    ]
  },

  credits: {
    mapSources: [
      "《中外历史纲要（上）》第9课（教育部组织编写，人民教育出版社 2019 年版）——教学口径",
      "《中国历史地图集》第六册（谭其骧主编，中国地图出版社 1982 年版）——宋辽金形势核对参考，未复制图幅",
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
        what: "中国历史地图在线检索；站点当前展示春秋、战国、明朝，未用于宋辽边界核对",
        license: "站点声明数据据《中国历史地图集》矢量化；二次分发许可未确认；未复制",
        accessed: "2026-10-23" },
      { id: "src-txlzp", name: "txlzp 历史地图", url: "http://www.txlzp.com/lishi/", usage: "reference",
        what: "静态地图素材（计划参考）",
        license: "2026-10-23 访问超时（504），授权未确认；未使用",
        accessed: "2026-10-23" },
      { id: "src-tanqixiang", name: "《中国历史地图集》第六册", url: "", usage: "reference",
        what: "宋辽金形势核对依据；只作文字核对，未复制图幅",
        license: "核对参考，未复制图幅；图集版权归原编者/出版者",
        accessed: "2026-10-23" },
      { id: "src-textbook", name: "《中外历史纲要（上）》", url: "", usage: "reference",
        what: "第9课教学口径与事件分期",
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
