import type Phaser from "phaser";
import { isAnimation, isSpriteSheet } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName, validatePositiveInteger, validateRequiredName } from "../../domain/editorValidators";
import type { AnimationDefinition, SpriteFrameRecord, SpriteSheetDefinition } from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createCroppedThumbnail, loadImage } from "../../shared/loadImage";
import { mountAnimationPreview } from "./animationPreview";

export class AnimationEditorPanel {
  private readonly root = createElement("section", "workspace-screen");
  private game: Phaser.Game | null = null;
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

    this.container.append(this.root);
    this.render();
  }

  destroy(): void {
    this.destroyGame();
    clearElement(this.container);
  }

  private render(): void {
    this.destroyGame();
    clearElement(this.root);

    if (!this.sourceSpriteSheet || !this.imageUrl) {
      this.root.append(createMessageCard("Animación no disponible", "Abre un spritesheet activo o una animación ya guardada."));
      return;
    }

    const header = createElement("div", "workspace-header");
    const copy = createElement("div", "workspace-copy");
    copy.append(
      createElement("h2", "workspace-title", this.readOnly ? this.existingAnimation?.name ?? "Animation" : "Create animation"),
      createElement(
        "p",
        "workspace-subtitle",
        this.readOnly
          ? `Read only. ${this.frameIds.length} frames guardados.`
          : `Selecciona frames en orden. Si vuelves a clicar un frame, se elimina de la secuencia.`,
      ),
    );
    header.append(copy);

    const body = createElement("div", "workspace-body");
    const controls = createElement("div", "workspace-sidebar");
    const previewCard = createElement("div", "workspace-preview-card");
    const previewHost = createElement("div", "animation-preview");
    previewCard.append(previewHost);

    controls.append(
      this.buildTextField("Name", this.draftName, this.readOnly, (value) => {
        this.draftName = value;
      }),
      this.buildTextField("Frame duration (ms)", this.frameDurationMs, this.readOnly, (value) => {
        this.frameDurationMs = value;
      }),
    );

    const loopField = createElement("label", "checkbox-field");
    const loopInput = createElement("input") as HTMLInputElement;
    loopInput.type = "checkbox";
    loopInput.checked = this.loop;
    loopInput.disabled = this.readOnly;
    loopInput.addEventListener("change", () => {
      this.loop = loopInput.checked;
      this.render();
    });
    loopField.append(loopInput, createElement("span", "form-label", "Loop"));
    controls.append(loopField);

    const controlRow = createElement("div", "workspace-button-row");
    const playButton = createButton("Preview", "secondary-button");
    playButton.addEventListener("click", () => {
      this.playing = true;
      this.render();
    });
    const pauseButton = createButton("Pause", "secondary-button");
    pauseButton.addEventListener("click", () => {
      this.playing = false;
      this.render();
    });
    controlRow.append(playButton, pauseButton);
    controls.append(controlRow);

    if (!this.readOnly) {
      const save = createButton("Save animation", "primary-button");
      save.addEventListener("click", async () => {
        const error = this.validate();
        if (error) {
          window.alert(error);
          return;
        }
        const now = new Date().toISOString();
        const definition: AnimationDefinition = {
          id: createEditorId(),
          name: this.draftName.trim(),
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
      controls.append(save);
    } else {
      const openLibrary = createButton("Back to library", "secondary-button");
      openLibrary.addEventListener("click", () => this.store.navigate({ kind: "library" }));
      controls.append(openLibrary);
    }

    const frameStrip = createElement("div", "frame-strip");
    this.getFrames().forEach((frame) => frameStrip.append(this.buildFrameCard(frame)));
    previewCard.append(frameStrip);

    body.append(controls, previewCard);
    this.root.append(header, body);

    const playbackFrames = this.getFrames()
      .filter((frame) => this.frameIds.includes(frame.id))
      .sort((left, right) => this.frameIds.indexOf(left.id) - this.frameIds.indexOf(right.id));

    this.game = mountAnimationPreview({
      container: previewHost,
      imageUrl: this.imageUrl,
      frames: playbackFrames,
      frameDurationMs: Number.parseInt(this.frameDurationMs, 10) || 120,
      loop: this.loop,
      playing: this.playing,
    });
  }

  private buildTextField(
    label: string,
    value: string,
    disabled: boolean,
    onChange: (value: string) => void,
  ): HTMLElement {
    const field = createElement("label", "form-field");
    field.append(createElement("span", "form-label", label));
    const input = createElement("input", "text-input") as HTMLInputElement;
    input.type = "text";
    input.value = value;
    input.disabled = disabled;
    input.addEventListener("change", () => {
      onChange(input.value);
      this.render();
    });
    field.append(input);
    return field;
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
      button.append(createElement("div", "frame-thumb-placeholder", `Frame ${frame.id.slice(0, 4)}`));
    }

    const caption = createElement("div", "frame-card-meta");
    caption.append(
      createElement("strong", "frame-card-title", frame.label ?? frame.id.slice(0, 8)),
      createElement(
        "span",
        "frame-card-copy",
        selectedIndex >= 0 ? `Selected #${selectedIndex + 1}` : "Not selected",
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
    const nameError = validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return "El nombre de la animación ya existe.";
    }
    const durationError = validatePositiveInteger(this.frameDurationMs, "Frame duration");
    if (durationError) {
      return durationError;
    }
    if (this.frameIds.length === 0) {
      return "Selecciona al menos un frame.";
    }
    return null;
  }

  private destroyGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

function createMessageCard(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
