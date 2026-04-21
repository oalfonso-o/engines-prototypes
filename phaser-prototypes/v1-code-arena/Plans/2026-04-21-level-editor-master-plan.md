# Phaser V1 Level Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un editor separado del prototipo jugable actual que permita importar PNGs, clasificarlos como tilesets o spritesheets, mapear sus celdas/cuadros, crear animaciones, montar personajes y editar mapas con colisión básica por celda.

**Architecture:** El editor vivirá en un entrypoint propio (`editor.html` + `src/editor/**`) para no tocar `CodeArenaScene` ni el flujo de `src/game/**`. La shell de editor será DOM-first para upload, listas, tabs, buscador y formularios; cada workspace visual montará un único `Phaser.Game` dentro de un contenedor DOM fijo, y ese `Phaser.Game` se destruirá y recreará al cambiar de workspace. No se introducirán React, Vue, Konva, Fabric ni librerías externas equivalentes.

**Tech Stack:** Vite, TypeScript, Phaser 3, DOM APIs del navegador, `<input type="file" accept="image/png">`, `URL.createObjectURL`, `indexedDB` nativo para persistencia local, `npm run build`, `npm run dev`.

---

## 1. Contexto actual y restricciones

- El juego jugable actual vive en `src/game/**` y arranca desde `src/main.ts`.
- Ya existe una estructura razonablemente modular para juego: `assets`, `colliders`, `collectibles`, `level`, `player`, `scenes`, `ui`.
- El editor no necesita estar conectado al juego todavía.
- El navegador no puede “leer el sistema de archivos” libremente.
  La forma V1 correcta es abrir el selector de archivos del sistema con `input[type="file"]` y trabajar con los `File` elegidos por el usuario.
- Para V1 solo se aceptarán PNG.
- Para V1 habrá dos tipos de asset fuente:
  - `tileset-source`
  - `spritesheet-source`
- Para V1 los assets “listos para juego” serán:
  - tilesets mapeados
  - spritesheets mapeados
  - animaciones
  - personajes
  - mapas

## 2. Decisiones de diseño

### 2.1 Aislamiento total del juego actual

- `src/game/**` y `src/main.ts` deben quedarse sin cambios funcionales.
- El editor entra por un HTML separado:
  - `editor.html`
  - `src/editor/main.ts`
- Si más adelante queremos enlazar juego y editor, se hará por navegación o menú, no mezclando la escena jugable con la UI de editor.

### 2.2 Shell de editor DOM-first

- Upload de archivos, buscador, scroll, tabs, listas, formularios y botones son mucho más baratos en DOM que en Phaser.
- Phaser se reserva para:
  - preview visual ajustado al contenedor
  - overlays de grid
  - dibujo de rectángulos de mapping
  - pintado de tiles sobre mapa
  - preview de animaciones
- V1 no incluye zoom ni pan en ningún workspace.

### 2.3 Persistencia local

- Los PNG importados y las definiciones derivadas se guardarán en IndexedDB.
- La implementación usará `indexedDB` nativo, sin dependencias nuevas.
- Los object stores de V1 quedan cerrados a:
  - `rawAssets`
  - `rawAssetBlobs`
  - `tilesets`
  - `spritesheets`
  - `animations`
  - `characters`
  - `maps`
  - `meta`
- El editor trabajará con IDs internas y referencias entre entidades.
- No se intentará escribir de vuelta al disco en esta fase.
- “Guardar” significa persistir en IndexedDB y reconstruir el estado al recargar.

### 2.3.1 Nombres de assets en V1

- Todos los assets del editor comparten un único namespace global de nombres.
- Esto incluye:
  - raw assets
  - tilesets
  - spritesheets
  - animations
  - characters
  - maps
- `name` debe ser único en todo el universo de assets, no solo dentro de su tipo.
- Los assets archivados también reservan su `name`.
- En V1 `name` funciona como identificador humano estable.
- Una vez guardado un asset, su `name` no se podrá editar.

### 2.3.2 Ciclo de vida de assets en V1

- V1 no tendrá borrado duro desde la UI.
- Todas las entidades del editor podrán estar:
  - activas
  - archivadas
- El archivado se persistirá con `archivedAt`.
- V1 permitirá tanto `Archive` como `Unarchive`.
- Un asset archivado seguirá existiendo en IndexedDB y seguirá siendo resoluble por ID.
- Los assets archivados seguirán siendo visibles en la biblioteca.
- Un asset archivado podrá seguir resolviéndose para assets ya existentes, pero no se ofrecerá como opción en flujos de creación nuevos.
- Para cambiar un `sourceKind`, el flujo correcto será:
  - archivar el raw asset antiguo
  - importar un raw asset nuevo con el `sourceKind` correcto y un `name` distinto

### 2.3.3 Referencias, uso y consistencia

- El editor calculará referencias directas entre assets.
- Cada asset tendrá dos vistas de inspección en el panel de detalle:
  - `Used By`
  - `Dependencies`
- `Used By` listará los assets que referencian directamente al asset abierto.
- `Dependencies` listará los assets referenciados directamente por el asset abierto.
- Cada dependencia mostrará un estado:
  - `active`
  - `archived`
  - `missing`
- Si se archiva un asset que está siendo usado por otros assets:
  - la UI mostrará un diálogo de confirmación
  - el diálogo listará los assets afectados
  - al confirmar, solo se archivará el asset seleccionado
  - no habrá archivado en cascada
- Un asset que depende de assets archivados se marcará como `uses-archived-dependencies`.
- Un asset que depende de assets no resolubles por ID se marcará como `missing-dependencies`.
- Los assets inconsistentes no se borran automáticamente.
- La UI mostrará un warning visible en la biblioteca cuando un asset tenga dependencias archivadas o faltantes.
- Si un preview o renderer no resuelve una referencia:
  - no debe lanzar error fatal
  - debe saltarse ese elemento visual
  - debe mantener el resto del asset renderizable

### 2.4 Pipeline de datos

- Un PNG importado entra como `RawAssetRecord`.
- Durante la importación el usuario debe clasificar el PNG como tileset o spritesheet.
- En V1 no existen PNGs sin clasificar.
- `sourceKind` será inmutable tras el import.
  Para cambiarlo habrá que archivar el asset y reimportarlo.
- A partir de ahí se puede crear un `TilesetDefinition` o un `SpriteSheetDefinition`.
- De un spritesheet mapeado salen `AnimationDefinition`.
- De las animaciones salen `CharacterDefinition`.
- De los tilesets mapeados salen `MapDefinition`.

### 2.4.1 Reglas cerradas de import para V1

- El formulario de import pedirá:
  - `file`
  - `name`
  - `sourceKind`
- `name` será obligatorio.
- El valor inicial de `name` será el nombre del fichero subido sin la extensión `.png`.
- `name` será editable por el usuario antes de guardar.
- `name` debe ser único en todo el universo de assets, incluidos los archivados.
- Si `name` ya existe en cualquier otro asset, la UI mostrará un error inline inmediatamente.
- Al pulsar guardar, la unicidad de `name` se comprobará otra vez.
- Si `name` sigue duplicado al guardar, el import se bloqueará.
- Imports del mismo fichero binario están permitidos mientras el `name` sea distinto.

### 2.4.2 Reglas cerradas de edición de assets derivados para V1

- Los assets derivados de V1 son:
  - `tileset`
  - `spritesheet`
  - `animation`
  - `character`
  - `map`
- Una vez guardado un asset derivado, quedará inmutable.
- Esto incluye su `name`.
- Reabrir un asset derivado desde la biblioteca lo mostrará en modo lectura.
- V1 no permitirá editar in place un asset derivado ya guardado.
- V1 no tendrá versionado de assets derivados.
- Para cambiar un asset derivado habrá que crear uno nuevo mediante su flujo normal de creación.
- Como consecuencia, los IDs internos de tiles y frames quedarán estables mientras exista su asset derivado.

### 2.5 Reglas cerradas de mapping para V1

- V1 no incluye edición libre de rectángulos, dibujo manual de cajas ni movimiento de líneas de la grid.
- Tilesets y spritesheets se mapearán con cuatro parámetros:
  - `cellWidth`
  - `cellHeight`
  - `offsetX`
  - `offsetY`
- `cellWidth` y `cellHeight` deben ser enteros positivos mayores que `0`.
- `offsetX` y `offsetY` deben ser enteros mayores o iguales que `0`.
- La autogeneración de celdas empezará en `(offsetX, offsetY)` y recorrerá la imagen en orden fila-columna.
- Solo se generarán celdas completas que queden enteras dentro de la imagen.
- Los píxeles sobrantes que no formen una celda completa se ignorarán y se mostrará un warning no bloqueante.
- Ese warning no bloqueante se mostrará como un badge inline en la cabecera del workspace.
- El usuario podrá activar o desactivar celdas generadas.
- En persistencia solo se guardarán las celdas activas.
- No se permitirá guardar un tileset o spritesheet mapeado si no queda al menos una celda activa.

### 2.6 Reglas cerradas de mapa para V1

- El mapa tendrá:
  - `tileWidth`
  - `tileHeight`
  - `tileFitMode`
- `widthInCells`, `heightInCells`, `tileWidth` y `tileHeight` deben ser enteros positivos mayores que `0`.
- `tileFitMode` solo puede ser:
  - `crop`
  - `scale-to-fit`
- En modo `crop`:
  - el tile se dibuja anclado arriba a la izquierda de la celda del mapa
  - si el tile es mayor que la celda, se recorta el exceso
  - si el tile es menor que la celda, queda espacio vacío a la derecha y abajo
- En modo `scale-to-fit`:
  - el tile se escala exactamente a `tileWidth x tileHeight`
  - si el tile ya tiene ese tamaño, no se aplica cambio visible
- La capa visual del mapa y la capa de colisión son estructuras distintas.
- La capa visual del mapa se guardará en `cells`.
- La capa de colisión se guardará en `collisionCells`.
- En V1 una celda del mapa puede contener como máximo un tile visual.
- En V1 una celda del mapa puede contener como máximo una marca de colisión.
- `cells` y `collisionCells` se guardarán ordenadas en row-major:
  - primero `y`
  - luego `x`
- `collisionCells` no guarda booleans.
  La presencia de la coordenada en el array implica colisión.

### 2.7 Reglas cerradas de animación y personaje para V1

- Una animación solo puede referenciar frames de un único spritesheet.
- `frameDurationMs` se aplica por igual a todos los frames de la animación.
- `frameDurationMs` debe ser un entero positivo mayor que `0`.
- No se permitirá guardar una animación sin al menos un frame.
- Los slots de personaje quedan cerrados a:
  - `idle`
  - `run_side`
  - `jump`
  - `attack`
- `idle` es obligatorio.
- `run_side`, `jump` y `attack` son opcionales.
- Si existe `run_side`, el personaje debe guardar también:
  - `runSideFacing`
- `runSideFacing` solo puede ser:
  - `left`
  - `right`
- Un personaje puede enlazar animaciones procedentes de spritesheets distintos.
- El preview del personaje reproducirá directamente la animación enlazada en cada slot, usando el spritesheet propio de esa animación.
- Si falta `run_side`, el preview y los consumidores futuros usarán `idle`.
- Si falta `jump`, el preview y los consumidores futuros usarán `idle`.
- Si falta `attack`, el preview y los consumidores futuros usarán `idle`.

### 2.8 Navegación del editor

- El editor usará un router interno sin librerías basado en `window.location.hash`.
- No se usará History API.
- La ruta por defecto al abrir `editor.html` será `#library`.
- Las rutas de V1 quedan cerradas a:
  - `library`
  - `tileset/:id`
  - `spritesheet/:id`
  - `animation/:id`
  - `character/:id`
  - `map/:id`

## 3. Modelo de datos recomendado

```ts
export type RawAssetKind = "tileset-source" | "spritesheet-source";
export type ReadyAssetKind =
  | "tileset"
  | "spritesheet"
  | "animation"
  | "character"
  | "map";

export interface RawAssetRecord {
  id: string;
  name: string;
  originalFilename: string;
  mimeType: "image/png";
  width: number;
  height: number;
  sizeBytes: number;
  sourceKind: RawAssetKind;
  blobKey: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TilesetTileRecord {
  id: string;
  rect: Rect;
  label: string | null;
}

export interface TilesetDefinition {
  id: string;
  sourceAssetId: string;
  name: string;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  tiles: TilesetTileRecord[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpriteFrameRecord {
  id: string;
  rect: Rect;
  label: string | null;
}

export interface SpriteSheetDefinition {
  id: string;
  sourceAssetId: string;
  name: string;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  frames: SpriteFrameRecord[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimationDefinition {
  id: string;
  spriteSheetId: string;
  name: string;
  frameIds: string[];
  frameDurationMs: number;
  loop: boolean;
  archivedAt: string | null;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  idleAnimationId: string | null;
  runSideAnimationId: string | null;
  runSideFacing: "left" | "right" | null;
  jumpAnimationId: string | null;
  attackAnimationId: string | null;
  archivedAt: string | null;
}

export type TileFitMode = "crop" | "scale-to-fit";

export interface MapDefinition {
  id: string;
  name: string;
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  cells: Array<{
    x: number;
    y: number;
    tilesetId: string;
    tileId: string;
  }>;
  collisionCells: Array<{
    x: number;
    y: number;
  }>;
  archivedAt: string | null;
}
```

## 4. Estructura de ficheros propuesta

```text
phaser-prototypes/v1-code-arena/
  editor.html
  Plans/
    2026-04-21-level-editor-master-plan.md
  src/
    editor/
      main.ts
      app/
        createEditorApp.ts
        EditorLayout.ts
        EditorRouter.ts
      domain/
        editorIds.ts
        editorTypes.ts
        editorValidators.ts
      storage/
        editorDb.ts
        editorRepository.ts
        objectUrlRegistry.ts
      state/
        EditorStore.ts
      import/
        importPngAsset.ts
        inspectPngFile.ts
      library/
        AssetLibraryView.ts
        AssetLibraryFilters.ts
        AssetDetailsPanel.ts
      workspaces/
        tileset/
          TilesetMappingWorkspace.ts
          tilesetGrid.ts
          tilesetSerializer.ts
        spritesheet/
          SpriteSheetMappingWorkspace.ts
          spritesheetGrid.ts
          AnimationEditorPanel.ts
        character/
          CharacterEditorView.ts
        map/
          MapEditorWorkspace.ts
          MapPalettePanel.ts
          CollisionPaintController.ts
      shared/
        dom.ts
        events.ts
        geometry.ts
      styles/
        editor.css
```

## 5. UX mínima por pantalla

### 5.1 Biblioteca

- Buscador arriba.
- Lista con scroll.
- Columnas mínimas:
  - nombre
  - tipo
  - tamaño
- Dos tabs:
  - `Raw Assets`
  - `Game Assets`
- En la celda de nombre se podrán mostrar badges de estado:
  - `Archived`
  - `Uses Archived`
  - `Missing Dependencies`
- El panel de detalle irá siempre a la derecha de la lista en V1.
- Un panel de detalle a la derecha para preview y acciones.
- El panel de detalle tendrá tabs:
  - `Overview`
  - `Used By`
  - `Dependencies`

### 5.2 Editor de tileset

- Preview del PNG.
- Preview ajustado al contenedor, sin zoom ni pan.
- Inputs:
  - `cellWidth`
  - `cellHeight`
  - `offsetX`
  - `offsetY`
- Botón `Generate grid`.
- Overlay de grid visible.
- Warning visual si sobran píxeles que no forman una celda completa.
- Lista o overlay para activar y desactivar celdas generadas.
- No hay dibujo libre de rectángulos en V1.
- Botón `Save tileset mapping`.

### 5.3 Editor de spritesheet

- Preview del PNG.
- Preview ajustado al contenedor, sin zoom ni pan.
- Inputs:
  - `cellWidth`
  - `cellHeight`
  - `offsetX`
  - `offsetY`
- Botón `Generate grid`.
- Warning visual si sobran píxeles que no forman una celda completa.
- Lista o overlay para activar y desactivar celdas generadas.
- Lista de frames detectados.
- No hay dibujo libre de rectángulos en V1.
- Botón `Create animation`.

### 5.4 Editor de animación

- Lista o strip de frames.
- Form para nombre.
- `frameDurationMs`.
- `loop`.
- Preview play/pause.
- Botón `Save animation`.

### 5.5 Editor de personaje

- Form con nombre.
- Selectores para:
  - idle
  - run side
  - jump
  - attack
- Si `run side` existe, selector adicional:
  - `runSideFacing`
- Preview con cuatro botones:
  - `Idle`
  - `Run`
  - `Jump`
  - `Attack`
- Al pulsar cada botón, se reproduce la animación enlazada o `idle` si ese slot falta.
- Botón `Save character`.

### 5.6 Editor de mapa

- Acción `Create map`.
- Grid vacía.
- Configuración de mapa:
  - `tileWidth`
  - `tileHeight`
  - `tileFitMode`
- Panel izquierdo con tilesets disponibles.
- Vista de tiles del tileset seleccionado.
- Herramienta paint para colocar tiles.
- Modo `Collision`.
- Click por celda para añadir o quitar coordenadas en `collisionCells`.
- Botón `Save map`.

## 6. Fases de implementación

### Task 1: Bootstrap aislado del editor

**Files:**
- Create: `phaser-prototypes/v1-code-arena/editor.html`
- Create: `phaser-prototypes/v1-code-arena/src/editor/main.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/app/createEditorApp.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/app/EditorLayout.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/styles/editor.css`
- Modify: `phaser-prototypes/v1-code-arena/vite.config.ts`

- [ ] Añadir un entrypoint de Vite separado para el editor.
- [ ] Mantener `src/main.ts` y el juego actual intactos.
- [ ] Renderizar una shell vacía con header, sidebar y content area.
- [ ] Validar que `/editor.html` carga sin interferir con `/index.html`.

**Resultado esperado:** El juego actual sigue funcionando igual y el editor abre una pantalla independiente vacía.

### Task 2: Fundaciones de dominio y persistencia

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/editorTypes.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/editorIds.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/editorValidators.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/assetReferences.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/assetStatuses.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/storage/editorDb.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/storage/editorRepository.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/storage/objectUrlRegistry.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/state/EditorStore.ts`

- [ ] Definir los tipos base de raw asset, tileset, spritesheet, animación, personaje y mapa.
- [ ] Crear una capa repositorio para leer/escribir entidades por ID con `indexedDB` nativo.
- [ ] Crear exactamente estos object stores:
  - `rawAssets`
  - `rawAssetBlobs`
  - `tilesets`
  - `spritesheets`
  - `animations`
  - `characters`
  - `maps`
  - `meta`
- [ ] Guardar PNGs como blobs en `rawAssetBlobs` y metadatos en `rawAssets`.
- [ ] Exponer un store único de editor para sincronizar UI y workspaces.
- [ ] Generar todas las IDs del editor con `crypto.randomUUID()`.
- [ ] Incluir `archivedAt` en todas las entidades persistidas del editor.
- [ ] Implementar cálculo de referencias directas entre assets.
- [ ] Implementar cálculo de estado derivado:
  - `active`
  - `archived`
  - `uses-archived-dependencies`
  - `missing-dependencies`

**Resultado esperado:** El editor puede persistir entidades vacías y recuperarlas tras recargar.

### Task 3: Importación de PNG y biblioteca de raw assets

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/import/importPngAsset.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/import/inspectPngFile.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/library/AssetLibraryView.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/library/AssetLibraryFilters.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/library/AssetDetailsPanel.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/app/EditorLayout.ts`

- [ ] Añadir botón `Import PNG`.
- [ ] Restringir la selección a `image/png`.
- [ ] Rechazar cualquier fichero no PNG con error visible.
- [ ] Leer dimensiones y tamaño del fichero al importar.
- [ ] Sugerir `name` con el nombre del fichero sin `.png`.
- [ ] Permitir editar `name` antes de guardar.
- [ ] Pedir obligatoriamente al usuario `sourceKind`:
  - `tileset-source`
  - `spritesheet-source`
- [ ] Comprobar inmediatamente si `name` ya existe en cualquier asset del editor y mostrar error inline si está duplicado.
- [ ] No permitir guardar el import si no se ha elegido `sourceKind`.
- [ ] Volver a comprobar al guardar que `name` sigue siendo único y bloquear el import si no lo es.
- [ ] Pintar la biblioteca `Raw Assets` con buscador, scroll y columnas.
- [ ] Permitir abrir preview de asset importado.
- [ ] No implementar rename de raw assets una vez guardados.

**Resultado esperado:** El usuario puede importar un PNG, clasificarlo y verlo en la lista de assets en bruto.

### Task 4: Biblioteca de game assets

**Files:**
- Modify: `phaser-prototypes/v1-code-arena/src/editor/library/AssetLibraryView.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/library/AssetDetailsPanel.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/state/EditorStore.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/library/buildGameAssetRows.ts`

- [ ] Añadir tab `Game Assets`.
- [ ] Agregar filas derivadas para:
  - tilesets
  - spritesheets
  - animaciones
  - personajes
  - mapas
- [ ] Mantener el mismo buscador para raw y ready assets.
- [ ] Poder abrir una entidad derivada desde la lista.
- [ ] Mantener visibles en la biblioteca tanto assets activos como archivados.
- [ ] Mostrar badges de estado en la celda de nombre:
  - `Archived`
  - `Uses Archived`
  - `Missing Dependencies`
- [ ] Añadir tabs `Overview`, `Used By` y `Dependencies` al panel de detalle.
- [ ] En `Used By`, listar dependencias inversas directas.
- [ ] En `Dependencies`, listar dependencias directas con estado `active`, `archived` o `missing`.
- [ ] Añadir acción `Archive`.
- [ ] Añadir acción `Unarchive` para assets archivados.
- [ ] Excluir assets archivados de los selectores usados para crear nuevas definiciones.
- [ ] Al archivar un asset usado por otros, mostrar confirmación con la lista de assets afectados.
- [ ] Confirmar archivo sin cascada.
- [ ] No implementar borrado duro desde la UI.

**Resultado esperado:** El usuario distingue claramente entre PNGs importados y assets ya válidos para el juego.

### Task 5: Workspace de mapping de tilesets

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/tileset/TilesetMappingWorkspace.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/tileset/tilesetGrid.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/tileset/tilesetSerializer.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/shared/geometry.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/app/EditorRouter.ts`

- [ ] Abrir un workspace al seleccionar un raw asset clasificado como `tileset-source`.
- [ ] Mostrar el PNG con overlay de grid.
- [ ] Permitir introducir `cellWidth`, `cellHeight`, `offsetX` y `offsetY`.
- [ ] Validar que `cellWidth` y `cellHeight` sean enteros positivos y que `offsetX` y `offsetY` sean enteros mayores o iguales que `0`.
- [ ] Generar automáticamente celdas rectangulares completas desde `(offsetX, offsetY)`.
- [ ] Ignorar los sobrantes que no formen celdas completas y mostrar warning no bloqueante.
- [ ] Mostrar ese warning como un badge inline en la cabecera del workspace.
- [ ] Permitir activar y desactivar celdas generadas.
- [ ] No implementar dibujo libre de rectángulos ni movimiento manual de líneas.
- [ ] Persistir un `TilesetDefinition` con IDs internas por tile.
- [ ] Guardar solo las celdas activas, sin exigir etiquetas manuales por tile en la primera versión.
- [ ] Bloquear `Save tileset mapping` si no queda ninguna celda activa.
- [ ] Validar que el `name` del tileset sea único en todo el universo de assets.
- [ ] Al guardar por primera vez, dejar el tileset derivado inmutable para futuras aperturas.

**Resultado esperado:** De un PNG de tileset sale un tileset mapeado con rectángulos persistidos y utilizable por el editor de mapas.

### Task 6: Workspace de mapping de spritesheets

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/spritesheet/SpriteSheetMappingWorkspace.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/spritesheet/spritesheetGrid.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/app/EditorRouter.ts`

- [ ] Abrir un workspace al seleccionar un raw asset clasificado como `spritesheet-source`.
- [ ] Reutilizar la misma lógica base de grid del tileset.
- [ ] Permitir introducir `cellWidth`, `cellHeight`, `offsetX` y `offsetY`.
- [ ] Validar que `cellWidth` y `cellHeight` sean enteros positivos y que `offsetX` y `offsetY` sean enteros mayores o iguales que `0`.
- [ ] Generar automáticamente frames completos desde `(offsetX, offsetY)`.
- [ ] Ignorar los sobrantes que no formen celdas completas y mostrar warning no bloqueante.
- [ ] Mostrar ese warning como un badge inline en la cabecera del workspace.
- [ ] Permitir activar y desactivar frames generados.
- [ ] No implementar dibujo libre de rectángulos ni movimiento manual de líneas.
- [ ] Persistir un `SpriteSheetDefinition`.
- [ ] Bloquear `Save` si no queda ningún frame activo.
- [ ] Validar que el `name` del spritesheet sea único en todo el universo de assets.
- [ ] Al guardar por primera vez, dejar el spritesheet derivado inmutable para futuras aperturas.

**Resultado esperado:** De un PNG de spritesheet sale un spritesheet mapeado con frames identificados por ID.

### Task 7: Editor de animaciones

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/spritesheet/AnimationEditorPanel.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/spritesheet/animationPreview.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/workspaces/spritesheet/SpriteSheetMappingWorkspace.ts`

- [ ] Mostrar la lista de frames del spritesheet mapeado.
- [ ] Permitir seleccionar varios frames en orden.
- [ ] Permitir asignar nombre y un único `frameDurationMs` para toda la animación.
- [ ] Validar que `frameDurationMs` sea un entero positivo mayor que `0`.
- [ ] Añadir `Preview`, `Pause`, `Save`.
- [ ] Rechazar cualquier intento de mezclar frames de más de un spritesheet.
- [ ] Persistir `AnimationDefinition`.
- [ ] Bloquear `Save animation` si no hay ningún frame seleccionado.
- [ ] Validar que el `name` de la animación sea único en todo el universo de assets.
- [ ] Hacer visible la animación en la tab `Game Assets`.
- [ ] Al guardar por primera vez, dejar la animación inmutable para futuras aperturas.

**Resultado esperado:** El usuario puede construir y previsualizar animaciones reutilizables.

### Task 8: Editor de personaje

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/character/CharacterEditorView.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/app/EditorRouter.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/library/AssetLibraryView.ts`

- [ ] Añadir acción `Create character`.
- [ ] Pedir nombre de personaje.
- [ ] Vincular animaciones guardadas a slots:
  - idle
  - correr lateral
  - saltar
  - atacar
- [ ] Hacer `idle` obligatorio.
- [ ] Permitir vincular slots a animaciones de spritesheets distintos.
- [ ] Si `run side` está asignado, pedir también `runSideFacing`:
  - `left`
  - `right`
- [ ] Guardar `CharacterDefinition`.
- [ ] Validar que el `name` del personaje sea único en todo el universo de assets.
- [ ] Mostrar preview con botones `Idle`, `Run`, `Jump` y `Attack`.
- [ ] Al pulsar `Run`, `Jump` o `Attack`, reproducir la animación enlazada o `idle` si el slot está vacío.
- [ ] Al pulsar `Idle`, reproducir siempre `idle`.
- [ ] Bloquear `Save character` si `idle` no está asignado.
- [ ] Al guardar por primera vez, dejar el personaje inmutable para futuras aperturas.

**Resultado esperado:** El usuario dispone de una entidad de personaje reutilizable para el runtime futuro.

### Task 9: Workspace de creación de mapas

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/map/MapEditorWorkspace.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/map/MapPalettePanel.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/workspaces/map/CollisionPaintController.ts`
- Modify: `phaser-prototypes/v1-code-arena/src/editor/app/EditorRouter.ts`

- [ ] Añadir acción `Create map`.
- [ ] Pedir nombre y tamaño base del mapa:
  - width in cells
  - height in cells
  - tile width
  - tile height
- [ ] Validar que `width in cells`, `height in cells`, `tile width` y `tile height` sean enteros positivos mayores que `0`.
- [ ] Pedir también `tileFitMode`:
  - `crop`
  - `scale-to-fit`
- [ ] Pintar una grid vacía.
- [ ] Mostrar paleta de tilesets ya mapeados.
- [ ] Al seleccionar un tileset, mostrar sus tiles.
- [ ] Permitir elegir tile y pintar celdas del mapa en la colección `cells`.
- [ ] Si una celda de `cells` ya tiene tile, pintar encima reemplaza el tile existente.
- [ ] Añadir herramienta `Erase` para borrar el tile visual de una celda.
- [ ] Hacer que `Erase` solo modifique `cells` y no toque `collisionCells`.
- [ ] En `crop`, dibujar anclado arriba a la izquierda y recortar el exceso fuera de la celda.
- [ ] En `crop`, dejar espacio vacío a la derecha y abajo si el tile es menor que la celda.
- [ ] En `scale-to-fit`, escalar el tile exactamente a `tileWidth x tileHeight`.
- [ ] Añadir modo `Collision`.
- [ ] En modo `Collision`, clic sobre celdas para añadir o quitar coordenadas en `collisionCells`.
- [ ] Impedir duplicados de coordenadas tanto en `cells` como en `collisionCells`.
- [ ] Guardar `cells` y `collisionCells` ordenadas por `y` y luego por `x`.
- [ ] Persistir `MapDefinition`.
- [ ] Validar que el `name` del mapa sea único en todo el universo de assets.
- [ ] Al guardar por primera vez, dejar el mapa inmutable para futuras aperturas.

**Resultado esperado:** El usuario puede editar un mapa básico por tiles y una capa de colisión on/off por celda.

### Task 10: Validación interna y preparación de integración futura

**Files:**
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/exportContracts.ts`
- Create: `phaser-prototypes/v1-code-arena/src/editor/domain/editorMigrations.ts`
- Modify: `phaser-prototypes/v1-code-arena/README.md`

- [ ] Documentar el contrato JSON interno de:
  - raw assets
  - tilesets
  - spritesheets
  - animaciones
  - personajes
  - mapas
- [ ] Documentar también:
  - archivado frente a borrado
  - referencias directas
  - estados derivados de consistencia
  - inmutabilidad de assets derivados
- [ ] Definir versión de esquema para futuras migraciones.
- [ ] Añadir una sección de README para abrir el editor y describir sus limitaciones.
- [ ] Confirmar que el juego jugable actual sigue cargando igual.

**Resultado esperado:** El editor queda desacoplado pero listo para una futura fase de integración con el runtime.

## 7. Orden recomendado de entrega

- Milestone 1:
  - Task 1
  - Task 2
  - Task 3
  - Task 4
- Milestone 2:
  - Task 5
  - Task 6
  - Task 7
- Milestone 3:
  - Task 8
  - Task 9
  - Task 10

## 8. Validación por fase

- Validación mínima en todas las fases:
  - `npm run build`
  - `npm run dev`
- Validación específica:
  - Importación: un PNG aparece en `Raw Assets` tras recargar.
  - Tileset mapping: un tileset guardado aparece en `Game Assets`.
  - Spritesheet mapping: un spritesheet guardado conserva sus frames.
  - Animación: preview reproduce frames en orden.
  - Personaje: preview muestra binding correcto.
  - Mapa: el mapa guardado conserva tiles y colisiones tras recargar.

## 9. Riesgos y decisiones a vigilar

- No meter toda la UI en Phaser.
  Eso volvería caro el upload, los tabs, las tablas y los formularios.
- No conectar todavía editor y runtime jugable.
  Primero hay que estabilizar formatos.
- No intentar resolver aún:
  - exportación a disco
  - colisiones parciales por tile
  - varias capas de mapa
  - undo/redo
  - atlases complejos
  - soporte JPG
- Reutilizar utilidades de grid y rectángulos entre tileset y spritesheet.
- Mantener `src/game/**` como consumidor futuro de datos, no como lugar donde construir el editor.

## 10. Primera entrega que recomiendo construir

Si se quiere empezar por la versión más pequeña útil, la primera entrega debería ser:

1. Editor aislado.
2. Importación PNG.
3. Clasificación `tileset-source` / `spritesheet-source`.
4. Biblioteca `Raw Assets`.
5. Mapping básico de tileset por grid.
6. Persistencia local.

Con eso ya tendríamos el primer pipeline real:

`PNG -> raw asset -> tileset mapeado`

Y desde ahí ya se puede crecer hacia spritesheets, animaciones, personajes y mapas sin rehacer la base.
