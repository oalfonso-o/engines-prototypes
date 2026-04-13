# Python Iso Depth Renderer Plan

## Objective

Define a render architecture for `python-iso` that solves actor occlusion against mesetas, ramps, enemies, and projectiles without relying on fragile sorting heuristics.

This document is intentionally narrow:

- it only covers rendering and visual occlusion
- it does not change simulation, collision, or map semantics
- it is designed to fit the current `python-iso` codebase

## Problem Summary

The current renderer in [python-iso/pyiso/render.py](/Users/oalfonso/pipprojects/canuter/python-iso/pyiso/render.py) is a painter-style renderer:

1. draw all tiles
2. draw the player on top

That model is stable, but it cannot represent all of these cases correctly at once:

- player on a lower level partially hidden by a meseta
- player transitioning behind a wall face
- player near ramps without the ramp being treated like a solid wall
- multiple enemies moving freely across different heights
- projectiles with visible travel and independent height

The failed attempts so far were all variants of object-level heuristics:

- `y-sort`
- `depth_key`
- `bbox overlap`
- occluder polygons activated by radii
- excluding ramps from some rules

These approaches can fix individual screenshots, but they do not close the general problem because they still decide visibility at object level instead of pixel level.

## Why Sorting Is Not Enough

The common pattern in the literature is:

- simple back-to-front sorting works only for simple cases
- splitting walls into parts can improve it but remains fragile
- for free movement and overlapping tall geometry, the robust solution is a depth buffer

References reviewed:

- Allefant explains that isometric objects cannot be correctly sorted in general and points to z-buffering as the general solution: <https://allefant.com/page/isometricprojection.html>
- AGS discussion reaches the same conclusion for free movement behind angled walls; the practical robust option is pixelwise z-buffering: <https://www.adventuregamestudio.co.uk/forums/beginners-technical-questions/isometric-view-baselines-and-seeing-through-walls/>
- Jagaco describes moving from sprite ordering to a custom depth buffer to avoid clipping problems in an isometric scene: <https://jagaco.com/2016/12/12/custom-depthbuffer/>
- Justin D Johnson describes a polygon-occlusion system as a practical workaround, but explicitly not as a general guarantee: <https://justindjohnson.com/softdev/isometric-occlusion/>
- GameMaker's z-tilting article shows the same underlying issue: a flat sprite depth is not enough when feet and head should resolve differently against world geometry: <https://gamemaker.io/en/blog/z-tilting-shader-based-2-dot-5d-depth-sorting>

## Decision

`python-iso` should move to a software `DepthRenderer`.

Not later.
Not after more heuristic patches.

The renderer should stop asking:

- "is the actor behind this meseta?"

and instead answer:

- "for each pixel, what is the closest visible surface?"

That is the only design here that is consistent with:

- free movement
- ramps
- tall sprites
- multiple actors
- projectiles with height

## High-Level Architecture

Split rendering into two layers:

1. `Scene primitive generation`
2. `Depth rasterization`

### 1. Scene Primitive Generation

Each visible thing emits render primitives with geometry and depth semantics.

World primitives:

- tile top
- south face
- east face
- ramp plane
- ramp side triangle

Actor primitives:

- shadow
- torso
- head
- weapon marker if needed later
- projectile quad/point later

Each primitive carries:

- screen-space polygon or bounding quad
- fill style or draw callback
- a depth function
- optional transparency mode

### 2. Depth Rasterization

The renderer owns:

- `color_buffer`
- `depth_buffer`

For each covered pixel:

- compute primitive depth at that pixel
- compare against current depth buffer
- write color only if closer

This removes the need for:

- wall-specific occlusion checks
- actor-specific exceptions
- ramp exceptions
- "behind/not behind" thresholds

## What "Depth" Means In This Prototype

The game already uses a world model:

- `grid_x`
- `grid_y`
- `height`

Projection is in [python-iso/pyiso/iso.py](/Users/oalfonso/pipprojects/canuter/python-iso/pyiso/iso.py).

The renderer should define a single monotonic depth coordinate in world space:

`render_depth = world_x + world_y + world_z * z_bias`

Where:

- `world_z` is the vertical world height of the pixel
- `z_bias` is chosen so that higher geometry on the same tile sits correctly in front of lower geometry when projected

The exact formula can be tuned, but the invariant is:

- deeper into the scene = farther
- higher vertical geometry on the same footprint can still win correctly where appropriate

The important point is not the exact scalar formula.
The important point is that every visible pixel gets a depth value derived from the same world model.

## Geometry Model For Current Assets

The current world in [python-iso/pyiso/render.py](/Users/oalfonso/pipprojects/canuter/python-iso/pyiso/render.py) already knows how to build the necessary polygons.

### Tiles

For a normal tile:

- top face: diamond at `tile.height`
- south face: quad from top south edge down to neighbor height
- east face: quad from top east edge down to neighbor height

These already exist conceptually in:

- `_tile_top_points`
- `_build_face_points`

### Ramps

For a ramp tile:

- base tile top still exists for footprint
- ramp plane is a 4-point polygon with two elevated vertices
- ramp side is a triangle

This already exists in:

- `_ramp_visual_polygons`

The difference in the new renderer is that the ramp plane and triangle will not be decorative overlays.
They become real depth-writing primitives.

### Player / Actors

The current player is a procedural shape:

- shadow ellipse
- torso ellipse
- head circle

Under the new renderer:

- shadow stays a ground-only non-occluding or separately layered primitive
- torso and head become height-carrying primitives

That means the actor is no longer treated as a single flat sprite at one depth.

Instead:

- feet/base are close to ground depth
- torso is higher
- head is higher still

This is the core reason the new approach can solve "lower body hidden, head visible" correctly.

## Shadow Rules

Shadows should not participate in world occlusion the same way as body parts.

Rule:

- render world depth pass first
- render shadow as a ground-layer overlay using the actor's ground position
- then render actor body/head through the depth pass

This preserves the useful readability rule:

- the shadow tells you where the entity stands

while still allowing:

- the body to disappear partially behind mesetas

## Ramps Under The New Design

Ramps stop being a special-case problem.

They simply become primitives with their own per-pixel depth.

That means:

- a player below a ramp will not be incorrectly drawn "on top" of it
- a player on a ramp will resolve naturally against adjacent walls
- the ramp visual no longer needs to be excluded from occlusion hacks

This is a strong reason to stop investing in heuristic occluders.
Ramps are exactly where the heuristic system starts to collapse.

## Projectiles And Enemies

This design scales directly.

Every renderable entity gets:

- `world_x`
- `world_y`
- `world_z`
- visual footprint
- visual height

Examples:

- enemy: same body/head structure as player
- low projectile: tiny primitive with low `world_z`
- high projectile: tiny primitive with elevated `world_z`

Then depth resolution is automatic.

No new special occlusion rule is needed for projectiles.
They use the same renderer.

## Why This Is The Right Approach For The Multiplayer Target

The long-term game target is:

- online multiplayer
- 5v5
- low ping
- responsive projectiles and combat

That argues even more strongly for separating:

- simulation truth
- render visibility

The server never needs to know about this.
The simulation does not change.
Only the client render path changes.

That is the correct architectural split:

- simulation remains simple and deterministic
- render solves visibility locally and consistently

## Feasibility In PyGame

The risk is not correctness.
The risk is performance.

A naive full-screen Python pixel loop would be too slow.

Therefore the design must be implemented with these constraints:

### Required Implementation Constraint

Rasterize only inside primitive bounding boxes, never across the entire screen.

### Strong Recommendation

Add `numpy` and store:

- depth buffer as `float32`
- color buffer as `uint8`

Without `numpy`, a correct implementation is still possible, but runtime cost and code complexity go up sharply in Python.

Given this prototype's goals, adding `numpy` is justified.

## Implementation Plan

### Phase 1: Build A Parallel Renderer

Do not mutate the existing stable renderer in place first.

Add:

- `python-iso/pyiso/depth_render.py`

Keep [python-iso/pyiso/render.py](/Users/oalfonso/pipprojects/canuter/python-iso/pyiso/render.py) as fallback until the new path is validated.

### Phase 2: Primitive Data Structures

Introduce lightweight primitive types:

- `DepthPolygon`
- `DepthEllipse`
- `DepthCircle`

Each needs:

- screen bounds
- coverage test
- depth function
- color function or flat color

### Phase 3: World Primitive Emission

Emit primitives for:

- tile tops
- south faces
- east faces
- ramp planes
- ramp triangles

This should reuse the geometry already computed by the current renderer.

### Phase 4: Actor Primitive Emission

Emit:

- shadow primitive
- torso primitive
- head primitive

The torso and head need local depth profiles, not a single constant depth.

The simplest acceptable version:

- torso depth interpolates vertically from base to top
- head uses a higher constant or radial profile

### Phase 5: Depth Buffer Rasterizer

Implement:

- clear color
- clear depth
- primitive raster loop restricted to bounding boxes
- depth test per covered pixel

### Phase 6: HUD And Debug Overlay

HUD remains a normal final draw after the depth pass.

### Phase 7: Switch The Main Game To The New Renderer

Only after tests and visual checkpoints pass.

## Validation Plan

The old heuristic work failed partly because the tests were too indirect.
The new path needs explicit render assertions.

### Automated Checks

1. Spawn tile:
- player fully visible on flat ground

2. Meseta transition:
- lower body hidden before full body is hidden

3. Behind meseta:
- body mostly hidden
- head visibility depends on actual geometry

4. Ramp below actor:
- actor not drawn on top of ramp when physically below it

5. Actor on ramp:
- actor integrates cleanly with adjacent meseta geometry

6. Two actors different heights:
- correct relative visibility

7. Projectile low behind wall:
- hidden

8. Projectile high above wall:
- visible

### Manual Screenshot Fixtures

Because this is render-heavy, capture fixed fixtures for known tricky positions and compare them during development.

## What To Avoid

Do not keep iterating on:

- occluder polygons as the main visibility system
- per-case ramp exceptions
- "if closer than X pixels" thresholds
- face repaints after actor draw
- actor bbox overlap tests

These may remain useful as temporary debugging tools, but they are not the system.

## Final Recommendation

For `python-iso`, the correct design is:

- keep simulation and collision as-is
- replace heuristic actor/world occlusion with a software depth-buffer renderer
- implement it in parallel, not by further mutating the current painter renderer
- use `numpy` to keep it practical in Python

This is the first plan in this line of work that is robust enough to justify further implementation.
