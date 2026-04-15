# v4-iso3d-moba-like

Standalone Godot prototype for the MOBA-like skillshot direction of `canuter`.

What it includes:

- fixed isometric 3D camera with hard follow
- floating neon platforms built from the shared TXT map
- real 3D occlusion, levels, ramps, and jump
- ability selection with `1`, `2`, and `F`
- preview telegraphs before casting
- wide linear skillshot
- narrow linear skillshot
- grenade with fast parabolic travel and area damage
- debug HUD with FPS, selected ability, cooldowns, last cast info, and target health

Controls:

- `WASD`: move
- `Space`: jump
- `1`: select wide beam
- `2`: select narrow beam
- `F`: select grenade
- `LMB`: cast selected ability
- `F5`: rebuild the scene

Open and run:

1. Open `godot-prototypes/v4-iso3d-moba-like/project.godot` in Godot.
2. Run the main scene.

Headless validation:

```bash
"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path godot-prototypes/v4-iso3d-moba-like --script res://tests/integration_runner.gd
```
