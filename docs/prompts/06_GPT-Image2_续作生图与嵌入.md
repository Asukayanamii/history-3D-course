# 06 · GPT-Image2 续作：生图 + 嵌入提示词

> 用法：把本文件整段交给能生图、且能读写本仓库的 GPT；如果它只能生图，就让它输出“文件名 + 英文提示词 + 中文说明”，由人保存后再让编码 Agent 按第 6 节嵌入。
> 前置：`docs/prompts/04_GPT-Image2_VR全景.md`、`docs/handoff/DEM_SOURCES.md`、`course/README.md`。
> 原则：AI 艺术复原示意，不是历史影像；真 360° 全景不是 16:9 海报拉伸；不生成可读文字/旗号/地图标注。

---

## 1. 你的角色

你是本项目的图像资产负责人。目标不是“多出图”，而是补齐当前仍缺的、会被引擎直接引用的图片，并把它们正确登记到离线课件里。

当前已经完成：
- 24 张 1920×1080 事件插画/封面/背景（`course/assets/events/`、`course/assets/ui/`）。
- 21 张 4096×2048 的 2:1 全景**示意**（`course/assets/vr/`），由 16:9 插画扩展生成，不是实拍/真全景。
- `course/assets/events/wudai/e11.jpg` 是程序化朝堂占位图（`status:"placeholder"`）。

本轮要补：
1. `wudai/e11 世宗改革` 的 1920×1080 真插画。
2. 重点场景的**真 2:1 等距柱状全景**（4096×2048），替换同名扩展示意。
3. 把新文件登记进 `course/data/assets.js`，调整 `vr.hotspots`，确保离线可用。

> 3D 战场/朝堂里的小人、血条、占地网格、名牌全部由 Three.js/Canvas 程序化生成，不需要出图；不要为这些功能生成贴图。

---

## 2. 文件与规格（硬约束）

| 类型 | 路径 | 规格 |
|---|---|---|
| 事件插画 | `course/assets/events/<theme>/<event>.jpg` | 1920×1080，16:9，JPEG，sRGB，≤600KB |
| 真 360 全景 | `course/assets/vr/<theme>/<event>.jpg` | 4096×2048，2:1 equirectangular，JPEG，sRGB，≤1.2MB |
| 封面/背景 | `course/assets/ui/...` | 按 `assets.js` 现有 spec；本轮不新增 |

- 无文字、无书法、无水印、无 logo、无签名、无可识别真实人物长相。
- 战争克制，不血腥；不做断肢/伤口特写。
- 服饰/建筑锚点：晚唐—五代幞头、圆领袍、札甲、明光铠、战马、土城墙/木构；契丹/辽用契丹服饰与甲胄；**不要**明清宫城、黄琉璃瓦、清代辫子、日本武士甲、欧洲骑士甲、火器/火炮。
- 真全景：地平线在高度 50% 附近；左右边缘可无缝相接；顶部天空/底部地面；不要主体正好压在 x=0/100%；不要鱼眼、海报式构图、可见接缝。

---

## 3. P0：`wudai/e11` 事件插画（16:9）

文件：`course/assets/events/wudai/e11.jpg`（替换当前占位图）

**中文 brief**：
> 955 年起，后周世宗柴荣在汴州简朴朝堂与大臣议政：整顿禁军、均定田赋、限制佛教、编定刑统、疏浚漕运。画面时刻为冬晨/阴天，木柱、帷幕、屏风、烛台、香炉；柴荣在御座，文官两侧列班，禁军将领在侧；案上卷起文书（不可读）。构图对称中景，上方留梁柱暗部，不要金碧辉煌的明清宫殿；冷青灰 + 少量烛光暖色；矿物颜料，低饱和；人物只写角色，不特写正脸。

**English prompt**：
```text
Monumental historical reconstruction of a Five Dynasties (955 CE) Later Zhou court council in Bianzhou,
emperor Chai Rong seated at a simple wooden throne, civil officials in futou caps and round-collar robes,
a general in lamellar armor, wooden pillars, curtains, a dark green screen, candles and an incense burner,
rolled documents without legible writing, cold winter morning light with a few warm candle accents,
symmetrical medium-wide composition, low saturated mineral pigments, aged silk and ink-wash texture,
restrained historical realism, no text, no calligraphy, no watermark, no logo, no modern objects,
no Ming/Qing palace, no yellow glazed tiles, no Japanese samurai armor, no European medieval armor,
no anime, no cartoon, no 3D render, no identifiable real faces, no gore. Historical reconstruction, not a photograph.
```

**Negative prompt**：
```text
text, Chinese characters, calligraphy, readable documents, banners with writing, watermark, signature, logo,
modern clothing, glasses, watches, firearms, cannons, neon, sci-fi, Japanese samurai armor, Qing queue,
European medieval armor, Roman armor, fantasy, anime, cartoon, 3D render, plastic skin, oversaturated colors,
gore, exposed wounds, dismemberment, real person likeness, celebrity, Ming/Qing palace, yellow glazed tiles
```

---

## 4. P0/P1：真 2:1 全景（4096×2048）

> 这些要作为“环境”生成，不是把 16:9 插画拉成 2:1。中央主体只占一部分，四周都要有可看的景物；左右能接上。

### 4.1 `wudai/e06` 高平之战

文件：`course/assets/vr/wudai/e06.jpg`

- 环境：954 年早春，山西高平山地河谷，晨雾，远处太行山脊；后周步兵盾阵、将旗、战马；北汉/辽骑兵从侧翼压来。
- 360° 布局：正面=后周盾阵与将旗；左侧=山坡上的后周督战位置；右侧=北汉/辽骑兵；背后=河谷与远山。
- 锚点：五代札甲、明光铠、长枪/刀/盾、战马；不血腥；无火器。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
954 CE Battle of Gaoping, early spring mountain valley in Shanxi, dawn mist, distant Taihang ridges,
Later Zhou infantry shield wall and command banners in front, Northern Han and Liao cavalry on the flanks,
a command position on the left slope, river valley and mountains behind, trampled grass and dust,
monumental historical reconstruction, mineral pigment palette, low saturation, cinematic atmospheric mist,
no text, no calligraphy, no watermark, no logo, no modern objects, no firearms, no cannons,
no Japanese samurai armor, no European medieval armor, no fantasy, no anime, no 3D render,
no gore, no exposed wounds, no identifiable real faces. Historical reconstruction, not a photograph.
```

### 4.2 `wudai/e11` 世宗改革朝堂

文件：`course/assets/vr/wudai/e11.jpg`

- 环境：五代汴州简朴朝堂内部；正面御座与屏风，左右文官，背后入口/廊柱，顶部梁架/暗色顶棚。
- 锚点：木柱、帷幕、屏风、烛台、香炉、卷轴；不要明清宫殿。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
interior of a simple Five Dynasties court hall in Bianzhou, 955 CE,
emperor's wooden throne and dark green screen at the front, civil officials in futou caps and round-collar robes
on both sides, wooden pillars, curtains, candles, incense burner, rolled documents without writing,
dark timber beams above, cold winter morning light with warm candle accents, restrained mineral pigments,
no text, no calligraphy, no watermark, no logo, no modern objects, no Ming/Qing palace, no yellow glazed tiles,
no Japanese samurai armor, no European medieval armor, no fantasy, no anime, no 3D render,
no identifiable real faces. Historical reconstruction, not a photograph.
```

### 4.3 `wudai/e07` 三征南唐

文件：`course/assets/vr/wudai/e07.jpg`

- 环境：955—958 年，深秋雨夜，寿州城下与淮河浮桥；城墙、城楼、火把、雨雾、战船/浮桥。
- 360° 布局：正面=寿州城墙与城门；左侧=淮河与浮桥；右侧=后周军营/攻城器械；背后=雨夜河面。
- 锚点：五代水军、浮桥、攻城器械、札甲；不要火炮/爆炸。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
951-958 CE siege of Shouzhou, late autumn rainy night, Huai River and pontoon bridge,
city wall and gate tower in front, river and bridge on the left, Later Zhou camp and siege engines on the right,
torches, rain mist, war boats, muddy banks, cold blue night with warm firelight accents,
Five Dynasties armor and shields, no firearms, no cannons, no explosions, no gore,
no text, no watermark, no logo, no modern objects, no anime, no 3D render, no identifiable real faces.
```

### 4.4 `wudai/e08` 北伐契丹

文件：`course/assets/vr/wudai/e08.jpg`

- 环境：959 年深秋清晨，瓦桥关与燕山；关城、秋草、后周骑兵、辽军远退。
- 360° 布局：正面=关城；左右=后周骑兵/辽军；背后=燕山山脊与长风。
- 锚点：五代骑兵甲胄、契丹甲胄、关城；不要清代八旗。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
959 CE Waqiao Pass in late autumn, cold golden morning light, Yan Mountains,
border pass and gate in front, Later Zhou cavalry advancing on both sides, Liao cavalry receding in the distance,
dry autumn grass, long wind, dust, stone-and-earth fortifications, Five Dynasties and Khitan armor,
no text, no watermark, no logo, no modern objects, no Qing banners, no Japanese samurai armor,
no European medieval armor, no gore, no anime, no 3D render, no identifiable real faces.
```

### 4.5 `song/e03` 澶州亲征

文件：`course/assets/vr/song/e03.jpg`

- 环境：1004 年冬，黄河渡口与澶州城楼；河雾、浮桥、宋军阵列、城楼。
- 360° 布局：正面=澶州城楼；左侧=黄河/浮桥；右侧=宋军阵列；背后=河岸/营帐。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
1004 CE Chanzhou, Yellow River ferry and city tower in winter dawn, river mist, pontoon bridge,
Song infantry arrays on the right bank, city gate tower in front, camps and reeds behind,
Northern Song armor and banners, cold blue-grey morning with warm torch accents,
no text, no watermark, no logo, no modern objects, no firearms, no cannons, no gore,
no anime, no 3D render, no identifiable real faces.
```

### 4.6 `suitang/e03` 潼关失守

文件：`course/assets/vr/suitang/e03.jpg`

- 环境：756 年，潼关山隘，黄土塬、关城、伏兵、旗帜、烟尘。
- 360° 布局：正面=关隘；左右=山坡伏兵；背后=关中方向山道。

```text
Equirectangular 360-degree panorama, 2:1, seamless left-right wrap, horizon at 50%,
756 CE Tongguan mountain pass in the loess plateau, Tang army column advancing through the pass,
Yan rebels hidden on the slopes left and right, banners, dust and smoke, fortified gate in front,
steep yellow-earth cliffs, dry winter grass, cold overcast light,
Tang and rebel lamellar armor, no firearms, no cannons, no gore, no text, no watermark, no logo,
no modern objects, no anime, no 3D render, no identifiable real faces.
```

### 4.7 P1 可选（同规格）

- `wudai/e10` 陈桥兵变：960 年冬末清晨，驿馆、黄袍、拥立士兵、战马。
- `suitang/e05` 灵武即位：756 年边城简陋即位礼，朔方军、土城、寒风。
- `song/e04` 澶渊之盟：1005 年宋辽帐幕对坐，卷起舆图（无字）、双方使者/甲士。
- `suitang/e02` 洛阳失守：756 年叛军入洛阳，宫城/城门、烟尘。
- `song/e02` 瀛州之战：1004 年冬，瀛州城墙攻防，宋军坚守，辽军攻城。

---

## 5. 生成与交付

1. 先出 6 张 P0 中的 2 张测试：`wudai/e11` + `wudai/e06` 全景；检查风格/接缝/文字。
2. 通过后按 P0 → P1 批量生成；每张记录：文件名、prompt、日期、模型、备注。
3. 如果你能写仓库：
   - 事件图覆盖到 `course/assets/events/wudai/e11.jpg`。
   - 全景覆盖到 `course/assets/vr/...`。
   - 按第 6 节更新 `assets.js` 和 `vr.hotspots`。
4. 如果你只能生图：输出一张表（文件名、英文 prompt、中文说明、建议热点），由人保存，再由编码 Agent 嵌入。

---

## 6. 嵌入清单（给能改仓库的 GPT）

### 6.1 `wudai/e11` 事件图

在 `course/data/assets.js` 找到 `wudai-e11`：

```js
{
  id: "wudai-e11",
  path: "assets/events/wudai/e11.jpg",
  provider: "gpt-image2",
  status: "ready",
  note: "2026-10-23 / GPT-Image2 真插画"
}
```

在 `course/data/theme.wudai.js#e11.image` 把 `credit` 从“占位 · 待 GPT-Image2 替换”改为“AI 艺术复原示意”，`alt` 按新图更新。

### 6.2 真 360 全景

在 `course/data/assets.js` 找到对应 `vr-<theme>-<event>`：

```js
{
  id: "vr-wudai-e06",
  path: "assets/vr/wudai/e06.jpg",
  provider: "gpt-image2",
  status: "ready",
  note: "GPT-Image2 真 2:1 全景；非历史影像"
}
```

- 不要改 `path`；文件名保持不变。
- 不要对真全景再运行 `python tools/build_vr_panos.py`（会覆盖）。
- 如果替换了全景，需按新画面重新校准 `course/data/theme.*.js` 的 `vr.hotspots`：
  - `x/y` 为 0–1 归一化；x=0.5 是初始水平中心；y=0.5 是画面垂直中心。
  - 热点要落在对应人物/建筑/地形上，避免压到顶部标题和底部 UI。
  - 每个场景 2–4 个热点即可；标签用 2–6 个字。
- 如果只替换部分全景，其他未替换的仍保留 `provider:"procedural"` 和原 note，不要统一改成真全景。

### 6.3 验证

1. 双击 `course/index.html`，`V` 进入全景；水平拖一圈检查接缝；滚轮缩放；点击热点。
2. 事件卡片显示新 e11 图，不再出现“占位 · 待替换”角标。
3. 无外部网络请求；`file://` 可用。
4. 1920×1080 和 1366×768 截图；热点不遮挡标题/面板。
5. 如果改了数据，`node --check` 对应 JS。

---

## 7. 诚实性

- 真全景是“AI 生成的艺术复原环境”，不是历史影像/实拍。
- 不生成可读文字/旗号/地图标注；所有标题与标签由引擎叠加。
- 不把 16:9 插画拉伸成 2:1 冒充真全景；如果只能生成 16:9，明确标注“扩展示意”，不要改 `assets.js` 的 `provider` 为 `gpt-image2`。
- 不编造历史人物长相；不把 AI 图当史料证据。
