# 03 · GPT-Image2 提示词：历史插画、封面与背景

> 用法：把本文件全文作为任务说明。能写文件时直接保存到 `course/assets/...` 并更新 `course/data/assets.js`；只能出图/输出文本时，按「文件名 + 英文提示词 + 中文说明」表格交付，不要假装文件已存在。
>
> **v0.2 更新（2026-10-23）**：3D 场景（`e06 高平之战`）由 `scene.js` 程序化生成，**不需要 GPT-Image2 出图**；不要生成场景渲染图或带文字的地图。你仍然只负责事件插画/封面/背景。

---

## 角色

你是历史题材视觉总监 + 图像生成提示词工程师。你要为「三维历史沙盘」Demo 生成一套**风格统一、历史质感可信、无文字**的插画与封面，而不是做游戏概念图或动漫插画。

## 任务

为三个时期生成图片，重点是**五代十国**：

| 优先级 | 内容 | 数量（最低 → 推荐） |
|---|---|---|
| P0 | 五代十国事件插画 + 主题封面 | 6 张事件图 + 1 封面 → 10 张事件图 + 1 封面 |
| P1 | 隋唐（安史之乱）事件插画 + 封面 | 3 张 + 1 封面 → 6 张 + 1 封面 |
| P2 | 宋朝（澶渊之盟）事件插画 + 封面 | 3 张 + 1 封面 → 4 张 + 1 封面 |
| P0 | 全局背景 `bg.jpg` | 1 张 |

**最低可汇报**：五代十国 6 张事件图 + 封面 + 全局背景；隋唐/宋朝可先用 CSS 占位，不阻塞 Demo。有余力再补齐。

最低 6 张建议优先做：`wudai-e01`（后梁代唐）、`wudai-e03`（割让燕云）、`wudai-e05`（后周建立）、`wudai-e06`（高平之战）、`wudai-e08`（北伐契丹）、`wudai-e10`（陈桥兵变）；再加 `wudai-cover` 和 `bg`。这 8 张就能支撑一次完整汇报。

## 先读

- `docs/prompts/00_协作总览与数据契约.md`（资源清单、命名、状态、来源规则）
- `docs/资源来源推测.md`（template 插画的规格与视觉特征：1920×1080、AI 生成、无 EXIF、厚涂历史插画；**不要复制其构图/内容/水印**）
- `docs/history/五代十国_图片脚本.md`（DeepSeek 的逐事件画面 brief，优先使用）
- `docs/history/隋唐_宋朝_资料包.md`（两个薄主题的 brief）
- `course/data/theme.wudai.js`、`theme.suitang.js`、`theme.song.js`（事件 ID、标题、地点）
- `course/data/assets.js`（文件名、promptId、优先级）

如果 DeepSeek 的图片脚本还没生成，使用本文件第六节的 fallback 提示词。

## 一、硬性规则

1. **原创生成**：不要复制 template 的插画、不要复现其构图/水印/文字；不要把历史地图网站的图片作为图生图输入或拼贴素材。
2. **图片里不要出现任何可读文字**：不要旗号文字、诏书文字、地图标注、印章、签名、水印、logo。所有文字由引擎渲染。
3. **不生成带文字的地图**：历史地图由 Three.js 引擎绘制；你只生成场景插画。
4. **不生成真实人物肖像**：人物只作为历史角色，不特写正脸，不模仿演员/名人。
5. **不血腥**：战争场面可以紧张、宏大，但不出现断肢、伤口特写、尸体堆叠。
6. **历史质感优先**：朝代、服饰、甲胄、建筑、器物要对；不要清宫、日本武士、欧洲骑士、奇幻甲。
7. **统一风格**：同一套矿物颜料、笔触、光线、颗粒；不要一张油画、一张 3D 渲染、一张动漫。
8. **AI 声明由 Claude 负责**：你不需要在图上加「AI 生成」字样，也不要在每张图里做来源标注；主页会统一声明。
9. **外部资源**：如果使用了外部参考图/素材，必须记录来源与许可；无法确认就不用。不要使用来源不明的图。

## 二、视觉圣经（所有图共用）

**一句话**：唐代壁画 × 历史油画 × 博物馆沙盘气质。

**Master style prompt（英文，放在每条提示词前面）**：

```text
Monumental historical reconstruction of medieval China (Tang, Five Dynasties, Northern Song), museum-quality narrative painting, mineral pigment palette of azurite blue, malachite green, cinnabar red, ochre, aged silk and ink-wash texture, dramatic chiaroscuro, cinematic wide 16:9 composition, visible brushwork, atmospheric dust and mist, restrained historical realism. No text, no calligraphy, no watermark, no logo, no modern objects, no fantasy armor, no anime, no cartoon, no 3D render, no plastic skin, no gore, no dismemberment, no identifiable real faces. Historical reconstruction, not a photograph.
```

**通用负面约束（放在每条提示词末尾）**：

```text
Avoid: text, Chinese characters, calligraphy, banners with legible writing, maps with labels, watermark, signature, logo, modern clothing, glasses, watches, zippers, firearms, neon, sci-fi, Japanese samurai armor, Qing dynasty queue, European medieval armor, Roman armor, fantasy, anime, cartoon, 3D render, plastic skin, oversaturated colors, gore, exposed wounds, dismemberment, real person likeness, celebrity, political symbols.
```

**统一规格**：

- 最终交付：**1920×1080 JPEG，sRGB，16:9，质量 85–90，单张 300–600KB**。
- 如果模型只能出 1536×1024（3:2）：先按 16:9 安全框构图，裁到 1536×864，再放大到 1920×1080；不要把关键人物/建筑裁掉。
- 不要加边框、标题、字幕、水印、签名。
- 画面要有「可裁切余量」：主体不要贴边，右侧/上方留一点空间给卡片/标题叠字。

## 三、历史锚点（避免穿越）

| 主题 | 服饰/甲胄 | 建筑/场景 | 不要出现 |
|---|---|---|---|
| 五代十国 | 晚唐—五代幞头、圆领袍、札甲/明光铠、战马；契丹/辽用契丹服饰与甲胄，不是蒙古 | 汴州/洛阳城门、宫殿、节度使衙署、土城墙、烽燧 | 清代官服、日本武士、欧洲城堡、火器 |
| 隋唐（安史之乱） | 盛唐幞头、圆领袍、襦裙、明光铠、陌刀/长枪 | 长安/洛阳里坊、宫殿、潼关山城、驿站 | 宋甲、清宫、日式天守阁 |
| 宋朝（澶渊之盟） | 北宋幞头、圆领袍、宋甲；辽用契丹甲胄 | 汴京/澶州城墙、黄河渡口、军营、议和帐篷 | 清代辫子、明代锦衣卫、欧洲骑士 |

**通用**：旗帜用颜色/抽象纹样，不要可读文字；器物不要出现玻璃杯、手表、眼镜、现代鞋；马具要符合时代。

## 四、逐图提示词

> 下面每条都可以直接与「Master style prompt」和「通用负面约束」拼接。`[Scene]` 是核心画面；`[Composition]` 是构图；`[Light]` 是光线/色调。DeepSeek 的图片脚本如果更细，以它为准。

### 4.1 五代十国（P0）

| 文件 | promptId | 场景 | 构图/光线 |
|---|---|---|---|
| `assets/events/wudai/e01.jpg` | `wudai-e01` | 907 年清晨，汴州城门开启，后梁军队入城，唐旗降下，远处百姓与尘土；不聚焦个体面孔。 | 低机位广角，城门左中景，队伍向纵深延伸；冷青灰晨光 + 少量朱砂旗帜。 |
| `assets/events/wudai/e02.jpg` | `wudai-e02` | 923 年，洛阳宫城庭院，后唐军队取胜，倒地/降下的后梁旗帜，远处宫殿屋顶与烟尘。 | 中远景，宫墙形成纵深；冷晨光，胜利但不欢庆。 |
| `assets/events/wudai/e03.jpg` | `wudai-e03` | 936 年，北方山口关城，后晋官员与契丹使者交换卷起的舆图（不可读），甲士列阵，远山有雪。 | 宽幅，关城在中央偏左，双方分立；秋末冷光，紧张外交感。 |
| `assets/events/wudai/e04.jpg` | `wudai-e04` | 947 年，汴州城门与街道，契丹骑兵入城，后晋旗帜倒下，烟尘与远处百姓。 | 低机位，城门压迫感；灰冷色调，克制的混乱。 |
| `assets/events/wudai/e05.jpg` | `wudai-e05` | 951 年，汴州简朴朝堂，郭威即位，官员列班，案上文书（不可读），没有奢华装饰。 | 对称中景，窗棂投下冷光；朴素、克制。 |
| `assets/events/wudai/e06.jpg` | `wudai-e06` | 954 年高平，山地战场，后周步兵结阵抵挡北汉/契丹骑兵，断旗、尘土、远山。 | 广角低机位，盾墙在前景，骑兵从右侧压来；晨雾，紧张但不血腥。 |
| `assets/events/wudai/e07.jpg` | `wudai-e07` | 956 年寿州，淮河夜战，后周军队过浮桥、攻城墙，火把、雨、城楼剪影。 | 夜景宽幅，河面反光，火光为暖点；克制的攻城。 |
| `assets/events/wudai/e08.jpg` | `wudai-e08` | 959 年瓦桥关，后周骑兵北出关隘，契丹骑兵在远处退去，秋草、关城、长风。 | 史诗广角，关隘在中景，骑兵向画面前方；冷金秋色。 |
| `assets/events/wudai/e09.jpg` | `wudai-e09` | 959 年夜，军帐内，柴荣病榻，案上地图与蜡烛（不可读），帐外将领等候，悲伤与不确定。 | 近景但不特写正脸，烛光暖、帐外冷；明暗对比。 |
| `assets/events/wudai/e10.jpg` | `wudai-e10` | 960 年清晨，陈桥驿，士兵把黄袍披在将军身上，雾气、战马、围观军士，不聚焦正脸。 | 中远景，人群形成半圆；冷晨光 + 黄袍作为唯一暖色。 |
| `assets/ui/cover-wudai.jpg` | `wudai-cover` | 一张巨大的「五代十国沙盘」：微缩城墙、河流、山脊、多个小政权色块，一束暖光打在中央，远处有烽燧与烟。 | 俯视 30–40°，沙盘占画面 2/3，上方留暗部叠标题；矿物色、博物馆展陈感。 |
| `assets/ui/bg.jpg` | `bg` | 抽象水墨山脊 + 旧绢纹理 + 细微沙粒，深青/墨绿/沙金，低对比，无主体。 | 全幅 16:9，中心稍暗，四周留 UI 空间；不要文字/建筑。 |

**e01 英文提示词示例**：

```text
Dawn at the gate of Bianzhou in 907, armored soldiers of the Later Liang entering the city, Tang banners being lowered, dust and mist, distant civilians, low-angle wide shot, cold blue-grey morning light with a few cinnabar banners, late Tang / Five Dynasties armor and gate architecture, monumental historical reconstruction, mineral pigment palette, aged silk texture, cinematic 16:9. No text, no watermark, no modern objects, no gore, no identifiable faces.
```

### 4.2 隋唐（P1）

| 文件 | promptId | 场景 | 构图/光线 |
|---|---|---|---|
| `assets/events/suitang/e01.jpg` | `suitang-e01` | 755 年范阳，边镇清晨，唐军集结，甲骑与步兵、旗阵、尘土，空气中的紧张。 | 广角，营垒与队列形成纵深；冷青 + 赭石地。 |
| `assets/events/suitang/e02.jpg` | `suitang-e02` | 756 年洛阳，叛军入城，街道烟尘、避难人群、远处宫殿屋顶，克制的混乱。 | 中远景，街道透视线；灰黄烟尘。 |
| `assets/events/suitang/e03.jpg` | `suitang-e03` | 756 年潼关，山隘战场，唐军溃败，弃置兵器、战旗、崖壁与烟尘。 | 高机位俯看关隘；冷灰山石，少量朱砂。 |
| `assets/events/suitang/e04.jpg` | `suitang-e04` | 756 年马嵬驿，秋日山道，皇家队伍停滞，士兵围拢，轿辇与落叶，不聚焦正脸。 | 侧逆光，山道曲线；金褐秋色，压抑。 |
| `assets/events/suitang/e05.jpg` | `suitang-e05` | 756 年灵武，边城简陋即位礼，肃宗与将领、军旗、土城，寒冷而坚定。 | 中景，土城与旗阵；冷晨光。 |
| `assets/events/suitang/e06.jpg` | `suitang-e06` | 757 年香积寺，黎明战场，唐军与回纥骑兵并肩，旗帜、薄雾、废墟与希望。 | 史诗广角，骑兵从左侧推进；冷雾 + 破晓金光。 |
| `assets/ui/cover-suitang.jpg` | `suitang-cover` | 盛唐长安鸟瞰：里坊、宫阙、远山、暮色金光，繁华中带一丝不安。 | 高机位俯瞰，城市纵深；金褐 + 石青。 |

### 4.3 宋朝（P2）

| 文件 | promptId | 场景 | 构图/光线 |
|---|---|---|---|
| `assets/events/song/e01.jpg` | `song-e01` | 1004 年秋，辽军骑兵越过北方平原，尘烟、远处宋城墙，南下之势。 | 低机位广角，骑兵从右向左；冷黄秋色。 |
| `assets/events/song/e02.jpg` | `song-e02` | 1004 年瀛州，城墙攻防，宋军守城、辽军骑兵与箭雨，城楼、烟尘。 | 中远景，城墙横贯画面；灰冷 + 火光。 |
| `assets/events/song/e03.jpg` | `song-e03` | 1004 年澶州，黄河渡口，宋真宗亲征营帐、黄龙旗（无字）、军阵、冬日河面。 | 宽幅，河与营帐分层；冷蓝 + 少量金黄。 |
| `assets/events/song/e04.jpg` | `song-e04` | 1005 年清晨，议和帐篷，宋辽使者对坐，卷起的舆图（不可读）、烛火、戒备的卫士。 | 对称构图，帐内暖光/帐外冷光；克制的和平。 |
| `assets/ui/cover-song.jpg` | `song-cover` | 1004 年汴京城墙与汴河，秋日暮色，城市繁华与北方战云并置。 | 高机位，城墙/河道/城市三层；靛青 + 赭石。 |

## 五、工作流

1. **风格测试**：先做 3 张——`cover-wudai`、`wudai-e01`、`wudai-e08`。检查：风格是否统一、是否无文字、是否像历史复原而非游戏概念图、是否有朝代错误。
2. **人工/团队确认**：风格通过后再批量；不通过就只改 master prompt 的媒介/色调，不要每次换风格。
3. **批量 P0**：先做五代十国 6–10 张事件图 + 封面。
4. **批量 P1/P2**：隋唐、宋朝各 3–6 张 + 封面；如果时间紧，薄主题先用 CSS 占位。
5. **背景**：`bg.jpg` 最后做，确保暗部够暗、中心不抢主体。
6. **QA**：逐张检查文字、朝代、血腥、构图裁切、文件大小；不合格重生成，不要用“差不多”的图。
7. **交付**：保存文件；更新 `assets.js` 的 `status` 为 `ready`，在 `note` 写生成日期/模型（内部记录即可）；写 `docs/history/图片生成记录.md`（可选，但建议保留）。

## 六、Fallback 提示词（DeepSeek 脚本未就绪时）

如果 `docs/history/五代十国_图片脚本.md` 还不存在，直接用上面的逐图表。若需要更短的可复制版本，使用下面的模板：

```text
[Master style prompt]

Scene: [从第四节表格复制场景].
Composition: [构图].
Lighting/palette: [光线/色调].
Historical accuracy: [朝代/服饰/建筑锚点].
16:9, 1920x1080, museum-quality historical reconstruction.

Avoid: text, Chinese characters, calligraphy, banners with legible writing, maps with labels, watermark, signature, logo, modern clothing, glasses, watches, zippers, firearms, neon, sci-fi, Japanese samurai armor, Qing dynasty queue, European medieval armor, Roman armor, fantasy, anime, cartoon, 3D render, plastic skin, oversaturated colors, gore, exposed wounds, dismemberment, real person likeness, celebrity, political symbols.
```

## 七、文件命名与规格

| 类型 | 路径 | 规格 |
|---|---|---|
| 五代十国事件 | `course/assets/events/wudai/e01.jpg` … `e10.jpg` | 1920×1080 JPEG, sRGB, 16:9, 300–600KB |
| 隋唐事件 | `course/assets/events/suitang/e01.jpg` … `e06.jpg` | 同上 |
| 宋朝事件 | `course/assets/events/song/e01.jpg` … `e04.jpg` | 同上 |
| 主题封面 | `course/assets/ui/cover-wudai.jpg`、`cover-suitang.jpg`、`cover-song.jpg` | 同上；上方/中心留标题叠字空间 |
| 全局背景 | `course/assets/ui/bg.jpg` | 同上；低对比、暗部足够 |
| 可选地图纹理 | `course/assets/map/...` | 本轮不需要；不要生成带文字的地图 |

**不要**用中文文件名、空格、括号；统一小写 ASCII。

## 八、交付方式

### 模式 A：能写文件

- 直接保存到上表路径；覆盖同名占位文件。
- 更新 `course/data/assets.js` 对应条目的 `status: "ready"`；`note` 写「YYYY-MM-DD / 模型名」。
- 写 `docs/history/图片生成记录.md`：文件名、promptId、生成日期、模型、备注（可选）。
- 不要改 `theme.*.js` 的事件文字；不要改代码。

### 模式 B：只能出图/输出文本

- 输出表格：`文件名 | promptId | 英文提示词 | 中文说明 | 优先级`。
- 明确写「未写入仓库，需人工保存」；不要声称文件已存在。
- 如果只能一次出少量图，按 P0 → P1 → P2 顺序，不要先做薄主题。

## 九、验收清单

1. 文件尺寸 1920×1080、16:9、JPEG、sRGB；单张 ≤ 600KB。
2. 画面无文字、无书法、无旗号可读字样、无水印、无签名、无 logo。
3. 风格统一：同一套矿物色、笔触、光线、颗粒；不混入动漫/3D 渲染/照片。
4. 朝代正确：五代十国不出现清宫/日本武士/欧洲骑士；宋辽不出现清代辫子。
5. 战争克制：无血腥、无断肢、无伤口特写。
6. 人物不特写正脸，不像真实名人。
7. 构图有裁切余量：主体不贴边，封面/背景上方留标题空间。
8. 不复制 template 插画、不复制历史地图网站图片。
9. 五代十国 P0 至少 6 张事件图 + 封面；全局背景 1 张。
10. `assets.js` 状态已更新（模式 A）；没有把 AI 图说成历史影像。

## 十、禁止事项

- 不生成带文字的地图、诏书、旗号、印章。
- 不加水印、签名、logo、边框、字幕。
- 不复制 template 的插画、构图、水印。
- 不使用来源不明的外部图片做图生图/拼贴；要用就先核实许可并记录。
- 不生成真实人物肖像、名人脸、政治符号。
- 不生成血腥、断肢、尸体堆叠。
- 不把清代/日本/欧洲的服饰建筑混进唐、五代、宋。
- 不把 AI 图说成历史照片；主页统一声明由 Claude 负责即可，不需要你在图上写字。
- 不生成 3D 场景渲染图/战场鸟瞰图当作场景素材；场景由 `scene.js` 程序化生成。
