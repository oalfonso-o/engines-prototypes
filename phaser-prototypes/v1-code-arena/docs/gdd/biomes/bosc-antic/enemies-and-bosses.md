# Enemigos y Jefes del Bosc Antic

## Catálogo de enemigos y critters del Bosc Antic

Este catálogo define las herramientas de enemigo disponibles para diseñar las salas del Bosc Antic. No asigna todavía enemigos a layouts exactos de sala.

## Regla general

Las habilidades de los jefes deben estar relacionadas con las animaciones reales disponibles en sus spritesheets.

No se deben inventar ataques que requieran animaciones inexistentes si no pueden resolverse claramente con Phaser mediante efectos, proyectiles, partículas o movimiento programado.

El diseño debe partir de las animaciones disponibles y añadir efectos programados solo cuando encaje visualmente.

## Pack principal de enemigos normales

[Forest Enemies Pixel Art Sprite Sheet Pack](https://craftpix.net/product/forest-enemies-pixel-art-sprite-sheet-pack/)

Este pack será la base principal de enemigos normales del Bosc Antic. Contiene serpiente, dos flores y tres guerreros tribales con lanza, martillo y palo. El estilo es pixel art y encaja con la dirección visual actual.

### 1. Culebra de Raíz

Asset visual: serpiente del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: enemigo básico de suelo.  
Tamaño: pequeño. Aproximadamente 0,5 veces la altura de Canuter.  
Vida: 1 vez vida básica de enemigo de bosque.  
Daño: 1 vez daño básico de enemigo de bosque.  
Movimiento: patrulla horizontal lenta. Gira al tocar borde o pared.  
Ataque: contacto. No ataca activamente.  
Función: primer enemigo tutorial. Enseña que tocar enemigos hace daño y que hay que atacar.  
Uso recomendado: salas iniciales, grupos pequeños y plataformas bajas.

### 2. Flor Mordedora

Asset visual: primera flor del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: torreta vegetal corta.  
Tamaño: medio-bajo. Aproximadamente 0,7 veces la altura de Canuter.  
Vida: 1,5 veces vida básica de enemigo de bosque.  
Daño: 1 vez daño básico de enemigo de bosque.  
Movimiento: estática.  
Ataque: mordisco frontal corto si el jugador entra en rango.  
Patrón: idle, avisa abriéndose, muerde, vuelve a idle.  
Función: enseñar timing. El jugador debe entrar, golpear y salir.  
Uso recomendado: zonas estrechas, plataformas pequeñas y cerca de saltos.

### 3. Flor Espora

Asset visual: segunda flor del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: atacante a distancia.  
Tamaño: medio. Aproximadamente 0,75 veces la altura de Canuter.  
Vida: 1,5 veces vida básica de enemigo de bosque.  
Daño: 0,8 veces daño básico de enemigo de bosque por proyectil.  
Movimiento: estática.  
Ataque: dispara esporas lentas en línea recta.  
Cadencia: baja.  
Función: enseñar proyectiles y presión de sala.  
Uso recomendado: detrás de enemigos de suelo, encima de plataformas y protegiendo rutas.

### 4. Tribal del Palo

Asset visual: guerrero tribal con palo del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: melee básico humanoide.  
Tamaño: medio. Aproximadamente 0,9 veces la altura de Canuter.  
Vida: 2 veces vida básica de enemigo de bosque.  
Daño: 1,2 veces daño básico de enemigo de bosque.  
Movimiento: patrulla. Si ve al jugador, camina hacia él.  
Ataque: golpe corto frontal.  
Función: primer enemigo de combate real.  
Uso recomendado: salas centrales, grupos de 2 o 3 y combinado con culebras.

### 5. Tribal Lancero

Asset visual: guerrero tribal con lanza del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: melee de alcance.  
Tamaño: medio. Aproximadamente igual que Tribal del Palo.  
Vida: 2 veces vida básica de enemigo de bosque.  
Daño: 1,4 veces daño básico de enemigo de bosque.  
Movimiento: patrulla y persigue al jugador en rango medio.  
Ataque: estocada frontal más larga que el palo.  
Función: castigar acercarse de frente sin pensar.  
Uso recomendado: pasillos, plataformas horizontales y antesalas de jefe.

### 6. Tribal Martillo

Asset visual: guerrero tribal con martillo del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: enemigo pesado del bosque.  
Tamaño: grande. Aproximadamente 1,05 veces la altura de Canuter, más ancho.  
Vida: 3 veces vida básica de enemigo de bosque.  
Daño: 2 veces daño básico de enemigo de bosque.  
Movimiento: lento.  
Ataque: martillazo frontal con pequeña área de impacto.  
Patrón: avisa, levanta martillo, golpea, queda vulnerable.  
Función: enseñar lectura de ataques pesados.  
Uso recomendado: salas de presión, final de rutas y mini arenas.

## Pack opcional de apoyo

[Field Enemies Game Sprite Sheets Pixel Art](https://craftpix.net/product/field-enemies-game-sprite-sheets-pixel-art/)

Este pack solo se usará si al probarlo en juego encaja visualmente. Sirve para añadir variedad sin convertirlo en la base del bioma.

### 7. Bicho de Campo

Rol: enemigo pequeño de relleno.  
Tamaño: pequeño. Aproximadamente 0,45 veces la altura de Canuter.  
Vida: 0,75 veces vida básica de enemigo de bosque.  
Daño: 0,75 veces daño básico de enemigo de bosque.  
Movimiento: patrulla corta.  
Ataque: contacto.  
Función: añadir densidad sin subir demasiado la dificultad.

### 8. Saltador de Hierba

Rol: enemigo móvil.  
Tamaño: pequeño-medio. Aproximadamente 0,6 veces la altura de Canuter.  
Vida: 1 vez vida básica de enemigo de bosque.  
Daño: 1 vez daño básico de enemigo de bosque.  
Movimiento: saltos cortos periódicos.  
Ataque: contacto durante el salto.  
Función: enseñar enemigos con trayectoria vertical.

### 9. Bestia de Zarza

Rol: tanque pequeño opcional.  
Tamaño: medio. Aproximadamente 0,85 veces la altura de Canuter.  
Vida: 2,5 veces vida básica de enemigo de bosque.  
Daño: 1,5 veces daño básico de enemigo de bosque.  
Movimiento: lento.  
Ataque: carga corta si el jugador está cerca.  
Función: variante pesada antes de introducir tribales fuertes.

## Critters y fauna interactiva

Critters y fauna interactiva

Tiny Monsters Pixel Art Pack:

[Tiny Monsters Pixel Art Pack](https://craftpix.net/product/tiny-monsters-pixel-art-pack/)

Los tiny monsters no son enemigos principales. Se usarán como critters o fauna viva del bosque.

Reglas generales de critters:

- No dan score.
- No dan energía.
- No dan vida.
- No cuentan para limpiar sala.
- No bloquean progresión.
- Se pueden matar, pero no tienen recompensa.
- Sirven para que el bosque parezca vivo.

Critters candidatos:

- Minidiablillo de Hoja: corre de lado a lado y huye si el jugador se acerca.
- Bicho Máscara: se acerca al jugador como si fuera agresivo, pero no hace daño.
- Larva Oscura: aparece cerca de raíces corruptas y sugiere que la corrupción está empezando.
- Polilla de Raíz: vuela de forma errática cerca de flores, faroles o zonas húmedas.

Minidiablillo de Hoja, Bicho Máscara, Larva Oscura, Polilla de Raíz.

## Mini jefe: Aranya d’Escorça

Nombre propio: Aranya d’Escorça.

Tipo: mini jefe del Bosc Antic.

Asset principal:

Pixel Art Monster Enemy Game Sprites:
[Pixel Art Monster Enemy Game Sprites](https://craftpix.net/product/pixel-art-monster-enemy-game-sprites/)

Carpeta candidata: `PNG/spider/`.

Animaciones disponibles:

- Idle.
- Walk.
- Attack.
- Hurt.
- Death.
- Web.

Concepto visual:

Aranya d’Escorça es una araña enorme de corteza, musgo y resina que vive entre las raíces y troncos del Bosc Antic. No es una araña normal: es una criatura antigua ligada a La Copa Mare y deformada por L’Arrel Negra.

Función de diseño:

- Primer combate de jefe menor.
- Enseña control de espacio.
- Introduce ralentización o resina.
- Obliga a usar dash y posicionamiento.
- Prepara al jugador para arenas con ataques telegráficos.

### Ataques traducibles de Aranya d’Escorça

Nombre de trabajo en catalán: Mossegada d’Escorça.  
Función: mordisco frontal.  
Animación base: Attack.  
Comportamiento: la araña avisa, ataca hacia delante y queda brevemente vulnerable.

Nombre de trabajo en catalán: Fil de Resina.  
Función: disparo de telaraña/resina.  
Introduce ralentización/resina.  
Animación base: Web.  
Comportamiento: lanza una línea o proyectil de resina que ralentiza a Canuter si impacta o deja una zona pegajosa breve en el suelo.

Nombre de trabajo en catalán: Salt Curt.  
Función: salto corto hacia el jugador.  
Animación base: Walk/Attack más movimiento programado en Phaser.  
Comportamiento: la araña salta una distancia corta para reposicionarse o cerrar espacio.

Nombre de trabajo en catalán: Crida de Larves.  
Función: invocar adds pequeños.  
Función: invocar adds.  
Animación base: Idle o Attack.  
Comportamiento: invoca 2 o 3 critters corruptos, culebras pequeñas o fauna menor para crear presión.

Fase final:

Al bajar de cierto umbral de vida, aumenta frecuencia de Fil de Resina y deja más zonas pegajosas. No debe convertirse en combate largo; sigue siendo mini jefe.

## Jefe final del Bosc Antic: Mare Espina

Nombre propio: Mare Espina.

Tipo: jefe final del Bosc Antic.

Asset principal:

Pixel Art Monster Enemy Game Sprites:
[Pixel Art Monster Enemy Game Sprites](https://craftpix.net/product/pixel-art-monster-enemy-game-sprites/)

Carpeta candidata: `PNG/ent/`.

Animaciones disponibles:

- Idle.
- Walk.
- Attack.
- Hurt.
- Death.

Concepto visual:

Mare Espina es un árbol viviente antiguo, grande y corrompido por L’Arrel Negra. Debe sentirse como una criatura vegetal maternal y protectora que ha sido deformada por la corrupción, no como un monstruo malvado sin más.

Función de diseño:

- Cerrar el Bosc Antic.
- Validar todo lo aprendido con Canuter.
- Combinar movimiento, ataque circular, curación, onda de corte y golpe cargado.
- Presentar el primer combate de jefe grande.
- Justificar el desbloqueo de Neret al derrotarla.

### Ataques traducibles de Mare Espina

Nombre de trabajo en catalán: Cop de Branca.  
Función: golpe frontal con rama/brazo.  
Animación base: Attack.  
Comportamiento: ataque frontal ancho, muy telegráfico, que obliga a esquivar o colocarse detrás/fuera de rango.

Nombre de trabajo en catalán: Arrels del Sòl.  
Función: raíces que salen del suelo.  
Animación base: Attack más efectos Phaser.  
Comportamiento: Mare Espina golpea el suelo y aparecen raíces en posiciones marcadas previamente. El jugador debe leer las marcas y moverse.

Nombre de trabajo en catalán: Pluja d’Espines.  
Función: proyectiles de espinas/semillas.  
Función: proyectiles de espinas o semillas.  
Animación base: Attack más proyectiles Phaser.  
Comportamiento: lanza espinas en arco, desde arriba o desde laterales. Sirve para crear presión sin depender de movimiento rápido del boss.

Nombre de trabajo en catalán: Crida del Bosc.  
Función: invocar adds.  
Animación base: Idle o Attack.  
Comportamiento: invoca Culebras de Raíz, Flores Espora o critters corruptos. No debe saturar la pelea; debe abrir ventanas para combo y energía.

Fase final: L’Arrel Negra.  
Función: intensificar la pelea.  
Animación base: mismas animaciones con tint, overlay y partículas.  
Comportamiento: al bajar de vida, Mare Espina se oscurece, aumenta la frecuencia de raíces y espinas, y aparecen partículas negras/verdes. Puede usar vibración/camera shake suave.

## Reglas de arena de Mare Espina

- La arena debe ser clara y legible.
- Debe tener espacio suficiente para dash.
- Debe evitar plataformas excesivamente complejas. El reto principal debe venir de patrones, raíces, espinas y adds, no de saltos injustos.
- Puede tener pequeñas plataformas laterales si ayudan a esquivar o usar onda de corte, pero el combate debe ser viable desde suelo.

## Recompensas de Mare Espina

- Desbloqueo de Neret.
- Acceso narrativo hacia Cim Gelat.
- Cierre del Bosc Antic.
- Registro de score de jefe basado en tiempo.

## Score de jefes del Bosc Antic

Aranya d’Escorça usa la fórmula de mini jefe:

`score mini jefe = max(0, score base × multiplicador mini jefe - segundos de combate × penalizador temporal mini jefe)`.

Mare Espina usa la fórmula de jefe:

`score jefe = max(0, score base × multiplicador jefe - segundos de combate × penalizador temporal jefe)`.

Los valores iniciales siguen siendo:

- Mini jefe: x10 contra score base.
- Jefe: x20 contra score base.
- Penalizador temporal inicial: x4 por segundo.

## Resumen de herramientas del Bosc Antic

Enemigos principales:

- Culebra de Raíz.
- Flor Mordedora.
- Flor Espora.
- Tribal del Palo.
- Tribal Lancero.
- Tribal Martillo.

Enemigos opcionales:

- Bicho de Campo.
- Saltador de Hierba.
- Bestia de Zarza.

Bicho de Campo, Saltador de Hierba, Bestia de Zarza.

Critters:

- Minidiablillo de Hoja.
- Bicho Máscara.
- Larva Oscura.
- Polilla de Raíz.

Mini jefe:

- Aranya d’Escorça.

Jefe:

- Mare Espina.
