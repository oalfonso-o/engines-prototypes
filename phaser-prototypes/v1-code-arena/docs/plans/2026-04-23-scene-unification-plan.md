# Scene Unification Plan

## Summary

La división actual entre `Map` y `Level` no está ayudando. Hoy ya existe una duplicidad clara:

- `MapDefinition` guarda la rejilla visual (`cells`) y una rejilla de colisión (`collisionCells`).
- `LevelCompositionRecord` guarda `mapId`, `playerCharacterId`, `spawnX/Y`, `groundSegments`, `floatingPlatforms`, `waterStrips` y `placements`.
- El seed core de `Swamp` genera `map.cells` directamente desde `SETTINGS.level.ground_segments`, `floating_platforms` y `water_strips`.
- El runtime de juego (`buildLevel.ts`) ignora `map.cells` y vuelve a construir el escenario desde `groundSegments`, `floatingPlatforms` y `waterStrips`.

Resultado: el editor enseña una cosa, el runtime monta otra, y ambas salen del mismo origen lógico con dos formatos distintos.

La propuesta correcta es converger hacia una sola entidad de escena: `SceneDefinition`.

## Diagnosis Of The Current Split

### What `Map` is really doing today

`MapDefinition` no es solo un “mapa decorativo”. Ya contiene:

- tamaño de grid
- tamaño de tile
- fit mode
- tiles pintados
- celdas de colisión

Eso ya es media escena.

### What `Level` is really doing today

`LevelCompositionRecord` no es una escena completa tampoco. Hoy hace de contenedor de:

- referencia al mapa
- spawn del jugador
- layout jugable redundante (`groundSegments`, `floatingPlatforms`, `waterStrips`)
- placements de pickups

Eso es la otra media escena.

### Why the preview feels wrong

El preview del `Map` sí pinta tiles y sí superpone colisiones. No está enseñando “solo colisiones”.

Lo que pasa es esto:

1. Los tiles sembrados en `buildMapCells()` salen del mismo layout jugable que las colisiones.
2. Luego `collisionCells` se dibuja encima con overlay rosa.
3. Como la escena core solo contiene suelo, plataformas y agua, visualmente parece que todo es “la capa de colisión”.

Así que el problema no es solo visual. El problema es de modelo de datos.

## Target Model

## New Asset Type

Crear un nuevo tipo derivado:

```ts
type DerivedAssetType =
  | "tileset"
  | "spritesheet"
  | "animation"
  | "character"
  | "scene";
```

`Map` y `Level` pasarían a ser legacy/transitional durante la migración, no tipos principales del sistema.

## SceneDefinition

Primera versión pragmática:

```ts
interface SceneDefinition extends AssetBaseRecord {
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;

  tileLayers: SceneTileLayerRecord[];
  collisionLayers: SceneCollisionLayerRecord[];
  objectLayers: SceneObjectLayerRecord[];

  playerSpawn: SceneSpawnRecord | null;
  defaultPlayerCharacterId: string | null;
}
```

Tipos internos:

```ts
interface SceneTileLayerRecord {
  id: string;
  name: string;
  tilesetIds: string[];
  visible: boolean;
  locked: boolean;
  zIndex: number;
  cells: Array<{
    x: number;
    y: number;
    tilesetId: string;
    tileId: string;
  }>;
}

interface SceneCollisionLayerRecord {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  kind: "solid" | "one-way" | "water" | "hazard" | "trigger";
  cells: Array<{
    x: number;
    y: number;
    value?: string | null;
  }>;
}

interface SceneObjectLayerRecord {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  placements: ScenePlacementRecord[];
}

interface ScenePlacementRecord {
  id: string;
  type:
    | "player-spawn"
    | "enemy-spawn"
    | "boss-spawn"
    | "pickup"
    | "prop"
    | "trigger"
    | "zone";
  assetId: string | null;
  x: number;
  y: number;
  params: Record<string, string | number | boolean | null>;
}
```

## Why this model is better

- Los tiles viven en la escena.
- Las colisiones viven en la escena.
- Los spawns viven en la escena.
- Los pickups viven en la escena.
- Los enemigos futuros viven en la escena.
- Las zonas de trigger viven en la escena.
- El runtime consume una sola fuente de verdad.

Eso elimina la división artificial `map visual` vs `level jugable`.

## Editor Structure

## Shell Naming

- izquierda: `Explorer`
- centro: `Workspace`
- derecha: `Properties`

Esto se mantiene.

## Workspace For Scene

El `Workspace` de `Scene` tiene que quedarse limpio:

- sin card/borde interior grande
- sin el rectángulo enmarcado actual
- sin formularios laterales
- solo superficie de edición

Herramientas mínimas del viewport:

- `zoom in`
- `zoom out`
- `fit scene`
- `reset zoom`
- `pan` con arrastre

Estado del viewport:

- no se guarda en el asset
- sí se puede guardar en `localStorage` por `sceneId`

## Properties For Scene

La derecha no debería mezclarlo todo en una sola tab. Propuesta:

### Header

Fila 1:

- `Properties`
- `Scene`
- estado
- archive icon

Fila 2:

- nombre de la escena

Fila 3:

- tabs principales

### Scene tabs

Para `Scene` propongo estas tabs:

1. `Properties`
2. `Layers`
3. `Tiles`
4. `Objects`
5. `Dependencies`
6. `Used By`

Como seis tabs no caben bien en una sola row estrecha, haría esto:

- mantener `Dependencies` y `Used By` como tabs globales solo para assets no-scene
- para `Scene`, sustituirlas por tabs de editor

O sea, `Scene` usaría:

1. `Properties`
2. `Layers`
3. `Tiles`
4. `Objects`

Y dentro de `Properties` habría un sub-bloque compacto con dependencias si hace falta.

## Properties tab contents

### `Properties`

- name
- grid size
- tile size
- fit mode
- default player character
- scene size summary

### `Layers`

- lista de capas
- visible / hidden
- locked / unlocked
- reorder
- add layer
- duplicate layer
- delete layer

### `Tiles`

- selector de tileset activo
- selector de tile
- brush mode
- erase mode
- future flood fill / rectangle fill

### `Objects`

- tool activa: `spawn`, `pickup`, `enemy`, `boss`, `trigger`, `zone`
- asset activo para colocar
- inspector contextual del placement seleccionado

## Runtime Consequences

## What must stop existing

El runtime no debería volver a reconstruir suelo/plataformas/agua desde `groundSegments`, `floatingPlatforms` y `waterStrips`.

Eso hoy está en:

- [buildLevel.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/level/buildLevel.ts)
- [runtimeContent.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/content/runtimeContent.ts)

Eso debe pasar a salir de `SceneDefinition`.

## Runtime target

El runtime de campaña debería cargar:

- tile layers renderizables
- collision layers interpretables
- placements
- spawn del jugador

Y luego derivar:

- colliders sólidos
- one-way platforms
- water/hazard regions
- coins / pickups
- enemy spawns

## Migration Strategy

## Phase 0: Keep shipping while introducing `scene`

No borrar `map` ni `level` todavía.

Hacer `scene` paralelo y adaptadores:

- `map + level -> scene`
- runtime puede seguir leyendo legacy mientras el editor empieza a producir `scene`

## Phase 1: Add SceneDefinition

Archivos a tocar:

- [editorTypes.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/domain/editorTypes.ts)
- `assetReferences.ts`
- `editorDb.ts`
- `editorRepository.ts`
- `EditorStore.ts`
- `EditorRouter.ts`
- `openAssetSelection.ts`
- `buildGameAssetRows.ts`

Resultado:

- nuevo asset type `scene`
- nueva route `#scene/:id`
- persistencia en DB

## Phase 2: Build a Scene workspace

Crear:

- `src/editor/workspaces/scene/SceneWorkspace.ts`
- `src/editor/workspaces/scene/sceneCanvas.ts`
- `src/editor/workspaces/scene/sceneViewportState.ts`

Objetivo:

- canvas limpio
- sin card interior
- pan + zoom
- overlay de grid
- render de tile layers
- overlay opcional de collision layers

## Phase 3: Make Properties scene-aware

Extender `PropertiesPanel` para que la `Workspace` de scene contribuya:

- `Properties`
- `Layers`
- `Tiles`
- `Objects`

La tab `Tiles` actual de `Map` es el primer embrión de esto.

## Phase 4: Migrate current core swamp content

Hoy el core swamp se reparte entre:

- `MapDefinition` con `cells + collisionCells`
- `LevelCompositionRecord` con `spawn + placements + layout segments`

La migración correcta es:

1. crear `SceneDefinition scene-swamp-campaign-v1`
2. copiar `cells` a `tileLayers[0]`
3. convertir `collisionCells` a `collisionLayers[0]`
4. convertir spawn del player a `playerSpawn`
5. convertir placements de coin a `objectLayers[0].placements`
6. convertir `groundSegments / floatingPlatforms / waterStrips` en información derivada o directamente eliminarlos

Importante:

- `groundSegments`, `floatingPlatforms` y `waterStrips` no deberían sobrevivir como fuente principal
- si hacen falta para transición, se regeneran desde las capas de colisión, no al revés

## Phase 5: Move runtime to scene

Objetivo:

- `CampaignScene` carga `SceneDefinition`
- `buildLevel.ts` deja de recibir `groundSegments/floatingPlatforms/waterStrips`
- colisión y render salen de scene layers

En este punto `map` y `level` pueden quedar como legacy readers o desaparecer.

## Phase 6: Remove legacy split

Cuando `scene` ya cubra runtime + editor:

- quitar `MapDefinition` del flujo principal
- quitar `LevelCompositionRecord` del flujo principal
- mantener migrador de datos legacy si hace falta

## Editing Roadmap Inside Scene

Orden pragmático:

1. `Scene` read-only preview
2. pan + zoom
3. pintar tiles sobre una sola capa
4. múltiples tilesets en la misma escena
5. capas múltiples
6. edición de colisiones por tipo
7. player spawn
8. pickups
9. enemy/boss spawns
10. triggers y zonas

## First Concrete Scope I Recommend

La primera iteración que sí atacaría ya en código es esta:

1. introducir `scene` como asset nuevo
2. generar una `scene` core para swamp
3. crear `SceneWorkspace` read-only con pan/zoom
4. enseñar tile layers + collision overlay toggle
5. mover `CampaignScene` a leer `scene`

Todavía no pintaría enemigos ni tools complejas. Primero hay que conseguir una sola fuente de verdad.

## Decision

Sí, tiene sentido fusionar `map` y `level`.

No solo por UX del editor. También porque hoy el modelo de datos ya está duplicando la misma escena en dos representaciones distintas, y eso va a seguir generando confusión y deuda cada vez que añadamos:

- enemigos
- bosses
- pickups nuevos
- triggers
- zonas
- tipos de colisión
- múltiples tilesets
- zoom/pan y edición real

La entidad correcta para avanzar es `Scene`.
