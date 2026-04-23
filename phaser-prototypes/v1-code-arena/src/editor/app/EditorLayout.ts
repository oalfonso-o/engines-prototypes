import type { WorkspaceRoute } from "../domain/editorTypes";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { ExplorerPane } from "../explorer/ExplorerPane";
import { AssetPreviewPane } from "../preview/AssetPreviewPane";
import { PropertiesPanel } from "../properties/PropertiesPanel";
import { isWorkspacePropertiesContributor } from "../properties/WorkspacePropertiesContributor";
import { TilesetMappingWorkspace } from "../workspaces/tileset/TilesetMappingWorkspace";
import { SpriteSheetMappingWorkspace } from "../workspaces/spritesheet/SpriteSheetMappingWorkspace";
import { AnimationEditorPanel } from "../workspaces/spritesheet/AnimationEditorPanel";
import { CharacterEditorView } from "../workspaces/character/CharacterEditorView";
import { MapEditorWorkspace } from "../workspaces/map/MapEditorWorkspace";
import { RawAssetWorkspace } from "../workspaces/raw/RawAssetWorkspace";
import { LevelWorkspace } from "../workspaces/level/LevelWorkspace";
import { ActionWorkspace } from "../workspaces/action/ActionWorkspace";
import { GameWorkspace } from "../workspaces/game/GameWorkspace";
import { SceneWorkspace } from "../workspaces/scene/SceneWorkspace";
import type { EditorTranslator } from "../i18n/EditorTranslator";
import { createIcon } from "../shared/icons";

interface ScreenController {
  destroy(): void;
  update?(): void;
}

export interface EditorLayoutOptions {
  translator: EditorTranslator;
  onReturnToMainMenu?: () => void;
}

type PaneSide = "explorer" | "properties";

interface EditorPaneLayoutState {
  explorerWidth: number;
  inspectorWidth: number;
  explorerCollapsed: boolean;
  inspectorCollapsed: boolean;
}

interface AppliedPaneWidths {
  explorer: number;
  inspector: number;
}

const EXPLORER_MIN_WIDTH = 220;
const EXPLORER_MAX_WIDTH = 420;
const EXPLORER_DEFAULT_WIDTH = 280;
const INSPECTOR_MIN_WIDTH = 280;
const INSPECTOR_MAX_WIDTH = 420;
const INSPECTOR_DEFAULT_WIDTH = 340;
const PANE_DIVIDER_WIDTH = 22;
const MIN_CENTER_WIDTH = 420;
const LAYOUT_STORAGE_KEY = "canuter:phaser-v1-code-arena:editor-layout:v1";

export class EditorLayout {
  private readonly shell = createElement("div", "editor-shell");
  private readonly topBar = createElement("header", "editor-topbar");
  private readonly topBarLeft = createElement("div", "editor-topbar-left");
  private readonly topBarCenter = createElement("div", "editor-topbar-center");
  private readonly topBarRight = createElement("div", "editor-topbar-right");
  private readonly main = createElement("main", "editor-main");
  private readonly explorerSlot = createElement("div", "editor-pane-slot editor-pane-slot-explorer");
  private readonly explorerDivider = createElement("div", "editor-pane-divider");
  private readonly centerSlot = createElement("div", "editor-pane-slot editor-pane-slot-center");
  private readonly workspaceShell = createElement("div", "editor-workspace-shell");
  private readonly workspaceTabBar = createElement("div", "workspace-tabbar");
  private readonly workspaceContent = createElement("div", "editor-workspace-content");
  private readonly inspectorDivider = createElement("div", "editor-pane-divider");
  private readonly inspectorSlot = createElement("div", "editor-pane-slot editor-pane-slot-inspector");
  private readonly explorerToggleButton = createButton("", "editor-pane-toggle");
  private readonly inspectorToggleButton = createButton("", "editor-pane-toggle");
  private readonly backButton = createButton("", "icon-button");
  private readonly createCharacterButton = createButton("", "icon-button");
  private readonly createMapButton = createButton("", "icon-button");
  private readonly openGameButton = createButton("", "icon-button");
  private readonly createActionButton = createButton("", "icon-button");
  private readonly createSceneButton = createButton("", "icon-button");
  private readonly explorerPane: ExplorerPane;
  private readonly propertiesPanel: PropertiesPanel;
  private screen: ScreenController | null = null;
  private screenKey = "";
  private paneLayout = loadPaneLayoutState();
  private dragPane: PaneSide | null = null;
  private readonly unsubscribe: () => void;
  private readonly handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private readonly handlePointerUp = () => this.stopDragging(true);
  private readonly handleWindowResize = () => this.renderPaneLayout();

  constructor(
    private readonly root: HTMLElement,
    private readonly store: EditorStore,
    private readonly options: EditorLayoutOptions,
  ) {
    this.shell.dataset.testid = "editor-shell";
    this.main.dataset.testid = "editor-main";
    this.explorerSlot.dataset.testid = "editor-explorer-pane";
    this.centerSlot.dataset.testid = "editor-workspace-pane";
    this.workspaceShell.dataset.testid = "editor-workspace-shell";
    this.workspaceTabBar.dataset.testid = "workspace-tabbar";
    this.workspaceContent.dataset.testid = "editor-center-pane";
    this.inspectorSlot.dataset.testid = "editor-properties-pane";
    this.backButton.dataset.testid = "editor-back-button";
    this.createCharacterButton.dataset.testid = "editor-create-character-button";
    this.createMapButton.dataset.testid = "editor-create-map-button";
    this.openGameButton.dataset.testid = "editor-open-game-button";
    this.createActionButton.dataset.testid = "editor-create-action-button";
    this.createSceneButton.dataset.testid = "editor-create-scene-button";
    this.root.append(this.shell);
    this.shell.append(this.topBar, this.main);
    this.buildTopBar();
    this.buildPaneChrome();
    this.workspaceShell.append(this.workspaceTabBar, this.workspaceContent);
    this.centerSlot.append(this.workspaceShell);
    this.main.append(this.explorerSlot, this.explorerDivider, this.centerSlot, this.inspectorDivider, this.inspectorSlot);
    this.explorerPane = new ExplorerPane(this.explorerSlot, this.store, this.options.translator);
    this.propertiesPanel = new PropertiesPanel(this.inspectorSlot, this.store, this.options.translator);
    window.addEventListener("resize", this.handleWindowResize);
    this.unsubscribe = this.store.subscribe((state) => this.render(state));
  }

  destroy(): void {
    this.stopDragging(false);
    window.removeEventListener("resize", this.handleWindowResize);
    this.unsubscribe();
    this.screen?.destroy();
    this.explorerPane.destroy();
    clearElement(this.root);
  }

  private render(state: ReturnType<EditorStore["getState"]>): void {
    this.renderTopBar();
    this.renderPaneLayout();
    this.renderWorkspaceTabs(state);
    this.explorerPane.update();

    const nextKey = state.route.kind === "library" ? "library" : `${state.route.kind}:${state.route.id}`;
    if (nextKey !== this.screenKey) {
      this.screen?.destroy();
      clearElement(this.workspaceContent);
      this.screen = this.createScreen();
      this.screenKey = nextKey;
    }

    this.screen?.update?.();
    this.propertiesPanel.update(
      state,
      isWorkspacePropertiesContributor(this.screen) ? this.screen : null,
    );
  }

  private renderTopBar(): void {
    this.backButton.hidden = !this.options.onReturnToMainMenu;
    this.backButton.title = this.options.translator.t("editor.shell.backToMenu");
    this.backButton.setAttribute("aria-label", this.options.translator.t("editor.shell.backToMenu"));
    this.createCharacterButton.title = this.options.translator.t("editor.shell.createCharacter");
    this.createCharacterButton.setAttribute("aria-label", this.options.translator.t("editor.shell.createCharacter"));
    this.createMapButton.title = this.options.translator.t("editor.shell.createMap");
    this.createMapButton.setAttribute("aria-label", this.options.translator.t("editor.shell.createMap"));
    this.openGameButton.title = this.options.translator.t("editor.shell.openGame");
    this.openGameButton.setAttribute("aria-label", this.options.translator.t("editor.shell.openGame"));
    this.createActionButton.title = this.options.translator.t("editor.shell.createAction");
    this.createActionButton.setAttribute("aria-label", this.options.translator.t("editor.shell.createAction"));
    this.createSceneButton.title = this.options.translator.t("editor.shell.createScene");
    this.createSceneButton.setAttribute("aria-label", this.options.translator.t("editor.shell.createScene"));
  }

  private buildTopBar(): void {
    this.backButton.append(createIcon("back"));
    this.createCharacterButton.append(createIcon("character"), createIcon("plus", "editor-icon editor-icon-plus-mark"));
    this.createMapButton.append(createIcon("map"), createIcon("plus", "editor-icon editor-icon-plus-mark"));
    this.openGameButton.append(createIcon("game"));
    this.createActionButton.append(createIcon("action"), createIcon("plus", "editor-icon editor-icon-plus-mark"));
    this.createSceneButton.append(createIcon("map"), createIcon("plus", "editor-icon editor-icon-plus-mark"));

    this.backButton.addEventListener("click", () => this.options.onReturnToMainMenu?.());
    this.createCharacterButton.addEventListener("click", () => this.store.navigate({ kind: "character", id: "new" }));
    this.createMapButton.addEventListener("click", () => this.store.navigate({ kind: "map", id: "new" }));
    this.openGameButton.addEventListener("click", () => {
      const gameId = this.store.getState().snapshot.games[0]?.id;
      if (gameId) {
        this.store.navigate({ kind: "game", id: gameId });
      }
    });
    this.createActionButton.addEventListener("click", () => this.store.navigate({ kind: "action", id: "new" }));
    this.createSceneButton.addEventListener("click", () => this.store.navigate({ kind: "scene", id: "new" }));

    this.topBarLeft.append(this.backButton);
    this.topBarCenter.append(this.createCharacterButton, this.createMapButton, this.openGameButton, this.createActionButton, this.createSceneButton);
    this.topBar.append(this.topBarLeft, this.topBarCenter, this.topBarRight);
  }

  private buildPaneChrome(): void {
    this.explorerDivider.append(this.explorerToggleButton);
    this.inspectorDivider.append(this.inspectorToggleButton);

    this.explorerToggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.togglePane("explorer");
    });
    this.inspectorToggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.togglePane("properties");
    });

    this.explorerDivider.addEventListener("pointerdown", (event) => this.startDragging(event, "explorer"));
    this.inspectorDivider.addEventListener("pointerdown", (event) => this.startDragging(event, "properties"));
  }

  private renderPaneLayout(): void {
    const applied = this.computeAppliedPaneWidths();
    this.main.style.setProperty("--editor-explorer-width", `${applied.explorer}px`);
    this.main.style.setProperty("--editor-inspector-width", `${applied.inspector}px`);
    this.main.style.setProperty("--editor-divider-width", `${PANE_DIVIDER_WIDTH}px`);

    this.explorerSlot.classList.toggle("is-collapsed", this.paneLayout.explorerCollapsed);
    this.inspectorSlot.classList.toggle("is-collapsed", this.paneLayout.inspectorCollapsed);
    this.explorerDivider.classList.toggle("is-collapsed", this.paneLayout.explorerCollapsed);
    this.inspectorDivider.classList.toggle("is-collapsed", this.paneLayout.inspectorCollapsed);
    this.explorerDivider.classList.toggle("is-dragging", this.dragPane === "explorer");
    this.inspectorDivider.classList.toggle("is-dragging", this.dragPane === "properties");

    const explorerToggleLabel = this.options.translator.t(
      this.paneLayout.explorerCollapsed ? "editor.shell.expandExplorer" : "editor.shell.collapseExplorer",
    );
    this.explorerToggleButton.replaceChildren(
      createIcon(this.paneLayout.explorerCollapsed ? "chevron-right" : "chevron-left"),
    );
    this.explorerToggleButton.title = explorerToggleLabel;
    this.explorerToggleButton.setAttribute("aria-label", explorerToggleLabel);

    const inspectorToggleLabel = this.options.translator.t(
      this.paneLayout.inspectorCollapsed ? "editor.shell.expandProperties" : "editor.shell.collapseProperties",
    );
    this.inspectorToggleButton.replaceChildren(
      createIcon(this.paneLayout.inspectorCollapsed ? "chevron-left" : "chevron-right"),
    );
    this.inspectorToggleButton.title = inspectorToggleLabel;
    this.inspectorToggleButton.setAttribute("aria-label", inspectorToggleLabel);
  }

  private renderWorkspaceTabs(state: ReturnType<EditorStore["getState"]>): void {
    const tabs = state.workspaceTabs.map((route) =>
      this.createWorkspaceTabButton(route, this.resolveWorkspaceTabLabel(route), state.route),
    );

    this.workspaceTabBar.hidden = tabs.length === 0;
    this.workspaceTabBar.replaceChildren(...tabs);
  }

  private togglePane(pane: PaneSide): void {
    if (pane === "explorer") {
      this.paneLayout.explorerCollapsed = !this.paneLayout.explorerCollapsed;
    } else {
      this.paneLayout.inspectorCollapsed = !this.paneLayout.inspectorCollapsed;
    }

    this.renderPaneLayout();
    persistPaneLayoutState(this.paneLayout);
  }

  private startDragging(event: PointerEvent, pane: PaneSide): void {
    if (event.button !== 0) {
      return;
    }

    if (
      event.target instanceof Node
      && (this.explorerToggleButton.contains(event.target) || this.inspectorToggleButton.contains(event.target))
    ) {
      return;
    }

    if ((pane === "explorer" && this.paneLayout.explorerCollapsed) || (pane === "properties" && this.paneLayout.inspectorCollapsed)) {
      return;
    }

    event.preventDefault();
    this.dragPane = pane;
    document.body.classList.add("editor-is-resizing");
    this.main.classList.add("is-resizing");
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    this.renderPaneLayout();
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragPane) {
      return;
    }

    const mainBounds = this.main.getBoundingClientRect();
    if (mainBounds.width <= 0) {
      return;
    }

    const applied = this.computeAppliedPaneWidths();
    if (this.dragPane === "explorer") {
      const nextWidth = clamp(
        event.clientX - mainBounds.left,
        EXPLORER_MIN_WIDTH,
        this.computeMaxPaneWidth("explorer", applied.inspector),
      );
      this.paneLayout.explorerWidth = nextWidth;
    } else {
      const nextWidth = clamp(
        mainBounds.right - event.clientX,
        INSPECTOR_MIN_WIDTH,
        this.computeMaxPaneWidth("properties", applied.explorer),
      );
      this.paneLayout.inspectorWidth = nextWidth;
    }

    this.renderPaneLayout();
  }

  private stopDragging(persist: boolean): void {
    if (!this.dragPane) {
      return;
    }

    this.dragPane = null;
    document.body.classList.remove("editor-is-resizing");
    this.main.classList.remove("is-resizing");
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this.renderPaneLayout();

    if (persist) {
      persistPaneLayoutState(this.paneLayout);
    }
  }

  private computeAppliedPaneWidths(): AppliedPaneWidths {
    const inspector = this.paneLayout.inspectorCollapsed
      ? 0
      : clamp(this.paneLayout.inspectorWidth, INSPECTOR_MIN_WIDTH, INSPECTOR_MAX_WIDTH);
    const explorerFirstPass = this.paneLayout.explorerCollapsed
      ? 0
      : clamp(this.paneLayout.explorerWidth, EXPLORER_MIN_WIDTH, this.computeMaxPaneWidth("explorer", inspector));
    const inspectorApplied = this.paneLayout.inspectorCollapsed
      ? 0
      : clamp(this.paneLayout.inspectorWidth, INSPECTOR_MIN_WIDTH, this.computeMaxPaneWidth("properties", explorerFirstPass));
    const explorerApplied = this.paneLayout.explorerCollapsed
      ? 0
      : clamp(this.paneLayout.explorerWidth, EXPLORER_MIN_WIDTH, this.computeMaxPaneWidth("explorer", inspectorApplied));

    return {
      explorer: explorerApplied,
      inspector: inspectorApplied,
    };
  }

  private computeMaxPaneWidth(pane: PaneSide, oppositeWidth: number): number {
    const mainWidth = this.main.getBoundingClientRect().width || window.innerWidth;
    const maxByViewport = mainWidth - (PANE_DIVIDER_WIDTH * 2) - oppositeWidth - MIN_CENTER_WIDTH;
    const paneMax = pane === "explorer" ? EXPLORER_MAX_WIDTH : INSPECTOR_MAX_WIDTH;
    const paneMin = pane === "explorer" ? EXPLORER_MIN_WIDTH : INSPECTOR_MIN_WIDTH;
    return Math.max(paneMin, Math.min(paneMax, maxByViewport));
  }

  private createScreen(): ScreenController {
    const route = this.store.getState().route;
    switch (route.kind) {
      case "library":
      return new AssetPreviewPane(this.workspaceContent, this.store, this.options.translator);
      case "raw-asset":
        return new RawAssetWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "tileset":
        return new TilesetMappingWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "spritesheet":
        return new SpriteSheetMappingWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "animation":
        return new AnimationEditorPanel(this.workspaceContent, this.store, this.options.translator, route.id);
      case "character":
        return new CharacterEditorView(this.workspaceContent, this.store, this.options.translator, route.id);
      case "map":
        return new MapEditorWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "level":
        return new LevelWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "action":
        return new ActionWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "game":
        return new GameWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
      case "scene":
        return new SceneWorkspace(this.workspaceContent, this.store, this.options.translator, route.id);
    }
  }

  private createWorkspaceTabButton(
    route: WorkspaceRoute,
    label: string,
    activeRoute: ReturnType<EditorStore["getState"]>["route"],
  ): HTMLElement {
    const tab = createElement(
      "div",
      areRoutesEqual(route, activeRoute) ? "workspace-tab is-active" : "workspace-tab",
    );
    tab.dataset.testid = "workspace-tab";
    tab.dataset.routeKey = `${route.kind}:${route.id}`;

    const button = createButton("", "workspace-tab-button");
    button.dataset.testid = "workspace-tab-button";
    button.append(createElement("span", "workspace-tab-label", label));
    button.title = label;
    button.addEventListener("click", () => this.store.activateWorkspaceTab(route));
    tab.append(button);

    const closeButton = createButton("x", "workspace-tab-close");
    closeButton.dataset.testid = "workspace-tab-close";
    closeButton.title = this.options.translator.t("editor.shell.closeTab", { name: label });
    closeButton.setAttribute("aria-label", this.options.translator.t("editor.shell.closeTab", { name: label }));
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.store.closeWorkspaceTab(route);
    });
    tab.append(closeButton);

    return tab;
  }

  private resolveWorkspaceTabLabel(route: WorkspaceRoute): string {
    if (route.id === "new") {
      if (route.kind === "character") {
        return this.options.translator.t("editor.workspaceTabs.newCharacter");
      }
      if (route.kind === "map") {
        return this.options.translator.t("editor.workspaceTabs.newMap");
      }
      if (route.kind === "animation") {
        return this.options.translator.t("editor.workspaceTabs.newAnimation");
      }
      if (route.kind === "level") {
        return this.options.translator.t("editor.workspaceTabs.newLevel");
      }
      if (route.kind === "action") {
        return this.options.translator.t("editor.workspaceTabs.newAction");
      }
      if (route.kind === "scene") {
        return this.options.translator.t("editor.workspaceTabs.newScene");
      }
      if (route.kind === "game") {
        return this.options.translator.formatEntityType("game");
      }
      return this.options.translator.formatEntityType(route.kind);
    }

    return this.store.getAssetById(route.id)?.name ?? this.options.translator.formatEntityType(route.kind);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function areRoutesEqual(left: { kind: string; id?: string }, right: { kind: string; id?: string }): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  return "id" in left && "id" in right && left.id === right.id;
}

function loadPaneLayoutState(): EditorPaneLayoutState {
  const defaults: EditorPaneLayoutState = {
    explorerWidth: EXPLORER_DEFAULT_WIDTH,
    inspectorWidth: INSPECTOR_DEFAULT_WIDTH,
    explorerCollapsed: false,
    inspectorCollapsed: false,
  };

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<EditorPaneLayoutState>;
    return {
      explorerWidth: typeof parsed.explorerWidth === "number" ? parsed.explorerWidth : defaults.explorerWidth,
      inspectorWidth: typeof parsed.inspectorWidth === "number" ? parsed.inspectorWidth : defaults.inspectorWidth,
      explorerCollapsed: Boolean(parsed.explorerCollapsed),
      inspectorCollapsed: Boolean(parsed.inspectorCollapsed),
    };
  } catch {
    return defaults;
  }
}

function persistPaneLayoutState(layout: EditorPaneLayoutState): void {
  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage failures and keep the live layout working.
  }
}
