# 资源替换清单 · v0.2

> 日期：2026-10-23
> 代码位置：`course/`
> 清单源：`course/data/assets.js`（25 条）
> 状态：`missing` 缺文件 / `placeholder` 占位 / `ready` 就绪 / `needs-review` 待审
> 原则：外部网站/地图/史料必须标来源；AI 图不逐张标来源，只在主页/页脚统一声明；许可谁取用谁核实。

---

## 一、图片资源（P0）

| ID | 主题 | 路径 | 优先级 | 状态 | 提供方 | 备注 |
|---|---|---|---|---|---|---|
| bg | 全局 | `assets/ui/bg.jpg` | P0 | ready | GPT-Image2 | 缺失时 CSS 渐变 + 噪点 |
| wudai-cover | 五代十国 | `assets/ui/cover-wudai.jpg` | P0 | ready | GPT-Image2 | 首屏封面，上方留暗部叠标题 |
| wudai-e01 | 五代十国 | `assets/events/wudai/e01.jpg` | P0 | ready | GPT-Image2 | 后梁代唐 |
| wudai-e03 | 五代十国 | `assets/events/wudai/e03.jpg` | P0 | ready | GPT-Image2 | 割让燕云 |
| wudai-e05 | 五代十国 | `assets/events/wudai/e05.jpg` | P0 | ready | GPT-Image2 | 后周建立 |
| wudai-e06 | 五代十国 | `assets/events/wudai/e06.jpg` | P0 | ready | GPT-Image2 | 高平之战；场景入口所在事件 |
| wudai-e08 | 五代十国 | `assets/events/wudai/e08.jpg` | P0 | ready | GPT-Image2 | 北伐契丹 |
| wudai-e10 | 五代十国 | `assets/events/wudai/e10.jpg` | P0 | ready | GPT-Image2 | 陈桥兵变 |

**P0 已交付（2026-10-23）**：`wudai-cover` + `wudai-e01/e03/e05/e06/e08/e10` + `bg`（8 张）已生成并接入。24 张图片全部 1920×1080、401–590KB；抽样检查无文字/水印。`map-relief` 仍为可选缺失。

## 二、图片资源（P1 / P2）

| ID | 主题 | 路径 | 优先级 | 状态 | 提供方 | 备注 |
|---|---|---|---|---|---|---|
| wudai-e02 | 五代十国 | `assets/events/wudai/e02.jpg` | P1 | ready | GPT-Image2 | 后唐灭梁 |
| wudai-e04 | 五代十国 | `assets/events/wudai/e04.jpg` | P1 | ready | GPT-Image2 | 契丹灭晋 |
| wudai-e07 | 五代十国 | `assets/events/wudai/e07.jpg` | P1 | ready | GPT-Image2 | 三征南唐 |
| wudai-e09 | 五代十国 | `assets/events/wudai/e09.jpg` | P1 | ready | GPT-Image2 | 柴荣病逝 |
| suitang-cover | 隋唐 | `assets/ui/cover-suitang.jpg` | P1 | ready | GPT-Image2 | 首屏封面 |
| suitang-e01 | 隋唐 | `assets/events/suitang/e01.jpg` | P1 | ready | GPT-Image2 | 范阳起兵 |
| suitang-e02 | 隋唐 | `assets/events/suitang/e02.jpg` | P1 | ready | GPT-Image2 | 洛阳失守 |
| suitang-e03 | 隋唐 | `assets/events/suitang/e03.jpg` | P1 | ready | GPT-Image2 | 潼关失守 |
| suitang-e04 | 隋唐 | `assets/events/suitang/e04.jpg` | P1 | ready | GPT-Image2 | 长安陷落/马嵬驿 |
| suitang-e05 | 隋唐 | `assets/events/suitang/e05.jpg` | P1 | ready | GPT-Image2 | 灵武即位 |
| suitang-e06 | 隋唐 | `assets/events/suitang/e06.jpg` | P1 | ready | GPT-Image2 | 收复两京 |
| song-cover | 宋朝 | `assets/ui/cover-song.jpg` | P1 | ready | GPT-Image2 | 首屏封面 |
| song-e01 | 宋朝 | `assets/events/song/e01.jpg` | P2 | ready | GPT-Image2 | 辽军南下 |
| song-e02 | 宋朝 | `assets/events/song/e02.jpg` | P2 | ready | GPT-Image2 | 瀛州之战 |
| song-e03 | 宋朝 | `assets/events/song/e03.jpg` | P2 | ready | GPT-Image2 | 澶州亲征 |
| song-e04 | 宋朝 | `assets/events/song/e04.jpg` | P2 | ready | GPT-Image2 | 澶渊之盟 |

**规格**：1920×1080 JPEG，sRGB，16:9，无文字/水印/logo，单张 ≤ 600KB。
**来源**：AI 生成；主页/页脚统一声明；不逐图标注。
**替换**：图片放入路径后，把 `course/data/assets.js` 对应条目 `status` 改为 `ready`；`note` 可写生成日期/模型。

---

## 三、地图与疆域数据

| ID | 资源 | 当前实现 | 状态 | 谁来替换 | 验收 |
|---|---|---|---|---|---|
| M01 | 五代十国势力多边形 | 10 个 `polygon`，简化示意 | `approx` | 耿雨核对；DeepSeek/Claude 可调点 | 不自交、在 bounds 内、与教材地图大体一致 |
| M02 | 隋唐势力多边形 | 4 个 `polygon`（本轮未补，仍为 blob） | `placeholder` | DeepSeek/耿雨 | 至少唐廷、燕、回纥、吐蕃 |
| M03 | 宋朝势力多边形 | 3 个 `polygon`（本轮未补，仍为 blob） | `placeholder` | DeepSeek/耿雨 | 北宋、辽、定难军 |
| M04 | 地图快照 | `mapSnapshot: 约 955 年` | 完成 | 史实审核 | 与事件跨度差异在 UI 说明 |
| M05 | 未单列势力 | `map.omitted`：大理、吐蕃、河西、清源军 | 完成 | 史实审核 | 图例可见 |
| M06 | 河流 | 4 条示意折线 | `approx` | DeepSeek/耿雨 | 走向合理、标注不遮挡 |
| M07 | 地名 | 25 个 | `approx` | DeepSeek/耿雨 | 坐标在 bounds 内、名称正确 |
| M08 | 真实 DEM/地形纹理 | 未使用；程序化沙盘 | 未做 | 后续 M4 | 不影响 Demo |
| M09 | 历史地图授权/来源记录 | `docs/history/来源与许可核查.md` + `credits.sourceRecords` | 完成（参考级） | 取用者 | 站点、链接、参考图幅、访问日期、许可结论 |

**多边形来源说明**：`theme.wudai.js` 的 `regions[].sourceNote` 已写“示意、非精确边界”；正式使用前由历史组核对。**不能把多边形说成精确疆域。**

---

## 四、场景资源

| ID | 资源 | 当前实现 | 状态 | 谁来替换 | 验收 |
|---|---|---|---|---|---|
| S01 | 高平之战 war 兵棋推演 | `scene.js` + `theme.wudai.js#e06.scene` | 已完成（自动推演） | Claude | 9 省/6 单位/战线/兵力/战报正常；文字齐全 |
| S02 | 其他战役场景 | 未做 | 未做 | 后续 Claude | 复用 `war` 接口，只加省份/单位数据 |
| S03 | 朝堂辩论场景 | 未做 | 未做 | 后续 M4 | 新 `scene.type: "court"` |
| S04 | 建筑外观场景 | 未做 | 未做 | 后续 M4 | 新 `scene.type: "architecture"` |
| S05 | VR/第一人称 | 未做 | 未做 | 长期 | 不在 Demo 范围 |
| S06 | war 省份/边界/单位数据 | `theme.wudai.js#e06.scene` | 已完成（示意） | DeepSeek/耿雨核对 | 省份控制/兵力/战线为示意；不编造精确兵力 |

场景全部由程序化几何体生成，**不需要 GPT-Image2 出图**；不要把场景渲染图当作历史影像。战线由省份 owner 派生，不写手工关键帧。

---

## 五、其他资源

| ID | 资源 | 当前实现 | 状态 | 谁来替换 | 验收 |
|---|---|---|---|---|---|
| O01 | 项目名/Logo/印章 | 文字占位「史境」 | placeholder | 人类设计 | 不侵权、可替换 |
| O02 | 字体 | 系统宋体/楷体/无衬线 | 完成 | 可选授权字体 | 离线可用、授权明确 |
| O03 | 音效 | Web Audio 合成 | 完成（基础） | Claude | 可静音、无版权素材 |
| O04 | 背景音乐 | 无 | 未做 | 人类 | 可选、授权明确 |
| O05 | 视频/动画 | 无 | 未做 | 人类/Claude | 离线可播 |
| O06 | 世界史主题（一战/二战路线） | 无 | 未做 | 后续 | 只加数据，不改引擎 |
| O07 | 海报/汇报封面 | 无 | 未做 | 人类/GPT-Image2 | 不影响 Demo |

---

## 六、来源与许可检查

- **外部网站/地图**：`credits.sourceRecords` 已记录 Historiqly、wowhistorymap、historiamap、txlzp、《中国历史地图集》等；大部分是“参考，未复制图幅”，wowhistorymap/txlzp 访问超时未使用。
- **许可结论**：谁取用谁核实；无法确认就不用；耿雨只负责史实审核。
- **AI 图**：主页/页脚统一声明；不逐张标来源。
- **代码**：Three.js r147 / OrbitControls MIT；项目自有代码。
- **字体**：系统字体；无 Web Font。
- **音效**：Web Audio 合成；无外部音频。

---

## 七、替换流程

1. 确认资源来源/许可（外部资源）；无法确认就不落地。
2. 按路径放入文件；图片 1920×1080、16:9、无文字/水印、≤600KB。
3. 更新 `course/data/assets.js` 的 `status` / `note`。
4. 图片：跑一遍 `course/index.html`，确认卡片不破图、裁切合理。
5. 数据：多边形/事件字段改动后，用 Node vm 校验 schema、bounds、路线引用。
6. 更新 `docs/handoff/QA.md` 与 `docs/history/来源与许可核查.md`（如新增外部来源）。
7. 汇报前至少完成 P0 图片 + 五代十国多边形核对 + e06 场景回归。

---

## 八、阻塞项

1. **P0 图片已就绪**：24 张图片已接入；`map-relief` 可选缺失，不影响 Demo。正式汇报前仍建议人工过一遍文字/朝代/裁切。
2. **多边形未史实核对**：可以演示，但不能当精确疆域；需要耿雨核对。
3. **只有 e06 有场景**：如果老师期待“每个事件都能进场景”，需要提前说明是 M4 目标。
4. **隋唐/宋朝仍是示意 blob**：不影响切换演示，但不如五代十国完整。
5. **世界史主题未做**：如果评委问“一战二战路线”，说明引擎支持、内容后续补。
