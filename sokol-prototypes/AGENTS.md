# AGENTS

## Main Points

- Runtime is C or Objective-C; tooling can be Python.
- Use Sokol as the runtime/render/input layer.
- Prefer `src/`, `include/`, `data/`, `tools/`, `build/`.
- Keep `main` thin and delegate real work to modules.
- Split by domain: app, render, world, player, collision, shared.
- Prefer `.h` + `.c`/`.m` modules over giant source files.
- Prefer named structs over opaque arrays or long parameter lists.
- Heavy preprocessing belongs offline in Python, not in runtime.
- Prefer a root-level `settings.yaml` in each project for stable project configuration and contracts; put contract rules under a `contract:` block with explicit child keys instead of hiding them in one opaque string.
- In voxel source maps, `ROW` directives inside each `LAYER` must always appear in strictly ascending row index order.

## Geometry And Winding Convention

- Exterior faces must be defined so that `cross(u, v)` points outward.
- Equivalently, exterior faces must appear CCW when viewed from outside.
- The preprocess owns that convention and must emit geometry that respects it.
- The runtime artifact is assumed to already follow that convention.
- When a project needs formal geometry/runtime rules, store them in the project root `settings.yaml` under `contract:`.
- In `v9`, quads expand as `p0=origin`, `p1=origin+u`, `p2=origin+u+v`, `p3=origin+v`.
- In `v9`, indices are `0,1,2` and `0,2,3`.
- In `v9`, the renderer still uses `SG_CULLMODE_NONE`, so the convention is implicit, not strongly enforced.
- Before wedges/ramps, formalize the contract and align preprocess, artifact, and renderer around it.
- When wedges start, use front-face CCW plus backface culling to validate the convention strongly.
- If a face is not fully specified triangle by triangle, it is not specified enough.
