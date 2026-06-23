# Mochi Sky / 麻糬星野

A tiny pastel pixel-art side-scroller POC inside **Shem's Tiny Arcade**.

Play it from the arcade:

```text
https://shemyu.github.io/single-page-games/games/mochi-sky/
```

## What is implemented

- horizontal side-scrolling camera
- jump and platform collision
- inhale mechanic
- star projectile attack
- simple enemies
- collectibles
- health UI
- checkpoint
- finish gate
- keyboard controls
- touch controls for mobile browsers
- lightweight procedural audio
- generated PNG player movement sheet, inhale animation sheet, enemy sheet, star sheet, backdrop, and terrain tiles

## Controls

| Input | Action |
| --- | --- |
| `←` `→` / `A` `D` | Move |
| `Space` / `W` | Jump |
| Hold `X` | Inhale |
| `C` | Shoot star |
| `R` | Restart |
| `P` | Pause |

## POC notes

This is intentionally compact: one HTML page with embedded CSS, JavaScript, canvas rendering, and a few local PNG textures. The goal is to validate feel and interaction before introducing a framework.

The current POC keeps the single-page game structure, but uses a few generated local PNG assets from `assets/` for sharper textures. Regenerate them with:

```bash
python3 tools/generate_assets.py
python3 tools/normalize_generated_art.py
```
