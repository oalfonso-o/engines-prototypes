# Personajes, Combate y Balance

## Dirección principal de combate

Canuter será un Metroidvania 2D rápido con combate arcade, cambio de personajes, combos y puntuación por sala.

Canuter será un Metroidvania 2D rápido con combate arcade, cambio de personajes, combos y puntuación por sala. La intención es alejarse de un Metroidvania lento y acercarse a una sensación de acción rápida: entrar en una sala, leer el peligro, moverse bien, cambiar de personaje, matar rápido y mantener el combo.

La intención es alejarse de un Metroidvania lento y acercarse a una sensación de acción rápida: entrar en una sala, leer el peligro, moverse bien, cambiar de personaje, matar rápido y mantener el combo.

La referencia de ritmo no debe ser un RPG pesado. La referencia de sensación debe ser un Metroidvania con energía de fast action: enemigos numerosos, baja vida individual, ataques rápidos y recompensa por jugar limpio y agresivo.

La dificultad no debe venir de enemigos con demasiada vida. La dificultad debe venir de la cantidad de enemigos, su combinación, la presión de la sala, la necesidad de cambiar de personaje y la capacidad del jugador para mantener el combo.

## Regla de identidad

Canuter debe sentirse como un Metroidvania arcade de combate rápido. Tres personajes, cambio instantáneo, combos por sala, puntuación, muchos enemigos débiles, energía ganada atacando, curación rápida y talismanes de personalización ligera.

## Sistema de personajes

El jugador controla un equipo de tres personajes. El cambio de personaje es una mecánica central.

## Habilidades comunes de movimiento

Dash: disponible para todos los personajes.  
Doble salto: disponible para todos los personajes.  
Movimiento rápido: disponible para todos los personajes, ajustado por rol.

Canuter es el más equilibrado y ágil. El assassin es el especialista en movilidad. La maga es más técnica, pero abre rutas mágicas, protege al equipo y rompe defensas.

Motivo de la decisión:

Los tres personajes deben compartir una base común de lectura y control para que el cambio instantáneo no rompa el ritmo.

Regla general:

Todos los personajes comparten una base común de movimiento y luego especializan su rol con habilidades, ritmo, peso y utilidad.

### Dirección visual final de personajes

La dirección visual principal será pixel art. Se descartan como base principal los personajes Chibi/Tiny porque chocan con los tilesets pixel art de bosque, cueva y mundo subterráneo.

### Pack principal de personajes

[Pixel Art Characters for Platformer Games](https://craftpix.net/product/pixel-art-characters-for-platformer-games/)

Este pack será la base de los tres personajes jugables. Incluye tres personajes consistentes entre sí: warrior, assassin y girl magician. Todos comparten estilo, resolución y set de animaciones. Esto tiene prioridad sobre mantener literalmente los arquetipos anteriores ya descartados.

## Canuter / Warrior

Disponibilidad: desde el inicio, pero narrativamente empieza como un joven sin armadura. Tras la muerte de su madre y el funeral, decide tomar la armadura y el arma de su padre, antiguo defensor del Bosc Antic. A partir de ese momento pasa a ser el personaje melee principal.

Rol: melee rápido, daño principal contra jefes, limpieza cercana y supervivencia.

- Ataque normal: golpe frontal cuerpo a cuerpo con espada.
- Daño normal: 2 por golpe.
- Velocidad normal: 4 golpes por segundo.
- Habilidad 1, L1/H: ataque circular en área alrededor del personaje. Cuesta 8 energía. Hace 6 de daño en área cercana.
- Habilidad 2, R1/K: curación instantánea. Cuesta 10 energía. Recupera 8 vida. Cooldown de 3 segundos.
- Habilidad 3, L2/U: golpe cargado. Canuter se queda quieto mientras carga durante 0,55 segundos. Puede usarse en suelo o en aire. En el aire mantiene la trayectoria mientras carga. Cuesta 12 energía. Al soltar, golpea fuerte delante de él con un área frontal rectangular. Hace 14 de daño y empuja enemigos. Área de impacto: 96 píxeles de ancho por 64 píxeles de alto. Cooldown: 1,4 segundos.
- Habilidad 4, R2/I: onda de corte. Canuter hace un slash frontal rápido que lanza una onda de aire como ataque a distancia. Cuesta 6 energía. Hace 4 de daño. Alcance: 280 píxeles. Velocidad del proyectil: 650 px/s. Cooldown: 0,45 segundos.

Función: matar enemigos cercanos, mantener combo, hacer daño fuerte a jefes, curarse y resolver la exploración base.

## Assassin / personaje de movilidad

Assassin como personaje de movilidad.

Disponibilidad: se desbloquea al derrotar al jefe final del Bosc Antic.

Sustituye al personaje de movilidad anterior. Mantiene el mismo rol, pero usa cuchillos en vez de flechas.

Rol: movilidad avanzada, proyectiles rápidos, combate evasivo y rutas verticales.

- Ataque normal: cuchillo lanzado o cuchillada rápida según distancia.
- Daño normal: 1 por cuchillo lanzado.
- Velocidad normal: 5 cuchillos por segundo.
- Pasiva: salto en pared. Al tocar una pared, puede impulsarse hacia la dirección contraria. No puede subir infinitamente por una única pared.
- Habilidad 1, L1/H: lanza 20 cuchillos en un arco de 180 grados hacia la dirección apuntada. Cuesta 10 energía.
- Habilidad 2, R1/K: cuchillo con cuerda.
- Habilidad 2, R1/K: cuchillo con cuerda. Sustituye al gancho anterior.
- Habilidad 3, L2/U: teletransporte direccional. Cuesta 12 energía. Alcance: 160 píxeles. Cooldown: 1,2 segundos. Se desplaza en la dirección apuntada. No atraviesa muros sólidos ni puertas cerradas. Si el destino está bloqueado, teletransporta hasta el último punto libre válido.
- Habilidad 4, R2/I: slide / wall slide. Permite deslizarse por paredes, reducir caída y preparar saltos entre paredes.

Función: matar enemigos voladores, enemigos lejanos, atravesar zonas de movilidad avanzada y abrir rutas de backtracking vertical.

### Funcionamiento del cuchillo con cuerda

El cuchillo con cuerda se lanza en la dirección apuntada. Mientras viaja hacia una superficie válida, el assassin no puede atacar ni usar otras habilidades, pero sí puede seguir moviéndose.

Cuando el cuchillo impacta en una superficie válida, queda enganchado. A partir de ese momento el assassin vuelve a poder atacar.

Si el jugador mantiene pulsado el botón, la cuerda recoge al assassin hacia el punto de anclaje.

Si el jugador suelta el botón, deja de recogerse y pasa a moverse como péndulo alrededor del punto de anclaje.

Si durante el péndulo el jugador pulsa y suelta de nuevo el botón, libera la cuerda. Al soltarla, conserva la inercia del movimiento y continúa con ese vector de velocidad hasta aterrizar, chocar o usar otra habilidad.

Visualmente, la cuerda se genera por código en Phaser como una línea entre el assassin y el cuchillo. Al soltarse, el cuchillo puede quedar clavado y la cuerda puede quedar colgando con una animación breve. Más adelante se decidirá si esa cuerda puede treparse.

## Maga / personaje de control y rompebloqueos

Disponibilidad: se desbloquea al derrotarla en la Mina Enfonsada. La maga sustituye al perfil tanque/rompemapas anterior.

Rol: control, defensa mágica, romper sellos, abrir mapa y desactivar protecciones.

Historia: la maga controla la mina porque su padre, Popoli, la colocó allí desde pequeña y la usó como guardiana. Ella cree que protege la mina y La Vena. Tras ser derrotada por Canuter, descubre que su padre está drenando La Vena, contaminando el mundo y usando la energía para fabricar armas. Entonces se une al equipo para detenerlo. Esto la convierte en prima de Canuter.

- Ataque normal: proyectil mágico frontal.
- Daño normal: 3 por impacto.
- Velocidad normal: 2,5 ataques por segundo.
- Defensa pasiva: recibe 20% menos daño mientras tiene energía por encima de 10.

Habilidad 1, L1/H: rayo de ruptura.  
Coste: 8 energía.  
Daño: 8.  
Cooldown: 1 segundo.  
Alcance: 220 píxeles.  
Efecto: rompe muros sellados mágicamente y cristales laterales marcados como rompibles.  
Visual: línea luminosa, impacto mágico, partículas de cristal y pequeño camera shake.

Habilidad 2, R1/K: pulso terrestre.  
Coste: 10 energía.  
Daño: 10.  
Cooldown: 1,2 segundos.  
Área: 120 píxeles de ancho por 48 píxeles de alto bajo el personaje.  
Efecto: rompe suelos débiles, cristales inferiores y sellos del suelo.  
Visual: círculo de runas bajo los pies, grietas, polvo mágico y partículas.

Habilidad 3, L2/U: barrera arcana.  
Coste: 6 energía al activar.  
Duración: 1,5 segundos.  
Cooldown: 4 segundos.  
Efecto: reduce el daño recibido un 80% mientras está activo.  
Penalización: velocidad reducida un 50% mientras dura.  
Visual: aura circular, runas girando y tinte azul/violeta.

Habilidad 4, R2/I: anulación.  
Coste: 12 energía.  
Daño: 6.  
Cooldown: 1,8 segundos.  
Área: rectángulo frontal de 140 píxeles de ancho por 72 píxeles de alto.  
Efecto: rompe escudos, armaduras mágicas y protecciones de enemigos pesados o mini jefes.  
Visual: flash de runa, onda frontal y partículas de disipación.

Función: abrir rutas mágicas, desactivar bloqueos, protegerse ante ataques fuertes y romper defensas enemigas.

## Popoli / jefe final humano

Diseño detallado de jefes del Bosc Antic

Popoli será una versión oscura del arquetipo warrior. Para mantener coherencia visual, se recomienda hacer un recolor oscuro del warrior del mismo pack pixel art, en lugar de usar un asset externo de otro estilo.

Popoli será una pelea espejo contra una versión oscura y muy poderosa del propio Canuter. Usará una variante de sus mismas herramientas: doble salto, dash, ataque cuerpo a cuerpo, ataque a distancia, golpe cargado y curación. No podrá cambiar al assassin ni a la maga, pero estará muy potenciado por la energía robada de La Vena.

## Inventario de animaciones y cobertura de assets

Esta sección define qué animaciones necesita cada personaje y cómo se cubren con assets o con efectos programados en Phaser.

### Animaciones disponibles en el pack principal

El pack principal trae las siguientes animaciones para los personajes: Attack, Climb, Death, Extra Attack, Hurt, Idle, Jump, Jump High, Push, Run, Run Attack, Walk y Walk Attack.

### Inventario de animaciones de Canuter

Idle: cubierto por asset.  
Walk: cubierto por asset.  
Run: cubierto por asset.  
Jump: cubierto por asset.  
Jump High: cubierto por asset.  
Hurt: cubierto por asset.  
Death: cubierto por asset.  
Ataque normal en suelo: cubierto por Attack.  
Ataque normal corriendo: cubierto por Run Attack.  
Ataque andando: cubierto por Walk Attack.  
Ataque circular en área: se resuelve con Attack o Extra Attack más círculo de corte, hitbox circular, flash, partículas y pequeño camera shake por Phaser.  
Curación: se resuelve con Idle, aura verde/dorada, partículas ascendentes, texto +8 y sonido de curación por Phaser.  
Golpe cargado: se resuelve con Extra Attack, bloqueo temporal de movimiento, efecto de carga y golpe frontal fuerte por Phaser.  
Onda de corte: se resuelve con Attack y un proyectil/onda de aire generada por Phaser.  
Dash: no requiere animación propia. Se resuelve con Run, desplazamiento rápido y estela visual por Phaser.  
Cambio de personaje: efecto común de cambio por Phaser.

### Inventario de animaciones del assassin

Idle: cubierto por asset.  
Walk: cubierto por asset.  
Run: cubierto por asset.  
Jump: cubierto por asset.  
Jump High: cubierto por asset.  
Climb: cubierto por asset. Se usará para wall slide, wall grab o agarre vertical si encaja.  
Hurt: cubierto por asset.  
Death: cubierto por asset.  
Ataque normal: cubierto por Attack.  
Ataque normal corriendo: cubierto por Run Attack.  
Ataque andando: cubierto por Walk Attack.  
Ataque extra: cubierto por Extra Attack.  
Cuchillo normal: si el asset trae cuchillo separado, se usará ese. Si no, se generará por Phaser con Graphics o un pequeño PNG propio.  
Ataque de 20 cuchillos: se resuelve con Attack o Extra Attack más 20 proyectiles generados por Phaser en arco de 180 grados.  
Wall slide: se resuelve con Climb si encaja visualmente. Si no encaja, se usa Jump congelado contra pared, caída lenta y partículas de fricción.  
Wall jump: se resuelve con Jump o Jump High y cambio de dirección al salir de la pared.  
Cuchillo con cuerda: se resuelve con Attack, cuchillo proyectil, cuerda generada por Phaser y física de recogida/péndulo.  
Teletransporte: se resuelve por Phaser con desaparición, estela, flash y reaparición.  
Dash: no requiere animación propia. Se resuelve con Run, desplazamiento rápido y estela visual por Phaser.  
Cambio de personaje: efecto común de cambio por Phaser.

### Inventario de animaciones de la maga

Idle: cubierto por asset.  
Walk: cubierto por asset.  
Run: cubierto por asset.  
Jump: cubierto por asset.  
Jump High: cubierto por asset.  
Hurt: cubierto por asset.  
Death: cubierto por asset.  
Ataque normal: cubierto por Attack.  
Ataque corriendo: cubierto por Run Attack.  
Ataque andando: cubierto por Walk Attack.  
Ataque extra: cubierto por Extra Attack.  
Rayo de ruptura: se resuelve con Attack o Extra Attack, línea luminosa frontal, hitbox lineal y partículas por Phaser.  
Pulso terrestre: se resuelve con Extra Attack, runa bajo los pies, hitbox baja, grietas y partículas por Phaser.  
Barrera arcana: se resuelve con Idle, aura circular, runas girando, reducción de daño y tinte visual por Phaser.  
Anulación: se resuelve con Extra Attack, flash de runa, hitbox frontal y partículas de disipación por Phaser.  
Dash común: se resuelve con Run, desplazamiento corto y estela visual por Phaser.  
Cambio de personaje: efecto común de cambio por Phaser.

### Cobertura de animaciones mediante assets y Phaser

El dash no necesita animación específica. Debe ser impulso corto, estela visual y cooldown.

La curación no necesita animación específica. Debe ser instantánea, con aura, partículas y feedback de vida recuperada.

Las habilidades especiales que no existan como animación en el asset se resolverán combinando una animación base, efectos visuales y movimiento programado.

## Energía, curación y ritmo de combate

El juego favorece mantener presión ofensiva.

La energía se gana combatiendo y permite sostener habilidades.

La curación debe ser rápida y útil, pero no convertir el juego en uno pasivo.

### Vida y energía compartidas

El equipo comparte una única barra de vida y una única barra de energía.

Vida inicial: 20.  
Vida máxima final: 40.  
Mejoras de vida: +5 vida máxima por bioma completado o por mejora principal equivalente.

Energía inicial: 20.  
Energía máxima final: 40.  
La energía no se regenera sola.

### Recuperación de energía

Golpe melee acertado: +1 energía.  
Cuchillo o proyectil acertado: +0,5 energía.  
Matar enemigo: +3 energía.

### Curación

La curación es instantánea y no detiene al jugador.  
Coste: 10 energía.  
Curación: recupera 8 vida.  
Cooldown: 3 segundos.

La curación debe mantener el ritmo rápido. El jugador no debe quedarse quieto para curarse.

## Sistema de configuración de valores y balance

El juego debe permitir definir todos los valores importantes mediante un sistema de parámetros relativos con override absoluto opcional.

Esta regla aplica a movimiento, velocidad, salto, dash, vida, daño, defensa, energía, cooldowns, recuperación, puntuación, enemigos, jefes, habilidades y cualquier otro valor de balance.

Cada valor configurable debe poder definirse de dos maneras: relativa o absoluta.

Por defecto, todos los valores deben ser relativos.

Un valor relativo se calcula comparándose contra una referencia. Esa referencia puede ser un parámetro base global, un parámetro base creado específicamente para una familia de entidades, o el valor final ya calculado de otra entidad.

Ejemplo conceptual: puede existir un parámetro llamado velocidad base de enemigos. Ese parámetro tiene una clave de stat, por ejemplo velocity, y un valor inicial. Los enemigos pueden heredar su velocidad de ese parámetro base.

También puede haber cadenas. Un enemigo puede heredar su velocidad de otro enemigo. Si el enemigo 2 depende del enemigo 1, y el enemigo 3 depende del enemigo 2, cualquier cambio en el enemigo 1 se propaga a los siguientes.

Los valores absolutos sirven como override. Si una entidad tiene valor absoluto para un stat, ese valor se usa directamente y no se calcula mediante multiplicador relativo.

### Regla determinista de cálculo

Primero se calcula el valor final de la referencia.

Si la entidad actual tiene valor absoluto, su valor final es ese valor absoluto.

Si no tiene valor absoluto, su valor final es el valor final de la referencia multiplicado por su multiplicador relativo.

Si otra entidad hereda de esta entidad, heredará siempre de su valor final ya calculado. Esto incluye casos donde el valor final viene de un override absoluto.

Ejemplo conceptual: el enemigo 1 hereda de velocidad base de enemigos. El enemigo 2 hereda del enemigo 1. El enemigo 3 tiene un valor absoluto de velocidad. El enemigo 4 hereda del enemigo 3. En ese caso, el enemigo 4 se calculará contra la velocidad final absoluta del enemigo 3.

### Reglas obligatorias

Todo stat debe tener una referencia relativa por defecto, salvo los parámetros raíz.

Todo stat relativo debe tener multiplicador.

Todo stat puede tener override absoluto.

Si existe override absoluto, manda el absoluto.

Si no existe override absoluto, se calcula por referencia y multiplicador.

Las referencias pueden apuntar a parámetros base o a otros assets.

No se permiten ciclos de referencia. Un valor no puede depender directa o indirectamente de sí mismo.

No se limita la longitud de las cadenas de herencia. Se pueden crear cadenas largas si el diseño lo necesita.

El sistema debe poder mostrar en debug el cálculo completo de cada valor final: referencia usada, valor final de la referencia, multiplicador, override absoluto si existe y resultado final.

### Objetivo de diseño

El objetivo es evitar que el balance se rompa al tocar valores aislados. El juego debe funcionar como una malla de relaciones: si se ajusta una base o un valor importante, todo lo que depende de él debe actualizarse de forma coherente.

Este sistema será la base para balancear personajes, enemigos, habilidades, vida, daño, defensa, movimiento y progresión sin tener que retocar manualmente decenas de valores independientes.

### Primer draft de parámetros relativos de personajes

Estos valores son un primer marco de balance. Todos deben considerarse relativos y ajustables. La implementación debe permitir cambiar bases, multiplicadores y overrides absolutos sin tocar lógica de juego.

#### Parámetros raíz necesarios

Velocidad base de jugador.  
Aceleración base.  
Frenado base.  
Salto base.  
Doble salto base.  
Gravedad de subida base.  
Gravedad de caída base.  
Velocidad máxima de caída base.  
Control aéreo base.  
Distancia de dash base.  
Duración de dash base.  
Cooldown de dash base.  
Coyote time base.  
Jump buffer base.  
Daño base de jugador.  
Cadencia base de ataque.  
Coste base de energía.  
Cooldown base de habilidad.  
Knockback base.  
Radio base de área.  
Alcance base de proyectil.  
Velocidad base de proyectil.  
Duración base defensiva.  
Impulso base de movimiento.  
Fricción base.

#### Canuter / Warrior

Canuter es la referencia principal de los personajes jugables.

Movimiento:  
Velocidad: 1.00 contra velocidad base de jugador.  
Aceleración: 1.00 contra aceleración base.  
Frenado: 1.05 contra frenado base.  
Salto: 1.00 contra salto base.  
Doble salto: 0.95 contra doble salto base.  
Gravedad subida: 1.00 contra gravedad de subida base.  
Gravedad caída: 1.10 contra gravedad de caída base.  
Velocidad máxima de caída: 1.00 contra velocidad máxima de caída base.  
Control aéreo: 0.90 contra control aéreo base.  
Dash distancia: 1.00 contra distancia de dash base.  
Dash duración: 1.00 contra duración de dash base.  
Dash cooldown: 1.00 contra cooldown de dash base.  
Coyote time: 1.00 contra coyote time base.  
Jump buffer: 1.00 contra jump buffer base.

Ataque normal:  
Daño: 1.00 contra daño base de jugador.  
Cadencia: 1.00 contra cadencia base de ataque.  
Knockback: 1.00 contra knockback base.  
Ganancia de energía por golpe: 1.00 contra ganancia base melee.

Habilidad 1, ataque circular:  
Daño: 3.00 contra daño normal de Canuter.  
Radio: 1.00 contra radio base de área.  
Coste: 1.00 contra coste base de energía.  
Cooldown: 1.00 contra cooldown base de habilidad corta.

Habilidad 2, curación:  
Vida recuperada: 4.00 contra daño base de jugador.  
Coste: 1.25 contra coste base de energía.  
Cooldown: 3.00 contra cooldown base de habilidad corta.

Habilidad 3, golpe cargado:  
Daño: 7.00 contra daño normal de Canuter.  
Tiempo de carga: 1.00 contra tiempo de carga base.  
Área frontal: 1.20 contra área base frontal.  
Knockback: 2.00 contra knockback base.  
Coste: 1.50 contra coste base de energía.  
Cooldown: 2.50 contra cooldown base de habilidad corta.

Habilidad 4, onda de corte:  
Daño: 2.00 contra daño normal de Canuter.  
Alcance: 1.00 contra alcance base de proyectil.  
Velocidad de proyectil: 1.00 contra velocidad base de proyectil.  
Coste: 0.75 contra coste base de energía.  
Cooldown: 0.75 contra cooldown base de habilidad corta.

#### Assassin

El assassin hereda su movilidad de Canuter para mantener siempre una relación proporcional con él.

Movimiento:  
Velocidad: 1.15 contra velocidad final de Canuter.  
Aceleración: 1.10 contra aceleración final de Canuter.  
Frenado: 1.10 contra frenado final de Canuter.  
Salto: 1.05 contra salto final de Canuter.  
Doble salto: 1.10 contra doble salto final de Canuter.  
Gravedad subida: 0.95 contra gravedad de subida final de Canuter.  
Gravedad caída: 1.00 contra gravedad de caída final de Canuter.  
Velocidad máxima de caída: 0.95 contra velocidad máxima de caída final de Canuter.  
Control aéreo: 1.25 contra control aéreo final de Canuter.  
Dash distancia: 1.12 contra dash final de Canuter.  
Dash duración: 0.95 contra duración de dash final de Canuter.  
Dash cooldown: 0.90 contra cooldown de dash final de Canuter.

Ataque normal:  
Daño de cuchillo: 0.50 contra daño normal de Canuter.  
Cadencia: 1.25 contra cadencia final de Canuter.  
Alcance: 1.00 contra alcance base de proyectil.  
Ganancia de energía por golpe: 0.50 contra ganancia base melee.

Habilidad 1, arco de cuchillos:  
Número de cuchillos: 20. Valor específico de habilidad.  
Ángulo: 180 grados. Valor específico de habilidad.  
Daño por cuchillo: 0.50 contra daño normal de Canuter.  
Coste: 1.25 contra coste base de energía.  
Cooldown: 1.50 contra cooldown base de habilidad corta.

Habilidad 2, cuchillo con cuerda:  
Alcance: 1.30 contra alcance base de proyectil.  
Velocidad de lanzamiento: 1.20 contra velocidad base de proyectil.  
Velocidad de recogida: 1.00 contra velocidad base de jugador.  
Fuerza de péndulo: 1.00 contra impulso base de movimiento.  
Coste: 1.00 contra coste base de energía.  
Cooldown: 1.50 contra cooldown base de habilidad corta.

Habilidad 3, teletransporte:  
Distancia: 1.25 contra distancia de dash final del assassin.  
Coste: 1.50 contra coste base de energía.  
Cooldown: 2.00 contra cooldown base de habilidad corta.  
Regla: no atraviesa muros sólidos ni puertas cerradas.

Habilidad 4, slide / wall slide:  
Velocidad de caída en pared: 0.30 contra velocidad máxima de caída final del assassin.  
Fricción en pared: 1.50 contra fricción base.  
Wall jump horizontal: 1.20 contra impulso horizontal base.  
Wall jump vertical: 1.05 contra salto base.  
Coste: 0.00. Es habilidad de movimiento.

#### Regla de dash

El dash es común a todos los personajes, con multiplicadores propios por personaje.

Durante el primer 75% del recorrido del dash, el personaje tiene invulnerabilidad.

Durante el último 25% del recorrido del dash, el personaje ya no tiene invulnerabilidad.

Esto permite usar el dash como esquiva, pero castiga caer encima de un enemigo o terminar mal posicionado.

#### Regla de teletransporte del assassin

El teletransporte es parecido al dash, pero mejor: tiene 25% más alcance que el dash final del assassin y ocurre de forma instantánea.

El teletransporte usa solo las 8 direcciones de apuntado.

No atraviesa muros, puertas cerradas ni colisiones sólidas.

Si la dirección de teletransporte encuentra una colisión antes de completar su distancia máxima, el assassin aparece en el último punto libre válido antes de la colisión.

Si el teletransporte termina en el aire, el assassin cae desde ahí con la física normal.

El teletransporte sirve para escapar de grupos de enemigos, recolocarse en vertical y preparar ataques aéreos, como el arco de cuchillos.

El cooldown debe impedir que se pueda spamear. Más adelante, algunos talismanes podrán reducir este cooldown.

#### Maga

La maga hereda su movimiento de Canuter para quedar siempre proporcionalmente más lenta y técnica.

Movimiento:  
Velocidad: 0.88 contra velocidad final de Canuter.  
Aceleración: 0.85 contra aceleración final de Canuter.  
Frenado: 0.95 contra frenado final de Canuter.  
Salto: 0.92 contra salto final de Canuter.  
Doble salto: 0.90 contra doble salto final de Canuter.  
Gravedad subida: 1.05 contra gravedad de subida final de Canuter.  
Gravedad caída: 1.10 contra gravedad de caída final de Canuter.  
Velocidad máxima de caída: 1.00 contra velocidad máxima de caída final de Canuter.  
Control aéreo: 0.80 contra control aéreo final de Canuter.  
Dash distancia: 0.85 contra dash final de Canuter.  
Dash duración: 1.00 contra duración de dash final de Canuter.  
Dash cooldown: 1.15 contra cooldown de dash final de Canuter.

Ataque normal:  
Daño de proyectil mágico: 1.50 contra daño normal de Canuter.  
Cadencia: 0.65 contra cadencia final de Canuter.  
Alcance: 0.85 contra alcance base de proyectil.  
Ganancia de energía por golpe: 0.75 contra ganancia base melee.

Defensa pasiva:  
Daño recibido: 0.80 contra daño recibido normal si la energía actual está por encima de 10.  
El umbral 10 es específico del sistema de energía.

Habilidad 1, rayo de ruptura:  
Daño: 4.00 contra daño normal de Canuter.  
Alcance: 0.80 contra alcance base de proyectil.  
Coste: 1.00 contra coste base de energía.  
Cooldown: 1.50 contra cooldown base de habilidad corta.  
Función: romper muros, cristales laterales y sellos mágicos.

Habilidad 2, pulso terrestre:  
Daño: 5.00 contra daño normal de Canuter.  
Área inferior: 1.20 contra área base.  
Coste: 1.25 contra coste base de energía.  
Cooldown: 1.80 contra cooldown base de habilidad corta.  
Función: romper suelos, cristales inferiores y sellos del suelo.

Habilidad 3, barrera arcana:  
Daño recibido: 0.20 contra daño normal recibido. Bloquea el 80%.  
Duración: 1.00 contra duración base defensiva.  
Penalización de velocidad: 0.50 contra velocidad actual.  
Coste: 0.75 contra coste base de energía.  
Cooldown: 4.00 contra cooldown base de habilidad corta.

Habilidad 4, anulación:  
Daño: 3.00 contra daño normal de Canuter.  
Área frontal: 1.40 contra área base frontal.  
Coste: 1.50 contra coste base de energía.  
Cooldown: 2.50 contra cooldown base de habilidad corta.  
Función: romper escudos, armaduras mágicas y defensas especiales.

### Revisión de equilibrio

Canuter queda como centro del juego: rápido, estable, buen daño, curación y herramientas ofensivas.

Assassin queda como movilidad pura: más velocidad, más control aéreo, pared, cuerda y teletransporte. Su daño por impacto es bajo para no sustituir a Canuter como fuente principal de daño.

Maga queda más lenta, pero útil: abre rutas, rompe bloqueos, protege y pega fuerte con menor cadencia.

La relación entre personajes queda definida por herencia relativa, no por números sueltos. Si se ajusta Canuter, assassin y maga se reajustan de forma proporcional.

## Balance base por bioma

### Vida de enemigos por bioma

Bosc Antic: enemigos normales con 2 a 4 vida. Deben morir en 1 o 2 golpes de Canuter. Grupos habituales de 3 a 6 enemigos por sala.

Cim Gelat: enemigos normales con 4 a 8 vida. Deben morir en 2 a 4 golpes. Grupos habituales de 4 a 8 enemigos por sala.

Mina Enfonsada: enemigos normales con 6 a 12 vida. Algunos pueden tener armadura o defensa especial. Grupos habituales de 5 a 10 enemigos por sala.

Nucli de la Vena: enemigos normales con 8 a 16 vida. Deben combinar patrones aprendidos en los biomas anteriores. Grupos habituales de 6 a 12 enemigos por sala.

### Vida de mini jefes y jefes

Mini jefe Bosque: 80 vida.  
Jefe Bosque: 180 vida.  
Mini jefe Nieve: 120 vida.  
Jefe Nieve: 250 vida.  
Mini jefe Mina: 160 vida.  
Jefe Mina: 320 vida.  
Mini jefe Núcleo: 220 vida.  
Jefe final: 500 vida.

## Ownership

Este archivo es canónico para roster jugable, combate, energía, curación, cobertura de animaciones y balance base.

Los controles viven en `./controls-and-input.md`.
