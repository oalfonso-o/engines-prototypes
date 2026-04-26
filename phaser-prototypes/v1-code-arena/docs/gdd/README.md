# Canuter GDD

Este directorio es la fuente de verdad local del GDD de Canuter.

## Regla principal

- Cada concepto canónico vive en un solo archivo.
- Los sistemas globales viven en archivos globales.
- El detalle local de cada bioma vive dentro de su carpeta.
- Los archivos puente existen solo para redirigir desde nombres antiguos. No son canónicos.
- El snapshot archivado conserva el texto histórico completo, pero no marca la estructura de trabajo actual.

## Mapa canónico

- [Scope y reglas de trabajo](./scope-and-working-rules.md)
  - Alcance del proyecto, reglas documentales y criterios de ownership.
- [Glosario y naming](./glossary-and-naming.md)
  - Nombres propios oficiales y reglas de naming global.
- [Historia y mundo](./story-and-world.md)
  - Premisa, conflicto central, giro final y cierre narrativo.
- [Progresión y backtracking](./progression-and-backtracking.md)
  - Orden de avance, gating, hub, retornos y filosofía de desbloqueo.
- [Personajes, combate y balance](./characters-combat-and-balance.md)
  - Roster jugable, combate, habilidades, energía, daño y balance base.
- [Controles e input](./controls-and-input.md)
  - Mando, teclado, apuntado y reglas de ejecución de habilidades.
- [UI, diálogos y guardado](./ui-dialogues-and-save.md)
  - HUD, minimapa, menús, bestiario, tabs, diálogos y ciclo de guardado/respawn.
- [Scoring](./scoring-system.md)
  - Fórmulas, rangos, score ideal, score real y datos persistidos del sistema de puntuación.
- [Estructura del mundo y reglas de room graph](./world-structure-and-room-graph-rules.md)
  - Mapa global, gramática de mapas internos y validación obligatoria.
- [Biomas](./biomes/README.md)
  - Índice de carpetas locales de cada bioma.
- [Presentación, audio y VFX](./presentation-audio-vfx.md)
  - Cámara, luces, parallax, dirección visual, música y VFX.
- [Arquitectura técnica](./technical-architecture.md)
  - React sobre Phaser, responsabilidades de runtime/UI y restricciones técnicas de plataforma.
- [Decisiones abiertas](./open-decisions.md)
  - Backlog real y decisiones pendientes, sin redefinir contenido cerrado.

## Rutas de cambio recomendadas

- Si cambias un nombre propio o un término base, empieza por `glossary-and-naming.md`.
- Si cambias la fantasía narrativa, el conflicto o el final, empieza por `story-and-world.md`.
- Si cambias el orden del juego, los bloqueos o el backtracking, empieza por `progression-and-backtracking.md`.
- Si cambias personaje jugable, habilidades o balance, empieza por `characters-combat-and-balance.md`.
- Si cambias input o control scheme, empieza por `controls-and-input.md`.
- Si cambias fórmulas o rangos de puntuación, empieza por `scoring-system.md`.
- Si cambias HUD, menús, bestiario o guardado, empieza por `ui-dialogues-and-save.md`.
- Si cambias un biome, entra en su carpeta y toca solo sus archivos locales salvo que la regla pase a ser global.

## Snapshot legado

- [Snapshot completo del GDD anterior](./archive/canuter-gdd-snapshot.md)
