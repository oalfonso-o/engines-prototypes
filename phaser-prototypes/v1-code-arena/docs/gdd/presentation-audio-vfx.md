# Presentación, Audio y VFX

Cámara, luces, parallax y atmósfera

## Cámara base

La cámara usa seguimiento suave del jugador con límites por sala.

La cámara no debe ser rígida ni estar totalmente centrada todo el tiempo.

Debe tener un pequeño look-ahead hacia donde mira o se mueve el jugador. Esto permite leer mejor el espacio hacia el que se avanza, especialmente en combate rápido y plataformas.

El look-ahead debe ser suave y limitado para no marear ni romper la lectura de sala.

En salas de boss, la cámara puede reducir o desactivar el look-ahead para priorizar la lectura completa de la arena.

En salas verticales, la cámara debe dar más margen arriba y abajo para que el jugador pueda leer saltos, caídas, enemigos y plataformas.

En salas grandes o de varias celdas lógicas, la cámara sigue al jugador dentro de los límites reales de la sala.

## Camera shake

El juego puede usar camera shake para impactos fuertes, muerte de enemigos grandes, golpes cargados, bosses, explosiones y colapsos.

El camera shake debe ser moderado.

Debe existir opción en Settings para reducir camera shake.

El camera shake no debe dificultar la lectura de plataformas, proyectiles o boss attacks.

## Sistema de luces

La iluminación debe ser real mediante shaders o sistema de luces equivalente, no únicamente overlays falsos.

El objetivo es que las luces afecten a personajes, enemigos, critters, proyectiles y elementos del escenario cuando pasen por zonas iluminadas.

Si Canuter pasa por un haz de luz, debe iluminarse.

Si un enemigo cruza una zona iluminada, debe iluminarse.

Si una polilla de luz o critter luminoso pasa cerca, debe poder afectar visualmente al entorno o al menos emitir una luz perceptible.

La iluminación es una parte importante de la identidad visual del juego y debe ayudar a que el mundo parezca vivo.

## Bosc Antic: dirección ambiental cerrada para demo

El Bosc Antic se encuentra bajo la sombra de La Copa Mare.

La Copa Mare es tan grande que bloquea gran parte de la luz directa. Por eso, la iluminación del bosque no debe ser uniforme.

La luz entra en haces entre ramas, hojas y huecos de la copa.

Los haces de luz deben sentirse vivos, no estáticos. Pueden moverse sutilmente por viento, movimiento de ramas, hojas o criaturas.

La atmósfera del Bosc Antic debe incluir:

- Hojas flotando.
- Polen.
- Polillas de luz.
- Critters pequeños.
- Plantas y arbustos moviéndose suavemente.
- Copas de árboles movidas por viento.
- Partículas de corrupción en zonas de L’Arrel Negra.
- Zonas de sombra profunda bajo ramas densas.
- Haces de luz cálidos atravesando la oscuridad.

## Parallax del Bosc Antic

El Bosc Antic debe usar varias capas de profundidad.

Estructura mínima:

- Capa jugable: suelo, plataformas, colisiones, árboles y elementos contra los que el jugador interactúa. Esta capa no es parallax.
- Parallax cercano: árboles y vegetación relativamente próximos.
- Parallax medio: troncos, ramas y masas de bosque a media distancia.
- Parallax lejano: siluetas de bosque, profundidad y copa de La Copa Mare.
- Foreground: capa frontal oscura con hojas, hierbas, arbustos y elementos pequeños delante del jugador.

El parallax debe moverse con ratios proporcionales para crear profundidad real. Las capas cercanas se mueven más rápido; las lejanas, más lento.

Cada capa de parallax puede tener su propia iluminación, tinte, oscuridad y haces de luz.

Las salas deben poder definir mapeos de iluminación por capa: dónde caen haces de luz, qué zonas están en sombra y dónde aparece corrupción.

## Foreground

El foreground debe ser discreto.

Puede contener hierbas, hojas, arbustos, pequeñas ramas y critters que salen entre vegetación.

Debe estar más oscuro que la capa jugable para reforzar profundidad.

Nunca debe tapar plataformas importantes, enemigos importantes, proyectiles, teletransportes, talismanes o información crítica.

Si un elemento de foreground tapa gameplay, debe reducir opacidad, moverse, recortarse o eliminarse.

## Implementación visual recomendada

Para iluminación: shaders/luces reales.

Para partículas ambientales: combinación de Phaser particles, sprites animados y capas de parallax.

Para haces de luz: luces reales o sprites iluminados que participen en el sistema de iluminación/shader.

Para foreground: sprites oscuros con opacidad controlada y sin colisiones.

Para critters y polillas: sprites animados con comportamiento ambiental simple. Algunos pueden tener luz propia si encaja técnicamente.

## Dirección visual general por bioma

Bosc Antic:

- verdes,
- marrones,
- sombras cálidas,
- haces de luz,
- polen,
- hojas,
- polillas,
- foreground vegetal,
- corrupción negra o verdosa.

Verdes, marrones, sombras cálidas, haces de luz, polen, hojas, polillas, foreground vegetal y corrupción negra/verdosa. Este bioma se cierra con más detalle porque es la demo.

Cim Gelat:

- azules fríos,
- blancos,
- niebla,
- ventisca,
- nieve diagonal,
- menos saturación,
- viento visible,
- sensación de altura.

Azules fríos, blancos, niebla, ventisca, nieve diagonal, menos saturación, viento visible y sensación de altura. Dirección general definida; detalle final queda para su fase.

Mina Enfonsada:

- ocres,
- marrones,
- oscuridad,
- polvo,
- chispas,
- cristales,
- luces puntuales,
- sensación subterránea.

Ocres, marrones, oscuridad, polvo, chispas, cristales, luces puntuales y sensación subterránea. Dirección general definida; detalle final queda para su fase.

Nucli de la Vena:

- rojos,
- púrpuras,
- negros,
- pulsos de energía,
- luces artificiales,
- partículas tóxicas,
- máquina viva,
- corrupción industrial o mágica.

Rojos, púrpuras, negros, pulsos de energía, luces artificiales, partículas tóxicas, máquina viva y corrupción industrial/mágica. Dirección general definida; detalle final queda para su fase.

## Música y ambiente por bioma

Para la demo se debe cerrar la música del Bosc Antic, la música de Aranya d’Escorça, la música de Mare Espina y los ambientes principales del Bosc Antic.

Los demás biomas quedan con dirección general de música y ambiente, pero no necesitan cerrarse al mismo nivel todavía.

Bosc Antic debe tener:

- Música de exploración del bioma.
- Ambiente de bosque vivo.
- Capa o ambiente de zona corrupta.
- Música o capa de mini jefe.
- Música de boss final.
- Stinger de victoria.
- Stinger de muerte o game over.

## Background del menú principal

El background actual del menú principal se considera provisional. Se ve demasiado pixelado y no se considera dirección final.

La imagen o animación definitiva del menú principal queda pendiente de definir.

### Opciones abiertas

Opciones abiertas:

Opción A: escena 2D viva con assets del juego.  
Opción B: escena 3D del mundo / La Copa Mare.  
Opción C: ilustración 2D no jugable.

#### Opción A: escena 2D viva con assets del juego

Crear una escena 2D muy trabajada del Bosc Antic usando assets del propio juego: vegetación, luces, partículas, critters, polillas de luz y movimiento ambiental. Debe parecer una escena viva, no un fondo estático. Pueden aparecer critters entre arbustos, pequeñas criaturas moviéndose y un bicho agresivo intentando atacar sin hacer daño. Esta opción es la más coherente con el juego real.

#### Opción B: escena 3D del mundo / La Copa Mare

Crear una escena 3D de alto impacto visual, quizá en Unreal, mostrando un bosque enorme y La Copa Mare como árbol gigantesco con luces cinematográficas. Puede incluir una visión simbólica de los cuatro biomas. Es visualmente potente, pero hay riesgo de que no encaje con un juego 2D pixel art.

#### Opción C: ilustración 2D no jugable

Crear una ilustración o key art del árbol, el bosque y la corrupción. Puede funcionar bien como portada, pero requiere arte específico.

### Decisión provisional

La opción preferida para demo es una escena 2D viva hecha con assets del juego y efectos visuales. La opción 3D queda como idea ambiciosa, pendiente de validar si encaja con la identidad visual.

Decisión provisional:

## Pantallas iniciales y carga

Para demo, el boot flow puede ser simple:

1. abrir juego,
2. ir directamente al menú principal,
3. cargar partida o nueva partida.

Abrir juego.

Ir directamente al menú principal.

Cargar partida o nueva partida.

No es obligatorio mostrar logo de estudio, logo de engine ni cinemática inicial antes del menú.

Las pantallas de carga deben ser mínimas. Si la carga es rápida, puede usarse una transición o fade. Si la carga tarda, debe aparecer una pantalla simple con logo o título, nombre de zona y animación ligera.

Las pantallas de carga deben ser mínimas. Si la carga es rápida, puede usarse una transición/fade. Si la carga tarda, debe aparecer una pantalla simple con logo/título, nombre de zona y animación ligera.

## Inventario de audio para demo

El audio es imprescindible para cerrar una demo presentable. Sin música, SFX de combate, SFX de UI y feedback sonoro básico, la demo no debe considerarse cerrada.

### Packs base recomendados

SFX general de gameplay recomendado:

Platformer Game Sound Effects — Fab:

[Platformer Game Sound Effects — Fab](https://www.fab.com/ar/listings/0a0dd6d4-02ac-4b2b-b905-3a30dc811604)

Alternativas:

- FREE Retro Action Platformer Sound Effects:
- [FREE Retro Action Platformer Sound Effects](https://jeageroni.itch.io/free-action-platformer-sound-effects)
- Platformer Sound FX — Unreal Marketplace:
- [Platformer Sound FX — Unreal Marketplace](https://www.unrealengine.com/marketplace/platformer-sound-fx)
- Essential RPG SFX Starter Pack:
- [Essential RPG SFX Starter Pack](https://pedrohbs94.itch.io/essential-rpg-sfx-pack)

SFX de magia recomendado:

RPG Magic Sound Effect Pack — Construct / WOW Sound:

[RPG Magic Sound Effect Pack — Construct / WOW Sound](https://www.construct.net/en/game-assets/sounds/sound-effects/rpg-magic-sound-effect-pack-315)

Alternativas:

- WOW Sound RPG Magic Sound Effects Pack:
- [WOW Sound RPG Magic Sound Effects Pack](https://wowsound.com/game-audio-packs/rpg-magic-sound-effects-pack.aspx)
- Essential RPG SFX Starter Pack:
- [Essential RPG SFX Starter Pack](https://pedrohbs94.itch.io/essential-rpg-sfx-pack)

SFX de UI recomendado:

JRPG UI Sound Effects Pack — WOW Sound:

[JRPG UI Sound Effects Pack — WOW Sound](https://wowsound.com/game-audio-packs/jrpg-ui-sound-effects-pack.aspx)

Alternativas:

- Ultimate UI Sound Effects Pack:
- [Ultimate UI Sound Effects Pack](https://racoon-cat.itch.io/ultimate-ui-sound-effects-pack-60-sounds)
- UI Sounds Effect Pack:
- [UI Sounds Effect Pack](https://digisolva.itch.io/uisoundseffect)

Música fantasy recomendada:

Full Fantasy Music Pack for RPG / Platformer — Feather Falling:

[Full Fantasy Music Pack for RPG / Platformer — Feather Falling](https://tommusic.itch.io/full-fantasy-music-pack-for-rpg-platformer-feather-falling)

Alternativas:

- Free Fantasy Music Pack for RPG / Platformer:
- [Free Fantasy Music Pack for RPG / Platformer](https://tommusic.itch.io/fantasy-music-pack-for-rpg-platformer)
- Chiptune Fantasy Music Pack:
- [Chiptune Fantasy Music Pack](https://music-tale.itch.io/chiptune-fantasy)
- Fantasy Exploration RPG Music Pack — ThiSound:
- [Fantasy Exploration RPG Music Pack — ThiSound](https://thisound.itch.io/enchantedexplorationfantasy-music-pack)
- Dark Fantasy Loops Music Pack:
- [Dark Fantasy Loops Music Pack](https://loopnpixel.itch.io/dark-fantasy-loops)

Música de boss recomendada:

Premium Boss Battle Music Pack:

[Premium Boss Battle Music Pack](https://soulix-dev.itch.io/premium-boss-battle-music-pack-10-tracks-for-rpgs)

Alternativas:

- Dark Fantasy Music: Boss Battles:
- [Dark Fantasy Music: Boss Battles](https://intersonic-sound.itch.io/adaptive-fantasy-music-boss-battles)
- Chiptune Fantasy Music Pack:
- [Chiptune Fantasy Music Pack](https://music-tale.itch.io/chiptune-fantasy)

### Asignación de audio por sistema

Menú principal:

- Recomendado: Full Fantasy Music Pack.
- Alternativas: Chiptune Fantasy Music Pack, Free Fantasy Music Pack.
- Necesita: loop de menú, confirm, cancel, hover/select, error, abrir settings.
- SFX recomendado: JRPG UI Sound Effects Pack.
- Alternativas: Ultimate UI Sound Effects Pack, UI Sounds Effect Pack.

Bosc Antic ambiente:

- Recomendado: Full Fantasy Music Pack, usando track tipo magic forest / exploration.
- Alternativas: Fantasy Exploration RPG Music Pack, Dark Fantasy Loops Music Pack, Chiptune Fantasy Music Pack.
- Necesita: loop ambiental del bioma, sin saturar combate.

Aranya d’Escorça:

- Recomendado: Premium Boss Battle Music Pack o variación tensa de Full Fantasy Music Pack.
- Alternativas: Chiptune Fantasy Music Pack, Dark Fantasy Music: Boss Battles.
- Necesita: música de mini jefe o capa de combate, inicio combate, muerte/victoria corta.

Mare Espina:

- Recomendado: Premium Boss Battle Music Pack.
- Alternativas: Dark Fantasy Music: Boss Battles, Chiptune Fantasy Music Pack.
- Necesita: tema de boss, fase final, victoria, muerte/colapso.

Movimiento jugador:

- Acciones: salto, doble salto, aterrizaje, dash, wall slide, cambio de personaje.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: FREE Retro Action Platformer Sound Effects, Essential RPG SFX Starter Pack.

Canuter:

- Acciones: ataque normal, impacto espada, ataque circular, curación, carga de golpe pesado, golpe pesado, onda de corte lanzada, onda impactando.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: Essential RPG SFX Starter Pack, RPG Magic Sound Effect Pack para curación/onda.

Neret:

- Acciones: cuchillo lanzado, cuchillo impactando, arco de cuchillos, cuchillo con cuerda lanzado, cuerda enganchando, cuerda tensándose, cuerda soltándose, teletransporte salida/llegada, wall slide.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: FREE Retro Action Platformer Sound Effects, RPG Magic Sound Effect Pack para teletransporte.

Bruna:

- Acciones: proyectil mágico, rayo de ruptura, pulso terrestre, barrera arcana, anulación, romper sello/muro mágico.
- Pack recomendado: RPG Magic Sound Effect Pack.
- Alternativas: WOW Sound RPG Magic Sound Effects Pack, Essential RPG SFX Starter Pack.

Enemigos normales:

- Acciones: alerta, ataque, impacto recibido, muerte, proyectil de espora, mordisco, martillazo, estocada.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: Essential RPG SFX Starter Pack, FREE Retro Action Platformer Sound Effects.

Aranya d’Escorça SFX:

- Acciones: aparición, movimiento pesado, Mossegada d’Escorça, Fil de Resina, resina impactando, Salt Curt, Crida de Larves, daño recibido, muerte.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: RPG Magic Sound Effect Pack para resina/invocación, Essential RPG SFX Starter Pack.

Mare Espina SFX:

- Acciones: rugido/inicio, Cop de Branca, aviso de raíces, raíces saliendo, Pluja d’Espines, Crida del Bosc, fase final L’Arrel Negra, daño recibido, muerte/colapso, liberación del bosque.
- Pack recomendado: Platformer Game Sound Effects + RPG Magic Sound Effect Pack.
- Alternativas: Essential RPG SFX Starter Pack, WOW Sound RPG Magic Sound Effects Pack.

UI y scoring:

- Acciones: hover/select, confirmar, cancelar, abrir/cerrar pausa, cambiar tab, abrir mapa, zoom mapa, seleccionar teletransporte, guardar, cargar, error, nuevo récord, combo sube, combo rompe, rango C/B/A/S/S+.
- Pack recomendado: JRPG UI Sound Effects Pack.
- Alternativas: Ultimate UI Sound Effects Pack, UI Sounds Effect Pack.

Mundo e interacción:

- Acciones: abrir Caixa de Botí, recoger talismán, equipar talismán, descubrir Cristall de Savia, activar teletransporte, aparecer tras teletransporte, puerta bloqueada, Pedra Trencable rota, pinchos dañando, Planta Trampa activándose.
- Pack recomendado: Platformer Game Sound Effects.
- Alternativas: Essential RPG SFX Starter Pack, RPG Magic Sound Effect Pack para teletransporte/talismán.

### Audio secundario de valor añadido

Ambiente:

- viento suave,
- hojas,
- ramas,
- pájaros lejanos,
- pulso de corrupción,
- bosque grave en zonas bajas.

Recomendado: packs de música o ambiente fantasy o creación propia con capas ambientales.

Ambiente: viento suave, hojas, ramas, pájaros lejanos, pulso de corrupción, bosque grave en zonas bajas.

Recomendado: packs de música/ambiente fantasy o creación propia con capas ambientales.

Critters:

- chillido al huir,
- sonido gracioso al atacar sin hacer daño,
- muerte ligera,
- aleteo de polilla.

Recomendado: Platformer Game Sound Effects o Essential RPG SFX Starter Pack.

Critters: chillido al huir, sonido gracioso al atacar sin hacer daño, muerte ligera, aleteo de polilla.

Narrativa:

- funeral,
- armadura equipada,
- puerta de casa,
- bajada desde La Copa Mare,
- texto escribiéndose.

Recomendado: JRPG UI Sound Effects Pack + Platformer Game Sound Effects.

Narrativa: funeral, armadura equipada, puerta de casa, bajada desde La Copa Mare, texto escribiéndose.

## Inventario de VFX para demo

### Packs base recomendados

Slash VFX recomendado:

VFX - SLASH - Pixel Art Effects:

[VFX - SLASH - Pixel Art Effects](https://kiddolink.itch.io/vfx-fx-slash-pixel-art)

Alternativas:

- VFX - SLASH VOL 2:
- [VFX - SLASH VOL 2](https://kiddolink.itch.io/vfx-slash-vol-2-pixel-art-effects)
- CraftPix Sprite Effects Category:
- [CraftPix Sprite Effects Category](https://craftpix.net/categorys/sprite-effects/)

Magia VFX recomendado:

10 Magic Sprite Sheet Effects Pixel Art:

[10 Magic Sprite Sheet Effects Pixel Art](https://craftpix.net/product/10-magic-sprite-sheet-effects-pixel-art/)

Alternativas:

- 10 Magic Effects Pixel Art Pack:
- [10 Magic Effects Pixel Art Pack](https://craftpix.net/product/10-magic-effects-pixel-art-pack/)
- Pixel Art Magic Sprite Effects and Icons Pack:
- [Pixel Art Magic Sprite Effects and Icons Pack](https://craftpix.net/product/pixel-art-magic-sprite-effects-and-icons-pack/)
- Magic Effects Pixel Art Asset Pack 4:
- [Magic Effects Pixel Art Asset Pack 4](https://craftpix.net/product/magic-effects-pixel-art-asset-pack-4/)

Explosiones/impactos fuertes recomendado:

Explosions VFX Pixel Art Asset Pack:

[Explosions VFX Pixel Art Asset Pack](https://aklingon.itch.io/explosions-vfx)

Alternativas:

- [CraftPix Sprite Effects Category](https://craftpix.net/categorys/sprite-effects/)
- [10 Magic Sprite Sheet Effects Pixel Art](https://craftpix.net/product/10-magic-sprite-sheet-effects-pixel-art/)

### Asignación de VFX por sistema

Asignación de VFX por sistema

Recomendado: Explosions VFX Pixel Art Asset Pack para enemigos medianos/grandes; Phaser particles para pequeños.

Canuter ataque normal:

- Recomendado: VFX - SLASH - Pixel Art Effects.
- Alternativas: VFX - SLASH VOL 2, CraftPix Sprite Effects Category.
- Uso: pequeño arco de espada, impacto ligero, hit flash en enemigo.

Canuter ataque circular:

- Recomendado: VFX - SLASH VOL 2.
- Alternativas: VFX - SLASH - Pixel Art Effects, Phaser procedural con arco circular.
- Uso: círculo o media luna alrededor de Canuter, partículas y pequeño camera shake.

Canuter golpe cargado:

- Recomendado: VFX - SLASH VOL 2 + Explosions VFX Pixel Art Asset Pack.
- Alternativas: Magic Effects Pixel Art Asset Pack 4, Phaser particles.
- Uso: carga visual, aura en arma, golpe frontal grande, impacto fuerte.

Canuter onda de corte:

- Recomendado: VFX - SLASH - Pixel Art Effects.
- Alternativas: VFX - SLASH VOL 2, Phaser projectile propio.
- Uso: onda de aire horizontal, proyectil de corte e impacto.

Curación:

- Recomendado: 10 Magic Effects Pixel Art Pack.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4.
- Uso: aura verde/dorada, partículas ascendentes, feedback de vida recuperada.

Dash:

- Recomendado: Phaser procedural con estela.
- Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Pixel Art Magic Sprite Effects and Icons Pack.
- Uso: afterimage, estela corta, blur/polvo.

Cambio de personaje:

- Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Phaser particles.
- Uso: flash breve, partículas, silueta o swap burst.

Neret cuchillos:

- Recomendado: Phaser projectile propio + VFX - SLASH para impacto.
- Alternativas: VFX - SLASH VOL 2, CraftPix Sprite Effects Category.
- Uso: cuchillo, trail mínimo, impacto pequeño.

Neret arco de cuchillos:

- Recomendado: Phaser procedural con sprites de cuchillo y pequeñas estelas.
- Alternativas: VFX - SLASH - Pixel Art Effects para impactos, VFX - SLASH VOL 2.
- Uso: 20 proyectiles en arco de 180 grados.

Neret cuchillo con cuerda:

- Recomendado: Phaser line/rope procedural.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack para enganche, 10 Magic Sprite Sheet Effects Pixel Art para impacto.
- Uso: línea de cuerda, punto de anclaje, cuerda tensa, cuerda colgando al soltarse.

Neret teletransporte:

- Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4.
- Uso: desaparición, flash, aparición, partículas direccionales.

Neret wall slide:

- Recomendado: Phaser particles.
- Alternativas: CraftPix Sprite Effects Category.
- Uso: polvo/fricción contra pared, pequeñas chispas vegetales o corteza.

Bruna magia general:

- Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4.
- Uso: proyectiles mágicos, rayo, barrera, pulso, anulación.

Bruna barrera:

- Recomendado: Magic Effects Pixel Art Asset Pack 4.
- Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Pixel Art Magic Sprite Effects and Icons Pack.
- Uso: shield/bubble, aura, runas.

Bruna rayo de ruptura:

- Recomendado: 10 Magic Sprite Sheet Effects Pixel Art.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Magic Effects Pixel Art Asset Pack 4.
- Uso: lightning line, impacto, partículas de cristal.

Enemigo recibe daño:

- Recomendado: Phaser hit flash + pequeñas partículas.
- Alternativas: Explosions VFX Pixel Art Asset Pack para impactos fuertes, CraftPix Sprite Effects Category.
- Uso: flash blanco/rojo, shake ligero, partículas.

Enemigo muere:

- Recomendado: Explosions VFX Pixel Art Asset Pack para enemigos medianos o grandes; Phaser particles para pequeños.
- Alternativas: 10 Magic Effects Pixel Art Pack, CraftPix Sprite Effects Category.
- Uso: burst pequeño, humo, hojas o partículas negras si está corrupto.

Flor Espora proyectil:

- Recomendado: 10 Magic Effects Pixel Art Pack.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Phaser projectile propio.
- Uso: bola/espora lenta, trail suave, impacto.

Planta Trampa:

- Recomendado: Phaser particles + animación del asset.
- Alternativas: VFX - SLASH para mordisco, CraftPix Sprite Effects Category.
- Uso: apertura, mordisco, partículas de hojas.

Espines / pinchos:

- Recomendado: VFX procedural mínimo en Phaser.
- Alternativas: 10 Magic Sprite Sheet Effects Pixel Art si se quieren spikes mágicos.
- Uso: destello de daño y pequeñas partículas.

Pedra Trencable:

- Recomendado: Explosions VFX Pixel Art Asset Pack.
- Alternativas: CraftPix Sprite Effects Category, Phaser particles de roca.
- Uso: rotura, fragmentos, polvo.

Cristall de Savia teletransporte:

- Recomendado: Pixel Art Magic Sprite Effects and Icons Pack.
- Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Magic Effects Pixel Art Asset Pack 4.
- Uso: brillo idle, activación, partículas, desaparición/aparición.

Caixa de Botí / talismán conseguido:

- Recomendado: 10 Magic Effects Pixel Art Pack.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, JRPG UI VFX en React/CSS.
- Uso: apertura, brillo, talismán flotando, destello.

Combo C/B/A/S/S+:

- Recomendado: React/CSS + font pixel art + glow y animación.
- Alternativas: sprites propios, Phaser particles para S/S+.
- Uso: C simple, B glow suave, A glow fuerte, S fuego azul, S+ fuego azul con electricidad.

Nuevo récord:

- Recomendado: React/CSS con animación de panel y partículas ligeras.
- Alternativas: Phaser particles superpuestas, 10 Magic Effects Pixel Art Pack.
- Uso: aparición de panel, brillo, score destacado.

Aranya d’Escorça:

- Recomendado: Magic Effects Pixel Art Asset Pack 4 + Phaser procedural.
- Alternativas: 10 Magic Sprite Sheet Effects Pixel Art, Explosions VFX Pixel Art Asset Pack.
- Uso: resina, invocación, salto, muerte.

Mare Espina:

- Recomendado: 10 Magic Sprite Sheet Effects Pixel Art para spikes/raíces y Magic Effects Pixel Art Asset Pack 4 para corrupción.
- Alternativas: Pixel Art Magic Sprite Effects and Icons Pack, Explosions VFX Pixel Art Asset Pack.
- Uso: raíces del suelo, lluvia de espinas, aura de L’Arrel Negra, fase final, colapso.

Muerte de Mare Espina:

- Recomendado: Explosions VFX Pixel Art Asset Pack + Phaser particles de hojas/luz.
- Alternativas: Magic Effects Pixel Art Asset Pack 4, 10 Magic Effects Pixel Art Pack.
- Uso: colapso del árbol, liberación, partículas negras que desaparecen y luz vegetal.

### Compra mínima recomendada para demo

Audio:

- Platformer Game Sound Effects — Fab.
- JRPG UI Sound Effects Pack o alternativa barata de UI.
- Full Fantasy Music Pack — Feather Falling.
- Premium Boss Battle Music Pack si la música de boss del pack fantasy no convence.
- RPG Magic Sound Effect Pack si las habilidades mágicas quedan pobres.

VFX:

- VFX - SLASH - Pixel Art Effects.
- VFX - SLASH VOL 2.
- 10 Magic Sprite Sheet Effects Pixel Art.
- Explosions VFX Pixel Art Asset Pack.
- Opcional: Magic Effects Pixel Art Asset Pack 4.
