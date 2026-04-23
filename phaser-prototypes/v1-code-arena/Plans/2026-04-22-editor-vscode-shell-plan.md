# Phaser V1 Editor Shell Plan

**Goal:** Replace the current table-style editor shell with a desktop-style asset editor inspired by VS Code, while keeping the runtime and data model grounded in deterministic game concepts that can scale to AI-assisted tooling later.

**Core decision:** We are not cloning VS Code feature-for-feature. We are adopting its structural language:

- a thin top command bar
- a persistent left explorer
- a central work / preview area
- a right inspector
- consistent iconography
- stable folder-based navigation

The result should feel like a serious content tool, not like a temporary form dashboard.

---

## 1. Closed product decisions

### 1.1 No OS-style menubar

- We do **not** reproduce the macOS / app-level menubar inside the editor.
- The editor gets a single in-app top bar only.
- No fake `File/Edit/View/...` row.

### 1.2 One persistent editor shell

- The editor uses a fixed 3-pane layout:
  - left: explorer
  - center: preview / workspace
  - right: inspector
- The shell stays mounted while the selected asset or active workspace changes.
- We do not rebuild the whole editor screen on every navigation event.

### 1.3 Left explorer replaces the current library table

- The current raw/game table is removed as the primary browsing surface.
- Asset browsing moves to a tree explorer in the left pane.
- Search lives inside the explorer.
- Folder expansion / collapse also lives inside the explorer.

### 1.4 Core + User are explorer roots, not tabs

- We do **not** keep the current `raw/game` top tabs for library browsing.
- We do **not** introduce new `core/user` tabs.
- The explorer has exactly two top-level roots:
  - `Core`
  - `User`
- Both roots are collapsible.
- Search filters both roots at once.

### 1.5 Top bar actions are icon-first

The top command bar contains exactly these interactive items for V1:

1. back arrow
2. create character
3. create map

Rules:

- back arrow lives at the far left
- create actions live grouped in the center area
- actions are icon-first buttons with tooltips
- labels are not rendered inline in the bar by default

Tooltip meanings:

- back arrow: `Back to Main Menu`
- character action: `Create Character`
- map action: `Create Map`

### 1.6 Import lives inside the explorer

- The explorer header gets a compact `+` button.
- Clicking `+` opens an import modal.
- V1 import modal only supports importing PNG source assets.
- We keep the current PNG import logic, but move it behind the new explorer action.

### 1.7 Right pane is always the inspector

- The right pane is reserved for asset metadata, dependencies, usage, and context actions.
- Asset-specific configuration belongs here.
- The right pane does **not** become a second generic workspace.

### 1.8 Center pane is preview or workspace

- If the current route is asset selection / inspection, the center pane shows preview.
- If the current route is a specialized editor flow, the center pane shows the dedicated workspace.

Examples:

- raw PNG selected -> center preview
- tileset selected -> center tileset workspace
- spritesheet selected -> center spritesheet workspace
- character selected -> center character workspace
- map selected -> center map workspace

### 1.9 Core is read-only, User is editable

- `Core` assets are shipped with the game/editor and are not renamed, moved, or deleted from inside the editor.
- `User` assets are editable and can be organized in folders.
- Folder creation is allowed only inside `User`.

---

## 2. Target layout contract

## 2.1 Global structure

The editor shell becomes:

```text
+---------------------------------------------------------------+
| Top Bar                                                       |
+----------------------+--------------------------+-------------+
| Explorer             | Center Preview/Workspace | Inspector   |
| - search             |                          |             |
| - import +           |                          |             |
| - Core tree          |                          |             |
| - User tree          |                          |             |
+----------------------+--------------------------+-------------+
```

### 2.2 Pane widths

Desktop target widths:

- explorer: `280px`
- inspector: `340px`
- center: flexible remaining width

Minimum behavior:

- explorer may shrink to `240px`
- inspector may shrink to `300px`
- center always gets the remainder

### 2.3 Top bar layout

The top bar has three zones:

- left zone: back arrow
- center zone: create character / create map
- right zone: empty for V1

We intentionally leave the right side sparse in V1 rather than inventing more actions.

### 2.4 Preview background

- The editor preview background remains visually connected to the rest of the app.
- It should be calmer and flatter than gameplay/menu.
- It must not use animated drifting grids or moving decorative backgrounds.
- The preview background should be static and neutral enough to evaluate assets.

---

## 3. Explorer model

### 3.1 Explorer roots

Exactly two roots:

- `Core`
- `User`

These are logical roots in the editor UI.

### 3.2 Explorer node types

The tree supports:

- folder nodes
- asset nodes

Folder rules:

- folders sort before assets
- folders use standard folder icons
- folders are collapsible

Asset rules:

- assets show icon + name
- assets do not show full metadata inline in the tree
- selected asset row is clearly highlighted

### 3.3 Search behavior

- Search field lives at the top of the explorer pane.
- Search filters the explorer tree by asset or folder name.
- Search applies to both `Core` and `User`.
- Matching assets remain visible with their parent folder chain preserved.
- Non-matching branches are hidden.

### 3.4 Folder behavior

Allowed in `User`:

- create folder
- rename folder
- move assets between folders

Forbidden in `Core`:

- create folder
- rename folder
- move shipped assets from the editor

Folder creation entrypoint:

- the explorer `+` button opens a compact popover menu
- in Phase 1 that menu contains only `Import PNG`
- in Phase 2 that same menu contains:
  - `Import PNG`
  - `New Folder`

We do not introduce a second separate folder-creation button elsewhere.

### 3.5 Sort order

Deterministic sort order:

1. folders
2. assets
3. alphabetical by normalized display name

At the root level:

1. `Core`
2. `User`

---

## 4. Asset typing and icons

### 4.1 We use deterministic built-in SVG icons first

We do **not** depend on downloading an icon pack for the first implementation.

V1 uses internal SVG icons for these types:

- folder
- raw PNG source
- tileset
- spritesheet
- animation
- character
- map

This keeps the editor deterministic and self-contained.

### 4.2 File extensions remain visible in metadata, not as the main identity

- Explorer identity is icon + asset name.
- Exact storage kind / source type lives in inspector metadata.
- We do not emulate a desktop filename column with noisy extensions everywhere.

### 4.3 Status badges stay out of the explorer row by default

- Archived / missing / warning states can still exist.
- The primary place for dependency/status detail is the inspector.
- Explorer rows may add a minimal status dot or tint later if needed, but not large inline badge noise in V1.

---

## 5. Data model and persistence contract

### 5.1 Runtime/editor source of truth

For the editor runtime, the **database remains the primary source of truth**.

Reason:

- it is already the active runtime persistence layer
- it supports fast editor queries
- it avoids forcing filesystem scans on every screen change

### 5.2 Disk is a required mirror, not a second runtime authority

Disk also matters, but to avoid ambiguity:

- DB = runtime/editor source of truth
- disk = deterministic mirror / export / shipped content source

This avoids conflicting edits between two writable authorities.

### 5.3 New asset location metadata

Every asset record must carry location metadata:

- `scope: "core" | "user"`
- `folderPath: string[]`

`folderPath` is relative to the logical root.

Examples:

- `scope=core`, `folderPath=["characters", "shinobi"]`
- `scope=user`, `folderPath=["packs", "forest-kit"]`

### 5.4 Folder records

We introduce folder records as first-class editor entities for `User`.

Minimum folder fields:

- `id`
- `scope`
- `parentFolderId | null`
- `name`
- `createdAt`
- `updatedAt`

`Core` folders do not need to be user-editable records in V1.
They can be bootstrapped from a static manifest.

### 5.5 Core asset bootstrapping

`Core` assets are seeded from a static manifest, not discovered by ad-hoc directory crawling at runtime.

Reason:

- deterministic
- stable across dev and packaged builds
- avoids filesystem API drift in browser mode

Manifest location for V1:

- `src/editor/content/coreAssetManifest.ts`

That manifest owns:

- logical explorer folder path
- scope = `core`
- source file path
- asset kind metadata needed to seed DB records

### 5.6 User asset mirror on disk

Target state:

- user raw PNG imports are mirrored to disk
- derived assets are mirrored to disk as structured JSON

V1 on-disk mirror layout:

```text
content/
  user/
    raw/
      <folder path>/...
    derived/
      tilesets/<folder path>/...
      spritesheets/<folder path>/...
      animations/<folder path>/...
      characters/<folder path>/...
      maps/<folder path>/...
```

Mirrored filenames use normalized asset names plus stable IDs where needed to avoid collisions.

### 5.7 Core on-disk content

Core content stays where shipped assets already live for now.

V1 rule:

- existing shipped asset files are not mass-moved just to satisfy the new shell
- instead, the static core manifest maps them into the explorer tree

This keeps the shell migration separate from a risky content relocation.

---

## 6. Top bar contract

### 6.1 Back action

- A compact left arrow icon button at the far left.
- No visible text label.
- Tooltip only.
- Always returns to main menu.

### 6.2 Create actions

The center of the top bar contains two compact action buttons:

- create character
- create map

Visual rule:

- icon-first buttons
- rounded rectangles
- same chrome family as the rest of the shell

Behavior:

- create character -> opens new character workspace
- create map -> opens new map workspace

### 6.3 No command palette in V1

- No generic omnibox
- No VS Code-style command palette
- No extra command search field in the top bar

The only search in V1 is the explorer asset search.

---

## 7. Center pane contract

### 7.1 Library mode

When the route is plain asset browsing:

- center pane shows preview of selected asset
- if nothing is selected, center pane shows an empty state

Preview rules:

- raw PNG -> image preview
- tileset -> tileset preview
- spritesheet -> frame grid preview
- animation -> animation preview
- character -> character preview
- map -> map preview

### 7.2 Workspace mode

When the route is a specialized editing flow:

- center pane becomes the workspace
- explorer remains visible
- inspector remains visible

We do not open floating windows in V1.

### 7.3 Preview must be large-first

- The preview/workspace gets the largest area of the editor
- It is the primary focus area
- We do not bury preview in a tiny right-hand detail box anymore

---

## 8. Right inspector contract

### 8.1 Inspector tabs stay conceptually the same

The right pane keeps these inspector sections:

- summary
- used by
- dependencies

They may still be represented as tabs or segmented buttons inside the inspector.

### 8.2 Inspector owns asset actions

Actions that operate on the selected asset belong in the inspector.

Examples:

- archive / unarchive
- convert raw PNG into tileset
- convert raw PNG into spritesheet
- create animation from spritesheet

### 8.3 Global create actions do not belong in the inspector

`Create Character` and `Create Map` are top-bar actions because they are global workflows, not actions on one currently selected asset.

---

## 9. Import flow contract

### 9.1 Explorer import entrypoint

- Explorer header has a `+` button.
- Tooltip: `Import`
- Clicking it opens the import modal.

### 9.2 V1 import modal scope

V1 supports:

- import PNG

No multi-type import menu yet.

### 9.3 Import destination

Imported files always enter the `User` root.

Default destination:

- currently selected `User` folder if one is selected
- otherwise `User/Imported`

If `Imported` does not exist, the editor creates it automatically.

### 9.4 Import record creation

On successful import:

- raw asset record is created in DB
- raw file is mirrored to disk
- explorer refreshes
- imported asset becomes selected
- center pane shows its preview
- inspector opens for it

---

## 10. Migration from current editor

### 10.1 Keep what is already good

We keep:

- current repository/store architecture
- current specialized workspaces for tileset / spritesheet / animation / character / map
- current IndexedDB persistence base
- current import PNG logic

### 10.2 Replace what is structurally wrong

We replace:

- current full-width library table as the main browser
- current top-right action button strip
- current “details panel as a side afterthought” layout
- current raw/game top-tab browsing model

### 10.3 Refactor target modules

Likely shell split:

- `EditorTopBar`
- `ExplorerPane`
- `PreviewPane`
- `InspectorPane`
- `ImportModal`

Current modules that should be split/reworked:

- `EditorLayout.ts`
- `AssetLibraryView.ts`
- `AssetDetailsPanel.ts`

### 10.4 Existing workspaces remain routes

Existing route kinds remain valid:

- `library`
- `tileset`
- `spritesheet`
- `animation`
- `character`
- `map`

What changes is the shell around them, not the fact that they are separate workspaces.

---

## 11. Delivery phases

## Phase 1: Shell restructure

Goal:

- replace current header + library table with the new top bar / explorer / center / inspector shell

Includes:

- new editor shell layout
- explorer with `Core` + `User`
- search in explorer
- asset icons
- center preview pane
- right inspector pane
- top bar actions
- import button moved into explorer

Does not yet require:

- folder creation UI
- disk mirror for every derived asset kind

## Phase 2: Foldered user organization

Goal:

- make `User` truly folder-driven

Includes:

- folder records
- create folder
- rename folder
- move assets between folders
- persisted `folderPath`

## Phase 3: Dual persistence cleanup

Goal:

- align DB and disk mirror cleanly

Includes:

- static core manifest
- user raw asset disk mirror
- derived asset JSON mirror
- dev persistence endpoints where needed

## Phase 4: AI-ready content grammar preparation

Goal:

- make the editor shell and data model ready for structured AI workflows later

Includes:

- stable asset scopes
- deterministic asset / folder references
- canonical tileset / spritesheet / character / map entities
- no UI assumptions tied to one-off prototype assets

---

## 12. Acceptance criteria

The editor shell is considered correct for this migration when:

- the left pane is a real explorer tree, not a table
- the explorer shows exactly `Core` and `User`
- the top bar shows only the agreed icon actions
- the main content area is clearly split into preview/workspace center and inspector right
- import happens from the explorer `+`
- `Options`-style chrome inconsistencies are gone and the editor shell feels like one system
- the shell can scale to hundreds of assets without becoming visually noisy

---

## 13. What is intentionally out of scope

Not part of this plan:

- AI generation itself
- boss/editor gameplay authoring logic
- command palette
- detachable windows
- multi-select asset operations
- fancy icon marketplace / downloaded theme packs
- full filesystem-native editor mode outside the existing web/electron path

---

## 14. Closed implementation choices

These choices are already fixed for this plan:

- use a VS Code-like shell vocabulary, not a literal clone
- no fake OS menubar
- `Core` + `User` roots, not tabs
- explorer search filters both roots
- `Core` is read-only
- `User` is editable
- top bar contains only back + create character + create map
- import is a `+` in explorer
- preview/workspace center, inspector right
- DB is runtime source of truth
- disk is deterministic mirror
- static core manifest instead of ad-hoc runtime filesystem scan
- built-in SVG icons first, no external icon dependency required
