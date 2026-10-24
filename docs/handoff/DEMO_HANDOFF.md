# DEMO 交接 · 史境三维历史沙盘 v0.3

> **v0.5.1 修复（2026-10-24）**：修复主沙盘势力色块/边界高亮；battle 占地网格改为
> 固定格子 + 持久 owner + 固定步长捕获，并新增地标图层；e06 `war` 仍为 7/1/1。
> 语义对照、根因与回归清单见 `docs/handoff/CODE_NOTES.md`。
>
> **素材同步（2026-10-24）**：六个 P0 场景真 2:1 全景与 e11 朝堂插画已接入；
> 其余全景仍为 16:9 插画扩展示意。清单与哈希见 `docs/handoff/IMAGE_ASSETS_2026-10-24.json`。
>
> **v0.5 增量（2026-10-23）**：`battle` 血条头标、占地网格与图层开关、e11 朝堂历史人物名牌/金色光环已落地；e06 `war` 保持不变。最新状态以 `docs/需求修订_v0.5.md`、`docs/handoff/SCENE_SPEC_v0.4.md`（第 0 节）、`docs/handoff/QA.md` 和 `course/README.md` 为准。
>
> **v0.4 增量（2026-10-23）**：真实 DEM 地形、所有战争事件 `battle`、e11 `court`、360° `vr`、地图微缩情景已落地。本文件 v0.3 段落保留作历史记录。

## v0.4 状态速览

| 能力 | 状态 |
|---|---|
| 主沙盘真实 DEM（SRTM/GMTED/ETOPO1） | 完成；22× 垂直夸张 |
| DEM 海陆/海岸/等高线 | 完成 |
| 所有战争事件场景 | 完成；e06 `war`，其余 `battle` |
| 世宗改革朝堂 | 完成；`court` |
| 小人/骑兵/文官/皇帝/侍卫 | 完成；程序化几何 |
| 地图微缩情景 | 完成；战争/改革 |
| 360° 全景 | 完成；六个 P0 真 2:1 环境图，其余扩展示意 + 热点 |
| 真 360° 摄影全景 | 无；当前为 AI 艺术复原环境图，不是实拍 |
| e11 真插画 | 完成；GPT-Image2 朝堂插画 |
| 历史疆域精确化 | 未做；仍为示意 |

> 日期：2026-10-23
> 代码位置：`course/`
> 需求依据：`docs/需求修订_v0.2.md`（以 `docs/聊天记录整理.md` 为准）、`docs/handoff/WAR_SCENE_SPEC.md`
> 当前状态：可双击运行、可课堂演示；24 张图片已接入（`map-relief` 可选缺失）；只有高平之战有 `war` 兵棋推演场景。

---

## 一、现在能做什么

| 能力 | 状态 | 说明 |
|---|---|---|
| 双击 `course/index.html` 离线运行 | 已完成 | Chrome/Edge；无 CDN、无网络请求 |
| 三个时期切换 | 已完成 | 按时间顺序：隋唐 / 五代十国（默认） / 宋朝 |
| 3D 沙盘旋转/缩放/平移/复位 | 已完成 | 左键/滚轮/右键；`Home` 或「全景」 |
| 时期势力色块 + 名称 | 已完成 | 五代十国 10 个势力；6 个主要政权用简化多边形 |
| 重点政权高亮 + 理由 | 已完成 | `highlightReason`；当前事件势力高亮、其余压暗 |
| 地图快照/未单列势力提示 | 已完成 | 图例显示「约 955 年」「大理、吐蕃、河西、清源军未单列」 |
| 动态路线生长 | 已完成 | 3 条路线；`→/←`、时间轴、自动演示 |
| 事件卡片 | 已完成 | 标题/时间/地点/摘要/要点/主要人物/AI 插画（缺失时 CSS 降级） |
| 课堂提问 | 已完成 | `Q` 出题/揭晓 |
| 时间轴/自动演示/图层/静音/全屏 | 已完成 | `P/L/M/F`；`?demo=1` |
| 来源与授权 | 已完成 | 外部网站/地图/史料 + 代码许可 + AI 声明 |
| war 兵棋推演 | **1 个** | 五代十国 `e06 高平之战`；省份/战线/兵力/士气/战报 |
| 结构化场景文字 | 已完成（e06） | 时间/地点/主要人物/结果/影响 |
| 隋唐/宋朝薄主题 | 已完成 | 6/4 个事件；仍是示意 blob；无 war 场景 |
| 图片资源 | **24 张** | 事件图/封面/背景已就绪；`map-relief` 可选缺失；卡片不再占位 |
| 真实 DEM/海拔查询 | 未做 | Demo 用程序化沙盘；后续 M4 |
| 世界史主题 | 未做 | 引擎支持任意 bounds；写入路线图 |

---

## 二、v0.2 / v0.3 本轮新增/修改

1. **五代十国势力多边形**：`theme.wudai.js` 的 10 个 `regions[].polygon` 填了简化边界；`status: "approx"`；来源说明保留在 `sourceNote`。
2. **图例信息**：`mapSnapshot`、`omitted`、`regions[].highlightReason`；图例显示重点政权理由、快照年份、未单列势力。
3. **结构化事件字段**：三个主题共 20 个事件都补了 `figures` / `result` / `impact`；卡片显示「主要人物」。隋唐/宋朝为初稿，待 DeepSeek/耿雨核对。
4. **war 兵棋推演**：新增 `scene.type: "war"`；9 个省份、6 个单位、固定步长自动战斗、省份控制、战线派生；`e06` 有完整数据；卡片「进入场景」可点击。
5. **战争 UI**：左侧双方兵力/控制、右侧阶段/战报、底部阶段时间轴、顶部 1x/2x/4x + 重播；暂停/继续/跳阶段/图层/单位提示。
6. **场景文字**：时间、地点、主要人物、结果、影响；明确「战术示意，不是精确历史阵图」。
7. **键盘/帮助**：场景内 `Space`、`1/2/3` 速度、`R` 重播、`L` 图层、`Esc` 返回；地图模式 `1/2/3` 按时间顺序切时期。
8. **README**：新增 `course/README.md`，写清打开方式、快捷键、改数据、替换图片。
9. **场景数据契约**：见 `docs/handoff/WAR_SCENE_SPEC.md` 与 `00_协作总览与数据契约.md` 5.4；代码在 `scene.js`，`war` 为主，`battlefield` 保留兼容。

---

## 三、架构

```text
index.html
  ├─ data/*.js          window.HISTORY_THEMES / ASSET_MANIFEST / LICENSE
  ├─ js/core.js         HS.stage（主渲染器/相机/OrbitControls）、HS.proj、HS.labels、HS.camera
  ├─ js/map.js          HS.buildMap(theme)：沙盘底座、polygon/blob 势力、河流、地名、highlight
  ├─ js/route.js        HS.buildRoutes(theme)：路线曲线、生长 shader、节点
  ├─ js/ui.js           DOM：顶栏/时间轴/卡片/问答/来源/图层/场景 UI
  ├─ js/sfx.js          Web Audio 合成音效
  ├─ js/scene.js        HS.scene：独立 canvas 的 3D 场景（war 兵棋推演 / battlefield 兼容）
  └─ js/main.js         HISTORY_APP / __sandbox：启动、切换、键盘、自动演示
```

### 主沙盘与场景的关系

- 主沙盘始终使用 `HS.stage.renderer`（`#stage`）。
- 场景使用独立的 `#sceneCanvas` + `HS.scene.renderer`，全屏覆盖；进入时禁用主沙盘 OrbitControls，退出时恢复。
- 场景全部由 Three.js 基础几何体 + Canvas 纹理生成，不加载图片。
- `HS.scene.state()`：`{ active, playing, t, eventId }`。
- `HISTORY_APP.enterScene(id)` / `exitScene()` / `toggleScene()` 可用于录屏/自测。

### 数据流

- 主题切换：`teardown()` → `build(theme)` → 相机飞行 → 打开默认事件。
- 事件切换：`goTo(id)` → 路线生长 → 相机飞行 → `ui.fillCard` → 卡片滑入。
- 场景：卡片「进入场景」→ `HS.scene.enter(ev.scene, ev)` → `ui.openWarScene` → 固定步长推演 + 独立渲染循环。
- 战线：`borders` + `province.owner` 运行时派生；省份易手 → 重建战线；不写手工关键帧。
- 来源：`credits.sourceRecords` + `HISTORY_LICENSE` → `ui.openSources`。

---

## 四、如何运行/自测

1. 双击 `course/index.html`，Chrome/Edge。
2. 默认五代十国；顶栏顺序为隋唐/五代十国/宋朝；按 `→` 走 10 个事件；按 `Q` 出题；按 `E` 在 `e06` 进入 war 场景；`Space` 暂停、`1/2/3` 速度、`R` 重播、`L` 图层、`Esc` 返回。
3. 顶栏切换隋唐/宋朝；确认地图/路线/时间轴/卡片都更新。
4. 按 `P` 自动演示；`L` 图层；`M` 静音；`F` 全屏；`Home` 全景。
5. 打开「来源与授权」，确认外部网站/地图/史料、Three.js MIT、AI 声明可见。
6. URL 参数：`?theme=wudai&event=e06&demo=1&dwell=8000&nointro=1`。

自测记录见 `docs/handoff/QA.md`。

---

## 五、当前占位/未完成

| 项 | 状态 | 谁来做 |
|---|---|---|
| 24 张事件图/封面/背景 | **已就绪** | GPT-Image2 已完成；汇报前人工过一遍文字/朝代/裁切 |
| `map-relief` 可选地图纹理 | 仍 missing | 本轮不需要；后续按需 |
| 隋唐/宋朝结构化 `figures/result/impact` | 已补初稿 | DeepSeek 核对/扩写 |
| 隋唐/宋朝简化多边形 | 未补，仍 blob | DeepSeek/耿雨 |
| 五代十国多边形史实核对 | `approx` | 耿雨 |
| 更多 3D 场景（朝堂/建筑/其他战役） | 未做 | 后续 M4 |
| 真实 DEM/海拔查询 | 未做 | 后续 M4 |
| 世界史主题（一战/二战路线） | 未做 | 后续 M3/M4 |
| 项目名/Logo/印章 | 文字占位「史境」 | 人类设计 |
| 字体 | 系统字体 | 可选授权字体 |
| 音效 | Web Audio 合成 | 已完成基础；可按需增强 |

---

## 六、已知问题

1. **多边形是示意**：不能当精确边界；正式使用前由历史组核对。
2. **地图快照与事件跨度**：地图是约 955 年，事件跨 907–960；图例已提示，但课堂仍需口头说明。
3. **未单列势力**：大理、吐蕃、河西、清源军未着色；图例已标。
4. **war 场景只有 1 个**：其他事件是「待补」；不要误导为全部可进入。
5. **war 是轻量兵棋**：省份/兵力/战线为战术示意；不做玩家下令、补给、六角格；不是 HOI4 完整模拟。
6. **图片已接入**：24 张 1920×1080 图片已就绪；`map-relief` 可选缺失；正式汇报前仍建议人工检查文字/朝代/裁切。
7. **小屏标签重叠**：1366×768 下地图边缘标签偏挤；1920×1080 正常。后续可做标签避让/缩放。
8. **主题切换约 5 秒**：淡出→重建→镜头飞行→开卡片；不是卡死。
9. **隋唐/宋朝 `figures/result/impact` 是初稿**：基于现有事件文字整理，待 DeepSeek/耿雨核对；不要当成最终史实表述。
10. **`themes.index.js` 的 `HISTORY_PROJECT.status`**：本轮已改为 `demo`；如要正式发布，可改为 `reviewed` 前先做史实审核。

---

## 七、下一步

1. **GPT-Image2**：24 张已接入，`assets.js` 已标 `ready`；如需重生成，按 `docs/prompts/03_GPT-Image2_美术资产.md` 和对应图片脚本走风格测试。
2. **DeepSeek**：核对/扩写隋唐/宋朝 `figures/result/impact`；核对五代十国多边形；补 `scene.text` 的其他事件（如果要做第二个场景）。
3. **耿雨**：审核多边形、事件文字、e06 场景人物/结果/影响；不负责许可判断。
4. **Claude/Command Code**：图片到位后做第二轮版式/场景 QA；补更多战场时复用 `scene.js` 的 `war` 接口，只加数据。
5. **汇报前**：至少走一遍 1920×1080 全流程；确认来源弹窗、场景、图片占位都符合预期。
