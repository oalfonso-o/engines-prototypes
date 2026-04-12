# MVP Runtime Rules

## Purpose

- This document is the implementation-facing runtime contract for the current Godot branch.
- The repo now has a single active runtime path: the 3D prototype under `godot/main_3d.tscn`.
- If gameplay behavior changes in code, update this file in the same change unless the change is explicitly experimental and temporary.

## Runtime Scope

- The default and only supported runtime scene is `main_3d.tscn`.
- The old 2D runtime path has been removed from the codebase.
- The current focus is clean third-person combat feel, readable map scale, and stable camera behavior before reintroducing more advanced tactical visibility.

## Player Core

- The player is a simple 3D capsule actor.
- Movement uses `WASD`.
- Weapon slots currently implemented:
- `1` rifle
- `2` pistol
- `3` knife
- `4` utility placeholder
- The runtime keeps a centered screen-space crosshair and captured mouse input during gameplay.

## Player Movement

- Movement is relative to facing.
- `W` moves forward.
- `S` moves backward.
- `A` and `D` are strafes.
- Movement uses acceleration and deceleration rather than instant snapping.
- Strafing should reverse direction quickly enough to make repeated `ADADAD` movement responsive.
- Movement speed is runtime-configurable from the pause/settings menu and persisted locally.

## Player Health

- The HUD currently exposes the player as `100/100 HP`.
- Health is stable UI/runtime state even though full death/round flow is not yet implemented.

## Camera

- The camera is a 3D follow camera with the player framed low on screen.
- Camera angle is measured in degrees from the ground plane:
- `0` degrees: ground-level
- `90` degrees: vertical top-down
- Default camera angle is `40` degrees.
- Camera angle is configurable in settings and persisted locally.
- Mouse wheel changes camera orbit distance at runtime.
- Orbit distance is clamped to the current prototype min/max values in code.
- The current prototype does not use camera ghost walls or advanced tactical darkening in the live runtime.

## Aim And Fire

- Aim is currently driven by horizontal mouse movement relative to the player heading.
- The live runtime still uses a centered forward aim hint rather than a free-look TPS aim model.
- Rifle and pistol use hitscan.
- Knife uses a short 3D shape query in front of the player.
- Shots originate from the weapon fire point.
- A short tracer is allowed as debug/gameplay feedback.

## Pause And Settings

- Pressing `Escape` opens the pause overlay.
- The pause overlay exposes:
- `Settings`
- `Exit`
- The settings screen currently exposes:
- heading sensitivity
- 3D movement speed
- 3D camera angle
- Runtime settings are persisted locally in `user://runtime_settings.cfg`.

## Map Runtime Rules

- The map is loaded from a text file and extruded into simple 3D geometry.
- Floor is generated procedurally from the map text data.
- Walls are generated as simple per-cell volumes.
- Current prototype priority is readability, not final environment art.

## Visual Presentation

- The player and dummy targets are simple capsules.
- Walls must read clearly as walls and remain visually distinct from the floor.
- The prototype should prefer clean greybox readability over decorative detail.
- HUD remains screen-space and includes:
- bottom-left health block
- bottom-right weapon/ammo block
- weapon slot strip
- top-right minimap

## Vision

- The long-term gameplay direction still includes asymmetric tactical visibility:
- constrained front hemisphere
- broader rear readability
- wall occlusion
- darkened hidden-known spaces
- That presentation is not currently active in the simplified 3D runtime.
- Reintroduce it only after camera, scale, aiming, and core combat feel are stable.

## Runtime Source Of Truth

- Gameplay/runtime implementation under `godot/` should follow this file.
- Shared deterministic gameplay logic should continue to live under `src/Canuter.Gameplay/` where practical so it can be covered by `dotnet test`.
