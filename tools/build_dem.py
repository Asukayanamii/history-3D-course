#!/usr/bin/env python3
"""
Bake real DEM grids for the offline course from Mapzen/Joerd Terrain Tiles.

Source: https://registry.opendata.aws/terrain-tiles/
Tiles:  https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
Format: Terrarium PNG, elevation_m = R * 256 + G + B / 256 - 32768

Output: course/data/dem/regions.js  (window.HISTORY_DEM)
The generated file contains downsampled Int16 grids only; no source PNGs are committed.

Usage:
  python tools/build_dem.py
  python tools/build_dem.py --validate
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "course" / "data" / "dem" / "regions.js"
CACHE = ROOT / "tools" / ".dem-cache"
ACCESSED = "2026-10-23"
TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"

SOURCE = {
    "name": "Mapzen / Joerd Terrain Tiles (AWS Open Data)",
    "url": "https://registry.opendata.aws/terrain-tiles/",
    "tileUrl": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
    "license": "SRTM/GMTED2010/3DEP (USGS) and ETOPO1 (NOAA) are public domain; tile packaging/attribution follows Joerd.",
    "attribution": (
        "Terrain Tiles by Mapzen / Linux Foundation, accessed 2026-10-23 from AWS Open Data. "
        "SRTM, GMTED2010 and 3DEP terrain data courtesy of the U.S. Geological Survey; "
        "ETOPO1 terrain data courtesy of NOAA/NCEI. "
        "This course uses downsampled, reprojected Int16 grids derived from the tiles; "
        "vertical exaggeration is applied only for classroom visualization. Not for navigation."
    ),
    "accessed": ACCESSED,
}

# Bounds are (west, east, south, north) in WGS84 degrees.
# step is the output sample spacing in degrees; zoom is the source tile zoom.
REGIONS = [
    {
        "id": "east-asia",
        "label": "东亚主沙盘",
        "bounds": (96.0, 130.0, 15.0, 48.0),
        "zoom": 7,
        "step": 0.06,
    },
    {
        "id": "gaoping",
        "label": "高平之战",
        "bounds": (111.4, 114.6, 34.8, 38.2),
        "zoom": 9,
        "step": 0.008,
    },
    {
        "id": "hebei",
        "label": "河北战场（范阳/燕京/瓦桥关/瀛州）",
        "bounds": (114.8, 117.8, 37.5, 41.0),
        "zoom": 9,
        "step": 0.008,
    },
    {
        "id": "guanzhong",
        "label": "关中战场（长安/潼关/洛阳/香积寺）",
        "bounds": (107.8, 113.5, 33.5, 35.4),
        "zoom": 9,
        "step": 0.008,
    },
    {
        "id": "huainan",
        "label": "中原淮南战场（汴州/陈桥/寿州/澶州）",
        "bounds": (114.0, 117.9, 31.5, 36.6),
        "zoom": 9,
        "step": 0.008,
    },
]

_IMAGES: dict[tuple[int, int, int], Image.Image | None] = {}


def tile_xy(lon: float, lat: float, zoom: int) -> tuple[float, float]:
    n = 2 ** zoom
    x = (lon + 180.0) / 360.0 * n
    lat = max(-85.05112878, min(85.05112878, lat))
    r = math.radians(lat)
    y = (1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * n
    return x, y


def cache_path(zoom: int, x: int, y: int) -> Path:
    return CACHE / str(zoom) / str(x) / f"{y}.png"


def fetch_tile(zoom: int, x: int, y: int) -> Image.Image | None:
    key = (zoom, x, y)
    if key in _IMAGES:
        return _IMAGES[key]
    path = cache_path(zoom, x, y)
    if path.exists():
        try:
            img = Image.open(path).convert("RGB")
            _IMAGES[key] = img
            return img
        except Exception:
            pass
    url = TILE_URL.format(z=zoom, x=x, y=y)
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "History3DCourse/1.0 (classroom demo)"})
            with urllib.request.urlopen(req, timeout=45) as resp:
                raw = resp.read()
            img = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(raw)
            _IMAGES[key] = img
            return img
        except Exception as exc:
            last = exc
            time.sleep(0.8 + attempt)
    print(f"  ! tile {zoom}/{x}/{y} failed: {last}", file=sys.stderr)
    _IMAGES[key] = None
    return None


def pixel_elev(zoom: int, px: int, py: int) -> float:
    n = 2 ** zoom
    if px < 0 or py < 0 or px >= n * 256 or py >= n * 256:
        return 0.0
    tx, ty = px // 256, py // 256
    lx, ly = px % 256, py % 256
    img = fetch_tile(zoom, tx, ty)
    if img is None:
        return 0.0
    r, g, b = img.getpixel((lx, ly))
    return r * 256.0 + g + b / 256.0 - 32768.0


def sample_meters(zoom: int, lon: float, lat: float) -> float:
    x, y = tile_xy(lon, lat, zoom)
    px, py = x * 256.0, y * 256.0
    x0, y0 = int(math.floor(px)), int(math.floor(py))
    fx, fy = px - x0, py - y0
    e00 = pixel_elev(zoom, x0, y0)
    e10 = pixel_elev(zoom, x0 + 1, y0)
    e01 = pixel_elev(zoom, x0, y0 + 1)
    e11 = pixel_elev(zoom, x0 + 1, y0 + 1)
    return (
        e00 * (1 - fx) * (1 - fy)
        + e10 * fx * (1 - fy)
        + e01 * (1 - fx) * fy
        + e11 * fx * fy
    )


def build_region(region: dict, index: int, total: int) -> dict:
    west, east, south, north = region["bounds"]
    step = region["step"]
    zoom = region["zoom"]
    cols = int(round((east - west) / step)) + 1
    rows = int(round((north - south) / step)) + 1
    print(f"[{index}/{total}] {region['id']}: {cols}x{rows} @ z{zoom}  ({region['label']})")

    values: list[int] = []
    mn, mx = 10**9, -10**9
    for j in range(rows):
        lat = north - (j * step)
        if j == rows - 1:
            lat = south
        for i in range(cols):
            lon = west + (i * step)
            if i == cols - 1:
                lon = east
            h = sample_meters(zoom, lon, lat)
            v = int(round(max(-12000.0, min(9000.0, h))))
            values.append(v)
            if v < mn:
                mn = v
            if v > mx:
                mx = v
        if j % max(1, rows // 12) == 0:
            print(f"    row {j + 1}/{rows}")

    raw = bytearray()
    for v in values:
        u = v & 0xFFFF
        raw.append(u & 0xFF)
        raw.append((u >> 8) & 0xFF)
    b64 = base64.b64encode(bytes(raw)).decode("ascii")

    return {
        "id": region["id"],
        "label": region["label"],
        "bounds": {"west": west, "east": east, "south": south, "north": north},
        "cols": cols,
        "rows": rows,
        "stepLon": step,
        "stepLat": step,
        "encoding": "int16le-base64",
        "min": mn,
        "max": mx,
        "source": dict(SOURCE, zoom=zoom),
        "data": b64,
    }


def write_js(defs: list[dict]) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        "/* Generated by tools/build_dem.py — do not hand-edit.",
        " * Source: Mapzen / Joerd Terrain Tiles, AWS Open Data.",
        " * See docs/handoff/DEM_SOURCES.md for attribution and modifications.",
        " */",
        "window.HISTORY_DEM = window.HISTORY_DEM || {};",
    ]
    for d in defs:
        meta = {k: v for k, v in d.items() if k != "data"}
        payload = json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
        parts.append(f'window.HISTORY_DEM[{json.dumps(d["id"])}] = {payload[:-1]},"data":"{d["data"]}"}};')
    OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"\nWrote {OUT} ({OUT.stat().st_size / 1024 / 1024:.2f} MB)")


def sample_def(d: dict, lon: float, lat: float) -> float:
    b = d["bounds"]
    step = d["stepLon"]
    fx = (lon - b["west"]) / step
    fy = (b["north"] - lat) / step
    cols, rows = d["cols"], d["rows"]
    i0 = max(0, min(cols - 1, int(math.floor(fx))))
    j0 = max(0, min(rows - 1, int(math.floor(fy))))
    i1 = min(cols - 1, i0 + 1)
    j1 = min(rows - 1, j0 + 1)
    tx, ty = fx - i0, fy - j0
    raw = base64.b64decode(d["data"])
    import array
    arr = array.array("h")
    arr.frombytes(raw)
    if sys.byteorder != "little":
        arr.byteswap()
    def v(i, j):
        return arr[j * cols + i]
    return (
        v(i0, j0) * (1 - tx) * (1 - ty)
        + v(i1, j0) * tx * (1 - ty)
        + v(i0, j1) * (1 - tx) * ty
        + v(i1, j1) * tx * ty
    )


def validate(defs: list[dict]) -> None:
    checks = [
        ("高平", 112.92, 35.80, "gaoping"),
        ("太原", 112.55, 37.87, "gaoping"),
        ("北京", 116.40, 39.90, "hebei"),
        ("瓦桥关", 116.00, 39.00, "hebei"),
        ("潼关", 110.29, 34.48, "guanzhong"),
        ("西安", 108.94, 34.34, "guanzhong"),
        ("洛阳", 112.45, 34.62, "guanzhong"),
        ("寿州", 116.78, 32.60, "huainan"),
        ("开封", 114.31, 34.80, "huainan"),
        ("澶州", 115.00, 35.70, "huainan"),
        ("成都", 104.06, 30.66, "east-asia"),
        ("上海", 121.47, 31.23, "east-asia"),
        ("西宁", 101.78, 36.62, "east-asia"),
        ("珠峰", 86.92, 27.99, None),
    ]
    by_id = {d["id"]: d for d in defs}
    print("\n--- validation (meters) ---")
    for name, lon, lat, rid in checks:
        d = by_id.get(rid) if rid else None
        if d is None:
            # east-asia does not cover 86E; skip
            print(f"{name:8s} {lon:7.2f},{lat:6.2f}  (outside east-asia bounds)")
            continue
        h = sample_def(d, lon, lat)
        print(f"{name:8s} {lon:7.2f},{lat:6.2f}  {h:8.1f} m  [{rid}]")
    for d in defs:
        print(f"{d['id']:10s} {d['cols']}x{d['rows']}  min {d['min']:6d}  max {d['max']:6d}  {len(base64.b64decode(d['data']))/1024/1024:.2f} MB raw")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--validate", action="store_true", help="print known-point elevations after building")
    ap.add_argument("--skip-build", action="store_true", help="only validate an existing output file")
    args = ap.parse_args()

    if args.skip_build and OUT.exists():
        text = OUT.read_text(encoding="utf-8")
        # Re-run the builder only if validation of the existing generated file is requested.
        print("--skip-build with --validate is intentionally unsupported; rebuilding is cheap with cache.")
        return

    defs = []
    for i, region in enumerate(REGIONS, 1):
        defs.append(build_region(region, i, len(REGIONS)))
    write_js(defs)
    if args.validate:
        validate(defs)


if __name__ == "__main__":
    main()
