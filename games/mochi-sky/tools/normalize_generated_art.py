#!/usr/bin/env python3
"""Normalize AI-generated art sources into Mochi Sky runtime assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

EYE_DARK = (58, 35, 86, 255)
EYE_MID = (126, 89, 170, 255)
EYE_LIGHT = (236, 226, 255, 255)
EYE_SHADOW = (30, 18, 46, 255)


def chroma_to_alpha(img: Image.Image) -> Image.Image:
    src = img.convert("RGBA")
    key = src.getpixel((0, 0))[:3]
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    pixels = src.load()
    out_pixels = out.load()

    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = pixels[x, y]
            dist = abs(r - key[0]) + abs(g - key[1]) + abs(b - key[2])
            if dist < 56:
                alpha = 0
            elif dist < 165:
                alpha = int((dist - 56) / 109 * 255)
            else:
                alpha = a
            if alpha:
                # Mild despill for generated green-key edges.
                if g > r + 38 and g > b + 38:
                    g = max(r, b)
                out_pixels[x, y] = (r, g, b, alpha)

    return out


def equal_frame_sheet(source: Image.Image, frames: int, cell_w: int, cell_h: int) -> Image.Image:
    src = source.convert("RGBA")
    out = Image.new("RGBA", (frames * cell_w, cell_h), (0, 0, 0, 0))

    for frame in range(frames):
        x0 = round(src.width * frame / frames)
        x1 = round(src.width * (frame + 1) / frames)
        column = src.crop((x0, 0, x1, src.height))
        bbox = column.getchannel("A").getbbox()
        if not bbox:
            continue
        crop = column.crop(bbox)
        max_w = cell_w - 6
        max_h = cell_h - 6
        scale = min(max_w / crop.width, max_h / crop.height)
        new_w = max(1, round(crop.width * scale))
        new_h = max(1, round(crop.height * scale))
        resized = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
        dx = frame * cell_w + (cell_w - new_w) // 2
        dy = cell_h - new_h - 3
        out.alpha_composite(resized, (dx, dy))

    return out


def rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=fill)


def mosaic_eye(draw: ImageDraw.ImageDraw, x: int, y: int, s: int = 2, closed: bool = False) -> None:
    if closed:
        rect(draw, x, y + s, 5 * s, s, EYE_DARK)
        rect(draw, x + 3 * s, y, 2 * s, s, EYE_MID)
        rect(draw, x + 5 * s, y + s, s, s, EYE_LIGHT)
        return

    rect(draw, x, y, 4 * s, 5 * s, EYE_DARK)
    rect(draw, x + 2 * s, y + s, 3 * s, 4 * s, EYE_MID)
    rect(draw, x + s, y, s, s, EYE_LIGHT)
    rect(draw, x + 3 * s, y + 3 * s, s, s, EYE_SHADOW)


def add_inhale_mosaic_eyes(sheet: Image.Image) -> Image.Image:
    img = sheet.convert("RGBA")
    draw = ImageDraw.Draw(img)
    eyes = [
        [(50, 27, False), (61, 27, False)],
        [(52, 29, False), (62, 29, False)],
        [(52, 22, False), (62, 22, False)],
        [(52, 22, False), (61, 22, False)],
        [(52, 22, False), (61, 22, False)],
        [(38, 22, True), (49, 22, True)],
        [(42, 22, True), (53, 22, True)],
        [(45, 22, True), (56, 22, True)],
    ]
    for frame, frame_eyes in enumerate(eyes):
        for x, y, closed in frame_eyes:
            mosaic_eye(draw, frame * 96 + x, y, 2, closed)
    return img


def fit_cover(img: Image.Image, width: int, height: int, focus_y: float = 0.5) -> Image.Image:
    src = img.convert("RGBA")
    scale = max(width / src.width, height / src.height)
    new_size = (round(src.width * scale), round(src.height * scale))
    resized = src.resize(new_size, Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = round((resized.height - height) * focus_y)
    top = max(0, min(top, resized.height - height))
    return resized.crop((left, top, left + width, top + height))


def make_map_assets() -> None:
    source = Image.open(ASSETS / "mochi-sky-map-source.png").convert("RGBA")
    backdrop = fit_cover(source, 384, 216, focus_y=0.34)
    backdrop.save(ASSETS / "mochi-sky-backdrop.png")

    w, h = source.size
    tile_box = (
        int(w * 0.40),
        int(h * 0.66),
        int(w * 0.82),
        int(h * 0.88),
    )
    tile = source.crop(tile_box).resize((128, 64), Image.Resampling.LANCZOS)
    tile.save(ASSETS / "mochi-sky-tiles.png")


def main() -> None:
    mochi_source = chroma_to_alpha(Image.open(ASSETS / "mochi-sky-mochi-action-sheet-source.png"))
    mochi_source.save(ASSETS / "mochi-sky-mochi-action-sheet.png")
    equal_frame_sheet(mochi_source, frames=8, cell_w=64, cell_h=64).save(
        ASSETS / "mochi-sky-mochi-action-game-sheet.png"
    )

    inhale_source = Image.open(ASSETS / "mochi-sky-inhale-sheet.png").convert("RGBA")
    inhale = equal_frame_sheet(inhale_source, frames=8, cell_w=96, cell_h=64)
    add_inhale_mosaic_eyes(inhale).save(ASSETS / "mochi-sky-inhale-game-sheet.png")

    enemy_source = chroma_to_alpha(Image.open(ASSETS / "mochi-sky-enemy-sheet-source.png"))
    enemy_source.save(ASSETS / "mochi-sky-enemy-sheet.png")
    equal_frame_sheet(enemy_source, frames=8, cell_w=48, cell_h=48).save(ASSETS / "mochi-sky-enemy-game-sheet.png")

    star_source = chroma_to_alpha(Image.open(ASSETS / "mochi-sky-star-sheet-source.png"))
    star_source.save(ASSETS / "mochi-sky-star-sheet.png")
    equal_frame_sheet(star_source, frames=8, cell_w=32, cell_h=32).save(ASSETS / "mochi-sky-star-game-sheet.png")

    make_map_assets()


if __name__ == "__main__":
    main()
