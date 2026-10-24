# 史境 · 三维历史沙盘（Demo v0.5）

面向中学历史课堂的三维时空交互课件 Demo。双击 `index.html` 即可在 Chrome / Edge 打开，不需要联网、不需要安装依赖。

v0.4 的重点：**真实 DEM 地形**、**所有战争事件的小人战场**、**世宗改革朝堂辩论**、**360° 全景环视**。
v0.5 增补：**通用战场血条头标 + 占地网格 + 图层开关**、**朝堂发言者历史人物名牌与脚下光环**。
v0.5.1 修复：主沙盘势力色块/边界高亮恢复；`battle` 网格改为**固定格子 + 持久 owner + 捕获计时**，新增**地标**图层；语义对照见 `docs/handoff/CODE_NOTES.md`。

## 打开方式

1. 用 Chrome 或 Edge 打开 `course/index.html`。
2. 首次进入是首屏；点「开始探索」进入五代十国。
3. 如果浏览器拦截本地文件，请确认使用的是 Chrome/Edge，而不是 IE。

> 整个 `course/` 文件夹可以拷到 U 盘；不要只拷 `index.html`，`js/`、`data/`、`css/`、`assets/` 要一起拷。

## 课堂操作

| 操作 | 方式 |
|---|---|
| 下一站 / 上一站 | `→` `←`，或翻页笔 PageDown/PageUp，或底部时间轴 |
| 旋转 / 缩放 / 平移 | 左键拖动 / 滚轮 / 右键拖动 |
| 回到全景 | `Home` 或顶栏「全景」 |
| 课堂提问 | `Q` 出题，再按 `Q` 揭晓；`Esc` 关闭 |
| 进入 / 退出 3D 场景 | `E`，或卡片上的「进入场景」；场景内 `Esc` 返回 |
| 进入 / 退出 360° 全景 | `V`，或卡片图片右上角「360° 环视」 |
| 场景暂停 / 继续 | 场景内 `Space` |
| 场景速度 | 场景内 `1` 1x / `2` 2x / `3` 4x；也可点顶栏速度按钮 |
| 场景重播 | 场景内 `R`，或顶栏「重播」 |
| 场景图层 | `war` / `battle` 场景内 `L`，或右侧「图层」 |
| VR 复位视角 | `Home` |
| 自动演示 | `P` 开/关；`?demo=1` 自动播放 |
| 图层 | `L`（地图模式） |
| 静音 / 恢复 | `M` |
| 全屏 | `F` |
| 切换时期 | `1` 隋唐 / `2` 五代十国 / `3` 宋朝 |

## 三个时期与场景

| 时期 | 事件数 | 场景 |
|---|---|---|
| 五代十国 | 11 | 高平之战（`war` 省域兵棋）；世宗改革（`court` 朝堂）；其余 4 个战争事件自动 `battle` |
| 隋唐（安史之乱） | 6 | 5 个战争事件自动 `battle`（范阳、洛阳、潼关、长安、两京） |
| 宋朝（澶渊之盟） | 4 | 3 个战争事件自动 `battle`（南下、瀛州、澶州） |

> 政治/外交事件（如后周建立、陈桥兵变、澶渊之盟）本轮没有强制场景；卡片会显示「进入场景」禁用，不伪造。

## 真实地形

- 主沙盘使用 **Mapzen / Joerd Terrain Tiles**（AWS Open Data）派生的真实 DEM：
  - SRTM / GMTED2010 / 3DEP（USGS）与 ETOPO1（NOAA）；
  - 0.06° 网格，主沙盘 22× 垂直夸张；
  - 海陆掩膜、海岸线、等高线由高程生成。
- 战场使用局部高精度网格：
  - `gaoping` 高平、`hebei` 河北、`guanzhong` 关中、`huainan` 中原淮南；
  - 0.008° 网格，9× 垂直夸张。
- 垂直夸张只用于课堂可视化；**不是导航/测绘数据**。
- 完整来源与许可见 `docs/handoff/DEM_SOURCES.md` 与「来源与授权」弹窗。

## 场景类型

### 1. `war` · 省域兵棋（e06 高平之战）

- 9 个省份：太原、代州、潞州、沁水、高平、壶关、端氏、泽州、陵川。
- 单位有相对 `strength` / `morale` / `attack` / `defense` / `speed`；接战自动结算，低于阈值溃退。
- **战线是推演结果**：相邻省份归属不同时，取共享边界段自动生成；不是手工关键帧。
- 省份色块、边界、城市、河流、单位全部贴在真实 DEM 地形上。
- 右侧战报 + 底部阶段时间轴；可暂停、调速、重播、跳阶段、开关图层。
- 终局：后周 7 省，北汉/辽各 1 省；同一 `seed` 结果一致。

### 2. `battle` · 通用战场（所有 war 事件兜底）

- 预设：`field` / `siege` / `cavalry` / `ambush` / `river`。
- 自动生成双方小人编队、旗帜、城墙/浮桥/岩石、阶段与战报。
- 重点事件有显式 `battle` 配置（preset/terrain/sides）；其余用默认 `field`。
- **v0.5 血条头标**：每个单位头顶显示阵营短名 + 单位名 + 状态 + 兵/气两条；数值由场景时间确定性推算，缺省 100，不使用 `Math.random()`；收束阶段溃退方降到阈值以下。样式与 e06 高平之战的单位牌同构。
- **占地网格**：默认 20×16，格子是世界坐标固定网格，不随单位移动；每格有持久 `owner`（中立 / 阵营 id）和 `control` 捕获进度。单方在 `captureRadius` 内累计 `captureTime`（默认 3.2 秒）后 owner 才改变；单位离开后归属保留，敌方需重新完成反占领；多阵营同压一格视为争夺。初始归属按 preset/出生位置/城墙/河岸派生。与战场地形同几何的 Canvas 覆盖纹理，不是平面 GridHelper；只在控制状态变化时重绘，0.24 秒节流；中立格灰色。
- **地标**：`battle.landmarks` 可选，按 preset 生成贴地地标（城门/城墙/渡口/浮桥/谷口/伏兵/营地等），名称优先用事件 `place`；图层可分别开关「占地网格 / 单位 / 地标 / 名字」。
- 占地网格、地标与兵/气条均为战术示意，不是精确历史疆域或阵图。
- e06 高平之战仍使用 `war` 省域兵棋（省份控制 + 单位牌），不叠加第二套网格。

### 3. `court` · 朝堂议政（e11 世宗改革）

- 角色：柴荣（后周世宗）、王溥（宰相）、范质（宰相）、李谷（大臣）、赵匡胤（禁军将领）、御史（台官，角色待核订）、侍卫。
- 按阶段切换发言者：举笏/躬身/聆听；烛光、香炉、屏风、御座。
- **v0.5 人物名牌**：发言者头顶显示「姓名 · 官职」名牌并放大高亮，脚下出现金色光环；非发言者名牌弱化。右侧「发言」栏使用同一姓名/官职。
- UI 显示“发言”、阶段时间轴、战报；明确“人物称谓、台词为情景复原，不是史料原文”；御史为角色化呈现。

### 4. `vr` · 360° 全景

- 2:1 全景（4096×2048）水平循环；拖动环视、滚轮缩放、自动巡游、热点、`Home` 复位。
- `assets/vr/` 中的 P0 场景（`wudai/e06`、`wudai/e07`、`wudai/e08`、`wudai/e11`、`song/e03`、`suitang/e03`）已替换为 GPT-Image2 生成并修补接缝的 2:1 等距柱状环境图；其余槽位仍是由 16:9 插画扩展的全景示意。
- 真全景提示词见 `docs/prompts/04_GPT-Image2_VR全景.md`；替换图片即可，不改引擎。
- 查看器使用 CSS 全景层，不依赖 WebGL 外部纹理，`file://` 双击可用。

## 地图微缩情景

- 当前事件为战争时：事件点旁出现圆形铜底座 + 两撮小人 + 旗帜。
- 当前事件为改革/朝堂时：出现小亭、案几、文官。
- 图层面板可关闭「情景小人」。

## 修改内容

所有文字、事件、路线、镜头、场景参数都在 `data/`：

- `data/theme.wudai.js`：五代十国（默认、重点，11 个事件）
- `data/theme.suitang.js`：隋唐（6 个事件）
- `data/theme.song.js`：宋朝（4 个事件）
- `data/themes.index.js`：时期顺序、默认时期、项目名
- `data/dem/regions.js`：构建生成的 DEM 网格（勿手改）
- `data/assets.js`：图片/封面/背景/全景清单与状态
- `data/license.js`：来源、代码许可、DEM、AI 声明

**只改数据不需要改引擎。** 新增时期：新建 `data/theme.<id>.js`，在 `index.html` 加一行 `<script>`，再把 id 加到 `themes.index.js` 的 `HISTORY_THEME_ORDER`。

### 事件字段（v0.5）

```js
{
  id: "e11",
  kind: "war" | "politics" | "reform" | "diplomacy",
  figures: ["柴荣（后周世宗）"],
  result: "……",
  impact: "……",
  scene: {
    type: "war" | "battle" | "court",
    // war/battle/court 的字段见 docs/handoff/SCENE_SPEC_v0.4.md（含 v0.5 增量）
  },
  battle: {
    preset: "field" | "siege" | "cavalry" | "ambush" | "river",
    grid: { cols: 20, rows: 16, captureRadius: 11, captureTime: 3.2 }, // 可选，战场占地图层
    landmarks: [                                       // 可选；缺省按 preset 生成
      { name: "寿州城", x: 0, z: 11, kind: "gate", side: 1 }
    ]
  },
  vr: {
    pano: "assets/vr/wudai/e11.jpg",
    hotspots: [{ x: 0.5, y: 0.5, label: "柴荣", text: "……" }]
  }
}
```

没有 `scene` 的 `kind:"war"` 事件会自动生成 `battle` 场景；没有场景的政治/外交事件显示禁用按钮。
`battle` 单位可带 `strength` / `morale`（0–100，缺省 100）；`court` 角色可带 `roleOnly: true`（角色化、待核订，名牌描边为虚线）。

### 替换图片

1. 把图片放到 `assets/events/<主题>/<事件>.jpg` 或 `assets/ui/`。
2. 在 `data/assets.js` 把对应条目的 `status` 改为 `"ready"`。
3. 规格：1920×1080 JPEG、sRGB、16:9、无文字/水印、单张 ≤ 600KB。
4. 缺图时卡片显示设计过的占位图，不会出现破图。
5. `wudai/e11.jpg` 已接入 GPT-Image2 生成的 1920×1080 朝堂插画（`status:"ready"`）。

### 替换全景

1. 生成 4096×2048（2:1）等距柱状 JPEG。
2. 覆盖 `assets/vr/<theme>/<event>.jpg`。
3. 在 `data/assets.js` 的 `vr-*` 条目确认 `status:"ready"`；把 `note` 改为“真 2:1 全景”。
4. 在事件 `vr.hotspots` 中按新全景调整热点坐标。
5. 不要对真全景再运行 `tools/build_vr_panos.py`（会覆盖）。

## 来源与授权

- 外部网站/地图/史料：见「来源与授权」弹窗和 `data/license.js`；使用或参考后必须标注。
- DEM：Mapzen/Joerd Terrain Tiles；SRTM/GMTED2010/3DEP（USGS）与 ETOPO1（NOAA）公有领域；瓦片打包 attribution 按 Joerd 要求保留。
- 许可：谁取用谁核实；无法确认就不用。耿雨只负责史实审核，不负责许可判断。
- AI 插画/封面：主页/页脚统一声明「AI 生成的艺术复原示意，不是历史影像」，不逐张标注。
- 2:1 全景：六个 P0 槽位为 GPT-Image2 生成的 AI 艺术复原环境图（非实拍）；其余槽位仍为插画扩展示意。
- Three.js r147 / OrbitControls：MIT，保留版权头。

## 已知限制（Demo v0.5）

- 势力边界仍是**根据公开历史地图简化**的示意多边形，不是精确疆域；需要历史组核对。
- 五代十国地图是约 955 年快照，事件跨 907–960；图例已标「地图快照」。
- 大理、吐蕃、河西、清源军等未单列色块，图例已标「未单列」。
- 隋唐/宋朝仍是示意 blob，没有补简化多边形。
- 地形是真实 DEM，但**垂直夸张**；不能当真实海拔/导航数据。
- 战争兵力、编制、省份/战线是教学示意，不是精确历史阵图。
- 通用 `battle` 的兵/气条与占地网格由确定性时间模型生成，不是史实战况、精确战线或历史疆域；不使用随机数。
- 朝堂人物称谓、台词是情景复原，不是史料原文；e11 的御史为角色化呈现，具体姓名待核订。
- `wudai/e11` 卡片图已替换为 GPT-Image2 朝堂插画；其余事件图状态见 `data/assets.js`。
- 六个 P0 2:1 槽位已使用 GPT-Image2 真全景环境图；它们仍是 AI 艺术复原，不是实拍或历史影像。
- 没有世界史主题（一战/二战路线）；引擎支持任意经纬度范围，后续可加。
- 没有 WebXR 头显/双眼立体；本轮 VR 指 360° 图片环视 + 3D 前景。

## 文件结构

```text
course/
├─ index.html
├─ README.md
├─ css/app.css
├─ js/
│  ├─ lib/three.min.js, OrbitControls.js
│  ├─ core.js          渲染器、相机、投影、标签
│  ├─ dem.js           DEM 解码/采样/高度网格
│  ├─ figures.js       小人/编队/朝堂角色/微缩情景
│  ├─ map.js           真实地形、海陆、等高线、势力覆盖层、河流、地名
│  ├─ route.js         路线曲线、贴地节点与生长
│  ├─ ui.js            顶栏、时间轴、卡片、问答、来源、场景 UI
│  ├─ sfx.js           Web Audio 合成音效
│  ├─ vr360.js         360° CSS 全景查看器
│  ├─ scene.js         war / battle / court / vr 场景调度
│  └─ main.js          启动、主题/事件切换、键盘、自动演示、API
├─ data/
│  ├─ themes.index.js
│  ├─ theme.wudai.js / theme.suitang.js / theme.song.js
│  ├─ dem/regions.js   构建生成，勿手改
│  ├─ assets.js
│  └─ license.js
└─ assets/
   ├─ events/wudai|suitang|song/
   ├─ vr/wudai|suitang|song/   4096×2048 全景
   ├─ ui/
   └─ map/
```

## 调试 / 录屏

```js
HISTORY_APP.goTo("e06");
HISTORY_APP.next();
HISTORY_APP.play();
HISTORY_APP.enterScene("e06");
HISTORY_APP.enterVR("e06");
HISTORY_APP.exitScene();
HISTORY_APP.state();
HISTORY_APP.sceneFor("e07");    // 自动生成的 battle 场景
```

URL 参数：`?theme=wudai&event=e06&demo=1&dwell=8000&nointro=1`。

## 构建脚本

```bash
python tools/build_dem.py --validate     # 生成 course/data/dem/regions.js
python tools/build_vr_panos.py           # 仅为未替换槽位生成 2:1 示意；会覆盖同名文件，真全景勿跑
```

构建脚本只在本机运行；课件运行时不联网、不执行 Python。

## 需求与交接

- 需求修订：`docs/需求修订_v0.5.md`（本轮）、`docs/需求修订_v0.4.md`（历史）
- 场景契约：`docs/handoff/SCENE_SPEC_v0.4.md`（含 v0.5 增量）
- DEM 来源：`docs/handoff/DEM_SOURCES.md`
- 全景提示词：`docs/prompts/04_GPT-Image2_VR全景.md`
- 交接：`docs/handoff/DEMO_HANDOFF.md`
- 资源替换：`docs/handoff/RESOURCE_REPLACEMENT.md`
- 测试记录：`docs/handoff/QA.md`
