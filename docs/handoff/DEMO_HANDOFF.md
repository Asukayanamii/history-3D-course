# DEMO 交接 · 史境三维历史沙盘 v0.2

> 日期：2026-10-23
> 代码位置：`course/`
> 需求依据：`docs/需求修订_v0.2.md`（以 `docs/聊天记录整理.md` 为准）
> 当前状态：可双击运行、可课堂演示；图片资源尚未生成；只有高平之战有 3D 场景。

---

## 一、现在能做什么

| 能力 | 状态 | 说明 |
|---|---|---|
| 双击 `course/index.html` 离线运行 | 已完成 | Chrome/Edge；无 CDN、无网络请求 |
| 三个时期切换 | 已完成 | 五代十国（默认）/隋唐/宋朝 |
| 3D 沙盘旋转/缩放/平移/复位 | 已完成 | 左键/滚轮/右键；`Home` 或「全景」 |
| 时期势力色块 + 名称 | 已完成 | 五代十国 10 个势力；6 个主要政权用简化多边形 |
| 重点政权高亮 + 理由 | 已完成 | `highlightReason`；当前事件势力高亮、其余压暗 |
| 地图快照/未单列势力提示 | 已完成 | 图例显示「约 955 年」「大理、吐蕃、河西、清源军未单列」 |
| 动态路线生长 | 已完成 | 3 条路线；`→/←`、时间轴、自动演示 |
| 事件卡片 | 已完成 | 标题/时间/地点/摘要/要点/主要人物/图片占位 |
| 课堂提问 | 已完成 | `Q` 出题/揭晓 |
| 时间轴/自动演示/图层/静音/全屏 | 已完成 | `P/L/M/F`；`?demo=1` |
| 来源与授权 | 已完成 | 外部网站/地图/史料 + 代码许可 + AI 声明 |
| 3D 全知场景 | **1 个** | 五代十国 `e06 高平之战`；进入/退出/暂停/缩放 |
| 结构化场景文字 | 已完成（e06） | 时间/地点/主要人物/结果/影响 |
| 隋唐/宋朝薄主题 | 已完成 | 6/4 个事件；仍是示意 blob；无 3D 场景 |
| 图片资源 | **0 个** | 25 个清单条目全部 `missing`，卡片显示占位 |
| 真实 DEM/海拔查询 | 未做 | Demo 用程序化沙盘；后续 M4 |
| 世界史主题 | 未做 | 引擎支持任意 bounds；写入路线图 |

---

## 二、v0.2 本轮新增/修改

1. **五代十国势力多边形**：`theme.wudai.js` 的 10 个 `regions[].polygon` 填了简化边界；`status: "approx"`；来源说明保留在 `sourceNote`。
2. **图例信息**：`mapSnapshot`、`omitted`、`regions[].highlightReason`；图例显示重点政权理由、快照年份、未单列势力。
3. **结构化事件字段**：三个主题共 20 个事件都补了 `figures` / `result` / `impact`；卡片显示「主要人物」。隋唐/宋朝为初稿，待 DeepSeek/耿雨核对。
4. **3D 全知场景**：新增 `js/scene.js`，支持 `battlefield` 类型；`e06` 有完整 `scene` 数据；卡片「进入场景」可点击。
5. **场景 UI**：独立 canvas、镜头控制、战况阶段、进度条、暂停/继续、返回地图；`E` 进入/退出，`Space` 暂停。
6. **场景文字**：时间、地点、主要人物、结果、影响；明确「低多边形艺术复原，不是历史影像」。
7. **键盘/帮助**：补 `E` 与场景内 `Space`；帮助面板同步。
8. **README**：新增 `course/README.md`，写清打开方式、快捷键、改数据、替换图片。
9. **场景数据契约**：见 `docs/需求修订_v0.2.md` F6.5；代码在 `scene.js`，目前只实现 battlefield。

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
  ├─ js/scene.js        HS.scene：独立 canvas 的 3D 场景（battlefield）
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
- 场景：卡片「进入场景」→ `HS.scene.enter(ev.scene, ev)` → `ui.openScene` → 独立渲染循环。
- 来源：`credits.sourceRecords` + `HISTORY_LICENSE` → `ui.openSources`。

---

## 四、如何运行/自测

1. 双击 `course/index.html`，Chrome/Edge。
2. 默认五代十国；按 `→` 走 10 个事件；按 `Q` 出题；按 `E` 在 `e06` 进入场景；`Esc` 返回。
3. 顶栏切换隋唐/宋朝；确认地图/路线/时间轴/卡片都更新。
4. 按 `P` 自动演示；`L` 图层；`M` 静音；`F` 全屏；`Home` 全景。
5. 打开「来源与授权」，确认外部网站/地图/史料、Three.js MIT、AI 声明可见。
6. URL 参数：`?theme=wudai&event=e06&demo=1&dwell=8000&nointro=1`。

自测记录见 `docs/handoff/QA.md`。

---

## 五、当前占位/未完成

| 项 | 状态 | 谁来做 |
|---|---|---|
| 25 张事件图/封面/背景 | 全部 `missing` | GPT-Image2（优先 P0 6 张 + 封面 + bg） |
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
4. **场景只有 1 个**：其他事件是「待补」；不要误导为全部可进入。
5. **场景是低多边形**：不是历史影像；兵力/位置/旗帜均为示意。
6. **图片缺失**：卡片是设计过的占位图，不是破图；但正式汇报前建议至少补 P0 6 张 + 封面 + bg。
7. **小屏标签重叠**：1366×768 下地图边缘标签偏挤；1920×1080 正常。后续可做标签避让/缩放。
8. **主题切换约 5 秒**：淡出→重建→镜头飞行→开卡片；不是卡死。
9. **隋唐/宋朝 `figures/result/impact` 是初稿**：基于现有事件文字整理，待 DeepSeek/耿雨核对；不要当成最终史实表述。
10. **`themes.index.js` 的 `HISTORY_PROJECT.status`**：本轮已改为 `demo`；如要正式发布，可改为 `reviewed` 前先做史实审核。

---

## 七、下一步

1. **GPT-Image2**：按 `docs/history/五代十国_图片脚本.md` 做 P0 6 张 + `wudai-cover` + `bg`；交付后更新 `assets.js` 的 `status`。
2. **DeepSeek**：核对/扩写隋唐/宋朝 `figures/result/impact`；核对五代十国多边形；补 `scene.text` 的其他事件（如果要做第二个场景）。
3. **耿雨**：审核多边形、事件文字、e06 场景人物/结果/影响；不负责许可判断。
4. **Claude/Command Code**：图片到位后做第二轮版式/场景 QA；补更多场景时复用 `scene.js` 的 battlefield 接口。
5. **汇报前**：至少走一遍 1920×1080 全流程；确认来源弹窗、场景、图片占位都符合预期。
