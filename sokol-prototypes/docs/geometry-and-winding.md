# Sokol Geometry And Winding Convention

## Current V9 pipeline

The current voxel pipeline in `v9-v13-map-parity` is:

1. source map TXT
2. Python preprocess
3. runtime artifact JSON
4. runtime load in Sokol
5. expansion to vertex/index buffers
6. draw

For cube faces, the runtime currently expands each quad as:

- `p0 = origin`
- `p1 = origin + u`
- `p2 = origin + u + v`
- `p3 = origin + v`

with indices:

- `0, 1, 2`
- `0, 2, 3`

This means the geometric front side of the face is the side pointed to by:

- `cross(u, v)`

## Official convention

For the Sokol voxel pipeline, the intended geometry convention is:

1. Every exterior face must be defined so that `cross(u, v)` points outward.
2. Equivalently, every exterior face must appear CCW when viewed from outside.
3. The preprocess is responsible for emitting geometry that respects that rule.
4. The runtime should consume geometry assuming that rule is true.

## Important note about V9 today

`v9` currently uses:

- `SG_CULLMODE_NONE`

So the renderer does not yet enforce the convention through backface culling.
That means the system currently relies on the preprocess using the correct face orientation, but it does not strongly validate it.

This is acceptable for the current cube-only pipeline, but it is not a strong enough contract for wedges/ramps.

## What wedges need before implementation

Before wedges are implemented, the system should treat this as a hard contract:

1. Exterior faces are CCW from outside.
2. Face orientation is validated against `cross(u, v)`.
3. Wedge geometry must specify winding triangle by triangle, not only by listing face vertices loosely.
4. Rotations of the canonical wedge must be specified exactly, not informally.
5. Runtime culling should be aligned with the same convention.

## Recommended renderer alignment

When the wedge work starts, the renderer should be aligned with the geometry contract:

1. front face = CCW
2. cull back faces

That gives one single convention across:

- preprocess
- runtime artifact
- Sokol renderer

and avoids misleading cases where inverted faces still render because culling is disabled.
