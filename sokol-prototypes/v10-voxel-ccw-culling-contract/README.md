# V10 Voxel CCW Culling Contract

`v10` freezes the cube/voxel contract before wedges.

## Source map

- Uses the same compact source map as `v9`
- Source map path:
  - `godot-prototypes/v12-voxel-cross-corridor/maps/cross_cube_map.txt`

## Contract

- Every exterior cube face must satisfy:
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

## Responsibilities

- Preprocess:
  - decides cube face visibility from voxel neighbors
  - emits only exterior faces
  - serializes quads that already follow the CCW contract
- Renderer:
  - does not inspect voxel neighbors
  - assumes the artifact already respects the contract
  - uses backface culling with CCW front faces

## Build and run

```bash
make preprocess
make run
```
