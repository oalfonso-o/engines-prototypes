import {
  getDependencyEntries,
  getEntityType,
  getSourceRawAssetId,
  getUsedByEntries,
  isRawAsset,
} from "../domain/assetReferences";
import type { EditorEntityRecord, EditorState } from "../domain/editorTypes";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createElement } from "../shared/dom";
import { formatAssetTypeLabel, formatBytes } from "../shared/formatters";
import type { EditorTranslator } from "../i18n/EditorTranslator";

export class AssetPreviewPane {
  private readonly root = createElement("section", "editor-center-pane");
  private readonly previewCard = createElement("div", "asset-preview-card");

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
  ) {
    this.container.append(this.root);
  }

  update(): void {
    const state = this.store.getState();
    this.root.replaceChildren(this.previewCard);
    this.render(state);
  }

  destroy(): void {
    clearElement(this.container);
  }

  private render(state: EditorState): void {
    const asset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    const folder = !asset && state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    clearElement(this.previewCard);

    if (folder) {
      const header = createElement("div", "asset-preview-header");
      const headerCopy = createElement("div", "asset-preview-copy");
      headerCopy.append(
        createElement("span", "asset-preview-eyebrow", this.translator.t("editor.preview.eyebrow")),
        createElement("h2", "asset-preview-title", folder.name),
        createElement("p", "asset-preview-subtitle", folder.relativePath.length > 0 ? folder.relativePath : folder.name),
      );
      header.append(headerCopy);

      const meta = createElement("dl", "asset-preview-metadata");
      appendMetadata(meta, this.translator.t("editor.details.metadata.name"), folder.name);
      appendMetadata(meta, this.translator.t("editor.details.metadata.relativePath"), folder.relativePath || "/");
      appendMetadata(meta, this.translator.t("editor.details.metadata.root"), folder.storageRoot);
      this.previewCard.append(header, meta);
      return;
    }

    if (!asset) {
      this.previewCard.append(
        createEmptyState(
          this.translator.t("editor.preview.emptyTitle"),
          this.translator.t("editor.preview.emptyBody"),
        ),
      );
      return;
    }

    const header = createElement("div", "asset-preview-header");
    const headerCopy = createElement("div", "asset-preview-copy");
    const eyebrow = createElement("span", "asset-preview-eyebrow", this.translator.t("editor.preview.eyebrow"));
    const title = createElement("h2", "asset-preview-title", asset.name);
    const subtitle = createElement("p", "asset-preview-subtitle", formatAssetTypeLabel(getEntityType(asset), this.translator, isRawAsset(asset) ? asset.sourceKind : undefined));
    headerCopy.append(eyebrow, title, subtitle);
    header.append(headerCopy);

    const visual = createElement("div", "asset-preview-visual");
    const previewUrl = resolvePreviewUrl(asset, state, this.store);
    if (previewUrl) {
      const image = createElement("img", "asset-preview-image") as HTMLImageElement;
      image.src = previewUrl;
      image.alt = asset.name;
      visual.append(image);
    } else {
      visual.append(
        createEmptyState(
          this.translator.t("editor.preview.noPreviewTitle"),
          this.translator.t("editor.preview.noPreviewBody"),
        ),
      );
    }

    const meta = createElement("dl", "asset-preview-metadata");
    appendMetadata(meta, this.translator.t("editor.details.metadata.name"), asset.name);
    if (isRawAsset(asset)) {
      appendMetadata(meta, this.translator.t("editor.details.metadata.dimensions"), `${asset.width}x${asset.height}`);
      appendMetadata(meta, this.translator.t("editor.details.metadata.size"), formatBytes(asset.sizeBytes, this.translator));
    }
    appendMetadata(meta, this.translator.t("editor.details.metadata.dependencies"), `${getDependencyEntries(asset, state.snapshot).length}`);
    appendMetadata(meta, this.translator.t("editor.preview.usedBy"), `${getUsedByEntries(asset, state.snapshot).length}`);

    this.previewCard.append(header, visual, meta);
  }
}

function resolvePreviewUrl(asset: EditorEntityRecord, state: EditorState, store: EditorStore): string | null {
  const rawAssetId = getSourceRawAssetId(asset, state.snapshot);
  if (!rawAssetId) {
    return null;
  }

  return store.getRawAssetUrl(rawAssetId);
}

function appendMetadata(list: HTMLElement, label: string, value: string): void {
  list.append(
    createElement("dt", "detail-term", label),
    createElement("dd", "detail-value", value),
  );
}

function createEmptyState(title: string, body: string): HTMLElement {
  const element = createElement("div", "empty-state");
  element.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return element;
}
