import { mountTilesetGridPreview } from "../tileset/tilesetGrid";
import type { GridPreviewOptions } from "../tileset/tilesetGrid";

export function mountSpriteSheetGridPreview(options: GridPreviewOptions) {
  return mountTilesetGridPreview(options);
}
