# MVP Runtime Rules

## Purpose

- This document is the implementation-facing runtime contract for the current offline MVP branch.
- It complements the broader design docs by describing what the prototype should actually do in code right now.
- If gameplay code changes in a way that alters one of these rules, this document should be updated in the same change.

## Scope

- This document describes the current offline runtime branch under `godot/`.
- It is intentionally narrower than the long-term design.
- If a long-term design rule conflicts with this file, the current MVP runtime should follow this file until the prototype is intentionally expanded.
- The target game mode is now the bomb-run objective defined in `docs/02-gameplay-core.md`, but that full objective flow is not yet implemented in the current runtime branch.
- The current default boot scene is `main_3d.tscn`.
- The older 2D scene `main.tscn` remains in the repo as a reference/runtime comparison path, but it is no longer the default launch target.

## Player Core

- The player is controlled with `WASD`.
- The runtime now supports two player view modes:
- `topdown_fixed`
- `heading_locked`
- The current default player-facing runtime is the 3D `heading_locked` prototype.
- Aim direction is mode-dependent:
- `topdown_fixed`: aim direction is driven by mouse position.
- `heading_locked`: aim direction is driven by relative horizontal mouse movement and remains locked forward.
- The player can move independently of where they are aiming.
- `heading_locked` horizontal turn speed uses one shared runtime sensitivity value for the heading that body, weapon, fire direction, and rotating camera all follow together.
- Body animation uses the canonical `south` source set and is rotated in runtime.
- The current body animation set has two runtime states:
- `idle`
- `move`
- In the current 3D prototype, player and enemy visuals start as simple capsules rather than final character art.

## Player Movement

- Movement uses acceleration and deceleration rather than instant velocity snapping.
- Current prototype tuning lives in code and should be treated as MVP gameplay tuning, not final balance.
- The movement collider should stay simple and centered on the canonical body pivot.
- Hurtboxes may be more detailed than movement collision, but the movement collider remains the source of truth for wall contact.

## Player Health

- The HUD and runtime currently expose the player as `100/100 HP`.
- The player health display is part of the MVP HUD contract.
- Player damage/death flow is not yet the full long-term round-resolution implementation.
- Until real player death is implemented, health should be treated as a runtime-facing placeholder state with stable UI shape.

## Camera

- The current default camera is a 3D follow camera with a low angle and the player framed near the bottom of the screen.
- The current 3D prototype intentionally uses a tighter, lower follow camera and a narrower field of view than the earlier reset pass so corridors and wall silhouettes read more cleanly.
- The current default 3D camera angle is `40` degrees measured from the ground plane toward top-down.
- The 3D camera angle is runtime-configurable from `0` degrees (ground-level) to `90` degrees (vertical top-down).
- The older 2D camera path still exists in `main.tscn`.
- `topdown_fixed`: the camera does not rotate.
- `heading_locked`: the camera rotates with the player's heading so the player remains visually upright on screen.
- `heading_locked`: camera position follow is immediate rather than smoothed.
- `heading_locked`: the camera is biased forward along the current heading so the player sits below screen center and more space is visible ahead than behind.
- `heading_locked`: in the current default 3D prototype, the perspective comes from real 3D geometry and camera projection rather than the older fake 2.5D overlay.
- The current simplified 3D reset does not yet apply camera ghosting or tactical visibility darkening; the immediate priority is clean movement, clean wall readability, and stable camera framing.
- The default runtime zoom is slightly zoomed out from the original prototype baseline.
- In the 3D prototype, mouse wheel controls camera orbit distance around the player.
- The zoom-in limit is the current closest gameplay zoom.
- The zoom-out limit is the current farthest gameplay zoom used by the prototype.

## Pause And Settings

- Pressing `Escape` opens a pause overlay.
- The current pause overlay contains a `Settings` entry.
- The current pause overlay also exposes an `Exit` action that quits the runtime.
- The current settings screen exposes:
- player view mode selector
- heading-locked turn sensitivity
- 3D movement speed
- 3D camera angle
- In the current default 3D prototype, the view mode selector is effectively pinned to `heading_locked`.
- Runtime settings are persisted locally so the selected view mode, heading-locked sensitivity, 3D movement speed, and 3D camera angle are restored on the next launch.
- Closing the pause overlay returns control to gameplay using the currently selected view mode.

## Weapon Slots

- The current MVP runtime weapon slot layout is:
- `1` rifle
- `2` pistol
- `3` knife
- `4` utility placeholder
- The target gameplay design also includes:
- `5` bomb
- `E` action / interact / plant / defuse
- `G` drop
- Those bomb/interact/drop rules are defined at the design layer but are not yet fully implemented in the current runtime branch.
- Slot switching is part of the prototype and should remain visible in HUD/state handling even if some slots are placeholders.

## Weapon Definitions

- Weapons are defined as runtime data, not hardcoded directly inside player logic.
- Each weapon definition must include:
- weapon id
- display name
- category
- fire mode
- sprite asset id
- magazine size
- starting magazines
- damage
- range
- fire interval
- reload duration
- The runtime currently supports these categories:
- rifle
- pistol
- knife

## Fire Modes

- `rifle`: full-auto
- `pistol`: semi-auto
- `knife`: melee
- Full-auto weapons should continue firing while the trigger is held and cooldown allows it.
- Semi-auto weapons should fire once per click/press.
- Melee weapons should use a short-range hit shape rather than a long ray.

## Ammo Model

- Magazine-fed weapons track:
- ammo in magazine
- reserve ammo
- Knife does not use magazine ammo or reserve ammo.
- `starting_magazines` is treated as a design-facing convenience input.
- Runtime reserve ammo is derived from `magazine_size * (starting_magazines - 1)` for magazine-fed weapons.

## Reload Rules

- Reloading is time-based, not instant.
- Reloading should block firing.
- Reloading is only valid when:
- the weapon uses a magazine
- the magazine is not already full
- reserve ammo exists
- Completing the reload transfers only the missing ammo up to the available reserve amount.

## Bomb Objective Rules

- The target gameplay design includes a shared bomb that is picked up from the map center and planted in the enemy base.
- Planting uses a `5` second stationary channel.
- Defusing uses a `5` second stationary channel.
- Moving interrupts either channel and restarts it.
- A planted bomb explodes after `30` seconds unless defused.
- Players close enough to the blast should die when the bomb explodes.
- After bomb detonation, the round should show the winner first and end `5` seconds later.
- This full bomb lifecycle is part of the target MVP direction but is not yet fully implemented in the current runtime branch.

## Shot Resolution

- The current rifle and pistol implementation use hitscan, not physical projectiles.
- Shot origin comes from the equipped weapon fire point.
- Shot direction is mode-dependent:
- `topdown_fixed`: the shot direction is derived from the fire point toward the mouse.
- `heading_locked`: the shot direction is derived from the current forward heading.
- Hitscan stops at the first valid collision along the ray.
- Walls block shots.
- A short debug tracer is allowed as gameplay feedback in the MVP branch.
- In the current 3D prototype, hitscan and melee both operate in 3D physics space while keeping the same weapon data and core weapon state logic.

## Melee Resolution

- Knife attacks use a short-range shape query in front of the player.
- Knife range is intentionally short relative to firearm range.
- Knife attacks still respect cooldown.
- Knife attacks currently use simple proximity/hit shape logic rather than a full melee animation state machine.

## Weapon Rendering

- Weapon visuals are a separate layer from the body.
- Equipped weapon visuals are selected from the weapon definition asset id.
- Body and weapon rotate together around the same gameplay pivot in the current MVP branch.
- Weapon asset geometry should do most of the alignment work before scene-level offsets are considered.

## Target And Damageable Rules

- The current combat target implementation is a dummy target actor.
- Dummy targets are the current runtime proof that:
- aiming works
- hitscan works
- melee hit checks work
- damage application works
- Target visibility should obey the same visibility rules as the rest of the world.
- Targets should not render if they are not currently visible to the player.
- In the current 3D prototype, dummy targets are simple capsules.

## Vision Rules

- The current simplified 3D reset does not yet apply the intended tactical visibility model in runtime rendering.
- The long-term target for the 3D prototype remains:
- forward-facing `180` degree tactical visibility
- wall occlusion in the front hemisphere
- broader readability in the rear hemisphere
- That visibility split should be reintroduced only after camera scale, movement, and base map readability are stable.

## Fog Of War Rules

- The runtime tracks three knowledge states:
- currently visible
- explored but not currently visible
- unexplored
- Unexplored cells must not reveal meaningful geometry.
- Explored cells may remain known to the player when out of sight.
- Live targets must not remain visible just because their cell was explored before.
- The current simplified 3D reset does not yet apply fog-of-war or hidden-known darkening in the live runtime.
- Fog/visibility presentation for the 3D prototype should be added back in a later pass once the baseline camera/readability problem is solved.

## Map Runtime Rules

- The map is loaded from a text file.
- The map renderer is part of the runtime path, not a throwaway prototype shortcut.
- The current default 3D prototype extrudes the same text-map semantics into floor tiles and wall volumes.
- The current 3D prototype keeps walls slightly lower relative to cell width than the first reset pass so lanes remain readable from the chosen camera angle.
- Wall collision currently uses simple per-cell box blocking in 3D.
- Floor is currently rendered procedurally from the same text map rather than authored as bespoke geometry.

## Minimap Rules

- The minimap is screen-space UI.
- The player marker stays centered in the minimap.
- The player marker should communicate orientation explicitly rather than as a directionless dot.
- Orientation markers should remain visible.
- `topdown_fixed`: the minimap uses the default north-up presentation.
- `heading_locked`: the minimap rotates with the player's current camera/heading orientation so forward remains up, and the orientation markers rotate with it.
- Enemy markers should appear only for targets that are currently validly visible.
- The minimap should not reveal hidden or merely explored enemies.
- In the 3D prototype, the minimap remains a 2D UI projection rather than a separate rendered 3D camera.

## HUD Rules

- The HUD is not world-space debug text.
- The current MVP HUD contract is:
- bottom-left health block
- bottom-right weapon and ammo block
- weapon slot strip
- top-right minimap
- top-right kill feed
- HUD layout should remain stable while values change.
- Placeholder text is acceptable in the prototype if the placement and meaning are already correct.
- Crosshair presentation is mode-dependent:
- `topdown_fixed`: free mouse crosshair
- `heading_locked`: centered forward aim hint
- In the current default 3D prototype, `heading_locked` uses the centered forward aim hint and the world is rendered directly as 3D geometry instead of through the older pseudo-perspective overlay.

## Runtime Source Of Truth

- Gameplay code under `godot/` should use these runtime rules as the implementation contract for the MVP branch.
- Art and asset behavior should remain consistent with `docs/art-bible/03-mvp-visual-rules.md`.
- If a new gameplay mechanic becomes part of the real MVP runtime, add it here before or together with the implementation.
