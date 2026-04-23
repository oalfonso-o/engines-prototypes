import { isAnimation } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName } from "../../domain/editorValidators";
import type {
  AnimationDefinition,
  CharacterDefinition,
  CharacterSlot,
  RunSideFacing,
} from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../../shared/formControls";
import { mountAnimationPreview } from "../spritesheet/animationPreview";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import type { WorkspacePropertiesContributor } from "../../properties/WorkspacePropertiesContributor";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";

type PreviewSlot = "idle" | "run_side" | "jump" | "attack";

export class CharacterEditorView implements WorkspacePropertiesContributor {
  private readonly root = createElement("section", "workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly body = createElement("div", "workspace-body workspace-body-single");
  private readonly controls = createElement("div", "workspace-sidebar");
  private readonly previewCard = createElement("div", "workspace-preview-card");
  private readonly previewHost = createElement("div", "animation-preview");
  private readonly nameField = createTextFieldController("", {
    onChange: (value) => {
      this.draftName = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly idleField = createSelectFieldController("", (value) => {
    this.idleAnimationId = value === "" ? null : value;
    this.render();
  });
  private readonly runSideField = createSelectFieldController("", (value) => {
    this.runSideAnimationId = value === "" ? null : value;
    if (!this.runSideAnimationId) {
      this.runSideFacing = null;
    }
    this.render();
  });
  private readonly jumpField = createSelectFieldController("", (value) => {
    this.jumpAnimationId = value === "" ? null : value;
    this.render();
  });
  private readonly attackField = createSelectFieldController("", (value) => {
    this.attackAnimationId = value === "" ? null : value;
    this.render();
  });
  private readonly facingField = createSelectFieldController("", (value) => {
    this.runSideFacing = value === "" ? null : value as RunSideFacing;
    this.render();
  });
  private readonly previewButtons = createElement("div", "workspace-button-row");
  private readonly previewSlotButtons: Record<PreviewSlot, HTMLButtonElement> = {
    idle: createButton("", "tab-button"),
    run_side: createButton("", "tab-button"),
    jump: createButton("", "tab-button"),
    attack: createButton("", "tab-button"),
  };
  private readonly playbackButtons = createElement("div", "workspace-button-row");
  private readonly previewButton = createButton("", "secondary-button");
  private readonly pauseButton = createButton("", "secondary-button");
  private readonly saveButton = createButton("", "primary-button");
  private destroyPreview: (() => void) | null = null;
  private readonly readOnly: boolean;
  private draftName: string;
  private idleAnimationId: string | null;
  private runSideAnimationId: string | null;
  private runSideFacing: RunSideFacing | null;
  private jumpAnimationId: string | null;
  private attackAnimationId: string | null;
  private previewSlot: PreviewSlot = "idle";
  private playing = true;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    if (asset && "idleAnimationId" in asset) {
      this.readOnly = true;
      this.draftName = asset.name;
      this.idleAnimationId = asset.idleAnimationId;
      this.runSideAnimationId = asset.runSideAnimationId;
      this.runSideFacing = asset.runSideFacing;
      this.jumpAnimationId = asset.jumpAnimationId;
      this.attackAnimationId = asset.attackAnimationId;
    } else if (routeId === "new") {
      this.readOnly = false;
      this.draftName = buildUniqueAssetName("character", this.store.getAllAssets());
      this.idleAnimationId = null;
      this.runSideAnimationId = null;
      this.runSideFacing = null;
      this.jumpAnimationId = null;
      this.attackAnimationId = null;
    } else {
      this.readOnly = true;
      this.draftName = "";
      this.idleAnimationId = null;
      this.runSideAnimationId = null;
      this.runSideFacing = null;
      this.jumpAnimationId = null;
      this.attackAnimationId = null;
    }

    this.buildShell();
    this.container.append(this.root);
    this.render();
  }

  destroy(): void {
    this.destroyGame();
    clearElement(this.container);
  }

  private buildShell(): void {
    (["idle", "run_side", "jump", "attack"] as CharacterSlot[]).forEach((slot) => {
      this.previewSlotButtons[slot].addEventListener("click", () => {
        this.previewSlot = slot;
        this.render();
      });
      this.previewButtons.append(this.previewSlotButtons[slot]);
    });

    this.previewButton.addEventListener("click", () => {
      this.playing = true;
      this.render();
    });
    this.pauseButton.addEventListener("click", () => {
      this.playing = false;
      this.render();
    });
    this.playbackButtons.append(this.previewButton, this.pauseButton);

    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }
      const now = new Date().toISOString();
      const definition: CharacterDefinition = {
        id: createEditorId(),
        name: this.draftName.trim(),
        storageRoot: "user",
        folderId: this.store.getAssetById(this.idleAnimationId!)?.folderId ?? null,
        relativePath: joinRelativePath(
          this.store.getFolderById(this.store.getAssetById(this.idleAnimationId!)?.folderId ?? "")?.relativePath ?? "",
          buildRelativeFilePath(this.draftName.trim(), ".json"),
        ),
        idleAnimationId: this.idleAnimationId!,
        runSideAnimationId: this.runSideAnimationId,
        runSideFacing: this.runSideAnimationId ? this.runSideFacing : null,
        jumpAnimationId: this.jumpAnimationId,
        attackAnimationId: this.attackAnimationId,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.store.saveCharacter(definition);
      this.store.setLibraryTab("game");
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "character", id: definition.id });
    });
    this.controls.append(
      this.nameField.field,
      this.idleField.field,
      this.runSideField.field,
      this.jumpField.field,
      this.attackField.field,
      this.facingField.field,
      this.previewButtons,
      this.playbackButtons,
      this.saveButton,
    );

    this.previewCard.append(this.previewHost);
    this.body.append(this.previewCard);
    this.root.append(this.emptyStateHost, this.body);
  }

  private render(): void {
    this.destroyGame();

    if (!this.readOnly && this.getAvailableAnimations().length === 0) {
      this.body.hidden = true;
      clearElement(this.emptyStateHost);
      this.emptyStateHost.append(
        createMessageCard(
          this.translator.t("editor.workspace.character.noAnimationsTitle"),
          this.translator.t("editor.workspace.character.noAnimationsBody"),
        ),
      );
      return;
    }

    clearElement(this.emptyStateHost);
    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.character.labels.name");
    this.idleField.label.textContent = this.translator.t("editor.workspace.character.labels.idle");
    this.runSideField.label.textContent = this.translator.t("editor.workspace.character.labels.runSide");
    this.jumpField.label.textContent = this.translator.t("editor.workspace.character.labels.jump");
    this.attackField.label.textContent = this.translator.t("editor.workspace.character.labels.attack");
    this.facingField.label.textContent = this.translator.t("editor.workspace.character.labels.runSideFacing");
    this.previewSlotButtons.idle.textContent = this.translator.t("editor.workspace.character.previewTabs.idle");
    this.previewSlotButtons.run_side.textContent = this.translator.t("editor.workspace.character.previewTabs.run");
    this.previewSlotButtons.jump.textContent = this.translator.t("editor.workspace.character.previewTabs.jump");
    this.previewSlotButtons.attack.textContent = this.translator.t("editor.workspace.character.previewTabs.attack");
    this.previewButton.textContent = this.translator.t("editor.workspace.character.preview");
    this.pauseButton.textContent = this.translator.t("editor.workspace.character.pause");
    this.saveButton.textContent = this.translator.t("editor.workspace.character.save");
    this.nameField.sync(this.draftName, this.readOnly);

    const animationOptions = this.getAnimationOptions().map((entry) => ({ label: entry.name, value: entry.id }));
    this.idleField.sync([{ label: this.translator.t("editor.common.selectOne"), value: "" }, ...animationOptions], this.idleAnimationId ?? "", this.readOnly);
    this.runSideField.sync([{ label: this.translator.t("editor.common.idleFallback"), value: "" }, ...animationOptions], this.runSideAnimationId ?? "", this.readOnly);
    this.jumpField.sync([{ label: this.translator.t("editor.common.idleFallback"), value: "" }, ...animationOptions], this.jumpAnimationId ?? "", this.readOnly);
    this.attackField.sync([{ label: this.translator.t("editor.common.idleFallback"), value: "" }, ...animationOptions], this.attackAnimationId ?? "", this.readOnly);
    this.facingField.sync(
      [
        { label: this.translator.t("editor.common.selectOne"), value: "" },
        { label: this.translator.t("editor.workspace.character.labels.left"), value: "left" },
        { label: this.translator.t("editor.workspace.character.labels.right"), value: "right" },
      ],
      this.runSideFacing ?? "",
      this.readOnly,
    );
    this.facingField.field.hidden = !this.runSideAnimationId;

    (Object.keys(this.previewSlotButtons) as PreviewSlot[]).forEach((slot) => {
      this.previewSlotButtons[slot].className = this.previewSlot === slot ? "tab-button is-active" : "tab-button";
    });
    this.saveButton.hidden = this.readOnly;

    clearElement(this.previewCard);
    this.previewCard.append(this.previewHost);
    const playback = this.resolvePreviewAnimation();
    if (!playback) {
      this.previewCard.append(
        createMessageCard(
          this.translator.t("editor.workspace.character.noPreviewTitle"),
          this.translator.t("editor.workspace.character.noPreviewBody"),
        ),
      );
      return;
    }

    this.destroyPreview = mountAnimationPreview({
      container: this.previewHost,
      imageUrl: playback.imageUrl,
      frames: playback.frames,
      frameDurationMs: playback.animation.frameDurationMs,
      loop: playback.animation.loop,
      playing: this.playing,
    });
  }

  renderProperties(container: HTMLElement): void {
    container.append(this.controls);
  }

  private getAnimationOptions(): AnimationDefinition[] {
    const snapshot = this.store.getState().snapshot;
    if (this.readOnly) {
      return snapshot.animations;
    }
    return snapshot.animations.filter((entry) => !entry.archivedAt);
  }

  private getAvailableAnimations(): AnimationDefinition[] {
    return this.store.getState().snapshot.animations.filter((entry) => !entry.archivedAt);
  }

  private resolvePreviewAnimation():
    | {
      animation: AnimationDefinition;
      imageUrl: string;
      frames: Array<{ id: string; rect: AnimationDefinition extends never ? never : { x: number; y: number; width: number; height: number } }>;
    }
    | null {
    const animation = this.resolveSlotAnimation(this.previewSlot);
    if (!animation) {
      return null;
    }

    const spritesheet = this.store.getState().snapshot.spritesheets.find((entry) => entry.id === animation.spriteSheetId);
    if (!spritesheet) {
      return null;
    }
    const imageUrl = this.store.getRawAssetUrl(spritesheet.sourceAssetId);
    if (!imageUrl) {
      return null;
    }
    const frames = spritesheet.frames
      .filter((frame) => animation.frameIds.includes(frame.id))
      .sort((left, right) => animation.frameIds.indexOf(left.id) - animation.frameIds.indexOf(right.id));
    return {
      animation,
      imageUrl,
      frames,
    };
  }

  private resolveSlotAnimation(slot: PreviewSlot): AnimationDefinition | null {
    const snapshot = this.store.getState().snapshot;
    const animationId = getSlotAnimationId(
      slot,
      this.idleAnimationId,
      this.runSideAnimationId,
      this.jumpAnimationId,
      this.attackAnimationId,
    );
    return animationId ? snapshot.animations.find((entry) => entry.id === animationId) ?? null : null;
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return this.translator.t("editor.validation.duplicateCharacterName");
    }
    if (!this.idleAnimationId || !this.store.getAssetById(this.idleAnimationId) || !isAnimation(this.store.getAssetById(this.idleAnimationId)!)) {
      return this.translator.t("editor.validation.validIdleAnimation");
    }
    if (this.runSideAnimationId && !this.runSideFacing) {
      return this.translator.t("editor.validation.runSideFacingRequired");
    }
    return null;
  }

  private destroyGame(): void {
    if (this.destroyPreview) {
      this.destroyPreview();
      this.destroyPreview = null;
    }
    clearElement(this.previewHost);
  }
}

function getSlotAnimationId(
  slot: PreviewSlot,
  idleAnimationId: string | null,
  runSideAnimationId: string | null,
  jumpAnimationId: string | null,
  attackAnimationId: string | null,
): string | null {
  if (slot === "idle") {
    return idleAnimationId;
  }
  if (slot === "run_side") {
    return runSideAnimationId ?? idleAnimationId;
  }
  if (slot === "jump") {
    return jumpAnimationId ?? idleAnimationId;
  }
  return attackAnimationId ?? idleAnimationId;
}

function createMessageCard(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
