# Phaser V1 Editor Core Catalog + Filesystem Plan

**Goal:** turn the current editor explorer into a real directory tree backed by both disk and database, introduce a deterministic `Core/User/Archived` content model, and establish the path from the current hardcoded prototype assets to a seedable core catalog that the editor and runtime can both consume.

**This plan extends and partially supersedes** [2026-04-22-editor-vscode-shell-plan.md](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/Plans/2026-04-22-editor-vscode-shell-plan.md), specifically its explorer and persistence sections. The shell layout still stands; the virtual grouping model does not.

---

## 1. Closed product decisions

### 1.1 Explorer roots are fixed and real

The editor has exactly three fixed roots:

- `Core`
- `User`
- `Archived`

Rules:

- these roots always exist
- they are rendered as folders
- they cannot be deleted
- they cannot be renamed
- they cannot be archived

### 1.2 No more virtual type folders

We remove virtual groups like:

- `Maps`
- `Characters`
- `Animations`
- `Tilesets`
- `Spritesheets`

unless they exist as actual folders in the tree.

The explorer must reflect real folder structure only.

If a folder is empty:

- it still renders as an empty folder node
- we do **not** render helper text like `No assets in this folder`

### 1.3 `Assets Raw` remains a real folder in `User`

`Assets Raw` is a normal folder inside `User`.

Rules:

- it exists in the initial seed
- it is the default import destination for raw PNG files
- it may be deleted or renamed by the user
- if it does not exist, default import falls back to `User`

### 1.4 Import PNG gets an explicit destination

The import modal keeps PNG-only scope for now, but adds:

- destination folder picker

Default destination:

1. `User/Assets Raw` if it exists
2. otherwise `User`

The modal does **not** allow importing into `Core`.

The modal does **not** default to `Archived`.

### 1.5 Archive is a move, not a delete

Archiving does not delete anything.

Archiving means:

- move the selected asset or folder under the `Archived` root
- keep it addressable
- keep dependency links intact
- keep it available for reference with archived status

The archive button in the inspector and drag-dropping onto `Archived` must do the same operation.

### 1.6 Archive move preserves only the moved subtree

When moving to `Archived`, we preserve the subtree that was actually selected, not its unselected parents.

Examples:

- moving `User/Enemies/Bosses` -> `Archived/Bosses`
- moving `User/Enemies` -> `Archived/Enemies/...`
- moving `User/Assets Raw/foo.png` -> `Archived/foo.png`

We do **not** recreate parent folders that were not part of the moved selection.

### 1.7 Folders are selectable

Folders are not just disclosure handles.

Folder behavior:

- single click selects the folder
- selected folder can be the current import destination
- selected folder can be dragged
- selected folder can show folder metadata / actions in the inspector

Folder selection does **not** open an asset preview; it opens folder inspector state.

### 1.8 Drag-and-drop scope for V1

V1 drag-and-drop supports:

- asset -> folder
- folder -> folder
- asset -> `Archived`
- folder -> `Archived`

We do **not** support arbitrary reordering inside a folder; sorting stays deterministic.

### 1.9 `Core` is read-only

Inside `Core`, the user cannot:

- rename assets
- rename folders
- move assets
- move folders
- archive assets
- archive folders
- create folders
- import files into `Core`

`Core` is visible and explorable, not authorable.

### 1.10 `User` is the editable workspace

Inside `User`, the user can:

- create folders
- rename folders
- rename assets
- import files
- move assets
- move folders
- archive assets
- archive folders

### 1.11 `Archived` is a content graveyard, not a workspace root

`Archived` is selectable and explorable, but it is not the default destination for new work.

Rules:

- no import into `Archived`
- no create-folder button while `Archived` is selected
- restore is intentionally not exposed as a primary inspector workflow in this phase

### 1.12 Explorer icons

We keep built-in SVG icons and add clearer type identity:

- folder icon
- raw tileset PNG icon
- raw spritesheet PNG icon
- tileset icon
- spritesheet icon
- animation icon
- character icon
- map icon

Every asset type icon gets a tooltip describing the type.

`spreadsheet` is treated as `spritesheet`.

---

## 2. Responsive policy

### 2.1 No tablet layout

The editor must **not** switch into a tablet / stacked / single-column layout.

We explicitly reject:

- sidebar collapsing into a drawer
- inspector moving under the preview
- panes stacking vertically
- mobile/tablet breakpoint design

### 2.2 Supported width contract

The editor shell supports fluid resizing only for widths `>= 1000px`.

For widths below `1000px`:

- the editor enters an unsupported-width state
- a blocking overlay explains that the editor requires a wider window
- the editor shell itself remains mounted behind the overlay

We do **not** attempt to make the editor usable below that width.

### 2.3 Desktop responsiveness

For widths `>= 1000px`:

- panes resize fluidly
- the shell remains a 3-pane editor
- no media-query jump to a different information architecture

---

## 3. Persistence contract

### 3.1 Database and disk are both required

We keep both persistence layers:

- DB for fast runtime/editor queries and relations
- disk for real filesystem structure and stable file paths

Neither layer is optional.

### 3.2 Runtime authority split

We do **not** treat disk and DB as competing writable sources.

Contract:

- DB is the query/index/relationship authority
- disk is the filesystem/content authority
- writes happen through one editor command path that updates both

### 3.3 Filesystem roots

The V1 filesystem layout is:

```text
editor-assets/core/             # shipped core files used by the game/editor
editor-assets/user/             # editable user files and authored content
editor-assets/archived/         # archived user files and authored content
```

`Core` shipped files are moved under `editor-assets/core`.

The runtime and editor both resolve core content from there.

Build/dev serving must expose these files under a stable app path such as:

- `/editor-assets/core/...`
- `/editor-assets/user/...`
- `/editor-assets/archived/...`

### 3.4 Editor entities need location metadata

Every asset record gets persistent location metadata:

- `storageRoot: "core" | "user" | "archived"`
- `folderId: string | null`
- `relativePath: string`

`relativePath` is always relative to the logical root.

Examples:

- `characters/shinobi/sources/idle.png`
- `assets-raw/attack1.png`
- `bosses/idle.png`

Real filesystem resolution is done by an `AssetPathResolver`:

- `core` -> `<coreRoot>/<relativePath>`
- `user` -> `<userRoot>/<relativePath>`
- `archived` -> `<archivedRoot>/<relativePath>`

We do **not** persist absolute paths or repo-specific full paths in DB.

### 3.4.b Raw asset storage mode

Raw asset records become disk-backed.

Closed decision:

- raw file bytes live on disk
- DB stores metadata and `relativePath`
- the current blob-only IndexedDB model is transitional and will be removed as part of this migration

We do **not** keep two long-term raw storage models for the same concept.

### 3.5 Folder records are first-class

We introduce real folder records in the DB.

Minimum folder fields:

- `id`
- `storageRoot`
- `parentFolderId | null`
- `name`
- `slug`
- `relativePath`
- `createdAt`
- `updatedAt`

This applies to all three roots, but root records are system-owned and immutable.

### 3.6 Folder paths in DB

The DB stores real folder nodes, not just `folderPath: string[]`.

Reason:

- moves and renames are cleaner
- drag-and-drop is easier
- recursion over descendants is explicit
- the tree is not reconstructed from asset tags alone

The core seed manifest may still use `folderPath: string[]` as authoring input, but runtime/editor DB uses folder records.

### 3.7 Archiving updates both DB and disk

When archiving an asset or folder:

- DB updates `storageRoot`
- DB updates `folderId`
- DB updates `relativePath`
- the corresponding file/folder moves on disk
- descendants update recursively for folder moves
- asset records also keep `archivedAt`

### 3.8 Dev-time write path

In browser dev mode, all filesystem writes go through local dev server endpoints.

We do **not** attempt direct browser filesystem writes.

Current precedent:

- `settings.yaml` already persists through Vite middleware

The same pattern is used for:

- import file copy
- folder creation
- rename
- move
- archive

Packaged desktop integration can replace these endpoints later with host IPC.

### 3.9 Naming convention

For shipped project-owned folders and filenames:

- lowercase only
- hyphen-separated
- no spaces

Examples:

- `assets-raw`
- `player-shinobi`
- `swamp-tileset`

User-facing names and labels may contain spaces and any supported characters.

User-created folders and filenames are supported more permissively, but we still derive a filesystem-safe slug for disk storage.

Closed decision:

- folder display name is user-facing
- folder `slug` is filesystem-facing
- our seeded `Core` and default `User` folders use kebab-case slugs

---

## 4. Explorer and interaction contract

### 4.1 Explorer rows

Explorer rows come in two kinds:

- folder rows
- asset rows

Folder rows:

- disclosure chevron
- folder icon
- name

Asset rows:

- file-type icon
- name

We do not append large inline metadata or empty-state text to rows.

### 4.2 Back button spacing

The back button stays top-left but is offset enough to avoid overlapping or visually competing with the global settings gear.

This is a layout correction, not a structural change.

### 4.3 Create-folder entrypoint

Next to the existing `+ import` action we add a dedicated `new folder` action in the explorer header.

We do **not** hide folder creation behind a secondary menu in this phase.

Reason:

- user already asked for it explicitly
- it is a primary filesystem action
- it should be one click away

### 4.4 Double-click rename stays

User-editable assets and folders support:

- double click -> inline rename

Read-only `Core` nodes do not.

### 4.5 Sorting rules

Deterministic sort:

1. folders
2. assets
3. alphabetical by normalized display name

Root order is fixed:

1. `Core`
2. `User`
3. `Archived`

---

## 5. Core catalog contract

### 5.1 `Core` must be visible in the editor

Everything shipped as foundational game content should become visible through `Core`.

That includes, over time:

- player source sprites
- core tilesets
- background layers
- coin assets
- core maps
- core characters
- core animations

### 5.2 Core is seeded from typed source definitions, not discovered ad hoc

We do **not** filesystem-scan `editor-assets/core` at runtime and guess meaning.

Instead we define a deterministic seed catalog in source control.

Entry point:

- `src/editor/content/coreAssetManifest.ts`

That file may import from smaller modules later, but it remains the public entrypoint.

Reason for TypeScript over raw JSON:

- strong typing
- helper builders for stable IDs
- compile-time validation
- shared types with the runtime/editor data model

The seed definitions may still be data-shaped, but they live in TS modules.

Seed definitions include both:

- display names
- filesystem slugs / relative paths

### 5.3 Core seed happens once at app bootstrap

We do **not** auto-reseed `Core` by comparing catalog versions on every startup.

Instead, the app bootstrap does this:

1. check bootstrap meta in DB
2. if core has never been seeded, seed it
3. if core has already been seeded, leave it untouched

Minimum meta fields:

- `coreSeeded: true | false`
- `runtimeSeeded: true | false`
- optional dev-only `resetToken` marker to force a local reseed on next launch

The seed runs before the editor/runtime starts reading gameplay definitions from the DB.

If seed definitions change during development, reseeding is an explicit developer action, not an automatic background diff.

Closed decision:

- explicit reseed is triggered by a dev-only reset command, not by normal app startup
- the reset command updates a dev reset token file; bootstrap sees the token change, clears editor DB state, and reruns seeding on next launch
- this command belongs in the Phaser prototype tooling, not in normal player-facing UI

### 5.4 Core seed contents

The core seed catalog owns:

- folder structure under `Core`
- raw asset entries pointing to files in `editor-assets/core`
- derived asset definitions
- map definitions
- character definitions
- animation definitions
- level composition definitions

Later it can also own prefab definitions.

### 5.5 Core seed is not just raw files

We do **not** stop at exposing raw PNGs.

`Core` should eventually show the actual authored game content graph:

- raw source files
- tileset mappings
- spritesheet mappings
- animations
- characters
- maps

This is what makes the editor useful for the shipped game itself, not just for imported user content.

---

## 6. Runtime integration strategy

### 6.1 Today

Right now the runtime still loads assets directly from hardcoded paths in:

- [gameAssets.ts](/Users/oalfonso/pipprojects/canuter/phaser-prototypes/v1-code-arena/src/game/assets/gameAssets.ts)

The editor does not yet own those definitions.

### 6.2 Target

The runtime should progressively stop hardcoding content identity and instead:

1. bootstrap the DB if needed
2. read definitions from DB
3. resolve real file paths through `AssetPathResolver`
4. build the scene from those definitions

The runtime should not need special-case hardcoded asset identities once the migration is complete.

### 6.3 Content layers

We split content into these layers:

1. raw assets
2. derived visual assets
3. gameplay prefabs
4. map placements / compositions

This avoids forcing every gameplay concept into one flat “asset file” bucket.

### 6.4 Level composition is a first-class entity

`MapDefinition` alone is not enough for the current game.

Closed decision:

- `MapDefinition` owns visual grid + collision grid
- `LevelComposition` owns placed gameplay content and scene composition

Minimum `LevelComposition` fields:

- `id`
- `name`
- `mapId`
- `playerCharacterId`
- `spawn`
- `placements[]`

Initial placement types:

- `coin`

Later placement types:

- `enemy`
- `checkpoint`
- `hazard`
- `trigger`

### 6.5 What becomes core first

The first core seed migration should cover:

- Shinobi source sprites
- swamp tileset source
- swamp coin source
- current campaign map
- player character definition
- player animations
 - current level composition

### 6.6 Platforms and coins

Things like:

- one-way platform behavior
- collision semantics
- coin pickup behavior

are not modeled as raw image files.

They belong to one of:

- tileset semantic mappings
- gameplay prefabs
- map placements

This distinction is mandatory. We do **not** conflate visual files with gameplay semantics.

---

## 7. Initial data model

### 7.1 Root folder records

We seed these immutable root folders:

- `core`
- `user`
- `archived`

### 7.2 Initial user tree

We also seed:

- `User/Assets Raw`

No other user folders are created by default.

### 7.3 Asset records

All existing asset entity records remain, but gain:

- `storageRoot`
- `folderId`
- `relativePath`

Raw asset records lose any requirement to carry blob storage state once the migration completes.

### 7.4 Level composition records

We add `LevelComposition` as a DB entity alongside:

- raw assets
- tilesets
- spritesheets
- animations
- characters
- maps

This is the runtime-facing entity that lets campaign scenes be assembled from DB definitions instead of hardcoded arrays in settings.

### 7.5 Folder-aware inspector

The inspector must handle folder selection with:

- folder name
- root
- relative path
- item count
- allowed actions

Folder inspector actions in V1:

- rename folder
- archive folder

Only when allowed by root rules.

### 7.6 Archive semantics in inspector

Archiving from inspector and dragging to `Archived` must call the same store/repository operation.

We do **not** maintain separate code paths with subtly different behavior.

---

## 8. Implementation phases

### Phase 1: real explorer tree

- add folder records to DB
- seed `Core`, `User`, `Archived`, `User/Assets Raw`
- remove virtual type groups from explorer
- render only real folders/assets
- add folder selection
- add new-folder button
- add icon tooltips
- fix back button spacing

### Phase 2: real user filesystem persistence

- add dev server endpoints for folder create / rename / move / archive
- write imported raw PNGs to `editor-assets/user/...`
- store `storageRoot + relativePath` in DB
- add import destination picker
- keep DB and disk in sync
- remove blob-only raw asset persistence from the steady-state model

### Phase 3: archive behavior

- drag asset to `Archived`
- drag folder to `Archived`
- inspector archive uses same code path
- recursive folder archive updates descendants

### Phase 4: core seed catalog

- move shipped core assets into `editor-assets/core`
- populate `Core` from typed seed definitions
- seed raw core assets
- seed derived core assets
- seed current player, coin, map and level-composition definitions
- run bootstrap seeding once before editor/runtime consumption

### Phase 5: runtime migration

- begin replacing hardcoded runtime asset identity with DB-backed core definitions
- load file paths from DB records
- load campaign composition from `LevelComposition`
- keep loading behavior deterministic
- migrate only the currently shipped scene content first

### Phase 6: prefab layer

- introduce gameplay prefabs for things that are not just files
- coin pickup
- spawn points
- hazards
- later enemies

---

## 9. Explicit non-goals for this phase

- restore-from-archive workflow
- arbitrary filesystem reordering
- OS-native menubar
- tablet/mobile editor layout
- freeform gameplay authoring for every runtime concept
- replacing all runtime content loading in one step

---

## 10. Review outcome

After review, the plan is closed enough to implement without further product clarification.

The key decisions that were previously open are now fixed:

- real roots are `Core/User/Archived`
- no virtual type folders
- `Assets Raw` is the default import target
- archive is a move
- moving to `Archived` preserves only the moved subtree
- `Core` files live in `editor-assets/core`
- `Core` is seeded once into DB at bootstrap from typed TS definitions
- runtime reads gameplay definitions from DB
- `LevelComposition` is introduced to model current campaign content cleanly
- editor stays desktop-only with a hard minimum width of `1000px`

## 11. Remaining open items

None within the intended scope of this plan.
