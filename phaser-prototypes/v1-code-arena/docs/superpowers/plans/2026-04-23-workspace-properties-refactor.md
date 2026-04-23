# Workspace + Properties Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the editor shell so the center `Workspace` only renders the active asset view, while the right `Properties` panel owns metadata, editable settings, tool options, and actions for every asset type.

**Architecture:** Keep the center surface route-driven and asset-focused. Replace the current right-side `AssetDetailsPanel` with a `PropertiesPanel` shell that renders common sections (`Properties`, `Dependencies`, `Used By`) plus workspace-provided controls, so map and level can later support zoom, pan, and clean editing canvases without inline sidebars inside the `Workspace`.

**Tech Stack:** TypeScript, Vite, Phaser canvas previews, Playwright, localStorage-backed editor state, repo-local i18n locale files.

---

## File Structure

**Create**
- `docs/superpowers/plans/2026-04-23-workspace-properties-refactor.md` - this plan.
- `src/editor/properties/PropertiesPanel.ts` - right-side shell replacing `AssetDetailsPanel`.
- `src/editor/properties/WorkspacePropertiesContributor.ts` - contract that lets a workspace render editor-specific controls into `Properties`.
- `src/editor/workspaces/raw/RawAssetWorkspace.ts` - dedicated workspace for raw PNG assets, including `image-source`.
- `src/editor/workspaces/level/LevelWorkspace.ts` - dedicated workspace shell for `level` assets.

**Modify**
- `src/editor/app/EditorLayout.ts` - rename visible shell concepts to `Explorer`, `Workspace`, `Properties`, wire active workspace properties into the right panel.
- `src/editor/app/EditorRouter.ts` - add `raw-asset` and `level` routes, keep old hash parsing stable.
- `src/editor/domain/editorTypes.ts` - rename detail state to properties state, extend route coverage.
- `src/editor/state/EditorStore.ts` - persist `Properties` tab state and active route for all asset-backed tabs.
- `src/editor/shared/openAssetSelection.ts` - ensure every clickable asset opens a route-backed workspace tab.
- `src/editor/preview/AssetPreviewPane.ts` - reduce to empty-state/fallback role, not a primary asset editor surface.
- `src/editor/library/AssetDetailsPanel.ts` - migrate responsibilities into `PropertiesPanel.ts`, then remove or replace.
- `src/editor/workspaces/tileset/TilesetMappingWorkspace.ts` - keep only atlas/grid interaction in `Workspace`.
- `src/editor/workspaces/spritesheet/SpriteSheetMappingWorkspace.ts` - keep only atlas/grid interaction in `Workspace`.
- `src/editor/workspaces/spritesheet/AnimationEditorPanel.ts` - keep only animation playback and frame timeline in `Workspace`.
- `src/editor/workspaces/character/CharacterEditorView.ts` - keep only character playback in `Workspace`.
- `src/editor/workspaces/map/MapEditorWorkspace.ts` - keep only map canvas in `Workspace`.
- `src/editor/workspaces/map/MapPalettePanel.ts` - remount inside `Properties` instead of inside the center pane.
- `src/editor/styles/editor.css` - rename `detail` UI hooks to `properties`, reclaim width for the center pane.
- `src/app/i18n/locales/en/editor.ts`
- `src/app/i18n/locales/es/editor.ts`
- `src/app/i18n/locales/ca/editor.ts`
- `tests/e2e/editor-shell.spec.ts` - rename selectors and validate the new split.

**Keep As-Is But Reference**
- `src/editor/library/buildGameAssetRows.ts` - current asset inventory source.
- `src/editor/preview/AssetPreviewPane.ts` - current raw/fallback preview behavior to cannibalize.

## Asset Inventory And Property Split

### Shared `Properties` panel structure

For every asset-backed route, the right panel should converge on the same top-level structure:

1. `Header`
   - asset name
   - asset type
   - status badge
2. `Properties` tab
   - `Overview` section: common read-only metadata
   - `Editor` section: editable fields that affect the asset
   - `Tool` section: active tool / playback / viewport settings
   - `Actions` section: save, archive, create-derived-asset, rename
3. `Dependencies` tab
   - current direct references
4. `Used By` tab
   - reverse references

This keeps the right panel stable while the center `Workspace` changes per asset type.

### Folder

**Current state**
- Not route-backed.
- Clicking expands/collapses in `Explorer`.
- Right panel already shows name, root, relative path, item count, allowed actions.

**Workspace target**
- No dedicated tab.
- Keep current active workspace visible.

**Properties target**
- `Overview`: name, root, relative path, item count, system/user/core state.
- `Actions`: rename folder, archive/unarchive folder, create child folder, import PNG when allowed.

### Raw Asset: `image-source`

**Current state**
- No dedicated workspace.
- Falls back to center preview behavior when selected.
- Right panel shows file metadata.

**Workspace target**
- Dedicated `raw-asset` workspace tab.
- Center shows only the PNG preview, with future zoom/pan support.

**Properties target**
- `Overview`: name, original file, dimensions, bytes, source kind, created/updated/archived.
- `References`: dependencies/used-by counts and links.
- `Actions`: archive.

### Raw Asset: `tileset-source`

**Current state**
- Opens `TilesetMappingWorkspace`.
- Center currently mixes numeric fields, actions, summary, and atlas/grid interaction.

**Workspace target**
- Center shows only the source PNG with the interactive tileset grid overlay.
- Grid click/toggle stays in `Workspace` because it edits the asset surface directly.

**Properties target**
- `Overview`: name, original file, dimensions, source kind.
- `Mapping`: cell width, cell height, offset X, offset Y.
- `Selection`: active tile count, overflow warning.
- `Actions`: generate grid, save, archive.

### Raw Asset: `spritesheet-source`

**Current state**
- Opens `SpriteSheetMappingWorkspace`.
- Center mixes numeric mapping fields, summary, actions, and frame grid interaction.

**Workspace target**
- Center shows only the source PNG with the interactive frame grid overlay.
- Grid click/toggle stays in `Workspace`.

**Properties target**
- `Overview`: name, original file, dimensions, source kind.
- `Mapping`: cell width, cell height, offset X, offset Y.
- `Selection`: active frame count, overflow warning.
- `Actions`: generate grid, save, archive.

### Tileset

**Current state**
- Reuses the mapping workspace in read-only mode.
- Center still carries mapping fields that no longer belong to the visual surface.

**Workspace target**
- Center shows the mapped atlas only.
- Later this can add tile hover, highlight, zoom, and selection tools.

**Properties target**
- `Overview`: tile count, source raw asset, cell size, offsets.
- `Actions`: archive, open source raw asset.

### SpriteSheet

**Current state**
- Reuses the mapping workspace in read-only mode.
- Center still carries mapping fields.

**Workspace target**
- Center shows the mapped frame atlas only.
- Later this can add frame hover and zoom.

**Properties target**
- `Overview`: frame count, source raw asset, cell size, offsets.
- `Actions`: create animation, archive, open source raw asset.

### Animation

**Current state**
- Center mixes the animation preview, name, frame duration, loop, playback buttons, save action, and the frame strip.

**Workspace target**
- Center shows the animation playback preview plus the frame strip/timeline.
- Keep the frame strip in `Workspace` because picking frames is direct asset editing, not passive metadata.

**Properties target**
- `Overview`: name, source spritesheet, frame count.
- `Playback`: frame duration, loop, play/pause.
- `Actions`: save, archive.

### Character

**Current state**
- Center mixes playback preview, slot selectors, facing selector, preview-slot tabs, play/pause, and save.

**Workspace target**
- Center shows only the animated character preview.
- Optional later overlay: camera fit, pivot guides, onion skin, zoom.

**Properties target**
- `Overview`: name, linked animation count.
- `Animation Slots`: idle, run-side, run-side facing, jump, attack.
- `Preview`: selected preview slot, play/pause.
- `Actions`: save, archive.

### Map

**Current state**
- Center still contains map name, dimensions, tile size, fit mode, tool buttons, save button, and the tile palette below the canvas.

**Workspace target**
- Center shows only the map canvas.
- This is the asset type that benefits most from the refactor because it needs room for pan, zoom, brush overlays, and future selection tools.

**Properties target**
- `Overview`: name, grid size, tile size, fit mode.
- `Tool`: active tool (`paint`, `erase`, `collision`).
- `Palette`: tileset selector plus tile picker grid.
- `Viewport`: zoom level, reset camera, future snap/grid toggles.
- `Actions`: save, archive.

### Level

**Current state**
- No dedicated workspace route exists.
- Level currently behaves like metadata + preview, not like an editor.

**Workspace target**
- Dedicated `level` workspace tab.
- Center shows only the level canvas / map composite.
- Must be prepared for zoom/pan exactly like `map`.

**Properties target**
- `Overview`: name, linked map, linked player, spawn point.
- `Layout`: ground segments, floating platforms, water strips.
- `Placements`: pickups now, enemies/bosses later.
- `Viewport`: zoom level, reset camera.
- `Actions`: save, archive.

## Implementation Phases

### Task 1: Rename The Shell To `Workspace` + `Properties`

**Files:**
- Modify: `src/editor/domain/editorTypes.ts`
- Modify: `src/editor/app/EditorLayout.ts`
- Modify: `src/editor/styles/editor.css`
- Modify: `src/app/i18n/locales/en/editor.ts`
- Modify: `src/app/i18n/locales/es/editor.ts`
- Modify: `src/app/i18n/locales/ca/editor.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Rename the right-panel state from detail to properties**

```ts
export type PropertiesTab = "properties" | "used-by" | "dependencies";

export interface EditorState {
  propertiesTab: PropertiesTab;
}
```

- [ ] **Step 2: Rename layout hooks and visible labels**

```ts
type PaneSide = "explorer" | "properties";
this.propertiesSlot.dataset.testid = "editor-properties-pane";
```

- [ ] **Step 3: Update CSS names without changing behavior yet**

```css
.editor-properties-panel { ... }
.properties-tabbar { ... }
.properties-tab-body { ... }
```

- [ ] **Step 4: Update locale copy**

```ts
shell: {
  workspace: "Workspace",
  properties: "Properties",
}
```

- [ ] **Step 5: Run shell regression checks**

Run: `npm run build`
Expected: build passes with renamed types/selectors.

Run: `npm run test:e2e`
Expected: existing shell tests pass after selector updates.

### Task 2: Introduce A Reusable `PropertiesPanel` Contract

**Files:**
- Create: `src/editor/properties/WorkspacePropertiesContributor.ts`
- Create: `src/editor/properties/PropertiesPanel.ts`
- Modify: `src/editor/app/EditorLayout.ts`
- Modify: `src/editor/library/AssetDetailsPanel.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Define the workspace-to-properties contract**

```ts
export interface WorkspacePropertiesContributor {
  renderProperties(container: HTMLElement): void;
  clearProperties?(): void;
}
```

- [ ] **Step 2: Create the new panel shell**

```ts
export class PropertiesPanel {
  update(state: EditorState, contributor: WorkspacePropertiesContributor | null): void {
    // render header, tabs, common metadata, contributor section, dependencies, used-by
  }
}
```

- [ ] **Step 3: Move common metadata/dependency rendering out of `AssetDetailsPanel`**

```ts
function renderCommonProperties(asset: EditorEntityRecord, state: EditorState): HTMLElement {
  // timestamps, counts, archive status, raw file info
}
```

- [ ] **Step 4: Wire the active workspace into the new panel**

```ts
const contributor = isWorkspacePropertiesContributor(this.screen) ? this.screen : null;
this.propertiesPanel.update(state, contributor);
```

- [ ] **Step 5: Verify the right panel still shows metadata + dependencies**

Run: `npm run test:e2e -- --grep "dependencies|used by|workspace"`
Expected: the active asset still exposes reverse references and dependencies in the new shell.

### Task 3: Route Every Asset That Should Open In A Tab

**Files:**
- Create: `src/editor/workspaces/raw/RawAssetWorkspace.ts`
- Create: `src/editor/workspaces/level/LevelWorkspace.ts`
- Modify: `src/editor/domain/editorTypes.ts`
- Modify: `src/editor/app/EditorRouter.ts`
- Modify: `src/editor/state/EditorStore.ts`
- Modify: `src/editor/shared/openAssetSelection.ts`
- Modify: `src/editor/app/EditorLayout.ts`
- Modify: `src/editor/preview/AssetPreviewPane.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Add route coverage for `raw-asset` and `level`**

```ts
export type EditorRoute =
  | { kind: "raw-asset"; id: string }
  | { kind: "tileset"; id: string }
  | { kind: "spritesheet"; id: string }
  | { kind: "animation"; id: string }
  | { kind: "character"; id: string }
  | { kind: "map"; id: string }
  | { kind: "level"; id: string };
```

- [ ] **Step 2: Open raw assets and levels directly from `Explorer`**

```ts
if (isRawAsset(asset)) {
  store.navigate({ kind: "raw-asset", id: asset.id });
}
if (isLevelComposition(asset)) {
  store.navigate({ kind: "level", id: asset.id });
}
```

- [ ] **Step 3: Create the raw-asset workspace**

```ts
export class RawAssetWorkspace implements ScreenController, WorkspacePropertiesContributor {
  // render only the PNG in the center pane
}
```

- [ ] **Step 4: Create the minimal level workspace shell**

```ts
export class LevelWorkspace implements ScreenController, WorkspacePropertiesContributor {
  // render level canvas placeholder first; no inline sidebar
}
```

- [ ] **Step 5: Add a Playwright regression for raw PNG + level tabs**

```ts
test("raw assets and levels open in route-backed tabs", async ({ page }) => {
  // open raw asset tab, open level tab, verify both appear in Workspace tab bar
});
```

Run: `npm run test:e2e`
Expected: no asset click falls back to the old center preview-only flow.

### Task 4: Move Mapping Controls Out Of Tileset And SpriteSheet Workspaces

**Files:**
- Modify: `src/editor/workspaces/tileset/TilesetMappingWorkspace.ts`
- Modify: `src/editor/workspaces/spritesheet/SpriteSheetMappingWorkspace.ts`
- Modify: `src/editor/properties/PropertiesPanel.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Make both mapping workspaces implement the properties contributor**

```ts
class TilesetMappingWorkspace implements ScreenController, WorkspacePropertiesContributor {}
class SpriteSheetMappingWorkspace implements ScreenController, WorkspacePropertiesContributor {}
```

- [ ] **Step 2: Keep only the atlas/grid interaction in the center pane**

```ts
this.body.replaceChildren(this.previewCard);
```

- [ ] **Step 3: Render mapping fields in the right panel**

```ts
renderProperties(container: HTMLElement): void {
  container.append(
    this.nameField.field,
    this.cellWidthField.field,
    this.cellHeightField.field,
    this.offsetXField.field,
    this.offsetYField.field,
    this.summary,
    this.actionRow,
  );
}
```

- [ ] **Step 4: Keep source/overflow metadata in common `Properties`**

```ts
append(propertiesList, "Source", this.sourceRawAsset?.name ?? "Missing");
append(propertiesList, "Overflow", this.hasOverflow ? "Ignored remainder" : "None");
```

- [ ] **Step 5: Verify no numeric mapping fields remain in the center pane**

Run: `npm run test:e2e -- --grep "map|sprite|tile"`
Expected: the workspace only shows the atlas/grid surface; the inputs live in `Properties`.

### Task 5: Move Animation And Character Settings Into `Properties`

**Files:**
- Modify: `src/editor/workspaces/spritesheet/AnimationEditorPanel.ts`
- Modify: `src/editor/workspaces/character/CharacterEditorView.ts`
- Modify: `src/editor/properties/PropertiesPanel.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Keep only the animation surface in the center pane**

```ts
// Animation
this.body.replaceChildren(this.previewCard);
this.previewCard.append(this.previewHost, this.frameStrip);
```

- [ ] **Step 2: Render animation settings in `Properties`**

```ts
renderProperties(container: HTMLElement): void {
  container.append(
    this.nameField.field,
    this.frameDurationField.field,
    this.loopField.field,
    this.playbackRow,
    this.saveButton,
  );
}
```

- [ ] **Step 3: Keep only the character playback preview in the center pane**

```ts
// Character
this.body.replaceChildren(this.previewCard);
this.previewCard.append(this.previewHost);
```

- [ ] **Step 4: Render character slot selectors and preview controls in `Properties`**

```ts
renderProperties(container: HTMLElement): void {
  container.append(
    this.nameField.field,
    this.idleField.field,
    this.runSideField.field,
    this.facingField.field,
    this.jumpField.field,
    this.attackField.field,
    this.previewButtons,
    this.playbackButtons,
    this.saveButton,
  );
}
```

- [ ] **Step 5: Verify the workspace stays visually clean**

Run: `npm run test:e2e -- --grep "animation|character"`
Expected: animation and character tabs show the asset preview centered, with controls moved to `Properties`.

### Task 6: Move Map Editing Controls And Palette Into `Properties`

**Files:**
- Modify: `src/editor/workspaces/map/MapEditorWorkspace.ts`
- Modify: `src/editor/workspaces/map/MapPalettePanel.ts`
- Modify: `src/editor/properties/PropertiesPanel.ts`
- Modify: `src/editor/styles/editor.css`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Reduce the map workspace to canvas only**

```ts
this.topRow.replaceChildren(this.previewCard);
this.body.replaceChildren(this.previewCard);
```

- [ ] **Step 2: Move map fields, tools, and actions into `Properties`**

```ts
renderProperties(container: HTMLElement): void {
  container.append(
    this.fields,
    this.toolBar,
    this.actions,
  );
}
```

- [ ] **Step 3: Mount the tile palette inside a dedicated `Properties` section**

```ts
const paletteSection = createElement("section", "properties-section properties-section-palette");
paletteSection.append(this.paletteHost);
container.append(paletteSection);
```

- [ ] **Step 4: Add a `Viewport` section for future zoom/pan**

```ts
const viewportSection = createElement("section", "properties-section");
viewportSection.append(createElement("p", "properties-note", "Zoom and camera controls land here."));
```

- [ ] **Step 5: Verify the center pane no longer carries form fields or tiles**

Run: `npm run test:e2e -- --grep "map workspace"`
Expected: the center pane contains only the map canvas; tile selection and tool state are fully in `Properties`.

### Task 7: Add The First Real `LevelWorkspace`

**Files:**
- Modify: `src/editor/workspaces/level/LevelWorkspace.ts`
- Modify: `src/editor/app/EditorLayout.ts`
- Modify: `src/editor/properties/PropertiesPanel.ts`
- Modify: `src/editor/shared/openAssetSelection.ts`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Render the level surface in the center**

```ts
this.previewHost.dataset.testid = "level-workspace-canvas";
// initial render can reuse linked map preview until full level tooling exists
```

- [ ] **Step 2: Populate level properties from the current definition**

```ts
container.append(
  buildKeyValue("Map", this.level.mapId),
  buildKeyValue("Player", this.level.playerCharacterId),
  buildKeyValue("Spawn", `${this.level.spawnX}, ${this.level.spawnY}`),
  buildKeyValue("Pickups", `${this.level.placements.length}`),
);
```

- [ ] **Step 3: Reserve sections for future enemy/boss/tooling**

```ts
container.append(createSectionNote("Placements", "Pickups now; enemies and bosses later."));
```

- [ ] **Step 4: Add the level route to asset selection and tabs**

```ts
if (isLevelComposition(asset)) {
  store.navigate({ kind: "level", id: asset.id });
}
```

- [ ] **Step 5: Verify level now behaves like map, not like metadata**

Run: `npm run test:e2e -- --grep "level"`
Expected: opening a level creates a workspace tab with a clean center surface plus right-side `Properties`.

### Task 8: Final Cleanup And Regression Pass

**Files:**
- Modify: `src/editor/preview/AssetPreviewPane.ts`
- Modify: `src/editor/library/AssetDetailsPanel.ts`
- Modify: `src/editor/styles/editor.css`
- Test: `tests/e2e/editor-shell.spec.ts`

- [ ] **Step 1: Limit `AssetPreviewPane` to empty/fallback behavior**

```ts
if (!asset) {
  return renderEmptyWorkspace();
}
```

- [ ] **Step 2: Delete or replace the old details-panel implementation**

```ts
export { PropertiesPanel as AssetDetailsPanel };
```

- [ ] **Step 3: Remove obsolete `detail-*` CSS hooks**

```css
/* delete legacy selectors after PropertiesPanel is live */
```

- [ ] **Step 4: Add one screenshot-oriented Playwright smoke test**

```ts
test("map workspace stays clean while controls live in Properties", async ({ page }) => {
  // open map, assert no width/height inputs exist in center pane
});
```

- [ ] **Step 5: Run the full verification pass**

Run: `npm run build`
Expected: build passes.

Run: `npm run test:e2e`
Expected: all editor shell tests pass with the new `Workspace + Properties` split.

## Self-Review

**Spec coverage**
- `Workspace` naming: covered in Task 1.
- `Properties` naming: covered in Task 1.
- Asset-by-asset review: covered in the inventory section and Tasks 3-7.
- Map and level need maximum center space: covered in Tasks 6-7.
- PNG/raw preview in the center: covered in Task 3.
- Move current inline fields out of workspaces: covered in Tasks 4-6.

**Placeholder scan**
- No `TODO`, `TBD`, or "implement later" placeholders remain in task steps.
- Future-facing sections (`Viewport`, enemies/bosses) are described as explicit reserved UI sections, not hand-waved.

**Type consistency**
- Visible panel name: `Properties`
- Shared state name: `propertiesTab`
- Shared shell class: `PropertiesPanel`
- Raw asset route: `raw-asset`
- Level route: `level`

Plan complete and saved to `docs/superpowers/plans/2026-04-23-workspace-properties-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
