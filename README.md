# 史境 · 三维历史沙盘

面向中学历史课堂的离线优先三维课件 Demo。使用原生 HTML / CSS / JavaScript 与本地 Three.js r147，双击 `course/index.html` 即可运行；不需要联网、npm、CDN、构建步骤或 ES Module。

> 当前版本：`v0.5.0-demo`（2026-10-23）
>
> 课件入口：`course/index.html`
>
> 默认时期：五代十国；顶栏 `1 / 2 / 3` 可切换隋唐、五代十国、宋朝。

## 快速开始

1. 用 Chrome 或 Edge 打开 `course/index.html`。
2. 首屏选择时期，或点「开始探索」进入默认的五代十国。
3. 用 `→ / ←`、底部时间轴或事件卡片切换事件。
4. 战争 / 朝堂事件可点卡片上的「进入场景」，或按 `E`。
5. 场景内：拖动旋转、滚轮缩放、`Space` 暂停、`1/2/3` 调速、`R` 重播、`Esc` 返回；`V` 进入 360° 环视。

> 整个 `course/` 目录需要一起拷贝（`js/`、`data/`、`css/`、`assets/` 缺一不可），不要只拷 `index.html`。

## 当前能力

- **真实 DEM 主沙盘**：Mapzen / Joerd Terrain Tiles 派生高程，含海陆、海岸、等高线；垂直夸张用于课堂可视化。
- **三个时期、21 个事件**：隋唐（安史之乱）6 个、五代十国 11 个、宋朝（澶渊之盟）4 个。
- **省域兵棋**：`wudai/e06 高平之战`，9 个省份、单位兵力/士气、省份控制、派生战线；终局后周 7 省、北汉/辽各 1 省。
- **通用战场**：其余战争事件自动生成 `battle` 场景；支持 `field / siege / cavalry / ambush / river` 五种预设。
- **战场信息层（v0.5）**：每个单位头顶阵营短名 + 单位名 + 状态 + 兵/气条；默认 20×16 占地网格，按最近单位 + 捕获半径着色；图层面板可开关「占地网格 / 单位 / 名字」。
- **朝堂议政**：`wudai/e11 世宗改革`；柴荣、王溥、范质、李谷、赵匡胤与御史（角色待核订）；发言者头顶「姓名 · 官职」名牌与脚下/御座前金色光环，非发言者弱化。
- **360° 环视**：每个事件有 2:1 全景示意、热点与自动巡游；当前画面是插画扩展全景，不是全景摄影。
- **地图微缩情景**：当前事件为战争时出现小人编队，为改革时出现小朝堂。
- **来源与授权**：地图、DEM、史料、代码许可与 AI 声明集中在「来源与授权」弹窗。

## 三个时期

| 时期 | 事件数 | 场景 |
|---|---:|---|
| 隋唐（安史之乱） | 6 | 5 个 `battle` |
| 五代十国 | 11 | `e06 war` + `e11 court` + 4 个 `battle` |
| 宋朝（澶渊之盟） | 4 | 3 个 `battle` |

政治 / 外交事件没有强制 3D 场景时，卡片会显示禁用按钮，不伪造场景。

## 仓库结构

```text
.
├─ course/              可直接运行的课件
│  ├─ index.html        入口
│  ├─ README.md         课件使用、数据字段、替换资源说明
│  ├─ js/               引擎：dem / figures / scene / ui / map / route / vr360 / main
│  ├─ data/             三个主题、DEM 网格、素材与许可清单
│  ├─ css/              界面样式
│  └─ assets/           事件图、全景图、封面与地图纹理
├─ docs/
│  ├─ 需求修订_v0.5.md   本轮权威需求
│  ├─ handoff/          场景契约、DEM 来源、QA、交接与资源替换
│  ├─ history/          史料资料包、图片脚本
│  └─ prompts/          生图与续作提示词
└─ tools/               DEM / 全景构建脚本（仅本机运行）
```

## 文档

- 课件使用与数据字段：[course/README.md](course/README.md)
- 本轮需求：[docs/需求修订_v0.5.md](docs/需求修订_v0.5.md)
- 场景数据契约：[docs/handoff/SCENE_SPEC_v0.4.md](docs/handoff/SCENE_SPEC_v0.4.md)（第 0 节为 v0.5 增量）
- QA 记录：[docs/handoff/QA.md](docs/handoff/QA.md)
- DEM 来源与许可：[docs/handoff/DEM_SOURCES.md](docs/handoff/DEM_SOURCES.md)
- 资源替换：[docs/handoff/RESOURCE_REPLACEMENT.md](docs/handoff/RESOURCE_REPLACEMENT.md)
- 构建脚本说明：[tools/README.md](tools/README.md)
- 提示词目录：[docs/prompts/README.md](docs/prompts/README.md)

## 构建与校验

课件运行时不执行 Python、不联网。只有重新生成 DEM 或全景时需要本机脚本：

```bash
python tools/build_dem.py --validate
python tools/build_vr_panos.py
```

常规校验：

- 对所有 `course/js/*.js` 与 `course/data/*.js` 运行 `node --check`。
- 双击 `file://` 打开，确认 console 无 error、无外部 `http(s)` 请求。
- 改完代码后运行 `git diff --check`。
- 反复进出 `war / battle / court / vr` 场景，确认无未捕获异常。

## 数据与诚实性

- **地形**：真实 DEM，但垂直方向夸张；仅用于课堂可视化，不是导航/测绘数据。
- **疆域**：历史疆域仍为示意多边形，不是精确边界。
- **战争**：地形真实；兵力、编制、阵型、占地网格、兵/气与战线均为教学示意，不是精确历史阵图。
- **朝堂**：人物姓名、官职按教材与常见正史称谓整理；台词为教学情景复原，不是史料原文；`e11` 的御史为角色化呈现，具体姓名待核订。
- **插画 / 全景**：AI 或程序化艺术复原示意，不是历史影像；当前 2:1 全景由 16:9 插画扩展生成，不是全景摄影。
- **不编造**：无法确认的历史人物、官职、兵力或精确阵图不写入数据；不确定内容标「角色 / 待核订」。

## 已知限制

- 不是 GIS 系统：不做海拔查询、导航或测绘。
- 历史边界仍为示意，待历史组核对。
- 通用战场的兵/气与占地网格是确定性战术示意，不是史实战况。
- `wudai/e11` 卡片图目前仍标为 `placeholder`（以 `course/data/assets.js` 为准）。
- 2:1 全景当前为插画扩展示意；真全景待替换。
- 没有 WebXR 头显 / 双眼立体；没有世界史主题。
- 1366×768 下右侧场景面板内容较长时仍需滚动。

## 许可与来源

- Three.js r147 / OrbitControls：MIT，保留版权头。
- DEM：Mapzen / Joerd Terrain Tiles；SRTM / GMTED2010 / 3DEP（USGS）与 ETOPO1（NOAA）公有领域；署名与修改说明见 `docs/handoff/DEM_SOURCES.md`。
- 外部网站、历史地图与史料：见「来源与授权」弹窗与 `course/data/license.js`；谁取用谁核实许可。
- 本项目仅用于课堂教学演示；不复制《中国历史地图集》图幅，也不分发未确认授权的外部地图数据。
