# Crystal Vanguard v0.2 Architecture

## 1. Design goal

The v0.2 backbone should make the next content addition boring—in the good way. A new class or monster should normally be one data entry plus artwork, not a new branch of scene logic.

The architecture protects five boundaries:

1. **Content is data.** Stats, costs, asset references, waves, and most skill behavior are registered definitions.
2. **Rules are pure where practical.** Grid, pathfinding, damage math, references, and scheduling can run without Phaser.
3. **Phaser owns presentation, not game truth.** Actor models hold combat state; `ActorView` mirrors it.
4. **One director coordinates phases.** Scenes do not spend gold, award waves, or remove entities directly.
5. **Missing art never blocks gameplay.** The runtime selects a deterministic fallback and records the gap for art production.

## 2. Dependency direction

```text
config.js
   ↓
core.js ← content.js
   ↓          ↓
asset-system.js
   ↓
actors.js
   ↓
systems.js
   ↓
director.js
   ↓
scenes.js ← ui.js
   ↓
main.js
```

Dependencies flow downward. Content definitions never import Phaser. The director may call systems, but systems do not import the director.

## 3. Runtime responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| Content registry | IDs, stats, costs, relationships, wave groups | Phaser objects, DOM nodes, mutable battle state |
| Core | Grid occupancy, pathfinding, events, math, runtime state shape | Sprites, animations, input |
| Asset system | Loading, sheet registration, dimensions checks, runtime fallback decision | Combat stats or class behavior |
| Actor model/view | Per-entity state and its visual mirror | Economy, wave completion, catalog rules |
| Systems | Placement, targets, skills, damage, movement, spawning schedule | Page layout or scene lifecycle |
| Game director | Phase transitions, economy, entity sets, rewards, loss condition | Rendering details |
| Scene | Board, pointer/keyboard input, debug overlay, transient VFX | Authoritative state mutation outside the director |
| HUD | DOM rendering and user commands sent to the director | Combat calculations |

## 4. Stable content IDs

IDs are runtime contracts and should not be translated or renamed casually.

```text
job:       blade
skill:     blade.cleave
asset:     unit.blade.rank1
monster:   sprout
building:  barricade
wave:      wave-1
```

Localized names are display values; IDs are references. `createContentRegistry()` validates all cross-links during boot and fails early on duplicate or missing IDs.

## 5. Add a job

Most jobs require three changes.

### A. Register or declare the asset

In `src/content.js`, add an asset entry. Art can be absent at first:

```js
{
  id: 'unit.alchemist.rank1',
  type: 'placeholder',
  status: 'missing',
  fallback: {
    shape: 'hex',
    glyph: '⚗',
    primary: 0x536a5f,
    secondary: 0xbde6c7
  }
}
```

When the full sheets arrive, change it to `directional-sprite`, add the action files, cell, rows, anchor, and scale. No actor or scene code should change.

### B. Reuse or add a skill

A skill definition contains cooldown, animation hint, and effect data. Existing effect types are:

- `area-damage`
- `chain-damage`
- `heal`
- `execute`
- `slow-area`

A new skill using one of those types is data-only. A truly new mechanic requires one handler registered in `SkillSystem`; keep the handler generic enough for another class to reuse.

### C. Add the job definition

Add costs, progression labels, asset/skill IDs, attack style, and stats to `JOB_DEFINITIONS`. Boot validation checks the references.

## 6. Add or replace artwork

The runtime supports three asset modes:

| Type | Use | Runtime behavior |
| --- | --- | --- |
| `directional-sprite` | Animated units and monsters | Loads one sheet per action and registers eight direction animations |
| `static-sprite` | Buildings, props, or intentionally static actors | Loads one PNG with a declared size and root anchor |
| `placeholder` | Missing or intentionally deferred art | Draws a stable geometric stand-in and glyph |

A failed load or wrong declared dimensions falls back instead of crashing the game. The console prints a runtime asset table at boot.

Humanoid production art must follow the existing contract at:

```text
../../assets/units/SPRITE_GENERATION_SPEC.md
```

The current canonical root is `(48, 82)` in a `96×96` cell. Do not bake floor shadows, projectiles, slash trails, or UI into character sheets.

## 7. Add a monster

1. Add its asset declaration.
2. Add a `MONSTER_DEFINITIONS` entry.
3. Add it to one or more wave groups.

Supported trait flags in v0.2:

- `flying`: moves directly to the crystal and ignores ground blockers;
- `siege`: scores buildings more aggressively when selecting a combat target;
- `boss`: uses the boss visual envelope and can drive future boss UI.

A new trait with behavioral consequences belongs in `CombatSystem`, not in the scene.

## 8. Add a defensive building

Buildings use the same actor model as units but have zero movement. A definition can declare:

- `blocksPath` for path shaping;
- HP, armor, radius, aggro range, and threat;
- optional attack stats and `attackStyle`;
- an optional reusable skill.

`PlacementSystem` tests a candidate blocking cell against all eight entrances before spending gold. Do not duplicate route-safety rules inside a UI button or scene pointer handler.

## 9. Add another combat mode

`RealtimeCombatMode` is intentionally a thin adapter around `WaveSystem` and `CombatSystem`. A mode object must implement:

```js
start({ waveDefinition, waveNumber })
update(deltaSeconds, now, spawn)
get waveExhausted()
stop()
```

A future turn-based or auto-chess mode can replace scheduling and update cadence while keeping content, actors, economy, asset handling, placement, and HUD contracts.

Call `GameDirector.registerCombatMode(id, mode)` and switch it through `setCombatMode(id)` during build phase; use `GAME_CONFIG.defaultCombatMode` for the boot default. Avoid adding `if (mode === ...)` throughout combat code; mode-specific behavior belongs behind the adapter.

## 10. State and events

The director owns one mutable runtime state object. UI and scene VFX observe it through `EventBus` snapshots and semantic events such as:

```text
state:changed
selection:changed
wave:started
wave:completed
combat:attack
combat:skill
combat:damage
combat:heal
crystal:damaged
entity:defeated
```

Events are notifications, not a second source of truth. A listener must not secretly spend gold or alter HP.

## 11. Testing policy

Every new rule that can be separated from Phaser should receive a Node test. High-value cases include:

- duplicate and missing content references;
- path preservation after a building candidate;
- new skill effect math;
- wave scheduling order;
- armor, slow, and rank scaling;
- combat-mode resolution rules.

Browser playtesting is still required for animation timing, input, responsive layout, and feel. Node tests are a guardrail, not a substitute for playing the game.

## 12. Explicit non-goals for the backbone

Do not introduce these until a concrete feature needs them:

- a full ECS framework;
- dependency-injection containers;
- an event-sourced store;
- a build pipeline solely to reorganize imports;
- a generic behavior tree editor;
- network synchronization;
- save migrations before save data exists.

The current seams are small on purpose. Expand the narrow interface that is under pressure; do not pre-build an engine for hypothetical games.
