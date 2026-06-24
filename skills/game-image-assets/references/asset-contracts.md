# Asset contracts

## Required brief

```yaml
project: ""
primary_reference: ""
rendering_mode: "pixel_crisp | painted_pixel | hand_painted | vector_flat"
asset_id: ""
family: "character_animation | terrain | background | prop | vfx | ui"
camera: "side | front | top_down | isometric"
target_size: [width, height]
alpha: "transparent | opaque"
pivot: [x, y]
contact_line_y: null
frame_count: null
phases: {}
loop_sequence: []
repeat_x: false
repeat_y: false
background_layer: null
sampling: "nearest | linear | project_defined"
```

## Character animation

Prefer separate source frames and pack them with code. If only a generated sheet exists, detect real transparent gutters instead of assuming equal mathematical columns.

Preserve across every frame:

- body and head ratio,
- eye design and internal highlights,
- mouth construction,
- feet and accessories,
- palette and material shading,
- lighting direction,
- edge softness or pixel clustering.

Use one global family scale and one shared pivot/contact line. Particles may overflow the body box, so identify body geometry separately from effects.

Store explicit phases:

```json
{
  "startup": [0, 1, 2, 3, 4],
  "hold": [5, 6, 7, 6],
  "release": []
}
```

## Terrain

Prefer separate modules:

```text
surface_strip
fill_texture
left_cap
right_cap
outer_corner
inner_corner
small_platform
```

Base repeat textures contain no decorative focal objects. Reliable seam construction methods are periodic texture synthesis, offset-and-repair, mirrored half construction, or hand-authored edge pixels.

Lighting must be local and neutral enough to repeat. Avoid a horizon, unique landmark, or long directional shadow at an edge.

## Background and parallax

Use separate files:

```text
background-sky.png
background-far.png
background-mid.png
background-near.png
foreground-decor.png
```

Only sky is normally opaque. Other layers usually use transparency. Each layer declares a parallax ratio and whether it repeats horizontally.

A distant layer never includes collision geometry. A playable floor, platform, pit edge, goal, enemy, collectible, checkpoint, and foreground prop must remain independently replaceable.

## Props and pickups

One logical object per file. Declare pivot and approximate world scale. Do not bake terrain or a large ground shadow into the prop unless required by runtime design.

## VFX

Use equal cells and one effect origin. Declare blend mode. Separate startup, loop, and finish where applicable. Test over both light and dark scene regions.

## Source and runtime layout

```text
assets/
  source/
    character/
    terrain/
    background/
    props/
    vfx/
  runtime/
    character/
    terrain/
    background/
    props/
    vfx/
  previews/
  manifests/
```

Never repeatedly resize a runtime PNG. Rebuild from preserved sources.
