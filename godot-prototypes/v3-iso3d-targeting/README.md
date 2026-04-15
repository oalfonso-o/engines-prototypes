# v3-iso3d-targeting

Standalone Godot prototype for the isometric 3D targeting-based shooting direction of `canuter`.

What it includes:

- fixed isometric 3D camera with smooth follow
- floating neon platforms built from the shared TXT map
- real 3D occlusion and cover
- `CharacterBody3D` movement with `WASD`
- jump with `Space`
- hybrid shooting:
  - `targeting` when the cursor is on an enemy
  - `free fire` when the cursor is not on an enemy
- fixed damage per shot by weapon
- debug HUD with FPS, weapon state, targeting state, last shot result, and target health

Controls:

- `WASD`: move relative to the fixed screen view
- `Space`: jump
- `Mouse`: aim and target
- `LMB`: fire
- `R`: reload
- `1` / `2`: switch rifle and pistol
- `F5`: rebuild the scene and respawn on the map spawn

Open and run:

1. Open `godot-prototypes/v3-iso3d-targeting/project.godot` in Godot.
2. Run the main scene.

Headless validation:

```bash
"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path godot-prototypes/v3-iso3d-targeting --script res://tests/integration_runner.gd
```
