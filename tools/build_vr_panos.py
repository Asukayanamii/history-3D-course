#!/usr/bin/env python3
"""
Build 2:1 equirectangular panorama placeholders from the existing 16:9 illustrations,
plus the missing e11 世宗改革 card/panorama placeholder.

These are NOT photographic 360 panoramas. The central 140-degree window is the AI
illustration; the rest is a procedural sky/ground/cloud/mountain extension with a
periodic seam so the 360 viewer wraps cleanly. Replace with GPT-Image2 true
equirectangular panoramas when available (see docs/prompts/04_GPT-Image2_VR全景.md).

Usage:
  python tools/build_vr_panos.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "course" / "assets"
PANO_W, PANO_H = 4096, 2048
CARD_W, CARD_H = 1920, 1080
JPEG_Q = 86

EVENTS = [
    ("wudai", f"e{i:02d}") for i in range(1, 11)
] + [
    ("suitang", f"e{i:02d}") for i in range(1, 7)
] + [
    ("song", f"e{i:02d}") for i in range(1, 5)
]


def avg_color(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int]:
    crop = img.crop(box).resize((1, 1), Image.Resampling.BOX)
    return crop.getpixel((0, 0))[:3]


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def periodic_color(x: int, w: int, left: tuple[int, int, int], right: tuple[int, int, int]) -> tuple[int, int, int]:
    # Periodic across the seam: x=0 and x=w produce the same color.
    t = 0.5 - 0.5 * math.cos(2.0 * math.pi * x / w)
    return mix(left, right, t)


def build_sky_ground(img: Image.Image) -> Image.Image:
    top = avg_color(img, (0, 0, img.width, max(8, img.height // 22)))
    bottom = avg_color(img, (0, img.height - max(8, img.height // 22), img.width, img.height))
    horizon = avg_color(img, (0, int(img.height * 0.42), img.width, int(img.height * 0.58)))
    left = avg_color(img, (0, 0, max(8, img.width // 30), img.height))
    right = avg_color(img, (img.width - max(8, img.width // 30), 0, img.width, img.height))
    top = mix(top, horizon, 0.28)
    top = mix(top, (206, 194, 172), 0.12)
    horizon = mix(horizon, (226, 210, 184), 0.08)

    grad = Image.new("RGB", (1, PANO_H))
    px = grad.load()
    for y in range(PANO_H):
        if y < PANO_H * 0.48:
            t = y / (PANO_H * 0.48)
            base = mix(top, horizon, t * 0.85)
        else:
            t = (y - PANO_H * 0.48) / (PANO_H * 0.52)
            base = mix(horizon, bottom, t * 0.9)
        px[0, y] = base
    bg = grad.resize((PANO_W, PANO_H), Image.Resampling.BILINEAR)

    # Add a gentle periodic side tint so left/right edges meet without a seam.
    strip = Image.new("RGB", (PANO_W, 1))
    spx = strip.load()
    for x in range(PANO_W):
        spx[x, 0] = periodic_color(x, PANO_W, left, right)
    tint = strip.resize((PANO_W, PANO_H), Image.Resampling.BILINEAR)
    bg = Image.blend(bg, tint, 0.18)
    return bg


def draw_sun(base: Image.Image, seed: int) -> Image.Image:
    rng = random.Random(seed + 99)
    sx = rng.choice([0.08, 0.16, 0.84, 0.92]) * PANO_W
    sy = PANO_H * 0.255
    layer = Image.new("RGBA", (PANO_W, PANO_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for r in range(430, 0, -10):
        a = int(3 + 24 * (1 - r / 430) ** 2.2)
        d.ellipse((sx - r, sy - r * 0.62, sx + r, sy + r * 0.62), fill=(255, 191, 112, a))
    d.ellipse((sx - 34, sy - 34, sx + 34, sy + 34), fill=(255, 224, 170, 120))
    layer = layer.filter(ImageFilter.GaussianBlur(30))
    return Image.alpha_composite(base, layer)


def draw_clouds(base: Image.Image, top: tuple[int, int, int], horizon: tuple[int, int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", (PANO_W, PANO_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(120):
        cx = rng.uniform(0, PANO_W)
        cy = rng.uniform(PANO_H * 0.04, PANO_H * 0.46)
        rw = rng.uniform(PANO_W * 0.025, PANO_W * 0.14)
        rh = rw * rng.uniform(0.10, 0.26)
        a = int(rng.uniform(14, 42))
        c = mix(horizon, (238, 230, 212), rng.uniform(0.08, 0.48))
        # draw three times for wrap continuity
        for ox in (-PANO_W, 0, PANO_W):
            d.ellipse((cx + ox - rw, cy - rh, cx + ox + rw, cy + rh), fill=c + (a,))
    layer = layer.filter(ImageFilter.GaussianBlur(24))
    return Image.alpha_composite(base, layer)


def draw_ground(base: Image.Image, bottom: tuple[int, int, int], horizon: tuple[int, int, int], seed: int) -> Image.Image:
    rng = random.Random(seed + 31)
    layer = Image.new("RGBA", (PANO_W, PANO_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for layer_i in range(6):
        base_y = PANO_H * (0.585 + layer_i * 0.055)
        amp = 30 + layer_i * 22
        k1, k2 = rng.randint(3, 6), rng.randint(7, 13)
        p1, p2 = rng.random() * 6.28, rng.random() * 6.28
        pts = []
        for x in range(0, PANO_W + 1, 22):
            u = x / PANO_W
            y = base_y - amp * (0.5 + 0.5 * math.sin(2 * math.pi * k1 * u + p1)) - amp * 0.35 * math.sin(2 * math.pi * k2 * u + p2)
            pts.append((int(x), int(y)))
        pts += [(PANO_W, PANO_H), (0, PANO_H)]
        c = mix(bottom, horizon, 0.08 + layer_i * 0.045)
        d.polygon(pts, fill=c + (205 - layer_i * 18,))
    layer = layer.filter(ImageFilter.GaussianBlur(3))
    return Image.alpha_composite(base, layer)


def draw_ridges(base: Image.Image, horizon_y: int, color: tuple[int, int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", (PANO_W, PANO_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for layer_i in range(3):
        amp = 70 + layer_i * 38
        base_y = horizon_y + 10 + layer_i * 26
        k1, k2, k3 = rng.randint(2, 4), rng.randint(5, 8), rng.randint(9, 15)
        p1, p2, p3 = rng.random() * 6.28, rng.random() * 6.28, rng.random() * 6.28
        pts = []
        for x in range(0, PANO_W + 1, 24):
            u = x / PANO_W
            y = base_y - amp * (0.5 + 0.5 * math.sin(2 * math.pi * k1 * u + p1)) - amp * 0.28 * math.sin(2 * math.pi * k2 * u + p2) - amp * 0.12 * math.sin(2 * math.pi * k3 * u + p3)
            pts.append((x, y))
        pts += [(PANO_W, PANO_H), (0, PANO_H)]
        c = mix(color, (8, 10, 9), 0.15 + layer_i * 0.18)
        d.polygon([(int(x), int(y)) for x, y in pts], fill=c + (150 - layer_i * 28,))
    layer = layer.filter(ImageFilter.GaussianBlur(5))
    return Image.alpha_composite(base, layer)


def vignette(img: Image.Image, strength: int = 110) -> Image.Image:
    small = Image.new("L", (256, 128), 0)
    px = small.load()
    for y in range(128):
        for x in range(256):
            dx = (x - 128) / 128.0
            dy = (y - 64) / 64.0
            r = min(1.0, math.sqrt(dx * dx + dy * dy) / 1.15)
            px[x, y] = int((r ** 2.2) * strength)
    mask = small.resize(img.size, Image.Resampling.BILINEAR)
    black = Image.new("RGBA", img.size, (4, 8, 7, 255))
    black.putalpha(mask)
    return Image.alpha_composite(img.convert("RGBA"), black).convert("RGB")


def make_pano(src: Path, out: Path, seed: int) -> None:
    img = Image.open(src).convert("RGB")
    # The 16:9 illustration fills a 180-degree window around the horizon.
    cw = int(PANO_W * 180 / 360)
    ch = int(cw * 9 / 16)
    central = ImageOps.fit(img, (cw, ch), Image.Resampling.LANCZOS)
    top = avg_color(img, (0, 0, img.width, max(8, img.height // 20)))
    bottom = avg_color(img, (0, img.height - max(8, img.height // 20), img.width, img.height))
    horizon = avg_color(img, (0, int(img.height * 0.44), img.width, int(img.height * 0.56)))

    base = build_sky_ground(img).convert("RGBA")
    base = draw_sun(base, seed)
    base = draw_clouds(base, top, horizon, seed)
    base = draw_ridges(base, int(PANO_H * 0.56), mix(bottom, horizon, 0.35), seed + 7)
    base = draw_ground(base, bottom, horizon, seed)

    # Soft color extension immediately left/right of the central window.
    ext_w = int(PANO_W * 0.22)
    ext_h = ch
    ext = ImageOps.fit(img, (ext_w, ext_h), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(46))
    ext_mask = Image.new("L", (ext_w, ext_h), 0)
    ImageDraw.Draw(ext_mask).rectangle((0, 0, ext_w, ext_h), fill=110)
    ext_mask = ext_mask.filter(ImageFilter.GaussianBlur(40))
    x0 = (PANO_W - cw) // 2
    y0 = PANO_H // 2 - ch // 2
    base.paste(ext, (x0 - ext_w + 40, y0), ext_mask)
    base.paste(ext.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (x0 + cw - 40, y0), ext_mask)

    # Central illustration with a feathered mask.
    mask = Image.new("L", (cw, ch), 0)
    md = ImageDraw.Draw(mask)
    feather = 90
    md.rectangle((feather, feather, cw - feather, ch - feather), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.75))
    base.paste(central, (x0, y0), mask)

    # Horizon haze to blend the lower edge into the ground.
    haze = Image.new("RGBA", (PANO_W, PANO_H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(haze)
    for i in range(70):
        y = int(PANO_H * 0.56 + i)
        a = int(70 * (1 - i / 70))
        hd.line((0, y, PANO_W, y), fill=horizon + (a,))
    haze = haze.filter(ImageFilter.GaussianBlur(18))
    base = Image.alpha_composite(base, haze)

    result = vignette(base.convert("RGB"), 120)
    out.parent.mkdir(parents=True, exist_ok=True)
    result.save(out, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
    print(f"  {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB")


def make_court_card(out: Path) -> None:
    """Procedural placeholder card for the new e11 event (no text, no fake image)."""
    img = Image.new("RGB", (CARD_W, CARD_H), (20, 15, 12))
    d = ImageDraw.Draw(img)
    # Warm wall gradient
    for y in range(CARD_H):
        t = y / CARD_H
        c = mix((45, 32, 24), (16, 13, 11), t)
        d.line((0, y, CARD_W, y), fill=c)
    # Floor
    horizon = int(CARD_H * 0.66)
    for y in range(horizon, CARD_H):
        t = (y - horizon) / (CARD_H - horizon)
        c = mix((54, 40, 28), (24, 19, 15), t)
        d.line((0, y, CARD_W, y), fill=c)
    # Back screen / throne glow
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(420, 0, -14):
        a = int(18 * (1 - r / 420))
        gd.ellipse((CARD_W / 2 - r * 1.3, 150 - r * 0.45, CARD_W / 2 + r * 1.3, 150 + r * 0.95), fill=(196, 142, 74, a))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)
    # Screen
    d.rectangle((CARD_W / 2 - 250, 130, CARD_W / 2 + 250, 560), fill=(58, 42, 30), outline=(120, 88, 52), width=7)
    for i in range(5):
        x = CARD_W / 2 - 200 + i * 100
        d.line((x, 170, x, 520), fill=(80, 58, 38), width=3)
    # Pillars
    for x in (180, 420, CARD_W - 420, CARD_W - 180):
        d.rectangle((x - 28, 80, x + 28, horizon + 50), fill=(72, 34, 26))
        d.rectangle((x - 42, 62, x + 42, 96), fill=(120, 76, 42))
        d.rectangle((x - 38, horizon + 42, x + 38, horizon + 62), fill=(120, 76, 42))
    # Throne platform
    d.polygon([(CARD_W / 2 - 300, 760), (CARD_W / 2 + 300, 760), (CARD_W / 2 + 360, 900), (CARD_W / 2 - 360, 900)], fill=(46, 34, 25))
    d.rectangle((CARD_W / 2 - 180, 600, CARD_W / 2 + 180, 760), fill=(62, 44, 30), outline=(120, 86, 48), width=5)
    # Emperor silhouette
    d.ellipse((CARD_W / 2 - 44, 520, CARD_W / 2 + 44, 608), fill=(30, 24, 20))
    d.polygon([(CARD_W / 2 - 92, 610), (CARD_W / 2 + 92, 610), (CARD_W / 2 + 130, 760), (CARD_W / 2 - 130, 760)], fill=(102, 38, 32))
    # Officials, two rows
    rng = random.Random(955)
    for side in (-1, 1):
        for i in range(4):
            bx = CARD_W / 2 + side * (300 + i * 150)
            by = 770 - i * 45
            h = 150 + i * 8
            d.ellipse((bx - 24, by - h, bx + 24, by - h + 48), fill=(36, 30, 24))
            robe = mix((36, 54, 50), (70, 58, 38), rng.random() * 0.6)
            d.polygon([(bx - 34, by - h + 48), (bx + 34, by - h + 48), (bx + 50, by + 10), (bx - 50, by + 10)], fill=robe)
            d.polygon([(bx - 8, by - h + 72), (bx + 8, by - h + 72), (bx + 12, by - h + 22), (bx - 12, by - h + 22)], fill=(120, 104, 72))
    # Candles
    for x in (320, 640, CARD_W - 640, CARD_W - 320):
        d.rectangle((x - 6, 690, x + 6, 760), fill=(80, 64, 42))
        d.ellipse((x - 13, 670, x + 13, 700), fill=(238, 168, 72))
    # Floor perspective lines
    for x in range(-600, CARD_W + 600, 120):
        d.line((CARD_W / 2 + (x - CARD_W / 2) * 0.35, horizon, x, CARD_H), fill=(38, 30, 23), width=2)
    for i in range(5):
        y = horizon + int((CARD_H - horizon) * (i / 5) ** 1.6)
        d.line((0, y, CARD_W, y), fill=(42, 33, 25), width=2)
    img = vignette(img, 150)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"  {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB")


def main() -> None:
    print("Building 2:1 panorama placeholders...")
    for theme, eid in EVENTS:
        src = ASSETS / "events" / theme / f"{eid}.jpg"
        if not src.exists():
            print(f"  ! missing source, skipped: {src.relative_to(ROOT)}")
            continue
        out = ASSETS / "vr" / theme / f"{eid}.jpg"
        make_pano(src, out, seed=sum(ord(c) for c in theme + eid))

    # New e11 event: procedural card + pano placeholder.
    card = ASSETS / "events" / "wudai" / "e11.jpg"
    make_court_card(card)
    make_pano(card, ASSETS / "vr" / "wudai" / "e11.jpg", seed=955)

    print("\nDone. Replace any generated 2:1 file with a GPT-Image2 true equirectangular pano when ready.")


if __name__ == "__main__":
    main()
