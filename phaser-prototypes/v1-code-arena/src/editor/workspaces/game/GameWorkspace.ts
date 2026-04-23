import { isCharacter, isGame, isScene } from "../../domain/assetReferences";
import type { GameDefinition, SceneDefinition } from "../../domain/editorTypes";
import type { WorkspacePropertiesContributor } from "../../properties/WorkspacePropertiesContributor";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../../shared/formControls";
import type { EditorTranslator } from "../../i18n/EditorTranslator";

export class GameWorkspace implements WorkspacePropertiesContributor {
  private readonly root = createElement("section", "workspace-screen action-workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly body = createElement("div", "workspace-body-single action-workspace");
  private readonly preview = createElement("div", "workspace-preview action-preview");
  private readonly controls = createElement("div", "action-properties-grid");
  private readonly actions = createElement("div", "workspace-button-row action-workspace-actions");
  private readonly nameField = createTextFieldController("", {
    onInput: (value) => {
      this.name = value;
      this.render();
    },
  });
  private readonly entrySceneField = createSelectFieldController("", (value) => {
    this.entrySceneId = value;
    if (!this.getEntryPointOptions().some((option) => option.value === this.entryPointId)) {
      this.entryPointId = "";
    }
    this.render();
  });
  private readonly entryPointField = createSelectFieldController("", (value) => {
    this.entryPointId = value;
    this.render();
  });
  private readonly defaultPlayerField = createSelectFieldController("", (value) => {
    this.defaultPlayerCharacterId = value;
    this.render();
  });
  private readonly saveButton = createButton("", "primary-button");
  private readonly existingGameId: string | null;
  private readonly existingRelativePath: string | null;
  private readonly existingFolderId: string | null;
  private readonly createdAt: string | null;
  private readonly storageRoot: GameDefinition["storageRoot"];
  private readonly archivedAt: string | null;
  private readonly editable: boolean;
  private name: string;
  private entrySceneId: string;
  private entryPointId: string;
  private defaultPlayerCharacterId: string;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    const game = asset && isGame(asset) ? asset : null;
    this.root.dataset.testid = "game-workspace";
    this.preview.dataset.testid = "game-preview";

    const firstSceneId = this.getSceneOptions()[0]?.value ?? "";
    const firstCharacterId = this.getCharacterOptions()[0]?.value ?? "";

    this.existingGameId = game?.id ?? null;
    this.existingRelativePath = game?.relativePath ?? null;
    this.existingFolderId = game?.folderId ?? null;
    this.createdAt = game?.createdAt ?? null;
    this.storageRoot = game?.storageRoot ?? "user";
    this.archivedAt = game?.archivedAt ?? null;
    this.editable = Boolean(game && !game.archivedAt);
    this.name = game?.name ?? "";
    this.entrySceneId = game?.entrySceneId ?? firstSceneId;
    this.entryPointId = game?.entryPointId ?? "";
    this.defaultPlayerCharacterId = game?.defaultPlayerCharacterId ?? firstCharacterId;

    this.saveButton.dataset.testid = "game-save-button";
    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error || !game) {
        window.alert(error ?? this.translator.t("editor.workspace.game.unavailableTitle"));
        return;
      }

      const now = new Date().toISOString();
      const definition: GameDefinition = {
        id: game.id,
        name: this.name.trim(),
        storageRoot: this.storageRoot,
        folderId: this.existingFolderId,
        relativePath: this.existingRelativePath ?? game.relativePath,
        entrySceneId: this.entrySceneId,
        entryPointId: this.entryPointId || null,
        defaultPlayerCharacterId: this.defaultPlayerCharacterId || null,
        initialFlags: [...game.initialFlags],
        archivedAt: this.archivedAt,
        createdAt: this.createdAt ?? now,
        updatedAt: now,
      };

      await this.store.saveGame(definition);
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "game", id: definition.id });
    });

    this.controls.append(
      this.nameField.field,
      this.entrySceneField.field,
      this.entryPointField.field,
      this.defaultPlayerField.field,
    );
    this.actions.append(this.saveButton);
    this.body.append(this.preview);
    this.root.append(this.emptyStateHost, this.body);
    this.container.append(this.root);
    this.render();
  }

  update(): void {
    this.render();
  }

  destroy(): void {
    clearElement(this.container);
  }

  renderProperties(container: HTMLElement): void {
    container.append(this.controls, this.actions);
  }

  private render(): void {
    clearElement(this.emptyStateHost);

    if (!this.existingGameId) {
      this.body.hidden = true;
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.game.unavailableTitle"),
          this.translator.t("editor.workspace.game.unavailableBody"),
        ),
      );
      return;
    }

    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.game.labels.name");
    this.entrySceneField.label.textContent = this.translator.t("editor.workspace.game.labels.entryScene");
    this.entryPointField.label.textContent = this.translator.t("editor.workspace.game.labels.entryPoint");
    this.defaultPlayerField.label.textContent = this.translator.t("editor.workspace.game.labels.defaultPlayer");
    this.saveButton.textContent = this.translator.t("editor.workspace.game.save");
    this.saveButton.hidden = !this.editable;

    this.nameField.sync(this.name, !this.editable);
    this.entrySceneField.sync(this.getSceneOptions(), this.entrySceneId, !this.editable);
    this.entryPointField.sync(this.getEntryPointOptions(), this.entryPointId, !this.editable);
    this.defaultPlayerField.sync(this.getCharacterOptions(), this.defaultPlayerCharacterId, !this.editable);

    this.renderPreview();
  }

  private renderPreview(): void {
    clearElement(this.preview);

    const entryScene = this.entrySceneId ? this.store.getAssetById(this.entrySceneId) : null;
    const entrySceneName = entryScene && isScene(entryScene)
      ? entryScene.name
      : this.translator.t("editor.workspace.game.noEntryScene");
    const entryPointName = this.getEntryPointLabel(this.entrySceneId, this.entryPointId)
      ?? this.translator.t("editor.workspace.game.defaultEntry");
    const defaultPlayer = this.defaultPlayerCharacterId ? this.store.getAssetById(this.defaultPlayerCharacterId) : null;
    const defaultPlayerName = defaultPlayer && isCharacter(defaultPlayer)
      ? defaultPlayer.name
      : this.translator.t("editor.common.no");

    const summary = createElement("div", "action-preview-copy");
    summary.append(
      createElement("p", "workspace-title", this.translator.t("editor.assetTypes.game")),
      createElement("p", "workspace-summary", this.name.trim() || this.translator.formatEntityType("game")),
      createElement("p", "workspace-summary", `${this.translator.t("editor.workspace.game.labels.entryScene")}: ${entrySceneName}`),
      createElement("p", "workspace-summary", `${this.translator.t("editor.workspace.game.labels.entryPoint")}: ${entryPointName}`),
      createElement("p", "workspace-summary", `${this.translator.t("editor.workspace.game.labels.defaultPlayer")}: ${defaultPlayerName}`),
    );
    this.preview.append(summary);
  }

  private getSceneOptions(): Array<{ label: string; value: string }> {
    return this.store.getState().snapshot.scenes
      .filter((scene) => !scene.archivedAt || scene.id === this.entrySceneId)
      .map((scene) => ({
        label: scene.name,
        value: scene.id,
      }));
  }

  private getEntryPointOptions(): Array<{ label: string; value: string }> {
    const options = [{
      label: this.translator.t("editor.workspace.game.defaultEntry"),
      value: "",
    }];
    const scene = this.entrySceneId ? this.store.getAssetById(this.entrySceneId) : null;
    if (!scene || !isScene(scene)) {
      return options;
    }

    return options.concat(extractEntryPoints(scene).map((entry) => ({
      label: entry.name,
      value: entry.id,
    })));
  }

  private getEntryPointLabel(sceneId: string, entryPointId: string): string | null {
    const scene = sceneId ? this.store.getAssetById(sceneId) : null;
    if (!scene || !isScene(scene)) {
      return null;
    }

    return extractEntryPoints(scene).find((entry) => entry.id === entryPointId)?.name ?? null;
  }

  private getCharacterOptions(): Array<{ label: string; value: string }> {
    return this.store.getState().snapshot.characters
      .filter((character) => !character.archivedAt || character.id === this.defaultPlayerCharacterId)
      .map((character) => ({
        label: character.name,
        value: character.id,
      }));
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.name);
    if (nameError) {
      return nameError;
    }

    if (!this.entrySceneId || !this.store.getAssetById(this.entrySceneId)) {
      return this.translator.t("editor.workspace.game.entrySceneRequired");
    }

    if (!this.defaultPlayerCharacterId || !this.store.getAssetById(this.defaultPlayerCharacterId)) {
      return this.translator.t("editor.workspace.game.defaultPlayerRequired");
    }

    return null;
  }
}

function extractEntryPoints(scene: SceneDefinition): Array<{ id: string; name: string }> {
  return scene.layers
    .flatMap((layer) => (layer.kind === "objects" ? layer.objects : []))
    .filter((object) => object.type === "entry-point")
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
    }));
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
