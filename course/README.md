# 史境 · 三维历史沙盘（Demo v0.2）

面向中学历史课堂的三维时空交互课件 Demo。双击 `index.html` 即可在 Chrome / Edge 打开，不需要联网、不需要安装依赖。

## 打开方式

1. 用 Chrome 或 Edge 打开 `course/index.html`。
2. 首次进入是首屏；点「开始探索」进入五代十国。
3. 如果浏览器拦截本地文件，请确认使用的是 Chrome/Edge，而不是 IE。

> 整个 `course/` 文件夹可以拷到 U 盘；不要只拷 `index.html`，`js/`、`data/`、`css/` 要一起拷。

## 课堂操作

| 操作 | 方式 |
|---|---|
| 下一站 / 上一站 | `→` `←`，或翻页笔 PageDown/PageUp，或底部时间轴 |
| 旋转 / 缩放 / 平移 | 左键拖动 / 滚轮 / 右键拖动 |
| 回到全景 | `Home` 或顶栏「全景」 |
| 课堂提问 | `Q` 出题，再按 `Q` 揭晓；`Esc` 关闭 |
| 进入 / 退出 3D 场景 | `E`，或卡片上的「进入场景」；场景内 `Esc` 返回 |
| 场景暂停 / 继续 | 场景内 `Space` |
| 自动演示 | `P` 开/关；`?demo=1` 自动播放 |
| 图层 | `L` |
| 静音 / 恢复 | `M` |
| 全屏 | `F` |
| 切换时期 | `1` 五代十国 / `2` 隋唐 / `3` 宋朝 |

## 三个时期

| 时期 | 事件数 | 说明 |
|---|---|---|
| 五代十国 | 10 | 默认、重点；3 条路线；高平之战有全知视角 3D 场景 |
| 隋唐（安史之乱） | 6 | 薄主题，证明同一引擎可切换 |
| 宋朝（澶渊之盟） | 4 | 薄主题，证明同一引擎可切换 |

## 修改内容

所有文字、事件、路线、镜头、场景参数都在 `data/`：

- `data/theme.wudai.js`：五代十国（默认、重点）
- `data/theme.suitang.js`：隋唐
- `data/theme.song.js`：宋朝
- `data/themes.index.js`：时期顺序、默认时期、项目名
- `data/assets.js`：图片/封面/背景清单与状态
- `data/license.js`：来源、代码许可、AI 声明

**只改数据不需要改引擎。** 新增时期：新建 `data/theme.<id>.js`，在 `index.html` 加一行 `<script>`，再把 id 加到 `themes.index.js` 的 `HISTORY_THEME_ORDER`。

### 事件字段（v0.2 增量）

```js
{
  id: "e06",
  figures: ["柴荣（后周世宗）", "刘崇（北汉世祖）"],
  result: "后周军获胜，北汉退守太原。",
  impact: "柴荣树立权威，整顿禁军，为后周改革与北伐奠定基础。",
  scene: {
    type: "battlefield",
    title: "高平之战 · 全知视角",
    text: { time, place, figures, result, impact },
    camera: { dist, az, polar },
    phases: [{ at, label }],
    units: [{ id, name, color, count, formation, start, moveTo, moveAt, moveDur, retreatTo, retreatAt, retreatDur }]
  }
}
```

没有 `scene` 的事件，卡片显示「进入场景（待补）」禁用按钮；不要为了好看伪造场景。

### 替换图片

1. 把图片放到 `assets/events/<主题>/<事件>.jpg` 或 `assets/ui/`。
2. 在 `data/assets.js` 把对应条目的 `status` 改为 `"ready"`。
3. 规格：1920×1080 JPEG、sRGB、16:9、无文字/水印、单张 ≤ 600KB。
4. 缺图时卡片显示设计过的占位图，不会出现破图。

## 来源与授权

- 外部网站/地图/史料：见「来源与授权」弹窗和 `data/license.js`；使用或参考后必须标注。
- 许可：谁取用谁核实；无法确认就不用。耿雨只负责史实审核，不负责许可判断。
- AI 插画/封面：主页/页脚统一声明「AI 生成的艺术复原示意，不是历史影像」，不逐张标注。
- Three.js r147 / OrbitControls：MIT，保留版权头。

## 已知限制（Demo v0.2）

- 势力边界是**根据公开历史地图简化**的示意多边形，不是精确疆域；需要历史组核对。
- 五代十国地图是约 955 年快照，事件跨 907–960；图例已标「地图快照」。
- 大理、吐蕃、河西、清源军等未单列色块，图例已标「未单列」。
- 只有高平之战有 3D 场景；其他事件是「待补」。
- 隋唐/宋朝仍是示意 blob，没有补简化多边形。
- 所有事件插画、封面、背景尚未生成，当前为占位。
- 没有真实 DEM / 海拔查询；沙盘为程序化平面。
- 没有世界史主题（一战/二战路线）；引擎支持任意经纬度范围，后续可加。

## 文件结构

```text
course/
├─ index.html
├─ README.md
├─ css/app.css
├─ js/
│  ├─ lib/three.min.js, OrbitControls.js
│  ├─ core.js          渲染器、相机、投影、标签
│  ├─ map.js           沙盘、势力、河流、地名
│  ├─ route.js         路线曲线与生长
│  ├─ ui.js            顶栏、时间轴、卡片、问答、来源、场景 UI
│  ├─ sfx.js           Web Audio 合成音效
│  ├─ scene.js         全知视角 3D 场景（当前 battlefield）
│  └─ main.js          启动、主题/事件切换、键盘、自动演示、API
├─ data/
│  ├─ themes.index.js
│  ├─ theme.wudai.js / theme.suitang.js / theme.song.js
│  ├─ assets.js
│  └─ license.js
└─ assets/
   ├─ events/wudai|suitang|song/
   ├─ ui/
   └─ map/
```

## 调试 / 录屏

```js
HISTORY_APP.goTo("e06");
HISTORY_APP.next();
HISTORY_APP.play();
HISTORY_APP.enterScene("e06");
HISTORY_APP.exitScene();
HISTORY_APP.state();
```

URL 参数：`?theme=wudai&event=e06&demo=1&dwell=8000&nointro=1`。

## 需求与交接

- 需求修订：`docs/需求修订_v0.2.md`
- 交接：`docs/handoff/DEMO_HANDOFF.md`
- 资源替换：`docs/handoff/RESOURCE_REPLACEMENT.md`
- 测试记录：`docs/handoff/QA.md`
