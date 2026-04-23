# Scene Graph Runtime Plan

## Purpose

Este documento extiende el plan de `SceneDefinition` con la parte que faltaba:

- cómo una escena se vincula al juego real
- cómo se enlazan escenas entre sí
- cómo modelar acciones de transición y triggers
- cómo cargar todo esto en Phaser desde la base de datos

Base real usada para aterrizar la propuesta:

- [editorTypes.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/domain/editorTypes.ts)
- [editorRepository.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/storage/editorRepository.ts)
- [runtimeContent.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/content/runtimeContent.ts)
- [CampaignScene.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/scenes/CampaignScene.ts)
- [buildLevel.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/level/buildLevel.ts)
- [2026-04-23-scene-unification-defaults.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/docs/plans/2026-04-23-scene-unification-defaults.md)

## Core Idea

`SceneDefinition` no debería ser el asset raíz del juego.

Si queremos un juego modular y 100% dirigido por datos, necesitamos un asset raíz que diga:

- qué escena arranca primero
- con qué personaje arrancas
- qué flags o estado global existen
- qué escenas forman parte del juego

La propuesta por defecto es:

- `GameDefinition` como asset raíz del juego
- `SceneDefinition` como asset jugable principal
- `ActionDefinition` como asset reutilizable para lógica disparada por triggers/zonas/objetos

## Proposed Asset Graph

```ts
interface GameDefinition extends AssetBaseRecord {
  entrySceneId: string;
  entryPointId: string | null;
  defaultPlayerCharacterId: string | null;
  initialFlags: GameFlagRecord[];
}

interface SceneDefinition extends AssetBaseRecord {
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  defaultPlayerCharacterId: string | null;
  layers: SceneLayerRecord[];
}

interface ActionDefinition extends AssetBaseRecord {
  kind: "scene-transition" | "set-flag" | "sequence" | "conditional";
}
```

### Why this split

- `GameDefinition` resuelve el arranque del juego sin hardcodear un `mapId` en TypeScript.
- `SceneDefinition` se centra en describir una pantalla jugable concreta.
- `ActionDefinition` evita meter lógica arbitraria suelta dentro de cada escena y nos deja reutilizar acciones.

## Default Runtime Root

La mejor default para este proyecto es `GameDefinition`, no `WorldDefinition`.

### Why

- hoy el runtime ya está hardcodeado como una sola campaña
- el salto natural no es “múltiples mundos” todavía, sino “un juego data-driven”
- `GameDefinition` puede arrancar una escena y más tarde agrupar mundos sin rehacer el runtime

### Trade-off

- si más adelante quieres una capa explícita de `WorldDefinition`, se añade encima de `SceneDefinition`
- pero no hace falta meter dos assets raíz ahora

## Scene Links

Para que una escena pueda enlazar a otra, hacen falta dos conceptos:

- puntos de entrada dentro de una escena
- acciones que disparen una transición

La propuesta por defecto es:

- los puntos de entrada viven dentro de la propia escena como objetos de tipo `entry-point`
- las zonas/objetos disparadores referencian un `ActionDefinition`
- la transición de escena la describe una `ActionDefinition` de tipo `scene-transition`

## Proposed Scene Objects

```ts
type SceneObjectRecord =
  | SceneEntryPointObject
  | ScenePlayerSpawnObject
  | ScenePickupObject
  | SceneEnemySpawnObject
  | SceneBossSpawnObject
  | ScenePropObject
  | SceneTriggerZoneObject;

interface SceneEntryPointObject {
  id: string;
  type: "entry-point";
  name: string;
  x: number;
  y: number;
}

interface SceneTriggerZoneObject {
  id: string;
  type: "trigger-zone";
  x: number;
  y: number;
  width: number;
  height: number;
  triggerMode: "overlap" | "interact";
  actionId: string;
}
```

### Default decision

- `player-spawn` y `entry-point` no son exactamente lo mismo
- pero en v1 pueden convivir
- la regla práctica sería:
  - `player-spawn` marca el spawn por defecto de la escena
  - `entry-point` marca destinos nombrados para transiciones entrantes

Esto evita hacks tipo “teletransportar al spawn general aunque entres por una puerta lateral”.

## Proposed Actions

La default más útil es empezar con un sistema pequeño pero tipado.

```ts
type ActionDefinition =
  | SceneTransitionAction
  | SetFlagAction
  | SequenceAction
  | ConditionalAction;

interface SceneTransitionAction extends AssetBaseRecord {
  kind: "scene-transition";
  targetSceneId: string;
  targetEntryPointId: string | null;
  transitionStyle: "none" | "fade";
}

interface SetFlagAction extends AssetBaseRecord {
  kind: "set-flag";
  flag: string;
  value: boolean | number | string;
}

interface SequenceAction extends AssetBaseRecord {
  kind: "sequence";
  actionIds: string[];
}

interface ConditionalAction extends AssetBaseRecord {
  kind: "conditional";
  flag: string;
  equals: boolean | number | string;
  thenActionId: string;
  elseActionId: string | null;
}
```

## Why actions should be separate assets

**Options**

- meter las acciones inline dentro del trigger
- hacerlas assets separadas

**Default**

- assets separadas

**Why**

- encaja con tu idea de que todo sea entidad en DB
- hace visibles las dependencias entre escenas y lógica
- permite reutilizar acciones
- abre la puerta a secuencias y condiciones sin convertir cada trigger en un JSON enorme

**Trade-off**

- crea más assets
- pero eso es asumible y es coherente con el editor que ya estás montando

## Runtime Model In Phaser

La mejor forma de materializar esto en Phaser no es crear una clase Phaser por cada escena de contenido.

La mejor default es:

- una sola clase runtime, algo como `GameplayScene`
- esa clase carga dinámicamente un `SceneDefinition` por `sceneId`
- cuando cambia de escena, destruye el runtime actual y monta el nuevo

## Why a single GameplayScene is better

- evita registrar 200 escenas Phaser distintas
- simplifica transición y persistencia de estado
- encaja con que las escenas de juego son datos, no clases

## Proposed Runtime Services

### 1. `loadRuntimeGame(gameId)`

Sustituye el modelo actual de `loadRuntimeContent()` que devuelve una sola campaña cerrada.

```ts
interface RuntimeGameCatalog {
  game: GameDefinition;
  scenes: Map<string, SceneDefinition>;
  actions: Map<string, ActionDefinition>;
  textures: RuntimeTextureSource[];
  animations: RuntimeAnimationSource[];
}
```

Responsabilidad:

- leer DB
- resolver `gameId`
- cargar escenas y acciones referenciadas
- construir catálogo de texturas y animaciones necesarias

### 2. `SceneCompiler`

Convierte `SceneDefinition` en una representación runtime lista para Phaser.

```ts
interface CompiledSceneRuntime {
  sceneId: string;
  tileLayers: CompiledTileLayer[];
  collisionRects: CompiledCollisionRect[];
  backgroundLayers: CompiledBackgroundLayer[];
  objects: CompiledSceneObject[];
  defaultSpawn: { x: number; y: number } | null;
  entryPoints: Map<string, { x: number; y: number }>;
}
```

Responsabilidad:

- agrupar celdas de colisión en rectángulos útiles para Arcade Physics
- resolver tiles y fondos
- dejar los entry points listos

### 3. `SceneRuntimeController`

Responsabilidad:

- montar y desmontar una escena dentro de `GameplayScene`
- crear render de tiles, colliders, pickups, enemigos y triggers
- exponer `transitionToScene(targetSceneId, targetEntryPointId)`

### 4. `ActionExecutor`

Responsabilidad:

- ejecutar `ActionDefinition`
- soportar `scene-transition`, `set-flag`, `sequence`, `conditional`

### 5. `GameStateStore`

Responsabilidad:

- mantener flags globales
- mantener estado persistente por escena
- recordar qué pickups ya se recogieron o qué triggers ya se dispararon

## Default Transition Flow

Flujo por defecto cuando el jugador toca una zona que cambia de escena:

1. El jugador entra en overlap con un `trigger-zone`.
2. El `trigger-zone` referencia un `actionId`.
3. `ActionExecutor` lee esa acción de la DB cargada en memoria.
4. Si la acción es `scene-transition`, se resuelve `targetSceneId + targetEntryPointId`.
5. `SceneRuntimeController` desmonta la escena actual.
6. Se compila o recupera de caché la escena destino.
7. El jugador reaparece en el `entry-point` indicado.
8. `GameplayScene` sigue viva; solo cambia el contenido montado.

## What the game boots with

La propuesta por defecto es que el juego arranque con un `gameId`, no con un `sceneId`.

### Why

- el punto de entrada es responsabilidad del juego, no de una escena suelta
- permite cambiar la escena inicial sin tocar TypeScript
- permite tener varios juegos/campañas dentro de la misma DB si algún día hace falta

## Suggested Runtime Signature

```ts
interface RuntimeBootRequest {
  gameId: string;
}
```

Y luego:

```ts
const catalog = await loadRuntimeGame(gameId);
const entrySceneId = catalog.game.entrySceneId;
const entryPointId = catalog.game.entryPointId;
```

## How this maps to the current code

### Today

- `runtimeContent.ts` devuelve una sola `campaign`
- `CampaignScene` recibe `RuntimeCampaignContent`
- `buildLevel.ts` recompone suelo/plataformas/agua desde segmentos

### Target

- `runtimeContent.ts` pasa a devolver un `RuntimeGameCatalog`
- `CampaignScene` pasa a ser `GameplayScene`
- `buildLevel.ts` se sustituye por algo como `buildSceneRuntime.ts`
- el runtime deja de depender de `groundSegments`, `floatingPlatforms` y `waterStrips`

## Minimal Migration Path

### Phase 1

- crear `SceneDefinition`
- convertir `Map + Level` actuales a `SceneDefinition`
- crear `GameDefinition` apuntando a la escena principal
- seguir sin transiciones entre escenas

### Phase 2

- añadir `entry-point` objects
- añadir `trigger-zone` objects
- añadir `ActionDefinition` con `scene-transition`

### Phase 3

- añadir `GameStateStore`
- soportar flags y acciones condicionales
- persistir estado por escena

### Phase 4

- añadir enemy spawns
- añadir props/zonas avanzadas
- añadir tooling más fuerte en el editor

## Default Editor Consequences

Para que esto sea editable, el editor acabará necesitando estos assets nuevos:

- `Game`
- `Scene`
- `Action`

Y dentro de `Scene`:

- tab `Layers`
- tab `Tiles`
- tab `Objects`
- tab `Properties`

Dentro de `Objects`, una tool de `trigger-zone` tendría que permitir:

- dibujar rectángulo
- escoger `triggerMode`
- elegir `ActionDefinition`

Dentro de `Action`, una action de transición tendría que permitir:

- elegir escena destino
- elegir `entry-point` destino
- elegir estilo de transición

## Best Default For V1

Si tuviera que congelar una versión mínima pero correcta para implementar, sería esta:

- `GameDefinition` con `entrySceneId`
- `SceneDefinition` como asset principal jugable
- `ActionDefinition` separada
- `entry-point` y `trigger-zone` como objetos de escena
- una sola `GameplayScene` en Phaser
- `ActionExecutor` mínimo con solo `scene-transition`

Eso ya te da:

- una escena inicial definida en DB
- transiciones entre escenas definidas en DB
- entry points definidos en DB
- runtime modular y sin hardcodear la campaña en TypeScript

## Recommended Next Planning Step

El siguiente paso correcto ya no es otro documento conceptual general.

El siguiente paso correcto es cerrar un `schema v1` exacto para:

- `GameDefinition`
- `SceneDefinition`
- `ActionDefinition`
- `SceneObjectRecord`

Y después hacer un plan de migración de stores:

- `maps` -> legacy
- `levelCompositions` -> legacy
- `scenes` -> nuevo store principal
- `games` -> nuevo store raíz
- `actions` -> nuevo store de lógica
