# WAR 场景规范（v0.3）

> **v0.4 增量**：新增 `battle` / `court` / `vr` 场景与真实 DEM `terrain` 字段；完整契约见 `docs/handoff/SCENE_SPEC_v0.4.md`。本文件保留 v0.3 war 推演规则与验收记录。
>
> **语义边界**：本文件只描述 `war` 省域兵棋。`battle` 是固定格子 + 持久 owner 的占地网格，
> 不是省份兵棋；两者对照与易错点见 `docs/handoff/CODE_NOTES.md`。不要把本文件的
> 省份/战线逻辑复用到 `battle`，也不要把 battle 的网格/地标混入 e06。

> 用途：把战争事件做成「省份节点 + 自动推演」的兵棋场景。当前试点 `wudai/e06 高平之战`。
> 引擎：`course/js/scene.js`；数据：`course/data/theme.wudai.js#e06.scene`。
> 原则：自动推演，不做玩家下令；战线由省份控制派生，不写手工关键帧；兵力/战线为战术示意。

---

## 1. 范围

- 一个战场 = 8–10 个省份/州城；每个省份有 polygon、owner、terrain、neighbors。
- 单位有 strength / morale / attack / defense / speed 和脚本 orders。
- 固定 tick 推演：移动、接战、损耗、士气下降、溃退、省份易手、战线重算。
- 阶段 phases 只做历史修正（morale/attack）和战报；不直接改 owner/战线。
- 自动播放；老师只暂停、调速、跳阶段、看战报。
- 不做玩家下令、六角格、补给、装备、增援、跨朝代世界地图。

---

## 2. 数据契约

```js
scene: {
  type: "war",
  title: "高平之战 · 兵棋推演",
  subtitle: "954 年 · 后周 vs 北汉 / 辽",
  note: "省份、兵力、战线为战术示意，不是精确历史阵图。",
  duration: 30,                    // 推演总时长（秒）
  tick: 0.1,                       // 固定步长
  seed: 954,                       // 固定随机种子
  camera: { dist: 90, az: 0, polar: 50, target: [0, 0] },
  sides: [
    { id: "zhou", name: "后周", color: "#d4553b", short: "周" },
    { id: "beihan", name: "北汉", color: "#6f8399", short: "汉" },
    { id: "liao", name: "辽", color: "#8a7a5a", short: "辽" }
  ],
  map: {
    provinces: [{
      id: "gaoping", name: "高平", terrain: "river_valley",
      polygon: [[-12,10],[12,10],[12,-10],[-12,-10]],
      owner: "zhou", vp: 3,
      neighbors: ["daizhou", "qinshui", "huguan", "zezhou"]
    }],
    borders: [{
      a: "daizhou", b: "gaoping",
      points: [[-12,10],[12,10]]
    }],
    cities: [{ id: "gaoping-city", name: "高平", provinceId: "gaoping", pos: [0,0] }],
    rivers: [{ id: "danhe", name: "丹河", points: [[-30,-6],[0,2],[30,10]] }]
  },
  units: [{
    id: "zhou-center", name: "后周中军", side: "zhou", type: "infantry",
    provinceId: "zezhou", strength: 100, morale: 100,
    attack: 12, defense: 11, speed: 1.0,
    orders: [
      { at: 0.00, type: "defend", to: "zezhou" },
      { at: 0.55, type: "attack", to: "gaoping" },
      { at: 0.82, type: "advance", to: "huguan" }
    ]
  }],
  phases: [
    { at: 0.00, date: "954.3 初", label: "北汉南下", log: "……", effects: [] },
    { at: 0.42, date: "954.3 中", label: "右军溃退", log: "……",
      effects: [{ type: "morale", side: "zhou", unit: "zhou-right", value: -40 }] },
    { at: 0.55, date: "954.3 下", label: "柴荣督战", log: "……",
      effects: [{ type: "attack", side: "zhou", value: 0.2 }] }
  ],
  text: { time, place, figures, result, impact }
}
```

### 字段约束

- `province.id` 唯一；`polygon` 至少 3 点、不自交、在场景局部坐标 ±45 内。
- `neighbors` 与 `borders` 一致；每条 border 的 `a/b` 必须存在。
- `units[].provinceId` 必须存在；每条 `orders[].to` 必须是当前或相邻省份。
- `strength/morale` 0–100；`attack/defense/speed` 是相对参数，不是史实数字。
- `phases[].at` 0–1 递增；`effects` 只允许 `morale` / `attack`（可扩展 `defense`）。
- `text.figures/result/impact` 必须与事件卡片一致或更具体；不得编造。

---

## 3. 推演规则

### 3.1 固定步长

- 渲染与推演解耦；`tick` 固定（默认 0.1s）。
- `S.speed` 1/2/4 只影响实时速度，不改变推演步长。
- `restart` 重置状态；`goToPhase` 重置 + 固定步长快进到目标时间；同 seed 同结果。

### 3.2 移动与占领

- 单位有 `provinceId`；`orders` 到点后设置目标省份。
- 跨省移动约 1.4s / speed；到达后更新 `provinceId`。
- 目标省份无敌方单位 → 占领，`owner` 变为该单位阵营。
- 有敌方单位 → 接战，不直接占领。

### 3.3 战斗（轻量）

```text
terrainDef = { plain:0, hill:0.15, mountain:0.3, river_valley:0.1 }[terrain]
moraleFactor = 0.5 + 0.5 * (attacker.morale / 100)
damage = 0.85 * dt * attacker.attack * (attacker.strength/100)
         * (1 - terrainDef) * moraleFactor * sideAttackMod * rand(0.85–1.15)
defender.strength -= damage
defender.morale   -= damage * 0.55
attacker.strength -= damage * 0.32
attacker.morale   -= damage * 0.12
if strength <= 20 or morale <= 25 → 溃退到友方相邻省
```

- 随机数由 `seed` 驱动；不要用 `Math.random()`。
- 伤害、溃退、占领、阶段日志写入战报；同一条消息去重。
- `beihan` 与 `liao` 视为同一联盟：彼此边界不显示战线，可共同占领。

### 3.4 战线派生

- 前线不是关键帧；运行时：
  `front = borders.filter(b => !sameCoalition(owner[b.a], owner[b.b]))`
- 每条 frontier 用金色 TubeGeometry + glow 绘制；省份易手时重建。
- 接战省份加脉冲环；溃退时战线自然后移。
- 图层可关闭战线/路线/单位/战斗/地名/领土。

### 3.5 阶段修正

- `morale`：指定 unit 或整个 side，加减 morale。
- `attack`：side 攻击倍率，持续到结束。
- 不直接改 `owner`/战线；历史结局通过参数调校，不硬改地图。

### 3.6 统计

- 每方总 strength、单位数、控制省份数/百分比；由状态计算，不写死。
- UI 每 0.18s 更新一次；战报实时追加。

---

## 4. UI

- 顶部：返回地图、标题、1x/2x/4x、重播、暂停/继续。
- 左侧：双方兵力条、控制省份/百分比、单位数。
- 右侧：时间/地点/人物/结果/影响、战报、图层。
- 底部：阶段时间轴 + 推演进度。
- 单位牌：阵营色条、单字、兵种、strength/morale 条；悬停显示兵力/士气/状态/省份。
- 省份：悬停显示名称/控制方/地形/驻军。
- 键盘：
  - `Space` 暂停/继续
  - `1/2/3` 速度 1x/2x/4x
  - `R` 重播
  - `L` 图层面板
  - `Esc` 返回地图
  - 地图模式下 `1/2/3` 仍按时间顺序切时期（隋唐/五代十国/宋朝）。

---

## 5. 验收

1. `e06` 进入 war 场景；省份地图 9 个，名称/控制/地形可见。
2. 战线只出现在相邻且归属不同的省界；省份易手后自动变化。
3. 单位 strength/morale 随战斗下降；低于阈值溃退/变灰。
4. 后周右军在第 0.42 阶段溃退；柴荣督战后反击；最终后周控制多数省份。
5. 同一 seed 重复运行结果一致；数值不越界。
6. 阶段时间轴/战报/速度/重播/跳阶段/图层/提示可用。
7. `Esc` 返回地图，卡片保持；连续进出 3 次无报错。
8. 1920×1080 / 1366×768 可用；无 console error / 无外部网络。
9. 明确“战术示意，不是精确历史阵图”；不编造精确兵力。
10. 只改 `scene` 数据即可换战场，引擎不改。

---

## 6. 当前试点（e06 高平之战）

- 省份：太原、代州、潞州、沁水、高平、壶关、端氏、泽州、陵川。
- 后周：中军（泽州）、右军（高平）、左军（沁水）。
- 北汉：中军（潞州）、前锋（壶关）；辽：代州。
- 阶段：北汉南下 → 高平接战 → 右军溃退 → 柴荣督战 → 北汉溃退 → 战后。
- 2026-10-23 调参结果：后周最终 7 省，北汉/辽各 1 省；高平先易手北汉、后收复；壶关/潞州在追击阶段易手。
- 数据来源：`docs/history/五代十国_资料包.md` e06；兵力/攻防为示意。
