import { isRawAsset } from "../../domain/assetReferences";
import type { RawAssetRecord } from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createElement } from "../../shared/dom";
import type { EditorTranslator } from "../../i18n/EditorTranslator";

export class RawAssetWorkspace {
  private readonly root = createElement("section", "workspace-screen raw-asset-workspace");
  private readonly visual = createElement("div", "asset-preview-visual raw-asset-visual");
  private readonly asset: RawAssetRecord | null;
  private readonly imageUrl: string | null;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    this.asset = asset && isRawAsset(asset) ? asset : null;
    this.imageUrl = this.asset ? this.store.getRawAssetUrl(this.asset.id) : null;
    this.root.dataset.testid = "raw-asset-workspace";
    this.visual.dataset.testid = "raw-asset-visual";
    this.root.append(this.visual);
    this.container.append(this.root);
    this.render();
  }

  update(): void {
    this.render();
  }

  destroy(): void {
    clearElement(this.container);
  }

  private render(): void {
    clearElement(this.visual);

    if (!this.asset || !this.imageUrl) {
      this.visual.append(
        createEmptyState(
          this.translator.t("editor.preview.noPreviewTitle"),
          this.translator.t("editor.preview.noPreviewBody"),
        ),
      );
      return;
    }

    const image = createElement("img", "asset-preview-image") as HTMLImageElement;
    image.src = this.imageUrl;
    image.alt = this.asset.name;
    this.visual.append(image);
  }
}

function createEmptyState(title: string, body: string): HTMLElement {
  const element = createElement("div", "empty-state");
  element.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return element;
}
