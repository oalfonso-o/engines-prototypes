import { buildUniqueAssetName } from "../../domain/editorValidators";
import type { RawAssetRecord, SpriteSheetDefinition } from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { buildUniformGrid } from "../../shared/geometry";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createTextFieldController } from "../../shared/formControls";
import { createEditorId } from "../../domain/editorIds";
import type { GridPreviewCell } from "../tileset/tilesetGrid";
import { mountSpriteSheetGridPreview } from "./spritesheetGrid";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";

export class SpriteSheetMappingWorkspace {
  private readonly root = createElement("section", "workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly header = createElement("div", "workspace-header");
  private readonly copy = createElement("div", "workspace-copy");
  private readonly title = createElement("h2", "workspace-title");
  private readonly subtitle = createElement("p", "workspace-subtitle");
  private readonly overflowBadge = createElement("span", "status-badge badge-warning");
  private readonly body = createElement("div", "workspace-body");
  private readonly controls = createElement("div", "workspace-sidebar");
  private readonly previewCard = createElement("div", "workspace-preview-card");
  private readonly previewHost = createElement("div", "workspace-preview");
  private readonly nameField = createTextFieldController("", {
    onChange: (value) => {
      this.draftName = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly cellWidthField = createTextFieldController("", {
    onChange: (value) => {
      this.cellWidth = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly cellHeightField = createTextFieldController("", {
    onChange: (value) => {
      this.cellHeight = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly offsetXField = createTextFieldController("", {
    onChange: (value) => {
      this.offsetX = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly offsetYField = createTextFieldController("", {
    onChange: (value) => {
      this.offsetY = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly summary = createElement("p", "workspace-summary");
  private readonly actionRow = createElement("div", "workspace-button-row");
  private readonly generateButton = createButton("", "secondary-button");
  private readonly saveButton = createButton("", "primary-button");
  private readonly createAnimationButton = createButton("", "primary-button");
  private readonly backButton = createButton("", "secondary-button");
  private destroyPreview: (() => void) | null = null;
  private readonly sourceRawAsset: RawAssetRecord | null;
  private readonly existingSpriteSheet: SpriteSheetDefinition | null;
  private readonly imageUrl: string | null;
  private readonly readOnly: boolean;
  private draftName: string;
  private cellWidth: string;
  private cellHeight: string;
  private offsetX: string;
  private offsetY: string;
  private cells: GridPreviewCell[] = [];
  private hasOverflow = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    if (asset && "frames" in asset) {
      this.existingSpriteSheet = asset;
      this.sourceRawAsset = this.store.getState().snapshot.rawAssets.find((entry) => entry.id === asset.sourceAssetId) ?? null;
      this.imageUrl = this.sourceRawAsset ? this.store.getRawAssetUrl(this.sourceRawAsset.id) : null;
      this.readOnly = true;
      this.draftName = asset.name;
      this.cellWidth = String(asset.cellWidth);
      this.cellHeight = String(asset.cellHeight);
      this.offsetX = String(asset.offsetX);
      this.offsetY = String(asset.offsetY);
      this.cells = asset.frames.map((frame) => ({ id: frame.id, rect: frame.rect, active: true }));
    } else if (asset && "sourceKind" in asset && asset.sourceKind === "spritesheet-source") {
      this.existingSpriteSheet = null;
      this.sourceRawAsset = asset;
      this.imageUrl = this.store.getRawAssetUrl(asset.id);
      this.readOnly = false;
      this.draftName = buildUniqueAssetName(`${asset.name}-spritesheet`, this.store.getAllAssets());
      this.cellWidth = String(Math.max(1, Math.min(16, asset.width)));
      this.cellHeight = String(Math.max(1, Math.min(16, asset.height)));
      this.offsetX = "0";
      this.offsetY = "0";
      this.generateGrid();
    } else {
      this.existingSpriteSheet = null;
      this.sourceRawAsset = null;
      this.imageUrl = null;
      this.readOnly = true;
      this.draftName = "";
      this.cellWidth = "16";
      this.cellHeight = "16";
      this.offsetX = "0";
      this.offsetY = "0";
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
    this.header.append(this.copy, this.overflowBadge);

    this.generateButton.addEventListener("click", () => {
      this.generateGrid();
      this.render();
    });
    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }
      if (!this.sourceRawAsset) {
        return;
      }

      const now = new Date().toISOString();
      const definition: SpriteSheetDefinition = {
        id: createEditorId(),
        name: this.draftName.trim(),
        storageRoot: "user",
        folderId: this.sourceRawAsset.folderId,
        relativePath: joinRelativePath(
          this.store.getFolderById(this.sourceRawAsset.folderId ?? "")?.relativePath ?? "",
          buildRelativeFilePath(this.draftName.trim(), ".json"),
        ),
        sourceAssetId: this.sourceRawAsset.id,
        cellWidth: Number.parseInt(this.cellWidth, 10),
        cellHeight: Number.parseInt(this.cellHeight, 10),
        offsetX: Number.parseInt(this.offsetX, 10),
        offsetY: Number.parseInt(this.offsetY, 10),
        frames: this.cells
          .filter((cell) => cell.active)
          .map((cell) => ({
            id: cell.id,
            rect: cell.rect,
            label: null,
          })),
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await this.store.saveSpriteSheet(definition);
      this.store.setLibraryTab("game");
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "spritesheet", id: definition.id });
    });
    this.createAnimationButton.addEventListener("click", () => {
      if (this.existingSpriteSheet) {
        this.store.navigate({ kind: "animation", id: this.existingSpriteSheet.id });
      }
    });
    this.backButton.addEventListener("click", () => this.store.navigate({ kind: "library" }));

    this.actionRow.append(this.generateButton, this.saveButton, this.createAnimationButton, this.backButton);
    this.controls.append(
      this.nameField.field,
      this.cellWidthField.field,
      this.cellHeightField.field,
      this.offsetXField.field,
      this.offsetYField.field,
      this.summary,
      this.actionRow,
    );

    this.previewCard.append(this.previewHost);
    this.body.append(this.controls, this.previewCard);
    this.root.append(this.emptyStateHost, this.header, this.body);
  }

  private render(): void {
    this.destroyGame();

    if (!this.sourceRawAsset) {
      this.header.hidden = true;
      this.body.hidden = true;
      clearElement(this.emptyStateHost);
      this.emptyStateHost.append(
        createMessageCard(
          this.translator.t("editor.workspace.spritesheet.unavailableTitle"),
          this.translator.t("editor.workspace.spritesheet.unavailableBody"),
        ),
      );
      return;
    }

    clearElement(this.emptyStateHost);
    this.header.hidden = false;
    this.body.hidden = false;
    this.overflowBadge.textContent = this.translator.t("editor.workspace.spritesheet.overflowIgnored");
    this.nameField.label.textContent = this.translator.t("editor.workspace.spritesheet.labels.name");
    this.cellWidthField.label.textContent = this.translator.t("editor.workspace.spritesheet.labels.cellWidth");
    this.cellHeightField.label.textContent = this.translator.t("editor.workspace.spritesheet.labels.cellHeight");
    this.offsetXField.label.textContent = this.translator.t("editor.workspace.spritesheet.labels.offsetX");
    this.offsetYField.label.textContent = this.translator.t("editor.workspace.spritesheet.labels.offsetY");
    this.generateButton.textContent = this.translator.t("editor.workspace.spritesheet.generateGrid");
    this.saveButton.textContent = this.translator.t("editor.workspace.spritesheet.save");
    this.createAnimationButton.textContent = this.translator.t("editor.workspace.spritesheet.createAnimation");
    this.backButton.textContent = this.translator.t("editor.common.backToLibrary");
    this.title.textContent = this.readOnly
      ? this.existingSpriteSheet?.name ?? this.translator.t("editor.workspace.spritesheet.titleReadOnly")
      : this.translator.t("editor.workspace.spritesheet.titleCreate");
    this.subtitle.textContent = this.readOnly
      ? this.translator.t("editor.workspace.spritesheet.subtitleReadOnly", { count: this.cells.length })
      : this.translator.t("editor.workspace.spritesheet.subtitleCreate", { name: this.sourceRawAsset.name });
    this.overflowBadge.hidden = !this.hasOverflow || this.readOnly;
    this.nameField.sync(this.draftName, this.readOnly);
    this.cellWidthField.sync(this.cellWidth, this.readOnly);
    this.cellHeightField.sync(this.cellHeight, this.readOnly);
    this.offsetXField.sync(this.offsetX, this.readOnly);
    this.offsetYField.sync(this.offsetY, this.readOnly);
    this.summary.textContent = this.translator.t("editor.workspace.spritesheet.activeFrames", {
      count: this.cells.filter((cell) => cell.active).length,
    });
    this.generateButton.hidden = this.readOnly;
    this.saveButton.hidden = this.readOnly;
    this.createAnimationButton.hidden = !this.readOnly;
    this.createAnimationButton.disabled = Boolean(this.existingSpriteSheet?.archivedAt);
    this.backButton.hidden = !this.readOnly;

    clearElement(this.previewCard);
    this.previewCard.append(this.previewHost);
    if (this.imageUrl) {
      this.destroyPreview = mountSpriteSheetGridPreview({
        container: this.previewHost,
        imageUrl: this.imageUrl,
        imageWidth: this.sourceRawAsset.width,
        imageHeight: this.sourceRawAsset.height,
        cells: this.cells,
        readOnly: this.readOnly,
        activeStrokeColor: 0x39d0ff,
        inactiveStrokeColor: 0x4b5b6d,
        fillColor: 0x16b8d9,
        onToggle: (cellId) => {
          if (this.readOnly) {
            return;
          }
          this.cells = this.cells.map((cell) => (cell.id === cellId ? { ...cell, active: !cell.active } : cell));
          this.render();
        },
      });
    } else {
      this.previewCard.append(
        createMessageCard(
          this.translator.t("editor.workspace.spritesheet.noPreviewTitle"),
          this.translator.t("editor.workspace.spritesheet.noPreviewBody"),
        ),
      );
    }
  }

  private generateGrid(): void {
    if (!this.sourceRawAsset) {
      return;
    }

    const parsedCellWidth = Number.parseInt(this.cellWidth, 10);
    const parsedCellHeight = Number.parseInt(this.cellHeight, 10);
    const parsedOffsetX = Number.parseInt(this.offsetX, 10);
    const parsedOffsetY = Number.parseInt(this.offsetY, 10);
    if (
      !Number.isInteger(parsedCellWidth) ||
      !Number.isInteger(parsedCellHeight) ||
      !Number.isInteger(parsedOffsetX) ||
      !Number.isInteger(parsedOffsetY) ||
      parsedCellWidth <= 0 ||
      parsedCellHeight <= 0 ||
      parsedOffsetX < 0 ||
      parsedOffsetY < 0
    ) {
      return;
    }

    const grid = buildUniformGrid(
      this.sourceRawAsset.width,
      this.sourceRawAsset.height,
      parsedCellWidth,
      parsedCellHeight,
      parsedOffsetX,
      parsedOffsetY,
    );
    this.hasOverflow = grid.hasOverflow;
    this.cells = grid.cells.map((cell) => ({
      id: cell.id,
      rect: cell.rect,
      active: true,
    }));
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return this.translator.t("editor.validation.duplicateSpritesheetName");
    }
    const widthError = this.translator.validatePositiveInteger(
      this.cellWidth,
      this.translator.t("editor.workspace.spritesheet.labels.cellWidth"),
    );
    if (widthError) {
      return widthError;
    }
    const heightError = this.translator.validatePositiveInteger(
      this.cellHeight,
      this.translator.t("editor.workspace.spritesheet.labels.cellHeight"),
    );
    if (heightError) {
      return heightError;
    }
    const offsetXError = this.translator.validateNonNegativeInteger(
      this.offsetX,
      this.translator.t("editor.workspace.spritesheet.labels.offsetX"),
    );
    if (offsetXError) {
      return offsetXError;
    }
    const offsetYError = this.translator.validateNonNegativeInteger(
      this.offsetY,
      this.translator.t("editor.workspace.spritesheet.labels.offsetY"),
    );
    if (offsetYError) {
      return offsetYError;
    }
    if (this.cells.filter((cell) => cell.active).length === 0) {
      return this.translator.t("editor.validation.atLeastOneActiveFrame");
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
