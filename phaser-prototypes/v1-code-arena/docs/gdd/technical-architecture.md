# Arquitectura Técnica

## Regla principal

### Decisión técnica de UI: React sobre Phaser

La UI compleja del juego se implementará con React superpuesto al canvas de Phaser.

- Phaser se usará para gameplay, físicas, mundo, personajes, enemigos, colisiones, cámara y efectos de juego.
- React se usará para HUD, minimapa, menú de pausa, tabs, mapas, bestiario, scoring, settings, guardados, tooltips y pantallas de información.

## Motivo de la decisión

- Construir menús complejos con React será más flexible que intentar resolverlos con sprites, tiles o arte específico.
- React permite iterar más rápido en layouts, tabs, listas, tablas, barras, tooltips, paneles y navegación.
- React evita depender de encontrar assets visuales específicos para cada opción de menú.
- React permite que el menú de pausa, el Bestiario y el desglose de Scoring sean interfaces ricas, legibles y fáciles de mantener.

## Regla general

## Regla de reparto

- Todo lo que sea gameplay visual dentro del mundo se renderiza en Phaser.
- Todo lo que sea interfaz, información, navegación, menús o feedback de sistema se renderiza en React, salvo que una razón técnica concreta recomiende hacerlo en Phaser.

## HUD y minimapa

El HUD también podrá implementarse con React si resulta más cómodo: barras segmentadas de vida/energía, cooldowns, combo, score actual y mensajes contextuales.

El minimapa también podrá implementarse con React si se representa como una capa vectorial/DOM/SVG/canvas auxiliar sobre el juego. Esto puede facilitar pintar salas descubiertas, conectores, iconos y estados sin crear sprites específicos.

## Comunicación entre Phaser y React

La comunicación entre Phaser y React debe hacerse mediante un estado compartido o eventos explícitos.

Datos mínimos:

- vida,
- energía,
- sala actual,
- mapa descubierto,
- combo,
- score actual,
- cooldowns,
- enemigos descubiertos,
- estado de pausa,
- guardados.

## Restricciones de plataforma

La demo se diseña desktop first.

- Debe soportar pantalla completa.
- Debe funcionar con teclado y mando.
- El objetivo inicial no es móvil.
- La prioridad es que el juego se sienta bien en PC y web desktop.

El objetivo inicial no es móvil. La prioridad es que el juego se sienta bien en PC/web desktop.

Debe funcionar con teclado y mando.

## Flujo de arranque

Para la demo, el boot flow puede ser simple:

1. abrir juego,
2. ir directamente al menú principal,
3. cargar partida o empezar nueva partida.

No es obligatorio mostrar logo de estudio, logo de engine ni cinemática inicial antes del menú.
