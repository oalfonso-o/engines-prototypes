import { createEditorId } from "../domain/editorIds";
import type { FolderRecord, RawAssetKind } from "../domain/editorTypes";
import { importPngAsset } from "../import/importPngAsset";
import type { EditorTranslator } from "../i18n/EditorTranslator";
import { buildGameAssetRows } from "../library/buildGameAssetRows";
import { buildRawAssetRows, type LibraryRow } from "../library/AssetLibraryFilters";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../shared/formControls";
import { createIcon, type EditorIconName } from "../shared/icons";
import { openAssetSelection } from "../shared/openAssetSelection";
import { slugifyForPath } from "../storage/pathNaming";
import { normalizeAssetName } from "../domain/editorValidators";
import { ROOT_FOLDER_IDS } from "../content/coreAssetManifest";
import { createFolderOnDisk, writePngOnDisk } from "../storage/devFsClient";

const ROOT_ORDER = [ROOT_FOLDER_IDS.core, ROOT_FOLDER_IDS.user, ROOT_FOLDER_IDS.archived];
const EXPLORER_COLLAPSE_STORAGE_KEY = "canuter:phaser-v1-code-arena:explorer-collapsed:v1";

export class ExplorerPane {
  private readonly root = createElement("aside", "editor-explorer");
  private readonly header = createElement("div", "explorer-header");
  private readonly title = createElement("h2", "explorer-title");
  private readonly headerActions = createElement("div", "explorer-header-actions");
  private readonly importButton = createButton("", "explorer-icon-button");
  private readonly newFolderButton = createButton("", "explorer-icon-button");
  private readonly searchWrap = createElement("div", "explorer-search");
  private readonly searchInput = createElement("input", "search-input") as HTMLInputElement;
  private readonly tree = createElement("div", "explorer-tree");
  private readonly modalLayer = createElement("div", "modal-layer");
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
  private readonly importDestinationField = createSelectFieldController("", (value) => {
    this.store.updateImportDraft({ destinationFolderId: value === "" ? null : value, error: null });
  });
  private readonly importError = createElement("p", "form-error");
  private readonly importActions = createElement("div", "modal-actions");
  private readonly cancelImportButton = createButton("", "ghost-button");
  private readonly saveImportButton = createButton("", "primary-button");
  private collapsed = new Set<string>();
  private collapseStateInitialized = false;
  private editingAssetId: string | null = null;
  private editingValue = "";
  private editingError: string | null = null;
  private renamingAssetId: string | null = null;
  private editingFolderId: string | null = null;
  private renamingFolderId: string | null = null;
  private pendingFolderParentId: string | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
  ) {
    this.root.dataset.testid = "editor-explorer";
    this.tree.dataset.testid = "explorer-tree";
    this.searchInput.dataset.testid = "explorer-search-input";
    this.newFolderButton.dataset.testid = "explorer-new-folder-button";
    this.importButton.append(createIcon("plus"));
    this.importButton.addEventListener("click", () => this.store.openImportModal());
    this.newFolderButton.append(createIcon("folder"));
    this.newFolderButton.addEventListener("click", () => void this.createFolder());
    this.headerActions.append(this.importButton, this.newFolderButton);
    this.searchInput.type = "search";
    this.searchInput.addEventListener("input", () => this.store.setSearchQuery(this.searchInput.value));
    this.searchWrap.append(this.searchInput);
    this.header.append(this.title, this.headerActions);
    this.root.append(this.header, this.searchWrap, this.tree, this.modalLayer);
    this.container.append(this.root);
    this.buildImportModal();
  }

  update(): void {
    const state = this.store.getState();
    if (!this.collapseStateInitialized) {
      this.collapsed = loadCollapsedFolders(state.snapshot.folders.map((entry) => entry.id));
      this.collapseStateInitialized = true;
    }
    const pendingReveal = this.store.peekExplorerReveal();
    if (pendingReveal) {
      this.expandRevealTargetPath(pendingReveal);
    }
    this.title.textContent = this.translator.t("editor.explorer.title");
    this.importButton.title = this.translator.t("editor.explorer.import");
    this.importButton.setAttribute("aria-label", this.translator.t("editor.explorer.import"));
    this.newFolderButton.title = this.translator.t("editor.explorer.newFolder");
    this.newFolderButton.setAttribute("aria-label", this.translator.t("editor.explorer.newFolder"));
    this.newFolderButton.disabled = false;
    this.searchInput.placeholder = this.translator.t("editor.library.searchPlaceholder");
    if (this.searchInput.value !== state.searchQuery) {
      this.searchInput.value = state.searchQuery;
    }
    this.renderTree();
    if (pendingReveal) {
      this.store.consumeExplorerReveal();
      window.requestAnimationFrame(() => {
        this.scrollRevealTargetIntoView(pendingReveal);
      });
    }
    this.renderImportModal();
  }

  destroy(): void {
    clearElement(this.container);
  }

  private renderTree(): void {
    const state = this.store.getState();
    const query = state.searchQuery.trim().toLocaleLowerCase();
    clearElement(this.tree);
    const folders = [...state.snapshot.folders].sort((left, right) => compareFolders(left, right));
    const assets = [...buildRawAssetRows(state.snapshot, this.translator), ...buildGameAssetRows(state.snapshot, this.translator)]
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const rootId of ROOT_ORDER) {
      const rootFolder = folders.find((entry) => entry.id === rootId);
      if (!rootFolder) {
        continue;
      }

      const node = this.renderFolderNode(rootFolder, folders, assets, query, 0);
      if (node) {
        this.tree.append(node);
      }
    }
  }

  private renderFolderNode(
    folder: FolderRecord,
    folders: FolderRecord[],
    assets: LibraryRow[],
    query: string,
    depth: number,
  ): HTMLElement | null {
    const hasPendingCreation = this.pendingFolderParentId === folder.id;
    const childFolders = folders
      .filter((entry) => entry.parentFolderId === folder.id)
      .sort((left, right) => compareFolders(left, right))
      .map((entry) => this.renderFolderNode(entry, folders, assets, query, depth + 1))
      .filter((entry): entry is HTMLElement => entry !== null);
    const childAssets = assets
      .filter((entry) => this.store.getAssetById(entry.id)?.folderId === folder.id)
      .filter((entry) => rowMatches(entry, query))
      .map((entry) => this.createAssetRow(entry, this.store.getState().selectedAssetId, folder.storageRoot !== "core", depth + 1));

    const folderMatches = folder.name.toLocaleLowerCase().includes(query) || folder.slug.toLocaleLowerCase().includes(query);
    const hasVisibleChildren = childFolders.length > 0 || childAssets.length > 0;
    if (query && !folderMatches && !hasVisibleChildren && !hasPendingCreation) {
      return null;
    }

    const expanded = query.length > 0 || hasPendingCreation || !this.collapsed.has(folder.id);
    const wrapper = createElement("section", "explorer-scope");
    wrapper.append(this.createFolderRow(folder, expanded, depth));
    if (expanded) {
      if (hasPendingCreation) {
        wrapper.append(this.createPendingFolderRow(depth + 1));
      }
      childFolders.forEach((entry) => wrapper.append(entry));
      childAssets.forEach((entry) => wrapper.append(entry));
    }
    return wrapper;
  }

  private createFolderRow(folder: FolderRecord, expanded: boolean, depth: number): HTMLElement {
    if (!folder.system && folder.id === this.editingFolderId) {
      return this.createEditingFolderRow(folder, depth);
    }

    const button = createButton(
      "",
      this.store.getState().selectedFolderId === folder.id
        ? "explorer-row explorer-folder-row is-selected"
        : "explorer-row explorer-folder-row",
    );
    button.style.setProperty("--explorer-depth", `${depth}`);
    button.title = folder.name;
    button.dataset.testid = "explorer-folder-row";
    button.dataset.folderName = folder.name;
    button.dataset.folderId = folder.id;

    const disclosure = createElement("span", "explorer-disclosure");
    disclosure.append(createIcon(expanded ? "chevron-down" : "chevron-right"));
    disclosure.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggleCollapsed(folder.id);
    });

    button.append(
      disclosure,
      createIcon(expanded ? "folder-open" : "folder", "explorer-node-icon"),
      createElement("span", "explorer-node-label", folder.name),
    );
    button.addEventListener("click", () => {
      if (this.collapsed.has(folder.id)) {
        this.collapsed.delete(folder.id);
        persistCollapsedFolders(this.collapsed);
      }
      this.store.selectFolder(folder.id);
    });
    if (!folder.system && folder.storageRoot !== "core") {
      button.addEventListener("dblclick", () => this.startFolderRename(folder));
      if (folder.storageRoot !== "archived") {
        button.draggable = true;
        button.addEventListener("dragstart", (event) => this.handleDragStart(event, { kind: "folder", id: folder.id }));
      }
    }
    if (folder.storageRoot !== "core") {
      this.attachDropTarget(button, folder);
    }
    return button;
  }

  private createAssetRow(
    row: LibraryRow,
    selectedAssetId: string | null,
    editable: boolean,
    depth: number,
  ): HTMLElement {
    if (editable && row.id === this.editingAssetId) {
      return this.createEditingAssetRow(row, selectedAssetId, depth);
    }

    const button = createButton(
      "",
      row.id === selectedAssetId ? "explorer-row explorer-asset-row is-selected" : "explorer-row explorer-asset-row",
    );
    button.style.setProperty("--explorer-depth", `${depth}`);
    button.dataset.testid = "explorer-asset-row";
    button.dataset.assetName = row.name;
    button.dataset.assetId = row.id;
    const icon = createIcon(resolveAssetIcon(row), "explorer-node-icon");
    icon.title = row.typeLabel;
    button.append(
      createElement("span", "explorer-disclosure"),
      icon,
      createElement("span", "explorer-node-label", row.name),
    );
    button.title = `${row.name} · ${row.typeLabel}`;
    button.addEventListener("click", () => {
      openAssetSelection(this.store, row.id);
      this.store.setPropertiesTab("properties");
    });
    const asset = this.store.getAssetById(row.id);
    if (editable) {
      button.addEventListener("dblclick", () => this.startRename(row));
      if (asset?.storageRoot !== "archived") {
        button.draggable = true;
        button.addEventListener("dragstart", (event) => this.handleDragStart(event, { kind: "asset", id: row.id }));
      }
    }
    return button;
  }

  private createEditingFolderRow(folder: FolderRecord, depth: number): HTMLElement {
    const rowElement = createElement("div", "explorer-row explorer-folder-row explorer-asset-row-editing is-selected");
    rowElement.style.setProperty("--explorer-depth", `${depth}`);
    const input = createElement(
      "input",
      this.editingError ? "explorer-rename-input is-invalid" : "explorer-rename-input",
    ) as HTMLInputElement;
    input.type = "text";
    input.dataset.testid = "explorer-folder-rename-input";
    input.value = this.editingValue;
    input.setAttribute("aria-label", this.translator.t("editor.details.metadata.name"));
    input.title = this.editingError ?? folder.name;
    input.addEventListener("input", () => {
      this.editingValue = input.value;
      if (this.editingError) {
        this.editingError = null;
        input.classList.remove("is-invalid");
        input.title = folder.name;
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.commitFolderRename(folder.id, input);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.cancelRename();
      }
    });
    input.addEventListener("blur", () => {
      void this.commitFolderRename(folder.id, input);
    });
    rowElement.append(
      createElement("span", "explorer-disclosure"),
      createIcon("folder-open", "explorer-node-icon"),
      input,
    );
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
    return rowElement;
  }

  private createPendingFolderRow(depth: number): HTMLElement {
    const rowElement = createElement("div", "explorer-row explorer-folder-row explorer-asset-row-editing is-selected");
    rowElement.style.setProperty("--explorer-depth", `${depth}`);
    const input = createElement(
      "input",
      this.editingError ? "explorer-rename-input is-invalid" : "explorer-rename-input",
    ) as HTMLInputElement;
    input.type = "text";
    input.dataset.testid = "explorer-folder-create-input";
    input.value = this.editingValue;
    input.setAttribute("aria-label", this.translator.t("editor.explorer.newFolderPrompt"));
    input.title = this.editingError ?? this.translator.t("editor.explorer.newFolder");
    input.addEventListener("input", () => {
      this.editingValue = input.value;
      if (this.editingError) {
        this.editingError = null;
        input.classList.remove("is-invalid");
        input.title = this.translator.t("editor.explorer.newFolder");
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.commitPendingFolder(input);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.cancelRename();
      }
    });
    input.addEventListener("blur", () => {
      void this.commitPendingFolder(input);
    });
    rowElement.append(
      createElement("span", "explorer-disclosure"),
      createIcon("folder", "explorer-node-icon"),
      input,
    );
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
    return rowElement;
  }

  private createEditingAssetRow(row: LibraryRow, selectedAssetId: string | null, depth: number): HTMLElement {
    const rowElement = createElement(
      "div",
      row.id === selectedAssetId
        ? "explorer-row explorer-asset-row explorer-asset-row-editing is-selected"
        : "explorer-row explorer-asset-row explorer-asset-row-editing",
    );
    rowElement.style.setProperty("--explorer-depth", `${depth}`);
    const input = createElement(
      "input",
      this.editingError ? "explorer-rename-input is-invalid" : "explorer-rename-input",
    ) as HTMLInputElement;
    input.type = "text";
    input.value = this.editingValue;
    input.setAttribute("aria-label", this.translator.t("editor.details.metadata.name"));
    input.title = this.editingError ?? row.name;
    input.addEventListener("input", () => {
      this.editingValue = input.value;
      if (this.editingError) {
        this.editingError = null;
        input.classList.remove("is-invalid");
        input.title = row.name;
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.commitRename(row.id, input);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.cancelRename();
      }
    });
    input.addEventListener("blur", () => {
      void this.commitRename(row.id, input);
    });
    const icon = createIcon(resolveAssetIcon(row), "explorer-node-icon");
    icon.title = row.typeLabel;
    rowElement.append(createElement("span", "explorer-disclosure"), icon, input);
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
    return rowElement;
  }

  private toggleCollapsed(id: string): void {
    if (this.collapsed.has(id)) {
      this.collapsed.delete(id);
    } else {
      this.collapsed.add(id);
    }
    persistCollapsedFolders(this.collapsed);
    this.renderTree();
  }

  private startRename(row: LibraryRow): void {
    this.store.selectAsset(row.id);
    this.store.setPropertiesTab("properties");
    this.editingAssetId = row.id;
    this.editingValue = row.name;
    this.editingError = null;
    this.renderTree();
  }

  private cancelRename(): void {
    this.editingAssetId = null;
    this.editingFolderId = null;
    this.pendingFolderParentId = null;
    this.editingValue = "";
    this.editingError = null;
    this.renamingAssetId = null;
    this.renamingFolderId = null;
    this.renderTree();
  }

  private async commitPendingFolder(input: HTMLInputElement): Promise<void> {
    if (!this.pendingFolderParentId || this.renamingFolderId === "__pending__") {
      return;
    }

    const parentFolder = this.store.getFolderById(this.pendingFolderParentId);
    if (!parentFolder) {
      this.cancelRename();
      return;
    }

    const normalizedName = normalizeAssetName(this.editingValue);
    if (!normalizedName) {
      this.cancelRename();
      return;
    }

    const duplicateFolder = this.store.getState().snapshot.folders.some((entry) =>
      entry.parentFolderId === parentFolder.id
      && entry.storageRoot === parentFolder.storageRoot
      && entry.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
    );
    if (duplicateFolder) {
      this.showRenameError(input, this.translator.t("editor.validation.duplicateAssetName"));
      return;
    }

    const slug = slugifyForPath(normalizedName);
    const now = new Date().toISOString();
    const relativePath = parentFolder.relativePath ? `${parentFolder.relativePath}/${slug}` : slug;
    const folderRecord: FolderRecord = {
      id: createEditorId(),
      name: normalizedName,
      slug,
      storageRoot: "user",
      parentFolderId: parentFolder.id,
      relativePath,
      createdAt: now,
      updatedAt: now,
      system: false,
    };

    this.renamingFolderId = "__pending__";
    try {
      await createFolderOnDisk(relativePath);
      await this.store.saveFolder(folderRecord);
      this.pendingFolderParentId = null;
      this.editingValue = "";
      this.editingError = null;
      this.store.selectFolder(folderRecord.id);
      this.renderTree();
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : this.translator.t("editor.validation.duplicateAssetName");
      this.showRenameError(input, message);
    } finally {
      this.renamingFolderId = null;
    }
  }

  private async commitRename(assetId: string, input: HTMLInputElement): Promise<void> {
    if (this.editingAssetId !== assetId || this.renamingAssetId === assetId) {
      return;
    }

    const asset = this.store.getAssetById(assetId);
    if (!asset) {
      this.cancelRename();
      return;
    }

    const normalizedName = normalizeAssetName(this.editingValue);
    const requiredError = this.translator.validateRequiredName(normalizedName);
    if (requiredError) {
      this.showRenameError(input, requiredError);
      return;
    }

    if (this.store.isAssetNameTaken(normalizedName, assetId)) {
      this.showRenameError(input, this.translator.t("editor.validation.duplicateAssetName"));
      return;
    }

    if (normalizedName === asset.name) {
      this.cancelRename();
      return;
    }

    this.renamingAssetId = assetId;
    try {
      await this.store.renameAsset(asset, normalizedName);
      this.editingAssetId = null;
      this.editingValue = "";
      this.editingError = null;
      this.renderTree();
    } finally {
      this.renamingAssetId = null;
    }
  }

  private startFolderRename(folder: FolderRecord): void {
    this.store.selectFolder(folder.id);
    this.editingFolderId = folder.id;
    this.editingValue = folder.name;
    this.editingError = null;
    this.renderTree();
  }

  private async commitFolderRename(folderId: string, input: HTMLInputElement): Promise<void> {
    if (this.editingFolderId !== folderId || this.renamingFolderId === folderId) {
      return;
    }

    const folder = this.store.getFolderById(folderId);
    if (!folder) {
      this.cancelRename();
      return;
    }

    const normalizedName = normalizeAssetName(this.editingValue);
    const requiredError = this.translator.validateRequiredName(normalizedName);
    if (requiredError) {
      this.showRenameError(input, requiredError);
      return;
    }

    if (normalizedName === folder.name) {
      this.cancelRename();
      return;
    }

    this.renamingFolderId = folderId;
    try {
      await this.store.renameFolder(folder, normalizedName);
      this.editingFolderId = null;
      this.editingValue = "";
      this.editingError = null;
      this.renderTree();
    } finally {
      this.renamingFolderId = null;
    }
  }

  private handleDragStart(event: DragEvent, payload: { kind: "asset" | "folder"; id: string }): void {
    event.dataTransfer?.setData("application/x-canuter-node", JSON.stringify(payload));
    event.dataTransfer?.setData("text/plain", payload.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  private attachDropTarget(target: HTMLElement, folder: FolderRecord): void {
    target.addEventListener("dragover", (event) => {
      const payload = this.readDragPayload(event);
      if (!payload) {
        return;
      }
      event.preventDefault();
      target.classList.add("is-drop-target");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    target.addEventListener("dragleave", () => {
      target.classList.remove("is-drop-target");
    });
    target.addEventListener("drop", (event) => {
      const payload = this.readDragPayload(event);
      target.classList.remove("is-drop-target");
      if (!payload) {
        return;
      }
      event.preventDefault();
      void this.handleDropPayload(payload, folder);
    });
  }

  private readDragPayload(event: DragEvent): { kind: "asset" | "folder"; id: string } | null {
    const rawPayload = event.dataTransfer?.getData("application/x-canuter-node");
    if (!rawPayload) {
      return null;
    }

    try {
      const payload = JSON.parse(rawPayload) as { kind?: "asset" | "folder"; id?: string };
      if ((payload.kind === "asset" || payload.kind === "folder") && typeof payload.id === "string") {
        return { kind: payload.kind, id: payload.id };
      }
    } catch {
      return null;
    }
    return null;
  }

  private async handleDropPayload(payload: { kind: "asset" | "folder"; id: string }, targetFolder: FolderRecord): Promise<void> {
    if (payload.kind === "asset") {
      const asset = this.store.getAssetById(payload.id);
      if (!asset) {
        return;
      }
      await this.store.moveAssetToFolder(asset, targetFolder);
      return;
    }

    const folder = this.store.getFolderById(payload.id);
    if (!folder) {
      return;
    }
    await this.store.moveFolderToFolder(folder, targetFolder);
  }

  private showRenameError(input: HTMLInputElement, error: string): void {
    this.editingError = error;
    input.classList.add("is-invalid");
    input.title = error;
    input.focus();
    input.select();
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

    this.importForm.append(
      this.importFileField.field,
      this.importNameField.field,
      this.importKindField.field,
      this.importDestinationField.field,
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
        const destinationFolder = latestDraft.destinationFolderId
          ? this.store.getFolderById(latestDraft.destinationFolderId)
          : null;
        const storedRecord = {
          ...imported.record,
          storageMode: "disk" as const,
          blobKey: null,
          relativePath: destinationFolder?.relativePath
            ? `${destinationFolder.relativePath}/${imported.record.relativePath}`
            : imported.record.relativePath,
        };
        await writePngOnDisk(storedRecord.relativePath, imported.blob);
        await this.store.saveRawAsset(storedRecord);
        this.store.closeImportModal();
        this.store.selectAsset(storedRecord.id);
        this.store.setPropertiesTab("properties");
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

  private renderImportModal(): void {
    const state = this.store.getState();
    this.modalLayer.hidden = !state.importModalOpen;
    if (!state.importModalOpen) {
      return;
    }

    const userFolders = state.snapshot.folders
      .filter((entry) => entry.storageRoot === "user")
      .sort((left, right) => compareFolders(left, right))
      .map((entry) => ({
        value: entry.id,
        label: entry.relativePath.length > 0 ? entry.relativePath : entry.name,
      }));

    const draft = this.store.getImportDraft();
    this.importTitle.textContent = this.translator.t("editor.library.modal.title");
    this.importFileField.label.textContent = this.translator.t("editor.library.modal.pngFile");
    this.importNameField.label.textContent = this.translator.t("editor.library.modal.name");
    this.importKindField.label.textContent = this.translator.t("editor.library.modal.sourceKind");
    this.importDestinationField.label.textContent = this.translator.t("editor.library.modal.destination");
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
    this.importDestinationField.sync(userFolders, draft.destinationFolderId ?? "", false);
    if (!draft.file && this.importFileInput.value !== "") {
      this.importFileInput.value = "";
    }
    this.importError.hidden = !error;
    this.importError.textContent = error ?? "";
    this.saveImportButton.disabled = Boolean(error);
  }

  private async createFolder(): Promise<void> {
    const state = this.store.getState();
    const selectedFolder = state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    const selectedAsset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    const assetFolder = selectedAsset?.storageRoot === "user" && selectedAsset.folderId
      ? this.store.getFolderById(selectedAsset.folderId)
      : null;
    const parentFolder = selectedFolder?.storageRoot === "user"
      ? selectedFolder
      : assetFolder?.storageRoot === "user"
        ? assetFolder
        : this.store.getFolderById(ROOT_FOLDER_IDS.user);
    if (!parentFolder) {
      return;
    }

    this.expandFolderPath(parentFolder.id);
    this.store.selectFolder(parentFolder.id);
    this.pendingFolderParentId = parentFolder.id;
    this.editingValue = "";
    this.editingError = null;
    this.renderTree();
  }

  private expandFolderPath(folderId: string): void {
    let current = this.store.getFolderById(folderId);
    while (current) {
      this.collapsed.delete(current.id);
      current = current.parentFolderId ? this.store.getFolderById(current.parentFolderId) : null;
    }
    persistCollapsedFolders(this.collapsed);
  }

  private expandRevealTargetPath(target: { kind: "asset" | "folder"; id: string }): void {
    if (target.kind === "folder") {
      this.expandFolderPath(target.id);
      return;
    }

    const asset = this.store.getAssetById(target.id);
    if (!asset) {
      return;
    }

    const parentFolderId = asset.folderId ?? this.resolveRootFolderId(asset.storageRoot);
    if (!parentFolderId) {
      return;
    }

    this.expandFolderPath(parentFolderId);
  }

  private scrollRevealTargetIntoView(target: { kind: "asset" | "folder"; id: string }): void {
    const selector = target.kind === "asset"
      ? `[data-testid="explorer-asset-row"][data-asset-id="${target.id}"]`
      : `[data-testid="explorer-folder-row"][data-folder-id="${target.id}"]`;
    const row = this.tree.querySelector<HTMLElement>(selector);
    row?.scrollIntoView({ block: "nearest" });
  }

  private resolveRootFolderId(storageRoot: FolderRecord["storageRoot"]): string | null {
    if (storageRoot === "core") {
      return ROOT_FOLDER_IDS.core;
    }
    if (storageRoot === "archived") {
      return ROOT_FOLDER_IDS.archived;
    }
    if (storageRoot === "user") {
      return ROOT_FOLDER_IDS.user;
    }
    return null;
  }
}

function compareFolders(left: FolderRecord, right: FolderRecord): number {
  return left.name.localeCompare(right.name);
}

function rowMatches(row: LibraryRow, query: string): boolean {
  if (!query) {
    return true;
  }
  const haystack = `${row.name} ${row.typeLabel}`.toLocaleLowerCase();
  return haystack.includes(query);
}

function resolveAssetIcon(row: LibraryRow): EditorIconName {
  if (row.entityType === "raw-asset") {
    return "raw-asset";
  }

  switch (row.entityType) {
    case "level":
      return "level";
    case "tileset":
      return "tileset";
    case "spritesheet":
      return "spritesheet";
    case "animation":
      return "animation";
    case "character":
      return "character";
    case "map":
      return "map";
  }
}

function createField(): { field: HTMLElement; label: HTMLElement } {
  const field = createElement("label", "form-field");
  const label = createElement("span", "form-label");
  return { field, label };
}

function isPngFile(file: File): boolean {
  return file.type === "image/png" || /\.png$/i.test(file.name);
}

function loadCollapsedFolders(validFolderIds: string[]): Set<string> {
  const defaults = new Set(validFolderIds);

  try {
    const raw = window.localStorage.getItem(EXPLORER_COLLAPSE_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return defaults;
    }

    const validIds = new Set(validFolderIds);
    return new Set(parsed.filter((entry): entry is string => typeof entry === "string" && validIds.has(entry)));
  } catch {
    return defaults;
  }
}

function persistCollapsedFolders(collapsed: Set<string>): void {
  try {
    window.localStorage.setItem(EXPLORER_COLLAPSE_STORAGE_KEY, JSON.stringify([...collapsed]));
  } catch {
    // Ignore storage failures and keep the live explorer working.
  }
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
