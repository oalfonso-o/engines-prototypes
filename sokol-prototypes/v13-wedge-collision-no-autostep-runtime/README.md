# V13 Wedge Collision No-Autostep Runtime

`v13` keeps the explicit wedge collision from `v12` but removes all auto-step behavior to recover the simpler horizontal movement feel.

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
  - supports wedges without auto-step promotion during horizontal blocking

## Build and run

```bash
make preprocess
make run
```

From repo root:

```bash
make run-sok-v13
```
