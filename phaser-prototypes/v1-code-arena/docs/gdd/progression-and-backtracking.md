# Progresión y Backtracking

## Regla general

La progresión debe justificar siempre tres cosas:

- por qué el jugador puede avanzar ahora,
- por qué antes no podía,
- y qué nueva lectura del mundo gana cuando vuelve atrás.

La historia debe apoyar esa progresión, pero no bloquear el ritmo.

## Ruta principal del juego

1. Bosc Antic: se presenta la corrupción y se cierra el tutorial jugable.
2. Cim Gelat: Canuter consigue la prueba o insignia necesaria para poder investigar las minas.
3. Mina Enfonsada: se descubre que el origen real del problema está más abajo.
4. Regreso al Bosc Antic: un sabio interpreta el hallazgo y revela el Nucli de la Vena.
5. Nucli de la Vena: tramo final del juego y resolución del conflicto.

## Progresión narrativa principal

1. Bosc Antic: se presenta el problema de las raíces enfermas.
2. Cim Gelat: Canuter busca el objeto necesario para ganarse el permiso de entrada a las minas.
3. Mina Enfonsada: Canuter investiga el origen real de la corrupción.
4. Regreso al Bosc Antic: el sabio interpreta el descubrimiento.
5. Nucli de la Vena: se revela el cuarto bioma y se prepara el final del juego.

## Regla narrativa

La historia debe justificar la progresión del mapa, pero no debe frenar el ritmo. Cada bloque narrativo debe responder a una pregunta práctica del jugador: dónde tengo que ir, por qué no puedo entrar todavía, qué necesito conseguir, qué nueva zona se ha abierto y qué amenaza estoy siguiendo.

## Filosofía de gating

- La ruta principal nunca debe bloquearse con una habilidad que el juego aún no ha enseñado.
- Los secretos sí pueden insinuar rutas futuras que se abrirán más adelante.
- Los secretos sí pueden insinuar rutas futuras que todavía no se pueden abrir.
- Los bloqueos deben leerse visualmente antes de abrirse: puerta de raíz, sello mágico, roca rompible, salto imposible, pared de wall jump, etc.
- El jugador debe entender qué clase de herramienta le falta, aunque todavía no la tenga.

## Hub y estructura de retorno

`Refugi de la Copa Mare` funciona como hub seguro y sala de referencia emocional.

- No puntúa como sala de combate.
- Conecta con `Sala 01` del Bosc Antic.
- Puede servir como punto de teletransporte principal y centro de retorno.

El detalle escénico y narrativo del hub vive en `./biomes/bosc-antic/hub-and-intro.md`.

## Reglas de backtracking

- El backtracking debe abrir rutas nuevas, no solo obligar a repetir distancia.
- Los retornos importantes deben apoyarse en teletransportes, shortcuts o reapertura de rutas.
- Un bloqueo temprano puede sembrarse en el primer bioma y resolverse varios biomas después si la lectura sigue clara.
- La vuelta a una sala ya conocida debe ofrecer una recompensa real: acceso nuevo, talismán, atajo, secreto o comprensión del mapa.

## Ownership

Este archivo es canónico para la progresión global y la filosofía de gating.

Los bloqueos concretos de cada bioma viven dentro de su carpeta local.
