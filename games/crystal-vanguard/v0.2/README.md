# Crystal Vanguard v0.2 Backbone

`v0.2/` is the first integrated Phaser version of Crystal Vanguard. It turns the original single-file gameplay proof and the isolated Phaser sprite proof into a small, data-driven runtime that can grow without rewriting the scene every time a class, skill, monster, building, or combat mode is added.

This version is deliberately a **vertical slice**, not a content-complete rewrite. It proves the extension seams and a playable loop while keeping the repository static-host friendly: no bundler, package install, backend, or build step is required.

## Play locally

ES modules need an HTTP server; opening `index.html` through `file://` is not supported.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/games/crystal-vanguard/v0.2/
```

After merge, the GitHub Pages path is:

```text
https://shemyu.github.io/tiny-arcade/games/crystal-vanguard/v0.2/
```

## What is implemented

- Phaser 3.90 runtime with a fixed 960×640 tactical board and responsive page shell.
- Build and battle phases, wave progression, crystal health, gold rewards, selling, and a defender cap.
- Six data-defined job families from the original POC.
- The existing Blade rank-1 idle, walk, attack, cast, hurt, and death sheets are used in battle.
- Runtime fallback rendering for every missing job, monster, and building asset.
- Data-defined skills with registered effect handlers: area damage, chain damage, healing, execute, and area slow.
- Ground pathfinding around blocking buildings, plus placement validation that prevents sealing every route.
- Flying monsters that ignore ground blockers.
- Mobile-friendly layout, keyboard shortcuts, debug ranges and paths, and runtime asset diagnostics.
- Pure-logic tests for registries, references, pathfinding, placement, wave scheduling, direction mapping, and combat resolution.

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Select catalog cards, place units and buildings, inspect deployed actors |
| Right click | Remove a deployment during build phase and refund 60% |
| `1`–`6` | Select one of the six jobs |
| `Space` | Start the next wave |
| `Esc` | Cancel the current placement tool |
| `D` | Toggle attack ranges and enemy paths |

## Tests

No dependency installation is needed. Node 20 or newer is recommended.

```bash
cd games/crystal-vanguard/v0.2
npm test
```

The package is dependency-free. The command checks the browser entry syntax and runs the registry, pathfinding, placement, combat, art-backlog, and module-boundary tests.

## Source map

| File | Responsibility |
| --- | --- |
| `src/content.js` | Assets, jobs, skills, monsters, buildings, waves, and cross-reference validation |
| `src/core.js` | Registry, event bus, grid model, pathfinding, state, and pure combat math |
| `src/asset-system.js` | Loading, dimensions checks, animation registration, static sprite support, and fallback decisions |
| `src/actors.js` | Shared actor model, Phaser view, and entity factory |
| `src/systems.js` | Placement, wave scheduling, targeting, skills, combat, and real-time combat-mode adapter |
| `src/director.js` | Phase and economy orchestration; the only layer that coordinates all systems |
| `src/scenes.js` | Phaser boot/battle scenes, board drawing, input, debug rendering, and lightweight VFX |
| `src/ui.js` | DOM HUD and catalog rendering through director events |

Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before adding gameplay behavior. Art production is tracked in [`docs/ASSET_BACKLOG.md`](./docs/ASSET_BACKLOG.md), [`asset-backlog.json`](./asset-backlog.json), and [`art-assets.csv`](./art-assets.csv).

## Intentional v0.2 limits

The following are deferred so the backbone can be reviewed before content scope grows:

- shop randomness and rerolls;
- rank merging and class advancement;
- save data and meta progression;
- multiple stages and map editor tooling;
- authored sound and music;
- turn-based or auto-chess combat mode beyond the provided adapter seam;
- full sprite sets for non-Blade jobs, monsters, buildings, VFX, and environment tiles.

These are feature work, not reasons to bypass the current registries and systems. The architecture document shows where each belongs.
