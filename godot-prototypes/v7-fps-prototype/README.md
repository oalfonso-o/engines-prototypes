# canuter-v7-fps-prototype

Fresh FPS sandbox prototype iteration built as a clean successor to `v6`.

The prototype uses a code-first bootstrap:
- `project.godot` starts `main.tscn`
- `main.tscn` only declares the root node and attaches `main.gd`
- `main.gd` instantiates environment, lighting, gameplay world, and HUD

## Controls

- `WASD`: move
- `Space`: jump
- mouse: look
- left mouse button: hitscan shot
- right mouse button: throw impulse grenade at the landing marker
- `Esc`: release the mouse cursor

## Map Format

`maps/default_arena.txt` uses one character per tile:
- `W`: outer wall block
- `C`: tall cover block
- `E`: enemy spawn
- `P`: player spawn
- `.`: empty walkable tile

## Run

```bash
cd /Users/oalfonso/pipprojects/canuter
make run-v7-fps
```

## Test

```bash
cd /Users/oalfonso/pipprojects/canuter
make test-v7-fps
```
