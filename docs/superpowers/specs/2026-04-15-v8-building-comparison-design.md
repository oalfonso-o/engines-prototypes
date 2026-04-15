# V8 FPS Building Comparison Design

## Objective

Add two new playable FPS scene variants inside `godot-prototypes/v8-fps-prototype` that implement the same three-floor building layout:

1. a direct code-built primitives variant
2. a GridMap-based variant

The goal is to compare both construction approaches under the same project, using the same player controller and the same overall playable layout.

`main.tscn` and the current default `main_scene` stay unchanged. The new variants are launched through separate Makefile targets.

## Constraints

- Keep the work contained inside `v8`.
- Reuse the current FPS player setup where possible.
- Prioritize safe spawn, stable floor collision, reliable stair traversal, and balcony jump/landing.
- Keep the two variants structurally comparable.
- Avoid broad refactors outside what is required for these scenes.

## Shared Layout Contract

Both scene variants implement the same environment:

- a very large flat exterior ground plane
- one three-floor building centered on that ground
- a valid exterior player spawn facing the building

The building layout is:

- ground floor:
  - large front doorway
  - staircase on the left side
  - two back rooms with open doorway access
  - four windows total: left wall, right wall, one per back room
- first floor:
  - same general room/window pattern
  - staircase continuation on the right side
  - circulation that connects arrival from below to ascent above
- third floor:
  - same general room/window pattern
  - no further stairs up
  - roof above the building
  - one accessible balcony at a window
  - balcony supports jumping down to exterior ground

## Architecture

### Shared layout description

Add a small shared building layout description under `runtime/logic/` that acts as the single source of truth for:

- exterior footprint
- floor heights
- wall thickness
- doorway and window openings
- room partitions
- stair positions and direction by floor
- balcony placement
- exterior spawn position

This shared layout is intentionally small and deterministic. It does not try to be a generic architecture tool. Its purpose is to make both variants match closely enough for fair comparison.

### Variant A: direct primitives

Add a new minimal scene and root script for the primitives-based variant.

The root script remains thin and delegates building to helper classes that create:

- exterior ground
- floor slabs
- walls with openings
- room partitions
- balcony platform
- roof
- simple stair geometry and collision
- reused FPS player
- optional HUD if needed for consistency with existing `v8` behavior

The primitives builder uses direct Godot nodes, meshes, and collision shapes. It favors clean blocky geometry and traversal stability over decorative detail.

### Variant B: GridMap

Add a second minimal scene and root script for the GridMap-based variant.

This variant uses the same shared layout description, but expresses the building through:

- a `GridMap`
- a small mesh library for tiles such as:
  - floor
  - wall
  - stair step
  - roof
  - balcony
- omission of tiles to represent door and window openings
- the same exterior ground and FPS player setup

The GridMap variant should stay close to the primitives variant in footprint and traversal, even if exact wall shaping differs slightly due to cell-based construction.

## Stair And Collision Strategy

Traversal is a hard requirement, so both variants use conservative geometry:

- wide stairs
- shallow step height and depth
- continuous, predictable floor coverage
- no narrow ledges required for core traversal
- balcony wide enough to stand on and jump from reliably

The player must never spawn over empty space or partially intersect geometry. Spawn is always placed over verified exterior ground.

## Testing And Validation

Add pragmatic automated coverage under `tests/integration/` for each new scene.

Tests should validate at least:

- scene instantiates
- player exists
- player remains grounded shortly after spawn
- player can move on exterior ground
- building geometry exists
- traversal smoke checks for vertical progression and balcony access

The automated checks do not need to prove every manual route perfectly, but they must catch the class of regressions already seen before: invalid spawn, missing floor, broken stairs, inaccessible upper floors, or absent balcony support.

Manual validation still remains part of completion:

- enter building
- climb to first floor
- climb to third floor
- access balcony
- jump down and land on exterior ground

## Entry Points

Add two clear Makefile run targets, one per variant.

The targets run the `v8` project while overriding the main scene to the corresponding comparison scene, leaving the existing `run-v8-fps` behavior untouched.

## Expected Files

The implementation should add only the files directly needed for this comparison setup:

- two new scenes
- two new root scripts
- one small shared layout description
- builders/helpers required by each variant
- GridMap setup and mesh library support
- integration tests
- Makefile targets

## Out Of Scope

- no new prototype version
- no combat expansion
- no decorative polish beyond what is needed for readable traversal
- no broad reorganization of existing `v8` runtime
