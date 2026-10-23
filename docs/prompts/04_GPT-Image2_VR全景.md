# GPT-Image2 · 真 360° 全景提示词包（v0.4）

> 用途：替换 `course/assets/vr/<theme>/<event>.jpg` 当前的“16:9 插画扩展全景示意”。
> 规格：**4096×2048（2:1 等距柱状 / equirectangular）**，JPEG，sRGB，质量 85–90，单张 ≤ 1.2MB。
> 原则：真全景是“环境”，不是一张 16:9 海报；地平线居中，左右接缝连续，顶部/底部不要出现明显极点拉伸或文字。
> 诚实性：AI 艺术复原，不是历史影像；不生成可读文字/旗号/地图标注。

---

## 一、统一风格前缀

```text
Monumental historical reconstruction of medieval China, museum-quality environmental panorama,
equirectangular 360-degree projection, 2:1 aspect ratio, horizon at 50% height, seamless left-right wrap,
mineral pigment palette of azurite blue, malachite green, cinnabar red, ochre, aged silk and ink-wash texture,
cinematic atmospheric dust and mist, restrained historical realism, no text, no calligraphy, no watermark,
no logo, no modern objects, no fantasy armor, no anime, no cartoon, no 3D render, no plastic skin,
no gore, no identifiable real faces. Historical reconstruction, not a photograph.
```

## 二、统一负面约束

```text
Avoid: text, Chinese characters, calligraphy, banners with legible writing, maps with labels, watermark,
signature, logo, modern clothing, glasses, watches, zippers, firearms, cannons, neon, sci-fi,
Japanese samurai armor, Qing dynasty queue, European medieval armor, Roman armor, fantasy, anime,
cartoon, 3D render, plastic skin, oversaturated colors, gore, exposed wounds, dismemberment,
real person likeness, celebrity, political symbols, fisheye distortion, visible seam, duplicated horizon,
top-down map view, poster layout, frame, border.
```

## 三、全景构图要求

1. 2:1 等距柱状；地平线在画面高度 50% 附近。
2. 左右边缘必须能无缝相接：不要把主体人物/建筑正好放在 x=0 或 x=100%。
3. 顶部是天空/云层，底部是地面/雾气；天顶/天底不要出现强烈透视拉伸。
4. 相机位于环境内部，四周都有可看的景物；不要只有正前方一张画。
5. 人物只写角色，不特写真实人物长相；战争克制，不血腥。
6. 不要在图里写任何文字；所有标题/标注由引擎叠加。

---

## 四、优先场景清单

### P0 · 高平之战（wudai/e06）

- 环境：山西高平山地河谷，早春晨雾，远处太行山脊，近处盾阵、旗帜、战马与尘土。
- 360° 布局：正面为后周盾阵与将旗；左侧为山坡与后周督战位置；右侧为北汉/辽骑兵压来；背后为河谷与远山。
- 文件：`assets/vr/wudai/e06.jpg`。
- 热点（引擎叠加）：柴荣督战、后周盾阵、北汉/辽骑兵。

### P0 · 世宗改革朝堂（wudai/e11）

- 环境：五代汴州简朴朝堂内部，木柱、帷幕、屏风、烛台、香炉；皇帝在御座，文官两列。
- 360° 布局：正面为御座与屏风；左右为文武官员；背后为朝堂入口与廊柱；顶部为梁架/暗色顶棚。
- 文件：`assets/vr/wudai/e11.jpg`。
- 热点：柴荣、宰相、户部/御史/禁军将领。

### P0 · 三征南唐（wudai/e07）

- 环境：深秋雨夜，寿州城下与淮河浮桥；城墙、城楼、火把、雨雾、战船/浮桥。
- 360° 布局：正面为寿州城墙与城门；左侧为淮河与浮桥；右侧为后周军营与攻城器械；背后为雨夜河面。
- 文件：`assets/vr/wudai/e07.jpg`。

### P1 · 北伐契丹（wudai/e08）

- 环境：深秋清晨，瓦桥关与燕山；关城、秋草、骑兵、远山。
- 360° 布局：正面为关城；左右为后周骑兵与辽军远退；背后为燕山山脊与长风。
- 文件：`assets/vr/wudai/e08.jpg`。

### P1 · 澶州亲征（song/e03）

- 环境：黄河渡口与澶州城楼；冬晨、河雾、浮桥、军阵、城楼。
- 360° 布局：正面为澶州城楼；左侧为黄河与浮桥；右侧为宋军阵列；背后为河岸与营帐。
- 文件：`assets/vr/song/e03.jpg`。

### P1 · 潼关失守（suitang/e03）

- 环境：潼关山隘，黄土塬、关城、伏兵、旗帜、烟尘。
- 360° 布局：正面为关隘；左右为山坡伏兵；背后为关中方向的山道。
- 文件：`assets/vr/suitang/e03.jpg`。

### P2 · 其余事件

- 其余 16:9 插画可继续用 `tools/build_vr_panos.py` 扩展全景；也可按同一模板逐张生成真全景。
- 每次替换后，把 `course/data/assets.js` 对应 `vr-*` 条目的 `note` 改为“GPT-Image2 真 2:1 全景”，并把 `provider` 改为 `gpt-image2`。

---

## 五、交付与接线

1. 生成 4096×2048 JPEG，命名 `course/assets/vr/<theme>/<event>.jpg`。
2. 在 `course/data/assets.js` 找到对应 `vr-<theme>-<event>` 条目，确认 `status:"ready"`。
3. 在事件数据里补/改 `vr.hotspots`（归一化 x/y；先看全景再定位置）。
4. 运行 `python tools/build_vr_panos.py` 会覆盖同名文件；真全景到位后不要再跑该脚本，或先把真全景另存。
5. 浏览器自测：`V` 进入，水平拖动一圈检查接缝；滚轮缩放；点击热点；`Esc` 返回。

---

## 六、验收

- 2:1、4096×2048；左右接缝无明显断裂；地平线不歪。
- 无文字/水印/logo；无可识别真实人物；无血腥。
- 热点位置与画面内容对得上；UI 标注仍保留“AI 艺术复原示意”。
- 离线可用；不引入新的网络请求。
