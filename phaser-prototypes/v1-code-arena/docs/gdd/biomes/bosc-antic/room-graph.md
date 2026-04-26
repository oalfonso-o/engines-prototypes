# Room Graph del Bosc Antic

Grid interna: 10 columnas x 5 filas.  
Total: 16 salas.  
Spawn: 01.  
Jefe: 16.

## Tabla de salas y conexiones

| Fila / Col | C01 | -> | C02 | -> | C03 | -> | C04 | -> | C05 | -> | C06 | -> | C07 | -> | C08 | -> | C09 | -> | C10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| F02 |  |  | 03 | - | 04 | - | 09 |  |  |  |  |  |  |  |  |  |  |  |  |
| v |  |  | &#124; |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |
| F03 | 01 | - | 02 | - | 05 | - | 08 | - | 11 | - | 12 | - | 15 | - | 16 |  |  |  |  |
| v |  |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |
| F04 |  |  | 06 | - | 07 | - | 10 | - | 13 | - | 14 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F05 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

Nota: en Google Docs los conectores verticales pueden verse como barras simples en filas intermedias. La tabla debe interpretarse junto con la lista de conexiones validadas.

Nota: esta tabla debe interpretarse junto con la lista de conexiones validadas. Los números repetidos forman una misma sala extendida siempre que sean contiguos ortogonalmente.

## Conexiones validadas

01 conecta con 02.  
02 conecta con 01, 03, 05 y 06.  
03 conecta con 02 y 04.  
04 conecta con 03, 05 y 09.  
05 conecta con 02, 04, 07 y 08.  
06 conecta con 02 y 07.  
07 conecta con 05, 06 y 10.  
08 conecta con 05, 09, 10 y 11.  
09 conecta con 04 y 08.  
10 conecta con 07, 08 y 13.  
11 conecta con 08, 12 y 13.  
12 conecta con 11, 14 y 15.  
13 conecta con 10, 11 y 14.  
14 conecta con 13 y 12.  
15 conecta con 12 y 16.  
16 conecta solo con 15.

## Leyenda de salas

- 01: Baixada de la Copa / spawn / entrada del bosque.
- Hub seguro en la copa del árbol.
- 02: Clar de l’Arrel / primer combate.
- 03: Pas de la Soca / vertical simple.
- 04: Niu de Fulles / plataformas.
- 05: Creuament Verd / cruce principal.
- 06: Font de Savia / ruta baja y curación.
- 07: Branca Torta / tutorial fuerte.
- 08: Cor del Bosc / sala central.
- 09: Mirador de l’Arrel / secreto alto.
- 10: Racó de Savia / recompensa.
- 11: Pas de les Espores / presión con enemigos.
- 12: Brancam Alt / ruta superior.
- 13: Fossa de l’Escorça / ruta inferior.
- 14: Pedra de l’Impuls / convergencia de rutas y golpe cargado.
- 15: Llindar d’Espines / antesala del jefe.
- 16: Cambra de Mare Espina / jefe del Bosc Antic.

## Notas de naming de salas

Sala 01: Baixada de la Copa.  
La bajada desde la copa hacia el bosque inferior.

Sala 02: Clar de l’Arrel.  
Clar significa claro. Es el primer claro donde se empieza a ver la enfermedad de las raíces.

Sala 03: Pas de la Soca.  
Pas significa paso. Soca es tronco o base del árbol. Encaja con una zona de paso estrecho o vertical entre troncos.

Sala 04: Niu de Fulles.  
Niu significa nido y fulles significa hojas. Evoca una zona de plataformas naturales entre hojas.

Sala 05: Creuament Verd.  
Creuament significa cruce. Verd significa verde. Es el cruce principal del primer tramo.

Sala 06: Font de Savia.  
Font significa fuente. Savia se mantiene como palabra más reconocible que saba. Encaja con la sala donde se desbloquea la curación.

Sala 07: Branca Torta.  
Branca significa rama. Torta significa torcida. Evoca una ruta irregular y más exigente.

Sala 08: Cor del Bosc.  
Cor significa corazón. Es la sala central del bioma.

Sala 09: Mirador de l’Arrel.  
Mirador es comprensible y funciona bien para un secreto alto. Arrel conecta con la raíz y la corrupción.

Sala 10: Racó de Savia.  
Racó significa rincón. Es una sala de recompensa, un pequeño rincón de savia útil.

Sala 11: Pas de les Espores.  
Espores significa esporas. Encaja con una sala de presión con flores, proyectiles y corrupción vegetal.

Sala 12: Brancam Alt.  
Brancam es ramaje. Alt significa alto. Define la ruta superior del bosque.

Sala 13: Fossa de l’Escorça.  
Fossa significa foso. Escorça significa corteza. Evoca una ruta inferior más física, hundida y pesada.

Sala 14: Pedra de l’Impuls.  
Pedra significa piedra. Impuls evoca impulso o golpe. Es la sala donde se desbloquea el golpe cargado.

Sala 15: Llindar d’Espines.  
Llindar significa umbral. Espines significa espinas. Es la antesala del jefe, el umbral hacia Mare Espina.

Sala 16: Cambra de Mare Espina.  
Cambra significa cámara. Es la arena del jefe final del Bosc Antic.

## Lectura del diseño

- El inicio es simple: 01 -> 02.
- Desde 02 el mapa se abre en tres direcciones: arriba, abajo y derecha.
- 03, 04, 05, 06 y 07 forman la primera zona de exploración ramificada.
- 08 es la sala central del bioma.
- Desde 08 se abren tres opciones: secreto alto 09, recompensa baja 10 y avance principal 11.
- La ruta final converge en 12, pasa por 15 y termina en 16.
- La sala 16 solo tiene una entrada: 15.

La ruta final converge en 12, pasa por 15 y termina en el jefe 16.

Desde 11 se abre una bifurcación final: ruta superior por 12 y ruta inferior por 13 y 14.

## Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01.  
Existe camino desde 01 hasta 16.  
El jefe 16 solo tiene una entrada.
