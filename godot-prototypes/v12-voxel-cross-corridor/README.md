# V12 Voxel Cross Corridor

Prototipo Godot mínimo en primera persona que carga un mapa voxel 3D por capas en formato compacto, lo expande a un grid explícito en memoria, genera una `ArrayMesh` procedural con múltiples surfaces por material y crea colisión jugable a partir de cajas fusionadas.

## Formato del mapa

El fichero [maps/cross_cube_map.txt](maps/cross_cube_map.txt) usa:

- `SIZE <x> <y> <z>`
- `VOXEL <size>`
- `EMPTY_LAYERS a b`
- `LAYER n`
- `LAYER n REPEAT k`
- `EMPTY_ROWS a b`
- `ROW z RAW <string>`
- `ROW z RLE <runs>`

En runtime todo eso se expande a un grid voxel completo en memoria.

## Tipos de voxel

- `0`: vacío
- `1`: sólido gris
- `G`: sólido verde
- `P`: sólido púrpura
- `=`: sólido metal

## Pipeline

- parseo del formato compacto por capas
- expansión a grid explícito en `PackedByteArray`
- detección de caras exteriores
- agrupación de caras por `material_key`
- una `surface` por material en la `ArrayMesh`
- colisión separada con cajas fusionadas `BoxShape3D`

## Ejecutar

```bash
make run-v12-voxel
```
