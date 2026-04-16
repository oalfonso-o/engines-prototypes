# V12 Compact Layered Voxel Format

## Header

```txt
SIZE <x> <y> <z>
VOXEL <size_float>
```

## Layer directives

- `EMPTY_LAYERS a b`
- `LAYER n`
- `LAYER n REPEAT k`
- `EMPTY_ROWS a b`
- `ROW z RAW <string>`
- `ROW z RLE <runs>`

## Semantics

- `EMPTY_LAYERS a b`: layers `a..b` are fully empty
- `LAYER n`: starts the definition of layer `y = n`
- `LAYER n REPEAT k`: replicates the same layer definition across `k` consecutive layers starting at `n`
- `EMPTY_ROWS a b`: rows `z = a..b` are empty inside the current layer
- `ROW z RAW ...`: explicit row of length `SIZE.x`
- `ROW z RLE ...`: row encoded as comma-separated runs like `200:0,100:1,200:0`

## Runtime contract

- source of truth on disk: compact layered text format
- source of truth in memory: fully expanded voxel grid
- 1 voxel = 1 stored char
- runtime storage: `PackedByteArray` with ASCII bytes

## Voxel types

- `0`: empty
- `1`: solid gray
- `G`: solid green
- `P`: solid purple
- `=`: solid metal

Each voxel char maps to:

- `solid`
- `material_key`

## Visual pipeline

- expand compact format into full grid
- detect visible faces
- group visible faces by `material_key`
- generate one `ArrayMesh` surface per material

## Collision pipeline

- use the same expanded grid
- only check `solid`
- merge orthogonal solid runs into box colliders
- create `CollisionShape3D` with `BoxShape3D`
