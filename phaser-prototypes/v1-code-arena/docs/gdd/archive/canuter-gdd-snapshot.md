# Game Design Document: Canuter

# Objetivo del documento

Este documento define el Game Design Document de Canuter, un Metroidvania 2D. Su objetivo es dejar por escrito todas las herramientas necesarias para que un level designer pueda construir el juego sala a sala, tile a tile, sin depender de decisiones improvisadas.

El documento debe definir qué puede hacer el jugador en cada fase del juego, qué habilidades tiene disponibles, qué enemigos existen, qué plataformas y obstáculos pueden usarse, qué tipo de dificultad se espera y cómo progresa el jugador a través de los biomas.

Alcance inicial

# Canuter tendrá cuatro biomas principales. Bosc Antic tendrá 16 salas. Cim Gelat y Mina Enfonsada tendrán 20 salas cada uno. El Nucli de la Vena, por ser el bioma final, tendrá 27 salas. Cada bioma tendrá su propio jefe final, enemigos, tiles, plataformas, obstáculos, tono visual, ritmo de exploración y curva de dificultad.

El documento no busca diseñar todavía cada sala en detalle desde el principio. Primero debe definir el set de herramientas: habilidades, enemigos, plataformas, obstáculos, reglas de progresión, recompensas, puertas, bloqueos, backtracking y dificultad. Cuando esas herramientas estén claras, se podrá diseñar cada sala con criterios consistentes.

Forma de trabajo

# Este documento será la fuente de verdad del proyecto. Cada vez que se defina una decisión importante, se añadirá aquí. Si una conversación se pierde, se podrá recuperar el contexto leyendo este documento.

Las decisiones todavía abiertas se marcarán como pendientes. Las decisiones ya aceptadas se escribirán como reglas de diseño. El objetivo final es que el documento permita construir todas las salas del juego con una guía clara.

Estructura pendiente de definir

1\. Fantasía principal del juego.  
2\. Movimiento base del personaje.  
3\. Combate base.  
4\. Habilidades desbloqueables.  
5\. Estructura de los cuatro biomas.

# 6\. Enemigos por bioma.

# 7\. Plataformas, tiles y obstáculos por bioma.

8\. Jefes finales.  
9\. Progresión y backtracking.  
10\. Reglas para diseñar salas.  
11\. Curva de dificultad.  
12\. Diseño sala a sala.

Glosario de nombres propios y localización

Los nombres propios oficiales del juego no se traducen. Se mantienen igual en todos los idiomas y se explican la primera vez con una descripción localizada.

Regla de naming: los nombres propios deben intentar evocar raíces catalanas cuando encaje con el mundo del juego.

El idioma base de trabajo puede ser inglés, pero el juego se localizará como mínimo a inglés, catalán, castellano, francés, alemán, italiano y portugués. Las traducciones se generarán con IA. En idiomas que el equipo no pueda revisar directamente, otro agente deberá revisar la traducción.

Nombre del juego y protagonista: Canuter. Nunca lleva tilde. Nota interna: el nombre viene de una broma con Counter Strike / Canuter Striker. No debe explicarse dentro del juego.

Personajes:  
Canuter: protagonista / warrior.  
Neret: assassin.  
Bruna: maga.  
Popoli: tío de Canuter y jefe final humano.  
Berwick: jefe del Cim Gelat.

Mundo:  
L’Arrel Negra: nombre popular de la enfermedad/corrupción. La gente no sabe si es enfermedad, veneno, contaminación o radiación.  
La Copa Mare: gran árbol central.  
Refugi de la Copa Mare: sala 00 / hub inicial.  
Casa del Consell: edificio político del refugio.  
La Vena: red antigua de raíces, agua y minerales.  
Bosc Antic: primer bioma.  
Cim Gelat: segundo bioma.  
Mina Enfonsada: tercer bioma.  
Nucli de la Vena: cuarto bioma.  
Mare Espina: jefe final del Bosc Antic.  
Aranya d’Escorça: mini jefe del Bosc Antic.

Etimología y origen de nombres

Esta sección recoge por qué se han escogido los nombres propios principales. Sirve como referencia interna para mantener coherencia de naming durante el desarrollo.

Canuter

Nombre del juego y del protagonista. No lleva tilde. Viene de una broma interna con Counter Strike / Canuter Striker. No debe explicarse dentro del juego.

Neret

Nombre del assassin. Es corto, ágil y fácil de leer en catalán, castellano e inglés. Suena a personaje rápido, discreto y de bosque.

Bruna

Nombre de la maga. Es un nombre catalán/románico real, sencillo y fuerte. Encaja con una prima de Canuter ligada a la mina y a la magia.

Popoli

Nombre del tío de Canuter y jefe final humano. Está inspirado en el Duque de Popoli, figura histórica asociada al bando borbónico en el contexto de la Guerra de Sucesión y el sitio de Barcelona. Se usa como guiño histórico indirecto, no como representación literal.

Berwick

Nombre del jefe de la Cim Gelat. Está inspirado en el Duque de Berwick, también asociado históricamente al sitio de Barcelona. Funciona como nombre aristocrático, frío y de enemigo fuerte.

L’Arrel Negra

Nombre popular de la enfermedad/corrupción. En catalán, arrel significa raíz. El nombre funciona porque la corrupción parece subir desde las raíces, pero la gente del mundo no sabe si es enfermedad, veneno, contaminación, magia o radiación.

La Copa Mare

Nombre del gran árbol central. Mare significa madre en catalán. Evoca árbol madre, copa protectora y origen del refugio.

Refugi de la Copa Mare

Nombre de la sala 00 y hub inicial. Refugi significa refugio. Define el poblado seguro construido en la copa del árbol.

Casa del Consell

Edificio político o comunitario del Refugi de la Copa Mare. Consell significa consejo. El nombre se mantiene como propio, aunque el rol de Oleguer sí se traduce.

Oleguer

Nombre propio del Cap del Consell. Es un nombre catalán tradicional, serio y de persona mayor. Encaja con un líder prudente que sabe más de lo que dice.

Bosc Antic

Primer bioma. Significa bosque antiguo. Sustituye a Bosc Vell porque suena más mítico, más propio de fantasía y menos cotidiano.

Cim Gelat

Segundo bioma. Significa cima helada. Nombra directamente la montaña nevada sin complicar el término.

Mina Enfonsada

Tercer bioma. Significa mina hundida. Evoca descenso, ruina y profundidad.

Nucli de la Vena

Cuarto bioma. Significa núcleo de la vena. Nombra el origen profundo de La Vena y el lugar donde se drena su energía.

La Vena

Red antigua de raíces, agua y minerales que conecta el valle. Se mantiene igual porque es comprensible en catalán/castellano y también funciona como nombre propio fantástico.

Mare Espina

Jefe final del Bosc Antic. Significa madre espina. Evoca una criatura vegetal maternal, antigua y corrompida.

Aranya d’Escorça

Mini jefe del Bosc Antic. Significa araña de corteza. Evoca una criatura del bosque hecha de corteza, musgo y resina, ligada a La Copa Mare y deformada por L’Arrel Negra.

Nombres de salas del Bosc Antic

Sala 00: Refugi de la Copa Mare.  
Hub seguro en la copa del árbol.

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

Premisa narrativa

Inicio narrativo de Canuter

El juego puede empezar con unos minutos breves de historia jugable antes de que Canuter sea guerrero. Canuter empieza como un joven del Bosc Antic, sin armadura y sin habilidades de combate importantes.

La escena inicial muestra a Canuter yendo a ver a su madre enferma, que está en su lecho de muerte. Esta escena debe ser breve y contada solo con texto. La madre puede insinuar que la enfermedad viene de algo que está dañando las raíces y La Vena.

Después, la madre muere. Puede haber una escena corta de funeral. Durante el funeral, alguien del pueblo menciona al padre de Canuter: un antiguo guerrero que defendió el Bosc Antic y que murió en una guerra anterior para asegurar la paz de la región.

La frase clave puede ser: tu padre estaría orgulloso de ti.

El pueblo explica que, si el padre de Canuter siguiera vivo, quizá habría podido defender el bosque de la nueva amenaza. Esto empuja a Canuter a tomar la armadura y el arma de su padre.

A partir de ese momento, Canuter deja de ser solo un joven del bosque y se convierte en el nuevo defensor del Bosc Antic. Este momento justifica el cambio visual al sprite de guerrero y el inicio real de las mecánicas de combate.

Premisa principal

Canuter empieza en el Bosc Antic, una zona viva pero enferma. Las raíces del bosque se están secando desde abajo. Los habitantes del bosque creen que el problema viene de La Vena, una red antigua de raíces, agua y minerales que conecta todo el valle.

El jugador entiende desde el principio que existen tres grandes regiones visibles: el bosque, la cumbre nevada y las minas. El cuarto bioma no se revela todavía. Debe funcionar como sorpresa final.

Canuter necesita bajar a las minas para descubrir qué está contaminando las raíces, pero no puede entrar. Las minas están selladas y controladas por una maga guardiana. Más adelante se descubre que esa maga es prima de Canuter y que su padre, Popoli, la puso allí desde pequeña para proteger sus intereses.

Para obtener permiso de entrada, Canuter debe subir primero a la Cim Gelat y recuperar una antigua insignia, llave o prueba de legitimidad custodiada por el jefe de las nieves. Ese objeto demuestra que Canuter no es un saqueador, sino alguien autorizado a investigar La Vena.

Con ese objeto, Canuter vuelve y consigue acceso a la Mina Enfonsada. Allí descubre que la corrupción no nace en las minas, sino más abajo. En las profundidades encuentra una señal, inscripción o fragmento antiguo que apunta a una zona olvidada bajo el mundo conocido.

Después de las minas, Canuter debe volver al Bosc Antic y hablar con un sabio del bosque. El sabio interpreta el hallazgo y revela que existe un cuarto lugar: el Nucli de la Vena. Ese será el bioma final, oculto hasta ese momento.

La historia debe contarse con poco texto. El jugador debe leer frases breves, carteles, inscripciones, diarios cortos y diálogos mínimos. La prioridad del juego es jugar: explorar, saltar, combatir, desbloquear rutas y mejorar puntuaciones.

Progresión narrativa principal

1\. Bosc Antic: se presenta el problema de las raíces enfermas.  
2\. Cim Gelat: Canuter busca el objeto necesario para ganarse el permiso de entrada a las minas.  
3\. Mina Enfonsada: Canuter investiga el origen real de la corrupción.  
4\. Regreso al Bosc Antic: el sabio interpreta el descubrimiento.  
5\. Nucli de la Vena: se revela el cuarto bioma y se prepara el final del juego.

Regla narrativa

La historia debe justificar la progresión del mapa, pero no debe frenar el ritmo. Cada bloque narrativo debe responder a una pregunta práctica del jugador: dónde tengo que ir, por qué no puedo entrar todavía, qué necesito conseguir, qué nueva zona se ha abierto y qué amenaza estoy siguiendo.

Dirección principal de combate

Canuter será un Metroidvania 2D rápido con combate arcade, cambio de personajes, combos y puntuación por sala. La intención es alejarse de un Metroidvania lento y acercarse a una sensación de acción rápida: entrar en una sala, leer el peligro, moverse bien, cambiar de personaje, matar rápido y mantener el combo.

La referencia de ritmo no debe ser un RPG pesado. La referencia de sensación debe ser un Metroidvania con energía de fast action: enemigos numerosos, baja vida individual, ataques rápidos y recompensa por jugar limpio y agresivo.

Sistema de personajes

El jugador controla un equipo de tres personajes. El cambio de personaje es una mecánica central.

Dirección visual final de personajes

La dirección visual principal será pixel art. Se descartan como base principal los personajes Chibi/Tiny porque chocan con los tilesets pixel art de bosque, cueva y mundo subterráneo.

Pack principal de personajes

Pixel Art Characters for Platformer Games: https://craftpix.net/product/pixel-art-characters-for-platformer-games/

Este pack será la base de los tres personajes jugables. Incluye tres personajes consistentes entre sí: warrior, assassin y girl magician. Todos comparten estilo, resolución y set de animaciones. Esto tiene prioridad sobre mantener literalmente los arquetipos anteriores ya descartados.

Canuter / Warrior

Disponibilidad: desde el inicio, pero narrativamente empieza como un joven sin armadura. Tras la muerte de su madre y el funeral, decide tomar la armadura y el arma de su padre, antiguo defensor del Bosc Antic. A partir de ese momento pasa a ser el personaje melee principal.

Rol: melee rápido, daño principal contra jefes, limpieza cercana y supervivencia.  
Ataque normal: golpe frontal cuerpo a cuerpo con espada.  
Daño normal: 2 por golpe.  
Velocidad normal: 4 golpes por segundo.  
Habilidad 1, L1/H: ataque circular en área alrededor del personaje. Cuesta 8 energía. Hace 6 de daño en área cercana.  
Habilidad 2, R1/K: curación instantánea. Cuesta 10 energía. Recupera 8 vida. Cooldown de 3 segundos.  
Habilidad 3, L2/U: golpe cargado. Canuter se queda quieto mientras carga durante 0,55 segundos. Puede usarse en suelo o en aire. En el aire mantiene la trayectoria mientras carga. Cuesta 12 energía. Al soltar, golpea fuerte delante de él con un área frontal rectangular. Hace 14 de daño y empuja enemigos. Área de impacto: 96 píxeles de ancho por 64 píxeles de alto. Cooldown: 1,4 segundos.  
Habilidad 4, R2/I: onda de corte. Canuter hace un slash frontal rápido que lanza una onda de aire como ataque a distancia. Cuesta 6 energía. Hace 4 de daño. Alcance: 280 píxeles. Velocidad del proyectil: 650 px/s. Cooldown: 0,45 segundos.  
Función: matar enemigos cercanos, mantener combo, hacer daño fuerte a jefes, curarse y resolver la exploración base.

Assassin / personaje de movilidad

Disponibilidad: se desbloquea al derrotar al jefe final del Bosc Antic.

Sustituye al personaje de movilidad anterior. Mantiene el mismo rol, pero usa cuchillos en vez de flechas.

Rol: movilidad avanzada, proyectiles rápidos, combate evasivo y rutas verticales.  
Ataque normal: cuchillo lanzado o cuchillada rápida según distancia.  
Daño normal: 1 por cuchillo lanzado.  
Velocidad normal: 5 cuchillos por segundo.  
Pasiva: salto en pared. Al tocar una pared, puede impulsarse hacia la dirección contraria. No puede subir infinitamente por una única pared.  
Habilidad 1, L1/H: lanza 20 cuchillos en un arco de 180 grados hacia la dirección apuntada. Cuesta 10 energía.  
Habilidad 2, R1/K: cuchillo con cuerda. Sustituye al gancho anterior.  
Habilidad 3, L2/U: teletransporte direccional. Cuesta 12 energía. Alcance: 160 píxeles. Cooldown: 1,2 segundos. Se desplaza en la dirección apuntada. No atraviesa muros sólidos ni puertas cerradas. Si el destino está bloqueado, teletransporta hasta el último punto libre válido.  
Habilidad 4, R2/I: slide / wall slide. Permite deslizarse por paredes, reducir caída y preparar saltos entre paredes.  
Función: matar enemigos voladores, enemigos lejanos, atravesar zonas de movilidad avanzada y abrir rutas de backtracking vertical.

Funcionamiento del cuchillo con cuerda

El cuchillo con cuerda se lanza en la dirección apuntada. Mientras viaja hacia una superficie válida, el assassin no puede atacar ni usar otras habilidades, pero sí puede seguir moviéndose.

Cuando el cuchillo impacta en una superficie válida, queda enganchado. A partir de ese momento el assassin vuelve a poder atacar.

Si el jugador mantiene pulsado el botón, la cuerda recoge al assassin hacia el punto de anclaje.

Si el jugador suelta el botón, deja de recogerse y pasa a moverse como péndulo alrededor del punto de anclaje.

Si durante el péndulo el jugador pulsa y suelta de nuevo el botón, libera la cuerda. Al soltarla, conserva la inercia del movimiento y continúa con ese vector de velocidad hasta aterrizar, chocar o usar otra habilidad.

Visualmente, la cuerda se genera por código en Phaser como una línea entre el assassin y el cuchillo. Al soltarse, el cuchillo puede quedar clavado y la cuerda puede quedar colgando con una animación breve. Más adelante se decidirá si esa cuerda puede treparse.

Maga / personaje de control y rompebloqueos

Disponibilidad: se desbloquea al derrotarla en la Mina Enfonsada. La maga sustituye al perfil tanque/rompemapas anterior.

Rol: control, defensa mágica, romper sellos, abrir mapa y desactivar protecciones.

Historia: la maga controla la mina porque su padre, Popoli, la colocó allí desde pequeña y la usó como guardiana. Ella cree que protege la mina y La Vena. Tras ser derrotada por Canuter, descubre que su padre está drenando La Vena, contaminando el mundo y usando la energía para fabricar armas. Entonces se une al equipo para detenerlo. Esto la convierte en prima de Canuter.

Ataque normal: proyectil mágico frontal.  
Daño normal: 3 por impacto.  
Velocidad normal: 2,5 ataques por segundo.  
Defensa pasiva: recibe 20% menos daño mientras tiene energía por encima de 10\.

Habilidad 1, L1/H: rayo de ruptura.  
Coste: 8 energía.  
Daño: 8\.  
Cooldown: 1 segundo.  
Alcance: 220 píxeles.  
Efecto: rompe muros sellados mágicamente y cristales laterales marcados como rompibles.  
Visual: línea luminosa, impacto mágico, partículas de cristal y pequeño camera shake.

Habilidad 2, R1/K: pulso terrestre.  
Coste: 10 energía.  
Daño: 10\.  
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
Daño: 6\.  
Cooldown: 1,8 segundos.  
Área: rectángulo frontal de 140 píxeles de ancho por 72 píxeles de alto.  
Efecto: rompe escudos, armaduras mágicas y protecciones de enemigos pesados o mini jefes.  
Visual: flash de runa, onda frontal y partículas de disipación.

Función: abrir rutas mágicas, desactivar bloqueos, protegerse ante ataques fuertes y romper defensas enemigas.

Popoli / jefe final humano

Popoli será una versión oscura del arquetipo warrior. Para mantener coherencia visual, se recomienda hacer un recolor oscuro del warrior del mismo pack pixel art, en lugar de usar un asset externo de otro estilo.

Usará una variante de las mismas herramientas de Canuter: doble salto, dash, ataque cuerpo a cuerpo, onda de corte, golpe cargado y curación. No podrá cambiar al assassin ni a la maga, pero estará potenciado por la energía robada de La Vena.

Inventario de animaciones y cobertura de assets

Esta sección define qué animaciones necesita cada personaje y cómo se cubren con assets o con efectos programados en Phaser.

Animaciones disponibles en el pack principal

El pack principal trae las siguientes animaciones para los personajes: Attack, Climb, Death, Extra Attack, Hurt, Idle, Jump, Jump High, Push, Run, Run Attack, Walk y Walk Attack.

Canuter / Warrior

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
Curación: se resuelve con Idle, aura verde/dorada, partículas ascendentes, texto \+8 y sonido de curación por Phaser.  
Golpe cargado: se resuelve con Extra Attack, bloqueo temporal de movimiento, efecto de carga y golpe frontal fuerte por Phaser.  
Onda de corte: se resuelve con Attack y un proyectil/onda de aire generada por Phaser.  
Dash: no requiere animación propia. Se resuelve con Run, desplazamiento rápido y estela visual por Phaser.  
Cambio de personaje: efecto común de cambio por Phaser.

Assassin

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

Maga

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

Notas de implementación visual en Phaser

El dash no necesita animación específica. Debe ser impulso corto, estela visual y cooldown.

La curación no necesita animación específica. Debe ser instantánea, con aura, partículas y feedback de vida recuperada.

Las habilidades especiales que no existan como animación en el asset se resolverán combinando una animación base, efectos visuales y movimiento programado.

Sistema de configuración de valores y balance

El juego debe permitir definir todos los valores importantes mediante un sistema de parámetros relativos con override absoluto opcional.

Esta regla aplica a movimiento, velocidad, salto, dash, vida, daño, defensa, energía, cooldowns, recuperación, puntuación, enemigos, jefes, habilidades y cualquier otro valor de balance.

Cada valor configurable debe poder definirse de dos maneras: relativa o absoluta.

Por defecto, todos los valores deben ser relativos.

Un valor relativo se calcula comparándose contra una referencia. Esa referencia puede ser un parámetro base global, un parámetro base creado específicamente para una familia de entidades, o el valor final ya calculado de otra entidad.

Ejemplo conceptual: puede existir un parámetro llamado velocidad base de enemigos. Ese parámetro tiene una clave de stat, por ejemplo velocity, y un valor inicial. Los enemigos pueden heredar su velocidad de ese parámetro base.

También puede haber cadenas. Un enemigo puede heredar su velocidad de otro enemigo. Si el enemigo 2 depende del enemigo 1, y el enemigo 3 depende del enemigo 2, cualquier cambio en el enemigo 1 se propaga a los siguientes.

Los valores absolutos sirven como override. Si una entidad tiene valor absoluto para un stat, ese valor se usa directamente y no se calcula mediante multiplicador relativo.

Regla determinista de cálculo

Primero se calcula el valor final de la referencia.

Si la entidad actual tiene valor absoluto, su valor final es ese valor absoluto.

Si no tiene valor absoluto, su valor final es el valor final de la referencia multiplicado por su multiplicador relativo.

Si otra entidad hereda de esta entidad, heredará siempre de su valor final ya calculado. Esto incluye casos donde el valor final viene de un override absoluto.

Ejemplo conceptual: el enemigo 1 hereda de velocidad base de enemigos. El enemigo 2 hereda del enemigo 1\. El enemigo 3 tiene un valor absoluto de velocidad. El enemigo 4 hereda del enemigo 3\. En ese caso, el enemigo 4 se calculará contra la velocidad final absoluta del enemigo 3\.

Reglas obligatorias

Todo stat debe tener una referencia relativa por defecto, salvo los parámetros raíz.

Todo stat relativo debe tener multiplicador.

Todo stat puede tener override absoluto.

Si existe override absoluto, manda el absoluto.

Si no existe override absoluto, se calcula por referencia y multiplicador.

Las referencias pueden apuntar a parámetros base o a otros assets.

No se permiten ciclos de referencia. Un valor no puede depender directa o indirectamente de sí mismo.

No se limita la longitud de las cadenas de herencia. Se pueden crear cadenas largas si el diseño lo necesita.

El sistema debe poder mostrar en debug el cálculo completo de cada valor final: referencia usada, valor final de la referencia, multiplicador, override absoluto si existe y resultado final.

Objetivo de diseño

El objetivo es evitar que el balance se rompa al tocar valores aislados. El juego debe funcionar como una malla de relaciones: si se ajusta una base o un valor importante, todo lo que depende de él debe actualizarse de forma coherente.

Este sistema será la base para balancear personajes, enemigos, habilidades, vida, daño, defensa, movimiento y progresión sin tener que retocar manualmente decenas de valores independientes.

Primer draft de parámetros relativos de personajes

Estos valores son un primer marco de balance. Todos deben considerarse relativos y ajustables. La implementación debe permitir cambiar bases, multiplicadores y overrides absolutos sin tocar lógica de juego.

Parámetros raíz necesarios

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

Canuter / Warrior

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

Assassin

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
Número de cuchillos: 20\. Valor específico de habilidad.  
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

Regla de dash

El dash es común a todos los personajes, con multiplicadores propios por personaje.

Durante el primer 75% del recorrido del dash, el personaje tiene invulnerabilidad.

Durante el último 25% del recorrido del dash, el personaje ya no tiene invulnerabilidad.

Esto permite usar el dash como esquiva, pero castiga caer encima de un enemigo o terminar mal posicionado.

Regla de teletransporte del assassin

El teletransporte es parecido al dash, pero mejor: tiene 25% más alcance que el dash final del assassin y ocurre de forma instantánea.

El teletransporte usa solo las 8 direcciones de apuntado.

No atraviesa muros, puertas cerradas ni colisiones sólidas.

Si la dirección de teletransporte encuentra una colisión antes de completar su distancia máxima, el assassin aparece en el último punto libre válido antes de la colisión.

Si el teletransporte termina en el aire, el assassin cae desde ahí con la física normal.

El teletransporte sirve para escapar de grupos de enemigos, recolocarse en vertical y preparar ataques aéreos, como el arco de cuchillos.

El cooldown debe impedir que se pueda spamear. Más adelante, algunos talismanes podrán reducir este cooldown.

Maga

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
Daño recibido: 0.80 contra daño recibido normal si la energía actual está por encima de 10\.  
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

Revisión de equilibrio

Canuter queda como centro del juego: rápido, estable, buen daño, curación y herramientas ofensivas.

Assassin queda como movilidad pura: más velocidad, más control aéreo, pared, cuerda y teletransporte. Su daño por impacto es bajo para no sustituir a Canuter como fuente principal de daño.

Maga queda más lenta, pero útil: abre rutas, rompe bloqueos, protege y pega fuerte con menor cadencia.

La relación entre personajes queda definida por herencia relativa, no por números sueltos. Si se ajusta Canuter, assassin y maga se reajustan de forma proporcional.

Controles y apuntado

Los controles deben ser compatibles con teclado y mando. Todos los controles serán remapeables desde el menú de settings.

Mando PlayStation

Stick izquierdo: movimiento y apuntado.  
X: salto y doble salto.  
Círculo: dash.  
Cuadrado: ataque normal.  
Triángulo: cambiar personaje.  
L1: habilidad 1\.  
R1: habilidad 2\.  
L2: habilidad 3\.  
R2: habilidad 4\.  
Start: menú principal.

Teclado por defecto

WASD: movimiento y apuntado.  
Espacio: salto y doble salto.  
Shift: dash.  
J: ataque normal.  
Q: cambiar personaje.  
H: habilidad 1, equivalente a L1.  
K: habilidad 2, equivalente a R1.  
U: habilidad 3, equivalente a L2.  
I: habilidad 4, equivalente a R2.  
Escape: menú principal.

Regla de apuntado

El apuntado usa siempre 8 direcciones: arriba, abajo, izquierda, derecha y las cuatro diagonales.

En teclado, las direcciones salen de WASD.

En mando, aunque el joystick sea analógico, el juego redondea la dirección a una de las 8 direcciones.

Los grados intermedios del joystick no se usan.

Regla de habilidades

Las habilidades se ejecutan directamente al pulsar su botón. No existe modo de selección de habilidad.

H, K, U e I deben poder pulsarse con la mano derecha sin soltar WASD.

Las habilidades activas que hacen daño consumen energía.

Habilidades comunes de movimiento

Dash: disponible para todos los personajes.  
Doble salto: disponible para todos los personajes.  
Movimiento rápido: disponible para todos los personajes, ajustado por rol.

Canuter es el más equilibrado y ágil. El assassin es el especialista en movilidad. La maga es más técnica, pero abre rutas mágicas, protege al equipo y rompe defensas.

Decisión técnica de UI: React sobre Phaser

La UI compleja del juego se implementará con React superpuesto al canvas de Phaser.

Phaser se usará para gameplay, físicas, mundo, personajes, enemigos, colisiones, cámara y efectos de juego.

React se usará para HUD, minimapa, menú de pausa, tabs, mapas, bestiario, scoring, settings, guardados, tooltips y pantallas de información.

Motivo de la decisión:

Construir menús complejos con React será más flexible que intentar resolverlos con sprites, tiles o arte específico.

React permite iterar más rápido en layouts, tabs, listas, tablas, barras, tooltips, paneles y navegación.

React evita depender de encontrar assets visuales específicos para cada opción de menú.

React permite que el menú de pausa, el Bestiario y el desglose de Scoring sean interfaces ricas, legibles y fáciles de mantener.

El HUD también podrá implementarse con React si resulta más cómodo: barras segmentadas de vida/energía, cooldowns, combo, score actual y mensajes contextuales.

El minimapa también podrá implementarse con React si se representa como una capa vectorial/DOM/SVG/canvas auxiliar sobre el juego. Esto puede facilitar pintar salas descubiertas, conectores, iconos y estados sin crear sprites específicos.

Regla general:

Todo lo que sea gameplay visual dentro del mundo se renderiza en Phaser.

Todo lo que sea interfaz, información, navegación, menús o feedback de sistema se renderiza en React, salvo que una razón técnica concreta recomiende hacerlo en Phaser.

La comunicación entre Phaser y React debe hacerse mediante un estado compartido o eventos explícitos: vida, energía, sala actual, mapa descubierto, combo, score, cooldowns, enemigos descubiertos, guardados y estado de pausa.

HUD, minimapa, menú y guardado

HUD principal

El HUD debe ser mínimo y legible durante combate rápido.

Arriba a la izquierda aparecen dos barras horizontales:

Barra roja de vida.  
Barra verde de energía.

Ambas barras se muestran en chunks o segmentos visibles. Cada punto de vida o energía corresponde a un segmento. Si el jugador tiene 10 de vida máxima, ve 10 segmentos. Si sube a 20 de vida máxima, la barra se alarga y muestra 20 segmentos. La energía funciona igual.

El objetivo es que el jugador pueda contar exactamente cuánta vida y energía tiene y calcular costes de habilidades sin depender solo de una barra abstracta.

Minimapa de sala

Arriba a la derecha aparece el minimapa de la sala actual.

El minimapa muestra:  
Posición aproximada del jugador.  
Estructura aproximada de la sala.  
Plataformas descubiertas.  
Conexiones descubiertas hacia otras salas.  
Sala actual.  
Collectibles descubiertos.  
Miniboss o boss si aplica.

El minimapa no muestra:  
Enemigos normales.  
Conexiones no descubiertas.  
Salas no exploradas.  
Secretos no descubiertos.

En salas de una sola celda lógica, el minimapa debe tener un zoom que permita ver la sala completa.

En salas extendidas de varias celdas lógicas, el minimapa no tiene por qué mostrar toda la sala a la vez. Debe seguir al jugador y mostrar la zona cercana. Las conexiones se revelan cuando el jugador explora la zona correspondiente.

Menú de pausa

El menú se abre con Start o Escape.

El menú ocupa aproximadamente el 90% de la pantalla, dejando un margen visible del juego detrás para mantener la sensación de pausa dentro del mundo, no de cambio total de escena.

El menú tiene seis tabs principales:

Mapa.  
Ta

Talismanes.  
Bestiario.  
Scoring.  
Tab Bestiario

El Bestiario funciona como una enciclopedia de enemigos descubiertos.

Un enemigo aparece en el Bestiario cuando el jugador lo encuentra por primera vez.

Cada entrada del Bestiario debe mostrar:

Nombre del enemigo.  
Sprite o retrato del enemigo.  
Bioma donde aparece.  
Vida.  
Daño.  
Multiplicador de score.  
Puntos relativos que aporta según score base.  
Comportamiento básico.  
Patrón de movimiento.  
Ataques.  
Debilidades o consejos si aplica.  
Si cuenta para combo.  
Si cuenta para limpieza de sala.

Los critters también pueden aparecer en una sección separada de fauna/critters, pero deben marcar claramente que no dan score, no dan energía y no cuentan para limpieza.

Tipografía pixel art y sistema de diálogos

Los diálogos del juego serán pocos y breves, pero deben usar una tipografía pixel art coherente con la dirección visual.

La fuente de diálogos debe sentirse retro/fantasy y mantenerse legible en textos cortos.

Candidato principal de CraftPix:

Simplified Medieval Gothic Pixel Font For Video Games:  
https://craftpix.net/product/simplified-medieval-gothic-pixel-font-for-video-games/

Este pack incluye alfabeto latino en mayúsculas y minúsculas y números 0-9, con estilo medieval/gothic pixel art pensado para narrativa, menús, diálogos, señales y quest logs.

Alternativa más decorativa:

Straight Pixel Gothic Font:  
https://craftpix.net/product/straight-pixel-gothic-font/

Esta alternativa contiene símbolos básicos, puntuación, escritura latina y cirílica en formato .otf. Puede servir para títulos, pistas, scrolls o textos decorativos, pero puede ser menos limpia para diálogos frecuentes.

Regla de implementación de diálogos

La fuente de diálogos debe tratarse como un asset propio del juego.

Si el pack viene como fuente instalable, se integrará directamente como fuente web/local del proyecto.

Si el pack viene como imágenes o sprites de letras, habrá que recortar cada carácter y crear un sistema de renderizado letra a letra.

El sistema de diálogo debe poder convertir un input de texto localizado en una secuencia de glyphs renderizados con la fuente pixel art.

El sistema debe soportar, como mínimo:  
Letras latinas.  
Números.  
Puntuación básica.  
Espacios.  
Saltos de línea.  
Caracteres acentuados necesarios para catalán, castellano, francés, portugués e italiano.

Si el pack no contiene todos los caracteres necesarios para las localizaciones, habrá que crear glyphs extra manualmente o usar fallback visual coherente.

Los diálogos deben mostrarse preferiblemente con React si forman parte de UI/cajas de texto, manteniendo Phaser para la escena de gameplay detrás.

Feedback visual de combo en HUD

El jugador debe recibir feedback visual claro cuando entra en combo.

El feedback de combo forma parte del HUD y se implementará preferiblemente con React, igual que el resto de UI. Si se necesitan efectos muy visuales de partículas o vibración compleja, React puede combinarse con sprites o efectos renderizados por Phaser.

Regla de aparición:

Si el combo está por debajo de C, no se muestra indicador grande de combo.

Cuando el jugador llega a Combo C, aparece el indicador lateral de combo.

Ubicación sugerida: lado derecho de la pantalla, sin tapar gameplay importante.

Elementos del indicador de combo:

Letra/rango actual: C, B, A, S o S+.  
Contador de enemigos puntuables matados en la cadena actual.  
Puntos acumulados por ese combo.  
Multiplicador actual.

Comportamiento visual del contador:

Cada vez que el jugador mata un enemigo puntuable durante el combo, aparece un número pequeño con el contador actualizado.

Ese número sale desde el centro o borde de la letra de rango y salta hacia arriba, como una pequeña partícula tipo pop.

Los números deben dispersarse levemente hacia izquierda o derecha para que parezcan vivos, pero sin molestar.

El contador debe ser discreto: visible si el jugador se fija, pero no invasivo.

Debajo o cerca de la letra de rango debe mostrarse el acumulado de puntos conseguidos por el combo actual.

Evolución visual por rango:

Combo C:  
Aparece la letra C.  
Feedback simple.  
Sin efectos intensos.

Combo B:  
La letra B aparece con glow suave.  
El indicador empieza a sentirse más valioso.

Combo A:  
La letra A tiene glow más potente, preferiblemente cálido o rojizo.  
Puede empezar a moverse ligeramente.

Combo S:  
La letra S usa un efecto fuerte: fuego azul, brillo intenso o aura energética.  
Debe vibrar o moverse de forma clara.  
Puede aparecer texto Max o feedback equivalente.

Combo S+:  
La letra o insignia aumenta presencia visual.  
Puede combinar fuego azul con electricidad, arcos eléctricos o destellos.  
Debe comunicar estado excepcional.

Assets de rango

Las letras C, B, A, S y S+ pueden ser sprites/imágenes diseñadas específicamente para que tengan más personalidad que texto normal.

Si no se encuentran assets adecuados, se podrán crear con Phaser o React usando texto estilizado, glow, transformaciones, sombras y animaciones.

La decisión final queda abierta, pero el sistema debe diseñarse para permitir sustituir texto por sprites sin cambiar la lógica de scoring.

Datos que alimentan el HUD de combo:

Combo actual.  
Rango de combo actual.  
Multiplicador actual.  
Puntos acumulados del combo actual.  
Último enemigo matado.  
Puntos generados por la última kill.  
Tiempo restante del timer de combo.

El HUD de combo debe ayudar al jugador a entender que conviene matar enemigos débiles primero para subir multiplicador y reservar enemigos valiosos para rangos altos.

ién pueden aparecer en una sección separada de fauna/critters, pero deben marcar claramente que no dan score, no dan energía y no cuentan para limpieza.

Función de diseño del Bestiario:  
Ayudar al jugador a entender qué enemigos son más valiosos.  
Permitir que el jugador planifique combos.  
Explicar patrones sin obligar a aprender solo por prueba y error.  
Reforzar la sensación de colección tipo Pokédex, pero aplicada al combate y scoring.

Tab Scoring

La pestaña Scoring muestra el desglose de puntuaciones del jugador.

Debe ayudar al jugador a entender de dónde salen sus puntos y cómo puede mejorar.

Debe mostrar, como mínimo:

Mejor puntuación por sala.  
Mejor rango por sala.  
Mejor combo conseguido por sala.  
Mejor tiempo por sala limpiada.  
Si la sala fue completada sin recibir daño.  
Si la sala fue limpiada por completo.  
Score real de cada bioma.  
Rango de cada bioma.  
Score ideal de cada bioma.  
Porcentaje de completado de scoring por bioma.  
Puntuación conseguida contra cada mini jefe.  
Tiempo de derrota de cada mini jefe.  
Puntuación conseguida contra cada jefe.  
Tiempo de derrota de cada jefe.

La pestaña Scoring debe permitir seleccionar sala, bioma, mini jefe o jefe para ver un desglose más detallado.

Debe existir una opción de ayuda o explicación del scoring.

Esa explicación debe cubrir:

Cómo funciona el score base.  
Cómo puntúan los enemigos.  
Cómo funcionan los multiplicadores de combo.  
Combo 0 a 2: x1.  
Combo 3 a 5: x1,5 / C.  
Combo 6 a 8: x2 / B.  
Combo 9 a 11: x2,5 / A.  
Combo 12 o más: x3 / S.  
Cómo puntúan mini jefes y jefes por tiempo.  
Cómo se calcula el score ideal de sala.  
Cómo se calcula el rango de sala.  
Cómo se calcula el score y rango de bioma.  
Qué significa S+.

El objetivo es que el jugador no tenga que inferir el sistema solo por prueba y error.

ings.  
Guardados.

En mando, L1 y R1 cambian de tab.

La pestaña Mapa muestra primero el mapa global del mundo. Al inicio solo se puede seleccionar Bosc Antic. Los demás biomas aparecen cubiertos por niebla o bloqueados.

En el mapa global, el joystick selecciona bioma. L2 y R2 controlan zoom in y zoom out. X entra al mapa interno del bioma seleccionado.

En el mapa interno de bioma, solo aparecen salas descubiertas y conectores descubiertos. El jugador puede moverse de sala en sala con el joystick. L2 y R2 controlan zoom. X sobre una sala descubierta abre el mapa detallado de esa sala.

El mapa detallado de sala muestra lo explorado de esa sala, conexiones descubiertas, collectibles descubiertos y miniboss/boss si aplica. No muestra enemigos normales.

Círculo, Escape o Start sirven para volver o cerrar.

Guardado, muerte y respawn

El juego guarda automáticamente cada vez que el jugador cambia de sala.

El autosave siempre escribe sobre un único Autosave Slot. No crea múltiples autosaves.

En la pestaña Guardados se muestra primero el Autosave Slot. Después aparece un separador visual. Debajo aparecen los Custom Save Slots.

El jugador puede crear guardados manuales en slots custom para conservar puntos concretos de progreso.

El jugador puede cargar tanto el autosave como cualquier guardado manual existente.

Al morir, aparece un menú de muerte con dos opciones:

Continuar: carga el último autosave.  
Salir: vuelve al menú principal.

Al cargar un autosave, se restaura el estado guardado al cambiar de sala. El score parcial de la sala actual se pierde si el jugador muere antes de archivarlo.

Vida y energía

El equipo comparte una única barra de vida y una única barra de energía.

Vida inicial: 20\.  
Vida máxima final: 40\.  
Mejoras de vida: \+5 vida máxima por bioma completado o por mejora principal equivalente.

Energía inicial: 20\.  
Energía máxima final: 40\.  
La energía no se regenera sola.

Recuperación de energía

Golpe melee acertado: \+1 energía.  
Cuchillo o proyectil acertado: \+0,5 energía.  
Matar enemigo: \+3 energía.

Curación

La curación es instantánea y no detiene al jugador.  
Coste: 10 energía.  
Curación: recupera 8 vida.  
Cooldown: 3 segundos.

La curación debe mantener el ritmo rápido. El jugador no debe quedarse quieto para curarse.

Sistema de scoring determinista

El scoring debe ser numérico, determinista y configurable mediante parámetros relativos. No debe depender de valores escritos a mano para cada sala salvo que exista un override explícito.

Los rangos C, B, A, S y S+ son una lectura visual del score. No son la base del cálculo.

Score base

Existe un parámetro raíz llamado score base.

Todos los enemigos puntuables, mini jefes, jefes, bonus y rangos se calculan a partir de ese score base mediante multiplicadores relativos.

Score de enemigos normales

Cada enemigo puntuable tiene un multiplicador de score.

Fórmula:

score enemigo \= score base × multiplicador de enemigo × multiplicador de combo actual

Los critters tienen score 0\.

Los critters no cuentan para combo.

Los critters no cuentan para limpieza completa de sala.

Los critters no cuentan para calcular el score ideal de sala.

Combo individual

El combo aumenta cuando el jugador mata enemigos puntuables.

El combo no aumenta al matar critters.

El combo se mantiene si el jugador mata otro enemigo puntuable antes de que expire el timer de combo.

Timer de combo por defecto: 3 segundos.

El combo se reinicia si:  
Pasa el timer sin matar otro enemigo puntuable.  
El jugador cambia de sala.  
El jugador muere.

Recibir daño no reinicia el combo por defecto. El daño recibido afecta al scoring de sala mediante el componente de daño/no-hit, no al contador de combo.

Rangos visuales de combo y multiplicadores

Combo 0 a 2: x1.

Combo 3 a 5: x1,5. Rango visual C.

Combo 6 a 8: x2. Rango visual B.

Combo 9 a 11: x2,5. Rango visual A.

Combo 12 o más: x3. Rango visual S y multiplicador máximo.

El multiplicador aplica a partir del enemigo que se mata con ese estado de combo. No recalcula enemigos anteriores.

Cuando el combo llega a S, el HUD de combo debe reforzarlo visualmente: vibración, brillo, texto Max o feedback equivalente.

Mini jefes y jefes

Mini jefes y jefes no puntúan como enemigos normales. Puntúan por eficiencia al derrotarlos.

El scoring de mini jefe y jefe se calcula desde que empieza el combate hasta que muere el mini jefe o jefe.

Mini jefe:

score mini jefe \= max(0, score base × multiplicador mini jefe \- segundos de combate × penalizador temporal mini jefe)

Valor inicial propuesto:  
Multiplicador mini jefe: x10.  
Penalizador temporal mini jefe: x4 por segundo.

Jefe:

score jefe \= max(0, score base × multiplicador jefe \- segundos de combate × penalizador temporal jefe)

Valor inicial propuesto:  
Multiplicador jefe: x20.  
Penalizador temporal jefe: x4 por segundo.

Estos valores son configurables por boss y pueden ajustarse durante balance.

Score real de sala

El score real de una sala se calcula como:

score real sala \= suma de scores reales de enemigos puntuables \+ bonus limpieza \+ bonus no-hit/daño \+ bonus tiempo

La suma de enemigos reales usa el combo real conseguido por el jugador.

Bonus de limpieza

El bonus de limpieza se aplica solo si el jugador mata todos los enemigos puntuables de la sala.

Los critters no cuentan.

Fórmula:

bonus limpieza \= score ideal enemigos de la sala × factor limpieza

Bonus de no-hit / daño recibido

El bonus de daño se calcula en función de cuánto daño recibe el jugador en la sala.

La fórmula exacta puede ajustarse, pero debe derivar del score ideal de enemigos de la sala.

Fórmula base:

bonus daño \= score ideal enemigos de la sala × factor daño × proporción de vida conservada

Si la sala se completa sin recibir daño, obtiene el máximo bonus de daño.

Si el jugador recibe mucho daño, el bonus baja proporcionalmente.

Bonus de tiempo

Cada sala puede tener un tiempo objetivo calculado por diseño o definido por override.

El bonus de tiempo debe ser continuo, no por rangos cerrados.

Fórmula base:

bonus tiempo \= bonus tiempo máximo × min(1, tiempo objetivo / tiempo real)

Esto significa:  
Si el jugador tarda menos o igual que el tiempo objetivo, recibe todo el bonus de tiempo.  
Si tarda más, el bonus baja progresivamente.  
No hay saltos artificiales entre rangos.

Score ideal de sala

Cada sala debe poder calcular automáticamente un score ideal de referencia.

Este score ideal no tiene que ser el máximo matemático perfecto, sino un techo razonable, determinista y útil para calcular rangos.

Cálculo del score ideal de enemigos:

1\. Tomar todos los enemigos puntuables de la sala.  
2\. Excluir critters.  
3\. Ordenar los enemigos de menor a mayor valor base.  
4\. Simular una run ideal donde el jugador mata a todos los enemigos seguidos sin perder combo.  
5\. Aplicar los multiplicadores de combo progresivos.

Catálogo de obstáculos y lenguaje de plataformas del Bosc Antic

Esta sección define las herramientas de construcción disponibles para diseñar las salas del Bosc Antic. No cierra todavía el layout exacto de cada sala.

Obstáculos y elementos interactivos

1\. Espines de l’Arrel

Assets candidatos: Objects\_Animated/Spike1, Spike2, Spike3, Spike4.

Función: obstáculo dañino fijo.

Comportamiento:  
Hace daño al tocar.  
No se puede destruir.  
No cuenta como enemigo.  
No da score.  
Sirve para enseñar precisión de salto, dash y posicionamiento.

Uso recomendado:  
Desde sala 04 en adelante.  
Uso moderado en la demo.  
Mayor presencia en salas 12, 13 y 15\.

Regla de diseño: no abusar de pinchos. Canuter debe sentirse como combate rápido, no como plataformas castigadoras.

2\. Planta Trampa

Asset candidato: Objects\_Animated/Plant/trap\_plant.

Función: obstáculo/enemigo ambiental.

Comportamiento:  
Parece decoración.  
Se activa cuando Canuter entra en rango.  
Muerde o golpea.  
Hace daño.  
No se mueve.

Decisión provisional: tratarla como enemigo puntuable menor si encaja bien con el sistema de combo.

Uso recomendado:  
Sala 04 para enseñar timing.  
Sala 07 para castigar curación mal posicionada.  
Sala 12 combinada con proyectiles.  
Sala 15 como presión previa al jefe.

3\. Arrels Negres

Asset candidato: Trees and Bushes Pixel Art for Platformer, carpeta 4 Roots.

Función: raíz corrupta, bloqueo vegetal, decoración o daño leve según variante.

Tipos:  
Arrel decorativa: solo ambientación.  
Arrel bloqueig: bloquea camino hasta volver con Bruna u otra habilidad.  
Arrel danyosa: hace daño al tocar.

Uso recomendado:  
Sala 01 como bloqueo hacia la izquierda.  
Sala 08 como corrupción central.  
Sala 13 como zona inferior corrupta.  
Sala 16 como parte de la arena de Mare Espina.

Regla de diseño: priorizar raíces decorativas y de bloqueo. No abusar de raíces dañinas para no duplicar el rol de los pinchos.

4\. Porta d’Arrel

Asset candidato: Objects/128/object\_0000\_door.png combinado con raíces.

Función: puerta o bloqueo de progresión.

Comportamiento:  
Puede estar cerrada por raíces o corrupción.  
Puede requerir Bruna, talismán, jefe derrotado o evento narrativo.  
No debe abrirse al inicio si es ruta de backtracking.

Uso recomendado:  
Sala 01 hacia la izquierda.  
Accesos a salas ocultas.  
Rutas futuras de backtracking.

5\. Pont Vell

Assets candidatos: bridge corner/filler del tileset.

Función: plataforma puente.

Comportamiento:  
Plataforma estable.  
No rompible por defecto.  
Sirve para huecos, rutas elevadas y conexión entre troncos o ramas.

Uso recomendado:  
Sala 03, Pas de la Soca.  
Sala 04, Niu de Fulles.  
Sala 09, Mirador de l’Arrel.  
Sala 12, Brancam Alt.

6\. Escala de Soca

Assets candidatos: stairway filler/corners del tileset.

Función: escalera, bajada, subida o transición visual.

Comportamiento:  
Puede ser decoración.  
Puede marcar transición entre sala 00 y sala 01\.  
Puede usarse como punto de interacción: colocarse encima y pulsar abajo.

Uso recomendado:  
Conexión Refugi de la Copa Mare hacia sala 01\.  
Entradas verticales.  
Zonas de transición entre alturas.

7\. Cristall de Savia

Asset candidato: Objects\_Animated/Crystal.

Función principal: nodo mágico de teletransporte.

Comportamiento:  
Al descubrirlo físicamente, se añade al mapa como punto de viaje rápido.  
Puede brillar cuando está activo.  
No debe confundirse con pickup normal de energía.

Uso recomendado:  
Sala 00: teletransporte principal.  
Sala 05: primer teletransporte de campo.  
Sala 09 o 10: teletransporte medio/opcional.  
Sala 15: teletransporte previo al jefe.

Regla de diseño: fijar Cristall de Savia como símbolo de teletransporte para no mezclar demasiadas funciones visuales.

8\. Caixa de Botí

Asset candidato: Objects/32/object\_0009\_lootbox.png.

Función: contenedor de recompensa.

Comportamiento:  
Contiene talismán, mejora o collectible.  
Se abre una vez.  
Queda registrada como abierta.  
Aparece en minimapa/mapa si se ha descubierto.

Uso recomendado:  
Sala 03: Talismán del Corte Circular.  
Sala 06: Talismán de Savia.  
Sala 09: Talismán del Corte Lejano.  
Sala 10: Talismán de Vitalidad Menor.  
Sala 14: Talismán del Golpe Pesado.

9\. Cors de Savia

Asset candidato: Objects\_Animated/Heart.

Función: pickup de vida.

Comportamiento:  
Recupera vida.  
No aumenta vida máxima.  
No cuenta como recompensa principal.  
Puede reaparecer o ser único según sala.

Uso recomendado:  
Uso muy limitado.  
Posible antes de jefe o en sala difícil.  
Candidatos: sala 13 o sala 15\.

10\. Moneda / Fulla Daurada

Asset candidato: Objects\_Animated/Coin.

Función: pendiente.

Decisión provisional: no usar economía ni monedas como sistema principal en la demo.

Si se usan, deben ser guía visual, secreto menor o collectible sin tienda. No abrir economía todavía.

11\. Pedra Viva / Pedra Trencable

Asset candidato: Objects\_Animated/Stone.

Función posible: bloque rompible, obstáculo móvil, piedra decorativa o proyectil de jefe.

Uso recomendado para la demo:  
Pedra Trencable como bloque que se rompe con Talismán del Golpe Pesado.  
Aparece después de sala 14\.  
Puede usarse en sala 14 para probar golpe cargado y en sala 15 como preparación final.

12\. Senyals del Bosc

Assets candidatos: señales del tileset y del environment pack.

Función: onboarding diegético.

Comportamiento:  
Carteles breves.  
Enseñan controles o pistas sin popup invasivo.  
Pueden contener frases muy cortas.

Uso recomendado:  
Sala 01: moverse, saltar, atacar.  
Sala 03: usar talismán.  
Sala 06: curarse.  
Sala 09: ataque a distancia.  
Sala 15: aviso de jefe.

13\. Herba, Arbustos i Branques

Assets candidatos:  
Forest Pixel Art Environment Asset Set.  
Trees and Bushes Pixel Art for Platformer.

Función: decoración, foreground, background y variación visual.

Comportamiento:  
No bloquean.  
No dañan.  
No dan score.  
Dan vida al Bosc Antic.

Uso recomendado:  
Todas las salas.  
Deben variar por zona para que no todas las salas parezcan iguales.

Jerarquía de uso de obstáculos

Daño directo:  
Espines de l’Arrel, Planta Trampa, Arrel danyosa.

Bloqueo/progresión:  
Porta d’Arrel, Arrel bloqueig, Pedra Trencable.

Movimiento/plataforma:  
Pont Vell, Escala de Soca.

Recompensa:  
Caixa de Botí, Cors de Savia, Cristall de Savia.

Sistema:  
Cristall de Savia como teletransporte.

Onboarding:  
Senyals del Bosc.

Decoración:  
Herba, arbustos, branques, raíces decorativas.

Lenguaje de plataformas del Bosc Antic

El diseño de plataformas no debe cerrarse tile a tile en el GDD. En su lugar, se define un lenguaje de formas base que el level designer puede combinar libremente sala a sala.

Formas base permitidas

1\. Suelo plano

Función: combate básico, lectura clara, tutorial y arenas simples.

Uso recomendado:  
Salas 01, 02 y zonas iniciales.

2\. Plataforma corta

Función: salto básico, separación de enemigos, pequeñas rutas superiores.

Uso recomendado:  
Salas 03, 04, 07 y 09\.

3\. Plataforma larga

Función: zona de combate horizontal, grupos de enemigos y persecución.

Uso recomendado:  
Salas 05, 08, 11 y 15\.

4\. Escalón

Función: enseñar cambio de altura sin exigir precisión.

Uso recomendado:  
Primeras salas y transiciones suaves.

5\. Pared vertical

Función: límite de sala, zona de rebote visual, futura lectura de rutas con Neret.

Regla: antes de desbloquear Neret, no exigir wall jump para avanzar por ruta principal.

6\. Pozo o caída

Función: crear riesgo vertical y separar zonas.

Uso recomendado:  
Moderado en Bosc Antic.  
Más fuerte en salas 12 y 13\.

7\. Techo bajo

Función: limitar salto, forzar combate horizontal y controlar altura de la cámara.

Uso recomendado:  
Pasillos, cuevas vegetales y rutas inferiores.

8\. Pont Vell / puente

Función: conectar huecos, cruzar raíces, dar sensación de estructura construida o natural.

Uso recomendado:  
Salas 03, 04, 09 y 12\.

9\. Escala visual o bajada

Función: transición entre alturas o salas.

Uso recomendado:  
Sala 00 a sala 01 y zonas de conexión vertical.

10\. Columna / tronco

Función: romper línea de visión, separar enemigos, crear cobertura visual y dar identidad forestal.

Uso recomendado:  
Salas 05, 08, 11 y 16\.

11\. Plataforma flotante

Función: combate vertical, enemigos a distancia, secretos altos.

Uso recomendado:  
Sala 09 y ruta superior.

12\. Cornisa

Función: punto de aterrizaje, secreto, recompensa o transición a ruta lateral.

Uso recomendado:  
Salas 04, 09, 12 y secretos.

13\. Pasillo estrecho

Función: presión, enemigos frontales, Tribal Lancero, Flor Mordedora o trampas.

Uso recomendado:  
Salas 07, 11, 13 y antesalas.

14\. Sala vertical

Función: enseñar subida, cámara vertical y lectura de alturas.

Regla: antes de Neret, debe poder resolverse con salto/doble salto/dash normal. No exigir wall jump.

15\. Arena de combate

Función: combate fuerte, cierre de sala, mini jefe o jefe.

Uso recomendado:  
Sala 15 como repaso fuerte y sala 16 como arena de Mare Espina.

Restricciones de diseño para Bosc Antic

Al principio, usar plataformas simples y lectura clara.

Antes de Talismán de Savia, evitar salas demasiado castigadoras.

Antes de Neret, no exigir wall jump.

Antes de Bruna, no exigir romper bloqueos mágicos para avanzar en ruta principal.

Antes del Talismán del Golpe Pesado, no exigir romper piedras en ruta principal.

Los secretos sí pueden insinuar rutas futuras que todavía no se pueden abrir.

Los obstáculos deben reforzar el combate rápido, no sustituirlo por plataformas demasiado punitivas.

El level designer tiene libertad para combinar estas formas, pero cada sala debe declarar qué formas base usa y con qué intención.

ivos.

La razón de ordenar de menor a mayor valor es que una run ideal usaría enemigos de menor valor para subir combo y reservaría enemigos de mayor valor para multiplicadores altos.

Ejemplo de multiplicadores en simulación ideal:

Enemigos 1 a 3: x1.  
Enemigos 4 a 6: x1,5.  
Enemigos 7 a 9: x2.  
Enemigos 10 a 12: x2,5.  
Enemigos 13 en adelante: x3.

score ideal sala \= score ideal enemigos \+ bonus limpieza ideal \+ bonus no-hit ideal \+ bonus tiempo ideal

Los bonus ideales se calculan como factores relativos sobre el score ideal de enemigos.

Rango de sala

El rango de sala se calcula comparando score real contra score ideal.

porcentaje sala \= score real sala / score ideal sala

Rangos:

C: menos de 50%.  
B: 50% a 69%.  
A: 70% a 89%.  
S: 90% o más.  
S+: 100% o más.

S+ existe porque el score ideal es un techo razonable, no necesariamente el techo absoluto matemático. Si un jugador supera el ideal mediante una ejecución excelente, puede obtener S+.

Score real de bioma

El score real de un bioma se calcula sumando las mejores puntuaciones históricas de sus salas y jefes.

score real bioma \= suma de mejores scores históricos de salas \+ mejor score histórico de mini jefe \+ mejor score histórico de jefe

Las salas ocultas no descubiertas cuentan como 0 en el score real del bioma.

Score ideal de bioma

score ideal bioma \= suma de scores ideales de todas las salas del bioma \+ score ideal mini jefe \+ score ideal jefe

Las salas ocultas sí forman parte del score ideal de bioma. Esto permite que el jugador vea que aún le falta potencial de puntuación si no ha descubierto todo.

Rango de bioma

porcentaje bioma \= score real bioma / score ideal bioma

Rangos:

C: menos de 50%.  
B: 50% a 69%.  
A: 70% a 89%.  
S: 90% o más.  
S+: 100% o más.

Datos guardados de scoring

El juego debe guardar:

Mejor score histórico por sala.  
Mejor rango histórico por sala.  
Mejor tiempo si la sala fue limpiada.  
Si se completó sin recibir daño.  
Si se hizo limpieza completa.  
Mejor score histórico de cada mini jefe.  
Mejor score histórico de cada jefe.  
Score total del bioma.  
Rango total del bioma.

Si el jugador muere, se pierde el score parcial de la sala actual y se carga el último autosave.

Puntuación por bioma

La puntuación de un bioma se calcula sumando la mejor puntuación de todas sus salas.

Si existe una sala oculta y el jugador no la ha descubierto, esa sala cuenta como 0 puntos reales para el bioma, pero sigue contando dentro del score ideal de bioma.

Tras derrotar al jefe final del juego, el jugador puede seguir explorando para descubrir salas ocultas y mejorar puntuaciones.

Información desbloqueable para endgame

En fases avanzadas o en el endgame, el jugador podrá desbloquear herramientas para ver información de completado.

Información posible: número total de salas por bioma, salas descubiertas, mejor puntuación por sala, salas con puntuación pendiente y pistas de puntos especiales del mapa.

Los puntos especiales pueden señalar paredes rompibles, rutas ocultas o zonas donde una habilidad concreta puede abrir camino.

Este sistema queda pendiente de concretar dentro del sistema de mapa, talismanes o habilidad final.

Regla de diseño de combate

La dificultad no debe venir de enemigos con demasiada vida. La dificultad debe venir de la cantidad de enemigos, su combinación, la presión de la sala, la necesidad de cambiar de personaje y la capacidad del jugador para mantener el combo.

Vida de enemigos por bioma

Bosc Antic: enemigos normales con 2 a 4 vida. Deben morir en 1 o 2 golpes de Canuter. Grupos habituales de 3 a 6 enemigos por sala.

Cim Gelat: enemigos normales con 4 a 8 vida. Deben morir en 2 a 4 golpes. Grupos habituales de 4 a 8 enemigos por sala.

Mina Enfonsada: enemigos normales con 6 a 12 vida. Algunos pueden tener armadura o defensa especial. Grupos habituales de 5 a 10 enemigos por sala.

Nucli de la Vena: enemigos normales con 8 a 16 vida. Deben combinar patrones aprendidos en los biomas anteriores. Grupos habituales de 6 a 12 enemigos por sala.

Vida de mini jefes y jefes

Mini jefe Bosque: 80 vida.  
Jefe Bosque: 180 vida.  
Mini jefe Nieve: 120 vida.  
Jefe Nieve: 250 vida.  
Mini jefe Mina: 160 vida.  
Jefe Mina: 320 vida.  
Mini jefe Núcleo: 220 vida.  
Jefe final: 500 vida.

Diseño detallado de jefes del Bosc Antic

Regla general de naming y traducción

Los nombres propios de personajes, lugares, biomas, enemigos únicos y jefes no se traducen.

Los nombres de ataques, habilidades, objetos funcionales, pickups y descripciones sí se traducen/localizan.

Por tanto, Mare Espina y Aranya d’Escorça se mantienen como nombres propios. Sus ataques sí deben traducirse en cada idioma.

Regla de diseño de jefes basada en assets

Las habilidades de los jefes deben estar relacionadas con las animaciones reales disponibles en sus spritesheets.

No se deben inventar ataques que requieran animaciones inexistentes si no pueden resolverse claramente con Phaser mediante efectos, proyectiles, partículas o movimiento programado.

El diseño debe partir de las animaciones disponibles y añadir efectos programados solo cuando encaje visualmente.

Mini jefe: Aranya d’Escorça

Nombre propio: Aranya d’Escorça.

Tipo: mini jefe del Bosc Antic.

Asset principal:  
Pixel Art Monster Enemy Game Sprites:  
https://craftpix.net/product/pixel-art-monster-enemy-game-sprites/

Carpeta candidata: PNG/spider/.

Animaciones disponibles:  
Idle.  
Walk.  
Attack.  
Hurt.  
Death.  
Web.

Concepto visual:  
Aranya d’Escorça es una araña enorme de corteza, musgo y resina que vive entre las raíces y troncos del Bosc Antic. No es una araña normal: es una criatura antigua ligada a La Copa Mare y deformada por L’Arrel Negra.

Función de diseño:  
Primer combate de jefe menor.  
Enseña control de espacio.  
Introduce ralentización/resina.  
Obliga a usar dash y posicionamiento.  
Prepara al jugador para arenas con ataques telegráficos.

Ataques traducibles de Aranya d’Escorça

Nombre de trabajo en catalán: Mossegada d’Escorça.  
Función: mordisco frontal.  
Animación base: Attack.  
Comportamiento: la araña avisa, ataca hacia delante y queda brevemente vulnerable.

Nombre de trabajo en catalán: Fil de Resina.  
Función: disparo de telaraña/resina.  
Animación base: Web.  
Comportamiento: lanza una línea o proyectil de resina que ralentiza a Canuter si impacta o deja una zona pegajosa breve en el suelo.

Nombre de trabajo en catalán: Salt Curt.  
Función: salto corto hacia el jugador.  
Animación base: Walk/Attack más movimiento programado en Phaser.  
Comportamiento: la araña salta una distancia corta para reposicionarse o cerrar espacio.

Nombre de trabajo en catalán: Crida de Larves.  
Función: invocar adds pequeños.  
Animación base: Idle o Attack.  
Comportamiento: invoca 2 o 3 critters corruptos, culebras pequeñas o fauna menor para crear presión.

Fase final:  
Al bajar de cierto umbral de vida, aumenta frecuencia de Fil de Resina y deja más zonas pegajosas. No debe convertirse en combate largo; sigue siendo mini jefe.

Jefe final del Bosc Antic: Mare Espina

Nombre propio: Mare Espina.

Tipo: jefe final del Bosc Antic.

Asset principal:  
Pixel Art Monster Enemy Game Sprites:  
https://craftpix.net/product/pixel-art-monster-enemy-game-sprites/

Carpeta candidata: PNG/ent/.

Animaciones disponibles:  
Idle.  
Walk.  
Attack.  
Hurt.  
Death.

Concepto visual:  
Mare Espina es un árbol viviente antiguo, grande y corrompido por L’Arrel Negra. Debe sentirse como una criatura vegetal maternal y protectora que ha sido deformada por la corrupción, no como un monstruo malvado sin más.

Función de diseño:  
Cerrar el Bosc Antic.  
Validar todo lo aprendido con Canuter.  
Combinar movimiento, ataque circular, curación, onda de corte y golpe cargado.  
Presentar el primer combate de jefe grande.  
Justificar el desbloqueo de Neret al derrotarla.

Ataques traducibles de Mare Espina

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

Reglas de arena de Mare Espina

La arena debe ser clara y legible.

Debe tener espacio suficiente para dash.

Debe evitar plataformas excesivamente complejas. El reto principal debe venir de patrones, raíces, espinas y adds, no de saltos injustos.

Puede tener pequeñas plataformas laterales si ayudan a esquivar o usar onda de corte, pero el combate debe ser viable desde suelo.

Recompensas de Mare Espina

Desbloqueo de Neret.  
Acceso narrativo hacia Cim Gelat.  
Cierre del Bosc Antic.  
Registro de score de jefe basado en tiempo.

Score de jefes del Bosc Antic

Aranya d’Escorça usa la fórmula de mini jefe:  
score mini jefe \= max(0, score base × multiplicador mini jefe \- segundos de combate × penalizador temporal mini jefe)

Mare Espina usa la fórmula de jefe:  
score jefe \= max(0, score base × multiplicador jefe \- segundos de combate × penalizador temporal jefe)

Los valores iniciales siguen siendo:  
Mini jefe: x10 contra score base.  
Jefe: x20 contra score base.  
Penalizador temporal inicial: x4 por segundo.

Catálogo de enemigos y critters del Bosc Antic

Este catálogo define las herramientas de enemigo disponibles para diseñar las salas del Bosc Antic. No asigna todavía enemigos a layouts exactos de sala.

Pack principal de enemigos normales

Forest Enemies Pixel Art Sprite Sheet Pack:  
https://craftpix.net/product/forest-enemies-pixel-art-sprite-sheet-pack/

Este pack será la base principal de enemigos normales del Bosc Antic. Contiene serpiente, dos flores y tres guerreros tribales con lanza, martillo y palo. El estilo es pixel art y encaja con la dirección visual actual.

1\. Culebra de Raíz

Asset visual: serpiente del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: enemigo básico de suelo.  
Tamaño: pequeño. Aproximadamente 0,5 veces la altura de Canuter.  
Vida: 1 vez vida básica de enemigo de bosque.  
Daño: 1 vez daño básico de enemigo de bosque.  
Movimiento: patrulla horizontal lenta. Gira al tocar borde o pared.  
Ataque: contacto. No ataca activamente.  
Función: primer enemigo tutorial. Enseña que tocar enemigos hace daño y que hay que atacar.  
Uso recomendado: salas iniciales, grupos pequeños y plataformas bajas.

2\. Flor Mordedora

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

3\. Flor Espora

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

4\. Tribal del Palo

Asset visual: guerrero tribal con palo del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: melee básico humanoide.  
Tamaño: medio. Aproximadamente 0,9 veces la altura de Canuter.  
Vida: 2 veces vida básica de enemigo de bosque.  
Daño: 1,2 veces daño básico de enemigo de bosque.  
Movimiento: patrulla. Si ve al jugador, camina hacia él.  
Ataque: golpe corto frontal.  
Función: primer enemigo de combate real.  
Uso recomendado: salas centrales, grupos de 2 o 3 y combinado con culebras.

5\. Tribal Lancero

Asset visual: guerrero tribal con lanza del Forest Enemies Pixel Art Sprite Sheet Pack.  
Rol: melee de alcance.  
Tamaño: medio. Aproximadamente igual que Tribal del Palo.  
Vida: 2 veces vida básica de enemigo de bosque.  
Daño: 1,4 veces daño básico de enemigo de bosque.  
Movimiento: patrulla y persigue al jugador en rango medio.  
Ataque: estocada frontal más larga que el palo.  
Función: castigar acercarse de frente sin pensar.  
Uso recomendado: pasillos, plataformas horizontales y antesalas de jefe.

6\. Tribal Martillo

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

Pack opcional de apoyo

Field Enemies Game Sprite Sheets Pixel Art:  
https://craftpix.net/product/field-enemies-game-sprite-sheets-pixel-art/

Este pack solo se usará si al probarlo en juego encaja visualmente. Sirve para añadir variedad sin convertirlo en la base del bioma.

7\. Bicho de Campo

Rol: enemigo pequeño de relleno.  
Tamaño: pequeño. Aproximadamente 0,45 veces la altura de Canuter.  
Vida: 0,75 veces vida básica de enemigo de bosque.  
Daño: 0,75 veces daño básico de enemigo de bosque.  
Movimiento: patrulla corta.  
Ataque: contacto.  
Función: añadir densidad sin subir demasiado la dificultad.

8\. Saltador de Hierba

Rol: enemigo móvil.  
Tamaño: pequeño-medio. Aproximadamente 0,6 veces la altura de Canuter.  
Vida: 1 vez vida básica de enemigo de bosque.  
Daño: 1 vez daño básico de enemigo de bosque.  
Movimiento: saltos cortos periódicos.  
Ataque: contacto durante el salto.  
Función: enseñar enemigos con trayectoria vertical.

9\. Bestia de Zarza

Rol: tanque pequeño opcional.  
Tamaño: medio. Aproximadamente 0,85 veces la altura de Canuter.  
Vida: 2,5 veces vida básica de enemigo de bosque.  
Daño: 1,5 veces daño básico de enemigo de bosque.  
Movimiento: lento.  
Ataque: carga corta si el jugador está cerca.  
Función: variante pesada antes de introducir tribales fuertes.

Critters y fauna interactiva

Tiny Monsters Pixel Art Pack:  
https://craftpix.net/product/tiny-monsters-pixel-art-pack/

Los tiny monsters no son enemigos principales. Se usarán como critters o fauna viva del bosque.

Reglas generales de critters:  
No dan score.  
No dan energía.  
No dan vida.  
No cuentan para limpiar sala.  
No bloquean progresión.  
Se pueden matar, pero no tienen recompensa.  
Sirven para que el bosque parezca vivo.

Critters candidatos:  
Minidiablillo de Hoja: corre de lado a lado y huye si el jugador se acerca.  
Bicho Máscara: se acerca al jugador como si fuera agresivo, pero no hace daño.  
Larva Oscura: aparece cerca de raíces corruptas y sugiere que la corrupción está empezando.  
Polilla de Raíz: vuela de forma errática cerca de flores, faroles o zonas húmedas.

Resumen de herramientas del Bosc Antic

Enemigos principales:  
Culebra de Raíz, Flor Mordedora, Flor Espora, Tribal del Palo, Tribal Lancero, Tribal Martillo.

Enemigos opcionales:  
Bicho de Campo, Saltador de Hierba, Bestia de Zarza.

Critters:  
Minidiablillo de Hoja, Bicho Máscara, Larva Oscura, Polilla de Raíz.

Mini jefe:  
Aranya d’Escorça.

Jefe:  
Mare Espina.

Recompensas, talismanes y tutorial camuflado del Bosc Antic

El Bosc Antic funciona como primer tutorial camuflado del juego. El jugador empieza con Canuter básico y va desbloqueando sus herramientas principales mediante talismanes de habilidad.

Familias de talismanes:

Talismanes de habilidad: desbloquean habilidades activas o pasivas importantes de un personaje.

Talismanes de mejora: modifican o mejoran valores de personajes, habilidades, vida, energía, cooldowns, daño, defensa u otros sistemas.

Las habilidades principales de cada personaje se desbloquean mediante talismanes de habilidad.

Los talismanes de mejora se pueden equipar en cualquier personaje, salvo que un talismán especifique lo contrario.

Menú de talismanes

Al inicio solo se muestra Canuter, centrado.

Canuter tiene cuatro huecos para talismanes de habilidad y una zona separada para talismanes de mejora.

No se deben mostrar huecos de Neret ni Bruna antes de desbloquearlos para evitar spoilers.

Cuando se desbloquea Neret, el menú pasa a mostrar dos columnas: Canuter y Neret.

Cuando se desbloquea Bruna, el menú pasa a mostrar tres columnas: Canuter, Neret y Bruna.

Cada personaje tiene sus cuatro huecos propios de habilidades.

Los talismanes de mejora se gestionan aparte y pueden asignarse al personaje que el jugador quiera potenciar.

Progresión de Canuter en Bosc Antic

Canuter empieza con:  
Ataque normal.  
Movimiento base.  
Salto.  
Doble salto.  
Dash.

Canuter no empieza con sus cuatro habilidades especiales completas.

Reparto de talismanes de habilidad de Canuter:  
Sala 03: Talismán del Corte Circular. Desbloquea ataque circular en área.  
Sala 06: Talismán de Savia. Desbloquea curación.  
Sala 09: Talismán del Corte Lejano. Desbloquea onda de corte a distancia.  
Sala 14: Talismán del Golpe Pesado. Desbloquea golpe cargado.

Recompensa final del Bosc Antic:  
Sala 16 / Mare Espina desbloquea a Neret como segundo personaje jugable y abre la progresión narrativa hacia Cim Gelat.

Neret se desbloquea con su kit base, pero no necesariamente con todos sus talismanes de habilidad avanzados. Sus habilidades se desarrollarán principalmente durante Cim Gelat.

Talismanes de mejora en la demo

Para la demo del Bosc Antic solo se incluirá un talismán de mejora importante:

Sala 10: Talismán de Vitalidad Menor.  
Efecto inicial: aumenta la vida máxima del personaje al que se equipe.

El resto de talismanes de mejora se diseñarán más adelante para salas ocultas, backtracking y endgame.

Collectibles, recompensas menores y economía en la demo

Para la primera demo del Bosc Antic no habrá sistema de economía.

No habrá monedas funcionales, tienda, notas de lore, diarios, fragmentos, pickups de colección ni coleccionables secundarios.

No habrá recompensas menores acumulativas fuera de los talismanes definidos, teletransportes descubiertos y progreso de scoring.

Los corazones, monedas o assets similares pueden existir visualmente como props o placeholders, pero no formarán parte de un sistema jugable de economía o colección en la demo.

Estos sistemas quedan explícitamente pospuestos para una fase posterior.

Tutorial camuflado sala a sala del Bosc Antic

Sala 00: Refugi de la Copa Mare.  
Sin combate. Presenta zona segura, mundo, bajada a sala 01 y tono narrativo inicial.

Sala 01: Baixada de la Copa.  
Objetivo: movimiento, salto, dash y ataque normal.  
Enemigos iniciales: 1 Culebra de Raíz y 1 critter inofensivo.  
Debe contener el bloqueo hacia la izquierda para volver más adelante con Bruna.

Sala 02: Clar de l’Arrel.  
Objetivo: enseñar combate básico.  
Enemigos iniciales: 2 Culebras de Raíz y 1 Tribal del Palo.

Sala 03: Pas de la Soca.  
Objetivo: obtener ataque circular.  
Enemigos iniciales antes del talismán: 2 Culebras de Raíz.  
Después del talismán: grupo pequeño de 3 enemigos débiles para probar el ataque circular.  
Recompensa: Talismán del Corte Circular.

Sala 04: Niu de Fulles.  
Objetivo: usar área contra grupos.  
Enemigos iniciales: 3 Culebras de Raíz y 1 Flor Mordedora.

Sala 05: Creuament Verd.  
Objetivo: primera lectura de mapa y bifurcación.  
Enemigos iniciales: 1 Tribal del Palo, 1 Flor Mordedora y 2 critters.  
Teletransporte recomendado: primer Cristall de Savia de campo.

Sala 06: Font de Savia.  
Objetivo: enseñar daño y curación.  
Enemigos iniciales: 1 Tribal del Palo, 1 Flor Espora y 1 Culebra de Raíz.  
La sala debe generar suficiente presión para que el jugador entienda por qué curarse importa.  
Recompensa: Talismán de Savia.

Sala 07: Branca Torta.  
Objetivo: usar curación sin cortar ritmo.  
Enemigos iniciales: 2 Tribales del Palo y 1 Flor Mordedora.

Sala 08: Cor del Bosc.  
Objetivo: combinar movimiento, área y curación.  
Enemigos iniciales: 2 Culebras de Raíz, 1 Flor Espora y 1 Tribal Lancero.

Sala 09: Mirador de l’Arrel.  
Objetivo: premiar exploración y desbloquear ataque a distancia.  
Enemigos iniciales: 1 Flor Espora en posición incómoda y 1 Tribal Lancero.  
Recompensa: Talismán del Corte Lejano.  
Teletransporte recomendado: segundo nodo medio/opcional si no se coloca en sala 10\.

Sala 10: Racó de Savia.  
Objetivo: mejora secundaria.  
Enemigos iniciales: pocos o ninguno. Puede incluir 1 Bestia de Zarza opcional si se quiere mini reto.  
Recompensa: Talismán de Vitalidad Menor.  
Teletransporte alternativo al de sala 09\.

Sala 11: Pas de les Espores.  
Objetivo: probar onda de corte y empezar a pensar en combo.  
Enemigos iniciales: 2 Tribales del Palo, 1 Tribal Lancero y 1 Flor Espora.

Sala 12: Brancam Alt.  
Objetivo: plataformas y proyectiles.  
Enemigos iniciales: 2 Flores Espora, 1 Culebra de Raíz y 1 Tribal Lancero.

Sala 13: Fossa de l’Escorça.  
Objetivo: combate físico y enemigo pesado.  
Enemigos iniciales: 1 Tribal Martillo, 2 Culebras de Raíz y 1 Flor Mordedora.

Sala 14: Pedra de l’Impuls.  
Objetivo: desbloquear herramienta fuerte antes del tramo final.  
Enemigos iniciales antes del talismán: 1 Tribal Martillo.  
Después del talismán: 1 enemigo pesado o grupo pequeño para probar golpe cargado.  
Recompensa: Talismán del Golpe Pesado.

Sala 15: Llindar d’Espines.  
Objetivo: repaso general antes de Mare Espina.  
Enemigos iniciales: 1 Tribal Martillo, 1 Tribal Lancero, 1 Flor Espora y 2 Culebras de Raíz.  
Teletransporte recomendado: nodo previo al jefe.

Sala 16: Cambra de Mare Espina.  
Objetivo: jefe final del Bosc Antic.  
Recompensas: desbloqueo de Neret y acceso narrativo a Cim Gelat.

Nota de densidad de enemigos

La distribución anterior es una primera versión conservadora para estructurar tutorial y progresión.

El objetivo final del juego es más frenético, con más hack and slash, más margen para combos y mayor densidad de enemigos.

Durante el diseño sala a sala se debe aumentar la cantidad de enemigos si la sala queda pobre, como mínimo aproximándose al doble de la densidad inicial cuando no rompa la función tutorial de la sala.

Teletransportes del Bosc Antic

El juego debe tener teletransportes para evitar que el jugador sienta que necesita cargar partidas o recorrer demasiado mapa repetido.

Los teletransportes son nodos mágicos de viaje rápido. No necesitan una explicación narrativa compleja.

Cada bioma debe tener varios puntos de teletransporte repartidos de forma prudencial.

En el Bosc Antic debe haber como mínimo cuatro puntos de teletransporte:  
Teletransporte 00: Refugi de la Copa Mare / zona segura.  
Teletransporte 01: sala 05 / zona media inicial.  
Teletransporte 02: sala 09 o 10 / zona de exploración o recompensa.  
Teletransporte 03: sala 15 / antesala del jefe.

Los teletransportes se desbloquean al descubrirlos físicamente en la sala.

Una vez descubierto un teletransporte, el jugador puede viajar a él desde el mapa.

El mapa debe tener modo teletransporte.

En modo teletransporte solo se pueden seleccionar nodos de teletransporte ya descubiertos.

El Refugi de la Copa Mare funciona como punto de teletransporte principal del Bosc Antic.

Sistema de texto, diálogos y onboarding

Los textos de diálogo, carteles y ayudas usan una caja inferior de texto estilo RPG clásico.

La caja aparece solo cuando hay texto que mostrar.

La caja ocupa todo el ancho de la pantalla y aproximadamente el 20-25% inferior de la pantalla.

El texto aparece progresivamente con efecto de escritura.

En Settings debe poder configurarse la velocidad de aparición del texto.

Si el texto todavía está escribiéndose y el jugador pulsa X/A, la frase se completa inmediatamente.

Si el texto ya está completo y el jugador pulsa X/A, se avanza al siguiente mensaje.

Si el jugador quiere saltar texto rápido, puede pulsar repetidamente X/A para completar y avanzar mensajes.

En diálogos se muestra el nombre del hablante seguido de dos puntos y el mensaje.

No se mostrarán retratos/avatar de diálogo en la primera demo.

Los carteles, señales, inscripciones o ayudas también usan esta misma caja inferior.

El onboarding debe ser ligero, diegético y no invasivo. Las señales del Bosc y pequeños textos breves enseñan controles o pistas sin interrumpir demasiado el ritmo.

Regla de identidad

Canuter debe sentirse como un Metroidvania arcade de combate rápido. Tres personajes, cambio instantáneo, combos por sala, puntuación, muchos enemigos débiles, energía ganada atacando, curación rápida y talismanes de personalización ligera.

Final narrativo

El final bueno del juego será un happy ending. Canuter y sus compañeros derrotan la corrupción de La Vena, consiguen el antídoto y salvan a una persona importante vinculada al assassin.

La persona a salvar queda pendiente de cerrar. Opciones preferidas: la madre del assassin o la hermana pequeña del assassin.

El final debe reforzar tres ideas: la Vena queda curada, el bosque puede recuperarse y el viaje del equipo ha servido para salvar a alguien concreto, no solo para derrotar a un mal abstracto.

Giro final: Popoli

El padre de Canuter murió de forma heroica antes del inicio del juego. Al principio no se explica exactamente cómo murió. Solo se sabe que defendió el Bosc Antic y que su sacrificio permitió años de paz.

En el Nucli de la Vena se revela que el jefe final humano es Popoli. Él fue quien mató al padre de Canuter y ocultó la verdad durante años.

Popoli será una pelea espejo contra una versión oscura y muy poderosa del propio Canuter. Usará una variante de sus mismas herramientas: doble salto, dash, ataque cuerpo a cuerpo, ataque a distancia, golpe cargado y curación. No podrá cambiar al assassin ni a la maga, pero estará muy potenciado por la energía robada de La Vena.

Popoli no será solo un monstruo final. Será un enemigo personal, humano y narrativo. Después de derrotarlo, revela que mató al padre de Canuter y explica la función de la máquina del Núcleo.

Máquina del Nucli de la Vena

En el fondo del Núcleo hay una máquina que drena energía de La Vena. Esa energía se procesa para crear armas o tecnología militar que se vende a otros territorios para financiar guerras.

El procesamiento de esa energía genera un residuo venenoso, parecido a una radiación o contaminación mágica. Ese veneno sube por las raíces y enferma el bosque, a la madre de Canuter y a otros habitantes.

La máquina es el origen real de la corrupción. Derrotar a Popoli no basta: Canuter debe destruir la máquina para detener el drenaje y cortar la contaminación.

Final jugable y escape

Después de vencer a Popoli y destruir la máquina, empieza una secuencia final de escape. El Núcleo empieza a colapsar y explotar.

Canuter debe subir por un túnel vertical, montacargas o estructura parecida mientras todo se derrumba por debajo. Esta escena funciona como cierre jugable final: correr, saltar, subir y escapar hacia la superficie.

Al destruir la máquina, Canuter también encuentra o libera el antídoto necesario para curar a las personas afectadas por la contaminación.

Final feliz

Tras escapar, Canuter vuelve a la zona segura del Bosc Antic. El antídoto salva a la persona importante vinculada al assassin, pendiente de cerrar entre madre o hermana pequeña.

El alcalde o líder del poblado agradece a Canuter y al equipo haber salvado el bosque. La Vena deja de ser drenada, la contaminación se detiene y el bosque empieza a recuperarse.

Sala 00 / Refugi de la Copa Mare del Bosc Antic

El Bosc Antic debe tener una sala 00 / Refugi de la Copa Mare o zona segura. Será una sala de referencia emocional y funcional.

Esta sala puede contener la casa de Canuter, la cama de la madre durante la introducción, el alcalde o líder del poblado, la persona enferma vinculada al assassin y otros NPC importantes.

La sala 00 / Refugi de la Copa Mare debe funcionar como hub seguro. Más adelante se decidirá si permite teletransporte, tienda, gestión de talismanes, mejoras, descanso o cambio de configuración.

Pendiente de diseño específico: ubicar la sala 00 / Refugi de la Copa Mare dentro del mapa del Bosc Antic V1 y decidir si sustituye una sala existente o se añade como sala especial.

Definición cerrada de la sala 00 / Refugi de la Copa Mare

La sala 00 se llama Refugi de la Copa Mare.

Es el hub inicial del juego y la zona segura del Bosc Antic.

No cuenta como sala de combate ni como sala puntuable del Bosc Antic. El Bosc Antic mantiene sus 16 salas principales de exploración y combate. La sala 00 es un nodo especial conectado a la sala 01\.

Contexto narrativo

Antes de L’Arrel Negra, la gente vivía repartida por todo el Bosc Antic. Cuando las raíces empezaron a enfermar y la tierra baja se volvió peligrosa, los habitantes se refugiaron en la copa del gran árbol central.

La Copa Mare es un árbol inmenso, tan grande que su copa permite construir caminos, casas, zonas de hierba y edificios comunitarios. La gente no entiende exactamente qué es L’Arrel Negra. No saben si es enfermedad, veneno, contaminación, magia o radiación. Solo saben que sube desde las raíces y que la tierra baja ya no es segura.

Estructura visual de la sala 00

La sala 00 será una sala ancha en horizontal. El jugador aparece aproximadamente en la zona central.

La superficie jugable puede ser césped y caminos sobre la copa del árbol. Aunque parezca una pequeña llanura, debe quedar claro por el fondo que el jugador está en lo alto de La Copa Mare.

El fondo debe usar parallax con ramas enormes, hojas, partes del tronco y profundidad de copa. El objetivo visual es que el jugador entienda que el poblado está construido en la copa de un árbol gigantesco.

La sala debe contener varias casas pequeñas y al menos dos elementos importantes: la casa de Canuter y la Casa del Consell.

La casa de Canuter contiene la cama de la madre durante la introducción.

La Casa del Consell representa el edificio político o comunitario del refugio.

Más adelante, la casa de Neret puede estar dentro de esta misma sala o integrarse como parte del mismo poblado, sin necesidad de crear otra sala todavía.

Conexión con la sala 01

La sala 00 conecta hacia abajo con la sala 01 del Bosc Antic.

La conexión se representa con una escalera, cuerda, tronco tallado o estructura de bajada en el centro de la sala 00\.

Para bajar, el jugador debe colocarse sobre la zona de bajada y pulsar abajo. No hace falta botón de acción separado.

Al bajar, el jugador aparece en la sala 01, al pie de la escalera.

La sala 01 sigue siendo el inicio real del tutorial camuflado y del recorrido de combate.

Bloqueo inicial de backtracking

En la sala 01 debe existir una salida o bloqueo hacia la izquierda.

Ese camino no se podrá abrir al inicio. Quedará bloqueado para volver más adelante con Bruna y sus habilidades mágicas.

No se define todavía qué hay detrás de ese bloqueo. Se diseñará más adelante como ruta de backtracking.

Inicio jugable y cinemática

La introducción no debe durar más de un minuto antes de que el jugador pueda moverse.

La historia inicial debe contarse con texto breve y acciones simples.

Objetivos de la introducción:  
Presentar L’Arrel Negra.  
Mostrar que la madre de Canuter está enferma.  
Recordar la figura del padre de Canuter.  
Hacer que Canuter tome la decisión de bajar desde el Refugi de la Copa Mare hacia el Bosc Antic.

La intro no debe ser una cinemática larga. Debe sentirse como una entrada jugable rápida al mundo.

Asset needs de la sala 00

Se necesitan assets o composición visual para:  
Tronco gigante.  
Ramas enormes de fondo.  
Parallax de copa de árbol.  
Superficie de hierba o madera sobre copa.  
Casas pequeñas sobre árbol.  
Casa de Canuter.  
Casa del Consell.  
Escalera, cuerda o bajada vertical hacia sala 01\.  
Elementos de vida del refugio: faroles, hojas, bancos, pequeñas plantas, vecinos o decoración.

Subsalas narrativas del Refugi de la Copa Mare

Además de la sala 00 exterior, habrá dos espacios interiores no puntuables dentro de La Copa Mare.

Estos espacios no cuentan como salas de combate, no tienen enemigos y no forman parte del scoring del Bosc Antic.

Interior 00A: Casa de Canuter

El juego empieza dentro de la casa de Canuter.

La escena inicial muestra a la madre de Canuter en su lecho de muerte. La cámara debe estar cerca de la cama, en vista lateral, para evitar mezclar al personaje platformer con una sala top-down.

Composición sugerida: cama lateral, cabecero visible, cabeza de la madre sobre una almohada, sábana cubriendo medio cuerpo y Canuter civil de pie al lado de la cama.

La conversación debe ser breve. La madre puede insinuar que L’Arrel Negra viene de las raíces y recordar de forma sutil al padre de Canuter.

Después, la madre muere.

Puede haber una transición muy corta de funeral: una imagen fija, fundido, unas palabras de cura o figura ceremonial, y corte rápido. No debe convertirse en una cinemática larga.

Interior 00B: Armario de Canuter

Después de hablar con Oleguer, Canuter vuelve a su casa y aparece frente al armario donde está guardada la armadura de su padre.

Canuter decide seguir los pasos de su padre, se equipa la armadura y el juego cambia del sprite civil al sprite warrior definitivo.

Este cambio marca el inicio real del gameplay de combate.

Al final del juego puede considerarse una escena espejo donde Canuter se quita la armadura, pero queda pendiente.

Exterior 00: conversación con Oleguer

Tras la muerte de la madre y el funeral, la escena pasa al exterior del Refugi de la Copa Mare, frente a la Casa del Consell.

Canuter habla con Oleguer.

Oleguer es el Cap del Consell. Su rol se traduce. Su nombre propio no se traduce.

Nombre propio: Oleguer.  
Rol catalán: Cap del Consell.  
Rol castellano: Jefe del Consejo.  
Rol inglés: Council Elder.

Oleguer debe ser un hombre mayor, serio, contenido y con información que no revela del todo.

Oleguer sabe más de lo que dice sobre Popoli y sobre el origen real de la corrupción, pero no quiere decirle la verdad completa a Canuter.

Función narrativa de Oleguer:  
Recordar que el padre de Canuter fue un gran guerrero.  
Explicar que el padre de Canuter defendió el Bosc Antic y permitió años de paz.  
Advertir que L’Arrel Negra seguirá matando gente si nadie la detiene.  
Desaconsejar a Canuter que investigue demasiado.  
Insinuar una frase clave: no quieres saber la verdad.  
Empujar indirectamente a Canuter a actuar, aunque intente frenarlo.

Después de esta conversación, Canuter decide armarse y buscar la raíz del problema.

Arte WIP para intro, hub e interiores

La dirección todavía no está cerrada. La prioridad es evitar mezclar perspectiva top-down jugable con personajes platformer laterales.

Regla actual: las escenas jugables y narrativas con Canuter visible deben mantenerse en vista lateral o falsa vista lateral.

Los assets top-down pueden servir como referencia visual, pero no deben ser la base de una escena jugable si rompen la perspectiva.

Assets candidatos para Canuter civil

Peasants 2D Pixel Art Sprite Pack:  
https://craftpix.net/product/peasants-2d-pixel-art-sprite-pack/

Free Villagers Sprite Sheets Pixel Art:  
https://craftpix.net/freebies/free-villagers-sprite-sheets-pixel-art/

Free 3 Character Sprite Sheets Pixel Art:  
https://craftpix.net/freebies/free-3-character-sprite-sheets-pixel-art/

Estado: pendiente de validar escala y estilo frente al pack principal de Canuter, Neret y Bruna.

Assets candidatos para Oleguer

Fairy Characters Pixel Art Pack:  
https://craftpix.net/product/fairy-characters-pixel-art-pack/

NPC Elf 2D Pixel Art Character Sprite Pack:  
https://craftpix.net/product/npc-elf-2d-pixel-art-character-sprite-pack/

Village NPC Pixel Art Character Sprite Pack:  
https://craftpix.net/product/village-npc-pixel-art-character-sprite-pack/

Estado: pendiente de validar si el NPC anciano encaja con la escala visual del juego.

Assets candidatos para casas exteriores

House Builder Tileset Pixel Art:  
https://craftpix.net/product/house-builder-tileset-pixel-art/

Free Medieval Tileset Pixel Art Pack:  
https://craftpix.net/freebies/free-medieval-tileset-pixel-art-pack/

Estado: House Builder parece útil para montar casas, pero hay duda sobre si las casas medievales o de piedra encajan encima de la copa de un árbol. Preferencia visual: cabañas de madera o construcciones orgánicas.

Assets candidatos para interior falso lateral

Free Medieval Tileset Pixel Art Pack:  
https://craftpix.net/freebies/free-medieval-tileset-pixel-art-pack/

Platformer Pixel Art Tileset:  
https://craftpix.net/product/platformer-pixel-art-tileset/

Medieval Interior Top Down Pixel Art Tileset:  
https://craftpix.net/product/medieval-interior-top-down-pixel-art-tileset/

Tavern Top-Down Pixel RPG Asset Pack:  
https://craftpix.net/product/tavern-top-down-pixel-rpg-asset-pack/

Estado: los packs top-down solo se usarán como referencia o para extraer ideas de objetos. La escena final debe simular lateral: pared de madera, suelo, cama lateral, armario, mesa y pocos elementos.

Assets candidatos para vegetación, tronco, copa y sala 01

Pixel Art Forest Platformer Tileset:  
https://craftpix.net/product/pixel-art-forest-platformer-tileset/

Forest Pixel Art Environment Asset Set:  
https://craftpix.net/product/forest-pixel-art-environment-asset-set/

Trees and Bushes Pixel Art for Platformer:  
https://craftpix.net/product/trees-and-bushes-pixel-art-for-platformer/

Platformer Pixel Art Tileset:  
https://craftpix.net/product/platformer-pixel-art-tileset/

Estado: estos packs son candidatos para tronco gigante, ramas de fondo, vegetación, suelo, plantas, escalera o bajada hacia sala 01\.

Problema abierto de escala

El pack principal de héroes usa sprites grandes de 128x128. Muchos NPCs de CraftPix usan 40, 48 o 64 píxeles de alto.

No está cerrado si mantendremos héroes a 128 o si los escalaremos hacia abajo para que encajen mejor con NPCs y enemigos.

Regla provisional: no escalar pixel art con factores no enteros si se puede evitar. Escalar hacia arriba desde 40 a 128 suele verse mal. Escalar hacia abajo desde 128 puede perder detalle. Hay que validar visualmente en Phaser.

Trío protagonista y guiño de fantasía

El equipo protagonista pasa a ser warrior, assassin y maga. El guiño de fantasía funciona ahora como trío clásico de rol: guerrero, pícaro/asesino y maga, sin forzar arquetipos anteriores ya descartados.

Canuter es el warrior. Neret es el assassin. Bruna es la maga.

Los nombres no deben parecerse a referentes conocidos. La referencia debe sentirse como un guiño para jugadores frikis, no como una copia directa.

Mapa global del mundo

El mapa global se representa sobre una grid lógica de 4 columnas x 7 filas.

Bosc Antic: zona visual en fila 3, columnas 1 y 2\.  
Cim Gelat: zona visual en filas 1, 2 y 3, columnas 3 y 4\.  
Mina Enfonsada: zona visual en filas 4 y 5, columnas 3 y 4\.  
Nucli de la Vena: zona visual en filas 6 y 7, columnas 1 y 2\.

El mapa global no representa salas exactas. Representa regiones del mundo.

El mapa debe mostrarse con margen visual alrededor, como si tuviera dos filas extra arriba y abajo y dos columnas extra a izquierda y derecha, para que no quede pegado a los bordes.

Al inicio solo se ve el Bosc Antic. La Cim Gelat y la Mina se revelan cuando la historia las introduce. El Nucli de la Vena permanece oculto hasta el tramo final.

Mapa interno de bioma

Cada bioma tendrá su propio mapa interno de salas.

Las salas se colocan en una grid lógica. Las conexiones normales son arriba, abajo, izquierda y derecha.

La posición en la grid no limita el tamaño real de la sala. Una sala puede ser grande, vertical, horizontal o irregular. La cámara sigue al jugador dentro de la sala.

El mapa interno funciona como lectura de conectividad, no como escala real del espacio jugable.

Una conexión puede llevar a una sala que esté varias filas o columnas más lejos si el diseño lo necesita. Por ejemplo, una subida vertical larga puede conectar una sala baja con otra situada varias filas más arriba.

Reglas para construir mapas internos de bioma

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

Reglas avanzadas para mapas internos y validación por agentes

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

Proceso obligatorio para agentes

1\. Generar la tabla del mapa.  
2\. Extraer la lista de salas.  
3\. Verificar que cada sala repetida forma una única región contigua.  
4\. Verificar que cada conector conecta exactamente dos salas distintas.  
5\. Verificar que no hay conectores colgando.  
6\. Verificar que todas las salas tienen al menos una conexión.  
7\. Recorrer el grafo desde la sala inicial.  
8\. Confirmar que todas las salas son alcanzables desde la sala inicial.  
9\. Confirmar que existe camino desde la sala inicial hasta el jefe.  
10\. Confirmar que la sala del jefe tiene una sola entrada, salvo excepción explícita.  
11\. Si cualquier regla falla, el agente debe iterar y generar una nueva versión antes de entregar el mapa.

Bosc Antic V1: distribución validada

Grid interna: 10 columnas x 5 filas.  
Total: 16 salas.  
Spawn: 01\.  
Jefe: 16\.

Tabla de salas y conexiones

| Fila / Col | C01 | \-\> | C02 | \-\> | C03 | \-\> | C04 | \-\> | C05 | \-\> | C06 | \-\> | C07 | \-\> | C08 | \-\> | C09 | \-\> | C10 |  
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|  
| F01 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F02 |  |  | 03 | \- | 04 | \- | 09 |  |  |  |  |  |  |  |  |  |  |  |  |  
| v |  |  | &#124; |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  
| F03 | 01 | \- | 02 | \- | 05 | \- | 08 | \- | 11 | \- | 12 | \- | 15 | \- | 16 |  |  |  |  |  
| v |  |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |  
| F04 |  |  | 06 | \- | 07 | \- | 10 | \- | 13 | \- | 14 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F05 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

Nota: en Google Docs los conectores verticales pueden verse como barras simples en filas intermedias. La tabla debe interpretarse junto con la lista de conexiones validadas.

Conexiones validadas

01 conecta con 02\.  
02 conecta con 01, 03, 05 y 06\.  
03 conecta con 02 y 04\.  
04 conecta con 03, 05 y 09\.  
05 conecta con 02, 04, 07 y 08\.  
06 conecta con 02 y 07\.  
07 conecta con 05, 06 y 10\.  
08 conecta con 05, 09, 10 y 11\.  
09 conecta con 04 y 08\.  
10 conecta con 07, 08 y 13\.  
11 conecta con 08, 12 y 13\.  
12 conecta con 11, 14 y 15\.  
13 conecta con 10, 11 y 14\.  
14 conecta con 13 y 12\.  
15 conecta con 12 y 16\.  
16 conecta solo con 15\.

Leyenda de salas

01: Baixada de la Copa / spawn / entrada del bosque.  
02: Clar de l’Arrel / primer combate.  
03: Pas de la Soca / vertical simple.  
04: Niu de Fulles / plataformas.  
05: Creuament Verd / cruce principal.  
06: Font de Savia / ruta baja y curación.  
07: Branca Torta / tutorial fuerte.  
08: Cor del Bosc / sala central.  
09: Mirador de l’Arrel / secreto alto.  
10: Racó de Savia / recompensa.  
11: Pas de les Espores / presión con enemigos.  
12: Brancam Alt / ruta superior.  
13: Fossa de l’Escorça / ruta inferior.  
14: Pedra de l’Impuls / convergencia de rutas y golpe cargado.  
15: Llindar d’Espines / antesala del jefe.  
16: Cambra de Mare Espina / jefe del Bosc Antic.

Lectura del diseño

El inicio es simple: 01 \-\> 02\.

Desde 02 el mapa se abre en tres direcciones: arriba, abajo y derecha.

03, 04, 05, 06 y 07 forman la primera zona de exploración ramificada.

08 es la sala central del bioma.

Desde 08 se abren tres opciones: secreto alto 09, recompensa baja 10 y avance principal 11\.

Desde 11 se abre una bifurcación final: ruta superior por 12 y ruta inferior por 13 y 14\.

La ruta final converge en 12, pasa por 15 y termina en el jefe 16\.

La sala 16 solo tiene una entrada: 15\.

Este diseño no es lineal, pero tampoco es un laberinto confuso.

Cim Gelat V3: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 20 salas.  
Spawn: 01\.  
Jefe: 20\.

Tabla de salas y conexiones

| Fila / Col | C01 | \-\> | C02 | \-\> | C03 | \-\> | C04 | \-\> | C05 | \-\> | C06 | \-\> | C07 | \-\> | C08 | \-\> | C09 | \-\> | C10 |  
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|  
| F01 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 18 | \- | 19 | \- | 20 |  
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 18 |  | &#124; |  |  |  
| F02 |  |  |  |  |  |  |  |  |  |  |  |  | 17 | \- | 18 | 18 | 18 |  |  |  
| v |  |  |  |  |  |  |  |  |  |  |  |  |  |  | &#124; |  | &#124; |  |  |  
| F03 |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  | 15 | \- | 16 |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  | 15 |  |  |  |  |  
| F04 |  |  |  |  |  |  |  |  |  |  | 11 | \- | 15 | 15 | 15 |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  |  |  |  |  
| F05 |  |  |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  
| F06 |  |  | 06 | \- | 09 | 09 | 09 | \- | 10 | 10 | 10 |  |  |  | 13 |  |  |  |  |  
| v |  |  | 06 |  | &#124; |  | &#124; |  | &#124; |  | &#124; |  |  |  | 13 |  |  |  |  |  
| F07 |  |  | 06 | \- | 07 | 07 | 07 | \- | 12 | 12 | 12 | \- | 13 | 13 | 13 |  |  |  |  |  
| v |  |  | 06 |  |  |  | &#124; |  |  |  | 12 |  |  |  | &#124; |  |  |  |  |  
| F08 |  |  | 06 |  |  |  | 08 |  |  |  | 12 |  |  |  | 14 |  |  |  |  |  
| v |  |  | &#124; |  |  |  | &#124; |  |  |  | 12 |  |  |  |  |  |  |  |  |  
| F09 |  |  | 03 |  |  |  | 04 |  |  |  | 12 |  |  |  |  |  |  |  |  |  
| v |  |  | &#124; |  |  |  | 04 |  |  |  |  |  |  |  |  |  |  |  |  |  
| F10 | 01 | \- | 02 | 02 | 02 | \- | 04 | \- | 05 |  |  |  |  |  |  |  |  |  |  |

Nota: esta tabla debe interpretarse junto con la lista de conexiones validadas. Los números repetidos forman una misma sala extendida siempre que sean contiguos ortogonalmente.

Conexiones validadas

01 conecta con 02\.  
02 conecta con 01, 03 y 04\.  
03 conecta con 02 y 06\.  
04 conecta con 02, 05 y 08\.  
05 conecta con 04\.  
06 conecta con 03, 07 y 09\.  
07 conecta con 06, 08, 09 y 12\.  
08 conecta con 04 y 07\.  
09 conecta con 06, 07 y 10\.  
10 conecta con 09, 11 y 12\.  
11 conecta con 10 y 15\.  
12 conecta con 07, 10 y 13\.  
13 conecta con 12 y 14\.  
14 conecta con 13\.  
15 conecta con 11, 16 y 18\.  
16 conecta con 15 y 18\.  
17 conecta con 18\.  
18 conecta con 15, 16, 17 y 19\.  
19 conecta con 18 y 20\.  
20 conecta solo con 19\.

Salas extendidas

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

Lectura del diseño

El jugador empieza en 01, abajo a la izquierda, y el objetivo final es 20, arriba a la derecha.

El bioma tiene una lectura general ascendente.

Las salas 06, 11 y 12 son grandes salas verticales pensadas para explotar el salto en pared del assassin.

La sala 13 introduce una forma en L para combinar avance horizontal y vertical.

La ruta principal no es una línea recta: hay ramificaciones, salas laterales y convergencias.

La sala 20, jefe de la Cim Gelat, solo tiene una entrada desde 19\.

Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01\.  
Existe camino desde 01 hasta 20\.  
El jefe 20 solo tiene una entrada.

Mina Enfonsada V1: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 20 salas.  
Spawn: 01, arriba izquierda.  
Jefe: 20, abajo izquierda.

Tabla de salas y conexiones

| Fila / Col | C01 | \-\> | C02 | \-\> | C03 | \-\> | C04 | \-\> | C05 | \-\> | C06 | \-\> | C07 | \-\> | C08 | \-\> | C09 | \-\> | C10 |  
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|  
| F01 | 01 | \- | 02 | 02 | 02 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F02 |  |  |  |  | 03 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F03 |  |  | 05 | \- | 04 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  
| F04 |  |  |  |  | 06 | 06 | 06 | 06 | 06 | \- | 07 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  
| F05 |  |  |  |  |  |  |  |  |  |  | 08 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | 08 |  |  |  |  |  |  |  |  |  
| F06 |  |  |  |  |  |  | 09 | 09 | 09 | \- | 08 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  | &#124; |  | &#124; |  | 08 |  |  |  |  |  |  |  |  |  
| F07 |  |  |  |  |  |  | 10 | 10 | 10 | \- | 08 | \- | 12 |  |  |  |  |  |  |  
| v |  |  |  |  |  |  | &#124; |  | &#124; |  |  |  | &#124; |  |  |  |  |  |  |  
| F08 |  |  |  |  |  |  | 11 | 11 | 11 |  |  |  | 13 | \- | 14 | 14 | 14 |  |  |  
| v |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  | &#124; |  | &#124; |  |  |  
| F09 |  |  |  |  |  |  |  |  | 11 |  |  |  |  |  | 15 |  | 15 |  |  |  
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  | 15 |  |  |  
| F10 | 20 | \- | 19 | 19 | 19 | \- | 18 | \- | 17 | \- | 16 | 16 | 16 | \- | 15 | 15 | 15 |  |  |  

Conexiones validadas

01 conecta con 02\.  
02 conecta con 01 y 03\.  
03 conecta con 02 y 04\.  
04 conecta con 03, 05 y 06\.  
05 conecta con 04\.  
06 conecta con 04 y 07\.  
07 conecta con 06 y 08\.  
08 conecta con 07, 09, 10 y 12\.  
09 conecta con 08 y 10\.  
10 conecta con 08, 09 y 11\.  
11 conecta con 10 y 17\.  
12 conecta con 08 y 13\.  
13 conecta con 12 y 14\.  
14 conecta con 13 y 15\.  
15 conecta con 14 y 16\.  
16 conecta con 15 y 17\.  
17 conecta con 11, 16 y 18\.  
18 conecta con 17 y 19\.  
19 conecta con 18 y 20\.  
20 conecta solo con 19\.

Salas extendidas

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

Lectura del diseño

El jugador empieza en 01, arriba izquierda, y baja progresivamente hacia la zona inferior.

El jefe 20 está abajo a la izquierda y solo tiene una entrada desde 19\.

La mina tiene lectura descendente: primero se entra, luego se baja a estructuras profundas, después se rodea por galerías y finalmente se vuelve hacia la izquierda para llegar al jefe.

La sala 08 funciona como eje vertical de mina, conectando varias rutas.

El tramo 15, 16, 17, 18, 19 y 20 crea el cierre final del bioma con retorno hacia abajo izquierda.

Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01\.  
Existe camino desde 01 hasta 20\.  
El jefe 20 solo tiene una entrada.

Nucli de la Vena V1: distribución validada

Grid interna: 10 columnas x 10 filas.  
Total: 27 salas.  
Spawn: 01, arriba derecha.  
Jefe final: 27, abajo centro.  
Objetivos laterales: 08 arriba izquierda, 21 abajo izquierda, 25 abajo derecha.

Tabla de salas y conexiones

| Fila / Col | C01 | \-\> | C02 | \-\> | C03 | \-\> | C04 | \-\> | C05 | \-\> | C06 | \-\> | C07 | \-\> | C08 | \-\> | C09 | \-\> | C10 |  
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|  
| F01 | 08 | 08 | 08 | 08 | 08 | \- | 07 | 07 | 07 | 07 | 07 | \- | 06 | \- | 05 | \- | 02 | \- | 01 |  
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  | &#124; |  | &#124; |  |  |  
| F02 |  |  |  |  |  |  |  |  |  |  | 09 |  |  |  | 04 | \- | 03 |  |  |  
| v |  |  |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  
| F03 |  |  |  |  |  |  |  |  | 11 | \- | 10 |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  
| F04 |  |  |  |  |  |  |  |  | 12 |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  |  |  | &#124; |  |  |  |  |  |  |  |  |  |  |  
| F05 |  |  |  |  |  |  | 18 | \- | 13 |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  | &#124; |  | &#124; |  |  |  |  |  |  |  |  |  |  |  
| F06 |  |  |  |  |  |  | 19 | \- | 14 |  |  |  |  |  |  |  |  |  |  |  
| v |  |  |  |  |  |  | 19 |  | &#124; |  |  |  |  |  |  |  |  |  |  |  
| F07 |  |  |  |  |  |  | 19 | \- | 15 | \- | 22 | \- | 23 | 23 | 23 |  |  |  |  |  
| v |  |  |  |  |  |  | 19 |  | &#124; |  | &#124; |  | 23 |  | &#124; |  |  |  |  |  
| F08 |  |  |  |  |  |  | 19 | \- | 16 | \- | 26 | \- | 23 | \- | 24 |  |  |  |  |  
| v |  |  |  |  |  |  | 19 |  | &#124; |  |  |  |  |  | 24 |  |  |  |  |  
| F09 |  |  |  |  | 19 | 19 | 19 | \- | 17 |  |  |  |  |  | 24 | \- | 25 | 25 | 25 |  
| v |  |  |  |  | &#124; |  |  |  | &#124; |  |  |  |  |  |  |  |  |  | 25 |  
| F10 | 21 | 21 | 21 | \- | 20 |  |  |  | 27 |  |  |  |  |  |  |  |  |  | 25 |

Conexiones validadas

01 conecta con 02\.  
02 conecta con 01, 03 y 05\.  
03 conecta con 02 y 04\.  
04 conecta con 03 y 05\.  
05 conecta con 02, 04 y 06\.  
06 conecta con 05 y 07\.  
07 conecta con 06, 08 y 09\.  
08 conecta con 07\.  
09 conecta con 07 y 10\.  
10 conecta con 09 y 11\.  
11 conecta con 10 y 12\.  
12 conecta con 11 y 13\.  
13 conecta con 12, 14 y 18\.  
14 conecta con 13, 15 y 19\.  
15 conecta con 14, 16, 19 y 22\.  
16 conecta con 15, 17, 19 y 26\.  
17 conecta con 16, 19 y 27\.  
18 conecta con 13 y 19\.  
19 conecta con 14, 15, 16, 17, 18 y 20\.  
20 conecta con 19 y 21\.  
21 conecta solo con 20\.  
22 conecta con 15, 23 y 26\.  
23 conecta con 22, 24 y 26\.  
24 conecta con 23 y 25\.  
25 conecta solo con 24\.  
26 conecta con 16, 22 y 23\.  
27 conecta solo con 17\.

Salas clave

01: spawn arriba derecha.  
08: objetivo o sello arriba izquierda.  
21: objetivo o sello abajo izquierda.  
25: objetivo o sello abajo derecha.  
27: jefe final abajo centro.

Lectura del diseño

El Nucli de la Vena es el bioma más complejo.

Desde el spawn 01 se puede recorrer el mapa hacia arriba izquierda, bajar hacia la izquierda, abrir rutas hacia abajo derecha y finalmente acceder al jefe final 27\.

El diseño fuerza al jugador a visitar extremos del mapa antes de poder afrontar el jefe final.

Los objetivos laterales 08, 21 y 25 pueden usarse como sellos, llaves o nodos de activación para desbloquear el acceso final.

Validación

Las salas repetidas forman regiones contiguas.  
No hay salas duplicadas en zonas separadas.  
No hay conectores colgando.  
Todas las salas pertenecen a un único grafo conectado desde 01\.  
Existe camino desde 01 hasta 08, 21, 25 y 27\.  
El jefe final 27 solo tiene una entrada.  
Cámara, luces, parallax y atmósfera

Plataforma y presentación técnica de demo

La demo se diseña desktop first.

Debe soportar pantalla completa.

Debe funcionar con teclado y mando.

El objetivo inicial no es móvil. La prioridad es que el juego se sienta bien en PC/web desktop.

Cámara base

La cámara usa seguimiento suave del jugador con límites por sala.

La cámara no debe ser rígida ni estar totalmente centrada todo el tiempo.

Debe tener un pequeño look-ahead hacia donde mira o se mueve el jugador. Esto permite leer mejor el espacio hacia el que se avanza, especialmente en combate rápido y plataformas.

El look-ahead debe ser suave y limitado para no marear ni romper la lectura de sala.

En salas de boss, la cámara puede reducir o desactivar el look-ahead para priorizar la lectura completa de la arena.

En salas verticales, la cámara debe dar más margen arriba y abajo para que el jugador pueda leer saltos, caídas, enemigos y plataformas.

En salas grandes o de varias celdas lógicas, la cámara sigue al jugador dentro de los límites reales de la sala.

Camera shake

El juego puede usar camera shake para impactos fuertes, muerte de enemigos grandes, golpes cargados, bosses, explosiones y colapsos.

El camera shake debe ser moderado.

Debe existir opción en Settings para reducir camera shake.

El camera shake no debe dificultar la lectura de plataformas, proyectiles o boss attacks.

Sistema de luces

La iluminación debe ser real mediante shaders o sistema de luces equivalente, no únicamente overlays falsos.

El objetivo es que las luces afecten a personajes, enemigos, critters, proyectiles y elementos del escenario cuando pasen por zonas iluminadas.

Si Canuter pasa por un haz de luz, debe iluminarse.

Si un enemigo cruza una zona iluminada, debe iluminarse.

Si una polilla de luz o critter luminoso pasa cerca, debe poder afectar visualmente al entorno o al menos emitir una luz perceptible.

La iluminación es una parte importante de la identidad visual del juego y debe ayudar a que el mundo parezca vivo.

Bosc Antic: dirección ambiental cerrada para demo

El Bosc Antic se encuentra bajo la sombra de La Copa Mare.

La Copa Mare es tan grande que bloquea gran parte de la luz directa. Por eso, la iluminación del bosque no debe ser uniforme.

La luz entra en haces entre ramas, hojas y huecos de la copa.

Los haces de luz deben sentirse vivos, no estáticos. Pueden moverse sutilmente por viento, movimiento de ramas, hojas o criaturas.

La atmósfera del Bosc Antic debe incluir:  
Hojas flotando.  
Polen.  
Polillas de luz.  
Critters pequeños.  
Plantas y arbustos moviéndose suavemente.  
Copas de árboles movidas por viento.  
Partículas de corrupción en zonas de L’Arrel Negra.  
Zonas de sombra profunda bajo ramas densas.  
Haces de luz cálidos atravesando la oscuridad.

Parallax del Bosc Antic

El Bosc Antic debe usar varias capas de profundidad.

Estructura mínima:  
Capa jugable: suelo, plataformas, colisiones, árboles y elementos contra los que el jugador interactúa. Esta capa no es parallax.  
Parallax cercano: árboles y vegetación relativamente próximos.  
Parallax medio: troncos, ramas y masas de bosque a media distancia.  
Parallax lejano: siluetas de bosque, profundidad y copa de La Copa Mare.  
Foreground: capa frontal oscura con hojas, hierbas, arbustos y elementos pequeños delante del jugador.

El parallax debe moverse con ratios proporcionales para crear profundidad real. Las capas cercanas se mueven más rápido; las lejanas, más lento.

Cada capa de parallax puede tener su propia iluminación, tinte, oscuridad y haces de luz.

Las salas deben poder definir mapeos de iluminación por capa: dónde caen haces de luz, qué zonas están en sombra y dónde aparece corrupción.

Foreground

El foreground debe ser discreto.

Puede contener hierbas, hojas, arbustos, pequeñas ramas y critters que salen entre vegetación.

Debe estar más oscuro que la capa jugable para reforzar profundidad.

Nunca debe tapar plataformas importantes, enemigos importantes, proyectiles, teletransportes, talismanes o información crítica.

Si un elemento de foreground tapa gameplay, debe reducir opacidad, moverse, recortarse o eliminarse.

Implementación visual recomendada

Para iluminación: shaders/luces reales.

Para partículas ambientales: combinación de Phaser particles, sprites animados y capas de parallax.

Para haces de luz: luces reales o sprites iluminados que participen en el sistema de iluminación/shader.

Para foreground: sprites oscuros con opacidad controlada y sin colisiones.

Para critters y polillas: sprites animados con comportamiento ambiental simple. Algunos pueden tener luz propia si encaja técnicamente.

Dirección visual general por bioma

Bosc Antic:  
Verdes, marrones, sombras cálidas, haces de luz, polen, hojas, polillas, foreground vegetal y corrupción negra/verdosa. Este bioma se cierra con más detalle porque es la demo.

Cim Gelat:  
Azules fríos, blancos, niebla, ventisca, nieve diagonal, menos saturación, viento visible y sensación de altura. Dirección general definida; detalle final queda para su fase.

Mina Enfonsada:  
Ocres, marrones, oscuridad, polvo, chispas, cristales, luces puntuales y sensación subterránea. Dirección general definida; detalle final queda para su fase.

Nucli de la Vena:  
Rojos, púrpuras, negros, pulsos de energía, luces artificiales, partículas tóxicas, máquina viva y corrupción industrial/mágica. Dirección general definida; detalle final queda para su fase.

Música y ambiente por bioma

Para la demo se debe cerrar la música del Bosc Antic, la música de Aranya d’Escorça, la música de Mare Espina y los ambientes principales del Bosc Antic.

Los demás biomas quedan con dirección general de música y ambiente, pero no necesitan cerrarse al mismo nivel todavía.

Bosc Antic debe tener:  
Música de exploración del bioma.  
Ambiente de bosque vivo.  
Capa o ambiente de zona corrupta.  
Música o capa de mini jefe.  
Música de boss final.  
Stinger de victoria.  
Stinger de muerte/game over.

Localización operativa y font

Nombres propios de personajes, lugares, biomas, jefes y enemigos únicos no se traducen.

Textos, roles, objetos, ataques, habilidades, UI, settings y descripciones sí se traducen.

La font pixel art debe soportar como mínimo los caracteres necesarios para catalán, castellano e inglés.

Caracteres mínimos obligatorios:  
á, é, í, ó, ú.  
à, è, ò.  
ä, ë, ï, ö, ü.  
ç.  
ñ.  
l·l.  
Apóstrofe recto: '.  
Apóstrofe tipográfico: ’.  
¿, ?.  
¡, \!.  
Comillas simples y dobles.  
Guion.  
Punto.  
Coma.  
Dos puntos.  
Punto y coma.

También deben existir versiones mayúsculas cuando aplique:  
Á, É, Í, Ó, Ú.  
À, È, Ò.  
Ç.  
Ñ.

Si el pack de font no incluye alguno de estos caracteres, habrá que crear glyphs manualmente.

Ejemplo: si falta la ñ, se crea a partir de la n añadiendo virgulilla y se mapea como carácter propio.

Ejemplo: si faltan vocales acentuadas, se crean versiones con accent obert y accent tancat según corresponda.

El sistema de texto debe mapear cada carácter del string localizado al glyph correcto de la font.

Las traducciones largas pueden romper layouts. La primera versión aceptará este riesgo y se ajustará durante testing. Los componentes React deben diseñarse con suficiente flexibilidad para textos más largos que el castellano/catalán.

Dirección de UI, menú principal y consistencia visual

Toda la UI principal del juego se implementará con React superpuesto al canvas de Phaser.

Esto incluye:  
Menú principal.  
Menú de pausa in-game.  
HUD.  
Minimapa.  
Mapa grande.  
Tabs de talismanes, bestiario, scoring, settings y guardados.  
Cajas de diálogo.  
Pantallas de muerte, continuar y carga.  
Pantallas de settings y remapeo de controles.

Phaser seguirá siendo responsable del gameplay, mundo, físicas, personajes, enemigos, cámara y efectos integrados en escena.

React será responsable de la estructura visual, layout, botones, tabs, paneles, listas, textos, barras, tooltips y navegación de interfaz.

Regla de consistencia visual

El menú principal y el menú in-game deben compartir una misma línea visual.

No deben sentirse como dos interfaces de juegos distintos.

Los botones, tabs, paneles, bordes, tipografía, colores, estados hover/selected/disabled, sonidos de UI y transiciones deben pertenecer al mismo sistema visual.

El estilo visual final de UI queda pendiente de definir, pero debe respetar estas reglas:  
Debe encajar con pixel art fantasy.  
Debe ser legible en pantalla grande y pequeña.  
Debe funcionar bien con mando y teclado.  
Debe permitir traducciones largas.  
Debe soportar settings, guardados, bestiario y scoring sin saturar.  
Debe tener estados claros para seleccionado, bloqueado, no descubierto, equipado y nuevo.

Menú principal

El menú principal debe permitir como mínimo:  
Continuar.  
Nueva partida.  
Cargar partida.  
Settings.  
Salir.

Opcionales para demo:  
Créditos.  
Selector de idioma.  
Remapeo de controles desde menú principal.

Los settings del menú principal y los settings in-game deben compartir componentes React y comportamiento, pero no necesariamente mostrar exactamente las mismas opciones si alguna opción solo tiene sentido fuera de partida.

Settings mínimos

Volumen de música.  
Volumen de SFX.  
Volumen de UI.  
Velocidad de texto.  
Idioma.  
Remapeo de controles.  
Reducir camera shake.  
Pantalla completa / ventana si aplica.

Background del menú principal

El background actual del menú principal se considera provisional. Se ve demasiado pixelado y no se considera dirección final.

La imagen o animación definitiva del menú principal queda pendiente de definir.

Opciones abiertas:

Opción A: escena 2D viva con assets del juego.  
Crear una escena 2D muy trabajada del Bosc Antic usando assets del propio juego: vegetación, luces, partículas, critters, polillas de luz y movimiento ambiental. Debe parecer una escena viva, no un fondo estático. Pueden aparecer critters entre arbustos, pequeñas criaturas moviéndose y un bicho agresivo intentando atacar sin hacer daño. Esta opción es la más coherente con el juego real.

Opción B: escena 3D del mundo / La Copa Mare.  
Crear una escena 3D de alto impacto visual, quizá en Unreal, mostrando un bosque enorme y La Copa Mare como árbol gigantesco con luces cinematográficas. Puede incluir una visión simbólica de los cuatro biomas. Es visualmente potente, pero hay riesgo de que no encaje con un juego 2D pixel art.

Opción C: ilustración 2D no jugable.  
Crear una ilustración o key art del árbol, el bosque y la corrupción. Puede funcionar bien como portada, pero requiere arte específico.

Decisión provisional:  
La opción preferida para demo es una escena 2D viva hecha con assets del juego y efectos visuales. La opción 3D queda como idea ambiciosa, pendiente de validar si encaja con la identidad visual.

Pantallas iniciales y carga

Para demo, el boot flow puede ser simple:  
Abrir juego.  
Ir directamente al menú principal.  
Cargar partida o nueva partida.

No es obligatorio mostrar logo de estudio, logo de engine ni cinemática inicial antes del menú.

Las pantallas de carga deben ser mínimas. Si la carga es rápida, puede usarse una transición/fade. Si la carga tarda, debe aparecer una pantalla simple con logo/título, nombre de zona y animación ligera.

Inventario de audio para demo

El audio es imprescindible para cerrar una demo presentable. Sin música, SFX de combate, SFX de UI y feedback sonoro básico, la demo no debe considerarse cerrada.

Packs base recomendados

SFX general de gameplay recomendado:  
Platformer Game Sound Effects — Fab:  
https://www.fab.com/ar/listings/0a0dd6d4-02ac-4b2b-b905-3a30dc811604

Alternativas:  
FREE Retro Action Platformer Sound Effects:  
https://jeageroni.itch.io/free-action-platformer-sound-effects  
Platformer Sound FX — Unreal Marketplace:  
https://www.unrealengine.com/marketplace/platformer-sound-fx  
Essential RPG SFX Starter Pack:  
https://pedrohbs94.itch.io/essential-rpg-sfx-pack

SFX de magia recomendado:  
RPG Magic Sound Effect Pack — Construct / WOW Sound:  
https://www.construct.net/en/game-assets/sounds/sound-effects/rpg-magic-sound-effect-pack-315

Alternativas:  
WOW Sound RPG Magic Sound Effects Pack:  
https://wowsound.com/game-audio-packs/rpg-magic-sound-effects-pack.aspx  
Essential RPG SFX Starter Pack:  
https://pedrohbs94.itch.io/essential-rpg-sfx-pack

SFX de UI recomendado:  
JRPG UI Sound Effects Pack — WOW Sound:  
https://wowsound.com/game-audio-packs/jrpg-ui-sound-effects-pack.aspx

Alternativas:  
Ultimate UI Sound Effects Pack:  
https://racoon-cat.itch.io/ultimate-ui-sound-effects-pack-60-sounds  
UI Sounds Effect Pack:  
https://digisolva.itch.io/uisoundseffect

Música fantasy recomendada:  
Full Fantasy Music Pack for RPG / Platformer — Feather Falling:  
https://tommusic.itch.io/full-fantasy-music-pack-for-rpg-platformer-feather-falling

Alternativas:  
Free Fantasy Music Pack for RPG / Platformer:  
https://tommusic.itch.io/fantasy-music-pack-for-rpg-platformer  
Chiptune Fantasy Music Pack:  
https://music-tale.itch.io/chiptune-fantasy  
Fantasy Exploration RPG Music Pack — ThiSound:  
https://thisound.itch.io/enchantedexplorationfantasy-music-pack  
Dark Fantasy Loops Music Pack:  
https://loopnpixel.itch.io/dark-fantasy-loops

Música de boss recomendada:  
Premium Boss Battle Music Pack:  
https://soulix-dev.itch.io/premium-boss-battle-music-pack-10-tracks-for-rpgs

Alternativas:  
Dark Fantasy Music: Boss Battles:  
https://intersonic-sound.itch.io/adaptive-fantasy-music-boss-battles  
Chiptune Fantasy Music Pack:  
https://music-tale.itch.io/chiptune-fantasy

Asignación de audio por sistema

Menú principal:  
Recomendado: Full Fantasy Music Pack.  
Alternativas: Chiptune Fantasy Music Pack, Free Fantasy Music Pack.  
Necesita: loop de menú, confirm, cancel, hover/select, error, abrir settings.  
SFX recomendado: JRPG UI Sound Effects Pack.  
Alternativas: Ultimate UI Sound Effects Pack, UI Sounds Effect Pack.

Bosc Antic ambiente:  
Recomendado: Full Fantasy Music Pack, usando track tipo magic forest / exploration.  
Alternativas: Fantasy Exploration RPG Music Pack, Dark Fantasy Loops Music Pack, Chiptune Fantasy Music Pack.  
Necesita: loop ambiental del bioma, sin saturar combate.

Aranya d’Escorça:  
Recomendado: Premium Boss Battle Music Pack o variación tensa de Full Fantasy Music Pack.  
Alternativas: Chiptune Fantasy Music Pack, Dark Fantasy Music: Boss Battles.  
Necesita: música de mini jefe o capa de combate, inicio combate, muerte/victoria corta.

Mare Espina:  
Recomendado: Premium Boss Battle Music Pack.  
Alternativas: Dark Fantasy Music: Boss Battles, Chiptune Fantasy Music Pack.  
Necesita: tema de boss, fase final, victoria, muerte/colapso.

Movimiento jugador:  
Acciones: salto, doble salto, aterrizaje, dash, wall slide, cambio de personaje.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: FREE Retro Action Platformer Sound Effects, Essential RPG SFX Starter Pack.

Canuter:  
Acciones: ataque normal, impacto espada, ataque circular, curación, carga de golpe pesado, golpe pesado, onda de corte lanzada, onda impactando.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: Essential RPG SFX Starter Pack, RPG Magic Sound Effect Pack para curación/onda.

Neret:  
Acciones: cuchillo lanzado, cuchillo impactando, arco de cuchillos, cuchillo con cuerda lanzado, cuerda enganchando, cuerda tensándose, cuerda soltándose, teletransporte salida/llegada, wall slide.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: FREE Retro Action Platformer Sound Effects, RPG Magic Sound Effect Pack para teletransporte.

Bruna:  
Acciones: proyectil mágico, rayo de ruptura, pulso terrestre, barrera arcana, anulación, romper sello/muro mágico.  
Pack recomendado: RPG Magic Sound Effect Pack.  
Alternativas: WOW Sound RPG Magic Sound Effects Pack, Essential RPG SFX Starter Pack.

Enemigos normales:  
Acciones: alerta, ataque, impacto recibido, muerte, proyectil de espora, mordisco, martillazo, estocada.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: Essential RPG SFX Starter Pack, FREE Retro Action Platformer Sound Effects.

Aranya d’Escorça SFX:  
Acciones: aparición, movimiento pesado, Mossegada d’Escorça, Fil de Resina, resina impactando, Salt Curt, Crida de Larves, daño recibido, muerte.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: RPG Magic Sound Effect Pack para resina/invocación, Essential RPG SFX Starter Pack.

Mare Espina SFX:  
Acciones: rugido/inicio, Cop de Branca, aviso de raíces, raíces saliendo, Pluja d’Espines, Crida del Bosc, fase final L’Arrel Negra, daño recibido, muerte/colapso, liberación del bosque.  
Pack recomendado: Platformer Game Sound Effects \+ RPG Magic Sound Effect Pack.  
Alternativas: Essential RPG SFX Starter Pack, WOW Sound RPG Magic Sound Effects Pack.

UI y scoring:  
Acciones: hover/select, confirmar, cancelar, abrir/cerrar pausa, cambiar tab, abrir mapa, zoom mapa, seleccionar teletransporte, guardar, cargar, error, nuevo récord, combo sube, combo rompe, rango C/B/A/S/S+.  
Pack recomendado: JRPG UI Sound Effects Pack.  
Alternativas: Ultimate UI Sound Effects Pack, UI Sounds Effect Pack.

Mundo e interacción:  
Acciones: abrir Caixa de Botí, recoger talismán, equipar talismán, descubrir Cristall de Savia, activar teletransporte, aparecer tras teletransporte, puerta bloqueada, Pedra Trencable rota, pinchos dañando, Planta Trampa activándose.  
Pack recomendado: Platformer Game Sound Effects.  
Alternativas: Essential RPG SFX Starter Pack, RPG Magic Sound Effect Pack para teletransporte/talismán.

Audio secundario de valor añadido

Ambiente: viento suave, hojas, ramas, pájaros lejanos, pulso de corrupción, bosque grave en zonas bajas.  
Recomendado: packs de música/ambiente fantasy o creación propia con capas ambientales.

Critters: chillido al huir, sonido gracioso al atacar sin hacer daño, muerte ligera, aleteo de polilla.  
Recomendado: Platformer Game Sound Effects o Essential RPG SFX Starter Pack.

Narrativa: funeral, armadura equipada, puerta de casa, bajada desde La Copa Mare, texto escribiéndose.  
Recomendado: JRPG UI Sound Effects Pack \+ Platformer Game Sound Effects.

Inventario de VFX para demo

Packs base recomendados

Slash VFX recomendado:  
VFX \- SLASH \- Pixel Art Effects:  
https://kiddolink.itch.io/vfx-fx-slash-pixel-art

Alternativas:  
VFX \- SLASH VOL 2:  
https://kiddolink.itch.io/vfx-slash-vol-2-pixel-art-effects  
CraftPix Sprite Effects Category:  
https://craftpix.net/categorys/sprite-effects/

Magia VFX recomendado:  
10 Magic Sprite Sheet Effects Pixel Art:  
https://craftpix.net/product/10-magic-sprite-sheet-effects-pixel-art/

Alternativas:  
10 Magic Effects Pixel Art Pack:  
https://craftpix.net/product/10-magic-effects-pixel-art-pack/  
Pixel Art Magic Sprite Effects and Icons Pack:  
https://craftpix.net/product/pixel-art-magic-sprite-effects-and-icons-pack/  
Magic Effects Pixel Art Asset Pack 4:  
https://craftpix.net/product/magic-effects-pixel-art-asset-pack-4/

Explosiones/impactos fuertes recomendado:  
Explosions VFX Pixel Art Asset Pack:  
https://aklingon.itch.io/explosions-vfx

Alternativas:  
CraftPix Sprite Effects Category:  
https://craftpix.net/categorys/sprite-effects/  
10 Magic Sprite Sheet Effects Pixel Art:  
https://craftpix.net/product/10-magic-sprite-sheet-effects-pixel-art/

Asignación de VFX por sistema

Canuter ataque normal:  
Recomendado: VFX \- SLASH \- Pixel Art Effects.  
Alternativas: VFX \- SLASH VOL 2, CraftPix Sprite Effects Category.  
Uso: pequeño arco de espada, impacto ligero, hit flash en enemigo.

Canuter ataque circular:  
Recomendado: VFX \- SLASH VOL 2\.  
Alternativas: VFX \- SLASH \- Pixel Art Effects, Phaser procedural con arco circular.  
Uso: círculo o media luna alrededor de Canuter, partículas y pequeño camera shake.

Canuter golpe cargado:  
Recomendado: VFX \- SLASH VOL 2 \+ Explosions VFX Pixel Art Asset Pack.  
Alternativas: Magic Effects Pixel Art Asset Pack 4, Phaser particles.  
Uso: carga visual, aura en arma, golpe frontal grande, impacto fuerte.

Canuter onda de corte:  
Recomendado: VFX \- SLASH \- Pixel Art Effects.  
Alternativas: VFX \- SLASH VOL 2, Phaser projectile propio.  
Uso: onda de aire horizontal, proyectil de corte e impacto.

Curación:  
Recomendado: 10 Magic Effects Pixel Art Pack.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4\.  
Uso: aura verde/dorada, partículas ascendentes, feedback de vida recuperada.

Dash:  
Recomendado: Phaser procedural con estela.  
Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Pixel Art Magic Sprite Effects and Icons Pack.  
Uso: afterimage, estela corta, blur/polvo.

Cambio de personaje:  
Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Phaser particles.  
Uso: flash breve, partículas, silueta o swap burst.

Neret cuchillos:  
Recomendado: Phaser projectile propio \+ VFX \- SLASH para impacto.  
Alternativas: VFX \- SLASH VOL 2, CraftPix Sprite Effects Category.  
Uso: cuchillo, trail mínimo, impacto pequeño.

Neret arco de cuchillos:  
Recomendado: Phaser procedural con sprites de cuchillo y pequeñas estelas.  
Alternativas: VFX \- SLASH \- Pixel Art Effects para impactos, VFX \- SLASH VOL 2\.  
Uso: 20 proyectiles en arco de 180 grados.

Neret cuchillo con cuerda:  
Recomendado: Phaser line/rope procedural.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack para enganche, 10 Magic Sprite Sheet Effects Pixel Art para impacto.  
Uso: línea de cuerda, punto de anclaje, cuerda tensa, cuerda colgando al soltarse.

Neret teletransporte:  
Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4\.  
Uso: desaparición, flash, aparición, partículas direccionales.

Neret wall slide:  
Recomendado: Phaser particles.  
Alternativas: CraftPix Sprite Effects Category.  
Uso: polvo/fricción contra pared, pequeñas chispas vegetales o corteza.

Bruna magia general:  
Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4\.  
Uso: proyectiles mágicos, rayo, barrera, pulso, anulación.

Bruna barrera:  
Recomendado: Magic Effects Pixel Art Asset Pack 4\.  
Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Pixel Art Magic Sprite Effects and Icons Pack.  
Uso: shield/bubble, aura, runas.

Bruna rayo de ruptura:  
Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4\.  
Uso: lightning line, impacto, partículas de cristal.

Enemigo recibe daño:  
Recomendado: Phaser hit flash \+ pequeñas partículas.  
Alternativas: Explosions VFX Pixel Art Asset Pack para impactos fuertes, CraftPix Sprite Effects Category.  
Uso: flash blanco/rojo, shake ligero, partículas.

Enemigo muere:  
Recomendado: Explosions VFX Pixel Art Asset Pack para enemigos medianos/grandes; Phaser particles para pequeños.  
Alternativas: 10 Magic Effects Pixel Art Pack, CraftPix Sprite Effects Category.  
Uso: burst pequeño, humo, hojas o partículas negras si está corrupto.

Flor Espora proyectil:  
Recomendado: 10 Magic Effects Pixel Art Pack.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Phaser projectile propio.  
Uso: bola/espora lenta, trail suave, impacto.

Planta Trampa:  
Recomendado: Phaser particles \+ animación del asset.  
Alternativas: VFX \- SLASH para mordisco, CraftPix Sprite Effects Category.  
Uso: apertura, mordisco, partículas de hojas.

Espines / pinchos:  
Recomendado: VFX procedural mínimo en Phaser.  
Alternativas: 10 Magic Sprite Sheet Effects Pixel Art si se quieren spikes mágicos.  
Uso: destello de daño y pequeñas partículas.

Pedra Trencable:  
Recomendado: Explosions VFX Pixel Art Asset Pack.  
Alternativas: CraftPix Sprite Effects Category, Phaser particles de roca.  
Uso: rotura, fragmentos, polvo.

Cristall de Savia teletransporte:  
Recomendado: Pixel Art Magic Sprite Effects and Icons Pack.  
Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Magic Effects Pixel Art Asset Pack 4\.  
Uso: brillo idle, activación, partículas, desaparición/aparición.

Caixa de Botí / talismán conseguido:  
Recomendado: 10 Magic Effects Pixel Art Pack.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, JRPG UI VFX en React/CSS.  
Uso: apertura, brillo, talismán flotando, destello.

Combo C/B/A/S/S+:  
Recomendado: React/CSS \+ font pixel art \+ glow y animación.  
Alternativas: sprites propios, Phaser particles para S/S+.  
Uso: C simple, B glow suave, A glow fuerte, S fuego azul, S+ fuego azul con electricidad.

Nuevo récord:  
Recomendado: React/CSS con animación de panel y partículas ligeras.  
Alternativas: Phaser particles superpuestas, 10 Magic Effects Pixel Art Pack.  
Uso: aparición de panel, brillo, score destacado.

Aranya d’Escorça:  
Recomendado: Magic Effects Pixel Art Asset Pack 4 \+ Phaser procedural.  
Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Explosions VFX Pixel Art Asset Pack.  
Uso: resina, invocación, salto, muerte.

Mare Espina:  
Recomendado: 10 Magic Sprite Sheet Effects Pixel Art para spikes/raíces y Magic Effects Pixel Art Asset Pack 4 para corrupción.  
Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Explosions VFX Pixel Art Asset Pack.  
Uso: raíces del suelo, lluvia de espinas, aura de L’Arrel Negra, fase final, colapso.

Muerte de Mare Espina:  
Recomendado: Explosions VFX Pixel Art Asset Pack \+ Phaser particles de hojas/luz.  
Alternativas: Magic Effects Pixel Art Asset Pack 4, 10 Magic Effects Pixel Art Pack.  
Uso: colapso del árbol, liberación, partículas negras que desaparecen y luz vegetal.

Compra mínima recomendada para demo

Audio:  
Platformer Game Sound Effects — Fab.  
JRPG UI Sound Effects Pack o alternativa barata de UI.  
Full Fantasy Music Pack — Feather Falling.  
Premium Boss Battle Music Pack si la música de boss del pack fantasy no convence.  
RPG Magic Sound Effect Pack si las habilidades mágicas quedan pobres.

VFX:  
VFX \- SLASH \- Pixel Art Effects.  
VFX \- SLASH VOL 2\.  
10 Magic Sprite Sheet Effects Pixel Art.  
Explosions VFX Pixel Art Asset Pack.  
Opcional: Magic Effects Pixel Art Asset Pack 4\.

Secciones pendientes del Game Design Document

Un GDD completo debe cubrir, como mínimo: visión general, público objetivo, plataformas, core loop, controles, personajes, combate, progresión, mapa, niveles, enemigos, jefes, UI, HUD, menús, arte, animaciones, audio, accesibilidad, requisitos técnicos, guardado, onboarding, economía si existe, contenido desbloqueable, riesgos, alcance y plan de producción.

Puntos ya abiertos en este documento

Visión general del juego.  
Premisa narrativa.  
Inicio narrativo de Canuter.  
Progresión narrativa principal.  
Giro final de Popoli.  
Máquina del Nucli de la Vena.  
Final jugable de escape.  
Sala 00 / Refugi de la Copa Mare del Bosc Antic como concepto.  
Dirección de combate.  
Sistema de tres personajes.  
Dirección visual pixel art de personajes.  
Pack principal de personajes pixel art.  
Canuter como warrior.  
Assassin como personaje de movilidad.  
Maga como personaje de control y rompebloqueos.  
Popoli como recolor oscuro del warrior.  
Habilidades completas de Canuter.  
Habilidades completas del assassin.  
Habilidades completas de la maga.  
Valores base del golpe cargado de Canuter.  
Valores base de la onda de corte de Canuter.  
Valores base del teletransporte del assassin.  
Valores base de rayo de ruptura, pulso terrestre, barrera arcana y anulación de la maga.  
Decisión de cuchillo del assassin.  
Controles base.  
Apuntado en 8 direcciones.  
Vida y energía.  
Curación.  
Sistema de combo.  
Puntuación por sala.  
Puntuación por bioma.  
Enemigos por bioma.  
Vida aproximada de enemigos y jefes.  
Talismanes iniciales.  
Mapa global.  
Reglas generales de mapas internos de bioma.  
Proceso obligatorio de validación para agentes.  
Mapa interno del Bosc Antic V1.  
Mapa interno de la Cim Gelat V3.  
Mapa interno de la Mina Enfonsada V1.  
Mapa interno del Nucli de la Vena V1.  
Final narrativo.  
Guiño del trío protagonista.  
Inventario de animaciones de Canuter.  
Inventario de animaciones del assassin.  
Inventario de animaciones de la maga.  
Cobertura de animaciones mediante assets y Phaser.

Puntos pendientes de cerrar

Core loop exacto minuto a minuto.  
Pulido visual final del HUD.  
Pulido visual final del menú de pausa.  
Pulido visual final de mapa y minimapa.  
Pantalla de talismanes.  
Sistema de remapeo de controles.  
Ajuste final de factores relativos del scoring por sala.  
Valores finales de multiplicadores y factores de scoring.  
Pulido visual de rangos C, B, A, S y S+.  
Contenido sala a sala de Bosc Antic.  
Contenido sala a sala de Cim Gelat.  
Contenido sala a sala de Mina Enfonsada.  
Contenido sala a sala de Nucli de la Vena.  
Ubicación exacta de la sala 00 / Refugi de la Copa Mare en Bosc Antic V1.  
Decidir si la sala 00 / Refugi de la Copa Mare sustituye una sala existente o se añade como sala especial.  
Funcionalidad exacta de la sala 00 / Refugi de la Copa Mare.  
Objetivo de cada sala.  
Enemigos concretos de cada sala.  
Dificultad esperada de cada sala.  
Recompensa de cada sala.  
Bloqueos y llaves de progresión.  
Reglas de backtracking.  
Tiles, plataformas y obstáculos por bioma.  
Movimiento exacto de cada personaje.  
Velocidad exacta de cada personaje.  
Saltos, dash, aceleración y gravedad.  
Visual exacto del teletransporte del assassin.  
Física exacta del péndulo del cuchillo con cuerda.  
Decidir si la cuerda del assassin puede treparse.  
Sistema exacto de salas ocultas.  
Sistema de revelado de secretos en endgame.  
Jefes finales en detalle.  
Patrones de cada jefe.  
Patrón exacto de Popoli como jefe final.  
Diseño exacto de la máquina del Núcleo.  
Diseño de la secuencia final de escape.  
Recompensas por bioma.  
Recompensas por salas ocultas.  
Persona concreta vinculada a Neret que se salva en el final.  
Persona concreta que se salva en el final.  
Economía, si finalmente existe.  
Arte y dirección visual general.  
Animaciones necesarias por enemigo.  
Efectos visuales.  
Música por bioma.  
Efectos de sonido.  
Accesibilidad.  
Implementación técnica final de slots de guardado.  
Pulido visual de pantalla de muerte y respawn.  
Tutorial y onboarding.  
Requisitos técnicos y plataformas objetivo.  
Alcance de la primera demo jugable.

Siguiente prioridad recomendada

El siguiente punto a definir debería ser el contenido sala a sala de Bosc Antic V1, empezando por la ubicación y función de la sala 00 / Refugi de la Copa Mare.
