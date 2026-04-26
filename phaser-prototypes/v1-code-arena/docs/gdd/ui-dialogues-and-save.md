# UI, Diálogos y Guardado

Dirección de UI, menú principal y consistencia visual

## Regla general

Toda la UI principal del juego se implementará con React superpuesto al canvas de Phaser.

Esto incluye:

- Menú principal.
- Menú de pausa in-game.
- HUD.
- Minimapa.
- Mapa grande.
- Tabs de talismanes, bestiario, scoring, settings y guardados.
- Cajas de diálogo.
- Pantallas de muerte, continuar y carga.
- Pantallas de settings y remapeo de controles.

Phaser seguirá siendo responsable del gameplay, mundo, físicas, personajes, enemigos, cámara y efectos integrados en escena.

React será responsable de la estructura visual, layout, botones, tabs, paneles, listas, textos, barras, tooltips y navegación de interfaz.

## Regla de consistencia visual

El menú principal y el menú in-game deben compartir una misma línea visual.

No deben sentirse como dos interfaces de juegos distintos.

Los botones, tabs, paneles, bordes, tipografía, colores, estados hover/selected/disabled, sonidos de UI y transiciones deben pertenecer al mismo sistema visual.

El estilo visual final de UI queda pendiente de definir, pero debe respetar estas reglas:

- Debe encajar con pixel art fantasy.
- Debe ser legible en pantalla grande y pequeña.
- Debe funcionar bien con mando y teclado.
- Debe permitir traducciones largas.
- Debe soportar settings, guardados, bestiario y scoring sin saturar.
- Debe tener estados claros para seleccionado, bloqueado, no descubierto, equipado y nuevo.

## HUD principal

HUD, minimapa, menú y guardado

El HUD debe ser mínimo y legible durante combate rápido.

Arriba a la izquierda aparecen dos barras horizontales:

- Barra roja de vida.
- Barra verde de energía.

Ambas barras se muestran en chunks o segmentos visibles. Cada punto de vida o energía corresponde a un segmento. Si el jugador tiene 10 de vida máxima, ve 10 segmentos. Si sube a 20 de vida máxima, la barra se alarga y muestra 20 segmentos. La energía funciona igual.

El objetivo es que el jugador pueda contar exactamente cuánta vida y energía tiene y calcular costes de habilidades sin depender solo de una barra abstracta.

## Feedback visual de combo en HUD

El jugador debe recibir feedback visual claro cuando entra en combo.

El jugador debe recibir feedback visual claro cuando entra en combo.

El feedback de combo forma parte del HUD y se implementará preferiblemente con React, igual que el resto de UI. Si se necesitan efectos muy visuales de partículas o vibración compleja, React puede combinarse con sprites o efectos renderizados por Phaser.

### Regla de aparición

Si el combo está por debajo de C, no se muestra indicador grande de combo.

Cuando el jugador llega a Combo C, aparece el indicador lateral de combo.

Ubicación sugerida: lado derecho de la pantalla, sin tapar gameplay importante.

### Elementos del indicador de combo

Elementos del indicador de combo:

- Letra/rango actual: C, B, A, S o S+.
- Contador de enemigos puntuables matados en la cadena actual.
- Puntos acumulados por ese combo.
- Multiplicador actual.
- Tiempo restante del timer de combo.

Multiplicador actual.

Comportamiento visual del contador:

### Comportamiento visual del contador

Cada vez que el jugador mata un enemigo puntuable durante el combo, aparece un número pequeño con el contador actualizado.

Ese número sale desde el centro o borde de la letra de rango y salta hacia arriba, como una pequeña partícula tipo pop.

Los números deben dispersarse levemente hacia izquierda o derecha para que parezcan vivos, pero sin molestar.

El contador debe ser discreto: visible si el jugador se fija, pero no invasivo.

Debajo o cerca de la letra de rango debe mostrarse el acumulado de puntos conseguidos por el combo actual.

Evolución visual por rango:

### Evolución visual por rango

Combo C:

- Aparece la letra C.
- Feedback simple.
- Sin efectos intensos.

Combo B:

- La letra B aparece con glow suave.
- El indicador empieza a sentirse más valioso.

Combo A:

- La letra A tiene glow más potente, preferiblemente cálido o rojizo.
- Puede empezar a moverse ligeramente.

Combo S:

- La letra S usa un efecto fuerte: fuego azul, brillo intenso o aura energética.
- Debe vibrar o moverse de forma clara.
- Puede aparecer texto Max o feedback equivalente.

Combo S+:

- La letra o insignia aumenta presencia visual.
- Puede combinar fuego azul con electricidad, arcos eléctricos o destellos.
- Debe comunicar estado excepcional.

Assets de rango:

### Assets de rango

Las letras C, B, A, S y S+ pueden ser sprites/imágenes diseñadas específicamente para que tengan más personalidad que texto normal.

Si no se encuentran assets adecuados, se podrán crear con Phaser o React usando texto estilizado, glow, transformaciones, sombras y animaciones.

La decisión final queda abierta, pero el sistema debe diseñarse para permitir sustituir texto por sprites sin cambiar la lógica de scoring.

Datos que alimentan el HUD de combo:

### Datos que alimentan el HUD de combo

- Combo actual.
- Rango de combo actual.
- Multiplicador actual.
- Puntos acumulados del combo actual.
- Último enemigo matado.
- Puntos generados por la última kill.
- Tiempo restante del timer de combo.

El HUD de combo debe ayudar al jugador a entender que conviene matar enemigos débiles primero para subir multiplicador y reservar enemigos valiosos para rangos altos.

## Minimapa de sala

Arriba a la derecha aparece el minimapa de la sala actual.

El minimapa muestra:

- Posición aproximada del jugador.
- Estructura aproximada de la sala.
- Plataformas descubiertas.
- Conexiones descubiertas hacia otras salas.
- Sala actual.
- Collectibles descubiertos.
- Miniboss o boss si aplica.

El minimapa no muestra:

- Enemigos normales.
- Conexiones no descubiertas.
- Salas no exploradas.
- Secretos no descubiertos.

En salas de una sola celda lógica, el minimapa debe tener un zoom que permita ver la sala completa.

En salas extendidas de varias celdas lógicas, el minimapa no tiene por qué mostrar toda la sala a la vez. Debe seguir al jugador y mostrar la zona cercana. Las conexiones se revelan cuando el jugador explora la zona correspondiente.

## Menú de pausa

El menú se abre con Start o Escape.

El menú ocupa aproximadamente el 90% de la pantalla, dejando un margen visible del juego detrás para mantener la sensación de pausa dentro del mundo, no de cambio total de escena.

El menú tiene seis tabs principales:

- Mapa.
- Talismanes.
- Bestiario.
- Scoring.
- Settings.
- Guardados.

En mando, L1 y R1 cambian de tab.

## Menú principal

El menú principal debe permitir como mínimo:

- Continuar.
- Nueva partida.
- Cargar partida.
- Settings.
- Salir.

Opcionales para demo:

- Créditos.
- Selector de idioma.
- Remapeo de controles desde menú principal.

Idioma.

Remapeo de controles desde menú principal.

Los settings del menú principal y los settings in-game deben compartir componentes React y comportamiento, pero no necesariamente mostrar exactamente las mismas opciones si alguna opción solo tiene sentido fuera de partida.

## Menú principal

El menú principal debe permitir como mínimo:

- Continuar.
- Nueva partida.
- Cargar partida.
- Settings.
- Salir.

Opcionales para demo:

- Créditos.
- Selector de idioma.
- Remapeo de controles desde menú principal.

Remapeo de controles desde menú principal.

Los settings del menú principal y los settings in-game deben compartir componentes React y comportamiento, pero no necesariamente mostrar exactamente las mismas opciones si alguna opción solo tiene sentido fuera de partida.

## Tab Mapa

La pestaña Mapa muestra primero el mapa global del mundo. Al inicio solo se puede seleccionar Bosc Antic. Los demás biomas aparecen cubiertos por niebla o bloqueados.

En el mapa global, el joystick selecciona bioma. L2 y R2 controlan zoom in y zoom out. X entra al mapa interno del bioma seleccionado.

En el mapa interno de bioma, solo aparecen salas descubiertas y conectores descubiertos. El jugador puede moverse de sala en sala con el joystick. L2 y R2 controlan zoom. X sobre una sala descubierta abre el mapa detallado de esa sala.

El mapa detallado de sala muestra lo explorado de esa sala, conexiones descubiertas, collectibles descubiertos y miniboss/boss si aplica. No muestra enemigos normales.

Círculo, Escape o Start sirven para volver o cerrar.

## Pantalla de talismanes

La pantalla de talismanes debe respetar la progresión real del roster para no spoilear personajes ni huecos todavía bloqueados.

Al inicio solo se muestra Canuter, centrado.

Canuter tiene cuatro huecos para talismanes de habilidad y una zona separada para talismanes de mejora.

No se deben mostrar huecos de Neret ni Bruna antes de desbloquearlos para evitar spoilers.

Cuando se desbloquea Neret, el menú pasa a mostrar dos columnas: Canuter y Neret.

Cuando se desbloquea Bruna, el menú pasa a mostrar tres columnas: Canuter, Neret y Bruna.

Cada personaje tiene sus cuatro huecos propios de habilidades.

Los talismanes de mejora se gestionan aparte y pueden asignarse al personaje que el jugador quiera potenciar.

## Tab Bestiario

El Bestiario funciona como una enciclopedia de enemigos descubiertos.

Un enemigo aparece en el Bestiario cuando el jugador lo encuentra por primera vez.

Cada entrada del Bestiario debe mostrar:

- Nombre del enemigo.
- Sprite o retrato del enemigo.
- Bioma donde aparece.
- Vida.
- Daño.
- Multiplicador de score.
- Puntos relativos que aporta según score base.
- Comportamiento básico.
- Patrón de movimiento.
- Ataques.
- Debilidades o consejos si aplica.
- Si cuenta para combo.
- Si cuenta para limpieza de sala.

Los critters también pueden aparecer en una sección separada de fauna/critters, pero deben marcar claramente que no dan score, no dan energía y no cuentan para limpieza.

Función de diseño del Bestiario:

### Función de diseño del Bestiario

- Ayudar al jugador a entender qué enemigos son más valiosos.
- Permitir que el jugador planifique combos.
- Explicar patrones sin obligar a aprender solo por prueba y error.
- Reforzar la sensación de colección tipo Pokédex, pero aplicada al combate y scoring.

## Tab Scoring

La pestaña Scoring muestra el desglose de puntuaciones del jugador.

Debe ayudar al jugador a entender de dónde salen sus puntos y cómo puede mejorar.

Debe mostrar, como mínimo:

- Mejor puntuación por sala.
- Mejor rango por sala.
- Mejor combo conseguido por sala.
- Mejor tiempo por sala limpiada.
- Si la sala fue completada sin recibir daño.
- Si la sala fue limpiada por completo.
- Score real de cada bioma.
- Rango de cada bioma.
- Score ideal de cada bioma.
- Porcentaje de completado de scoring por bioma.
- Puntuación conseguida contra cada mini jefe.
- Tiempo de derrota de cada mini jefe.
- Puntuación conseguida contra cada jefe.
- Tiempo de derrota de cada jefe.

La pestaña Scoring debe permitir seleccionar sala, bioma, mini jefe o jefe para ver un desglose más detallado.

Debe existir una opción de ayuda o explicación del scoring.

Esa explicación debe cubrir:

- Cómo funciona el score base.
- Cómo puntúan los enemigos.
- Cómo funcionan los multiplicadores de combo.
- Cómo puntúan mini jefes y jefes por tiempo.
- Cómo se calcula el score ideal de sala.
- Cómo se calcula el rango de sala.
- Cómo se calcula el score y rango de bioma.
- Qué significa S+.

Qué significa S+.

Qué significa S+.

Las fórmulas y thresholds exactos viven en `./scoring-system.md`.

El objetivo es que el jugador no tenga que inferir el sistema solo por prueba y error.

## Tipografía pixel art y sistema de diálogos

Los diálogos del juego serán pocos y breves, pero deben usar una tipografía pixel art coherente con la dirección visual.

La fuente de diálogos debe sentirse retro/fantasy y mantenerse legible en textos cortos.

Candidato principal de CraftPix:

### Candidato principal de CraftPix

Simplified Medieval Gothic Pixel Font For Video Games:

[Simplified Medieval Gothic Pixel Font For Video Games](https://craftpix.net/product/simplified-medieval-gothic-pixel-font-for-video-games/)

Este pack incluye alfabeto latino en mayúsculas y minúsculas y números 0-9, con estilo medieval/gothic pixel art pensado para narrativa, menús, diálogos, señales y quest logs.

Alternativa más decorativa:

### Alternativa más decorativa

Straight Pixel Gothic Font:

[Straight Pixel Gothic Font](https://craftpix.net/product/straight-pixel-gothic-font/)

Esta alternativa contiene símbolos básicos, puntuación, escritura latina y cirílica en formato `.otf`. Puede servir para títulos, pistas, scrolls o textos decorativos, pero puede ser menos limpia para diálogos frecuentes.

### Regla de implementación de diálogos

La fuente de diálogos debe tratarse como un asset propio del juego.

Si el pack viene como fuente instalable, se integrará directamente como fuente web/local del proyecto.

Si el pack viene como imágenes o sprites de letras, habrá que recortar cada carácter y crear un sistema de renderizado letra a letra.

El sistema de diálogo debe poder convertir un input de texto localizado en una secuencia de glyphs renderizados con la fuente pixel art.

El sistema debe soportar, como mínimo:

- Letras latinas.
- Números.
- Puntuación básica.
- Espacios.
- Saltos de línea.
- Caracteres acentuados necesarios para catalán, castellano, francés, portugués e italiano.

Si el pack no contiene todos los caracteres necesarios para las localizaciones, habrá que crear glyphs extra manualmente o usar fallback visual coherente.

## Localización operativa y font

Nombres propios de personajes, lugares, biomas, jefes y enemigos únicos no se traducen.

Textos, roles, objetos, ataques, habilidades, UI, settings y descripciones sí se traducen.

Nombres propios de personajes, lugares, biomas, jefes y enemigos únicos no se traducen.

Textos, roles, objetos, ataques, habilidades, UI, settings y descripciones sí se traducen.

La font pixel art debe soportar como mínimo los caracteres necesarios para catalán, castellano e inglés.

Caracteres mínimos obligatorios:

- á, é, í, ó, ú.
- à, è, ò.
- ä, ë, ï, ö, ü.
- ç.
- ñ.
- l·l.
- Apóstrofe recto: '.
- Apóstrofe tipográfico: ’.
- ¿, ?.
- ¡, !.
- Comillas simples y dobles.
- Guion.
- Punto.
- Coma.
- Dos puntos.
- Punto y coma.

También deben existir versiones mayúsculas cuando aplique:

- Á, É, Í, Ó, Ú.
- À, È, Ò.
- Ç.
- Ñ.

Si el pack de font no incluye alguno de estos caracteres, habrá que crear glyphs manualmente.

Ejemplo: si falta la ñ, se crea a partir de la n añadiendo virgulilla y se mapea como carácter propio.

Ejemplo: si faltan vocales acentuadas, se crean versiones con accent obert y accent tancat según corresponda.

El sistema de texto debe mapear cada carácter del string localizado al glyph correcto de la font.

Las traducciones largas pueden romper layouts. La primera versión aceptará este riesgo y se ajustará durante testing. Los componentes React deben diseñarse con suficiente flexibilidad para textos más largos que el castellano/catalán.

## Diálogos y onboarding

Tipografía pixel art y sistema de diálogos

Los textos de diálogo, carteles y ayudas usan una caja inferior de texto estilo RPG clásico.

La caja aparece solo cuando hay texto que mostrar.

La caja ocupa todo el ancho de la pantalla y aproximadamente el 20-25% inferior de la pantalla.

- aparece solo cuando hay texto,
- ocupa el ancho completo y aproximadamente el 20-25% inferior,
- el texto sale con efecto de escritura,
- X/A completa la frase si aún se está escribiendo,
- X/A avanza al siguiente mensaje si la frase ya está completa.

El texto aparece progresivamente con efecto de escritura.

En Settings debe poder configurarse la velocidad de aparición del texto.

Si el texto todavía está escribiéndose y el jugador pulsa X/A, la frase se completa inmediatamente.

Si el texto ya está completo y el jugador pulsa X/A, se avanza al siguiente mensaje.

Si el jugador quiere saltar texto rápido, puede pulsar repetidamente X/A para completar y avanzar mensajes.

Los diálogos muestran nombre del hablante y mensaje. No hace falta retrato en la primera demo.

En diálogos se muestra el nombre del hablante seguido de dos puntos y el mensaje.

No se mostrarán retratos/avatar de diálogo en la primera demo.

Los carteles, señales, inscripciones o ayudas también usan esta misma caja inferior.

El onboarding debe ser ligero, diegético y no invasivo.

## Guardado, muerte y respawn

Datos guardados de scoring

El juego guarda automáticamente cada vez que el jugador cambia de sala.

El autosave siempre escribe sobre un único Autosave Slot. No crea múltiples autosaves.

En la pestaña Guardados se muestra primero el Autosave Slot. Después aparece un separador visual. Debajo aparecen los Custom Save Slots.

El jugador puede crear guardados manuales en slots custom para conservar puntos concretos de progreso.

El jugador puede cargar tanto el autosave como cualquier guardado manual existente.

Al morir, aparece un menú de muerte con dos opciones:

- Continuar: carga el último autosave.
- Salir: vuelve al menú principal.

Al cargar un autosave, se restaura el estado guardado al cambiar de sala. El score parcial de la sala actual se pierde si el jugador muere antes de archivarlo.

## Ownership

Este archivo es canónico para HUD, minimapa, menú de pausa, mapa, bestiario, pantallas de talismanes, diálogos, tipografía y ciclo de guardado/respawn.

Las fórmulas numéricas del scoring viven en `./scoring-system.md`.
