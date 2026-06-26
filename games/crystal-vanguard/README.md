# Crystal Vanguard / 琉璃城：八方守晶

A pixel tactics tower-defense experiment inside **Shem's Tiny Arcade**.

## Play

Current single-page Canvas POC:

```text
https://shemyu.github.io/tiny-arcade/games/crystal-vanguard/
```

Phaser v0.2 backbone after the branch is merged:

```text
https://shemyu.github.io/tiny-arcade/games/crystal-vanguard/v0.2/
```

The v0.2 implementation is isolated under [`v0.2/`](./v0.2/) so the original POC remains available for comparison and rollback.

## Original POC

The current root route implements:

- eight-direction enemy wave forecasting;
- recruitable tactics roster and pre-battle deployment;
- auto-battler movement and combat;
- unit merging from first through fourth rank;
- crystal health, round progression, shop rerolls, and rally command;
- keyboard, mouse, touch controls, and lightweight procedural audio.

## Phaser v0.2 backbone

v0.2 establishes a deliberately small, extensible game core rather than porting every POC feature at once:

- Phaser 3.90 boot and battle scenes with a responsive static-host page shell;
- immutable registries for assets, six jobs, six skills, six monsters, two buildings, and five reusable wave definitions;
- the existing Blade Rank 1 idle / walk / attack / cast / hurt / death sheets;
- deterministic fallbacks for every missing job, monster, building, and temporary VFX asset;
- build/combat phases, economy, refunds, defender cap, wave rewards, crystal defeat, and reset;
- reusable skill-effect handlers for area damage, chain damage, healing, execute, and area slow;
- grid pathfinding around blocking structures and an eight-entrance route guard that rejects illegal walls;
- flying and siege monster traits plus a registered combat-mode adapter seam;
- art-team handoff in Markdown, JSON, and CSV;
- dependency-free Node tests and a path-scoped GitHub Actions workflow.

Run the contracts with:

```bash
cd games/crystal-vanguard/v0.2
npm test
```

Architecture and deliberate non-goals are documented in [`v0.2/docs/ARCHITECTURE.md`](./v0.2/docs/ARCHITECTURE.md). Missing, temporary, and integrated art is tracked in [`v0.2/docs/ASSET_BACKLOG.md`](./v0.2/docs/ASSET_BACKLOG.md), [`v0.2/asset-backlog.json`](./v0.2/asset-backlog.json), and [`v0.2/art-assets.csv`](./v0.2/art-assets.csv).

## Controls in the original POC

| Input | Action |
| --- | --- |
| Mouse / touch | Select units, buy recruits, deploy on the battlefield |
| `Space` | Start the next battle |
| `R` | Reroll the shop |
| `Q` | Rally deployed units to the crystal during battle |
| Right click | Bench the selected deployed unit |

## Phaser action proof

The isolated eight-direction action and movement proof lives at:

```text
games/crystal-vanguard/proofs/phaser-actions/index.html
```

It includes keyboard and click-to-move control, one-shot action locking, animation-phase-preserving direction changes, separate physics and visual actors, runtime sprite registration, asset diagnostics, and a debug overlay (`0`).

The reusable sprite contract and generation prompts are documented in [`assets/units/SPRITE_GENERATION_SPEC.md`](./assets/units/SPRITE_GENERATION_SPEC.md). Validate the current unit sheets with:

```bash
python3 tools/game-assets/validate_game_assets.py games/crystal-vanguard/asset-manifest.json
```

## Next directions after v0.2 review

- Reintroduce roster/shop choices on top of the new registries.
- Add rank merging and class advancement without coupling progression to Phaser scenes.
- Add a second combat-mode implementation to prove the adapter boundary.
- Replace P0 placeholder assets before broadening map and wave content.
- Add authored sound, saved progression, and additional stages only after the vertical slice is accepted.

## Known issues from original POC playtest

### P1

- Mobile core flow requires too much vertical scrolling. The battlefield, shop, roster, and start button are stacked far apart, so buying a unit, selecting it from the roster, and deploying it on the battlefield requires repeated scrolling.

### P2

- The mobile intro modal is slightly wider than a 390px viewport. It does not create horizontal scrolling, but the right edge is visually clipped.
- The crystal's blocked deployment area is not obvious enough. Players can tap a nearby grid cell and receive "crystal position cannot be deployed" even when the intended target feels like an adjacent valid tile.

### P3

- Shop reroll feedback is too subtle. Pressing `R` spends gold and changes the shop, but the toast can still show the previous round message, so players may not immediately know the reroll succeeded.
- On mobile, the first playable viewport hides the start button below the shop and roster. The action is still reachable by scrolling, but the next step is easy to miss.
