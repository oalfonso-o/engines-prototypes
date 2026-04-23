# Scene Unification Defaults

## Purpose

Este documento cierra las decisiones que en el plan anterior todavía estaban abiertas.

Objetivo: si apruebas estas defaults, la implementación ya puede avanzar casi sin interpretación adicional, salvo detalles menores de UX visual.

Base real usada para proponer esto:

- [editorTypes.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/domain/editorTypes.ts)
- [MapEditorWorkspace.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/workspaces/map/MapEditorWorkspace.ts)
- [LevelWorkspace.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/workspaces/level/LevelWorkspace.ts)
- [coreDerivedManifest.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/content/coreDerivedManifest.ts)
- [buildLevel.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/level/buildLevel.ts)

## Decision Summary

### 1. Scene schema

**Options**

- separar arrays por tipo: `tileLayers`, `collisionLayers`, `objectLayers`
- una sola lista de layers tipadas
- modelo híbrido simple para v1

**Default**

- una sola lista ordenada de layers tipadas

**Why**

- resuelve orden visual y reordenación sin inventar un segundo sistema de `zIndex`
- encaja mejor con el UI de `Layers`
- evita que el modelo quede partido otra vez por categorías artificiales

**Trade-off**

- el código de render y edición tiene que filtrar por tipo de layer
- a cambio, el modelo queda más limpio y más cercano a cómo piensa el usuario

## Proposed SceneDefinition v1

```ts
type SceneLayerRecord =
  | SceneBackgroundLayer
  | SceneTileLayer
  | SceneCollisionLayer
  | SceneObjectLayer;

interface SceneDefinition extends AssetBaseRecord {
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  defaultPlayerCharacterId: string | null;
  layers: SceneLayerRecord[];
}
```

## Layer defaults

```ts
interface SceneLayerBase {
  id: string;
  name: string;
  kind: "background" | "tiles" | "collision" | "objects";
  visible: boolean;
  locked: boolean;
}
```

## 2. Background/parallax model

**Options**

- background fuera de `scene`
- `backgroundLayers` aparte
- background como un tipo de layer más

**Default**

- background como `kind: "background"` dentro de `layers`

**Why**

- mantiene una única fuente de verdad para todo lo visible en la escena
- encaja con biome packs actuales, donde hay varias capas parallax
- evita meter otra estructura paralela fuera de `layers`

**Trade-off**

- el renderer de `SceneWorkspace` tendrá una rama especial para layers no grid

**Default shape**

```ts
interface SceneBackgroundLayer extends SceneLayerBase {
  kind: "background";
  assetId: string;
  parallaxX: number;
  parallaxY: number;
  fitMode: "cover" | "contain" | "repeat";
  offsetX: number;
  offsetY: number;
}
```

## 3. Tile layer model

**Options**

- lista de celdas con `tilesetId + tileId`
- chunks/atlas más optimizados desde el principio
- tiles por layer con tileset fijo

**Default**

- lista de celdas con `tilesetId + tileId`

**Why**

- es exactamente como ya funciona `MapDefinition`
- simplifica migración desde `map.cells`
- no bloquea múltiples tilesets por layer

**Trade-off**

- menos eficiente que un formato chunked
- pero suficiente para el tamaño actual del proyecto

**Default shape**

```ts
interface SceneTileCellRecord {
  x: number;
  y: number;
  tilesetId: string;
  tileId: string;
}

interface SceneTileLayer extends SceneLayerBase {
  kind: "tiles";
  cells: SceneTileCellRecord[];
}
```

## 4. Multiple tilesets support

**Options**

- whitelist global de tilesets por escena
- whitelist por layer
- ningún whitelist: cualquier tileset activo puede usarse

**Default**

- ningún whitelist en v1

**Why**

- es lo más simple para implementar y para usar
- encaja con lo que pediste: selector de tilesets y pintar directamente
- las dependencias se pueden inferir de las celdas usadas

**Trade-off**

- menos control editorial por biome
- pero eso se puede resolver después con favoritos o filtros, no hace falta meterlo en el schema

**Consequence**

- `Tiles` tab muestra todos los tilesets activos
- dependencias de la escena se calculan a partir de lo realmente usado

## 5. Collision model

**Options**

- seguir con segmentos (`groundSegments`, `floatingPlatforms`, `waterStrips`)
- celdas booleanas
- celdas tipadas por kind

**Default**

- celdas tipadas por kind

**Why**

- es lo más natural para edición en grid
- permite abandonar la duplicidad actual `map cells` vs `level segments`
- soporta `solid`, `one-way`, `water`, `hazard` sin inventar otro sistema

**Trade-off**

- el runtime tendrá que derivar colliders agrupando celdas contiguas
- eso añade una fase de compilación/runtime, pero es mejor que editar segmentos a mano

**Default shape**

```ts
type CollisionKind = "solid" | "one-way" | "water" | "hazard";

interface SceneCollisionCellRecord {
  x: number;
  y: number;
}

interface SceneCollisionLayer extends SceneLayerBase {
  kind: "collision";
  collisionKind: CollisionKind;
  cells: SceneCollisionCellRecord[];
}
```

**Important default**

- `trigger` no entra aquí
- `trigger` va en zonas/objetos, no en colisión

## 6. Objects and placements

**Options**

- objeto genérico con `params: Record<string, unknown>`
- union tipada por tipo
- sistema mixto

**Default**

- union tipada por tipo

**Why**

- reduce ambigüedad
- permite que `Properties` sepa exactamente qué inputs mostrar
- evita convertir toda la escena en un saco de `params`

**Trade-off**

- añadir tipos nuevos requiere tocar tipos y UI
- a cambio, el sistema sigue siendo legible y seguro

**Default shape**

```ts
type SceneObjectRecord =
  | PlayerSpawnObject
  | PickupObject
  | EnemySpawnObject
  | BossSpawnObject
  | PropObject
  | ZoneObject;
```

### Player spawn

```ts
interface PlayerSpawnObject {
  id: string;
  type: "player-spawn";
  x: number;
  y: number;
}
```

### Pickup

```ts
interface PickupObject {
  id: string;
  type: "pickup";
  assetId: string;
  x: number;
  y: number;
}
```

### Enemy spawn

```ts
interface EnemySpawnObject {
  id: string;
  type: "enemy-spawn";
  assetId: string;
  x: number;
  y: number;
  facing: "left" | "right";
  patrolRadius: number;
}
```

### Boss spawn

```ts
interface BossSpawnObject {
  id: string;
  type: "boss-spawn";
  assetId: string;
  x: number;
  y: number;
  facing: "left" | "right";
}
```

### Prop

```ts
interface PropObject {
  id: string;
  type: "prop";
  assetId: string;
  x: number;
  y: number;
}
```

### Zone

```ts
type ZoneKind = "kill" | "checkpoint" | "camera" | "trigger";

interface ZoneObject {
  id: string;
  type: "zone";
  zoneKind: ZoneKind;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## 7. Trigger/zone geometry

**Options**

- point
- rect
- polygon
- tile-painted masks

**Default**

- axis-aligned rectangle

**Why**

- suficiente para plataforma 2D
- fácil de editar en grid
- fácil de serializar
- fácil de renderizar en overlay

**Trade-off**

- menos flexible que polígonos
- pero no merece la complejidad ahora

**Default**

- spawns son puntos
- zones son rectángulos

## 8. Runtime migration strategy

**Options**

- runtime consume `scene` directamente desde el minuto uno
- adaptador `scene -> runtimeContent` temporal
- convivencia indefinida entre `map/level` y `scene`

**Default**

- adaptador temporal `scene -> runtimeContent`

**Why**

- minimiza riesgo
- mantiene estable `CampaignScene`, `buildLevel`, `CoinField` y demás mientras el editor cambia
- permite migrar el contenido core poco a poco

**Trade-off**

- durante una fase habrá dos representaciones
- pero el adaptador tendrá un destino claro y temporal

**Consequence**

Fase 1:

- editor produce `SceneDefinition`
- runtimeContent se deriva desde `scene`

Fase 2:

- runtime deja de depender del formato heredado y consume `scene` o una compilación directa de `scene`

## 9. Editor UX defaults

**Options**

- controles complejos estilo DCC desde el principio
- controles mínimos tipo mapa 2D
- mezcla de ambos

**Default**

- controles mínimos tipo editor 2D

**Why**

- reduces superficie de bugs
- da valor rápido
- encaja con el estado actual del prototipo

**Default interactions**

- `wheel`: zoom in/out centrado en cursor
- `middle mouse drag`: pan
- alternativa teclado: `space + left drag` también hace pan
- `left click`: aplica la tool activa
- `left drag`: pinta de forma continua
- `right click`: erase temporal solo para tile painting

**Workspace**

- sin card interior
- sin rectángulo enmarcado
- la escena ocupa todo el espacio disponible
- grid overlay opcional

**Properties tabs for Scene**

- `Properties`
- `Layers`
- `Tiles`
- `Objects`

No metería `Dependencies` y `Used By` como tabs de primera línea para `Scene`. Esas dos las dejaría:

- dentro de un bloque de `Properties`
- o como secondary view futura

Razón:

- el trabajo principal de una escena es editar capas y objetos, no navegar referencias

## 10. Scene defaults for v1 implementation

Si hubiese que cerrar una v1 exacta, sería esta:

### Included in v1

- `SceneDefinition`
- `background` layers
- `tiles` layers
- `collision` layers con `solid`, `one-way`, `water`, `hazard`
- `objects` layers con:
  - `player-spawn`
  - `pickup`
  - `enemy-spawn`
  - `boss-spawn`
  - `prop`
  - `zone`
- `SceneWorkspace` read-only
- zoom + pan
- selección de layer activa
- tab `Tiles`
- tab `Objects`
- adaptador `scene -> runtimeContent`

### Deferred to v2

- polygon zones
- scripts arbitrarios en objetos
- brush shapes avanzados
- flood fill
- autotiling
- multi-select
- copy/paste
- timeline de animación de scene
- reglas de biome/palette locking

## 11. Migration defaults

### Current core swamp migration

Default exact migration:

1. `map.cells` -> layer `tiles/base`
2. `map.collisionCells` -> layer `collision/solid`
3. `level.spawnX/Y` -> object `player-spawn`
4. `level.placements` -> layer `objects/pickups`
5. `groundSegments`, `floatingPlatforms`, `waterStrips` dejan de ser fuente de verdad
6. durante transición, el adaptador puede derivar esos segmentos desde las collision layers si el runtime aún los necesita

### Important rule

No mantendría `groundSegments`, `floatingPlatforms` y `waterStrips` dentro de `SceneDefinition`.

Razón:

- si los metemos también, repetimos el mismo error de ahora
- `Scene` tiene que ser la fuente de verdad, no otro duplicado

## 12. What becomes deterministic if you approve this

Si apruebas estas defaults, ya quedan cerradas casi todas las decisiones de diseño relevantes:

- schema
- layers
- backgrounds
- collisions
- objects
- zones
- editor tabs
- viewport controls
- runtime migration strategy

Lo que quedaría abierto después sería ya mucho más táctico:

- naming exacto de algunos tipos
- copy e i18n
- estilo visual final del `SceneWorkspace`
- orden exacto de fases de implementación

## Recommended final default

La propuesta que yo implementaría en este repo es:

- `SceneDefinition` con una sola lista ordenada de layers tipadas
- backgrounds como layers de tipo `background`
- tiles como celdas `tilesetId + tileId`
- collisions como celdas tipadas
- objects como union tipada
- zones rectangulares
- cualquier tileset activo seleccionable sin whitelist
- `SceneWorkspace` con zoom/pan y sin marco interior
- adaptador temporal `scene -> runtimeContent`
- eliminación progresiva de `map + level` como tipos principales

Esa combinación es la que mejor equilibra:

- simplicidad de implementación
- continuidad con el código actual
- capacidad de crecer sin rehacer el modelo en dos semanas
