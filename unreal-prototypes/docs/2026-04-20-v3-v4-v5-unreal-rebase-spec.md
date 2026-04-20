# Unreal Prototypes v3-v4-v5 Rebase Spec

## Objetivo

Dejar el repo preparado para iterar prototipos Unreal desde aquí con una convención estable:

1. importar el proyecto Unreal actual como `unreal-prototypes/v3`
2. mover el `AGENTS.md` y el `Makefile` actuales a `sokol-prototypes`
3. convertir la base del repo en base Unreal
4. congelar un `v4` intacto y abrible con `make run`
5. crear un `v5` FPS sobre esa base

## Hechos confirmados

- El proyecto fuente está en `/Users/oalfonso/unreal_assets/PolygonStarter 5.7`.
- Es un proyecto Unreal Engine `5.7`.
- El archivo de proyecto es `PolygonStarter.uproject`.
- El módulo C++ se llama `PolygonStarter`.
- El mapa por defecto actual es `/Game/PolygonStarter/Maps/DemoScene`.
- El `GameMode` global actual es `/Game/PolygonStarter/EpicContent/Blueprints/ThirdPersonGameMode.ThirdPersonGameMode_C`.
- El pawn jugable actual es `/Game/PolygonStarter/Models/Characters/BP_Chr_Male_Face_01.BP_Chr_Male_Face_01_C`.
- Ya existe una configuración Sidekick reutilizable:
  - preset: `/Game/Synty/SidekickCharacters/Presets/SKP_SidekickWorkspace`
  - merged mesh: `/Game/Synty/SidekickCharacters/Presets/SKP_SidekickWorkspace_SKM`
  - blueprint de referencia: `/SidekickCharacterTool/Blueprints/BP_ThirdPersonSidekick.BP_ThirdPersonSidekick_C`
- Ya existe una malla de arma reutilizable: `/Game/PolygonStarter/Models/SM_Wep_WaterPistol_01.SM_Wep_WaterPistol_01`.
- En el barrido local de `/Users/oalfonso/unreal_assets` y `/Users/oalfonso/Downloads` no aparece un rifle claro reutilizable para este prototipo.
- En el barrido local sí aparecen estas armas mesh reutilizables:
  - `/Game/PolygonStarter/Models/SM_Wep_WaterPistol_01.SM_Wep_WaterPistol_01`
  - `/Game/PolygonStarter/Models/SM_Wep_Watergun_01.SM_Wep_Watergun_01`
  - `/Game/PolygonStarter/Models/SM_Wep_Watergun_02.SM_Wep_Watergun_02`
  - `/Game/PolygonStarter/Models/SM_PolygonPrototype_Prop_Sword_01.SM_PolygonPrototype_Prop_Sword_01`
  - `/Game/PolygonStarter/Models/SM_Wep_Shield_04.SM_Wep_Shield_04`
- En el barrido local no aparecen animaciones de ataque melee, disparo, reload, aim o montage de combate reutilizables dentro del material ya inspeccionado.
- El asset de personaje femenino contiene referencia a `hand_r`, así que puede usarse como punto de attach de arma visual.
- El `AGENTS.md` de raíz actual está orientado a Sokol/C/Objective-C, no a Unreal.
- El `Makefile` de raíz actual mezcla Godot, pygame y Sokol; no sirve como base limpia para Unreal.

## Decisiones cerradas

### 1. Identidad de versión

- La identidad de la versión vive en el directorio: `unreal-prototypes/v3`, `v4`, `v5`.
- `PolygonStarter.uproject` no se renombra en `v3`, `v4` ni `v5`.
- El módulo C++ `PolygonStarter` no se renombra.
- El plugin `SidekickCharacterTool` no se renombra.
- No se renombra `DemoScene`.

Consecuencia: cambiar de versión será cambiar de directorio y/o cambiar `VERSION=vN`, no renombrar el proyecto Unreal interno.

### 2. Convención de base del repo

- El `AGENTS.md` actual de raíz se divide en dos:
  - las reglas repo-wide siguen en el `AGENTS.md` de raíz
  - todo lo que sea Sokol-only se mueve a `sokol-prototypes/AGENTS.md`
- El `Makefile` actual de raíz deja de ser la base del repo.
- La nueva base de raíz del repo pasa a ser Unreal:
  - nuevo `AGENTS.md` de raíz: instrucciones de trabajo para Unreal prototypes
  - nuevo `Makefile` de raíz: lanzador de versiones Unreal
- Cada engine root tendrá su propio `Makefile`:
  - `godot-prototypes/Makefile`
  - `pygame-prototypes/Makefile`
  - `sokol-prototypes/Makefile`
- `v1` y `v2` de `unreal-prototypes` no se tocan.

### 3. Convención de ejecución

La interfaz canónica de ejecución en raíz será:

```bash
make run VERSION=v3
make run VERSION=v4
make run VERSION=v5
```

Además se permiten alias de comodidad:

```bash
make run-v3
make run-v4
make run-v5
```

Y cada versión Unreal tendrá su `Makefile` local con:

```bash
make run
```

Contrato obligatorio:

- Desde `v4` en adelante, toda nueva versión Unreal debe incluir `Makefile` local con target `run`.
- `make run` local siempre abre el editor Unreal con el `.uproject` de esa versión.
- El `Makefile` de raíz nunca abre un proyecto directamente; siempre delega al `Makefile` local de la versión.
- El `Makefile` de raíz no expone targets Godot, pygame ni Sokol.
- Los `Makefile` de `godot-prototypes/`, `pygame-prototypes/` y `sokol-prototypes/` serán los únicos dueños de sus targets.

### 4. Política de importación

La importación de `PolygonStarter 5.7` a `v3` será una importación limpia de contenido fuente, no de cachés generadas.

Se copian exactamente estas rutas del proyecto fuente:

- `Config/`
- `Content/`
- `Plugins/`
- `Source/`
- `docs/`
- `tools/`
- `PolygonStarter.uproject`
- `Makefile`

No se copian estas rutas:

- `.DS_Store`
- `Binaries/`
- `DerivedDataCache/`
- `Intermediate/`
- `Saved/`

Si durante la importación aparece una ruta nueva no listada arriba, se considera fuera de contrato y no se copia sin decidirlo antes.

### 5. Significado exacto de `v3`, `v4` y `v5`

- `v3`: snapshot limpio importado desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7`.
- `v4`: copia intacta de `v3`, sin cambios de gameplay, sin cambios de mapa, sin cambios de assets, sin cambios de C++, sin cambios de config, solo preparada para abrirse con `make run`.
- `v5`: copia de `v4` en la que sí se construye el prototipo FPS.

## Trabajo exacto a realizar

## Fase A. Reorganización de base

### A1. Repartir instrucciones `AGENTS.md`

- Crear un nuevo `AGENTS.md` de raíz con dos bloques:
  - reglas repo-wide heredadas del `AGENTS.md` actual
  - reglas base Unreal para el root actual del repo
- Mover a `sokol-prototypes/AGENTS.md` todo lo que sea Sokol-only.

Reglas exactas que permanecen en `AGENTS.md` de raíz:

- `modo rapido` means speed first, no tests, no unnecessary process.
- Before implementing a feature, first check that the spec is fully deterministic and boolean-clear, with nothing left open to interpretation; if something is ambiguous, ask before coding.
- Default verification is: build passes and the prototype starts without crashing.

Reglas exactas que salen del root y pasan a `sokol-prototypes/AGENTS.md`:

- Runtime is C or Objective-C; tooling can be Python.
- Use Sokol as the runtime/render/input layer.
- Prefer `src/`, `include/`, `data/`, `tools/`, `build/`.
- Keep `main` thin and delegate real work to modules.
- Split by domain: app, render, world, player, collision, shared.
- Prefer `.h` + `.c`/`.m` modules over giant source files.
- Prefer named structs over opaque arrays or long parameter lists.
- Heavy preprocessing belongs offline in Python, not in runtime.
- Prefer a root-level `settings.yaml` in each project for stable project configuration and contracts; put contract rules under a `contract:` block with explicit child keys instead of hiding them in one opaque string.
- In voxel source maps, `ROW` directives inside each `LAYER` must always appear in strictly ascending row index order.
- Todo el bloque `Geometry and winding convention`.

### A2. Repartir makefiles por engine

- Crear `godot-prototypes/Makefile` usando como base la parte Godot del `Makefile` actual.
- Crear `pygame-prototypes/Makefile` usando como base la parte pygame del `Makefile` actual.
- Crear `sokol-prototypes/Makefile` usando como base la parte Sokol del `Makefile` actual.
- Cada uno solo contiene targets de su engine.
- Las rutas internas de cada `Makefile` deben quedar relativas a su carpeta engine root.
- El `Makefile` de raíz deja de contener targets Godot, pygame y Sokol.

### A3. Crear nueva base Unreal en raíz

- Reemplazar el `AGENTS.md` de raíz por uno orientado a Unreal.
- Reemplazar el `Makefile` de raíz por uno orientado a Unreal.

Contrato del nuevo `AGENTS.md` de raíz:

- conserva exactamente las 3 reglas repo-wide listadas en `A1`
- engine base: Unreal Engine `5.7`
- tooling permitido: shell y Unreal Python
- estructura preferida: `Config/`, `Content/`, `Source/`, `Plugins/`, `tools/`, `docs/`
- antes de tocar gameplay o assets: especificación determinista con rutas concretas
- verificación por defecto: `make run VERSION=vN` abre el editor sin crash

Contrato del nuevo `Makefile` de raíz:

```make
UE_EDITOR ?= /Users/Shared/Epic Games/UE_5.7/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor
VERSION ?=

run:
	@test -n "$(VERSION)" || { echo "Usage: make run VERSION=v3"; exit 1; }
	$(MAKE) -C "unreal-prototypes/$(VERSION)" run UE_EDITOR="$(UE_EDITOR)"

run-v3:
	$(MAKE) run VERSION=v3

run-v4:
	$(MAKE) run VERSION=v4

run-v5:
	$(MAKE) run VERSION=v5
```

## Fase B. Crear `v3`

### B1. Crear directorio destino

- Crear `unreal-prototypes/v3`.
- Si `unreal-prototypes/v3` ya existe, parar y no sobrescribir nada.

### B2. Importar el proyecto fuente

Importar a `unreal-prototypes/v3/` el contenido permitido del proyecto fuente:

- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/Config` a `unreal-prototypes/v3/Config`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/Content` a `unreal-prototypes/v3/Content`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/Plugins` a `unreal-prototypes/v3/Plugins`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/Source` a `unreal-prototypes/v3/Source`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/docs` a `unreal-prototypes/v3/docs`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/tools` a `unreal-prototypes/v3/tools`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/PolygonStarter.uproject` a `unreal-prototypes/v3/PolygonStarter.uproject`
- desde `/Users/oalfonso/unreal_assets/PolygonStarter 5.7/Makefile` a `unreal-prototypes/v3/Makefile`

### B3. Normalizar `Makefile` local de `v3`

- `unreal-prototypes/v3/Makefile` debe conservar los targets útiles ya existentes del proyecto fuente si siguen funcionando.
- Tiene que existir obligatoriamente un target `run`.
- `run` debe abrir `$(CURDIR)/PolygonStarter.uproject`.
- El editor Unreal debe venir de `UE_EDITOR ?= ...`.

### B4. Criterios de aceptación de `v3`

`v3` queda correcto solo si se cumplen todos:

- `unreal-prototypes/v3/PolygonStarter.uproject` existe.
- `unreal-prototypes/v3/Source/PolygonStarter/...` existe.
- `unreal-prototypes/v3/Plugins/SidekickCharacterTool/...` existe.
- `unreal-prototypes/v3/tools/...` existe.
- `unreal-prototypes/v3/docs/...` existe.
- `make run VERSION=v3` abre el editor con `unreal-prototypes/v3/PolygonStarter.uproject`.
- El proyecto abre en `DemoScene` sin crash.

## Fase C. Crear `v4`

### C1. Copiar `v3` a `v4`

- Crear `unreal-prototypes/v4` como copia completa de `unreal-prototypes/v3`.
- No se reimporta desde la carpeta externa.
- No se cambian nombres internos del proyecto.

### C2. Regla de inmutabilidad de `v4`

En `v4` no se modifica nada de estas rutas respecto a `v3`:

- `Config/`
- `Content/`
- `Plugins/`
- `Source/`
- `docs/`
- `tools/`
- `PolygonStarter.uproject`
- `Makefile`

Interpretación exacta: `v4` es el baseline intacto de trabajo. Si hay que tocar algo para el FPS, ya no es `v4`, es `v5`.

### C3. Criterios de aceptación de `v4`

`v4` queda correcto solo si se cumplen todos:

- `make run VERSION=v4` abre el editor con `unreal-prototypes/v4/PolygonStarter.uproject`.
- `v4` abre en `DemoScene` sin crash.
- Fuera de directorios generados por Unreal, `v4` es igual a `v3`.

## Fase D. Crear `v5`

### D1. Punto de partida

- Crear `unreal-prototypes/v5` como copia completa de `unreal-prototypes/v4`.
- Todo cambio de gameplay, input, HUD, camera, arma, enemigo y mapa sucede solo en `v5`.

### D2. Objetivo jugable de `v5`

`v5` debe ser un prototipo FPS mínimo y cerrado con este comportamiento exacto:

- el jugador entra en primera persona
- el jugador usa visuals Sidekick ya existentes
- el jugador ve arma y antebrazos en pantalla, estilo Counter-Strike
- hay un crosshair fijo en el centro
- el jugador puede disparar
- existe al menos un enemigo en la escena
- el enemigo se ve con un arma sujeta en la mano derecha
- el enemigo no se mueve
- el enemigo no ataca
- el enemigo aguanta de pie
- el enemigo muere exactamente al tercer disparo válido
- al morir, el enemigo entra en ragdoll y se desploma

## Especificación exacta de `v5`

### D3. Mapa y arranque

- `v5` no usa `DemoScene`.
- `v5` crea y usa un mapa nuevo desde cero:
  - `/Game/PolygonStarter/Maps/V5Arena.V5Arena`
- `v5` mantiene Unreal `5.7`.
- `v5` arranca con `make run VERSION=v5`.
- `Config/DefaultEngine.ini` de `v5` debe apuntar a `V5Arena` como:
  - `EditorStartupMap`
  - `GameDefaultMap`

Contrato exacto del entorno limpio de `V5Arena`:

- el mapa parte de un nivel vacío
- no se duplica `DemoScene`
- no se copian actores de `DemoScene`
- geometría mínima obligatoria:
  - `V5Floor_01` usando `/Engine/BasicShapes/Cube.Cube`
  - `V5Wall_North_01` usando `/Engine/BasicShapes/Cube.Cube`
  - `V5Wall_South_01` usando `/Engine/BasicShapes/Cube.Cube`
  - `V5Wall_East_01` usando `/Engine/BasicShapes/Cube.Cube`
  - `V5Wall_West_01` usando `/Engine/BasicShapes/Cube.Cube`
- placement exacto:
  - `V5Floor_01`: location `(0, 0, -50)`, scale `(40, 40, 1)`
  - `V5Wall_North_01`: location `(0, 2000, 150)`, scale `(40, 1, 4)`
  - `V5Wall_South_01`: location `(0, -2000, 150)`, scale `(40, 1, 4)`
  - `V5Wall_East_01`: location `(2000, 0, 150)`, scale `(1, 40, 4)`
  - `V5Wall_West_01`: location `(-2000, 0, 150)`, scale `(1, 40, 4)`
- actores base obligatorios:
  - `V5DirectionalLight_01`
  - `V5SkyLight_01`
  - `V5PlayerStart_01`
- placement exacto de `V5PlayerStart_01`:
  - location `(0, 0, 120)`
  - rotation `(0, 0, 0)`

### D4. Arquitectura de runtime

Para que el trabajo sea repetible desde código y no dependa de clicks manuales, la lógica nueva de `v5` debe ir en C++ y los cambios de mapa/asset mínimos deben ir por script Unreal Python cuando haga falta.

Archivos C++ nuevos esperados en `v5`:

- `Source/PolygonStarter/Public/FPS/PolygonStarterFPSCharacter.h`
- `Source/PolygonStarter/Private/FPS/PolygonStarterFPSCharacter.cpp`
- `Source/PolygonStarter/Public/FPS/PolygonStarterFPSGameMode.h`
- `Source/PolygonStarter/Private/FPS/PolygonStarterFPSGameMode.cpp`
- `Source/PolygonStarter/Public/FPS/PolygonStarterFPSHUD.h`
- `Source/PolygonStarter/Private/FPS/PolygonStarterFPSHUD.cpp`
- `Source/PolygonStarter/Public/FPS/FPSWeaponComponent.h`
- `Source/PolygonStarter/Private/FPS/FPSWeaponComponent.cpp`
- `Source/PolygonStarter/Public/FPS/FPSHealthComponent.h`
- `Source/PolygonStarter/Private/FPS/FPSHealthComponent.cpp`
- `Source/PolygonStarter/Public/FPS/FPSStaticEnemyCharacter.h`
- `Source/PolygonStarter/Private/FPS/FPSStaticEnemyCharacter.cpp`

Scripts Unreal Python esperados en `v5/tools`:

- `tools/create_v5_map.py`
- `tools/place_v5_enemy.py`
- `tools/verify_v5_setup.py`

### D5. Jugador

Contrato del jugador FPS:

- clase base nueva: `APolygonStarterFPSCharacter`
- hereda de `APolygonStarterCharacterBase`
- se usa como `DefaultPawnClass` del `GameMode` de `v5`
- cámara activa: una cámara de primera persona nueva, no la cámara third-person heredada
- input de disparo: `Fire`
- binding mínimo:
  - `LeftMouseButton` -> `Fire`
- el movimiento base actual se conserva:
  - `W`, `A`, `S`, `D`
  - ratón para mirar

Contrato visual del jugador:

- la visual world-space del jugador debe salir del Sidekick ya existente
- asset obligatorio de malla world-space:
  - `/Game/Synty/SidekickCharacters/Presets/SKP_SidekickWorkspace_SKM.SKP_SidekickWorkspace_SKM`
- animation blueprint obligatorio de la malla world-space:
  - `/SidekickCharacterTool/EpicContent/Mannequins/Animations/ABP_Manny.ABP_Manny_C`
- no se elige un outfit nuevo desde cero
- se reutiliza el Sidekick preset/workspace ya presente en el proyecto

Contrato exacto de la vista FPS de antebrazos:

- el cuerpo world-space del jugador sigue existiendo para colisión y animación
- `GetMesh()` debe tener `OwnerNoSee = true`
- debe existir un `SceneComponent` nuevo `FirstPersonArmsRoot` hijo de la cámara FPS
- deben existir 6 `USkeletalMeshComponent` owner-only, hijos de `FirstPersonArmsRoot`:
  - `FirstPersonUpperArmL`
  - `FirstPersonUpperArmR`
  - `FirstPersonLowerArmL`
  - `FirstPersonLowerArmR`
  - `FirstPersonHandL`
  - `FirstPersonHandR`
- los 6 componentes deben tener `OnlyOwnerSee = true`
- los 6 componentes deben seguir la pose de `GetMesh()` con `LeaderPoseComponent`
- assets exactos de brazos/manos:
  - `FirstPersonUpperArmL` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_11AUPL_HU01.SK_SCFI_CIVL_09_11AUPL_HU01`
  - `FirstPersonUpperArmR` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_12AUPR_HU01.SK_SCFI_CIVL_09_12AUPR_HU01`
  - `FirstPersonLowerArmL` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_13ALWL_HU01.SK_SCFI_CIVL_09_13ALWL_HU01`
  - `FirstPersonLowerArmR` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_14ALWR_HU01.SK_SCFI_CIVL_09_14ALWR_HU01`
  - `FirstPersonHandL` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_15HNDL_HU01.SK_SCFI_CIVL_09_15HNDL_HU01`
  - `FirstPersonHandR` -> `/Game/Synty/SidekickCharacters/Resources/Meshes/Outfits/Starter/SK_SCFI_CIVL_09_16HNDR_HU01.SK_SCFI_CIVL_09_16HNDR_HU01`

Interpretación exacta de "armadura/casco/pantalones/etc" en la visual world-space:

- si el merged mesh del workspace ya contiene ese outfit, se usa tal cual
- no se añaden piezas duplicadas por encima del merged mesh
- no se cambia el outfit de `v4`; se reutiliza el que ya existe en el workspace Sidekick

### D6. Arma

Contrato del arma:

- mesh obligatoria:
  - `/Game/PolygonStarter/Models/SM_Wep_WaterPistol_01.SM_Wep_WaterPistol_01`
- el arma debe verse en primera persona
- el arma se ancla al jugador FPS, no al enemigo
- el arma se adjunta al componente `FirstPersonHandR`
- bone/socket de attach obligatorio: `hand_r`
- el arma no lanza proyectil físico
- el disparo será hitscan por line trace

Contrato exacto del disparo:

- cada pulsación válida de `Fire` genera un único line trace
- origen: cámara FPS
- dirección: forward vector de la cámara
- distancia máxima: `5000.0` Unreal units
- canal de colisión: `Visibility`
- daño por disparo válido al enemigo: `1`
- no hay daño de área
- no hay rebote
- no hay munición
- no hay recarga
- no hay retroceso obligatorio para esta versión

### D7. Crosshair

Contrato del crosshair:

- no se crea un widget complejo
- el crosshair lo dibuja `APolygonStarterFPSHUD`
- forma: cruz simple blanca
- posición: centro exacto del viewport
- tamaño fijo:
  - gap central: `4` px
  - longitud de cada brazo: `6` px
  - grosor: `2` px
- no hay spread dinámico
- no hay hit marker

### D8. GameMode

Contrato del `GameMode` de `v5`:

- clase nueva: `APolygonStarterFPSGameMode`
- `DefaultPawnClass = APolygonStarterFPSCharacter`
- `HUDClass = APolygonStarterFPSHUD`
- `V5Arena` debe usar este `GameMode`

Regla determinista:

- si `V5Arena` no tiene override de `GameMode`, basta con actualizar `Config/DefaultEngine.ini` de `v5`
- si `V5Arena` sí tiene override de `GameMode`, ese override debe actualizarse explícitamente al `GameMode` FPS de `v5`

### D9. Enemigo

Contrato del enemigo:

- debe existir al menos un enemigo en `V5Arena`
- clase nueva: `APolygonStarterFPSStaticEnemyCharacter`
- el enemigo se coloca ya en el mapa, no se spawnea proceduralmente en runtime
- el enemigo lleva arma visual sujeta todo el tiempo
- el enemigo no tiene AI controller
- el enemigo no patrulla
- el enemigo no rota para seguir al jugador
- el enemigo no dispara
- el enemigo no camina
- el enemigo empieza quieto y de pie

Contrato exacto de vida/muerte:

- `MaxHealth = 3`
- `CurrentHealth = 3` al cargar el mapa
- cada disparo válido recibido resta `1`
- con `CurrentHealth == 0`:
  - se desactiva cualquier movimiento del `Character`
  - se desactiva la cápsula de colisión del personaje
  - se activa ragdoll en la skeletal mesh
  - el actor queda muerto y no vuelve a levantarse

### D10. Placement del enemigo

El placement del enemigo no queda a ojo. Debe quedar definido así:

- script responsable: `tools/place_v5_enemy.py`
- mapa objetivo: `/Game/PolygonStarter/Maps/V5Arena`
- nombre/label del actor objetivo en escena: `V5Enemy_01`
- si ya existe un actor con ese label, se elimina y se vuelve a crear
- posición base:
  - tomar `V5PlayerStart_01`
  - avanzar `1200.0` unidades en su forward vector
  - lanzar un trace vertical hacia abajo para apoyar el enemigo en el suelo
- rotación:
  - el enemigo mira hacia `V5PlayerStart_01`

### D11. Assets del enemigo

Para mantenerlo cerrado y no abrir otra decisión de arte:

- el enemigo usará una visual ya existente del proyecto
- assets exactos del enemigo:
  - skeletal mesh: `/Game/PolygonStarter/Models/Characters/SK_Chr_Female_Face_01.SK_Chr_Female_Face_01`
  - physics asset: `/Game/PolygonStarter/Models/Characters/PHYS_Character_Female_Face_01.PHYS_Character_Female_Face_01`
- arma visual exacta del enemigo:
  - static mesh: `/Game/PolygonStarter/Models/SM_Wep_WaterPistol_01.SM_Wep_WaterPistol_01`
- attach exacto del arma del enemigo:
  - componente dueño: skeletal mesh del enemigo
  - bone/socket: `hand_r`
- la katana no se usa en `v5` porque sí existe una pistola utilizable
- no se añade comportamiento ofensivo al enemigo en `v5`
- el fallback katana/melee queda fuera de `v5` y solo se considerará en una iteración posterior si desaparece la opción de pistola o si se decide añadir ataque real

No se crea un segundo sistema de customización Sidekick para el enemigo en `v5`.

## Fase E. Verificación

### E1. Verificación mínima de base

Se considera verificado el trabajo de estructura solo si:

- `make run VERSION=v3` abre `v3`
- `make run VERSION=v4` abre `v4`
- `make run VERSION=v5` abre `v5`

### E2. Verificación funcional de `v5`

Se considera verificado `v5` solo si se cumplen todos estos puntos en `V5Arena`:

- el juego arranca en primera persona
- la visual del jugador es Sidekick
- se ven antebrazos owner-only en pantalla
- el arma se ve en pantalla
- el crosshair se ve en el centro
- `LeftMouseButton` dispara
- existe `V5Enemy_01` en la escena
- `V5Enemy_01` se ve con `SM_Wep_WaterPistol_01` sujeta en `hand_r`
- `V5Enemy_01` no se mueve
- el primer disparo válido no mata
- el segundo disparo válido no mata
- el tercer disparo válido mata
- al morir, `V5Enemy_01` entra en ragdoll y cae

### E3. Verificación automatizable esperada

`tools/verify_v5_setup.py` debe comprobar al menos:

- que `V5Arena` es el mapa usado por `v5`
- que el `GameMode` activo de `v5` es el FPS
- que el pawn por defecto de `v5` es el FPS
- que existe `V5Enemy_01` en `V5Arena`
- que el enemigo arranca con `MaxHealth = 3`
- que existe `V5PlayerStart_01`
- que existe `FirstPersonArmsRoot` en el pawn FPS
- que `V5Enemy_01` tiene adjunta la mesh `SM_Wep_WaterPistol_01`

No hace falta automatizar la prueba completa de los tres disparos si eso complica demasiado `v5`; la muerte por tres impactos puede validarse manualmente en PIE.

## Fase F. Analysis obligatorio post-implementación

Tras dejar hecha la rebase y `v5`, hay que escribir obligatoriamente este documento:

- `unreal-prototypes/docs/v5-delivery-analysis.md`

Ese documento no es opcional. Forma parte del entregable.

### F1. Objetivo del analysis

Dejar por escrito, antes de dar `v5` por entregado, qué se pudo validar, qué no se pudo validar, qué faltó en assets o tooling, y qué riesgos quedan para la siguiente iteración.

### F2. Contenido obligatorio del analysis

El analysis debe incluir estas secciones exactas:

- `Resumen ejecutivo`
- `Lo que sí se pudo hacer`
- `Lo que no se pudo hacer`
- `Bloqueos por assets`
- `Bloqueos por tooling`
- `Validación automatizada disponible`
- `Validación manual necesaria`
- `Evidencia recogida`
- `Riesgos abiertos`
- `Qué faltaría para llamarlo entregado sin reservas`
- `Siguiente iteración recomendada`

### F3. Matriz obligatoria de validación

El analysis debe contener una tabla con una fila por cada requisito relevante de `v3`, `v4` y `v5`, con estas columnas exactas:

- `Requisito`
- `Tipo de validación`
- `Comando o procedimiento`
- `Resultado`
- `Evidencia`
- `Estado`
- `Notas`

Valores permitidos de `Tipo de validación`:

- `Automática`
- `Manual`
- `Mixta`
- `No validable todavía`

Valores permitidos de `Estado`:

- `PASS`
- `FAIL`
- `PARTIAL`
- `BLOCKED`
- `NOT_CHECKED`

### F4. Reglas de honestidad del analysis

- si una cosa no se pudo comprobar, no se marca `PASS`
- si una cosa depende de inspección visual en editor o PIE, se marca `Manual` o `Mixta`
- si falta el asset correcto, debe quedar en `Bloqueos por assets`
- si el comportamiento existe pero no hay script/test para comprobarlo, debe quedar en `Validación manual necesaria`
- si un requisito solo funciona "más o menos", se marca `PARTIAL`, no `PASS`

### F5. Validación mínima esperada antes de dar por hecho que funciona

El analysis debe decir explícitamente, como mínimo, si se verificó o no:

- apertura de `v3`
- apertura de `v4`
- apertura de `v5`
- carga limpia de `V5Arena`
- existencia de `V5Enemy_01`
- attach visual de la pistola del enemigo
- visibilidad de arma y antebrazos del jugador
- crosshair visible
- disparo hitscan funcional
- muerte al tercer impacto
- ragdoll del enemigo al morir

### F6. Criterio de salida

No se puede declarar `v5` como "listo" sin ese analysis. Si faltan pruebas o assets, el analysis debe dejar claro si el estado real es `PASS`, `PARTIAL` o `BLOCKED`.

## No permitido en esta tarea

- no tocar `v1` o `v2`
- no renombrar el proyecto interno `PolygonStarter`
- no reestructurar Sidekick fuera de lo necesario para reutilizarlo
- no convertir `v4` en una versión modificada
- no añadir AI, navegación, animaciones complejas de combate, munición o recarga en `v5`
- no crear un sistema genérico de combate; `v5` es un prototipo cerrado, no un framework

## Estado de cierre

Con las decisiones de esta conversación, la especificación queda suficientemente cerrada para implementar sin abrir nuevas preguntas de diseño.
