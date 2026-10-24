# 代码语义与易错点（CODE_NOTES）

> 适用：`course/js/scene.js`、`course/js/map.js`、`course/js/ui.js`、`course/js/main.js`。
> 目的：把“war 省域兵棋”和“battle 占地网格”的语义差异、主沙盘高亮数据流、
> 坐标/渲染约定写清楚，避免下一次修改再把既有含义做反。
> 本文是交接说明，不是新的需求文档；与源码注释冲突时以源码为准并同步修正本文。

---

## 1. 一句话区分 war 与 battle

| | `war`（省域兵棋） | `battle`（通用战场） |
|---|---|---|
| 控制单位 | 静态省份 polygon | 静态世界坐标格子 |
| 状态 | `province.owner` | `cell.owner` + `cell.control/controlSide` |
| 单位角色 | 省份之间的棋子 | 格子的占领者 |
| 易手条件 | 省内没有混合阵营单位时，按驻军阵营改 owner | 单方在捕获半径内累积 control，完成后改 owner；离开后保留 |
| 争夺 | 双方都有单位 -> 接战，不占领 | 多阵营同时压在格子上 -> owner 不变，control 回落 |
| 派生结果 | `warRebuildFront` 从相邻省 owner 差异派生战线 | 格子 owner 直接绘制控制区；无省份/战线 |
| 阶段 phases | 只改 morale/attack 与战报，不直接改 owner | 不直接改 owner；单位移动/溃退/捕获计时派生占地变化 |
| 试点 | `wudai/e06` 高平之战 | 所有没有显式 `scene` 的 `kind:"war"` 事件 |

**不要把 battle 的“最近单位 + 半径”写法带回 war，也不要把 war 的省份/战线
图层复用到 battle。** 两者只共享真实 DEM、小人/编队工厂和 CanvasTexture 贴地方法。

---

## 2. e06 省域兵棋的正确语义

数据入口：`course/data/theme.wudai.js` 的 `e06.scene`（`type:"war"`）。

1. `map.provinces` 是静态 polygon，坐标在战场局部坐标系；省份不会因为单位移动而平移。
2. `warReset` 为每省建立运行时状态 `owner`，初始值来自数据；`warBuild` 生成
   省份覆盖纹理、标签、城市点、河流、单位牌与小人编队。
3. `warStep` 以固定 tick（默认 0.1s）推进：
   - 单位按 `orders[].at` 变目标省；
   - 跨省移动约 `moveTime / speed` 秒，到达后更新 `provinceId`；
   - `warResolveCombat` 在省内有多阵营时结算兵力/士气；
   - `warUpdateControl` 只在“省内没有混合阵营单位”时调用 `warSetOwner`。
4. `warSetOwner`：
   - 改 `p.owner`；
   - `paintWarProvinces` 重绘省份 CanvasTexture（必须 `needsUpdate`）；
   - 生成易手环；
   - 调用 `warRebuildFront`。
5. `warRebuildFront` 是**派生**逻辑，不读关键帧：
   ```text
   front = borders.filter(b => owner[b.a] 与 owner[b.b] 不属于同一联盟)
   ```
   `beihan` 与 `liao` 视为同一联盟；双方边界不画战线。
6. `phases.effects` 只允许 morale/attack 等参数修正，**不直接改 owner/战线**。
   e06 终局“后周 7 省、北汉/辽各 1 省”是推演结果，不是写死的结局。
7. 单位是“省之间的棋子”：`warUnitPos` 的偏移只是编队错位，不代表单位实际占格。

回归底线：e06 终局仍为 7/1/1；e06 不应出现 battle 的占地网格、地标或 battle 头标。

---

## 3. battle 占地网格的正确语义

数据入口：`main.js#makeBattleScene` 从事件级 `battle` 配置生成 scene；
`scene.js#battleBuild` 构建。

### 3.1 状态模型

`battleBuildGrid` 只创建网格容器；`battleInitGrid` 创建固定格子：

```js
cell = {
  r, c, x, z,                 // 固定的世界坐标（不随单位移动）
  owner,                      // null=中立 / 阵营 id
  controlSide,                // 当前正在累积控制的一方
  control,                    // 0–1 捕获进度
  lastChange                  // 易手时的 gridClock
}
```

`battleGridStats` 统计 `total / neutral / sides`，通过
`HISTORY_APP.state().sceneState.grid` 暴露，便于 QA 检查控制区变化。

### 3.2 初始归属

`battleInitialOwner(B, x, z)` 从预设和出生位置派生，**不读单位当前位置**：

- `siege`：城墙示意线在 `z=4`；墙后归守方，墙前归攻方，墙脚留中立带。
- `river`：河岸示意线 `z = sin(x*0.09)*1.15`；北岸归北侧阵营，南岸归南侧，
  河道两侧留中立带。
- `ambush`：道路走廊归行军方，两翼伏兵出生区归伏击方，其余中立。
- `field` / `cavalry`：用双方出生重心推一条示意前沿，前沿两侧各留中立带。
- 自定义单位 / 未知 preset：按出生点最近阵营兜底，仍不使用当前位置。

这些线是**战术示意**，不是精确历史阵线。

### 3.3 捕获规则

`battleGridTick(B, 0.1)` 在固定 `B.gridClock` 上推进：

1. 取当前 gridClock 对应的时间比例 `t`；
2. 用 `battleMotion` 求每个单位在该时刻的位置；
3. 用 `battleHealth` 跳过已溃退单位，跳过正在后撤的单位；
4. 对每个格子统计捕获半径内的阵营和单位数；
5. 单方在格内：
   - 若 `owner === side`：control 保持 1；
   - 否则累积 `control += dt/captureTime * (0.85 + 0.15*min(3, count))`；
   - `control >= 1` 时 `owner = side`，之后即使单位离开也保留；
6. 多阵营在格内：争夺，owner 不变，control 回落；
7. 没有单位：control 回落，owner 保留。

`captureTime` 默认 3.2 秒；`captureRadius` 缺省为单元格短边的 2.4 倍。
捕获在固定 0.1s 上推进，1x/4x、restart、goToPhase、setTime 在同一时间点可复现；
禁止 `Math.random()`。

### 3.4 绘制与刷新

- `paintBattleGrid` 用与战场 DEM 同几何的 CanvasTexture 覆盖层，不是平面 `GridHelper`。
- 中立格灰色；控制格取阵营色并略提亮；正在被占领的格子用底部进度条 +
  细边提示，不提前把整格染成占领方颜色。
- 相邻格 owner 不同时描亮边，读起来像控制区边界。
- 只有 `B.gridDirty` 为真时才重绘；`battleUpdate` 用 0.24s 节流；
  画完必须 `gridTexture.needsUpdate = true`。
- 网格位置由 `cols/rows/width/depth` 决定，和 `B.units[].x/z` 无关。

### 3.5 地标

可选数据契约：

```js
battle: {
  landmarks: [
    { name: "寿州城", x: 0, z: 11, kind: "gate", side: 1 },
    { name: "淮河渡口", x: -18, z: -2, kind: "bridge" },
    { name: "后周营地", x: 13, z: -19, kind: "camp", side: 0 }
  ]
}
```

- `kind`：`gate` / `wall` / `city` / `ford` / `bridge` / `riverbank` /
  `pass` / `ambush` / `camp` / `battlefield` / `cavalry` / `road`。
- `side` 可为 0/1 或阵营 id，只影响描边颜色，不改变 owner。
- 未提供时 `battleDefaultLandmarks` 按 preset 生成，名称优先用事件 `place`；
  这些位置是示意位置，不是精确坐标。
- 地标是贴地 Sprite + 地面环，图层名 `landmarks`（界面“地标”）。
- 地标不参与控制计算，也不遮挡单位头标（renderOrder 7，头标 30）；位置
  尽量放在侧翼/后方，避免与单位头标同点。

---

## 4. 主沙盘区域高亮的完整数据流

```text
theme.events[].regionId
  -> main.goTo()
  -> st.map.highlight(ev.regionId)
  -> api.highlight()
       - 设置 api.current
       - 每区 target（当前 1.55 / 其他 0.55 / 无高亮 1）
       - DOM 标签切换 .is-hl / .is-dim
       - repaintRegions() -> regionPaint.draw(current)
  -> api.update(dt, t) 每帧
       - 色块 canvas 已在 draw 时上传
       - 边界 lineOp：当前 0.78–1.0 脉冲，其他 0.3
       - 光带 glowOp：当前 0.16–0.26，其他 0.015
  -> app.css
       - .lb-region.is-hl：白字、下划线、accent 光晕
       - .lb-region.is-dim：opacity 0.36
```

### 4.1 空 regionId 的含义

空 `regionId` 不是“数据坏了”，而是“本事件没有单一政权可高亮”。典型情况：

- 地图快照约为 955 年，而事件发生在 907/923/947 年；
- 事件的主角（后梁/后唐/后晋）不在 955 年地图的政权列表里；
- 事件涉及多个政权，没有唯一可高亮对象。

处理方式：

- `api.highlight("")` 取消所有 dim，恢复默认色块与边界；
- `ui.setNow` 在事件胶囊显示“无单一政权高亮”（虚线 chip）；
- 不要为了“看起来有高亮”硬补一个不相关的 regionId；补值必须有史实和
  现有地图数据支持。

### 4.2 高亮常见失效原因

1. **CanvasTexture 没有 `needsUpdate`**：draw 改了 canvas，但 GPU 仍用旧纹理。
   v0.4 DEM 改版（commit `7759517`）把平面 fill 改成地形覆盖层时漏了这一步，
   表现为色块完全空白、切换事件无变化。
2. **边界 ribbon 单面材质**：`ribbon()` 的三角形绕序由多边形方向决定，默认
   `FrontSide` 从沙盘上方看会被背面剔除。必须 `side: THREE.DoubleSide`。
3. **边界埋进地形**：边界 ribbon 必须走 `heightAtXZ`，并留竖向偏移（当前
   核心线 0.16、光带 0.10）；偏移过小会在陡坡/等高线覆盖层上 z-fighting。
4. **图层被关闭**：`map.setLayer("regions", false)` 会隐藏整个 `regionGroup`，
   此时高亮状态仍在，但屏幕上不可见。
5. **标签层被关闭/被遮挡**：`HS.labels.setLayer("regions", false)` 或标签
   优先级/视口裁剪会让 `.is-hl` 不可见。
6. **regionId 拼写错误**：`api.highlight` 按未知值处理并取消高亮；事件胶囊
   会给出“无单一政权高亮”的回退提示。

### 4.3 主沙盘坐标/渲染约定

- 主沙盘 `zNorth:"negative"`；`paintRegionLayer` 的 canvas y 与地形 UV 方向一致，
  北在上，不要再翻一次 z。
- 区域多边形先由经纬度投影到世界 `x/z`，再映射到 canvas；不要直接拿经纬度画。
- 区域覆盖层与地形同几何、`translate(0, 0.06, 0)`、`renderOrder 2`、
  `depthWrite:false`；边界核心 `renderOrder 4`，光带 `3`。
- 地形使用 `polygonOffset` 防止与等高线/覆盖层 z-fighting；边界用竖向偏移。

---

## 5. 修改这些模块时的回归清单

### 5.1 主沙盘高亮

- [ ] 有 `regionId` 的事件：当前政权色块、边界（脉冲/亮边）、标签 `.is-hl`
      同时出现；其他政权 `.is-dim`。
- [ ] 空 `regionId` 的事件：事件胶囊显示“无单一政权高亮”，无 `.is-hl`/`.is-dim`。
- [ ] 切换事件即时更新，不等下一帧/下一次重建。
- [ ] 1920×1080 与 1366×768 边界可辨；关闭“势力色块”图层后高亮状态仍正确，
      但屏幕上不可见（这是预期）。
- [ ] 主题切换后首屏/首页也有色块，不出现空白纹理。

### 5.2 battle 占地网格

- [ ] 五种 preset（field/siege/cavalry/ambush/river）都能进入，无 console error。
- [ ] 初始 owner 来自预设/出生位置，不来自单位当前位置。
- [ ] 时间推进后 owner/control 变化；单位离开后 owner 保留；敌方重新占领才易手。
- [ ] 网格纹理只在 `gridDirty` 时重绘，且 0.2–0.3 秒节流。
- [ ] 中立格灰色；控制格阵营色；争夺格不提前变色。
- [ ] 地标图层可开关；地标名称使用事件 place 或显式 `battle.landmarks`。
- [ ] 1x/4x、restart、goToPhase、setTime 在同一时间点控制区一致。
- [ ] e06 仍是 `war`：无 battle 网格/地标/头标；终局 7/1/1。

### 5.3 e11 court 与通用回归

- [ ] e11 名牌文本、发言者高亮、金色光环、右侧“发言”一致；非发言者弱化。
- [ ] 反复进出 battle/court 各 3 次无异常。
- [ ] `node --check` 所有改动 JS；`git diff --check` 无空白错误。
- [ ] `file://` 离线可用；无外部 `http(s)` 请求；无 console error。
- [ ] 1920×1080 与 1366×768 截图检查。

---

## 6. 变更历史与已知限制

- `7759517`（v0.4）把主沙盘势力色块从平面 fill 改为 DEM 同几何覆盖层。
  该提交漏了 `regionPaint.texture.needsUpdate`，且边界 ribbon 使用单面材质，
  导致“高亮标记消失”的两个根因。
- battle 网格的第一版用“最近单位 + captureRadius”每帧重算 owner，语义是
  “单位光环”，不是占地。当前版本改为固定格子 + 持久 owner + 固定步长捕获。
- 省份/地标位置仍是战术示意，不是精确历史阵图；不要用它们推导真实阵线。
- 地标标签是 Sprite，不参与物理/控制；如需精确坐标，必须在数据里标
  `coordAccuracy` 或 `status`，不要静默当作史实。
