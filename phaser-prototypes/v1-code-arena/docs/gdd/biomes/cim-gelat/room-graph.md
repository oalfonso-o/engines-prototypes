# Room Graph de Cim Gelat

Cim Gelat V3: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 20 salas.  
Spawn: 01.  
Jefe: 20.

## Tabla de salas y conexiones

| Fila / Col | C01 | -> | C02 | -> | C03 | -> | C04 | -> | C05 | -> | C06 | -> | C07 | -> | C08 | -> | C09 | -> | C10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 18 | - | 19 | - | 20 |
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 18 |  | &#124; |  |  |
| F02 |  |  |  |  |  |  |  |  |  |  |  |  | 17 | - | 18 | 18 | 18 |  |  |
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  | &#124; |  | &#124; |  |  |
| F03 |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  | 15 | - | 16 |  |  |
| v |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  | 15 |  |  |  |  |
| F04 |  |  |  |  |  |  |  |  |  |  | 11 | - | 15 | 15 | 15 |  |  |  |  |
| v |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  |  |  |  |
| F05 |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |
| F06 |  |  | 06 | - | 09 | 09 | 09 | - | 10 | 10 | 10 |  |  |  | 13 |  |  |  |  |
| v |  |  | 06 |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  |  |  | 13 |  |  |  |  |
| F07 |  |  | 06 | - | 07 | 07 | 07 | - | 12 | 12 | 12 | - | 13 | 13 | 13 |  |  |  |  |
| v |  |  | 06 |  |  |  | &#124; |  |  |  | 12 |  |  |  | &#124; |  |  |  |  |
| F08 |  |  | 06 |  |  |  | 08 |  |  |  | 12 |  |  |  | 14 |  |  |  |  |
| v |  |  | &#124; |  |  |  | &#124; |  |  |  | 12 |  |  |  |  |  |  |  |  |
| F09 |  |  | 03 |  |  |  | 04 |  |  |  | 12 |  |  |  |  |  |  |  |  |
| v |  |  | &#124; |  |  |  | 04 |  |  |  |  |  |  |  |  |  |  |  |  |
| F10 | 01 | - | 02 | 02 | 02 | - | 04 | - | 05 |  |  |  |  |  |  |  |  |  |  |

## Conexiones validadas

01 conecta con 02.  
02 conecta con 01, 03 y 04.  
03 conecta con 02 y 06.  
04 conecta con 02, 05 y 08.  
05 conecta con 04.  
06 conecta con 03, 07 y 09.  
07 conecta con 06, 08, 09 y 12.  
08 conecta con 04 y 07.  
09 conecta con 06, 07 y 10.  
10 conecta con 09, 11 y 12.  
11 conecta con 10 y 15.  
12 conecta con 07, 10 y 13.  
13 conecta con 12 y 14.  
14 conecta con 13.  
15 conecta con 11, 16 y 18.  
16 conecta con 15 y 18.  
17 conecta con 18.  
18 conecta con 15, 16, 17 y 19.  
19 conecta con 18 y 20.  
20 conecta solo con 19.

## Salas extendidas

02: horizontal de 2 celdas.  
04: vertical de 2 celdas.  
06: vertical de 3 celdas.  
07: horizontal de 2 celdas.  
09: horizontal de 2 celdas.  
10: horizontal de 2 celdas.  
11: vertical de 3 celdas.  
12: forma de L.  
13: forma de L.  
15: forma de L.  
18: forma de L.

## Lectura del diseño

El jugador empieza en 01, abajo a la izquierda, y el objetivo final es 20, arriba a la derecha.

Este diseño no es lineal, pero tampoco es un laberinto confuso.

El bioma tiene una lectura general ascendente.

Las salas 06, 11 y 12 son grandes salas verticales pensadas para explotar el salto en pared del assassin.

La sala 13 introduce una forma en L para combinar avance horizontal y vertical.

La ruta principal no es una línea recta: hay ramificaciones, salas laterales y convergencias.

La sala 20, jefe de la Cim Gelat, solo tiene una entrada desde 19.

## Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01.  
Existe camino desde 01 hasta 20.  
El jefe 20 solo tiene una entrada.
