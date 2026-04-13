# v2-iso3d

Standalone Godot prototype for the isometric 3D direction of `canuter`.

What it includes:

- fixed isometric 3D camera
- floating neon platforms built from the same TXT map used by `python-iso`
- real 3D occlusion so the player hides behind higher platforms automatically
- `CharacterBody3D` movement with `WASD`
- jump with `Space`
- ramps and stacked platforms from the central plateau layout
- debug HUD with FPS, player position, velocity, camera info, tile/ramp counts

Controls:

- `WASD`: move relative to the fixed screen view
- `Space`: jump
- `R`: rebuild the scene and respawn on the map spawn

Open and run:

1. Open `godot-prototypes/v2-iso3d/project.godot` in Godot.
2. Run the main scene.

Headless validation:

```bash
"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path godot-prototypes/v2-iso3d --script res://tests/integration_runner.gd
```

Notes:

- The map is rebuilt from `maps/three_lanes/*.txt`, so the layout stays aligned with the Python prototype.
- The renderer is real 3D, so hiding behind platforms is handled by Godot depth buffering instead of custom software sorting.
