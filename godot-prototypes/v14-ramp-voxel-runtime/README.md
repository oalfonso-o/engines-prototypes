# V14 Ramp Voxel Runtime

`V14` mantiene el pipeline offline + runtime preprocesado de `V13`, pero añade 8 tipos explícitos de rampa/cuña declarados por char en el mapa fuente.

## Ramp chars

- `A`: floor +X
- `B`: floor -X
- `C`: floor +Z
- `D`: floor -Z
- `U`: ceil +X
- `V`: ceil -X
- `W`: ceil +Z
- `X`: ceil -Z

## Source of truth

- `maps/cross_cube_map.txt`

## Preprocesado

```bash
python3 godot-prototypes/v14-ramp-voxel-runtime/tools/preprocess_runtime.py
```

Genera:

- `data/runtime_world.json`

## Runtime

Godot carga el artefacto preprocesado y reconstruye:

- quads por material
- triángulos por material
- colisión desde cajas ya precomputadas

## Ejecutar

```bash
make run-v14-voxel
```
