# Python Iso Prototype

Segundo corte del MVP técnico jugable en PyGame para validar:

- mapa isométrico 2D leído desde TXT
- alturas enteras por tile
- rampas direccionales
- colisión continua derivada de la lógica de terreno
- movimiento libre continuo + salto simple
- mapa inicial con layout más claro tipo LoL de tres líneas
- look oscuro con acentos neón

## Ejecutar

```bash
cd python-iso
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Tests

```bash
cd python-iso
source .venv/bin/activate
python -m unittest discover -s tests -v
```

Smoke test headless:

```bash
cd python-iso
source .venv/bin/activate
SDL_VIDEODRIVER=dummy python main.py --headless --frames 5
```

## Controles

- `WASD` o flechas: mover libremente en cualquier dirección
- `W`: arriba en pantalla, `S`: abajo en pantalla, `A/D`: izquierda/derecha en pantalla
- `Space`: salto simple para superar un desnivel de hasta 1 nivel sin rampa
- `R`: recargar el mapa desde los TXT
- `Esc`: salir

## Formato del mapa

El mapa vive en `maps/three_lanes/` y usa cuatro capas simples:

- `heights.txt`: enteros por tile
- `terrain.txt`: tipo visual / walkable
- `ramps.txt`: rampa direccional (`N`, `E`, `S`, `W`) o `.` si no hay
- `meta.txt`: spawn y marcadores

### `heights.txt`

Misma rejilla que el resto de capas. Cada número es la altura base del tile.

### `terrain.txt`

Tokens válidos:

- `x`: vacío / no walkable
- `g`: suelo normal
- `p`: lane/path
- `j`: jungle/plataforma
- `a`: base abajo-izquierda
- `b`: base arriba-derecha

### `ramps.txt`

- `.`: sin rampa
- `N`: la rampa sube hacia el norte
- `E`: la rampa sube hacia el este
- `S`: la rampa sube hacia el sur
- `W`: la rampa sube hacia el oeste

La altura alta conectada por la rampa es `height + 1`.

### `meta.txt`

- `.`: nada especial
- `P`: spawn inicial del jugador

## Movimiento y colisión

- El jugador ya no se mueve tile a tile.
- La posición del jugador es continua en coordenadas de mundo.
- La hitbox es circular y coincide con la sombra del personaje sobre el suelo.
- El movimiento se resuelve con substeps y separación por ejes para permitir deslizamiento razonable contra bordes.
- La colisión se calcula comprobando la altura/terreno bajo el centro y varios samples alrededor de la circunferencia.
- La cámara recentra continuamente el mapa para mantener el cuerpo del jugador en el centro de pantalla.
- El grid sigue siendo la fuente de verdad para:
  - render
  - alturas
  - rampas
  - bloqueo

## Reglas del terreno

- mismo nivel: movimiento normal
- diferencia de altura de 1:
  - permitido si existe una rampa coherente
  - permitido con `Space` como salto simple
- diferencia mayor de 1: bloqueado
- tiles `x`: bloqueados

Sobre rampas:

- una rampa ocupa un tile normal con una dirección de subida
- dentro del tile, la altura efectiva se interpola de forma simple según la dirección de la rampa
- visualmente la rampa se mantiene como un tile plano con marcas direccionales para priorizar estabilidad del render
- eso permite subir y bajar de forma continua sin teletransporte entre casillas

## Forma del mapa

El mapa de ejemplo nuevo intenta leer visualmente como:

- base inferior izquierda
- base superior derecha
- top lane en L: tramo vertical izquierdo + tramo horizontal superior
- bot lane en L: tramo horizontal inferior + tramo vertical derecho
- lane central diagonal
- meseta central elevada integrada en la diagonal media
- varias rampas de acceso a la meseta

## Limitaciones actuales

- Sigue siendo un prototipo técnico sin combate, IA ni objetivos.
- La colisión continua usa samples discretos de una hitbox circular; es suficiente para este MVP, pero no pretende ser física avanzada.
- El salto no es un sistema de plataformas; solo abre pasos simples sobre desniveles de 1 nivel.

## Notas

- No hay geometría 3D real. Todo es 2D con proyección isométrica.
- Visual y colisión salen del mismo dataset.
- El render prioriza claridad y edición manual del mapa.
