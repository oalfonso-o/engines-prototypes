# 3D Heading-Locked Prototype Plan

## Goal

Build a parallel 3D prototype that preserves the current `heading_locked` gameplay feel and camera composition while removing the fragile custom 2D pseudo-perspective renderer.

This is not a full art migration. It is a runtime/rendering migration for the prototype branch.

## Why This Exists

The current 2D `heading_locked` experiment validated the desired feel:

- player low on screen
- world ahead emphasized
- tactical front visibility
- broader rear readability
- minimap/HUD still usable

It also exposed the limit of the fake 2.5D approach:

- custom projection math keeps generating new edge cases
- occlusion and wall volume are being reimplemented by hand
- rear-floor/rear-wall rendering is fragile
- visual correctness is difficult to test and expensive to maintain

The 3D prototype should keep the good parts and drop the fragile rendering layer.

## Required Outcome

The prototype must preserve these product-facing behaviors:

- The camera angle should feel like the current experimental `heading_locked` screenshot:
- player near the bottom of the frame
- forward space emphasized
- hybrid between first-person readability and third-person situational awareness
- Player control remains `heading_locked`:
- relative mouse turns heading
- `WASD` moves relative to heading
- fire direction is forward
- The player and enemies are simple capsules at first.
- Player movement collision and hitbox are simple capsules at first.
- Vision rules in the 3D prototype:
- `180` frontal hemisphere is tactical and visibility-gated
- walls block vision in that frontal hemisphere
- things behind blocking walls remain rendered, but darkened, to communicate "known but not currently visible"
- the `180` rear hemisphere is always readable; nothing behind the player is hidden
- Exterior walls between camera and interior should become see-through / ghosted when viewed from behind so they do not block the player's situational read of the space.

## Non-Goals For First Pass

- final character art
- final enemy art
- final wall materials
- advanced animation
- advanced skeletal rigs
- perfect destruction of all current 2D runtime paths
- final network architecture

## Architecture Principle

Keep gameplay/domain logic in `src/Canuter.Gameplay/` when possible.

Replace only the Godot-facing runtime layer needed for:

- 3D scene graph
- camera
- physics queries
- map rendering
- 3D visibility presentation

The existing C# testable core remains a strength and should not be discarded.

## Reuse Vs Replace

### Reuse

- `GameSettings`
- `PauseMenuState`
- `PlayerViewMode`
- weapon definitions/catalog/state
- shared tuning values where still meaningful
- HUD/menu/settings flow
- minimap logic as concept, though projection code may need a 3D-aware adapter
- tests in `src/Canuter.Gameplay/` where logic is still engine-agnostic

### Replace Or Parallelize

- `main.tscn` for the 3D prototype: create a parallel scene first
- `MapView.cs` with `MapView3D.cs`
- `PlayerController.cs` with `PlayerController3D.cs`
- 2D `VisionSystem.cs` with a 3D-facing visibility presenter
- pseudo-3D `HeadingLockedPerspectiveDebugOverlay.cs`

## Proposed File / Scene Layout

Create these in parallel instead of mutating the existing 2D scene first:

- `godot/main_3d.tscn`
- `godot/scripts/Main3D.cs`
- `godot/scripts/MapView3D.cs`
- `godot/scripts/PlayerController3D.cs`
- `godot/scripts/VisionSystem3D.cs`
- `godot/scripts/DummyTarget3D.cs`
- `godot/scripts/CameraRig3D.cs`
- `godot/scripts/VisibilityPresentation3D.cs`

Likely support assets / materials:

- `godot/materials/wall_opaque.tres`
- `godot/materials/wall_ghosted.tres`
- `godot/materials/floor_default.tres`
- `godot/materials/floor_hidden.tres`

Optional 3D-specific tests:

- `godot/tests/integration_runner_3d.gd`

## Scene Tree Proposal

`main_3d.tscn` should look roughly like this:

```text
Main3D
- World3DRoot (Node3D)
  - Map (MapView3D)
  - Player (PlayerController3D)
  - Targets (optional if not owned by Map)
  - CameraRig (CameraRig3D)
  - VisionSystem3D
- Hud (CanvasLayer)
  - Crosshair
  - GameHud
  - PauseMenuOverlay
```

### Camera Rig

Do not parent the `Camera3D` directly to the player without a rig.

Use a rig with explicit responsibility:

- follow player position
- apply yaw from heading
- apply fixed pitch
- apply low-on-screen composition
- manage optional occlusion / ghost-wall checks

Suggested nodes:

```text
CameraRig3D
- PivotYaw (Node3D)
  - PivotPitch (Node3D)
    - Camera3D
```

## Camera Specification

The camera should preserve the current experimental feel, not default chase-cam behavior.

### Desired Composition

- Player anchored near the lower part of the screen.
- Forward visibility dominates the frame.
- Camera looks downward with a fixed pitch.
- Camera follows immediately in `heading_locked`; no smoothing by default.

### Recommended First-Pass Values

Start with exported tuning values, not hardcoded constants buried in methods:

- follow distance behind player: small to medium
- height above player: medium
- fixed pitch downward: strong enough to keep map readable
- yaw follows heading exactly
- optional small forward look-ahead in world space

The exact numbers should be tuned in-engine, but the agent implementing this should expose them on `CameraRig3D` for live iteration.

## Player And Enemy Representation

For the prototype:

- Player visual: `CapsuleMesh3D` or equivalent simple capsule
- Enemy visual: same, with different color/material
- Player collision: `CharacterBody3D` with `CollisionShape3D` capsule
- Player hitbox: same capsule shape for first pass
- Enemy collision/hitbox: capsule as well

This keeps the prototype honest about scale and navigation without blocking on art.

## Map Generation In 3D

Keep the text-map pipeline as the source of truth.

`MapView3D` should read the same map file format used today.

### Geometry Rules

- Floor cell -> flat quad or boxed floor tile
- Wall cell -> extruded box with fixed wall height
- Spawn cells -> metadata only plus optional debug marker
- Target cells -> spawn `DummyTarget3D`

### Technical Recommendation

Do not spawn thousands of individual `MeshInstance3D` nodes if avoidable.

Prefer batching by type where practical:

- one mesh or a few meshes for floor chunks
- one mesh or a few meshes for wall chunks

But for the very first pass, simple per-cell `BoxMesh` instances are acceptable if it gets the prototype standing quickly.

After first validation, optimize with chunked meshes / `ArrayMesh` / `MultiMeshInstance3D`.

## Visibility Model In 3D

Gameplay intent remains the same, but rendering becomes much simpler in 3D.

### Frontal 180 Degrees

Within the front hemisphere:

- a point is tactically visible if it is in front of the player
- inside maximum vision distance
- not blocked by wall geometry

### Rear 180 Degrees

Within the rear hemisphere:

- geometry remains readable
- no tactical hiding is applied
- enemies/targets still should not become "free information" if that breaks design; decide per entity class

For the prototype, recommended rule:

- world geometry: always readable in rear hemisphere
- live enemies: still only fully highlighted / targetable when truly visible

### Hidden-But-Known Rendering

For geometry that is not currently visible in the frontal hemisphere because walls block it:

- render it darker, not fully invisible
- floor: hidden material/tint
- walls: hidden material/tint

This preserves tactical planning without losing map readability.

## How To Implement Visibility In 3D

Do not try to hide/show entire map chunks with ad-hoc heuristics first.

Split the problem:

### 1. Logical visibility query

Reusable code, likely in `VisionSystem3D`:

- player origin
- player forward
- max distance
- front hemisphere test
- physics raycast for wall occlusion

### 2. Presentation state

For each renderable cell or chunk:

- `front_visible`
- `front_hidden_known`
- `rear_readable`

### 3. Material response

- `front_visible`: normal material
- `front_hidden_known`: darkened material
- `rear_readable`: normal or lightly muted material

The clean implementation is to keep the geometry present and switch materials/modulate rather than destroy/rebuild visibility every frame.

## Exterior Walls Must Become See-Through

This is important and must be planned explicitly.

The issue:

- the camera is behind and above the player
- outer walls closest to the camera can block the interior read

Required behavior:

- if an exterior wall lies between the camera and the player/interior view, it should ghost/fade instead of remaining fully opaque

### First-Pass Approach

Implement camera-occluder ghosting:

- cast from camera to player anchor or to a small set of important focus points
- any wall hit in that segment becomes ghosted

Recommended material states:

- normal opaque wall
- ghosted wall with reduced alpha and maybe reduced outline contrast

This should apply mainly to the outer shell and any wall directly blocking the camera sightline.

### Better Follow-Up Approach

Later, classify "camera-facing blockers" per frame using:

- camera position
- player position
- wall bounds

and fade them smoothly instead of toggling instantly.

## Combat In 3D

### Weapon Model

Keep the weapon domain logic from `Canuter.Gameplay`.

### Firing

For first pass:

- hitscan in 3D
- origin from player muzzle or forward anchor
- direction = player forward
- raycast against physics bodies

### Knife

Use a short-range 3D shape query or short forward overlap.

### Damageable Targets

`DummyTarget3D` with:

- `StaticBody3D` or `CharacterBody3D`
- capsule collision/hitbox
- integration with current damage model

## Minimap In 3D Prototype

Keep minimap as 2D UI.

Do not render the minimap using the main 3D camera.

Instead:

- either use a simplified top-down data projection from map coordinates
- or use a dedicated top-down projection adapter

Desired behavior remains:

- player centered
- heading-locked minimap rotates with forward-up
- visible enemies only

## HUD / Menus

Keep current HUD and pause/settings overlays where possible.

The 3D prototype should not block on UI rewrites.

Reuse:

- `PauseMenuOverlay`
- `GameHud`
- `Crosshair` concept, though visual style may be tuned
- `GameSettingsStore`

## Testing Strategy

Keep TDD as the default workflow.

### Unit-Test First

Extract and test pure logic for:

- 3D visibility classifier
- front/rear hemisphere classification
- ghost-wall selection rules
- camera framing math where it is pure

Likely new pure classes:

- `VisibilityHemisphereModel`
- `VisionClassifier3D`
- `GhostWallSelector`
- `CameraFramingModel3D`

### Godot Integration Tests

Add targeted 3D integration tests only for wiring:

- `main_3d.tscn` boots
- camera follows player and uses the configured pitch
- switching into heading-locked 3D captures mouse and rotates camera
- geometry behind player remains readable
- wall in front darkens hidden area instead of exposing it
- wall between camera and player becomes ghosted

Avoid screenshot-by-pixel tests unless necessary.

## Recommended Delivery Phases

### Phase 1. Parallel 3D bootstrap

- create `main_3d.tscn`
- create `Main3D.cs`
- create `MapView3D.cs`
- instantiate simple floor + wall boxes from text map
- spawn capsule player and capsule targets
- wire existing HUD to the new scene

Acceptance:

- scene boots
- player moves
- camera follows
- one map loads correctly in 3D

### Phase 2. Heading-locked control feel

- create `PlayerController3D.cs`
- relative mouse controls yaw
- `WASD` moves relative to heading
- player remains visually low in frame through camera composition
- fire direction is forward

Acceptance:

- the 3D prototype feels like the current `heading_locked` mode
- camera angle approximates current experimental screenshot

### Phase 3. 3D visibility logic

- implement frontal `180` visibility checks
- implement wall occlusion through 3D raycasts
- classify geometry as visible / hidden-known / rear-readable

Acceptance:

- front hemisphere behaves tactically
- rear hemisphere remains readable

### Phase 4. Hidden-known darkening

- apply darkened material state to geometry blocked in front hemisphere
- keep rear hemisphere readable
- keep enemies governed separately from static geometry

Acceptance:

- blocked space is legible but clearly not fully visible

### Phase 5. Camera ghost walls

- camera-to-player occluding exterior walls fade / ghost
- do not destroy tactical wall readability

Acceptance:

- outer shell does not block the interior when viewed from behind

### Phase 6. Weapon / target parity

- hook rifle, pistol, knife behaviors
- verify hitscan and damage on `DummyTarget3D`

Acceptance:

- same core combat loop as current prototype works in 3D

### Phase 7. Minimap parity

- adapt minimap to the 3D runtime
- preserve forward-up rotation and visible-target rules

Acceptance:

- minimap is usable and consistent with 3D mode

### Phase 8. Decide runtime direction

After the 3D prototype is playable:

- compare against the 2D branch
- decide whether:
- 3D replaces `heading_locked`
- 3D becomes the main MVP runtime
- or the project returns to a cleaner pure-2D direction

## Suggested First Task For The Next Agent

Do not continue patching the 2D pseudo-3D renderer.

Start with:

1. create `main_3d.tscn`
2. create `MapView3D.cs`
3. load the existing text map into simple 3D floor and wall geometry
4. create a capsule player and a `CameraRig3D` with the same low-angle composition as the current screenshot
5. add one integration test that the scene boots and the camera is pitched/following correctly

That is the smallest slice that answers the main architectural question without wasting more time on the fake 2.5D path.
