# Crystal Vanguard v0.2 architecture

## Design target

The v0.2 backbone must make common content additions cheap without turning a small browser game into a framework project.

The chosen boundary is:

- **plain data** for professions, skills, monsters, buildings, waves, placement tools, and visual contracts;
- **small runtime classes** for actors, assets, combat, placement, and waves;
- **one Phaser battle scene** and one boot scene;
- **one application event bus** between Phaser and the DOM HUD.

No ECS, service container, command hierarchy, or plugin system is introduced. Those would add ceremony before the game has enough content to justify them.

## Module map

| Module | Responsibility | Must not own |
| --- | --- | --- |
| `src/content.js` | IDs, stats, references, sprite contracts, validation | Phaser objects or mutable battle state |
| `src/core.js` | event bus, session state, application context | combat rules |
| `src/runtime.js` | sprite loading, placeholder generation, actors, actor factory | wave composition or UI |
| `src/systems.js` | placement, targeting, combat resolution, skills, projectiles, waves | DOM rendering |
| `src/scenes.js` | lifecycle and orchestration | content balance tables |
| `src/ui.js` | DOM events and HUD rendering | direct Phaser object access |
| `src/main.js` | bootstrapping | gameplay decisions |

## Runtime flow

```text
DOM command
  → EventBus
    → BattleScene
      → PlacementSystem / WaveDirector
        → ActorFactory
          → CombatSystem
            → GameSession
              → EventBus
                → HUD render
```

The scene orchestrates. It does not contain profession-specific branches.

## Content contracts

### Profession

A profession references:

- one visual asset;
- zero or more skills;
- base stats;
- one attack profile;
- placement cost.

Adding another ordinary melee profession is data-only.

### Skill

A skill has a trigger and effect:

```js
{
  id: 'blade.cleave',
  trigger: 'afterAttack',
  every: 3,
  effect: {
    type: 'areaDamage',
    radius: 58,
    multiplier: 0.55
  }
}
```

Adding another skill using an existing effect type is data-only. A genuinely new effect type needs one resolver in `CombatSystem.skillResolvers`.

### Attack style

v0.2 ships with:

- `melee`
- `projectile`
- `none`

A new attack style requires one `attackResolvers` entry. The actor and scene APIs do not change.

### Monster

A monster references a visual asset and attack profile. Wave definitions reference monster IDs; they never construct actors directly.

### Defensive building

A building uses the same combat actor contract as a profession, with `moveSpeed: 0`. A barricade uses `none`; a tower uses `projectile`.

## Asset failure behavior

Only assets marked `ready` are requested over the network. Every asset definition also has a placeholder contract.

When an expected sprite sheet fails to load:

1. BootScene records the loader error.
2. AssetRuntime omits broken animations.
3. The actor automatically uses the generated fallback texture.
4. The HUD reports the fallback through the event bus.

Missing art therefore degrades visuals, not gameplay.

## Extension recipes

### Add a profession

1. Add its visual entry to `ASSETS`.
2. Add reusable effects to `SKILLS`.
3. Add the profession to `PROFESSIONS`.
4. Add a placement entry to `TOOLS`.
5. Add or update the art backlog.
6. Run `npm test`.

### Add a monster

1. Add its visual entry.
2. Add its monster definition.
3. Reference its ID from a wave group.
4. Run `npm test`.

### Add a building

1. Add its visual entry.
2. Add its building definition.
3. Reference it from a placement tool.
4. Run `npm test`.

## Deferred seams

### Navigation

v0.2 uses attraction/interception: nearby units and barricades pull monsters away from the crystal. It intentionally does **not** claim that walls alter a navigation mesh.

The next navigation iteration can replace monster movement behind a `PathPlanner` interface without changing content definitions, actor creation, waves, or HUD state.

### Progression and merging

Ranks should be expressed as profession variants or rank modifiers layered over the same profession definition. The current actor factory is the narrow construction point where that modifier belongs.

### Saving

Only `GameSession` owns run-level state exposed to the HUD. A serializer can be added around session snapshots after the progression model stabilizes.
