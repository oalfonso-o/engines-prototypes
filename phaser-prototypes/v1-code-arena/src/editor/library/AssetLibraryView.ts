import type { RawAssetKind } from "../domain/editorTypes";
import { importPngAsset } from "../import/importPngAsset";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { normalizeAssetName, validateRequiredName } from "../domain/editorValidators";
import { AssetDetailsPanel } from "./AssetDetailsPanel";
import { buildRawAssetRows, filterLibraryRows } from "./AssetLibraryFilters";
import { buildGameAssetRows } from "./buildGameAssetRows";

export class AssetLibraryView {
  private readonly toolbar = createElement("div", "library-toolbar");
  private readonly listPanel = createElement("section", "library-list-panel");
  private readonly detailPanelElement = createElement("aside", "library-detail-slot");
  private readonly detailsPanel: AssetDetailsPanel;
  private readonly modalLayer = createElement("div", "modal-layer");

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
  ) {
    this.detailsPanel = new AssetDetailsPanel(this.detailPanelElement, this.store);
    this.container.className = "library-screen";
    this.container.append(this.toolbar, this.listPanel, this.detailPanelElement, this.modalLayer);
  }

  update(): void {
    const state = this.store.getState();
    this.renderToolbar();
    this.renderList();
    this.detailsPanel.update(state);
    this.renderImportModal();
  }

  destroy(): void {
    clearElement(this.container);
  }

  private renderToolbar(): void {
    const state = this.store.getState();
    clearElement(this.toolbar);

    const searchWrap = createElement("div", "toolbar-search");
    const searchInput = createElement("input", "search-input") as HTMLInputElement;
    searchInput.type = "search";
    searchInput.placeholder = "Buscar assets por nombre o tipo";
    searchInput.value = state.searchQuery;
    searchInput.addEventListener("input", () => this.store.setSearchQuery(searchInput.value));
    searchWrap.append(searchInput);

    const tabBar = createElement("div", "library-tabbar");
    const rawTab = createButton("Raw Assets", state.libraryTab === "raw" ? "tab-button is-active" : "tab-button");
    rawTab.addEventListener("click", () => this.store.setLibraryTab("raw"));
    const gameTab = createButton("Game Assets", state.libraryTab === "game" ? "tab-button is-active" : "tab-button");
    gameTab.addEventListener("click", () => this.store.setLibraryTab("game"));
    tabBar.append(rawTab, gameTab);

    const actions = createElement("div", "toolbar-actions");
    const importButton = createButton("Import PNG", "primary-button");
    importButton.addEventListener("click", () => this.store.openImportModal());
    const createCharacter = createButton("Create character", "secondary-button");
    createCharacter.addEventListener("click", () => this.store.navigate({ kind: "character", id: "new" }));
    const createMap = createButton("Create map", "secondary-button");
    createMap.addEventListener("click", () => this.store.navigate({ kind: "map", id: "new" }));
    actions.append(importButton, createCharacter, createMap);

    this.toolbar.append(searchWrap, tabBar, actions);
  }

  private renderList(): void {
    const state = this.store.getState();
    const rows = state.libraryTab === "raw" ? buildRawAssetRows(state.snapshot) : buildGameAssetRows(state.snapshot);
    const filteredRows = filterLibraryRows(rows, state.searchQuery, state.libraryTab);

    clearElement(this.listPanel);

    const table = createElement("div", "library-table");
    const header = createElement("div", "library-row library-head");
    header.append(
      createElement("span", "cell-name", "Name"),
      createElement("span", "cell-type", "Type"),
      createElement("span", "cell-size", "Size"),
    );
    table.append(header);

    if (filteredRows.length === 0) {
      const empty = createElement("div", "library-empty", "No hay assets que encajen con el filtro actual.");
      table.append(empty);
    } else {
      filteredRows.forEach((row) => {
        const button = createElement(
          "button",
          row.id === state.selectedAssetId ? "library-row library-row-button is-selected" : "library-row library-row-button",
        ) as HTMLButtonElement;
        button.type = "button";
        button.addEventListener("click", () => this.store.selectAsset(row.id));

        const nameCell = createElement("span", "cell-name");
        nameCell.append(createElement("strong", "row-name", row.name));
        if (row.status === "archived") {
          nameCell.append(createBadge("Archived", "badge-archived"));
        } else if (row.status === "uses-archived-dependencies") {
          nameCell.append(createBadge("Uses Archived", "badge-warning"));
        } else if (row.status === "missing-dependencies") {
          nameCell.append(createBadge("Missing Dependencies", "badge-danger"));
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
    clearElement(this.modalLayer);
    const state = this.store.getState();
    if (!state.importModalOpen) {
      return;
    }

    const draft = this.store.getImportDraft();
    const error = resolveImportError(this.store, draft.file, draft.name, draft.sourceKind, draft.error);

    const backdrop = createElement("div", "modal-backdrop");
    backdrop.addEventListener("click", () => this.store.closeImportModal());

    const dialog = createElement("div", "modal-dialog");
    const title = createElement("h3", "modal-title", "Import PNG");
    const form = createElement("div", "modal-form");

    const fileField = createField("PNG file");
    const fileInput = createElement("input", "text-input") as HTMLInputElement;
    fileInput.type = "file";
    fileInput.accept = "image/png";
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0] ?? null;
      if (!file) {
        this.store.updateImportDraft({ file: null, name: "", error: null });
        return;
      }

      const suggestedName = file.name.replace(/\.png$/i, "");
      this.store.updateImportDraft({
        file,
        name: suggestedName,
        error: isPngFile(file) ? null : "Solo se permiten ficheros PNG.",
      });
    });
    fileField.append(fileInput);

    const nameField = createField("Name");
    const nameInput = createElement("input", "text-input") as HTMLInputElement;
    nameInput.type = "text";
    nameInput.value = draft.name;
    nameInput.addEventListener("input", () => this.store.updateImportDraft({ name: nameInput.value, error: null }));
    nameField.append(nameInput);

    const kindField = createField("Source kind");
    const kindSelect = createElement("select", "text-input") as HTMLSelectElement;
    kindSelect.append(
      new Option("Select one", ""),
      new Option("tileset-source", "tileset-source"),
      new Option("spritesheet-source", "spritesheet-source"),
    );
    kindSelect.value = draft.sourceKind ?? "";
    kindSelect.addEventListener("change", () => {
      const value = kindSelect.value === "" ? null : kindSelect.value as RawAssetKind;
      this.store.updateImportDraft({ sourceKind: value, error: null });
    });
    kindField.append(kindSelect);

    form.append(fileField, nameField, kindField);
    if (error) {
      form.append(createElement("p", "form-error", error));
    }

    const actions = createElement("div", "modal-actions");
    const cancel = createButton("Cancel", "ghost-button");
    cancel.addEventListener("click", () => this.store.closeImportModal());
    const save = createButton("Save import", "primary-button");
    save.disabled = Boolean(error);
    save.addEventListener("click", async () => {
      const latestDraft = this.store.getImportDraft();
      const latestError = resolveImportError(
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
        );
        await this.store.saveRawAsset(imported.record, { id: imported.record.id, blob: imported.blob });
        this.store.closeImportModal();
        this.store.setLibraryTab("raw");
        this.store.selectAsset(imported.record.id);
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : "No se pudo importar el PNG.";
        this.store.updateImportDraft({ error: message });
      }
    });
    actions.append(cancel, save);

    dialog.append(title, form, actions);
    this.modalLayer.append(backdrop, dialog);
  }
}

function createField(label: string): HTMLElement {
  const field = createElement("label", "form-field");
  field.append(createElement("span", "form-label", label));
  return field;
}

function createBadge(label: string, className: string): HTMLElement {
  return createElement("span", `status-badge ${className}`, label);
}

function isPngFile(file: File): boolean {
  return file.type === "image/png" || /\.png$/i.test(file.name);
}

function resolveImportError(
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
    return "Selecciona un fichero PNG.";
  }

  if (!isPngFile(file)) {
    return "Solo se permiten ficheros PNG.";
  }

  const requiredNameError = validateRequiredName(rawName);
  if (requiredNameError) {
    return requiredNameError;
  }

  const normalized = normalizeAssetName(rawName);
  if (store.isAssetNameTaken(normalized)) {
    return "Este nombre ya existe en el editor. Debe ser único.";
  }

  if (!sourceKind) {
    return "Selecciona si el PNG es un tileset o un spritesheet.";
  }

  return null;
}
