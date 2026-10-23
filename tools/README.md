# tools · 构建脚本

这些脚本只在**开发/构建期**运行；`course/index.html` 运行时不需要 Python、不会联网。

## 依赖

- Python 3.10+
- Pillow（`python -m pip install pillow`）
- 网络（仅 `build_dem.py` 首次下载瓦片；之后走缓存）

## 1. DEM

```bash
python tools/build_dem.py --validate
```

- 来源：Mapzen / Joerd Terrain Tiles（AWS Open Data）
- 瓦片：`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
- 输出：`course/data/dem/regions.js`（Int16LE base64）
- 缓存：`tools/.dem-cache/`（不提交）
- 修改说明与 attribution：`docs/handoff/DEM_SOURCES.md`

## 2. 2:1 全景 / e11 占位图

```bash
python tools/build_vr_panos.py
```

- 输入：`course/assets/events/<theme>/<event>.jpg`（16:9）
- 输出：`course/assets/vr/<theme>/<event>.jpg`（4096×2048，2:1 全景示意）
- 输出：`course/assets/events/wudai/e11.jpg`（程序化朝堂占位图）
- 说明：不是全景摄影；中央 180° 为插画，其余为程序化扩展。
- 真全景替换见 `docs/prompts/04_GPT-Image2_VR全景.md`。

## 注意

- `regions.js`、`assets/vr/*.jpg`、`events/wudai/e11.jpg` 是生成物；不要手改。
- 真全景到位后不要再运行 `build_vr_panos.py`，否则会覆盖同名文件。
- `.dem-cache` 与 `.build-dem.log` 不应提交。
