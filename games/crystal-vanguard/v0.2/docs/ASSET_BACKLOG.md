# Crystal Vanguard v0.2 Art Asset Tracker

This document is the art-team handoff for every visual used by the v0.2 runtime. Gameplay is allowed to proceed with deterministic temporary elements, but every temporary element must remain visible here until production art passes in-game acceptance.

Companion files:

- [`../asset-backlog.json`](../asset-backlog.json) is the machine-readable source used by tests.
- [`../art-assets.csv`](../art-assets.csv) is the spreadsheet-friendly production queue.
- [`../../assets/units/SPRITE_GENERATION_SPEC.md`](../../assets/units/SPRITE_GENERATION_SPEC.md) is the canonical humanoid generation contract.

## Status workflow

| Status | Meaning |
| --- | --- |
| `PLACEHOLDER READY` | Runtime fallback is usable; source art is missing. |
| `RUNTIME TEMP` | Code-drawn VFX/environment is functional but awaits art direction. |
| `BACKLOG` | Requirement is known but not required for this vertical slice. |
| `INTEGRATED / QA` | Source is wired into the game and still needs visual acceptance. |
| `DONE` | Source, integration, technical validation, and in-game review are complete. |

## Runtime asset queue

| Ticket | Runtime asset ID | Category | Runtime now | Required deliverables | Technical specification | Issue | Priority | Status | Next action / acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CV-U-BLADE-R1 | `unit.blade.rank1` | job | existing directional sprite | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | 96x96 cells; 8 rows; 6/8/8/8/4/8 frames; root (48,82); RGBA PNG | Integrated; verify foot-anchor drift, action-to-action scale, crop, and silhouette readability. | P0 | INTEGRATED / QA | Run shared validator and Phaser action proof; close only after visual QA. **Accept:** No empty/cropped frames, direction mismatch, visible foot slide, or action-scale jump. |
| CV-U-BOW-R1 | `unit.bow.rank1` | job | green diamond fallback | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | Humanoid 96x96 contract; bow handedness fixed; arrow/projectile separate. | No source art. | P0 | PLACEHOLDER READY | Produce identity turnaround, then one action strip per direction. **Accept:** All eight directions readable; release frame aligns with projectile timing. |
| CV-U-ARCANE-R1 | `unit.arcane.rank1` | job | violet hex fallback | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | Humanoid 96x96 contract; staff/book geometry locked; spell VFX separate. | No source art. | P0 | PLACEHOLDER READY | Produce identity turnaround and cast strips; deliver separate spell VFX. **Accept:** Cast release reads clearly without baked effects obscuring the body. |
| CV-U-LIGHT-R1 | `unit.light.rank1` | job | gold circle fallback | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | Humanoid 96x96 contract; support silhouette; healing VFX separate. | No source art. | P1 | PLACEHOLDER READY | Lock support silhouette and directional cast pose. **Accept:** Cast pose reads in all directions; no baked target marker. |
| CV-U-SHADE-R1 | `unit.shade.rank1` | job | purple diamond fallback | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | Humanoid 96x96 contract; fixed dual-weapon handedness; compact anticipation/recovery. | No source art. | P1 | PLACEHOLDER READY | Approve identity turnaround with dual-weapon handedness locked. **Accept:** Attack never swaps hands or crops outside the cell. |
| CV-U-GEL-R1 | `unit.gel.rank1` | job | green blob fallback | `idle`, `walk`, `attack`, `cast`, `hurt`, `death` | 96x96 creature contract; 8 rows; root (48,82); preserve body volume. | No source art; creature envelope needs approval. | P1 | PLACEHOLDER READY | Approve identity turnaround and squash/stretch envelope before animation. **Accept:** Face/crown identity and body volume remain stable across directions. |
| CV-M-SPROUT | `monster.sprout` | monster | green blob fallback | `idle`, `walk`, `attack`, `hurt`, `death` | Recommended 96x96; 8 rows; 4/6/6/3/6 frames; root (48,82). | No source art. | P0 | PLACEHOLDER READY | Produce first monster set as pipeline reference. **Accept:** Spawn, walk, hit, and death remain distinct at 50% display scale. |
| CV-M-MOTH | `monster.moth` | monster | paired-wing fallback | `idle`, `fly`, `attack`, `hurt`, `death` | 96x96; 8 rows; stable body center; no floor shadow. | No source art. | P1 | PLACEHOLDER READY | Animate clean flight loop and directional attack. **Accept:** Flight reads over dark/green tiles and never implies ground contact. |
| CV-M-FUNGUS | `monster.fungus` | monster | mushroom fallback | `idle`, `walk`, `attack`, `hurt`, `death` | 96x96; 8 rows; cap silhouette and stem scale locked. | No source art. | P1 | PLACEHOLDER READY | Lock cap/stem proportions before action animation. **Accept:** Cap size and body scale do not drift between directions. |
| CV-M-GOLEM | `monster.golem` | monster | stone-square fallback | `idle`, `walk`, `attack`, `hurt`, `death` | 96x96 or approved 128x128 large envelope; 8 rows; heavy contact timing. | No source art; envelope size requires approval. | P1 | PLACEHOLDER READY | Approve 96 or 128 cell envelope and weapon crop budget. **Accept:** Body/weapon never crops and scale supports the boss hierarchy. |
| CV-M-SHAMAN | `monster.shaman` | monster | red hex fallback | `idle`, `walk`, `attack`, `hurt`, `death` | 96x96; 8 rows; projectile and impact separate; declared release origin. | No source art. | P2 | PLACEHOLDER READY | Define projectile origin and directional release frame. **Accept:** Release frame is unambiguous and aligns with the runtime projectile. |
| CV-M-MONARCH | `monster.monarch` | boss | horned crown fallback | `idle`, `walk`, `attack`, `hurt`, `death`, `portrait` | Prefer 128x128 if needed; 8 rows; explicit anchor/display scale. | No source art; boss envelope and crop budget need approval. | P1 | PLACEHOLDER READY | Approve boss turnaround, cell size, crop budget, and HUD portrait. **Accept:** Visually dominant without hiding nearby actors or health UI. |
| CV-B-BARRICADE | `building.barricade` | building | drawn wall fallback | `intact`, `damaged`, `destroyed` | Recommended 128x128 RGBA; bottom-center root; transparent; one-tile footprint. | No source art; runtime supports static-sprite replacement. | P0 | PLACEHOLDER READY | Deliver intact PNG first, then damaged/debris states. **Accept:** Occupied tile and damage state remain obvious at mobile size. |
| CV-B-ARROWTOWER | `building.arrow-tower` | building | drawn tower fallback | `base`, `aim_or_fire_optional` | Recommended 128x128 RGBA; bottom-center root; projectile separate. | No source art; muzzle origin not documented. | P0 | PLACEHOLDER READY | Deliver static base and document muzzle origin. **Accept:** Fits one tile and projectile origin aligns with the art. |

## Supporting art queue

| Ticket | Category | Runtime now | Deliverables | Issue | Priority | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CV-VFX-PROJECTILES | vfx | runtime circles | `arrow`, `arcane_orb`, `holy_bolt`, `shaman_bolt` | Current circles prove timing only. | P1 | RUNTIME TEMP | Replace after actor release frames are locked. |
| CV-VFX-SKILLS | vfx | runtime expanding rings | `cleave`, `nova`, `heal`, `execute`, `slow_field` | Current rings do not express class identity. | P1 | RUNTIME TEMP | Match authored effect radius to gameplay radius within half a cell. |
| CV-UI-ICONS | ui | text glyphs | `job`, `building`, `trait`, `gold`, `crystal`, `phase_icons` | Glyph appearance varies by platform font. | P2 | BACKLOG | Create 32px and 64px icon family after silhouettes are approved. |
| CV-ENV-BOARD | environment | procedural board | `tiles`, `eight_gates`, `crystal_platform`, `blocker_decal` | Functional but generic environment. | P2 | RUNTIME TEMP | Define reusable tile palette and seamless set. |

## Shared humanoid sheet contract

| Action | Frames per direction | Sheet size | Playback | Key beat |
| --- | ---: | ---: | ---: | --- |
| Idle | 6 | 576×768 | 7 fps loop | restrained breathing and seamless return |
| Walk | 8 | 768×768 | 12 fps loop | two readable steps; no world translation |
| Attack | 8 | 768×768 | 14 fps once | impact at frame index 4 |
| Cast | 8 | 768×768 | 12 fps once | release at frame index 4 |
| Hurt | 4 | 384×768 | 12 fps once | contact, recoil, recover |
| Death | 8 | 768×768 | 10 fps once | final frame holds |

Direction rows are fixed:

```text
S, SE, E, NE, N, NW, W, SW
```

## Delivery checklist

1. File name and case match the registered path exactly.
2. PNG is RGBA with a fully transparent background.
3. Canvas dimensions, row order, and frame count match the declaration.
4. Root/foot anchor stays stable; frames are not individually reframed.
5. Actor sheets contain no floor, shadow, text, grid, projectile, slash trail, spell circle, or camera motion.
6. Handedness, face, equipment geometry, palette, and apparent body scale stay locked across actions and directions.
7. Run the shared validator, inspect the Phaser action proof, then inspect the v0.2 game at actual zoom.
8. Update JSON, CSV, and this table in the same commit. `DONE` is reserved for accepted in-game output.
