# Map Format v0

## Goal

- The first map format must be text-first, human-readable, git-friendly, and simple enough to implement quickly.
- The format should express gameplay semantics, not hardcoded image paths.

## Design Rule

- A map file must not directly point from a character to a sprite file.
- A map file points from a character to a semantic tile or entity id through a legend.
- Registries then resolve those ids into runtime behavior and art.

## File Sections

- `[meta]`: map-level metadata.
- `[legend]`: symbol-to-id mapping for layout symbols.
- `[layout]`: grid data using one character per cell.
- `[entities]`: explicit non-grid or special placements.

## Example

```txt
[meta]
name = crossroads_proto
tile_size = 64
theme = urban_warm_v1

[legend]
. = floor_street
# = wall_concrete
B = prop_bench
C = prop_crate
A = spawn_allies
E = spawn_enemies

[layout]
####################
#....B.......C....#
#..A..............#
#................E#
####################

[entities]
bench_long 5 1 rot=0
street_light 8 3 rot=90
```

## Meta Rules

- `name`: unique map id.
- `tile_size`: base cell size in pixels.
- `theme`: theme pack id that selects the tile and entity registries to use.
- Future fields may include:
- `display_name`
- `author`
- `version`
- `minimap_scale`

## Legend Rules

- Each symbol maps to one semantic id.
- Symbols should remain single-character in `v0` for parsing simplicity.
- The semantic id must exist in the active tile or entity registry.

## Layout Rules

- The layout is row-based ASCII text.
- All rows must have equal width.
- One character equals one logical cell.
- Cells define structural or repeated content.
- Suitable examples:
- floors
- walls
- default decorative props
- team spawns

## Entities Rules

- The entities section is for explicit placements that should not depend on one-character cell encoding.
- Each entity line follows:

```txt
entity_id grid_x grid_y key=value key=value
```

- This section is suitable for:
- rotated props
- larger decorative objects
- special markers
- future triggers or objectives

## Runtime Resolution

- Parser reads `theme`.
- Theme resolves which registries are active.
- `legend` resolves symbols into ids.
- Ids resolve into tile or entity definitions.
- Definitions resolve into sprite paths, collision, vision blocking, minimap behavior, and tags.

## v0 Limits

- One-character layout symbols only.
- Square grid only.
- Rotation only on explicit entities.
- No multi-layer layout yet.
- No embedded scripting in map files.

## Why This Split Matters

- We can change art without changing map semantics.
- We can reuse the same map logic with a different theme pack.
- We can test map parsing independently from rendering.
