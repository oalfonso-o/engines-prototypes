# Map Format v0

## Goal

- The first map format must be text-first, human-readable, git-friendly, and simple enough to implement quickly.
- The format should express gameplay semantics, not hardcoded image paths.

## Design Rule

- A map file must not directly point from a character to a sprite file.
- A map file points from a character to a semantic tile or marker id through a legend.
- Runtime code then resolves those ids into behavior and rendering.

## File Sections

- `[meta]`: map-level metadata.
- `[legend]`: symbol-to-id mapping for layout symbols.
- `[layout]`: grid data using one character per cell.

## Example

```txt
[meta]
name = crossroads_proto
tile_size = 64

[legend]
. = floor_street
# = wall_concrete
B = bomb_spawn
K = spawn_capitalist
M = spawn_communist
T = target_dummy

[layout]
####################
#..K.......B......#
#..............T..#
#...............M.#
####################
```

## Meta Rules

- `name`: unique map id.
- `tile_size`: base cell size in pixels.
- Future fields may include:
- `display_name`
- `author`
- `version`
- `minimap_scale`

## Legend Rules

- Each symbol maps to one semantic id.
- Symbols should remain single-character in `v0` for parsing simplicity.
- The semantic id must be one that runtime code understands.

## Layout Rules

- The layout is row-based ASCII text.
- All rows must have equal width.
- One character equals one logical cell.
- Cells define structural or repeated content.
- Suitable examples:
- floors
- walls
- faction spawns
- bomb spawn

## Runtime Resolution

- Parser reads `meta`, `legend`, and `layout`.
- `legend` resolves symbols into semantic ids.
- Runtime code resolves those ids into floor, walls, spawns, bomb locations, targets, and later any other gameplay entities.

## v0 Limits

- One-character layout symbols only.
- Square grid only.
- No multi-layer layout yet.
- No embedded scripting in map files.
- No separate registry/theme indirection in the active MVP runtime.

## Why This Split Matters

- We can change rendering without changing map semantics.
- We can test map parsing independently from presentation.
