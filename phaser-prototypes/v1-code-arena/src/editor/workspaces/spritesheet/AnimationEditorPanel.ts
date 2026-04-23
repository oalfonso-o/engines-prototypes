import { isAnimation, isSpriteSheet } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName } from "../../domain/editorValidators";
import type { AnimationDefinition, SpriteFrameRecord, SpriteSheetDefinition } from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createCheckboxFieldController, createTextFieldController } from "../../shared/formControls";
import { createCroppedThumbnail, loadImage } from "../../shared/loadImage";
import { mountAnimationPreview } from "./animationPreview";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";

export class AnimationEditorPanel {
  private readonly root = createElement("section", "workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly header = createElement("div", "workspace-header");
  private readonly copy = createElement("div", "workspace-copy");
  private readonly title = createElement("h2", "workspace-title");
  private readonly subtitle = createElement("p", "workspace-subtitle");
  private readonly body = createElement("div", "workspace-body");
  private readonly controls = createElement("div", "workspace-sidebar");
  private readonly previewCard = createElement("div", "workspace-preview-card");
  private readonly previewHost = createElement("div", "animation-preview");
  private readonly frameStrip = createElement("div", "frame-strip");
  private readonly nameField = createTextFieldController("", {
    onChange: (value) => {
      this.draftName = value;
      this.render();
    },
  });
  private readonly frameDurationField = createTextFieldController("", {
    onChange: (value) => {
      this.frameDurationMs = value;
      this.render();
    },
  });
  private readonly loopField = createCheckboxFieldController("", (checked) => {
    this.loop = checked;
    this.render();
  });
  private readonly playbackRow = createElement("div", "workspace-button-row");
  private readonly previewButton = createButton("", "secondary-button");
  private readonly pauseButton = createButton("", "secondary-button");
  private readonly saveButton = createButton("", "primary-button");
  private readonly backButton = createButton("", "secondary-button");
  private destroyPreview: (() => void) | null = null;
  private readonly sourceSpriteSheet: SpriteSheetDefinition | null;
  private readonly existingAnimation: AnimationDefinition | null;
  private readonly imageUrl: string | null;
  private sourceImage: HTMLImageElement | null = null;
  private readonly readOnly: boolean;
  private draftName: string;
  private frameDurationMs: string;
  private loop: boolean;
  private frameIds: string[];
  private playing = true;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    if (asset && isAnimation(asset)) {
      this.existingAnimation = asset;
      this.sourceSpriteSheet = this.store.getState().snapshot.spritesheets.find((entry) => entry.id === asset.spriteSheetId) ?? null;
      this.readOnly = true;
      this.draftName = asset.name;
      this.frameDurationMs = String(asset.frameDurationMs);
      this.loop = asset.loop;
      this.frameIds = [...asset.frameIds];
    } else if (asset && isSpriteSheet(asset)) {
      this.existingAnimation = null;
      this.sourceSpriteSheet = asset.archivedAt ? null : asset;
      this.readOnly = false;
      this.draftName = buildUniqueAssetName(`${asset.name}-animation`, this.store.getAllAssets());
      this.frameDurationMs = "120";
      this.loop = true;
      this.frameIds = [];
    } else {
      this.existingAnimation = null;
      this.sourceSpriteSheet = null;
      this.readOnly = true;
      this.draftName = "";
      this.frameDurationMs = "120";
      this.loop = true;
      this.frameIds = [];
    }

    const sourceSpriteSheet = this.sourceSpriteSheet;
    const rawId = sourceSpriteSheet
      ? this.store.getState().snapshot.rawAssets.find((entry) => entry.id === sourceSpriteSheet.sourceAssetId)?.id ?? null
      : null;
    this.imageUrl = rawId ? this.store.getRawAssetUrl(rawId) : null;

    if (this.imageUrl) {
      void loadImage(this.imageUrl).then((image) => {
        this.sourceImage = image;
        this.render();
      });
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
    this.copy.append(this.title, this.subtitle);
    this.header.append(this.copy);

    this.previewButton.addEventListener("click", () => {
      this.playing = true;
      this.render();
    });
    this.pauseButton.addEventListener("click", () => {
      this.playing = false;
      this.render();
    });
    this.playbackRow.append(this.previewButton, this.pauseButton);

    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }
      const now = new Date().toISOString();
      const definition: AnimationDefinition = {
        id: createEditorId(),
        name: this.draftName.trim(),
        storageRoot: "user",
        folderId: this.sourceSpriteSheet!.folderId,
        relativePath: joinRelativePath(
          this.store.getFolderById(this.sourceSpriteSheet!.folderId ?? "")?.relativePath ?? "",
          buildRelativeFilePath(this.draftName.trim(), ".json"),
        ),
        spriteSheetId: this.sourceSpriteSheet!.id,
        frameIds: [...this.frameIds],
        frameDurationMs: Number.parseInt(this.frameDurationMs, 10),
        loop: this.loop,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.store.saveAnimation(definition);
      this.store.setLibraryTab("game");
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "animation", id: definition.id });
    });
    this.backButton.addEventListener("click", () => this.store.navigate({ kind: "library" }));

    this.controls.append(
      this.nameField.field,
      this.frameDurationField.field,
      this.loopField.field,
      this.playbackRow,
      this.saveButton,
      this.backButton,
    );

    this.previewCard.append(this.previewHost, this.frameStrip);
    this.body.append(this.controls, this.previewCard);
    this.root.append(this.emptyStateHost, this.header, this.body);
  }

  private render(): void {
    this.destroyGame();

    if (!this.sourceSpriteSheet || !this.imageUrl) {
      this.header.hidden = true;
      this.body.hidden = true;
      clearElement(this.emptyStateHost);
      this.emptyStateHost.append(
        createMessageCard(
          this.translator.t("editor.workspace.animation.unavailableTitle"),
          this.translator.t("editor.workspace.animation.unavailableBody"),
        ),
      );
      return;
    }

    clearElement(this.emptyStateHost);
    this.header.hidden = false;
    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.animation.labels.name");
    this.frameDurationField.label.textContent = this.translator.t("editor.workspace.animation.labels.frameDuration");
    this.loopField.label.textContent = this.translator.t("editor.workspace.animation.labels.loop");
    this.previewButton.textContent = this.translator.t("editor.workspace.animation.preview");
    this.pauseButton.textContent = this.translator.t("editor.workspace.animation.pause");
    this.saveButton.textContent = this.translator.t("editor.workspace.animation.save");
    this.backButton.textContent = this.translator.t("editor.common.backToLibrary");
    this.title.textContent = this.readOnly
      ? this.existingAnimation?.name ?? this.translator.t("editor.workspace.animation.titleReadOnly")
      : this.translator.t("editor.workspace.animation.titleCreate");
    this.subtitle.textContent = this.readOnly
      ? this.translator.t("editor.workspace.animation.subtitleReadOnly", { count: this.frameIds.length })
      : this.translator.t("editor.workspace.animation.subtitleCreate");
    this.nameField.sync(this.draftName, this.readOnly);
    this.frameDurationField.sync(this.frameDurationMs, this.readOnly);
    this.loopField.sync(this.loop, this.readOnly);
    this.saveButton.hidden = this.readOnly;
    this.backButton.hidden = !this.readOnly;
    clearElement(this.previewCard);
    this.previewCard.append(this.previewHost, this.frameStrip);

    clearElement(this.frameStrip);
    this.getFrames().forEach((frame) => this.frameStrip.append(this.buildFrameCard(frame)));

    const playbackFrames = this.getFrames()
      .filter((frame) => this.frameIds.includes(frame.id))
      .sort((left, right) => this.frameIds.indexOf(left.id) - this.frameIds.indexOf(right.id));

    if (playbackFrames.length === 0) {
      this.previewCard.append(
        createMessageCard(
          this.translator.t("editor.workspace.animation.noPreviewTitle"),
          this.translator.t("editor.workspace.animation.noPreviewBody"),
        ),
      );
      return;
    }

    this.destroyPreview = mountAnimationPreview({
      container: this.previewHost,
      imageUrl: this.imageUrl,
      frames: playbackFrames,
      frameDurationMs: Number.parseInt(this.frameDurationMs, 10) || 120,
      loop: this.loop,
      playing: this.playing,
    });
  }

  private buildFrameCard(frame: SpriteFrameRecord): HTMLElement {
    const selectedIndex = this.frameIds.indexOf(frame.id);
    const button = createElement(
      "button",
      selectedIndex >= 0 ? "frame-card is-selected" : "frame-card",
    ) as HTMLButtonElement;
    button.type = "button";
    button.disabled = this.readOnly;
    button.addEventListener("click", () => {
      if (this.readOnly) {
        return;
      }

      if (selectedIndex >= 0) {
        this.frameIds = this.frameIds.filter((entryId) => entryId !== frame.id);
      } else {
        this.frameIds = [...this.frameIds, frame.id];
      }
      this.render();
    });

    if (this.sourceImage) {
      button.append(createCroppedThumbnail(this.sourceImage, frame.rect, 88, 88));
    } else {
      button.append(
        createElement(
          "div",
          "frame-thumb-placeholder",
          this.translator.t("editor.workspace.animation.framePlaceholder", { id: frame.id.slice(0, 4) }),
        ),
      );
    }

    const caption = createElement("div", "frame-card-meta");
    caption.append(
      createElement("strong", "frame-card-title", frame.label ?? frame.id.slice(0, 8)),
      createElement(
        "span",
        "frame-card-copy",
        selectedIndex >= 0
          ? this.translator.t("editor.workspace.animation.selected", { index: selectedIndex + 1 })
          : this.translator.t("editor.workspace.animation.notSelected"),
      ),
    );
    button.append(caption);
    return button;
  }

  private getFrames(): SpriteFrameRecord[] {
    if (!this.sourceSpriteSheet) {
      return [];
    }
    return this.sourceSpriteSheet.frames;
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return this.translator.t("editor.validation.duplicateAnimationName");
    }
    const durationError = this.translator.validatePositiveInteger(
      this.frameDurationMs,
      this.translator.t("editor.workspace.animation.labels.frameDuration"),
    );
    if (durationError) {
      return durationError;
    }
    if (this.frameIds.length === 0) {
      return this.translator.t("editor.validation.atLeastOneFrame");
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

function createMessageCard(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
