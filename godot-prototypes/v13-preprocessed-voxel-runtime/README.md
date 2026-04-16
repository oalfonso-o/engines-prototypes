# V13 Preprocessed Voxel Runtime

`V13` carga un artefacto runtime preprocesado offline en vez de parsear el mapa voxel `.txt` en el arranque.

## Source of truth

- mapa editable: `../v12-voxel-cross-corridor/maps/cross_cube_map.txt`

## Preprocesado

Script:

- `tools/preprocess_runtime.py`

Ejecutar:

```bash
python3 godot-prototypes/v13-preprocessed-voxel-runtime/tools/preprocess_runtime.py
```

Genera:

- `data/runtime_world.json`

## Runtime

Godot carga `data/runtime_world.json` y:

- reconstruye la `ArrayMesh` desde quads ya fusionados por material
- crea una `surface` por material
- reconstruye colisión desde cajas ya fusionadas

No hace en runtime:

- parseo del `.txt`
- expansión voxel completa
- detección de caras visibles
- fusión de quads
- merge de cajas de colisión

## Ejecutar

```bash
make run-v13-voxel
```
