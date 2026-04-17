# V11 Wedge Visual Runtime

`v11` keeps the `v10` cube contract and adds explicit visual wedges.

## Source map

- Uses a tiny local source map with:
  - one cube
  - two `WEDGE_PX` pieces
  - a minimal stepped ramp shape
- Source map path:
  - `data/source_world.txt`

## Contract

- Every exterior face must satisfy:
  - `cross(u, v)` points outward
  - equivalently, the face is CCW when viewed from outside
- Runtime quad expansion is fixed:
  - `p0 = origin`
  - `p1 = origin + u`
  - `p2 = origin + u + v`
  - `p3 = origin + v`
- Runtime indices are fixed:
  - `0,1,2`
  - `0,2,3`
- Wedges add:
  - `3` quads per wedge
  - `2` triangles per wedge
- `runtime_world.debug.json` is generated from `settings.yaml` and is only for human inspection

## Responsibilities

- Preprocess:
  - does cube-vs-cube structural culling only
  - emits full wedge templates without wedge neighbor culling
  - serializes compact `quads` and `triangles`
  - optionally emits `runtime_world.debug.json`
- Renderer:
  - does not inspect voxel neighbors or wedge orientation
  - assumes the artifact already respects the contract
  - uses backface culling with CCW front faces

## Build and run

```bash
make preprocess
make run
```
