import type Phaser from "phaser";
import { isAnimation } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName, validateRequiredName } from "../../domain/editorValidators";
import type {
  AnimationDefinition,
  CharacterDefinition,
  CharacterSlot,
  RunSideFacing,
} from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { mountAnimationPreview } from "../spritesheet/animationPreview";

type PreviewSlot = "idle" | "run_side" | "jump" | "attack";

export class CharacterEditorView {
  private readonly root = createElement("section", "workspace-screen");
  private game: Phaser.Game | null = null;
  private readonly existingCharacter: CharacterDefinition | null;
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
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    if (asset && "idleAnimationId" in asset) {
      this.existingCharacter = asset;
      this.readOnly = true;
      this.draftName = asset.name;
      this.idleAnimationId = asset.idleAnimationId;
      this.runSideAnimationId = asset.runSideAnimationId;
      this.runSideFacing = asset.runSideFacing;
      this.jumpAnimationId = asset.jumpAnimationId;
      this.attackAnimationId = asset.attackAnimationId;
    } else if (routeId === "new") {
      this.existingCharacter = null;
      this.readOnly = false;
      this.draftName = buildUniqueAssetName("character", this.store.getAllAssets());
      this.idleAnimationId = null;
      this.runSideAnimationId = null;
      this.runSideFacing = null;
      this.jumpAnimationId = null;
      this.attackAnimationId = null;
    } else {
      this.existingCharacter = null;
      this.readOnly = true;
      this.draftName = "";
      this.idleAnimationId = null;
      this.runSideAnimationId = null;
      this.runSideFacing = null;
      this.jumpAnimationId = null;
      this.attackAnimationId = null;
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

    if (!this.readOnly && this.getAvailableAnimations().length === 0) {
      this.root.append(createMessageCard("No animations yet", "Necesitas al menos una animación activa para crear un personaje."));
      return;
    }

    const header = createElement("div", "workspace-header");
    const copy = createElement("div", "workspace-copy");
    copy.append(
      createElement("h2", "workspace-title", this.readOnly ? this.existingCharacter?.name ?? "Character" : "Create character"),
      createElement(
        "p",
        "workspace-subtitle",
        this.readOnly
          ? "Read only. El preview reproduce la animación asociada a cada slot."
          : "Idle es obligatorio. Run, Jump y Attack pueden faltar y harán fallback a idle.",
      ),
    );
    header.append(copy);

    const body = createElement("div", "workspace-body");
    const controls = createElement("div", "workspace-sidebar");
    const previewCard = createElement("div", "workspace-preview-card");
    const previewHost = createElement("div", "animation-preview");
    previewCard.append(previewHost);

    controls.append(
      buildTextField("Name", this.draftName, this.readOnly, (value) => {
        this.draftName = value;
      }, () => this.render()),
      this.buildAnimationSelect("Idle", this.idleAnimationId, true, (value) => {
        this.idleAnimationId = value;
      }),
      this.buildAnimationSelect("Run side", this.runSideAnimationId, false, (value) => {
        this.runSideAnimationId = value;
        if (!value) {
          this.runSideFacing = null;
        }
      }),
      this.buildAnimationSelect("Jump", this.jumpAnimationId, false, (value) => {
        this.jumpAnimationId = value;
      }),
      this.buildAnimationSelect("Attack", this.attackAnimationId, false, (value) => {
        this.attackAnimationId = value;
      }),
    );

    if (this.runSideAnimationId) {
      const facingField = createElement("label", "form-field");
      facingField.append(createElement("span", "form-label", "Run side facing"));
      const select = createElement("select", "text-input") as HTMLSelectElement;
      select.disabled = this.readOnly;
      select.append(new Option("Select one", ""), new Option("left", "left"), new Option("right", "right"));
      select.value = this.runSideFacing ?? "";
      select.addEventListener("change", () => {
        this.runSideFacing = select.value === "" ? null : select.value as RunSideFacing;
        this.render();
      });
      facingField.append(select);
      controls.append(facingField);
    }

    const previewButtons = createElement("div", "workspace-button-row");
    (["idle", "run_side", "jump", "attack"] as CharacterSlot[]).forEach((slot) => {
      const label = slot === "run_side" ? "Run" : slot.charAt(0).toUpperCase() + slot.slice(1);
      const button = createButton(label, this.previewSlot === slot ? "tab-button is-active" : "tab-button");
      button.addEventListener("click", () => {
        this.previewSlot = slot;
        this.render();
      });
      previewButtons.append(button);
    });
    controls.append(previewButtons);

    const playbackButtons = createElement("div", "workspace-button-row");
    const previewButton = createButton("Preview", "secondary-button");
    previewButton.addEventListener("click", () => {
      this.playing = true;
      this.render();
    });
    const pauseButton = createButton("Pause", "secondary-button");
    pauseButton.addEventListener("click", () => {
      this.playing = false;
      this.render();
    });
    playbackButtons.append(previewButton, pauseButton);
    controls.append(playbackButtons);

    if (!this.readOnly) {
      const save = createButton("Save character", "primary-button");
      save.addEventListener("click", async () => {
        const error = this.validate();
        if (error) {
          window.alert(error);
          return;
        }
        const now = new Date().toISOString();
        const definition: CharacterDefinition = {
          id: createEditorId(),
          name: this.draftName.trim(),
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
      controls.append(save);
    } else {
      const openLibrary = createButton("Back to library", "secondary-button");
      openLibrary.addEventListener("click", () => this.store.navigate({ kind: "library" }));
      controls.append(openLibrary);
    }

    body.append(controls, previewCard);
    this.root.append(header, body);

    const playback = this.resolvePreviewAnimation();
    if (!playback) {
      previewCard.append(createMessageCard("No preview", "Selecciona una animación idle para poder previsualizar el personaje."));
      return;
    }

    this.game = mountAnimationPreview({
      container: previewHost,
      imageUrl: playback.imageUrl,
      frames: playback.frames,
      frameDurationMs: playback.animation.frameDurationMs,
      loop: playback.animation.loop,
      playing: this.playing,
    });
  }

  private buildAnimationSelect(
    label: string,
    value: string | null,
    required: boolean,
    onChange: (value: string | null) => void,
  ): HTMLElement {
    const field = createElement("label", "form-field");
    field.append(createElement("span", "form-label", label));
    const select = createElement("select", "text-input") as HTMLSelectElement;
    select.disabled = this.readOnly;
    if (!required) {
      select.append(new Option("Use idle fallback", ""));
    } else {
      select.append(new Option("Select one", ""));
    }

    this.getAnimationOptions().forEach((entry) => {
      select.append(new Option(entry.name, entry.id));
    });
    select.value = value ?? "";
    select.addEventListener("change", () => {
      onChange(select.value === "" ? null : select.value);
      this.render();
    });
    field.append(select);
    return field;
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
    const nameError = validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return "El nombre del personaje ya existe.";
    }
    if (!this.idleAnimationId || !this.store.getAssetById(this.idleAnimationId) || !isAnimation(this.store.getAssetById(this.idleAnimationId)!)) {
      return "Debes asignar una animación idle válida.";
    }
    if (this.runSideAnimationId && !this.runSideFacing) {
      return "Si hay run side, también debes indicar su facing.";
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

function buildTextField(
  label: string,
  value: string,
  disabled: boolean,
  onChange: (value: string) => void,
  onRender: () => void,
): HTMLElement {
  const field = createElement("label", "form-field");
  field.append(createElement("span", "form-label", label));
  const input = createElement("input", "text-input") as HTMLInputElement;
  input.type = "text";
  input.value = value;
  input.disabled = disabled;
  input.addEventListener("change", () => {
    onChange(input.value);
    if (!disabled) {
      onRender();
    }
  });
  field.append(input);
  return field;
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
