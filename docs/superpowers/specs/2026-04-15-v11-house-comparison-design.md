# V11 House Comparison Design

## Objective

Create `godot-prototypes/v11-house-comparison` as a fast visual comparison prototype with one playable first-person scene and four houses built side by side:

1. one house built with direct Godot primitives
2. one house built with GridMap using a minimal block approach
3. one house built with GridMap using basic per-part tiles
4. one house built with GridMap using more composed tiles

The goal is to compare the amount and style of code needed for each construction method, not to build a polished game.

## Scope

- New prototype only: `v11`
- One playable scene
- Free first-person movement only
- No shooting
- No player body visuals
- Flat ground
- Stable exterior spawn
- Four houses visible and reachable in the same scene

## Script Structure

Use exactly these scripts:

1. `main.gd`
2. `primitives_house.gd`
3. `gridmap_minimal_house.gd`
4. `gridmap_basic_tiles_house.gd`
5. `gridmap_composed_tiles_house.gd`

`main.gd` creates the world, player, camera, ground, lighting, and places all four houses. Each house script builds its own house directly. There is no shared generic house builder.

## Shared House Shape

All four houses should match the same simple one-floor layout:

- one floor only
- one roof
- four walls
- one door opening on one wall
- one window on each of the other three walls
- interior must be enterable through the doorway

The houses should remain simple and blocky so the comparison stays readable.

## Placement

Place the four houses side by side with clear spacing so they are easy to compare visually. The player should spawn facing toward the row of houses from a sensible exterior position.

## Visuals

Apply the `generated image` wall texture style from `godot-prototypes/v10-doom-wall-lab/main.gd` to all house walls in `v11`, including the primitives house and the GridMap tiles. The point is to compare construction method, not different art direction.

## GridMap Variants

Each GridMap script uses a different level of tile granularity:

- minimal:
  - the simplest viable tile set
- basic tiles:
  - more explicit tiles for floor, wall, roof, doorway/window gaps
- composed tiles:
  - fewer but smarter combined tiles

All three should remain code-only, including `MeshLibrary` creation.

## Not Prioritized

- tests
- architecture purity
- generic abstractions
- reuse from previous prototypes
- strict repo conventions

## Deliverable

Deliver one runnable `v11` prototype with:

- one playable scene
- one `main.gd`
- four house scripts
- flat ground
- stable FPS movement
- four comparable houses using the same layout but different construction approaches
