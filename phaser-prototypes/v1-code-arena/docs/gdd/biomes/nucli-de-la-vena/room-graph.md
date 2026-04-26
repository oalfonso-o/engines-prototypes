# Room Graph del Nucli de la Vena

Nucli de la Vena V1: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 27 salas.  
Spawn: 01, arriba derecha.  
Jefe final: 27, abajo centro.  
Objetivos laterales: 08 arriba izquierda, 21 abajo izquierda, 25 abajo derecha.

## Tabla de salas y conexiones

| Fila / Col | C01 | -> | C02 | -> | C03 | -> | C04 | -> | C05 | -> | C06 | -> | C07 | -> | C08 | -> | C09 | -> | C10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 | 08 | 08 | 08 | 08 | 08 | - | 07 | 07 | 07 | 07 | 07 | - | 06 | - | 05 | - | 02 | - | 01 |
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  | &#124; |  | &#124; |  |  |
| F02 |  |  |  |  |  |  |  |  |  |  | 09 |  |  |  | 04 | - | 03 |  |  |
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |
| F03 |  |  |  |  |  |  |  |  | 11 | - | 10 |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |
| F04 |  |  |  |  |  |  |  |  | 12 |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |
| F05 |  |  |  |  |  |  | 18 | - | 13 |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |  |  |
| F06 |  |  |  |  |  |  | 19 | - | 14 |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  | 19 |  | &#124; |  |  |  |  |  |  |  |  |  |  |
| F07 |  |  |  |  |  |  | 19 | - | 15 | - | 22 | - | 23 | 23 | 23 |  |  |  |  |
| v |  |  |  |  |  |  | 19 |  | &#124; |  | &#124; |  | 23 |  | &#124; |  |  |  |  |
| F08 |  |  |  |  |  |  | 19 | - | 16 | - | 26 | - | 23 | - | 24 |  |  |  |  |
| v |  |  |  |  |  |  | 19 |  | &#124; |  |  |  |  |  | 24 |  |  |  |  |
| F09 |  |  |  |  | 19 | 19 | 19 | - | 17 |  |  |  |  |  | 24 | - | 25 | 25 | 25 |
| v |  |  |  |  | &#124; |  |  |  | &#124; |  |  |  |  |  |  |  |  |  | 25 |
| F10 | 21 | 21 | 21 | - | 20 |  |  |  | 27 |  |  |  |  |  |  |  |  |  | 25 |

## Conexiones validadas

01 conecta con 02.  
02 conecta con 01, 03 y 05.  
03 conecta con 02 y 04.  
04 conecta con 03 y 05.  
05 conecta con 02, 04 y 06.  
06 conecta con 05 y 07.  
07 conecta con 06, 08 y 09.  
08 conecta con 07.  
09 conecta con 07 y 10.  
10 conecta con 09 y 11.  
11 conecta con 10 y 12.  
12 conecta con 11 y 13.  
13 conecta con 12, 14 y 18.  
14 conecta con 13, 15 y 19.  
15 conecta con 14, 16, 19 y 22.  
16 conecta con 15, 17, 19 y 26.  
17 conecta con 16, 19 y 27.  
18 conecta con 13 y 19.  
19 conecta con 14, 15, 16, 17, 18 y 20.  
20 conecta con 19 y 21.  
21 conecta solo con 20.  
22 conecta con 15, 23 y 26.  
23 conecta con 22, 24 y 26.  
24 conecta con 23 y 25.  
25 conecta solo con 24.  
26 conecta con 16, 22 y 23.  
27 conecta solo con 17.

## Salas clave

- 01: spawn arriba derecha.
- 08: objetivo o sello arriba izquierda.
- 21: objetivo o sello abajo izquierda.
- 25: objetivo o sello abajo derecha.
- 27: jefe final abajo centro.

## Lectura del diseño

El Nucli de la Vena es el bioma más complejo.

Desde el spawn 01 se puede recorrer el mapa hacia arriba izquierda, bajar hacia la izquierda, abrir rutas hacia abajo derecha y finalmente acceder al jefe final 27.

El diseño fuerza al jugador a visitar extremos del mapa antes de poder afrontar el jefe final.

Los objetivos laterales 08, 21 y 25 pueden usarse como sellos, llaves o nodos de activación para desbloquear el acceso final.

## Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01.  
Existe camino desde 01 hasta 08, 21, 25 y 27.  
El jefe final 27 solo tiene una entrada.
