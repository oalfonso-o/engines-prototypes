# Room Graph de Mina Enfonsada

Mina Enfonsada V1: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 20 salas.  
Spawn: 01, arriba izquierda.  
Jefe: 20, abajo izquierda.

## Tabla de salas y conexiones

| Fila / Col | C01 | -> | C02 | -> | C03 | -> | C04 | -> | C05 | -> | C06 | -> | C07 | -> | C08 | -> | C09 | -> | C10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 | 01 | - | 02 | 02 | 02 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| F02 |  |  |  |  | 03 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| F03 |  |  | 05 | - | 04 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| F04 |  |  |  |  | 06 | 06 | 06 | 06 | 06 | - | 07 |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |
| F05 |  |  |  |  |  |  |  |  |  |  | 08 |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  |  |  |  |  | 08 |  |  |  |  |  |  |  |  |
| F06 |  |  |  |  |  |  | 09 | 09 | 09 | - | 08 |  |  |  |  |  |  |  |  |
| v |  |  |  |  |  |  | &#124; |  | &#124; |  | 08 |  |  |  |  |  |  |  |  |
| F07 |  |  |  |  |  |  | 10 | 10 | 10 | - | 08 | - | 12 |  |  |  |  |  |  |
| v |  |  |  |  |  |  | &#124; |  | &#124; |  |  |  | &#124; |  |  |  |  |  |  |
| F08 |  |  |  |  |  |  | 11 | 11 | 11 |  |  |  | 13 | - | 14 | 14 | 14 |  |  |
| v |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  | &#124; |  | &#124; |  |  |
| F09 |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  | 15 |  | 15 |  |  |
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  | 15 |  |  |
| F10 | 20 | - | 19 | 19 | 19 | - | 18 | - | 17 | - | 16 | 16 | 16 | - | 15 | 15 | 15 |  |  |

## Conexiones validadas

01 conecta con 02.  
02 conecta con 01 y 03.  
03 conecta con 02 y 04.  
04 conecta con 03, 05 y 06.  
05 conecta con 04.  
06 conecta con 04 y 07.  
07 conecta con 06 y 08.  
08 conecta con 07, 09, 10 y 12.  
09 conecta con 08 y 10.  
10 conecta con 08, 09 y 11.  
11 conecta con 10 y 17.  
12 conecta con 08 y 13.  
13 conecta con 12 y 14.  
14 conecta con 13 y 15.  
15 conecta con 14 y 16.  
16 conecta con 15 y 17.  
17 conecta con 11, 16 y 18.  
18 conecta con 17 y 19.  
19 conecta con 18 y 20.  
20 conecta solo con 19.

## Salas extendidas

02: horizontal de 2 celdas.  
06: horizontal de 3 celdas.  
08: vertical de 3 celdas.  
09: horizontal de 2 celdas.  
10: horizontal de 2 celdas.  
11: forma de L.  
14: horizontal de 2 celdas.  
15: forma de L.  
16: horizontal de 2 celdas.  
19: horizontal de 2 celdas.

## Lectura del diseño

El jugador empieza en 01, arriba izquierda, y baja progresivamente hacia la zona inferior.

El jefe 20 está abajo a la izquierda y solo tiene una entrada desde 19.

La mina tiene lectura descendente: primero se entra, luego se baja a estructuras profundas, después se rodea por galerías y finalmente se vuelve hacia la izquierda para llegar al jefe.

La sala 08 funciona como eje vertical de mina, conectando varias rutas.

El tramo 15, 16, 17, 18, 19 y 20 crea el cierre final del bioma con retorno hacia abajo izquierda.

## Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01.  
Existe camino desde 01 hasta 20.  
El jefe 20 solo tiene una entrada.
