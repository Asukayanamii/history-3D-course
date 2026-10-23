# 场景数据契约 v0.4（war / battle / court / vr + terrain）

> 适用范围：`course/js/scene.js`、`course/data/theme.*.js`。
> 旧 `battlefield` 仍兼容；新内容优先使用 `war` / `battle` / `court` / `vr`。
> 原则：地形真实、场景诚实；不把手绘阵图或 AI 图说成精确史料。

---

## 0. v0.5 增量（2026-10-23）

- `battle` 增加血条头标与占地网格；`e06 war` 的省域兵棋保持不变，不叠加第二套网格。
- `battle.grid`（可选）：`{ cols: 20, rows: 16, captureRadius: 11 }`。
  - `cols/rows` 默认 20×16；`captureRadius` 为场景世界单位，缺省约为单元格短边的 2.4 倍。
  - 网格使用与战场 DEM 同几何的 Canvas 覆盖纹理，不是平面 `GridHelper`；随单位位置每 0.24 秒重绘。
  - 单元格按“最近单位 + 捕获半径”归属；超出半径为中立灰；颜色取 `sides[].color`。
- `battle` 单位可带 `strength` / `morale`（0–100，缺省 100）。头标显示阵营短名、单位名、状态与兵/气两条；`strength <= 20` 或 `morale <= 25` 视为溃退。
  - 损耗模型是场景时间的确定性函数，不使用 `Math.random()`；`restart` / `goToPhase` / `setTime` 重建后按同一时间点复位。
- `battle` 图层名为 `grid` / `units` / `labels`（界面文案：占地网格 / 单位 / 名字）；`S.setWarLayer` 与 `HS.ui.setWarLayerBox` 同步。
- `court` 角色增加可选 `roleOnly: true`；发言阶段在 3D 小人上方显示 `name · rank` 名牌，发言者高亮并出现金色光环，非发言者弱化；右侧「发言」栏使用同一 `name · rank`。
  - 名牌文本由 `name + " · " + rank` 生成；不确定的历史人物只写角色并标“角色/待核订”，不得编造。
  - 皇帝为坐姿，光环放在御座前平台；文官光环在脚下。
- 诚实性口径：占地网格、兵/气条、阵型均为战术示意，不是精确历史阵图；朝堂台词为教学情景复原。

---

## 1. 公共字段

```js
scene: {
  type: "war" | "battle" | "court" | "vr",
  title: "场景标题",
  subtitle: "954 年 · 后周 vs 北汉 / 辽",
  note: "地形/兵力/台词等诚实性说明",
  duration: 30,              // 秒
  camera: { dist, az, polar, target: [x,z] },
  text: { time, place, figures, result, impact }
}
```

- `text` 缺省时 UI 回退到事件的 `date/place/figures/result/impact`。
- `scene` 存在即可进入；没有 `scene` 的 `kind:"war"` 事件由 `HS.sceneFor` 自动生成 `battle`。
- `kind` 取值：`war` / `politics` / `reform` / `diplomacy`。

---

## 2. `war`（省域兵棋）

```js
scene: {
  type: "war",
  duration: 30, tick: 0.1, seed: 954,
  terrain: {
    dem: "gaoping",
    bounds: { west: 111.4, east: 114.6, south: 34.8, north: 38.2 },
    size: [96, 108],          // 场景局部宽/深
    exaggeration: 9,
    meshStep: 0.01
  },
  camera: { dist: 90, az: 0, polar: 50, target: [0,0] },
  sides: [{ id, name, color, short }],
  map: {
    provinces: [{ id, name, terrain, polygon, owner, vp, neighbors }],
    borders: [{ a, b, points }],
    cities: [{ name, pos: [x,z] }],
    rivers: [{ name, points: [[x,z]] }]
  },
  units: [{
    id, name, side, type: "infantry"|"cavalry",
    provinceId, strength, morale, attack, defense, speed,
    orders: [{ at, type: "defend"|"advance"|"attack"|"retreat", to }]
  }],
  phases: [{ at, date, label, log, effects }]
}
```

- `terrain` 可选；缺省时回退平面棋盘。
- 省份色块由覆盖纹理绘制；易手时重绘；战线由 `borders` + `owner` 派生。
- 单位是人形编队；`strength/morale` 阈值触发溃退。
- 同一 `seed` 结果一致；终局高平为后周 7 省、北汉/辽各 1 省。

---

## 3. `battle`（通用战场）

事件级快捷配置：

```js
battle: {
  preset: "field" | "siege" | "cavalry" | "ambush" | "river",
  terrain: "hebei" | "guanzhong" | "huainan" | "gaoping",
  grid: { cols: 20, rows: 16, captureRadius: 11 },   // 可选
  sides: [{ id, name, color, short }]
}
```

`HS.sceneFor(ev, theme)` 自动生成：

```js
{
  type: "battle",
  title, subtitle, note, duration, seed,
  preset, terrain, sides,
  phases: [ ... ],          // 缺省由事件 detail/result 生成
  text, image
}
```

显式覆盖：

```js
scene: {
  type: "battle",
  preset: "siege",
  terrain: { dem: "huainan", bounds: {...}, size: [92,74], exaggeration: 9 },
  units: [{
    side: 0|1|"side-id",
    type: "infantry"|"cavalry",
    count, label,
    start: { x, z }, end: { x, z },
    moveAt: 0.15, moveDur: 0.58,
    wall: true,              // 守军站在城墙上
    strength: 100,           // 可选，0–100，缺省 100
    morale: 100              // 可选，0–100，缺省 100
  }],
  phases: [...]
}
```

- 所有 `kind:"war"` 事件必须有显式 `scene` 或 `battle` 快捷配置。
- 场景内单位是低多边形小人；守城单位可站在城墙顶。
- 通用战场明确标注“地形真实；兵力/阵型/占地网格为教学示意”。
- 每个单位有 CanvasTexture 头标（阵营短名 + 单位名 + 状态 + 兵/气），溃退方在收束阶段跌破阈值。
- 占地网格是战场 DEM 上的 Canvas 覆盖层；中立格灰色，控制格取阵营色；每 0.24 秒按单位位置重绘。

---

## 4. `court`（朝堂）

```js
scene: {
  type: "court",
  variant: "court",          // 预留 "tent" 外交帐幕
  duration: 26,
  camera: { dist: 34, az: 0, polar: 70 },
  roles: [
    { id, name, rank, side, pose: "seat"|"speak"|"listen", roleOnly: false }
  ],
  phases: [
    { at, speaker: "emperor", label, log, gesture: "raise"|"bow"|"point"|"spread"|"seat" }
  ],
  text: { time, place, figures, result, impact }
}
```

- 角色 `id:"emperor"` 自动放在御座；`id:"guard"` 自动生成侍卫；其余为文官。
- `gesture:"raise"` 映射为举笏发言；`"bow"` 为躬身；`"seat"` 为落座/聆听。
- 每个有名字的角色在 3D 小人上方生成 `name · rank` CanvasTexture 名牌；发言者名牌高亮放大、脚下/御座前出现金色光环，非发言者名牌弱化。
- `roleOnly: true` 表示角色化呈现、具体姓名待核订；名牌描边为虚线，界面文案保留“角色/待核订”。
- UI 显示“发言”栏、阶段时间轴、战报；右侧发言使用与 3D 名牌相同的 `name · rank`。明确“情景复原，不是史料原文”。

---

## 5. `vr`（360° 环视）

事件级：

```js
vr: {
  pano: "assets/vr/wudai/e06.jpg",
  hotspots: [{ x, y, label, text }]
}
```

- `x/y` 为 2:1 全景的归一化坐标（0–1）。
- 查看器为 CSS 全景层 + 2D 尘埃层；不依赖 WebGL 外部纹理，`file://` 可用。
- 水平 yaw 循环；上下 pitch 限制；滚轮缩放；自动巡游；`Home` 复位。
- 缺 pano 时回退 `image`，UI 标注“图片环视，不是 360° 全景”。

---

## 6. 地形 API

`course/js/dem.js`：

```js
HS.dem.has(id)
HS.dem.def(id)
HS.dem.sampleMeters(id, lon, lat)
HS.dem.land(id, lon, lat)
HS.dem.buildMesh({
  dem, bounds, width, depth, step, exaggeration,
  zNorth: "negative"|"positive", maxHeight, edgeFalloff
})
```

返回：

```js
{
  geometry, bounds, width, depth, cols, rows, verticalScale,
  toXZ(lon,lat), toLonLat(x,z),
  heightAtLonLat(lon,lat), heightAtXZ(x,z),
  heightMeters(lon,lat), land(lon,lat)
}
```

- 主沙盘使用 `zNorth:"negative"`；war/battle 使用 `zNorth:"positive"` + `root.scale.z=-1`。
- 地形真实，垂直夸张；所有路线/标签/标记必须走 `heightAt`。

---

## 7. UI / 键盘

| 键 | 行为 |
|---|---|
| `E` | 进入/退出 3D 场景 |
| `V` | 进入/退出 360° 全景（场景内也可切换到 VR） |
| `Space` | 暂停/继续（VR 为暂停/继续巡游） |
| `1/2/3` | 1x/2x/4x（VR 为巡游速度） |
| `R` | 重播（VR 复位视角） |
| `L` | 图层（war） |
| `Home` | 全景 / VR 复位 |
| `Esc` | 返回地图 / 关闭 |

---

## 8. 验收要点

1. 所有 war 事件 `HS.sceneFor` 非空；e11 为 `court`。
2. e06 war 终局 7/1/1；同 seed 一致。
3. 场景内单位是小人，不是方块；行军/接战/溃退可见。
4. 所有 `battle` 预设（field/siege/cavalry/ambush/river）都有兵/气头标与占地网格；阶段推进时数值和格子控制变化；图层 `grid/units/labels` 可开关。
5. e06 `war` 终局仍为后周 7 省、北汉/辽各 1 省；不出现第二套网格或 battle 头标。
6. 朝堂有皇帝、文官、侍卫；每个发言阶段 3D 名牌与右侧“发言”的姓名/官职一致；非发言者弱化、发言者有金色光环。
7. 地形/省份/战线/标签贴地；不埋入山体。
8. 360° 水平循环、热点、自动巡游、`Esc`/`V` 返回。
9. 无 console error；反复进出 war/battle/court/vr 各 3 次不崩。
