# Scoring

## Regla de ownership

Todas las fórmulas y reglas numéricas de puntuación viven en este archivo.

Los biomas pueden decir que un mini jefe o un jefe usa la fórmula global, pero no reescriben la fórmula.

## Principio general

El scoring debe ser numérico, determinista y configurable mediante parámetros relativos. No debe depender de valores escritos a mano para cada sala salvo que exista un override explícito.

Los rangos `C`, `B`, `A`, `S` y `S+` son una lectura visual del score. No son la base del cálculo.

## Score base

Existe un parámetro raíz llamado `score base`.

Todos los enemigos puntuables, mini jefes, jefes, bonus y rangos se calculan a partir de ese score base mediante multiplicadores relativos.

## Score de enemigos normales

Cada enemigo puntuable tiene un multiplicador de score.

Fórmula:

```text
score enemigo = score base × multiplicador de enemigo × multiplicador de combo actual
```

- Los critters tienen score `0`.
- Los critters no cuentan para combo.
- Los critters no cuentan para limpieza completa de sala.
- Los critters no cuentan para calcular el score ideal de sala.

Los critters no cuentan.

## Combo

Combo individual

El combo aumenta cuando el jugador mata enemigos puntuables.

- El combo no aumenta al matar critters.
- El combo se mantiene si el jugador mata otro enemigo puntuable antes de que expire el timer.
- Timer de combo por defecto: `3 segundos`.

El combo se reinicia si:

- pasa el timer sin matar otro enemigo puntuable,
- el jugador cambia de sala,
- el jugador muere.

El combo no aumenta al matar critters.

El jugador cambia de sala.

El jugador muere.

Recibir daño no reinicia el combo por defecto. El daño afecta al scoring de sala mediante el componente de daño o no-hit.

## Cómo funcionan los multiplicadores de combo.

- Combo `0 a 2`: `x1 / C`.
- Combo `3 a 5`: `x1,5 / C`.
- Combo `6 a 8`: `x2 / B`.
- Combo `9 a 11`: `x2,5 / A`.
- Combo `12 o más`: `x3 / S`.

## Rangos visuales de combo y multiplicadores

- Combo `0 a 2`: `x1`
- Combo `3 a 5`: `x1,5` y rango visual `C`
- Combo `6 a 8`: `x2` y rango visual `B`
- Combo `9 a 11`: `x2,5` y rango visual `A`
- Combo `12 o más`: `x3` y rango visual `S`

Combo 0 a 2: x1.  
Combo 3 a 5: x1,5. Rango visual C.  
Combo 6 a 8: x2. Rango visual B.  
Combo 9 a 11: x2,5. Rango visual A.  
Combo 12 o más: x3. Rango visual S y multiplicador máximo.

El multiplicador aplica a partir del enemigo que se mata con ese estado de combo. No recalcula enemigos anteriores.

Cuando el combo llega a `S`, el HUD de combo debe reforzarlo visualmente: vibración, brillo, texto `Max` o feedback equivalente.

## Mini jefes y jefes

Mini jefes y jefes no puntúan como enemigos normales. Puntúan por eficiencia al derrotarlos.

El scoring de mini jefe y jefe se calcula desde que empieza el combate hasta que muere el mini jefe o jefe.

### Mini jefe

```text
score mini jefe = max(0, score base × multiplicador mini jefe - segundos de combate × penalizador temporal mini jefe)
```

Valor inicial propuesto:

- Multiplicador mini jefe: `x10`
- Penalizador temporal mini jefe: `x4 por segundo`

Multiplicador mini jefe: x10.  
Penalizador temporal mini jefe: x4 por segundo.

### Jefe

```text
score jefe = max(0, score base × multiplicador jefe - segundos de combate × penalizador temporal jefe)
```

Valor inicial propuesto:

- Multiplicador jefe: `x20`
- Penalizador temporal jefe: `x4 por segundo`

Multiplicador jefe: x20.  
Penalizador temporal jefe: x4 por segundo.

Estos valores son configurables por boss y pueden ajustarse durante balance.

## Score real de sala

```text
score real sala = suma de scores reales de enemigos puntuables + bonus limpieza + bonus no-hit/daño + bonus tiempo
```

La suma de enemigos reales usa el combo real conseguido por el jugador.

### Bonus limpieza

Se aplica solo si el jugador mata todos los enemigos puntuables de la sala.

Bonus de limpieza

El bonus de limpieza se aplica solo si el jugador mata todos los enemigos puntuables de la sala.

```text
bonus limpieza = score ideal enemigos de la sala × factor limpieza
```

### Bonus de no-hit / daño recibido

El bonus de daño se calcula en función de cuánto daño recibe el jugador en la sala.

La fórmula exacta puede ajustarse, pero debe derivar del score ideal de enemigos de la sala.

```text
bonus daño = score ideal enemigos de la sala × factor daño × proporción de vida conservada
```

Si la sala se completa sin recibir daño, obtiene el máximo bonus de daño.

### Bonus de tiempo

Cada sala puede tener un tiempo objetivo calculado por diseño o definido por override.

```text
bonus tiempo = bonus tiempo máximo × min(1, tiempo objetivo / tiempo real)
```

El bonus de tiempo debe ser continuo, no por rangos cerrados.

Fórmula base:

Esto significa:

- Si el jugador tarda menos o igual que el tiempo objetivo, recibe todo el bonus de tiempo.
- Si tarda más, el bonus baja progresivamente.
- No hay saltos artificiales entre rangos.

## Score ideal de sala

Cada sala debe poder calcular automáticamente un score ideal de referencia.

Este score ideal no tiene que ser el máximo matemático perfecto, sino un techo razonable, determinista y útil para calcular rangos.

Cálculo del score ideal de enemigos:

### Cálculo del score ideal de enemigos

1. Tomar todos los enemigos puntuables de la sala.
2. Excluir critters.
3. Ordenar los enemigos de menor a mayor valor base.
4. Simular una run ideal donde el jugador mata a todos los enemigos seguidos sin perder combo.
5. Aplicar los multiplicadores de combo progresivos.

La razón de ordenar de menor a mayor valor es que una run ideal usaría enemigos de menor valor para subir combo y reservaría enemigos de mayor valor para multiplicadores altos.

Ejemplo de multiplicadores en simulación ideal:

- Enemigos 1 a 3: x1.
- Enemigos 4 a 6: x1,5.
- Enemigos 7 a 9: x2.
- Enemigos 10 a 12: x2,5.
- Enemigos 13 en adelante: x3.

Los bonus ideales se calculan como factores relativos sobre el score ideal de enemigos.

```text
score ideal sala = score ideal enemigos + bonus limpieza ideal + bonus no-hit ideal + bonus tiempo ideal
```

## Rango de sala

El rango de sala se calcula comparando score real contra score ideal.

```text
porcentaje sala = score real sala / score ideal sala
```

Rangos:

- `C`: menos de 50%
- `B`: 50% a 69%
- `A`: 70% a 89%
- `S`: 90% o más
- `S+`: 100% o más

C: menos de 50%.  
B: 50% a 69%.  
A: 70% a 89%.  
S: 90% o más.  
S+: 100% o más.

`S+` existe porque el score ideal es un techo razonable, no necesariamente el techo absoluto matemático. Si un jugador supera el ideal mediante una ejecución excelente, puede obtener S+.

## Score real de bioma

```text
score real bioma = suma de mejores scores históricos de salas + mejor score histórico de mini jefe + mejor score histórico de jefe
```

Las salas ocultas no descubiertas cuentan como `0` en el score real del bioma.

## Score ideal de bioma

```text
score ideal bioma = suma de scores ideales de todas las salas del bioma + score ideal mini jefe + score ideal jefe
```

Las salas ocultas sí forman parte del score ideal de bioma. Esto permite que el jugador vea que aún le falta potencial de puntuación si no ha descubierto todo.

## Puntuación por bioma

La puntuación de un bioma se calcula sumando la mejor puntuación de todas sus salas.

Si existe una sala oculta y el jugador no la ha descubierto, esa sala cuenta como `0` puntos reales para el bioma, pero sigue contando dentro del score ideal de bioma.

Tras derrotar al jefe final del juego, el jugador puede seguir explorando para descubrir salas ocultas y mejorar puntuaciones.

## Rango de bioma

```text
porcentaje bioma = score real bioma / score ideal bioma
```

Rangos:

- `C`: menos de 50%
- `B`: 50% a 69%
- `A`: 70% a 89%
- `S`: 90% o más
- `S+`: 100% o más

C: menos de 50%.  
B: 50% a 69%.  
A: 70% a 89%.  
S: 90% o más.  
S+: 100% o más.

## Datos persistidos del sistema

Datos guardados de scoring

El juego debe guardar:

- mejor score histórico por sala,
- mejor rango histórico por sala,
- mejor tiempo si la sala fue limpiada,
- si la sala se completó sin recibir daño,
- si la sala tuvo limpieza completa,
- mejor score histórico de cada mini jefe,
- mejor score histórico de cada jefe,
- score total del bioma,
- rango total del bioma.

Mejor score histórico por sala.
Mejor rango histórico por sala.
Mejor tiempo si la sala fue limpiada.
Mejor score histórico de cada mini jefe.
Mejor score histórico de cada jefe.

Si el jugador muere, pierde el score parcial de la sala actual y carga el último autosave.

## Información desbloqueable para endgame

Información desbloqueable para endgame

En fases avanzadas o en el endgame, el jugador podrá desbloquear herramientas para ver información de completado.

Información posible:

- número total de salas por bioma,
- salas descubiertas,
- mejor puntuación por sala,
- salas con puntuación pendiente,
- pistas de puntos especiales del mapa.

Los puntos especiales pueden señalar paredes rompibles, rutas ocultas o zonas donde una habilidad concreta puede abrir camino.

Este sistema queda pendiente de concretar dentro del sistema de mapa, talismanes o habilidad final.
