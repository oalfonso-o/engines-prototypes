# Estructura del Mundo y Reglas de Room Graph

## Mapa global del mundo

El mapa global se representa sobre una grid lógica de 4 columnas x 7 filas.

- Bosc Antic: zona visual en fila 3, columnas 1 y 2.
- Cim Gelat: zona visual en filas 1, 2 y 3, columnas 3 y 4.
- Mina Enfonsada: zona visual en filas 4 y 5, columnas 3 y 4.
- Nucli de la Vena: zona visual en filas 6 y 7, columnas 1 y 2.

El mapa global no representa salas exactas. Representa regiones del mundo.

El mapa debe mostrarse con margen visual alrededor, como si tuviera dos filas extra arriba y abajo y dos columnas extra a izquierda y derecha, para que no quede pegado a los bordes.

Al inicio solo se ve el Bosc Antic. La Cim Gelat y la Mina se revelan cuando la historia las introduce. El Nucli de la Vena permanece oculto hasta el tramo final.

## Mapa interno de bioma

Cada bioma tendrá su propio mapa interno de salas.

Las salas se colocan en una grid lógica. Las conexiones normales son arriba, abajo, izquierda y derecha.

La posición en la grid no limita el tamaño real de la sala. Una sala puede ser grande, vertical, horizontal o irregular. La cámara sigue al jugador dentro de la sala.

El mapa interno funciona como lectura de conectividad, no como escala real del espacio jugable.

Una conexión puede llevar a una sala que esté varias filas o columnas más lejos si el diseño lo necesita. Por ejemplo, una subida vertical larga puede conectar una sala baja con otra situada varias filas más arriba.

## Reglas para construir mapas internos de bioma

Los mapas internos de bioma se representan como una tabla de salas y conectores.

Cada sala ocupa una celda de sala. Cada conector ocupa una celda intermedia entre dos salas.

Una sala puede conectarse solo en cuatro direcciones: arriba, abajo, izquierda y derecha.

No se permiten conexiones diagonales.

No se permiten conectores sueltos.

Si una celda contiene un conector horizontal, debe tener una sala conectada a la izquierda y otra sala conectada a la derecha.

Si una celda contiene un conector vertical, debe tener una sala conectada arriba y otra sala conectada abajo.

Toda sala debe tener al menos un conector adyacente.

Toda sala debe formar parte del grafo principal del bioma. No puede haber salas aisladas.

Para validar una tabla, debe poder recorrerse desde la sala inicial hasta la sala del jefe siguiendo la secuencia: sala, conector, sala, conector, sala.

La sala del jefe debe tener una sola entrada, salvo decisión explícita de diseño.

El mapa interno representa conectividad, no tamaño real de sala. Una sala puede ser grande, vertical, horizontal o irregular aunque ocupe una sola celda lógica en la tabla.

## Reglas avanzadas para mapas internos y validación por agentes

Estas reglas aplican a todos los biomas del juego.

Una sala puede ocupar una o varias celdas.

Si una sala ocupa varias celdas, se repite el mismo número en todas sus celdas.

Todas las celdas de una misma sala deben formar una única región conectada ortogonalmente. No puede existir una sala duplicada en dos zonas separadas del mapa.

Una sala extendida puede tener forma horizontal, vertical, L, T, rectángulo, anillo o cualquier forma ortogonal conectada.

Una sala extendida puede tener múltiples entradas y salidas desde cualquiera de sus bordes exteriores.

Una sala puede rodear a otra sala. La sala interior debe tener al menos un conector hacia la sala exterior y puede tener hasta cuatro conectores, uno por cada lado.

Dos salas distintas no pueden tocarse directamente. Si dos salas distintas conectan, debe haber un conector entre ellas.

Un conector puede tener longitud mayor que una celda, pero siempre debe ser recto.

Un conector no puede girar. Si una ruta necesita girar, debe hacerlo pasando por una sala intermedia.

Todo conector debe conectar dos salas distintas. No puede haber conectores sueltos ni conectores que conecten una sala consigo misma.

El mapa de un bioma debe formar un único grafo conectado. Desde la sala inicial debe poder llegarse a todas las demás salas siguiendo conexiones válidas.

No puede haber dos grafos separados dentro del mismo bioma.

Antes de entregar una estructura de salas, cualquier agente debe validar el grafo nodo a nodo.

## Proceso obligatorio para agentes

1. Generar la tabla del mapa.
2. Extraer la lista de salas.
3. Verificar que cada sala repetida forma una única región contigua.
4. Verificar que cada conector conecta exactamente dos salas distintas.
5. Verificar que no hay conectores colgando.
6. Verificar que todas las salas tienen al menos una conexión.
7. Recorrer el grafo desde la sala inicial.
8. Confirmar que todas las salas son alcanzables desde la sala inicial.
9. Confirmar que existe camino desde la sala inicial hasta el jefe.
10. Confirmar que la sala del jefe tiene una sola entrada, salvo excepción explícita.
11. Si cualquier regla falla, el agente debe iterar y generar una nueva versión antes de entregar el mapa.

## Room graphs canónicos por bioma

- [Bosc Antic](./biomes/bosc-antic/room-graph.md)
- [Cim Gelat](./biomes/cim-gelat/room-graph.md)
- [Mina Enfonsada](./biomes/mina-enfonsada/room-graph.md)
- [Nucli de la Vena](./biomes/nucli-de-la-vena/room-graph.md)
