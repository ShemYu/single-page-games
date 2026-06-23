#!/usr/bin/env python3
"""Generate project-local pixel art assets for Mochi Sky."""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

INK = (52, 32, 61, 255)
PINK = (255, 132, 183, 255)
PINK_DARK = (230, 87, 138, 255)
PINK_LIGHT = (255, 195, 218, 255)
FOOT = (232, 82, 120, 255)
YELLOW = (255, 226, 109, 255)
YELLOW_DARK = (229, 169, 71, 255)
WHITE = (255, 248, 232, 255)
MINT = (199, 246, 230, 255)
MINT_DARK = (118, 202, 188, 255)
PURPLE = (116, 87, 165, 255)
EYE_DARK = (58, 35, 86, 255)
EYE_MID = (126, 89, 170, 255)
EYE_LIGHT = (231, 220, 255, 255)


def rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=fill)


def circle(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, fill) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)


def star(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: int = 1) -> None:
    pts = []
    for i in range(10):
        radius = 8 * scale if i % 2 == 0 else 3.5 * scale
        angle = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    draw.polygon(pts, fill=YELLOW_DARK)
    pts = []
    for i in range(10):
        radius = 6 * scale if i % 2 == 0 else 2.5 * scale
        angle = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    draw.polygon(pts, fill=YELLOW)
    rect(draw, cx - 1 * scale, cy - 4 * scale, 2 * scale, 2 * scale, WHITE)


def mosaic_eye(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int = 1, closed: bool = False) -> None:
    if closed:
        rect(draw, x, y + scale, 4 * scale, scale, EYE_DARK)
        rect(draw, x + 3 * scale, y, 2 * scale, scale, EYE_MID)
        return

    rect(draw, x, y, 4 * scale, 5 * scale, EYE_DARK)
    rect(draw, x + 2 * scale, y + scale, 3 * scale, 4 * scale, EYE_MID)
    rect(draw, x + scale, y, scale, scale, EYE_LIGHT)
    rect(draw, x + 3 * scale, y + 3 * scale, scale, scale, (31, 20, 48, 255))


def draw_mochi(draw: ImageDraw.ImageDraw, ox: int, oy: int, frame: str) -> None:
    bob = -1 if frame in {"walk_a", "walk_c"} else 0
    if frame == "jump":
        rect(draw, ox + 7, oy + 25, 8, 4, FOOT)
        rect(draw, ox + 18, oy + 24, 9, 4, FOOT)
    elif frame == "walk_b":
        rect(draw, ox + 4, oy + 25, 10, 4, FOOT)
        rect(draw, ox + 18, oy + 26, 9, 4, FOOT)
    elif frame == "walk_c":
        rect(draw, ox + 7, oy + 26, 9, 4, FOOT)
        rect(draw, ox + 18, oy + 25, 10, 4, FOOT)
    elif frame == "walk_d":
        rect(draw, ox + 5, oy + 26, 8, 4, FOOT)
        rect(draw, ox + 20, oy + 26, 8, 4, FOOT)
    else:
        rect(draw, ox + 5, oy + 26, 9, 4, FOOT)
        rect(draw, ox + 18, oy + 26, 9, 4, FOOT)

    circle(draw, ox + 16, oy + 14 + bob, 12, PINK_DARK)
    circle(draw, ox + 16, oy + 13 + bob, 11, PINK)
    rect(draw, ox + 3, oy + 12 + bob, 5, 8, PINK)
    rect(draw, ox + 3, oy + 18 + bob, 4, 2, PINK_DARK)
    rect(draw, ox + 10, oy + 5 + bob, 7, 3, PINK_LIGHT)
    rect(draw, ox + 8, oy + 8 + bob, 3, 5, PINK_LIGHT)
    if frame == "inhale":
        rect(draw, ox + 22, oy + 11 + bob, 7, 8, INK)
        rect(draw, ox + 25, oy + 14 + bob, 3, 3, (123, 54, 87, 255))
        mosaic_eye(draw, ox + 12, oy + 8 + bob, 1)
        for i in range(3):
            rect(draw, ox + 31 + i * 6, oy + 9 + i * 4, 6 + i, 2, (255, 249, 210, 210))
    else:
        mosaic_eye(draw, ox + 12, oy + 8 + bob, 1)
        mosaic_eye(draw, ox + 20, oy + 8 + bob, 1)
        rect(draw, ox + 17, oy + 16 + bob, 4, 2, (217, 79, 124, 255))
        rect(draw, ox + 8, oy + 15 + bob, 4, 2, (244, 95, 143, 255))


def draw_enemy(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    circle(draw, ox + 12, oy + 11, 10, MINT_DARK)
    circle(draw, ox + 12, oy + 9, 9, MINT)
    rect(draw, ox + 5, oy + 16, 14, 4, MINT_DARK)
    rect(draw, ox + 7, oy + 4, 6, 3, (232, 255, 247, 255))
    rect(draw, ox + 8, oy + 9, 2, 4, INK)
    rect(draw, ox + 15, oy + 9, 2, 4, INK)
    rect(draw, ox + 11, oy + 15, 3, 1, (241, 136, 171, 255))


def draw_heart(draw: ImageDraw.ImageDraw, ox: int, oy: int, fill) -> None:
    rect(draw, ox + 2, oy + 2, 4, 4, fill)
    rect(draw, ox + 10, oy + 2, 4, 4, fill)
    rect(draw, ox + 1, oy + 5, 14, 5, fill)
    rect(draw, ox + 3, oy + 10, 10, 3, fill)
    rect(draw, ox + 6, oy + 13, 4, 2, fill)
    rect(draw, ox + 4, oy + 4, 2, 2, (255, 188, 197, 255))


def draw_goal(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    rect(draw, ox + 5, oy + 8, 38, 52, (255, 255, 255, 90))
    rect(draw, ox + 8, oy + 10, 32, 48, PURPLE)
    rect(draw, ox + 12, oy + 14, 24, 40, (179, 131, 231, 255))
    rect(draw, ox + 16, oy + 18, 16, 32, (138, 234, 255, 255))
    rect(draw, ox + 20, oy + 24, 8, 20, (255, 247, 207, 255))
    star(draw, ox + 24, oy + 7, 1)


def make_atlas() -> None:
    img = Image.new("RGBA", (320, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for x, frame in zip(
        (0, 32, 64, 96, 128, 160, 192),
        ("idle", "walk_a", "walk_b", "walk_c", "walk_d", "jump", "inhale"),
    ):
        draw_mochi(draw, x, 0, frame)
    draw_enemy(draw, 0, 36)
    star(draw, 40, 48, 1)
    draw_heart(draw, 52, 40, (231, 86, 100, 255))
    draw_heart(draw, 72, 40, (107, 88, 116, 255))
    star(draw, 100, 48, 1)
    rect(draw, 112, 40, 2, 28, WHITE)
    rect(draw, 114, 41, 14, 9, YELLOW)
    rect(draw, 124, 50, 4, 5, YELLOW_DARK)
    draw_goal(draw, 144, 36)
    img.save(OUT / "mochi-sky-atlas.png")


def make_tiles() -> None:
    img = Image.new("RGBA", (128, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rng = random.Random(8)
    for x in range(0, 128, 4):
        color = (112 + rng.randrange(-8, 10), 214 + rng.randrange(-10, 8), 93 + rng.randrange(-8, 10), 255)
        rect(draw, x, 0, 4, 8 + rng.randrange(0, 3), color)
        rect(draw, x, 0, 4, 2, (181, 239, 112, 255))
    for y in range(10, 64, 5):
        for x in range(0, 128, 9):
            base = (201, 138, 88, 255) if (x // 9 + y // 5) % 2 else (217, 155, 98, 255)
            rect(draw, x, y, 8, 5, base)
            if rng.random() < 0.25:
                rect(draw, x + 2, y + 2, 3, 1, (157, 95, 75, 255))
    img.save(OUT / "mochi-sky-tiles.png")


def make_backdrop() -> None:
    img = Image.new("RGBA", (384, 216), (114, 216, 255, 255))
    draw = ImageDraw.Draw(img)
    for y in range(216):
        t = y / 216
        color = (
            int(113 + 70 * (1 - t)),
            int(216 + 28 * (1 - t)),
            int(255 - 40 * t),
            255,
        )
        rect(draw, 0, y, 384, 1, color)
    rng = random.Random(12)
    for _ in range(42):
        x = rng.randrange(0, 384)
        y = rng.randrange(10, 92)
        color = (255, 249, 203, 170 if rng.random() < 0.6 else 230)
        rect(draw, x, y, 1 + rng.randrange(0, 2), 1 + rng.randrange(0, 2), color)
    for x, y, scale in [(20, 28, 2), (172, 46, 1), (305, 25, 2)]:
        rect(draw, x, y + 12 * scale, 36 * scale, 7 * scale, (215, 236, 241, 255))
        rect(draw, x - 4 * scale, y + 8 * scale, 44 * scale, 8 * scale, WHITE)
        circle(draw, x + 12 * scale, y + 8 * scale, 7 * scale, WHITE)
        circle(draw, x + 27 * scale, y + 5 * scale, 8 * scale, WHITE)
    for base, height, color in [(130, 62, (168, 229, 204, 255)), (162, 68, (110, 214, 160, 255))]:
        for x in range(-40, 420, 72):
            pts = [(x, base)]
            for i in range(0, 73, 8):
                h = math.sin(i / 72 * math.pi) * height
                pts.append((x + i, base - h))
            pts.append((x + 72, 216))
            pts.append((x, 216))
            draw.polygon(pts, fill=color)
            rect(draw, x + 24, int(base - height * 0.55), 8, 5, (255, 255, 255, 60))
    rect(draw, 0, 164, 384, 52, (169, 236, 157, 255))
    img.save(OUT / "mochi-sky-backdrop.png")


def main() -> None:
    make_atlas()
    make_tiles()
    make_backdrop()


if __name__ == "__main__":
    main()
