# Phaser V1 React + Phaser App Shell Plan

**Goal:** Convert `v1-code-arena` from a standalone Phaser page into a single desktop-style app shell where React owns menus, overlays, options, editor panels, and navigation state, while Phaser stays mounted underneath as the live animated viewport and gameplay runtime.

**Core decision:** We will use a **single app entrypoint** and a **hybrid UI model**:

- React owns app shell, routing state, menu DOM, pause overlays, options, and editor panels.
- Phaser owns intro animation, animated menu background, campaign gameplay, and editor preview viewport.
- React and Phaser may render at the same time.
- Phaser stays mounted under the DOM layer instead of being created only when a level starts.

**Result we want:** The app feels like one integrated game/tool, not like “a web app plus a separate game”.

---

## 1. Architecture decisions

### 1.1 Single shell

- `index.html` becomes the only real user-facing entrypoint for the integrated app flow.
- The current separate `editor.html` stops being part of the target user flow.
- The editor will be migrated aggressively into the integrated shell instead of being wrapped as a legacy island.
- `editor.html` may exist only as a temporary development artifact during the migration, but it is not part of the intended architecture.

### 1.2 Always-on Phaser viewport

- Phaser is mounted once inside a fixed `GameViewport` container.
- React mounts once inside a fixed `AppShell` container.
- Both are siblings in the same DOM tree.
- React overlays can cover none, part, or all of the Phaser viewport depending on state.
- A single long-lived `Phaser.Game` instance is created for the integrated app.
- `IntroScene`, `MenuBackgroundScene`, `CampaignScene`, and editor preview scenes all live inside that same runtime.
- The editor must migrate away from creating isolated `Phaser.Game` instances per workspace as the integrated shell becomes the real entrypoint.

### 1.3 React is not a fallback

- React is not being used as a temporary patch.
- React is the intended long-term layer for:
  - main menu controls
  - options
  - language selection
  - pause menu
  - editor shell
  - future settings / modal / inventory-style full-screen panels

### 1.4 Phaser remains the runtime

- Phaser remains responsible for:
  - startup intro animation
  - animated menu background
  - campaign runtime
  - camera motion
  - world rendering
  - audio timing
  - future editor preview / scene preview

### 1.5 Typed React <-> Phaser bridge

- React and Phaser communicate through a typed bridge based on explicit commands and events.
- We do not use a loose stringly-typed event bus as the primary contract.
- We do not use a shared UI-state store as the main gameplay/runtime bridge.
- The bridge must define:
  - commands React can send to Phaser
  - events Phaser can emit upward to React
  - a small typed payload contract for each interaction

### 1.6 Central audio ownership

- Audio is owned by a central `AudioService` in the game/runtime layer.
- React and Phaser do not orchestrate music independently.
- Audio requests flow through stable audio IDs and typed service calls.
- V1 keeps only one active music track at a time.
- If pause audio treatment is added in V1, it should be a light ducking or no change, not a track swap.

### 1.7 One-way navigation contract

- `Main Menu -> Campaign`
- `Main Menu -> Editor`
- `Campaign -> Pause Menu -> Main Menu`
- `Editor -> Main Menu`

Forbidden direct transitions in V1:

- `Campaign -> Editor`
- `Editor -> Campaign`

All returns go through the main menu.

---

## 2. Target app states

The app state machine for V1 is closed to these states:

- `boot`
- `intro`
- `main_menu`
- `options`
- `campaign`
- `campaign_pause`
- `editor`

State meanings:

- `boot`: preload shared assets, settings, i18n resources, and create the shell.
- `intro`: very short Phaser-only opening animation.
- `main_menu`: Phaser animated background + React menu/options overlay.
- `options`: dedicated React options screen.
- `campaign`: full gameplay view; menu UI hidden.
- `campaign_pause`: campaign is paused; React pause overlay shown over Phaser.
- `editor`: React editor layout shown; Phaser used as preview viewport.

---

## 3. DOM and canvas layering contract

The viewport contract is:

- the browser window is filled by the app
- no “article page” layout around the game
- no extra instructional labels outside the integrated shell
- Phaser occupies the full available viewport area
- React overlays sit above Phaser using z-order

Recommended structure:

```text
<body>
  <div id="app-root">
    <div id="game-root"></div>
    <div id="ui-root"></div>
  </div>
</body>
```

Layering rules:

- `#game-root`: full viewport, lowest layer
- `#ui-root`: full viewport, upper layer
- React components may use transparent backgrounds so Phaser remains visible below
- Full-screen panels may temporarily cover Phaser almost entirely

This means all of these are valid:

- menu buttons over animated Phaser background
- pause menu over frozen gameplay
- editor side panels over a live Phaser preview

---

## 4. Intro contract

V1 intro is intentionally tiny and deterministic.

### 4.1 Timing

Total duration: `800 ms`

Closed sequence:

1. start black
2. fade black -> white
3. fade white -> black
4. enter `main_menu`

### 4.2 Ownership

- The intro animation is rendered in Phaser, not in React.
- React shell is already mounted, but no menu panel is visible yet.
- The intro is replaceable later with studio logo, engine logo, or a real splash sequence.

### 4.3 V1 simplification

- No skip button
- No audio cue required yet
- No multiple logo chain yet

---

## 5. Main menu contract

### 5.1 Ownership split

- Phaser renders the animated background.
- React renders the menu controls.

### 5.2 Animated menu background

The background scene should reuse the game art direction so the menu already feels like the game.

This will be a **dedicated scene**, not a restricted reuse of the real campaign level scene.

V1 target:

- Show the current swamp environment or a close variant of it.
- Show the player character in `idle`.
- Camera starts framed on the character.
- Character should occupy approximately `30%` of viewport height on first frame.
- Camera performs a subtle ambient motion only.

Closed V1 motion rules:

- no user control
- no gameplay collisions required
- no enemies
- no collectibles
- no HUD
- just a quiet animated background scene

### 5.3 Main menu options

Visible menu entries in this exact order:

1. `Campaign`
2. `Editor`
3. `Online`
4. `Options`

Rules:

- `Campaign`: active
- `Editor`: active
- `Online`: disabled, visibly greyed out, non-interactive
- `Options`: active

### 5.4 Language of authored strings

- The source language is English.
- All user-facing text must be authored through translation keys.
- No hardcoded Spanish text remains in the integrated app shell.

---

## 6. Campaign contract

### 6.1 Entry

- Clicking `Campaign` from the main menu loads the current playable first level.
- Main menu overlay disappears.
- Phaser takes the full visible experience.

### 6.2 Pause menu

Pressing `Escape` during campaign:

- pauses campaign simulation via `scene.pause()`
- opens a React pause menu overlay above Phaser

Pause menu options for V1:

- `Resume`
- `Go to Main Menu`

Rules:

- `Resume` closes the overlay and unpauses gameplay.
- `Go to Main Menu` closes the pause menu, tears down or resets campaign scene state, and returns to `main_menu`.
- `Escape` while pause menu is open acts as `Resume`.
- Returning from `campaign` to `main_menu` performs a full campaign reset for V1.
- Entering `campaign` again from `main_menu` always starts the level from the beginning.

### 6.3 V1 non-goals

- No save/load flow
- No restart level button
- No settings inside pause menu yet

---

## 7. Editor contract

### 7.1 Entry

- Clicking `Editor` from the main menu enters the editor state.
- Main menu UI disappears completely.
- The editor takes the full app viewport.

### 7.2 Ownership split

- React owns editor layout, panels, tabs, tools, lists, and controls.
- Phaser owns the editor preview viewport.
- The current `src/editor/**` stack is not meant to survive as a separately routed subsystem.
- The target is to absorb its modules into the integrated shell architecture instead of preserving a wrapped legacy editor surface.
- The migration path is aggressive:
  - keep editor domain modules
  - keep editor storage modules
  - keep editor workspace modules
  - replace editor entrypoint
  - replace editor router
  - replace editor layout
  - adapt editor store integration as part of the migration instead of leaving a legacy shell in place

### 7.3 Exit

- Editor must always provide a visible action to return to `Main Menu`.
- Returning to main menu hides all editor chrome and restores menu background state.

### 7.4 V1 navigation rule

- Editor never opens campaign directly.
- Campaign never opens editor directly.

---

## 8. Internationalization contract

### 8.1 Locales

V1 supported locales are closed to:

- `en`
- `es`
- `ca`

Display labels:

- `English`
- `Español`
- `Català`

### 8.2 Initial implementation choice

V1 will use:

- `i18next`
- `react-i18next`
- TypeScript locale resources
- one shared namespaced translation catalog for both React and Phaser

V1 will **not** use `.po` files directly as the runtime source of truth.

Reason:

- React + i18next is a very standard fit for this hybrid architecture.
- JSON/TS resources are simpler for app boot, typing, bundling, and shared usage between React and Phaser.
- If gettext/PO workflow is needed later, conversion/export can be added on top.

### 8.3 Translation ownership

- React UI strings come from the i18n layer.
- Phaser scenes must resolve text through the same translation service via a dedicated translation helper / bridge.
- Phaser scenes should not import i18n libraries directly all over the codebase.
- No visible user-facing string should bypass i18n.
- Translation keys are shared across React and Phaser instead of duplicated in separate catalogs.

### 8.4 Translation catalog shape

V1 uses one shared catalog organized by namespaces or domain-prefixed keys.

Recommended examples:

- `menu.campaign`
- `menu.editor`
- `menu.online`
- `menu.options`
- `options.language.title`
- `options.language.en`
- `options.language.es`
- `options.language.ca`
- `pause.resume`
- `pause.go_to_main_menu`
- `campaign.ui.coins`

This keeps one source of truth while still preventing the catalog from turning into a flat string dump.

### 8.5 Phaser language-change behavior

- React UI updates reactively when the locale changes.
- Phaser shell scenes use controlled re-entry / rebuild on language change instead of fine-grained live text subscription.
- Campaign does not support mid-session language switching in V1.
- To play in a different language, the user returns to `Main Menu`, changes language in `Options`, and then enters the target mode again.

### 8.6 Options panel scope in V1

The only V1 options setting is:

- language selector

No audio/video/gameplay settings yet.

### 8.7 Language persistence choice

- Language preference is persisted in `localStorage`.
- Editor assets and editor project data continue to live in IndexedDB.
- We intentionally use both storage systems because they solve different problems:
  - `localStorage` for tiny synchronous boot-time preferences
  - IndexedDB for structured local editor/game data

---

## 9. HUD ownership rule

V1 keeps this split:

- gameplay-critical HUD stays in Phaser
- app-style overlays stay in React

For the current prototype:

- the old text labels around the embedded canvas should disappear
- campaign moment-to-moment UI should be owned by Phaser if it is part of gameplay
- pause menu, options, and editor controls should be React

This means:

- no static DOM page chrome around the gameplay viewport
- no mismatch between “web page shell” and “game runtime”

---

## 10. Suggested code structure

Target shape after migration:

```text
src/
  app/
    main.tsx
    AppShell.tsx
    routing/
      appState.ts
      AppRouter.tsx
    screens/
      MainMenuScreen.tsx
      OptionsScreen.tsx
      PauseMenuScreen.tsx
      EditorScreen.tsx
    i18n/
      i18n.ts
      locales/
        en/
          menu.ts
          options.ts
          pause.ts
          campaign.ts
        es/
          menu.ts
          options.ts
          pause.ts
          campaign.ts
        ca/
          menu.ts
          options.ts
          pause.ts
          campaign.ts
  bridge/
    GameBridge.ts
    bridgeCommands.ts
    bridgeEvents.ts
  game/
    main.ts
    audio/
      AudioService.ts
    shell/
      PhaserHost.ts
    scenes/
      BootScene.ts
      IntroScene.ts
      MenuBackgroundScene.ts
      CampaignScene.ts
      EditorPreviewScene.ts
```

Notes:

- `src/main.ts` should eventually become the React bootstrap.
- React mounts the shell.
- Phaser mounts inside a React-owned host component.
- Existing `src/game/**` modules should be reused where possible instead of rewritten from zero.
- Editor preview scenes reuse the same long-lived `Phaser.Game` instead of spinning up isolated preview runtimes per workspace.
- `AudioService` lives under `src/game/audio/` and stays owned by the runtime layer; the bridge calls into runtime services instead of re-exporting audio control from `src/bridge/`.
- Locale catalogs stay split by domain per locale so React and Phaser share keys but edits remain localized by feature.

---

## 11. Scene and UI responsibilities

### 11.1 Phaser scenes

Planned V1 scenes:

- `BootScene`
  - preload shared assets
  - preload common audio and register audio IDs
  - hand off to intro

- `IntroScene`
  - run the `800 ms` black/white/black animation
  - signal app shell to enter `main_menu`

- `MenuBackgroundScene`
  - animate swamp background
  - player idle
  - gentle camera drift or zoom

- `CampaignScene`
  - new scene boundary for campaign runtime
  - reuses current lower-level gameplay modules where possible
  - pause/resume integration

- `EditorPreviewScene`
  - integrated editor viewport scene inside the shared runtime
  - replaces isolated per-workspace Phaser preview lifecycles over time
  - remains persistent while the editor is open and swaps preview mode internally instead of hopping across many small editor scenes

### 11.2 React screens

- `MainMenuScreen`
  - campaign/editor/online/options buttons
  - online disabled styling

- `OptionsScreen`
  - locale selector only
  - dedicated screen, not an inline panel over the main menu

- `PauseMenuScreen`
  - resume / go to main menu

- `EditorScreen`
  - wraps current and future editor modules
  - includes return-to-menu action

---

## 12. Navigation bridge contract

We use a thin, explicit, typed bridge between React and Phaser.

Closed V1 rules:

- React is the source of truth for high-level app state.
- Phaser reacts to app-state changes.
- Phaser can emit requests upward, but does not own app routing.
- Bridge interactions are typed commands and typed events, not loose string messages.

Examples:

- React sets app state to `campaign` -> bridge tells Phaser to activate `CampaignScene`
- React sets app state to `main_menu` -> bridge tells Phaser to activate `MenuBackgroundScene`
- Phaser detects `Escape` during campaign -> bridge requests `campaign_pause`
- React confirms `Go to Main Menu` -> bridge returns Phaser to menu background

This avoids having both React and Phaser trying to route independently.

Suggested contract shape:

- React -> Phaser commands:
  - `showIntro`
  - `showMainMenu`
  - `startCampaign`
  - `resumeCampaign`
  - `returnToMainMenu`
  - `showEditor`
  - `setLocale`
  - `setPauseOverlayVisible`
  - `setEditorPreviewState`
- Phaser -> React events:
  - `introCompleted`
  - `campaignPauseRequested`
  - `mainMenuRequested`
  - `editorExitRequested`

These names are closed for V1 and should be used consistently in code.

---

## 13. Audio contract

### 13.1 Ownership

- A central `AudioService` owns music and sound playback policy.
- Scenes and React screens request audio through IDs instead of each subsystem managing playback ad hoc.
- Audio IDs should be stable and domain-oriented, for example:
  - `music.intro`
  - `music.menu`
  - `music.campaign`
  - `ui.click`
  - `ui.back`

### 13.2 V1 policy

- Only one music track is active at a time.
- Entering `main_menu` starts or keeps menu music.
- Entering `campaign` swaps to campaign music if campaign music exists in V1.
- Entering `campaign_pause` does not swap tracks.
- Pause applies a light ducking step instead of swapping tracks.

### 13.3 Non-goals for V1

- no per-scene custom audio orchestration
- no React-owned audio playback
- no multi-layer adaptive music system yet

---

## 14. Migration strategy

### Phase 1

- Add React to the project.
- Replace current static `index.html` page shell with a React root and full-viewport layout.
- Keep current playable level accessible inside the new shell.

### Phase 2

- Mount Phaser once under React.
- Add app state store and bridge.
- Remove old page-style labels and centered embedded-shell look.

### Phase 3

- Add `IntroScene`
- Add `MenuBackgroundScene`
- Add React main menu overlay

### Phase 4

- Add dedicated options screen with language selector
- Add i18n for all visible strings in React and Phaser

### Phase 5

- Add pause menu flow for campaign
- Add integrated editor entry

### Phase 6

- Keep iterating without automated React tests for now.
- Do not add a React test harness in this migration phase.
- Revisit testing only after the integrated shell direction is validated and we decide the structure is stable enough to keep.

---

## 15. Deterministic V1 acceptance criteria

V1 is correct only if all of the following are true:

- app opens in a full-viewport shell
- intro plays for `800 ms`
- intro transitions automatically into main menu
- main menu uses Phaser animated background
- React menu overlays appear above Phaser
- `Options` opens a dedicated screen and can return cleanly to `Main Menu`
- `Campaign` enters gameplay
- `Escape` pauses campaign and shows React pause menu
- `Resume` returns to gameplay
- `Go to Main Menu` returns to menu
- re-entering `Campaign` from `Main Menu` starts from the beginning again
- `Editor` opens a full-viewport editor state
- editor has a clear return-to-main-menu action
- `Online` is visible but disabled
- options panel contains `English`, `Español`, `Català`
- all visible user strings go through i18n keys
- React and Phaser share one namespaced translation catalog
- app uses one long-lived `Phaser.Game`
- React and Phaser communicate through a typed bridge
- no direct `Campaign -> Editor` or `Editor -> Campaign` path exists

---

## 16. Remaining open points after this draft

The plan is now architecturally closed for V1.

Any remaining adjustments should be implementation refinements only and must not change:

- the single long-lived `Phaser.Game`
- the typed command/event bridge
- the central `AudioService`
- the single persistent `EditorPreviewScene`
- the namespaced shared i18n catalog
