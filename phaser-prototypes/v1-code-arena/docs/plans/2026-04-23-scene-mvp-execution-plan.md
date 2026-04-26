# Scene MVP Execution Plan

## Goal

Llegar, sin pasos ambiguos, a este MVP:

- desde el editor se puede crear una `Scene`
- desde el editor se puede crear una `Action` de tipo `scene-transition`
- desde el editor se puede poner un `trigger-zone` en una escena y asignarle esa `Action`
- el juego arranca leyendo un `GameDefinition` desde la base de datos
- al recargar el juego, Phaser consume esas definiciones desde DB
- cuando el jugador entra en el trigger, el juego cambia a la escena destino

Eso ya sería el primer MVP real de editor de videojuegos data-driven.

## Base Real

Este plan está aterrizado sobre el estado actual del proyecto:

- [editorTypes.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/domain/editorTypes.ts)
- [editorRepository.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/editor/storage/editorRepository.ts)
- [runtimeContent.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/content/runtimeContent.ts)
- [CampaignScene.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/scenes/CampaignScene.ts)
- [buildLevel.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/level/buildLevel.ts)
- [editor-shell.spec.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/tests/e2e/editor-shell.spec.ts)
- [2026-04-23-scene-unification-defaults.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/docs/plans/2026-04-23-scene-unification-defaults.md)
- [2026-04-23-scene-graph-runtime-plan.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/docs/plans/2026-04-23-scene-graph-runtime-plan.md)
- [2026-04-24-editor-authoring-backlog.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/docs/plans/2026-04-24-editor-authoring-backlog.md)

## Execution Rules

Estas reglas hacen que el plan sea ejecutable sin supervisión:

1. No empezar una fase nueva si la validación de la fase anterior no está verde.
2. Cada fase tiene que dejar el repo en estado arrancable.
3. Cada fase tiene que añadir o adaptar pruebas antes de apoyarse en el comportamiento nuevo.
4. No se borra `map` / `level` legacy hasta que `scene` ya cubra su caso real en runtime.
5. Si una fase obliga a reinterpretar el plan, la ejecución se detiene y se replantea. No se improvisa sobre la marcha.

## Validation Strategy

La validación se va a apoyar en cuatro niveles:

### A. Build gate

Siempre:

```bash
npm run build
```

### B. Editor e2e gate

Siempre:

```bash
npm run test:e2e
```

### C. Runtime e2e gate

Añadir una suite nueva:

- `tests/e2e/game-runtime.spec.ts`

No debe depender de mirar el canvas “a ojo”. Para que Playwright pueda validar cambios de escena sin fragilidad visual, el runtime tiene que exponer instrumentación de test.

### D. Minimal runtime instrumentation

Añadir una vía estable para que Playwright lea el estado del juego:

```ts
window.__CANUTER_RUNTIME__ = {
  gameId,
  sceneId,
  entryPointId,
  phase: "booting" | "running" | "transitioning",
};
```

Y además, si ayuda, un nodo DOM oculto con `data-testid`, algo como:

- `data-testid="runtime-debug-game-id"`
- `data-testid="runtime-debug-scene-id"`
- `data-testid="runtime-debug-entry-point-id"`

Esto no es para producto final. Es para poder verificar el MVP de forma determinista con Playwright.

## Phase 0: Test Harness For Scene Runtime

## Goal

Preparar validación real para el runtime scene-based antes del refactor gordo.

## Changes

- añadir la instrumentación runtime de `gameId / sceneId / entryPointId / phase`
- crear `tests/e2e/game-runtime.spec.ts`
- cubrir la carga actual del juego de forma básica para dejar un baseline

## Deliverables

- Playwright puede abrir `/`
- Playwright puede leer el runtime boot actual
- existe un sitio único para inspeccionar el estado runtime sin depender de pixeles del canvas

## Validation

```bash
npm run build
npm run test:e2e
```

Nuevas pruebas mínimas:

- el juego arranca y expone runtime debug state
- el runtime entra en estado `running`

## Exit Criteria

- Playwright puede afirmar en tests qué escena runtime está activa
- no depende de screenshot manual para saber si hubo cambio de escena

## Why first

Sin esto, las fases finales quedarían demasiado basadas en juicio visual.

## Phase 1: Add New Stores And Types Without Breaking Legacy

## Goal

Introducir el nuevo modelo `games / scenes / actions` sin cambiar todavía el runtime real.

## Changes

- ampliar `editorTypes.ts` con:
  - `GameDefinition`
  - `SceneDefinition`
  - `ActionDefinition`
  - tipos de layers y objects v1
- ampliar `EditorSnapshot`
- añadir stores IndexedDB:
  - `games`
  - `scenes`
  - `actions`
- extender `EditorRepository`
- extender bootstrap para soportar contenido de esos stores

## Deliverables

- el editor puede cargar snapshots con stores nuevos
- el repo sigue soportando `maps` y `levelCompositions`
- todavía no se usa `scene` en runtime

## Validation

```bash
npm run build
npm run test:e2e
```

Pruebas nuevas o adaptadas:

- snapshot carga stores nuevos vacíos sin romper el editor
- reset de DB sigue funcionando

## Exit Criteria

- stores nuevos existen
- no hay regresión en editor shell
- la app sigue arrancando igual que antes

## Phase 2: Legacy-To-Scene Migration Pipeline

## Goal

Poder representar el contenido actual como `SceneDefinition` y `GameDefinition` sin reautorarlo a mano.

## Changes

- crear migrador `map + level -> scene`
- crear seed inicial:
  - `GameDefinition` principal
  - `SceneDefinition` para la swamp actual
- mantener `map` y `level` como legacy
- escribir el contenido migrado en los stores nuevos

## Deliverables

- existe una escena inicial equivalente al contenido actual
- existe un juego inicial que apunta a esa escena

## Validation

```bash
npm run build
npm run reset-editor-db
npm run test:e2e
```

Pruebas nuevas:

- el snapshot contiene al menos un `GameDefinition`
- el snapshot contiene al menos una `SceneDefinition`
- la escena migrada tiene:
  - layers
  - colisiones
  - spawn

## Exit Criteria

- el modelo nuevo ya puede expresar la campaña actual
- ningún dato clave del swamp actual depende ya de reinterpretación manual

## Phase 3: Runtime Switch To Game + Scene Data

## Goal

Hacer que el juego arranque desde `GameDefinition` y monte una `SceneDefinition` en runtime, pero todavía sin transiciones entre escenas.

## Changes

- sustituir `loadRuntimeContent()` por algo tipo `loadRuntimeGame(gameId)`
- introducir `RuntimeGameCatalog`
- crear `SceneCompiler`
- crear `buildSceneRuntime.ts`
- adaptar `CampaignScene` a un runtime scene-driven
- si hace falta, renombrar a `GameplayScene`
- el runtime actual del swamp pasa a montarse desde `SceneDefinition`, no desde segmentos legacy

## Deliverables

- el juego sigue mostrando la escena swamp
- pero ya la obtiene desde `scene`
- la fuente de verdad del runtime deja de ser `RuntimeCampaignContent`

## Validation

```bash
npm run build
npm run test:e2e
```

Runtime e2e nuevas:

- el juego arranca con un `gameId`
- `window.__CANUTER_RUNTIME__.sceneId` coincide con la escena entry del juego
- el estado entra en `running`

Visual/manual complementaria:

- abrir `/` y comprobar que la escena jugable sigue siendo la swamp actual

## Exit Criteria

- el runtime ya usa `scene`
- el juego actual sigue funcionando
- `map + level` siguen coexistiendo solo como apoyo de migración/editor legacy

## Phase 4: Scene Asset Authoring In The Editor

## Goal

Poder crear y editar `SceneDefinition` desde el editor.

## Changes

- añadir tipo `scene` al explorer, routing y tabs
- crear `SceneWorkspace`
- crear `ScenePropertiesPanel`
- permitir:
  - crear escena
  - editar nombre
  - editar grid
  - editar tile size
  - ver layers
  - ver surface limpia con zoom/pan
- mover el caso de uso principal de `map` a `scene`

## Deliverables

- una escena nueva se puede crear desde editor
- se guarda en DB
- al recargar editor sigue existiendo

## Validation

```bash
npm run build
npm run test:e2e
```

Editor e2e nuevas:

- crear escena nueva en `User`
- abrir su tab de workspace
- editar nombre
- recargar y verificar persistencia

Visual/manual complementaria:

- screenshot Playwright del `SceneWorkspace`
- comprobar que queda limpio, centrado y con zoom/pan básico

## Exit Criteria

- `SceneDefinition` ya es un asset de primera clase en el editor
- la persistencia DB funciona end-to-end

## Phase 5: Action Asset Authoring In The Editor

## Goal

Poder crear `ActionDefinition` desde el editor, empezando solo por `scene-transition`.

## Changes

- añadir tipo `action` al explorer
- crear `ActionWorkspace` o edición directa en `Properties`
- permitir:
  - crear action
  - elegir `kind = scene-transition`
  - elegir `targetSceneId`
  - elegir `targetEntryPointId`
  - elegir `transitionStyle`

## Deliverables

- una action se puede crear en DB
- una action puede apuntar a una escena destino real

## Validation

```bash
npm run build
npm run test:e2e
```

Editor e2e nuevas:

- crear una escena destino
- crear una action de transición
- asignarle la escena destino
- recargar y validar persistencia

## Exit Criteria

- `ActionDefinition` ya existe como asset real editable
- sus referencias a escenas son estables y persistentes

## Phase 6: Scene Objects MVP (Entry Point + Trigger Zone)

## Goal

Poder autorar en una escena los dos objetos mínimos para transición:

- `entry-point`
- `trigger-zone`

## Changes

- añadir tool de objetos en `SceneWorkspace`
- añadir layer de objetos
- permitir:
  - crear `entry-point`
  - nombrarlo
  - colocarlo en la grid
  - crear `trigger-zone`
  - dibujar rectángulo
  - elegir `triggerMode`
  - asignarle `actionId`

## Deliverables

- una escena puede contener destinos de entrada y zonas que disparen acciones

## Validation

```bash
npm run build
npm run test:e2e
```

Editor e2e nuevas:

- crear dos escenas
- crear un `entry-point` en la escena B
- crear un `trigger-zone` en la escena A
- enlazarlo a una action de transición
- recargar y verificar que la escena sigue teniendo esos objetos

## Exit Criteria

- la base de datos ya contiene todo el grafo mínimo para un cambio de escena
- no queda ninguna pieza del flujo en hardcode manual

## Phase 7: Runtime Action Execution And Scene Transition

## Goal

Hacer que el runtime interprete `trigger-zone -> ActionDefinition -> scene-transition`.

## Changes

- crear `ActionExecutor`
- crear `SceneRuntimeController`
- montar `entry-point` y `trigger-zone` en runtime
- detectar overlap del jugador con el trigger
- resolver `ActionDefinition`
- desmontar escena actual y montar escena destino

## Deliverables

- el juego cambia de escena por datos

## Validation

```bash
npm run build
npm run test:e2e
```

Runtime e2e nuevas:

- abrir el juego con DB seed conocida
- afirmar `sceneId = scene-a`
- mover al jugador hasta trigger
- esperar cambio a `sceneId = scene-b`
- afirmar `entryPointId = target-entry`

Esta prueba debe basarse en `window.__CANUTER_RUNTIME__` o en el debug DOM, no en una captura visual.

Visual/manual complementaria:

- abrir `/`
- entrar en trigger
- confirmar que la escena cambia visualmente

## Exit Criteria

- editor -> DB -> runtime -> transición funciona de verdad
- ya existe el MVP que buscabas

## Phase 8: Cleanup, Legacy Reduction And Regression Net

## Goal

Reducir deuda legacy sin romper el MVP.

## Changes

- marcar `map` y `level` como legacy en el editor
- retirar del runtime todo uso principal de `RuntimeCampaignContent`
- dejar adaptadores legacy solo donde sigan haciendo falta para lectura histórica
- ampliar regresión e2e

## Deliverables

- el camino principal del juego y del editor usa `game + scene + action`
- `map + level` quedan fuera del runtime principal

## Validation

```bash
npm run build
npm run test:e2e
```

Pruebas de regresión finales:

- editor shell sigue bien
- crear escena, action y trigger sigue funcionando
- el juego sigue haciendo transition tras reload
- persistencia de DB tras `editor.html -> / -> editor.html`

## Exit Criteria

- el MVP ya no depende del modelo viejo
- el siguiente trabajo puede centrarse en tiles/tools/enemies, no en arquitectura base

## Phase Gates Summary

No se avanza de fase hasta cumplir esto:

### Gate 0

- existe instrumentación runtime legible por Playwright

### Gate 1

- stores `games / scenes / actions` existen y no rompen nada

### Gate 2

- contenido actual migrado a `scene` sin perder expresividad

### Gate 3

- el juego actual ya corre desde `SceneDefinition`

### Gate 4

- el editor crea y persiste escenas

### Gate 5

- el editor crea y persiste actions

### Gate 6

- el editor crea y persiste `entry-point` y `trigger-zone`

### Gate 7

- el runtime cambia de escena por datos

### Gate 8

- el camino principal ya está limpio y estable

## Why This Plan Is Executable Without Supervision

Creo que sí queda lo bastante bien cerrado para ejecutarlo fase a fase sin supervisión, por estos motivos:

- cada fase tiene un output observable
- cada fase tiene comandos de validación concretos
- las fases están ordenadas para minimizar reinterpretación
- el MVP se alcanza antes de la limpieza completa
- la transición crítica se valida con Playwright de forma determinista, no por inspección manual

## Remaining Interpretation Risk

El riesgo de interpretación que queda no está en la arquitectura principal, sino en detalles de UX del editor:

- cómo se dibuja exactamente un `trigger-zone`
- qué gesto exacto hace pan/zoom
- cómo presentar visualmente la layer de objetos

Eso no bloquea el MVP. Son decisiones de interfaz, no de contrato de datos ni de runtime.

## Final Assessment

Sí, este plan ya está lo bastante bien hecho para poder ejecutarlo solo, fase a fase, hasta llegar al MVP.

La clave es que la definición de “hecho” ya no depende de intuición:

- o el editor persiste la definición en DB
- o el runtime la carga
- o Playwright puede demostrar que la transición sucede

Si una fase pasa su gate, la siguiente puede empezar sin necesitar rediseñar la arquitectura.
