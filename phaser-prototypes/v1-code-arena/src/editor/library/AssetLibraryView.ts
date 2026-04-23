import type { RawAssetKind } from "../domain/editorTypes";
import { importPngAsset } from "../import/importPngAsset";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../shared/formControls";
import { openAssetSelection } from "../shared/openAssetSelection";
import { normalizeAssetName } from "../domain/editorValidators";
import { AssetDetailsPanel } from "./AssetDetailsPanel";
import { buildRawAssetRows, filterLibraryRows } from "./AssetLibraryFilters";
import { buildGameAssetRows } from "./buildGameAssetRows";
import type { EditorTranslator } from "../i18n/EditorTranslator";

export class AssetLibraryView {
  private readonly toolbar = createElement("div", "library-toolbar");
  private readonly listPanel = createElement("section", "library-list-panel");
  private readonly detailPanelElement = createElement("aside", "library-detail-slot");
  private readonly detailsPanel: AssetDetailsPanel;
  private readonly modalLayer = createElement("div", "modal-layer");
  private readonly searchWrap = createElement("div", "toolbar-search");
  private readonly searchInput = createElement("input", "search-input") as HTMLInputElement;
  private readonly tabBar = createElement("div", "library-tabbar");
  private readonly rawTab = createButton("", "tab-button");
  private readonly gameTab = createButton("", "tab-button");
  private readonly actions = createElement("div", "toolbar-actions");
  private readonly importButton = createButton("", "primary-button");
  private readonly createCharacterButton = createButton("", "secondary-button");
  private readonly createMapButton = createButton("", "secondary-button");
  private readonly importBackdrop = createElement("div", "modal-backdrop");
  private readonly importDialog = createElement("div", "modal-dialog");
  private readonly importTitle = createElement("h3", "modal-title");
  private readonly importForm = createElement("div", "modal-form");
  private readonly importFileField = createField();
  private readonly importFileInput = createElement("input", "text-input") as HTMLInputElement;
  private readonly importNameField = createTextFieldController("", {
    onInput: (value) => this.store.updateImportDraft({ name: value, error: null }),
  });
  private readonly importKindField = createSelectFieldController("", (value) => {
    this.store.updateImportDraft({ sourceKind: value === "" ? null : value as RawAssetKind, error: null });
  });
  private readonly importError = createElement("p", "form-error");
  private readonly importActions = createElement("div", "modal-actions");
  private readonly cancelImportButton = createButton("", "ghost-button");
  private readonly saveImportButton = createButton("", "primary-button");

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
  ) {
    this.detailsPanel = new AssetDetailsPanel(this.detailPanelElement, this.store, this.translator);
    this.buildToolbar();
    this.buildImportModal();
    this.container.className = "library-screen";
    this.container.append(this.toolbar, this.listPanel, this.detailPanelElement, this.modalLayer);
  }

  update(): void {
    const state = this.store.getState();
    this.renderToolbar();
    this.renderList();
    this.detailsPanel.update(state, null);
    this.renderImportModal();
  }

  destroy(): void {
    clearElement(this.container);
  }

  private renderToolbar(): void {
    const state = this.store.getState();
    this.searchInput.placeholder = this.translator.t("editor.library.searchPlaceholder");
    this.rawTab.textContent = this.translator.t("editor.library.tabs.raw");
    this.gameTab.textContent = this.translator.t("editor.library.tabs.game");
    this.importButton.textContent = this.translator.t("editor.library.actions.importPng");
    this.createCharacterButton.textContent = this.translator.t("editor.library.actions.createCharacter");
    this.createMapButton.textContent = this.translator.t("editor.library.actions.createMap");
    if (this.searchInput.value !== state.searchQuery) {
      this.searchInput.value = state.searchQuery;
    }

    this.rawTab.className = state.libraryTab === "raw" ? "tab-button is-active" : "tab-button";
    this.gameTab.className = state.libraryTab === "game" ? "tab-button is-active" : "tab-button";
  }

  private buildToolbar(): void {
    this.searchInput.type = "search";
    this.searchInput.addEventListener("input", () => this.store.setSearchQuery(this.searchInput.value));
    this.searchWrap.append(this.searchInput);

    this.rawTab.addEventListener("click", () => this.store.setLibraryTab("raw"));
    this.gameTab.addEventListener("click", () => this.store.setLibraryTab("game"));
    this.tabBar.append(this.rawTab, this.gameTab);

    this.importButton.addEventListener("click", () => this.store.openImportModal());
    this.createCharacterButton.addEventListener("click", () => this.store.navigate({ kind: "character", id: "new" }));
    this.createMapButton.addEventListener("click", () => this.store.navigate({ kind: "map", id: "new" }));
    this.actions.append(this.importButton, this.createCharacterButton, this.createMapButton);

    this.toolbar.append(this.searchWrap, this.tabBar, this.actions);
  }

  private buildImportModal(): void {
    this.modalLayer.hidden = true;
    this.importBackdrop.addEventListener("click", () => this.store.closeImportModal());

    this.importFileInput.type = "file";
    this.importFileInput.accept = "image/png";
    this.importFileInput.addEventListener("change", () => {
      const file = this.importFileInput.files?.[0] ?? null;
      if (!file) {
        this.store.updateImportDraft({ file: null, name: "", error: null });
        return;
      }

      const suggestedName = file.name.replace(/\.png$/i, "");
      this.store.updateImportDraft({
        file,
        name: suggestedName,
        error: isPngFile(file) ? null : this.translator.t("editor.library.modal.errors.onlyPng"),
      });
    });
    this.importFileField.field.append(this.importFileField.label, this.importFileInput);

    this.importKindField.sync([
      { label: this.translator.t("editor.common.selectOne"), value: "" },
      { label: this.translator.t("editor.library.modal.tilesetSource"), value: "tileset-source" },
      { label: this.translator.t("editor.library.modal.spritesheetSource"), value: "spritesheet-source" },
      { label: this.translator.t("editor.library.modal.imageSource"), value: "image-source" },
    ], "", false);

    this.importForm.append(
      this.importFileField.field,
      this.importNameField.field,
      this.importKindField.field,
      this.importError,
    );

    this.cancelImportButton.addEventListener("click", () => this.store.closeImportModal());
    this.saveImportButton.addEventListener("click", async () => {
      const latestDraft = this.store.getImportDraft();
      const latestError = resolveImportError(
        this.translator,
        this.store,
        latestDraft.file,
        latestDraft.name,
        latestDraft.sourceKind,
        latestDraft.error,
      );
      if (latestError || !latestDraft.file || !latestDraft.sourceKind) {
        this.store.updateImportDraft({ error: latestError });
        return;
      }

      try {
        const imported = await importPngAsset(
          latestDraft.file,
          normalizeAssetName(latestDraft.name),
          latestDraft.sourceKind,
          latestDraft.destinationFolderId ?? null,
        );
        await this.store.saveRawAsset(imported.record, { id: imported.record.id, blob: imported.blob });
        this.store.closeImportModal();
        this.store.setLibraryTab("raw");
        this.store.selectAsset(imported.record.id);
      } catch (unknownError) {
        const message = unknownError instanceof Error
          ? unknownError.message
          : this.translator.t("editor.library.modal.errors.couldNotImport");
        this.store.updateImportDraft({ error: message });
      }
    });
    this.importActions.append(this.cancelImportButton, this.saveImportButton);
    this.importDialog.append(this.importTitle, this.importForm, this.importActions);
    this.modalLayer.append(this.importBackdrop, this.importDialog);
  }

  private renderList(): void {
    const state = this.store.getState();
    const rows = state.libraryTab === "raw"
      ? buildRawAssetRows(state.snapshot, this.translator)
      : buildGameAssetRows(state.snapshot, this.translator);
    const filteredRows = filterLibraryRows(rows, state.searchQuery, state.libraryTab);

    clearElement(this.listPanel);

    const table = createElement("div", "library-table");
    const header = createElement("div", "library-row library-head");
    header.append(
      createElement("span", "cell-name", this.translator.t("editor.library.columns.name")),
      createElement("span", "cell-type", this.translator.t("editor.library.columns.type")),
      createElement("span", "cell-size", this.translator.t("editor.library.columns.size")),
    );
    table.append(header);

    if (filteredRows.length === 0) {
      const empty = createElement("div", "library-empty", this.translator.t("editor.library.empty"));
      table.append(empty);
    } else {
      filteredRows.forEach((row) => {
        const button = createElement(
          "button",
          row.id === state.selectedAssetId ? "library-row library-row-button is-selected" : "library-row library-row-button",
        ) as HTMLButtonElement;
        button.type = "button";
        button.addEventListener("click", () => {
          openAssetSelection(this.store, row.id);
          this.store.setPropertiesTab("properties");
        });

        const nameCell = createElement("span", "cell-name");
        nameCell.append(createElement("strong", "row-name", row.name));
        if (row.status === "archived") {
          nameCell.append(createBadge(this.translator.t("editor.library.badges.archived"), "badge-archived"));
        } else if (row.status === "uses-archived-dependencies") {
          nameCell.append(createBadge(this.translator.t("editor.library.badges.usesArchived"), "badge-warning"));
        } else if (row.status === "missing-dependencies") {
          nameCell.append(createBadge(this.translator.t("editor.library.badges.missingDependencies"), "badge-danger"));
        }

        button.append(
          nameCell,
          createElement("span", "cell-type", row.typeLabel),
          createElement("span", "cell-size", row.sizeLabel),
        );
        table.append(button);
      });
    }

    this.listPanel.append(table);
  }

  private renderImportModal(): void {
    const state = this.store.getState();
    this.modalLayer.hidden = !state.importModalOpen;
    if (!state.importModalOpen) {
      return;
    }

    const draft = this.store.getImportDraft();
    this.importTitle.textContent = this.translator.t("editor.library.modal.title");
    this.importFileField.label.textContent = this.translator.t("editor.library.modal.pngFile");
    this.importNameField.label.textContent = this.translator.t("editor.library.modal.name");
    this.importKindField.label.textContent = this.translator.t("editor.library.modal.sourceKind");
    this.cancelImportButton.textContent = this.translator.t("editor.common.cancel");
    this.saveImportButton.textContent = this.translator.t("editor.library.modal.saveImport");
    const error = resolveImportError(this.translator, this.store, draft.file, draft.name, draft.sourceKind, draft.error);
    this.importNameField.sync(draft.name, false);
    this.importKindField.sync([
      { label: this.translator.t("editor.common.selectOne"), value: "" },
      { label: this.translator.t("editor.library.modal.tilesetSource"), value: "tileset-source" },
      { label: this.translator.t("editor.library.modal.spritesheetSource"), value: "spritesheet-source" },
      { label: this.translator.t("editor.library.modal.imageSource"), value: "image-source" },
    ], draft.sourceKind ?? "", false);
    if (!draft.file && this.importFileInput.value !== "") {
      this.importFileInput.value = "";
    }
    this.importError.hidden = !error;
    this.importError.textContent = error ?? "";
    this.saveImportButton.disabled = Boolean(error);
  }
}

function createField(): { field: HTMLElement; label: HTMLElement } {
  const field = createElement("label", "form-field");
  const label = createElement("span", "form-label");
  return { field, label };
}

function createBadge(label: string, className: string): HTMLElement {
  return createElement("span", `status-badge ${className}`, label);
}

function isPngFile(file: File): boolean {
  return file.type === "image/png" || /\.png$/i.test(file.name);
}

function resolveImportError(
  translator: EditorTranslator,
  store: EditorStore,
  file: File | null,
  rawName: string,
  sourceKind: RawAssetKind | null,
  draftError: string | null,
): string | null {
  if (draftError) {
    return draftError;
  }

  if (!file) {
    return translator.t("editor.library.modal.errors.selectPng");
  }

  if (!isPngFile(file)) {
    return translator.t("editor.library.modal.errors.onlyPng");
  }

  const requiredNameError = translator.validateRequiredName(rawName);
  if (requiredNameError) {
    return requiredNameError;
  }

  const normalized = normalizeAssetName(rawName);
  if (store.isAssetNameTaken(normalized)) {
    return translator.t("editor.validation.duplicateAssetName");
  }

  if (!sourceKind) {
    return translator.t("editor.library.modal.errors.selectSourceKind");
  }

  return null;
}
