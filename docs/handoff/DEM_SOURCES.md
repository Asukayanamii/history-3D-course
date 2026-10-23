# DEM 地形数据来源与许可

> 日期：2026-10-23
> 用途：`course/data/dem/regions.js` 的生成来源；主沙盘与战场地形的可追溯记录。
> 原则：外部数据必须可追溯；派生数据说明修改；不用于导航或测绘。

---

## 1. 来源

| 项 | 内容 |
|---|---|
| 数据集 | Mapzen / Joerd Terrain Tiles（AWS Open Data） |
| 入口 | https://registry.opendata.aws/terrain-tiles/ |
| 瓦片 URL | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` |
| 格式 | Terrarium PNG：`elevation_m = R*256 + G + B/256 - 32768` |
| 访问日期 | 2026-10-23 |
| 原始分辨率 | SRTM / GMTED2010 / 3DEP / ETOPO1（按区域） |

### 数据组成与许可

- **SRTM**（NASA/NGA，USGS 分发）：公有领域；USGS 请求在再分发/展示时署名。
- **GMTED2010**（USGS）：公有领域；USGS 请求署名。
- **3DEP / NED**（USGS）：公有领域；USGS 请求署名。
- **ETOPO1**（NOAA/NCEI）：公有领域；不用于导航。
- **瓦片打包**：Mapzen / Linux Foundation，按 Joerd attribution 要求保留署名。

### 必需 attribution（完整）

```text
Terrain Tiles by Mapzen / Linux Foundation, accessed 2026-10-23 from AWS Open Data.
SRTM, GMTED2010 and 3DEP terrain data courtesy of the U.S. Geological Survey;
ETOPO1 terrain data courtesy of NOAA/NCEI.
```

> Joerd 的完整 attribution 还包含 ArcticDEM、Australia、Austria、Canada、EU-DEM、Mexico、New Zealand、Norway、UK 等数据源；本项目只使用覆盖东亚的 SRTM/GMTED/ETOPO1 部分，未使用上述区域数据。若后续切换到其他区域，必须补齐对应条目。

---

## 2. 派生文件

生成脚本：`tools/build_dem.py`（Pillow；构建期运行，不影响离线运行）。

输出：`course/data/dem/regions.js`（约 2.9MB）

| id | 范围（W/E/S/N） | 步长 | 尺寸 | 用途 |
|---|---|---|---|---|
| `east-asia` | 96–130, 15–48 | 0.06° | 568×551 | 三个时期主沙盘 |
| `gaoping` | 111.4–114.6, 34.8–38.2 | 0.008° | 401×426 | 高平之战 |
| `hebei` | 114.8–117.8, 37.5–41.0 | 0.008° | 376×439 | 范阳/燕京/瓦桥关/瀛州 |
| `guanzhong` | 107.8–113.5, 33.5–35.4 | 0.008° | 714×238 | 长安/潼关/洛阳/香积寺 |
| `huainan` | 114.0–117.9, 31.5–36.6 | 0.008° | 489×639 | 汴州/陈桥/寿州/澶州 |

### 修改说明

1. 从 Web Mercator 瓦片双线性采样到经纬度网格。
2. 转为 Int16LE，base64 嵌入 JS；页面不 fetch。
3. 主沙盘垂直夸张 22×；战场 9×；仅用于课堂可视化。
4. 未做水文/行政边界/导航级校正；不可用于导航、测绘或工程决策。

### 校验样例（米）

| 点 | 经度 | 纬度 | 高程 |
|---|---:|---:|---:|
| 高平 | 112.92 | 35.80 | 835.0 |
| 太原 | 112.55 | 37.87 | 788.6 |
| 北京 | 116.40 | 39.90 | 51.0 |
| 瓦桥关 | 116.00 | 39.00 | 10.0 |
| 潼关 | 110.29 | 34.48 | 705.5 |
| 西安 | 108.94 | 34.34 | 383.5 |
| 寿州 | 116.78 | 32.60 | 20.5 |
| 开封 | 114.31 | 34.80 | 73.8 |
| 成都 | 104.06 | 30.66 | 497.0 |
| 上海 | 121.47 | 31.23 | 9.2 |
| 西宁 | 101.78 | 36.62 | 2313.3 |

---

## 3. 重建

```bash
python tools/build_dem.py           # 用缓存重建
python tools/build_dem.py --validate  # 打印 known-point 校验
```

- 瓦片缓存：`tools/.dem-cache/`（不提交）。
- 网络失败时会重试；若瓦片缺失则填 0，并在控制台提示。
- 输出文件为生成物，不要手改。

---

## 4. 产品内展示

- 「来源与授权」弹窗的“地形数据（DEM）”表；
- 图例“地形：SRTM/GMTED/ETOPO1 真实高程（垂直夸张 22×，非导航数据）”；
- `course/data/license.js` 的 `dem` 段；
- 本文件与 `docs/需求修订_v0.4.md`。

---

## 5. 不做的事

- 不把 DEM 瓦片原图提交到仓库；
- 不声称地形是精确历史地形（历史时期的地表形态与今天不同）；
- 不把垂直夸张后的高度当作真实海拔读数；
- 不用地形数据推断历史边界、行军路线或兵力。
