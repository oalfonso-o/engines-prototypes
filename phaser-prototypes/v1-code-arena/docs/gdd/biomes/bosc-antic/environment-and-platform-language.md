# Entorno y Lenguaje de Plataformas del Bosc Antic

Catálogo de obstáculos y lenguaje de plataformas del Bosc Antic

## Propósito

Esta sección define las herramientas de construcción disponibles para diseñar las salas del Bosc Antic. No cierra todavía el layout exacto de cada sala.

## Obstáculos y elementos interactivos

Espines de l’Arrel, Planta Trampa, Arrel danyosa.

### 1. Espines de l’Arrel

Assets candidatos: `Objects_Animated/Spike1`, `Spike2`, `Spike3`, `Spike4`.

Función: obstáculo dañino fijo.

Comportamiento:

- Hace daño al tocar.
- No se puede destruir.
- No cuenta como enemigo.
- No da score.
- Sirve para enseñar precisión de salto, dash y posicionamiento.

Uso recomendado:

- Desde sala 04 en adelante.
- Uso moderado en la demo.
- Mayor presencia en salas 12, 13 y 15.

Regla de diseño: no abusar de pinchos. Canuter debe sentirse como combate rápido, no como plataformas castigadoras.

### 2. Planta Trampa

Asset candidato: `Objects_Animated/Plant/trap_plant`.

Función: obstáculo o enemigo ambiental.

Comportamiento:

- Parece decoración.
- Se activa cuando Canuter entra en rango.
- Muerde o golpea.
- Hace daño.
- No se mueve.

Decisión provisional: tratarla como enemigo puntuable menor si encaja bien con el sistema de combo.

Uso recomendado:

- Sala 04 para enseñar timing.
- Sala 07 para castigar curación mal posicionada.
- Sala 12 combinada con proyectiles.
- Sala 15 como presión previa al jefe.

### 3. Arrels Negres

Asset candidato: `Trees and Bushes Pixel Art for Platformer`, carpeta `4 Roots`.

Función: raíz corrupta, bloqueo vegetal, decoración o daño leve según variante.

Tipos:

- Arrel decorativa: solo ambientación.
- Arrel bloqueig: bloquea camino hasta volver con Bruna u otra habilidad.
- Arrel danyosa: hace daño al tocar.

Uso recomendado:

- Sala 01 como bloqueo hacia la izquierda.
- Sala 08 como corrupción central.
- Sala 13 como zona inferior corrupta.
- Sala 16 como parte de la arena de Mare Espina.

Regla de diseño: priorizar raíces decorativas y de bloqueo. No abusar de raíces dañinas para no duplicar el rol de los pinchos.

### 4. Porta d’Arrel

Asset candidato: `Objects/128/object_0000_door.png` combinado con raíces.

Función: puerta o bloqueo de progresión.

Comportamiento:

- Puede estar cerrada por raíces o corrupción.
- Puede requerir Bruna, talismán, jefe derrotado o evento narrativo.
- No debe abrirse al inicio si es ruta de backtracking.

Uso recomendado:

- Sala 01 hacia la izquierda.
- Accesos a salas ocultas.
- Rutas futuras de backtracking.

### 5. Pont Vell

Assets candidatos: `bridge corner/filler` del tileset.

Función: plataforma puente.

Comportamiento:

- Plataforma estable.
- No rompible por defecto.
- Sirve para huecos, rutas elevadas y conexión entre troncos o ramas.

Uso recomendado:

- Sala 03, Pas de la Soca.
- Sala 04, Niu de Fulles.
- Sala 09, Mirador de l’Arrel.
- Sala 12, Brancam Alt.

### 6. Escala de Soca

Assets candidatos: `stairway filler/corners` del tileset.

Función: escalera, bajada, subida o transición visual.

Comportamiento:

- Puede ser decoración.
- Puede marcar transición entre sala 00 y sala 01.
- Puede usarse como punto de interacción: colocarse encima y pulsar abajo.

Uso recomendado:

- Conexión Refugi de la Copa Mare hacia sala 01.
- Entradas verticales.
- Zonas de transición entre alturas.

### 7. Cristall de Savia

Asset candidato: `Objects_Animated/Crystal`.

Función principal: nodo mágico de teletransporte.

Comportamiento:

- Al descubrirlo físicamente, se añade al mapa como punto de viaje rápido.
- Puede brillar cuando está activo.
- No debe confundirse con pickup normal de energía.

Uso recomendado:

- Sala 00: teletransporte principal.
- Sala 05: primer teletransporte de campo.
- Sala 09 o 10: teletransporte medio u opcional.
- Sala 15: teletransporte previo al jefe.

Regla de diseño: fijar Cristall de Savia como símbolo de teletransporte para no mezclar demasiadas funciones visuales.

### 8. Caixa de Botí

Asset candidato: `Objects/32/object_0009_lootbox.png`.

Función: contenedor de recompensa.

Comportamiento:

- Contiene talismán, mejora o collectible.
- Se abre una vez.
- Queda registrada como abierta.
- Aparece en minimapa o mapa si se ha descubierto.

Aparece en minimapa/mapa si se ha descubierto.

Uso recomendado:

- Sala 03: Talismán del Corte Circular.
- Sala 06: Talismán de Savia.
- Sala 09: Talismán del Corte Lejano.
- Sala 10: Talismán de Vitalidad Menor.
- Sala 14: Talismán del Golpe Pesado.

### 9. Cors de Savia

Asset candidato: `Objects_Animated/Heart`.

Función: pickup de vida.

Comportamiento:

- Recupera vida.
- No aumenta vida máxima.
- No cuenta como recompensa principal.
- Puede reaparecer o ser único según sala.

Uso recomendado:

- Uso muy limitado.
- Posible antes de jefe o en sala difícil.
- Candidatos: sala 13 o sala 15.

### 10. Moneda / Fulla Daurada

Asset candidato: `Objects_Animated/Coin`.

Función: pendiente.

Decisión provisional: no usar economía ni monedas como sistema principal en la demo.

Si se usan, deben ser guía visual, secreto menor o collectible sin tienda. No abrir economía todavía.

### 11. Pedra Viva / Pedra Trencable

Asset candidato: `Objects_Animated/Stone`.

Función posible: bloque rompible, obstáculo móvil, piedra decorativa o proyectil de jefe.

Uso recomendado para la demo:

- Pedra Trencable como bloque que se rompe con Talismán del Golpe Pesado.
- Aparece después de sala 14.
- Puede usarse en sala 14 para probar golpe cargado y en sala 15 como preparación final.

### 12. Senyals del Bosc

Assets candidatos: señales del tileset y del environment pack.

Función: onboarding diegético.

Comportamiento:

- Carteles breves.
- Enseñan controles o pistas sin popup invasivo.
- Pueden contener frases muy cortas.

Uso recomendado:

- Sala 01: moverse, saltar, atacar.
- Sala 03: usar talismán.
- Sala 06: curarse.
- Sala 09: ataque a distancia.
- Sala 15: aviso de jefe.

### 13. Herba, Arbustos i Branques

Assets candidatos:

- `Forest Pixel Art Environment Asset Set`
- `Trees and Bushes Pixel Art for Platformer`

Forest Pixel Art Environment Asset Set.

Función: decoración, foreground, background y variación visual.

Comportamiento:

- No bloquean.
- No dañan.
- No dan score.
- Dan vida al Bosc Antic.

Uso recomendado:

- Todas las salas.
- Deben variar por zona para que no todas las salas parezcan iguales.

## Jerarquía de uso de obstáculos

Daño directo:

- Espines de l’Arrel.
- Planta Trampa.
- Arrel danyosa.

Bloqueo/progresión:

- Porta d’Arrel.
- Arrel bloqueig.
- Pedra Trencable.

Movimiento/plataforma:

- Pont Vell.
- Escala de Soca.

Recompensa:

- Caixa de Botí.
- Cors de Savia.
- Cristall de Savia.

Caixa de Botí, Cors de Savia, Cristall de Savia.

Sistema:

- Cristall de Savia como teletransporte.

Onboarding:

- Senyals del Bosc.

Decoración:

- Herba, arbustos, branques y raíces decorativas.

Herba, arbustos, branques, raíces decorativas.

## Lenguaje de plataformas del Bosc Antic

Lenguaje de plataformas del Bosc Antic

El GDD no cierra cada sala tile a tile. Define un lenguaje de formas base que el level designer puede combinar libremente sala a sala.

### Formas base permitidas

1. Suelo plano
2. Plataforma corta
3. Plataforma larga
4. Escalón
5. Pared vertical
6. Pozo o caída
7. Techo bajo
8. Puente
9. Bajada o escalera visual
10. Columna o tronco
11. Plataforma flotante
12. Cornisa
13. Pasillo estrecho
14. Sala vertical
15. Arena de combate

### Detalle de uso por forma

#### 1. Suelo plano

Función: combate básico, lectura clara, tutorial y arenas simples.

Uso recomendado:

- Salas 01, 02 y zonas iniciales.

#### 2. Plataforma corta

Función: salto básico, separación de enemigos, pequeñas rutas superiores.

Uso recomendado:

- Salas 03, 04, 07 y 09.

#### 3. Plataforma larga

Función: zona de combate horizontal, grupos de enemigos y persecución.

Uso recomendado:

- Salas 05, 08, 11 y 15.

#### 4. Escalón

Función: enseñar cambio de altura sin exigir precisión.

Uso recomendado:

- Primeras salas y transiciones suaves.

#### 5. Pared vertical

Función: límite de sala, zona de rebote visual, futura lectura de rutas con Neret.

Regla: antes de desbloquear Neret, no exigir wall jump para avanzar por ruta principal.

#### 6. Pozo o caída

Función: crear riesgo vertical y separar zonas.

Uso recomendado:

- Moderado en Bosc Antic.
- Más fuerte en salas 12 y 13.

#### 7. Techo bajo

Función: limitar salto, forzar combate horizontal y controlar altura de la cámara.

Uso recomendado:

- Pasillos, cuevas vegetales y rutas inferiores.

#### 8. Pont Vell / puente

Función: conectar huecos, cruzar raíces, dar sensación de estructura construida o natural.

Uso recomendado:

- Salas 03, 04, 09 y 12.

#### 9. Escala visual o bajada

Función: transición entre alturas o salas.

Uso recomendado:

- Sala 00 a sala 01 y zonas de conexión vertical.

#### 10. Columna / tronco

Función: romper línea de visión, separar enemigos, crear cobertura visual y dar identidad forestal.

Uso recomendado:

- Salas 05, 08, 11 y 16.

#### 11. Plataforma flotante

Función: combate vertical, enemigos a distancia, secretos altos.

Uso recomendado:

- Sala 09 y ruta superior.

#### 12. Cornisa

Función: punto de aterrizaje, secreto, recompensa o transición a ruta lateral.

Uso recomendado:

- Salas 04, 09, 12 y secretos.

#### 13. Pasillo estrecho

Función: presión, enemigos frontales, Tribal Lancero, Flor Mordedora o trampas.

Uso recomendado:

- Salas 07, 11, 13 y antesalas.

#### 14. Sala vertical

Función: enseñar subida, cámara vertical y lectura de alturas.

Regla: antes de Neret, debe poder resolverse con salto, doble salto y dash normal. No exigir wall jump.

#### 15. Arena de combate

Función: combate fuerte, cierre de sala, mini jefe o jefe.

Uso recomendado:

- Sala 15 como repaso fuerte.
- Sala 16 como arena de Mare Espina.

## Restricciones de diseño para Bosc Antic

- Al principio, usar plataformas simples y lectura clara.
- Antes de Talismán de Savia, evitar salas demasiado castigadoras.
- Antes de Neret, no exigir wall jump.
- Antes de Bruna, no exigir romper bloqueos mágicos para avanzar en ruta principal.
- Antes del Talismán del Golpe Pesado, no exigir romper piedras en ruta principal.
- Los secretos sí pueden insinuar rutas futuras que todavía no se pueden abrir.
- Los obstáculos deben reforzar el combate rápido, no sustituirlo por plataformas demasiado punitivas.

El level designer tiene libertad para combinar estas formas, pero cada sala debe declarar qué formas base usa y con qué intención.
