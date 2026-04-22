import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { AssetLibraryView } from "../library/AssetLibraryView";
import { TilesetMappingWorkspace } from "../workspaces/tileset/TilesetMappingWorkspace";
import { SpriteSheetMappingWorkspace } from "../workspaces/spritesheet/SpriteSheetMappingWorkspace";
import { AnimationEditorPanel } from "../workspaces/spritesheet/AnimationEditorPanel";
import { CharacterEditorView } from "../workspaces/character/CharacterEditorView";
import { MapEditorWorkspace } from "../workspaces/map/MapEditorWorkspace";

interface ScreenController {
  destroy(): void;
  update?(): void;
}

export class EditorLayout {
  private readonly shell = createElement("div", "editor-shell");
  private readonly header = createElement("header", "editor-header");
  private readonly content = createElement("main", "editor-content");
  private screen: ScreenController | null = null;
  private screenKey = "";
  private readonly unsubscribe: () => void;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: EditorStore,
  ) {
    this.root.append(this.shell);
    this.shell.append(this.header, this.content);
    this.unsubscribe = this.store.subscribe(() => this.render());
  }

  destroy(): void {
    this.unsubscribe();
    this.screen?.destroy();
    clearElement(this.root);
  }

  private render(): void {
    const state = this.store.getState();
    this.renderHeader();

    const nextKey = state.route.kind === "library" ? "library" : `${state.route.kind}:${state.route.id}`;
    if (nextKey !== this.screenKey) {
      this.screen?.destroy();
      clearElement(this.content);
      this.screen = this.createScreen();
      this.screenKey = nextKey;
    }

    this.screen?.update?.();
  }

  private renderHeader(): void {
    const state = this.store.getState();
    clearElement(this.header);

    const copy = createElement("div", "editor-brand");
    copy.append(
      createElement("span", "editor-eyebrow", "Phaser V1"),
      createElement("h1", "editor-title", "Level Editor"),
      createElement("p", "editor-subtitle", "Importa PNGs, mapea assets y monta mapas sin tocar la escena jugable actual."),
    );

    const actions = createElement("div", "editor-header-actions");
    const libraryButton = createButton("Library", state.route.kind === "library" ? "tab-button is-active" : "tab-button");
    libraryButton.addEventListener("click", () => this.store.navigate({ kind: "library" }));
    const gameLink = createElement("a", "secondary-button", "Open game") as HTMLAnchorElement;
    gameLink.href = "./index.html";
    actions.append(libraryButton, gameLink);

    this.header.append(copy, actions);
  }

  private createScreen(): ScreenController {
    const route = this.store.getState().route;
    switch (route.kind) {
      case "library":
        return new AssetLibraryView(this.content, this.store);
      case "tileset":
        return new TilesetMappingWorkspace(this.content, this.store, route.id);
      case "spritesheet":
        return new SpriteSheetMappingWorkspace(this.content, this.store, route.id);
      case "animation":
        return new AnimationEditorPanel(this.content, this.store, route.id);
      case "character":
        return new CharacterEditorView(this.content, this.store, route.id);
      case "map":
        return new MapEditorWorkspace(this.content, this.store, route.id);
    }
  }
}
