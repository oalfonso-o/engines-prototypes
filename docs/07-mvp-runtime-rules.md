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
- `Space` makes the player jump.
- Movement uses acceleration and deceleration rather than instant snapping.
- Strafing should reverse direction quickly enough to make repeated `ADADAD` movement responsive.
- Movement speed is runtime-configurable from the pause/settings menu and persisted locally.
- Gravity is runtime-configurable from the pause/settings menu and persisted locally.
- Jump force is runtime-configurable from the pause/settings menu and persisted locally.

## Player Health

- The HUD currently exposes the player as `100/100 HP`.
- Health is stable UI/runtime state even though full death/round flow is not yet implemented.

## Camera

- The camera is a 3D follow camera with the player framed low on screen in third person.
- Default camera pitch is `40` degrees.
- The old fixed camera-angle setting has been removed from the runtime settings UI.
- Camera pitch is now driven live by mouse vertical look during gameplay.
- Mouse wheel changes camera orbit distance at runtime.
- Pressing `V` toggles between FPS at minimum orbit distance and the last remembered TPS zoom distance.
- Orbit distance is clamped to the current prototype min/max values in code.
- Zoom moves the camera on a straight line toward the upper-center anchor of the player capsule.
- That zoom line is separate from the aim line that resolves the centered crosshair.
- The crosshair and live mouse look now define the effective camera angle.
- The player can pitch the centered crosshair above the horizon to aim into the sky.
- In third person, downward aim is constrained so the centered crosshair cannot move below the lowest point of the player capsule.
- At minimum orbit distance, the camera should converge toward an FPS-like view on that same aim line.
- When the camera enters the close zoom band, the player body fades progressively and reaches `20%` visible opacity at minimum orbit distance so the player does not block the crosshair.
- The current prototype does not use camera ghost walls or advanced tactical darkening in the live runtime.

## Aim And Fire

- The runtime uses a true third-person free-look aim model.
- The crosshair stays centered on screen.
- Mouse horizontal movement controls camera/player yaw.
- Mouse vertical movement controls camera pitch.
- Player movement still uses only horizontal yaw, not camera pitch.
- Rifle and pistol use hitscan.
- Aiming resolves from the center of the camera viewport.
- Firing then traces from the weapon fire point toward that resolved camera-center aim point.
- In the current 3D prototype, the hitscan origin and the visible tracer must be the same point: the top-center of the player capsule.
- Rifle and pistol range in the 3D greybox should comfortably cover the current prototype map scale.
- Knife uses a short 3D shape query in front of the player.
- Shots originate from the weapon fire point.
- A short tracer is allowed as debug/gameplay feedback.
- On impact, the prototype may show a small translucent yellow marker at the hit point for debugging trajectory and wall blocking.
- Settings can optionally keep those hit markers persistent so the player can inspect accumulated hit points in-world.
- When a magazine-fed weapon is emptied, releasing primary fire should trigger an automatic reload if reserve ammo exists.

## Pause And Settings

- Pressing `Escape` opens the pause overlay.
- The pause overlay exposes:
- `Settings`
- `Exit`
- The settings screen currently exposes:
- heading sensitivity
- move speed
- gravity
- jump force
- camera distance
- camera rail pitch
- camera min distance
- camera max distance
- camera zoom step
- camera look-ahead
- camera FOV
- load defaults button
- persistent impact-marker toggle
- Default settings values are:
- heading sensitivity `0.001`
- move speed `20`
- gravity `50`
- jump force `20`
- camera distance `10`
- camera rail pitch `20`
- camera min distance `0.6`
- camera max distance `10`
- camera zoom step `1`
- camera look-ahead `100`
- camera FOV `40`
- keep hit markers `true`
- Old `user://runtime_settings.cfg` files are deleted and regenerated when the settings schema changes.
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
