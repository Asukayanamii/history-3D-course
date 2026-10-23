# 02 · DeepSeek 提示词：史料、地图与数据包

> 用法：把本文件全文作为任务说明。你可以读写仓库时，直接写指定文件；只能输出文本时，按文件名输出完整内容，由人保存。不要改引擎代码。
>
> **v0.2 更新（2026-10-23）**：以 `docs/聊天记录整理.md` 为准，新增真实疆域分层（五代十国至少 6 个主要政权简化多边形）、`figures/result/impact`、`scene.text`。完整修订见 `docs/需求修订_v0.2.md`。

---

## 角色

你是中国史研究方向的研究助理 + 数据编辑。你的任务不是写代码，而是为「三维历史沙盘」Demo 提供**可核验、可追溯、能直接落进数据文件**的史料、地图、路线、问答和图片脚本。

## 任务

为三个历史时期补全数据，重点是**五代十国**：

| 主题 | ID | 事件数 | 定位 |
|---|---|---|---|
| 五代十国 | `wudai` | 10 个（可微调，必须说明） | **重点**，最完整 |
| 隋唐（安史之乱） | `suitang` | 6 个左右 | 薄主题，证明切换 |
| 宋朝（澶渊之盟） | `song` | 4 个左右 | 薄主题，证明切换 |

目标不是写论文，而是给中学历史课堂提供**准确、简洁、有来源**的讲解材料。Demo 阶段允许薄，但不允许编造。

## 先读

- `docs/需求文档.md`（教学目标与验收）
- `docs/可能有用的历史资源网站.txt`
- `docs/资源来源推测.md`（template 的 DEM/底图/河流/插画/音效/代码来源推测，用作选源方法参考；**是推测，不是授权证明**）
- `docs/prompts/00_协作总览与数据契约.md`（**数据 schema、来源规则、状态语义**）
- `docs/需求修订_v0.2.md`（真实疆域、结构化人物、场景契约）
- `docs/prompts/01_Claude_沙盘骨架.md`（第一轮骨架事实、事件 ID、路线节点命名）
- `course/data/theme.wudai.js`、`theme.suitang.js`、`theme.song.js`（Claude 的占位数据，保留结构，替换内容）
- `course/data/assets.js`（图片路径与 promptId，不要改结构）

## 一、硬性规则

### 1. 史实

- 以统编高中历史教材《中外历史纲要（上）》为教学口径；学术分歧要标注，不要把争议写成定论。
- 区分四类：`consensus`（教材共识）、`debate`（学界争议）、`tradition`（后世传说/文学叙述）、`uncertain`（存疑）。
- 不编造引文、对话、数字、页码、URL、DOI。不能核实就改写为概括，或在 `note` 写“待核实”。
- 不使用与当代政治相关的类比；不做道德审判；战争叙述保持克制。
- 人物只写历史角色与行动，不写虚构心理活动。

### 2. 来源与许可（谁取用谁核实）

- **用了别人的网站、地图、史料，就要标来源**；AI 生成的图片不需要你逐张标来源，主页会统一声明。
- 外部网站/地图：每个站点记录名称、URL、覆盖时期、参考了哪个图幅/页面、访问日期、许可结论。
- **许可由你（实际取用者）自行核实**：查站点条款、署名要求、是否允许教学使用/二次分发。不要写“待耿雨核实许可”，耿雨只负责史实审核。
- 无法确认许可的资源：**不要使用**；在 `docs/history/来源与许可核查.md` 写「授权未确认，未使用」。
- 不直接把网站地图图片嵌入数据文件；最多用文字描述边界走向，或提供**自行简化的示意多边形**。
- 引用《中国历史地图集》（谭其骧主编）只作为核对依据，不复制图幅；在 `credits.mapSources` 注明“参考”。

### 3. 数据

- 严格保留 `00_协作总览与数据契约.md` 第 5 节的字段名和结构；不要改引擎、不要改 CSS/HTML。
- 事件 ID 固定为 `e01`…；不要随意增删。确需增加，必须在 `docs/history/审核清单.md` 里列出，并同步说明 `assets.js` 需要新增的条目。
- `routeId` / `nodeId` 必须能解析；所有坐标必须在 `map.bounds` 内。
- 不确定的势力边界用 `polygon: []` + `radiusKm`，不要为了“看起来完整”编造精确边界。
- **五代十国至少 6 个主要政权**（后周、南唐、吴越、后蜀、南汉、契丹）提供简化多边形；其他政权可用小多边形或 blob；所有多边形标 `approx`，并在 `sourceNote` 写“参考公开历史地图示意简化”。
- **每个事件补 `figures` / `result` / `impact`**；有 `scene` 的事件必须补 `scene.text`（时间/地点/人物/结果/影响），且与事件字段一致。
- **地图快照/未单列/重点理由**：`map.mapSnapshot`、`map.omitted`、`regions[].highlightReason` 必须填写；不要只写“重点”。
- 每个事件至少 1 个来源；关键事件建议 2 个以上。来源可以是教材、专著、权威百科、博物馆/大学页面。
- 所有状态：`meta.status` / `events[].status` 用 `sourced`（有来源待史实审核），不要用 `reviewed`（只有耿雨能改）。
- `credits.sourceRecords` 必须包含你实际参考过的外部网站/图集；`credits.imageNote` 保留统一的 AI 声明。

## 二、交付物

### A. 三个主题数据文件（覆盖 Claude 的占位文件）

1. `course/data/theme.wudai.js` — 五代十国，10 个事件，重点。
2. `course/data/theme.suitang.js` — 隋唐·安史之乱，6 个事件。
3. `course/data/theme.song.js` — 宋朝·澶渊之盟，4 个事件。

要求：

- 完整 JS 文件，以 `window.HISTORY_THEMES = window.HISTORY_THEMES || {};` 开头。
- 不要 Markdown 代码围栏，不要省略号，不要 `TODO` 占位（确实存疑的字段用 `note` 说明）。
- 保留 Claude 的 `routes` / `nodes` 结构；可以修正节点坐标、增补节点，但不要改 ID 命名风格。
- `meta.status` 全部 `sourced`；`events[].status` 全部 `sourced`；`regions[].status` 用 `approx` 或 `placeholder`。
- `credits.sourceRecords` 按 schema 填写；`credits.mapSources` 用简洁文字列表。

### B. 史料文档

4. `docs/history/五代十国_资料包.md`
   - 时间线（907–960，含五代更迭与十国大势）
   - 10 个事件的：标题、时间、地点、关键人物、背景、经过、结果/影响、课堂提问与答案、常见误解
   - 每个事件的来源（与 JS 中 `sources` 对应）
   - 史实争议与慎用表述
5. `docs/history/五代十国_地图说明.md`
   - 明确地图快照年份（例如 955 年）与选择理由
   - 该年份实际存在的政权/势力；哪些“十国”已亡或已被吞并，不要为了凑数保留
   - 每个政权的控制区描述、关键城市/关隘、边界走向
   - 路线节点与事件对应表
   - 参考图幅/网站与许可结论
6. `docs/history/五代十国_图片脚本.md`
   - 给 GPT-Image2 的逐事件图片 brief（格式见第四节）
7. `docs/history/隋唐_宋朝_资料包.md`
   - 两个薄主题的时间线、事件、来源、地图说明、图片 brief
8. `docs/history/来源与许可核查.md`
   - 逐站点：名称、URL、覆盖时期、参考内容、访问日期、许可结论、是否落地
   - 明确写“谁核实、何时核实”；不要把许可判断推给耿雨
9. `docs/history/审核清单.md`
   - 你改了哪些字段/坐标/事件
   - 哪些史实待耿雨审核
   - 哪些来源/许可无法确认、因此没有使用
   - 哪些图片 brief 需要 GPT-Image2 注意历史细节

## 三、数据 schema 要点

完整 schema 见 `00_协作总览与数据契约.md` 第 5 节。最低限度保留：

```js
window.HISTORY_THEMES = window.HISTORY_THEMES || {};

window.HISTORY_THEMES.wudai = {
  schemaVersion: "1.0.0",
  meta: {
    id: "wudai", order: 1, tabLabel: "五代十国",
    title: "五代十国", subtitle: "907—979 · 分裂与重组",
    periodLabel: "后周世宗时期（约 955 年）",
    defaultEventId: "e01", accent: "#c8402f",
    status: "sourced",
    sourceNote: "……", licenseNote: "……",
    cover: "assets/ui/cover-wudai.jpg",
    home: { dist: 42, az: 0, polar: 48 }
  },
  map: {
    projection: "equirect",
    bounds: { west: 100, east: 123, south: 21, north: 43 },
    relief: { mode: "stylized", amplitude: 1.0, texture: "" },
    regions: [ /* 每个政权：id/name/color/opacity/highlight/labelAt/labelSize/radiusKm/polygon/status/sourceNote */ ],
    rivers: [ /* id/name/color/pts/labelAt/status */ ],
    places: [ /* id/name/lon/lat/kind/label/coordAccuracy/note */ ]
  },
  routes: [ /* id/name/color/side/nodes[{id,name,lon,lat,label,eventId}] */ ],
  events: [ /* id/order/date/shortDate/title/place/regionId/routeId/nodeId/lon/lat/summary/detail/ask/image/focus/historiography/sources/status/reviewNote */ ],
  timeline: { start: "907", end: "960", ticks: [ /* at/label/eventId */ ] },
  credits: {
    mapSources: [ /* 文字列表 */ ],
    sourceRecords: [ /* id/name/url/usage/what/license/accessed */ ],
    imageNote: "插画与封面为 AI 生成的艺术复原示意，不是历史影像。",
    codeLicense: "Three.js r147 (MIT)"
  }
};
```

### 3.1 来源对象

```js
sources: [
  {
    title: "中外历史纲要（上）",
    author: "教育部组织编写",
    publisher: "人民教育出版社",
    year: "2019",
    locator: "第X课",           // 能核实才写具体页码
    url: "",                    // 没核实就留空
    accessed: "2026-10-23",
    confidence: "high",         // high | medium | low
    note: "教材口径"
  }
]
```

### 3.2 来源记录

```js
sourceRecords: [
  {
    id: "src-historiqly",
    name: "Historiqly",
    url: "https://map.historiqly.com/zh/",
    usage: "reference",          // reference | image | data
    what: "五代十国疆域切换与配色参考",
    license: "站点条款未确认；仅参考，未复制图幅",
    accessed: "2026-10-23"
  }
]
```

### 3.3 事件对象

```js
{
  id: "e01",
  order: 1,
  date: "907年",
  shortDate: "907",
  title: "后梁代唐",
  place: "汴州（今河南开封）",
  regionId: "",                  // 快照地图上没有的政权留空
  routeId: "r-capitals",
  nodeId: "bianzhou-907",
  lon: 114.31, lat: 34.80,
  summary: "80–120 字，课堂可直接念",
  detail: ["3–5 条，每条 30–80 字", "……", "……"],
  figures: ["主要人物/角色", "……"],
  result: "结果，1–2 句",
  impact: "影响，1–2 句",
  scene: null,                    // 只有需要 3D 场景的事件才写对象；见 00 契约 5.4
  ask: { q: "……", a: "……" },
  image: {
    file: "assets/events/wudai/e01.jpg",
    alt: "……",
    promptId: "wudai-e01",
    credit: "AI 艺术复原示意"
  },
  focus: { dist: 26, az: 15, polar: 52 },
  historiography: { level: "consensus", note: "" },
  sources: [ /* 至少 1 条 */ ],
  status: "sourced",
  reviewNote: ""
}
```

## 四、图片 brief 格式（给 GPT-Image2）

每个需要配图的事件写一条。不要写“请生成一张图”这种空话，要给可执行的画面信息。

```md
### wudai-e01 · 后梁代唐

- 优先级：P0
- 事件：907 年，朱温废唐哀帝，建立后梁，定都汴州。
- 画面时刻：清晨，汴州城门开，梁军入城，唐旗降下；人群在远处，不聚焦个体面孔。
- 地点/季节/时间：中原，秋末，清晨薄雾。
- 人物：甲士、官吏、远处百姓；只写角色，不写真实人物长相。
- 构图：低机位广角，城门在左中景，队伍向画面深处延伸；右侧留出雾气和天空，便于卡片裁切。
- 光线/色调：冷青灰晨光 + 少量朱砂旗帜；矿物颜料，低饱和。
- 历史锚点：晚唐/五代礼甲、幞头、圆领袍、城门形制；不要清代官服、日本武士甲、欧洲骑士。
- 避免：文字、旗帜上的可读字样、现代物件、血腥、真实人物肖像、动漫/3D 渲染。
- alt：后梁军队进入汴州城的艺术复原示意。
```

**重点**：图片里不要出现任何可读文字、地图标注、诏书文字；所有文字由引擎渲染。不要把 AI 图说成历史照片。

## 五、三个主题的内容建议

> 这些是骨架，不是最终答案。你要核对、修正、补充来源。事件 ID 和路线节点尽量沿用 Claude 的占位数据，方便引擎直接替换。

### 5.1 五代十国（重点）

- 时间范围：907–960（可延伸到 979 北汉灭亡，但 Demo 主线到 960）。
- 10 个事件建议：后梁代唐、后唐灭梁、割让燕云、契丹灭晋/后汉建立、后周建立、高平之战、三征南唐、北伐契丹、柴荣病逝、陈桥兵变。
- 地图快照：**必须明确一个年份**（如 955 年），核对当年实际存在的政权。注意：楚、闽等在 955 年前后已亡或已被吞并，不要为了凑“十国”保留已亡政权。可以展示后周、南唐、吴越、后蜀、南汉、荆南、北汉、契丹，以及实际存在的地方势力；在 `地图说明.md` 解释取舍。
- **多边形**：至少后周、南唐、吴越、后蜀、南汉、契丹 6 个主要政权提供简化多边形；其他政权可用小多边形或 blob。不要复制图幅，只按公开历史地图示意简化。
- **结构化人物**：10 个事件都补 `figures/result/impact`；不要只写在 `detail` 里。
- **场景**：`e06 高平之战` 保留 `scene`，并补 `scene.text`；如果要做第二个场景，先在审核清单说明，不要改 schema。
- 三条路线：`r-capitals`（五代更迭）、`r-north`（高平—北伐）、`r-south`（三征南唐）。节点沿用 Claude 的命名，坐标可修正。
- 关键来源：教材；《旧五代史》《新五代史》《资治通鉴》；《中国历史地图集》；中国大百科全书；博物馆/大学页面。
- 重点讲清：五代十国是唐末藩镇割据的延续；北方政权更迭频繁；南方相对稳定；后周改革为北宋统一奠定基础；陈桥兵变建立北宋。

### 5.2 隋唐（安史之乱）

- 6 个事件：范阳起兵、洛阳失守、潼关失守、长安陷落/马嵬驿、灵武即位、收复两京（可把 763 年结束写入最后一条）。
- 两条路线：`r-rebel`（范阳→洛阳→潼关→长安）、`r-tang`（灵武→香积寺→洛阳）。
- 势力：唐廷、燕（安禄山）、回纥、吐蕃；边界用示意多边形或 blob。
- 重点讲清：安史之乱是唐由盛转衰的转折；藩镇割据、财政与人口变化；不要展开成完整唐史。

### 5.3 宋朝（澶渊之盟）

- 4 个事件：辽军南下、瀛州之战、澶州亲征、澶渊之盟。
- 两条路线：`r-liao`（燕京→瀛州→澶州）、`r-song`（汴京→澶州）。
- 势力：北宋、辽、西夏；边界用示意多边形或 blob。
- 重点讲清：澶渊之盟的背景、内容、影响；宋辽关系由战转和；岁币与榷场；不要写成简单的“屈辱”或“胜利”。

## 六、地图与边界规则

1. **先定快照年份**，再画势力。不要在同一张图上混合不同年份的政权。
2. 每个政权写：`name`、`labelAt`、`radiusKm`、`polygon`、`status`、`sourceNote`。
3. 能提供 polygon 最好：12–30 个点、顺时针、不自交、在 bounds 内。否则留空，用 `radiusKm`。
4. 不要画现代国界、省界、海岸线精度不需要很高。
5. 河流 3–6 条即可：黄河、长江、淮河、渭水/洛水等；8–20 个点，标 `approx`。
6. 地名 15–25 个：首都、陪都、关卡、战场、渡口；`kind` 用 `capital/city/pass/battlefield/camp/post`。
7. 所有坐标保留 2 位小数；在 `地图说明.md` 里说明“示意坐标，非精确考古定位”。

## 七、来源与许可核查

`docs/history/来源与许可核查.md` 至少包含：

| 站点/文献 | URL | 覆盖时期 | 参考内容 | 访问日期 | 许可结论 | 是否落地 |
|---|---|---|---|---|---|---|
| Historiqly | https://map.historiqly.com/zh/ | 多时期 | 疆域切换逻辑/配色 | 2026-10-23 | 仅参考，未复制图幅 | 否 |
| wowhistorymap | https://www.wowhistorymap.com/ | 多时期 | 地图核对 | 2026-10-23 | 仅参考 | 否 |
| historiamap | https://www.historiamap.com/ | 多朝代 | 地图核对 | 2026-10-23 | 仅参考 | 否 |
| txlzp | http://www.txlzp.com/lishi/ | 多朝代 | 静态图参考 | 2026-10-23 | 授权未确认，未使用 | 否 |
| 中国历史地图集 | — | 多时期 | 边界核对 | 2026-10-23 | 仅核对，不复制图幅 | 否 |

- 如果你实际使用了一个允许教学使用的图片/数据，写清作者、许可、访问日期；否则不要落地。
- 不要把“来源待核实”当作可用素材；无法确认就不使用。
- 不要把许可判断写成“待耿雨确认”；耿雨只审史实。

### 7.1 资源类型与候选来源（参考 `docs/资源来源推测.md`）

| 资源类型 | 文档中的判断 | 可参考来源 | 本项目 Demo 是否落地 |
|---|---|---|---|
| 高程 DEM | template 用真实全球 DEM，经 XYZ 瓦片管线重采样；400×391，约 100–118°E / 23.5–38.5°N | SRTM 90m/30m、Copernicus DEM、GMTED2010、ETOPO1、Terrarium/Mapbox Terrain-RGB | **不落地**；后续 M4 再替换 |
| 地形纹理 | 无标签晕渲底图或高分辨率 DEM 自渲染 | Stamen Terrain Background（Stadia）、Esri World Shaded Relief/Physical Map、Mapbox 地形样式、自渲染 | **不落地**；Demo 用程序化沙盘 |
| 河流 | 公开矢量河网或 DEM 提取，人工筛选命名 | Natural Earth 10m rivers（public domain）、HydroSHEDS/HydroRIVERS、DEM 提取 | 可用示意折线，标 `approx` 和来源 |
| 事件插画/全景 | AI 生成，具体模型不可考 | GPT-Image2；VR 本轮不做 | 插画落地；主页统一 AI 声明 |
| 音效 | Web Audio 实时合成，无外部素材 | 本项目同样合成 | 可选落地；无版权素材 |
| 代码库 | Three.js r147 + OrbitControls，MIT | template 的 `lib/` | 落地；保留 MIT 版权头 |
| 历史地图 | 第三方历史地图站点 | Historiqly、wowhistorymap、historiamap、txlzp；《中国历史地图集》核对 | 仅参考，不复制图幅 |

补充：

- `docs/资源来源推测.md` 的结论是**来源推测**，不是授权证明。引用时写“参考”，不要写“已证实”。
- template 的 `terrain.js` 覆盖范围约 100–118°E / 23.5–38.5°N，**覆盖不了**本项目五代十国地图的 100–123°E / 21–43°N；不要直接复用。
- Demo 阶段不落地外部 DEM/底图；后续若替换，由实际取用者核实许可并写入 `credits.sourceRecords`。
- 如果后续要接真实 DEM，可参考文档里的 XYZ 瓦片 + 重采样思路，但需要重新选范围、选产品、查许可，不能拿 template 的数据当授权来源。

## 八、自检

写完后逐条检查：

1. 三个 JS 文件能被浏览器直接加载，无语法错误。
2. 所有 `routeId` / `nodeId` 都能解析；所有事件坐标在 `bounds` 内。
3. `events[].order` 连续；`defaultEventId` 存在。
4. 每个事件至少 1 个 `sources`；关键事件 2 个以上。
5. `credits.sourceRecords` 包含实际参考过的外部站点；许可结论明确。
6. 没有编造的 URL、页码、引文、统计数字；不确定的写在 `note`。
7. 五代十国 10 个事件、隋唐 6 个、宋朝 4 个；如增删，已在审核清单说明。
8. 图片 brief 覆盖所有需要配图的事件；有 alt、构图、历史锚点、避免项。
9. 没有修改引擎代码、CSS、HTML、`assets.js` 结构。
10. 没有把 AI 图片写成历史影像；没有把示意边界写成精确疆域。
11. 五代十国至少 6 个主要政权有简化多边形；所有多边形在 bounds 内、无自交、标 `approx`。
12. `map.mapSnapshot`、`map.omitted`、`regions[].highlightReason` 已填写。
13. 五代十国 10 个事件都有 `figures/result/impact`；缺失的只在审核清单说明。
14. `e06.scene.text` 与事件 `figures/result/impact` 一致；场景文字有来源/不确定性说明。

## 九、输出格式

- 能写文件：直接写入上述路径，覆盖 Claude 的占位 `theme.*.js`；写完后用简短清单汇报改了哪些文件。
- 不能写文件：按文件名逐个输出**完整内容**，不要省略、不要“其余同上”。如果单次输出受限，分多条消息，每条以文件名开头。
- 汇报时列出：事件数、来源数、无法确认许可的资源、待耿雨审核的史实点、需要 GPT-Image2 优先做的图。

## 十、禁止事项

- 不改引擎代码、CSS、HTML、`assets.js` 结构。
- 不编造史料、引文、URL、页码、统计数字。
- 不把学界争议写成定论；不把传说写成史实。
- 不直接嵌入来源不明的地图图片；不复制《中国历史地图集》图幅。
- 不把许可核实推给耿雨；谁取用谁核实。
- 不把 AI 图片标成历史影像；不要求逐图来源标注（主页统一声明即可）。
- 不为了“凑十国”保留已亡政权；不为了好看画精确边界。
