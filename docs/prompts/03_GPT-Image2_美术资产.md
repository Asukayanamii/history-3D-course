# 03 · GPT-Image2 提示词：历史插画、封面与背景（v0.2）

> 用法：把本文件全文作为任务说明。能写文件时直接保存到 `course/assets/...` 并更新 `course/data/assets.js`；只能出图/输出文本时，按「文件名 + 英文提示词 + 中文说明」表格交付，不要假装文件已存在。
>
> **v0.2 更新（2026-10-23）**：
> - 3D 场景（`e06 高平之战`）由 `course/js/scene.js` 程序化生成，**不需要出图**；不要生成场景渲染图或带文字的地图。
> - 三个时期的图片脚本已存在：`docs/history/五代十国_图片脚本.md`、`隋唐_图片脚本.md`、`宋朝_图片脚本.md`；优先按它们生成。
> - 当前 `assets.js` 的 25 个图片/纹理条目全部为 `missing`；本轮先做 P0 八张。

---

## 角色

你是历史题材视觉总监 + 图像生成提示词工程师。你要为「三维历史沙盘」Demo 生成一套**风格统一、历史质感可信、无文字**的插画与封面，而不是游戏概念图或动漫插画。

## 当前任务

| 优先级 | 内容 | 数量 | 文件 |
|---|---|---|---|
| **P0** | 五代十国 6 张事件图 + 主题封面 + 全局背景 | **8** | `wudai-e01/e03/e05/e06/e08/e10` + `wudai-cover` + `bg` |
| P1 | 五代十国补 4 张 | 4 | `wudai-e02/e04/e07/e09` |
| P1 | 隋唐 6 张事件图 + 封面 | 7 | `suitang-e01…e06` + `suitang-cover` |
| P1 | 宋朝封面 | 1 | `song-cover` |
| P2 | 宋朝 4 张事件图 | 4 | `song-e01…e04` |
| P2 | 可选地图纹理 | 0–1 | `assets/map/relief-<主题>.jpg`（本轮不需要） |

**汇报最低线**：P0 八张（6 事件图 + `wudai-cover` + `bg`）。做完再按 P1 → P2 补。
**不要先做薄主题**；如果时间有限，隋唐/宋朝先用 CSS 占位，不阻塞 Demo。

## 先读

- `docs/history/五代十国_图片脚本.md`（10 个事件 + 封面的逐图 brief；**主依据**）
- `docs/history/隋唐_图片脚本.md`（6 个事件 + 封面）
- `docs/history/宋朝_图片脚本.md`（4 个事件 + 封面）
- `docs/prompts/00_协作总览与数据契约.md`（资源清单、命名、状态、来源规则）
- `docs/资源来源推测.md`（template 插画规格：1920×1080、AI 生成、无 EXIF；**只作风格宽泛参考，不要复制构图/内容/水印**）
- `course/data/assets.js`（25 条清单、优先级、状态）
- `course/data/theme.wudai.js`、`theme.suitang.js`、`theme.song.js`（事件标题/地点/人物，用于核对画面）

三份图片脚本已经写好；本文件的第五节是 P0 的现成英文提示词，第六节是 P1/P2 的对照表。**不要等 DeepSeek 再写脚本。**

---

## 一、硬性规则

1. **原创生成**：不要复制 template 的插画，不要复现其构图/水印/文字；不要把历史地图网站的图片作为图生图输入或拼贴素材。
2. **图片里不要出现任何可读文字**：不要旗号文字、诏书文字、地图标注、印章、签名、水印、logo。所有文字由引擎渲染。
3. **不生成带文字的地图**：历史地图由 Three.js 引擎绘制；你只生成场景插画。
4. **不生成 3D 场景图**：`e06 高平之战` 的 3D 场景由 `scene.js` 程序化生成；不要生成战场鸟瞰/沙盘渲染图当作场景素材。
5. **不生成真实人物肖像**：人物只作为历史角色，不特写正脸，不模仿演员/名人。
6. **不血腥**：战争场面可以紧张、宏大，但不出现断肢、伤口特写、尸体堆叠。
7. **历史质感优先**：朝代、服饰、甲胄、建筑、器物要对；不要清宫、日本武士、欧洲骑士、奇幻甲。
8. **统一风格**：同一套矿物颜料、笔触、光线、颗粒；不要一张油画、一张 3D 渲染、一张动漫。
9. **AI 声明由 Claude 负责**：你不需要在图上加「AI 生成」字样，也不要在每张图里做来源标注；主页会统一声明。
10. **外部资源**：如果使用了外部参考图/素材，必须记录来源与许可；无法确认就不用。不要使用来源不明的图。

---

## 二、视觉圣经

**一句话**：唐代壁画 × 历史油画 × 博物馆沙盘气质。

### 2.1 三个主题的前缀

**五代十国（P0/P1）**：

```text
Monumental historical reconstruction of medieval China (Five Dynasties and Ten Kingdoms), museum-quality narrative painting, mineral pigment palette of azurite blue, malachite green, cinnabar red, ochre, aged silk and ink-wash texture, dramatic chiaroscuro, cinematic wide 16:9 composition, visible brushwork, atmospheric dust and mist, restrained historical realism. No text, no calligraphy, no watermark, no logo, no modern objects, no fantasy armor, no anime, no cartoon, no 3D render, no plastic skin, no gore, no dismemberment, no identifiable real faces. Historical reconstruction, not a photograph.
```

**隋唐（P1）**：

```text
Monumental historical reconstruction of Tang dynasty China during the An Lushan Rebellion, 8th century, museum-quality narrative painting, mineral pigment palette of azurite blue, malachite green, cinnabar red, ochre, aged silk and ink-wash texture, dramatic chiaroscuro, cinematic wide 16:9 composition, visible brushwork, atmospheric dust and mist, restrained historical realism. No text, no calligraphy, no watermark, no logo, no modern objects, no fantasy armor, no anime, no cartoon, no 3D render, no plastic skin, no gore, no dismemberment, no identifiable real faces. Historical reconstruction, not a photograph.
```

**宋朝（P1/P2）**：

```text
Monumental historical reconstruction of Northern Song and Liao China in 1004, museum-quality narrative painting, mineral pigment palette of indigo, azurite blue, ochre, cinnabar red, aged silk and ink-wash texture, dramatic chiaroscuro, cinematic wide 16:9 composition, visible brushwork, atmospheric dust and mist, restrained historical realism. No text, no calligraphy, no watermark, no logo, no modern objects, no fantasy armor, no anime, no cartoon, no 3D render, no plastic skin, no gore, no dismemberment, no identifiable real faces. Historical reconstruction, not a photograph.
```

### 2.2 通用负面约束

```text
Avoid: text, Chinese characters, calligraphy, banners with legible writing, maps with labels, watermark, signature, logo, modern clothing, glasses, watches, zippers, firearms, cannons, neon, sci-fi, Japanese samurai armor, Qing dynasty queue, European medieval armor, Roman armor, fantasy, anime, cartoon, 3D render, plastic skin, oversaturated colors, gore, exposed wounds, dismemberment, real person likeness, celebrity, political symbols.
```

### 2.3 统一规格

- 最终交付：**1920×1080 JPEG，sRGB，16:9，质量 85–90，单张 300–600KB**。
- 如果模型只能出 1536×1024（3:2）：先按 16:9 安全框构图，裁到 1536×864，再放大到 1920×1080；不要把关键人物/建筑裁掉。
- 不要加边框、标题、字幕、水印、签名。
- 画面要有「可裁切余量」：主体不要贴边，封面/事件图上方或右侧留一点空间给标题/卡片叠字。

---

## 三、历史锚点（避免穿越）

| 主题 | 服饰/甲胄 | 建筑/场景 | 不要出现 |
|---|---|---|---|
| 五代十国 | 晚唐—五代幞头、圆领袍、札甲/明光铠、战马；契丹/辽用契丹服饰、皮裘、契丹甲胄，不是蒙古 | 汴州/洛阳城门、宫殿、节度使衙署、土城墙、烽燧、驿馆、军帐 | 清代官服/辫子、日本武士、欧洲城堡、火器、火炮 |
| 隋唐（安史之乱） | 盛唐幞头、圆领袍、襦裙、明光铠、陌刀/长枪；回纥骑兵用回纥服饰/甲胄 | 长安/洛阳里坊、宫殿、潼关山城、驿站、灵武土城 | 宋甲、清宫、日式天守阁、欧洲骑士 |
| 宋朝（澶渊之盟） | 北宋幞头、圆领袍、宋甲；辽用契丹甲胄/皮裘 | 汴京/澶州城墙、黄河渡口、军营、议和帐篷 | 清代辫子、明代锦衣卫、欧洲骑士、把 1004 年写成“西夏” |

**通用**：旗帜用颜色/抽象纹样，不要可读文字；器物不要出现玻璃杯、手表、眼镜、现代鞋；马具要符合时代。

---

## 四、P0 八张：可直接复制的英文提示词

> 每条 = 主题前缀 + 下面的 Scene 段落 + 通用负面约束。生成时把三段拼在一起。
> 文件名对应 `course/assets/...`；生成后更新 `assets.js` 的 `status`。

### 4.1 `wudai-cover` → `course/assets/ui/cover-wudai.jpg`

```text
A museum display sand table of Five Dynasties and Ten Kingdoms China, miniature walled cities, winding rivers, low mountain ridges, several small kingdoms separated by muted mineral-colored borders, a single warm beam of light falling on the center, distant beacon towers and thin smoke, top-down 30-40 degree view, the sand table occupies two thirds of the frame, the upper area kept dark for a title overlay, mineral pigments of azurite blue, malachite green, cinnabar red, ochre and sand gold, aged silk texture, low saturation, cinematic 16:9, no text, no labels, no modern objects, no identifiable faces. 1920x1080, museum-quality historical reconstruction.
```

### 4.2 `bg` → `course/assets/ui/bg.jpg`

```text
Abstract ink-wash mountain ridges and aged silk texture, deep teal, dark green and sand-gold, subtle grain and paper fibers, low contrast, no focal subject, the center slightly darker and the edges falling into shadow, generous empty space for UI overlays, cinematic 16:9, no text, no buildings, no figures, no modern objects. 1920x1080, museum-quality historical atmosphere.
```

### 4.3 `wudai-e01` → `course/assets/events/wudai/e01.jpg`（后梁代唐）

```text
Dawn at the gate of Bianzhou in 907, armored soldiers of the Later Liang entering the city, Tang banners being lowered, dust and mist, distant civilians, low-angle wide shot, the gate in the left middle ground, the column receding into the distance, cold blue-grey morning light with a few cinnabar banners, late Tang / Five Dynasties armor, fu-tou headwear, round-collar robes, rammed-earth and brick gate architecture, restrained historical realism, no gore, no identifiable faces. 1920x1080, cinematic 16:9.
```

### 4.4 `wudai-e03` → `course/assets/events/wudai/e03.jpg`（割让燕云）

```text
A northern mountain pass in late autumn, 936, Later Jin officials and Khitan envoys exchanging a rolled map scroll with no visible writing, armored guards standing on both sides, snow on distant peaks, cold wind and thin mist, the pass in the center-left, the two delegations facing each other, a tense diplomatic atmosphere, ochre, azurite blue and a little cinnabar, Five Dynasties official dress and Khitan fur-trimmed armor, no readable text, no maps with labels, no identifiable faces. 1920x1080, cinematic 16:9.
```

### 4.5 `wudai-e05` → `course/assets/events/wudai/e05.jpg`（后周建立）

```text
A plain wooden hall in Bianzhou, 951, Guo Wei seated in simple court dress, officials standing in two rows, rolled documents on a low desk with no readable writing, cold light falling through lattice windows, austere and restrained, no gold luxury, no dragon throne, Five Dynasties fu-tou and round-collar robes, wooden architecture, muted mineral pigments, no text, no identifiable faces. 1920x1080, cinematic 16:9.
```

### 4.6 `wudai-e06` → `course/assets/events/wudai/e06.jpg`（高平之战）

```text
Highland battlefield at dawn, 954, Later Zhou infantry forming a shield wall in the foreground, Northern Han and Khitan cavalry pressing in from the right, broken banners, dust and distant mountains, early spring mist and cold wind, low-angle epic wide shot, Later Zhou and Northern Han armor, spears, shields and warhorses, tense but not gory, no dismemberment, no identifiable faces. 1920x1080, cinematic 16:9.
```

### 4.7 `wudai-e08` → `course/assets/events/wudai/e08.jpg`（北伐契丹）

```text
Waqiao Pass in late autumn, 959, Later Zhou cavalry advancing north through the mountain gate, Khitan riders withdrawing in the distance, dry grass, long cold wind, the pass in the middle ground, riders moving toward the viewer, cold golden autumn light with a little cinnabar, Five Dynasties cavalry armor and Khitan armor, epic wide composition, no text, no identifiable faces. 1920x1080, cinematic 16:9.
```

### 4.8 `wudai-e10` → `course/assets/events/wudai/e10.jpg`（陈桥兵变）

```text
Chenqiao post station at dawn, 960, soldiers draping a yellow robe over a general, mist, horses, a semicircle of onlookers, no close-up faces, the yellow robe as the only warm color in a cold morning palette, low buildings of a post station, Five Dynasties armor and fu-tou, cinematic wide shot, restrained and tense, no text, no identifiable faces. 1920x1080, cinematic 16:9.
```

---

## 五、P1 / P2：按脚本生成

> 逐图 brief 以 `docs/history/隋唐_图片脚本.md`、`宋朝_图片脚本.md`、`五代十国_图片脚本.md` 为准；下表只给文件、优先级和画面核心，方便排期。

### 5.1 五代十国补 4 张（P1）

| 文件 | promptId | 画面核心 |
|---|---|---|
| `assets/events/wudai/e02.jpg` | `wudai-e02` | 923 年清晨，洛阳宫城庭院，后唐军取胜，后梁旗帜倒下，远处宫殿屋顶与烟尘；冷晨光，胜利但不欢庆。 |
| `assets/events/wudai/e04.jpg` | `wudai-e04` | 947 年阴天，汴州城门与街道，契丹骑兵入城，后晋旗帜倒下，远处百姓避让；灰冷、克制的混乱。 |
| `assets/events/wudai/e07.jpg` | `wudai-e07` | 956 年深秋雨夜，寿州城下与淮河，后周军过浮桥、攻城墙，火把、雨、城楼剪影；冷蓝夜色 + 火光。 |
| `assets/events/wudai/e09.jpg` | `wudai-e09` | 959 年夏夜，军帐内，柴荣病榻，案上地图与蜡烛（不可读），帐外将领等候；烛光暖、帐外冷。 |

### 5.2 隋唐 6 张 + 封面（P1）

| 文件 | promptId | 画面核心 |
|---|---|---|
| `assets/events/suitang/e01.jpg` | `suitang-e01` | 755 年范阳，边镇清晨，唐军集结，甲骑与步兵、旗阵、尘土；冷青 + 赭石。 |
| `assets/events/suitang/e02.jpg` | `suitang-e02` | 756 年洛阳，叛军入城，街道烟尘、避难人群、远处宫殿屋顶；灰黄烟尘。 |
| `assets/events/suitang/e03.jpg` | `suitang-e03` | 756 年潼关，山隘战场，唐军溃败，弃置兵器、战旗、崖壁与烟尘；冷灰山石。 |
| `assets/events/suitang/e04.jpg` | `suitang-e04` | 756 年马嵬驿，秋日山道，皇家队伍停滞，士兵围拢，轿辇与落叶；金褐秋色，压抑。 |
| `assets/events/suitang/e05.jpg` | `suitang-e05` | 756 年灵武，边城简陋即位礼，肃宗与将领、军旗、土城；冷晨光。 |
| `assets/events/suitang/e06.jpg` | `suitang-e06` | 757 年香积寺，黎明战场，唐军与回纥骑兵并肩，旗帜、薄雾、废墟与希望；冷雾 + 破晓金光。 |
| `assets/ui/cover-suitang.jpg` | `suitang-cover` | 盛唐长安鸟瞰：里坊、宫阙、远山、暮色金光；金褐 + 石青。 |

**P1 时间紧时的最低组合**：`suitang-e01`、`suitang-e03`、`suitang-e04`、`suitang-e06` + `suitang-cover`。

### 5.3 宋朝封面 + 4 张（P1 / P2）

| 文件 | promptId | 优先级 | 画面核心 |
|---|---|---|---|
| `assets/ui/cover-song.jpg` | `song-cover` | P1 | 1004 年汴京城墙与汴河，秋日暮色，城市繁华与北方战云并置；靛青 + 赭石。 |
| `assets/events/song/e01.jpg` | `song-e01` | P2 | 1004 年秋，辽军骑兵越过北方平原，尘烟、远处宋城墙；冷黄秋色。 |
| `assets/events/song/e02.jpg` | `song-e02` | P2 | 1004 年瀛州，城墙攻防，宋军守城、辽军骑兵与箭雨；灰冷 + 火光。 |
| `assets/events/song/e03.jpg` | `song-e03` | P2 | 1004 年澶州，黄河渡口，宋真宗亲征营帐、黄龙旗（无字）、军阵、冬日河面；冷蓝 + 少量金黄。 |
| `assets/events/song/e04.jpg` | `song-e04` | P2 | 1005 年清晨，议和帐篷，宋辽使者对坐，卷起的舆图（不可读）、烛火、卫士；帐内暖/帐外冷。 |

> **宋朝历史提醒**：1004 年西夏尚未建立（1038 年李元昊称帝）；图中不要出现“西夏”字样或西夏式标签，人物/服饰用北宋与辽/契丹。

### 5.4 P1 / P2 英文核心句

> 与对应主题前缀、通用负面约束拼接使用；详细构图/历史锚点仍以图片脚本为准。

```text
wudai-e02: Cold dawn in the courtyard of Luoyang palace, 923; Later Tang troops victorious, fallen Later Liang banners, smoke and distant palace roofs; restrained victory, no massacre.
wudai-e04: Overcast Bianzhou city gate and street, 947; Khitan cavalry entering, fallen Later Jin banners, dust, civilians retreating; cold grey, controlled chaos.
wudai-e07: Rainy autumn night at Shouzhou on the Huai River, 956; Later Zhou troops crossing a pontoon bridge and attacking the wall, torches, fortress silhouette; cold blue with warm firelight, restrained siege.
wudai-e09: Summer night inside a military tent, 959; Chai Rong on a sickbed, rolled maps and candles without readable text, generals waiting outside; warm candlelight against cold night, sorrow.
suitang-e01: Frontier garrison at dawn, Fanyang, 755; Tang troops assembling, armored cavalry and infantry, banners, dust; cold blue and ochre.
suitang-e02: Luoyang streets in the aftermath, 756; rebel troops entering, smoke, refugees, distant palace roofs; grey-yellow dust, controlled chaos.
suitang-e03: Mountain pass at Tongguan, 756; broken Tang army, abandoned weapons and banners, cliffs and dust; cold grey stone, restrained.
suitang-e04: Autumn mountain road at Mawei Station, 756; imperial procession halted, soldiers gathering, palanquin and falling leaves; golden-brown, oppressive, no faces.
suitang-e05: Frontier town of Lingwu, 756; simple enthronement of Emperor Suzong, generals and banners before earthen walls; cold morning light, austere.
suitang-e06: Dawn battlefield near Xiangji Temple, 757; Tang and Uyghur cavalry advancing together, banners, mist and ruins; cold mist with dawn gold.
suitang-cover: High-angle view of Tang Chang'an at dusk; wards, palace roofs, distant mountains, golden haze; prosperous but uneasy; mineral pigments.
song-cover: Bianjing city wall and river at autumn dusk, 1004; city prosperity and northern war clouds; indigo and ochre.
song-e01: Northern Song plain in autumn, 1004; Liao cavalry advancing, dust, distant Song walls; cold yellow.
song-e02: Yingzhou city wall under attack, 1004; Song defenders, Liao cavalry and arrows, smoke; grey cold with firelight.
song-e03: Yellow River ford at Chanzhou, 1004; Song imperial camp, yellow dragon banner without text, troops, winter river; cold blue with gold.
song-e04: Treaty tent at dawn, 1005; Song and Liao envoys seated, rolled map without text, candles, guards; warm interior vs cold exterior.
```

---

## 六、工作流

1. **风格测试（先做 3 张）**：`wudai-cover`、`wudai-e01`、`wudai-e08`。
   - 检查：风格是否统一、是否无文字、是否像历史复原而非游戏概念图、是否有朝代错误。
2. **确认后批量 P0**：再做 `wudai-e03`、`wudai-e05`、`wudai-e06`、`wudai-e10`、`bg`。
3. **P1 五代十国**：`wudai-e02/e04/e07/e09`。
4. **P1 隋唐**：`suitang-e01…e06` + `suitang-cover`；时间紧按最低组合。
5. **P1 宋朝封面 + P2 宋朝事件**：`song-cover`、`song-e01…e04`。
6. **背景最后做**：`bg.jpg` 确保暗部够暗、中心不抢主体。
7. **每张 QA**：文字、朝代、血腥、构图裁切、文件大小；不合格重生成，不要用“差不多”的图。
8. **交付记录**：保存文件；更新 `assets.js` 的 `status` 为 `ready`，`note` 写生成日期/模型（内部记录即可）；写 `docs/history/图片生成记录.md`（可选）。

---

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

---

## 八、交付方式

### 模式 A：能写文件

- 直接保存到上表路径；覆盖同名占位文件（如果存在）。
- 更新 `course/data/assets.js` 对应条目的 `status: "ready"`；`note` 写「YYYY-MM-DD / 模型名」。
- 写 `docs/history/图片生成记录.md`：文件名、promptId、生成日期、模型、备注（可选）。
- 不要改 `theme.*.js` 的事件文字；不要改代码。

### 模式 B：只能出图/输出文本

- 输出表格：`文件名 | promptId | 英文提示词 | 中文说明 | 优先级`。
- 明确写「未写入仓库，需人工保存」；不要声称文件已存在。
- 如果只能一次出少量图，按 P0 → P1 → P2 顺序，不要先做薄主题。
- 每张图至少给出：主题前缀、Scene、Composition、Lighting、Historical accuracy、Avoid；不要只写“请生成一张高平之战”。

---

## 九、验收清单

1. 文件尺寸 1920×1080、16:9、JPEG、sRGB；单张 ≤ 600KB。
2. 画面无文字、无书法、无旗号可读字样、无地图标注、无水印、无签名、无 logo。
3. 风格统一：同一套矿物色、笔触、光线、颗粒；不混入动漫/3D 渲染/照片。
4. 朝代正确：五代十国不出现清宫/日本武士/欧洲骑士/火器；宋辽不出现清代辫子。
5. 战争克制：无血腥、无断肢、无伤口特写、无尸体堆叠。
6. 人物不特写正脸，不像真实名人；不把赵匡胤、柴荣、郭威画成演员脸。
7. 构图有裁切余量：主体不贴边，封面/背景上方留标题空间。
8. 不复制 template 插画、不复制历史地图网站图片。
9. P0 八张齐全：`wudai-e01/e03/e05/e06/e08/e10` + `wudai-cover` + `bg`。
10. `assets.js` 状态已更新（模式 A）；没有把 AI 图说成历史影像。

---

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
