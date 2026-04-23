import { isAction, isScene } from "../../domain/assetReferences";
import { ROOT_FOLDER_IDS } from "../../content/coreAssetManifest";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName } from "../../domain/editorValidators";
import type {
  ActionDefinition,
  SceneDefinition,
} from "../../domain/editorTypes";
import type { WorkspacePropertiesContributor } from "../../properties/WorkspacePropertiesContributor";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../../shared/formControls";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";
import type { EditorTranslator } from "../../i18n/EditorTranslator";

export class ActionWorkspace implements WorkspacePropertiesContributor {
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
  private readonly kindField = createSelectFieldController("", (value) => {
    this.kind = value as ActionDefinition["kind"];
    this.render();
  });
  private readonly targetSceneField = createSelectFieldController("", (value) => {
    this.targetSceneId = value;
    if (!this.getEntryPointOptions().some((option) => option.value === this.targetEntryPointId)) {
      this.targetEntryPointId = "";
    }
    this.render();
  });
  private readonly targetEntryPointField = createSelectFieldController("", (value) => {
    this.targetEntryPointId = value;
    this.render();
  });
  private readonly transitionStyleField = createSelectFieldController("", (value) => {
    this.transitionStyle = value as "none" | "fade";
    this.render();
  });
  private readonly saveButton = createButton("", "primary-button");
  private readonly routeId: string;
  private readonly editable: boolean;
  private readonly existingActionId: string | null;
  private readonly createdAt: string | null;
  private readonly existingRelativePath: string | null;
  private readonly existingFolderId: string | null;
  private name: string;
  private kind: ActionDefinition["kind"];
  private targetSceneId: string;
  private targetEntryPointId: string;
  private transitionStyle: "none" | "fade";

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    this.routeId = routeId;
    const asset = this.store.getAssetById(routeId);
    const action = asset && isAction(asset) ? asset : null;
    this.root.dataset.testid = "action-workspace";
    this.preview.dataset.testid = "action-preview";

    const firstSceneId = this.getSceneOptions()[0]?.value ?? "";
    if (action) {
      this.editable = action.storageRoot === "user" && !action.archivedAt;
      this.existingActionId = action.id;
      this.createdAt = action.createdAt;
      this.existingRelativePath = action.relativePath;
      this.existingFolderId = action.folderId;
      this.name = action.name;
      this.kind = action.kind;
      this.targetSceneId = action.kind === "scene-transition" ? action.targetSceneId : firstSceneId;
      this.targetEntryPointId = action.kind === "scene-transition" ? action.targetEntryPointId ?? "" : "";
      this.transitionStyle = action.kind === "scene-transition" ? action.transitionStyle : "fade";
    } else if (routeId === "new") {
      this.editable = true;
      this.existingActionId = null;
      this.createdAt = null;
      this.existingRelativePath = null;
      this.existingFolderId = null;
      this.name = buildUniqueAssetName("action", this.store.getAllAssets());
      this.kind = "scene-transition";
      this.targetSceneId = firstSceneId;
      this.targetEntryPointId = "";
      this.transitionStyle = "fade";
    } else {
      this.editable = false;
      this.existingActionId = null;
      this.createdAt = null;
      this.existingRelativePath = null;
      this.existingFolderId = null;
      this.name = "";
      this.kind = "scene-transition";
      this.targetSceneId = firstSceneId;
      this.targetEntryPointId = "";
      this.transitionStyle = "fade";
    }

    this.saveButton.dataset.testid = "action-save-button";
    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }

      const targetFolder = this.resolveTargetFolderId();
      if (!targetFolder) {
        return;
      }

      const now = new Date().toISOString();
      const definition: ActionDefinition = {
        id: this.existingActionId ?? createEditorId(),
        name: this.name.trim(),
        storageRoot: "user",
        folderId: targetFolder,
        relativePath: this.existingRelativePath ?? joinRelativePath(
          this.store.getFolderById(targetFolder)?.relativePath ?? "",
          buildRelativeFilePath(this.name.trim(), ".json"),
        ),
        kind: "scene-transition",
        targetSceneId: this.targetSceneId,
        targetEntryPointId: this.targetEntryPointId || null,
        transitionStyle: this.transitionStyle,
        archivedAt: null,
        createdAt: this.createdAt ?? now,
        updatedAt: now,
      };

      await this.store.saveAction(definition);
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "action", id: definition.id });
    });

    this.controls.append(
      this.nameField.field,
      this.kindField.field,
      this.targetSceneField.field,
      this.targetEntryPointField.field,
      this.transitionStyleField.field,
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

    if (!this.existingActionId && this.routeId !== "new") {
      this.body.hidden = true;
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.action.unavailableTitle"),
          this.translator.t("editor.workspace.action.unavailableBody"),
        ),
      );
      return;
    }

    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.action.labels.name");
    this.kindField.label.textContent = this.translator.t("editor.workspace.action.labels.kind");
    this.targetSceneField.label.textContent = this.translator.t("editor.workspace.action.labels.targetScene");
    this.targetEntryPointField.label.textContent = this.translator.t("editor.workspace.action.labels.targetEntryPoint");
    this.transitionStyleField.label.textContent = this.translator.t("editor.workspace.action.labels.transitionStyle");
    this.saveButton.textContent = this.translator.t("editor.workspace.action.save");
    this.saveButton.hidden = !this.editable;

    this.nameField.sync(this.name, !this.editable);
    this.kindField.sync([
      {
        label: this.translator.t("editor.workspace.action.kinds.sceneTransition"),
        value: "scene-transition",
      },
    ], this.kind, true);
    this.targetSceneField.sync(this.getSceneOptions(), this.targetSceneId, !this.editable);
    this.targetEntryPointField.sync(this.getEntryPointOptions(), this.targetEntryPointId, !this.editable);
    this.transitionStyleField.sync([
      {
        label: this.translator.t("editor.workspace.action.transitionStyles.none"),
        value: "none",
      },
      {
        label: this.translator.t("editor.workspace.action.transitionStyles.fade"),
        value: "fade",
      },
    ], this.transitionStyle, !this.editable);

    this.renderPreview();
  }

  private renderPreview(): void {
    clearElement(this.preview);

    const targetScene = this.targetSceneId ? this.store.getAssetById(this.targetSceneId) : null;
    const targetSceneName = targetScene && isScene(targetScene)
      ? targetScene.name
      : this.translator.t("editor.workspace.action.noTargetScene");
    const targetEntryPoint = this.getEntryPointLabel(this.targetSceneId, this.targetEntryPointId)
      ?? this.translator.t("editor.workspace.action.entryPointDefault");

    const summary = createElement("div", "action-preview-copy");
    summary.append(
      createElement("p", "workspace-title", this.translator.t("editor.workspace.action.kinds.sceneTransition")),
      createElement("p", "workspace-summary", `${this.name.trim() || this.translator.t("editor.workspaceTabs.newAction")} -> ${targetSceneName}`),
      createElement("p", "workspace-summary", `${this.translator.t("editor.workspace.action.labels.targetEntryPoint")}: ${targetEntryPoint}`),
      createElement("p", "workspace-summary", `${this.translator.t("editor.workspace.action.labels.transitionStyle")}: ${this.translator.t(`editor.workspace.action.transitionStyles.${this.transitionStyle}`)}`),
    );
    this.preview.append(summary);
  }

  private getSceneOptions(): Array<{ label: string; value: string }> {
    return this.store.getState().snapshot.scenes
      .filter((scene) => !scene.archivedAt || scene.id === this.targetSceneId)
      .map((scene) => ({
        label: scene.name,
        value: scene.id,
      }));
  }

  private getEntryPointOptions(): Array<{ label: string; value: string }> {
    const options = [{
      label: this.translator.t("editor.workspace.action.entryPointDefault"),
      value: "",
    }];
    const scene = this.targetSceneId ? this.store.getAssetById(this.targetSceneId) : null;
    if (!scene || !isScene(scene)) {
      return options;
    }

    return options.concat(extractEntryPoints(scene).map((entry) => ({
      label: entry.name,
      value: entry.id,
    })));
  }

  private getEntryPointLabel(sceneId: string, entryPointId: string): string | null {
    if (!sceneId || !entryPointId) {
      return null;
    }
    const scene = this.store.getAssetById(sceneId);
    if (!scene || !isScene(scene)) {
      return null;
    }
    return extractEntryPoints(scene).find((entry) => entry.id === entryPointId)?.name ?? null;
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.name);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.name.trim(), this.existingActionId ?? undefined)) {
      return this.translator.t("editor.validation.duplicateActionName");
    }
    const targetScene = this.targetSceneId ? this.store.getAssetById(this.targetSceneId) : null;
    if (!targetScene || !isScene(targetScene)) {
      return this.translator.t("editor.workspace.action.targetSceneRequired");
    }
    return null;
  }

  private resolveTargetFolderId(): string | null {
    if (this.existingFolderId) {
      return this.existingFolderId;
    }

    const state = this.store.getState();
    const selectedFolder = state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    if (selectedFolder?.storageRoot === "user") {
      return selectedFolder.id;
    }

    const selectedAsset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    if (selectedAsset?.storageRoot === "user") {
      return selectedAsset.folderId ?? ROOT_FOLDER_IDS.user;
    }

    return ROOT_FOLDER_IDS.user;
  }
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}

function extractEntryPoints(scene: SceneDefinition): Array<{ id: string; name: string }> {
  return scene.layers
    .filter((layer): layer is Extract<SceneDefinition["layers"][number], { kind: "objects" }> => layer.kind === "objects")
    .flatMap((layer) => layer.objects)
    .flatMap((object) => object.type === "entry-point" ? [{ id: object.id, name: object.name }] : []);
}
