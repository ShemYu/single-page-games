# Phaser Action Proof

Standalone Phaser proof for Crystal Vanguard rank-1 blade action sheets.

Run from the repository root:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/games/crystal-vanguard/proofs/phaser-actions/
```

This proof intentionally does not drive the main `games/crystal-vanguard/index.html` game flow. It only validates Phaser spritesheet loading, directional animation switching, one-shot actions, and runtime slash FX against the current blade assets.
