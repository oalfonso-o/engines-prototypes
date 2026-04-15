# canuter-v8-fps-prototype

This project now boots into a contained procedural tunnel demo inside `v8`.

The original FPS sandbox is still present in the project under `main.tscn`, and its automated tests still run against that scene.

The tunnel demo uses a code-first bootstrap:
- `project.godot` starts `TunnelDemo.tscn`
- `TunnelDemo.tscn` only declares the root node and attaches `runtime/engine/tunnel_demo_root.gd`
- `tunnel_demo_root.gd` builds the world environment, camera, tunnel geometry, track, rails, and warm tunnel lights in code

## Controls

- `WASD`: move through the tunnel
- mouse: look around
- `Space`: jump
- `Esc`: release the mouse cursor

## Run

```bash
cd /Users/oalfonso/pipprojects/canuter
make run-v8-fps
```

That command now opens the tunnel scene by default.

## Test

```bash
cd /Users/oalfonso/pipprojects/canuter
make test-v8-fps
```
