# V12 Wedge Collision Runtime

`v12` keeps the visual wedge contract from `v11` and adds explicit player collision against wedges.

## What changed

- `settings.yaml` is now the source of truth for:
  - paths
  - app and camera tuning
  - player tuning
  - materials and render colors
  - canonical wedge geometry
  - wedge collision ids and tolerances
- preprocess now emits:
  - visual `quads`
  - visual `triangles`
  - `collision_shapes.boxes`
  - `collision_shapes.wedges`
  - spawn config with map default + settings override
- runtime now:
  - loads settings through a dedicated module
  - loads wedge collision instances
  - resolves effective spawn
  - lets the player walk ramps smoothly

## Build and run

```bash
make preprocess
make run
```

From repo root:

```bash
make run-sok-v12
```
