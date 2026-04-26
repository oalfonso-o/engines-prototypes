# Editor Authoring Backlog

## Purpose

Este documento es el backlog vivo de problemas y decisiones de producto del editor que van apareciendo al usarlo de verdad.

No sustituye al plan de implementación de `scene`:

- [2026-04-23-scene-mvp-execution-plan.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/docs/plans/2026-04-23-scene-mvp-execution-plan.md)

Sirve para capturar:

- bugs de autoría detectados en uso real
- reglas de producto que todavía no están cerradas
- flujos futuros del editor (`promote`, publish, move, duplicate, etc.)
- decisiones que no bloquean el MVP inmediato, pero sí el uso real del editor

## Authoring Rules We Should Enforce

### Rule 1: New assets created from the editor must default to `User`

Regla de producto propuesta:

- cualquier asset nuevo creado desde el editor debe nacer en `User`
- `Core` no es un sitio de autoría interactiva normal
- `Archived` no es un sitio de creación

Eso aplica a:

- `Character`
- `Animation`
- `SpriteSheet`
- `Tileset`
- `Scene`
- `Action`
- `Game`
- cualquier asset derivado futuro

### Rule 2: Dependency location must not decide authoring location

Un asset nuevo puede depender de assets en `Core`, pero eso no debe arrastrar su ubicación física o lógica a `Core`.

Ejemplo:

- si creo un `Character` nuevo usando animaciones `Idle/Run/Jump` que viven en `Core`
- el `Character` nuevo sigue siendo un asset de `User`
- no debe aparecer dentro del árbol `Core/Characters/...`
- no debe heredarse el `folderId` del asset fuente solo porque ese asset fuente vive en `Core`

### Rule 3: `Core` should become effectively read-only from the normal editor flow

Propuesta por defecto:

- desde el flujo normal del editor solo se crea en `User`
- `Core` se considera contenido baseline del juego/proyecto
- cualquier escritura en `Core` debería pasar por un flujo explícito distinto, no por el save normal

Esto reduce errores de autoría y evita mezclar:

- contenido base del proyecto
- contenido experimental o en construcción del usuario

## Observed Issue 2026-04-24: Character Creation Uses The Wrong Folder Logic

### What happened

Caso real observado:

- se pulsó `Create Character`
- se creó un asset llamado `character-patata`
- el asset apareció bajo `Core > Characters > Shinobi > Animations`
- tras recargar, el comportamiento quedó inconsistente

### Why this is wrong

Ese flujo rompe la regla mental del editor:

- el usuario estaba creando un `Character`
- no una `Animation`
- y no dentro de `Core`

Además, visualmente induce a error porque parece que el editor ha creado contenido nuevo dentro de la librería base del juego.

### Most likely technical cause

La hipótesis más probable, viendo el diseño actual del editor, es esta:

- al guardar el `Character`, se está heredando el `folderId` del `idleAnimationId`
- si esa animación vive en `Core`, el asset nuevo queda colgado de un folder de `Core`
- el asset puede seguir teniendo `storageRoot = "user"`, pero el árbol del explorer lo ubica donde cae el `folderId`

Eso mezcla dos conceptos que deberían ser independientes:

- `dónde vive el asset`
- `de qué assets depende`

### Default fix direction

La corrección por defecto debería ser:

1. al crear un asset nuevo, el editor decide primero su destino de autoría en `User`
2. ese destino se calcula por contexto de usuario, no por dependencias
3. solo después se guardan referencias a assets fuente en `Core` o `User`

## Proposed User Authoring Layout

Propuesta por defecto para `User`:

- `User/Characters`
- `User/Scenes`
- `User/Actions`
- `User/Games`
- `User/Sprite Sheets`
- `User/Tilesets`
- `User/Animations`
- `User/Assets Raw`

No hace falta implementar ya esta estructura exacta, pero sí conviene cerrar pronto esta idea:

- cada tipo importante necesita un hogar canónico de autoría en `User`

Si no, cada asset nuevo acabará “cayendo” donde pueda y el árbol se volverá impredecible.

## Future Workflow: Promote From `User` To `Core`

Esto no se implementa todavía, pero ya queda apuntado como requirement.

### Why it matters

El flujo natural va a ser:

1. crear cosas en `User`
2. iterarlas y probarlas
3. cuando ya estén bien, promocionarlas a `Core`

Sin ese flujo, o bien:

- `Core` se contamina demasiado pronto
- o `User` se convierte en un limbo de assets que nunca pasan a ser parte “real” del proyecto

### Default product proposal

`Promote to Core` debería ser una acción explícita del editor.

Comportamiento por defecto propuesto:

1. solo assets en `User` pueden promoverse
2. la promoción no ocurre automáticamente al guardar
3. la promoción pide un destino claro dentro de `Core`
4. la promoción valida dependencias antes de mover/publicar
5. la promoción deja trazabilidad suficiente para saber de dónde salió ese asset

### Open design questions for `Promote`

Estas decisiones siguen abiertas, pero ya quedan apuntadas:

- si `promote` hace `copy` o `move`
- si el asset promovido conserva su `id` o recibe uno nuevo
- si al promover un asset también ofrece promover dependencias de `User`
- si `Core` permite edición posterior o solo nuevas promociones
- si el promote debe existir asset a asset o también por carpeta / lote

Mi default por ahora sería:

- `promote` hace `copy`
- el asset promovido recibe `id` nuevo de `Core`
- el editor enseña claramente que `User` y `Core` son dos espacios distintos

Eso es más seguro que un `move` destructivo en esta fase del proyecto.

## Immediate Follow-Up When We Tackle It

Cuando se implemente esta parte, el orden correcto sería:

1. definir los homes canónicos de creación dentro de `User`
2. arreglar todos los flujos de `save*()` para que creen ahí por defecto
3. impedir que el save normal escriba en `Core`
4. revisar el árbol del explorer para que represente bien `storageRoot` y `folderId`
5. diseñar `Promote to Core` como flujo separado

## Notes To Keep Adding Here

Este documento se queda como sitio donde ir metiendo próximos hallazgos de uso real del editor:

- errores de ubicación de assets
- diferencias entre lo que el usuario cree que está creando y lo que realmente se guarda
- reglas de authoring/publish
- fricciones del explorer y del modelo `User` vs `Core`
