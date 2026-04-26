# Scope y Reglas de Trabajo

# Game Design Document: Canuter

## Objetivo del documento

Este documento define el Game Design Document de Canuter, un Metroidvania 2D. Su objetivo es dejar por escrito todas las herramientas necesarias para que un level designer pueda construir el juego sala a sala, tile a tile, sin depender de decisiones improvisadas.

El documento debe definir qué puede hacer el jugador en cada fase del juego, qué habilidades tiene disponibles, qué enemigos existen, qué plataformas y obstáculos pueden usarse, qué tipo de dificultad se espera y cómo progresa el jugador a través de los biomas.

La meta no es describir cada implementación técnica desde el primer día. La meta es cerrar reglas de diseño suficientemente precisas para que gameplay, biomas, rutas, enemigos, jefes, UI y progression puedan construirse con criterios consistentes.

## Alcance inicial

# Canuter tendrá cuatro biomas principales. Bosc Antic tendrá 16 salas. Cim Gelat y Mina Enfonsada tendrán 20 salas cada uno. El Nucli de la Vena, por ser el bioma final, tendrá 27 salas. Cada bioma tendrá su propio jefe final, enemigos, tiles, plataformas, obstáculos, tono visual, ritmo de exploración y curva de dificultad.

Canuter tendrá cuatro biomas principales:

- Bosc Antic: 16 salas jugables principales, más el hub no puntuable `Sala 00`.
- Cim Gelat: 20 salas.
- Mina Enfonsada: 20 salas.
- Nucli de la Vena: 27 salas.

Cada bioma tendrá su propio jefe final, set de enemigos, obstáculos, ritmo de exploración, tono visual y curva de dificultad.

El documento no busca diseñar todavía cada sala en detalle desde el principio. Primero debe definir el set de herramientas: habilidades, enemigos, plataformas, obstáculos, reglas de progresión, recompensas, puertas, bloqueos, backtracking y dificultad. Cuando esas herramientas estén claras, se podrá diseñar cada sala con criterios consistentes.

## Regla de ownership documental

Cada concepto canónico vive en un único archivo.

- Los sistemas globales viven en archivos globales.
- Los detalles locales viven en carpetas de bioma.
- Los nombres de salas viven junto al room graph del bioma, no en el glosario global.
- Las fórmulas de score viven solo en `scoring-system.md`.
- Los detalles de UI viven en `ui-dialogues-and-save.md`.
- Las decisiones técnicas viven en `technical-architecture.md`.

Si una decisión afecta a varias áreas, primero se actualiza el archivo canónico del sistema y luego las referencias locales.

## Regla de trabajo

Forma de trabajo

- Este documento será la fuente de verdad del proyecto. Cada vez que se defina una decisión importante, se añadirá aquí. Si una conversación se pierde, se podrá recuperar el contexto leyendo este documento.
- Las decisiones todavía abiertas se marcarán como pendientes. Las decisiones ya aceptadas se escribirán como reglas de diseño. El objetivo final es que el documento permita construir todas las salas del juego con una guía clara.
- El snapshot archivado sirve como referencia histórica, no como estructura activa.
- Los archivos puente existen solo para redirigir desde nombres anteriores.
- Si una sección mezcla dos dominios distintos, debe dividirse.
- Si una regla es global, no se duplica dentro de un bioma salvo referencia breve.
- Si una regla es local de un bioma, no se promueve al nivel global.

## Cobertura mínima esperada del GDD

Un GDD operativo de Canuter debe cubrir como mínimo:

- Fantasía principal del juego.
- Historia, progresión y cierre.
- Personajes jugables y habilidades.
- Combate, energía, daño y balance base.
- Controles e input.
- UI, diálogos, minimapa, bestiario y guardado.
- Scoring.
- Mapa global y room graphs internos.
- Obstáculos, enemigos, jefes, recompensas y onboarding por bioma.
- Presentación visual, audio, VFX y restricciones técnicas.
- Decisiones abiertas reales.

## Estructura pendiente de definir

Esta era la estructura pendiente original del documento y se conserva aquí como checklist de cobertura semántica del GDD:

1. Fantasía principal del juego.
2. Movimiento base del personaje.
3. Combate base.
4. Habilidades desbloqueables.
5. Estructura de los cuatro biomas.
6. Enemigos por bioma.
7. Plataformas, tiles y obstáculos por bioma.
8. Jefes finales.
9. Progresión y backtracking.
10. Reglas para diseñar salas.
11. Curva de dificultad.
12. Diseño sala a sala.
