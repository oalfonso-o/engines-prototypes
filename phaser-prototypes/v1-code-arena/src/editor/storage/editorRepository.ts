import type {
  AnimationDefinition,
  CharacterDefinition,
  EditorEntityRecord,
  EditorSnapshot,
  MapDefinition,
  RawAssetBlobRecord,
  RawAssetRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "../domain/editorTypes";
import { EditorDb } from "./editorDb";

export class EditorRepository {
  constructor(private readonly db: EditorDb) {}

  async loadSnapshot(): Promise<EditorSnapshot> {
    const [rawAssets, rawAssetBlobs, tilesets, spritesheets, animations, characters, maps] = await Promise.all([
      this.db.getAll("rawAssets"),
      this.db.getAll("rawAssetBlobs"),
      this.db.getAll("tilesets"),
      this.db.getAll("spritesheets"),
      this.db.getAll("animations"),
      this.db.getAll("characters"),
      this.db.getAll("maps"),
    ]);

    return {
      rawAssets: sortByCreatedAt(rawAssets),
      rawAssetBlobs,
      tilesets: sortByCreatedAt(tilesets),
      spritesheets: sortByCreatedAt(spritesheets),
      animations: sortByCreatedAt(animations),
      characters: sortByCreatedAt(characters),
      maps: sortByCreatedAt(maps),
    };
  }

  async saveRawAsset(record: RawAssetRecord, blobRecord: RawAssetBlobRecord): Promise<void> {
    await Promise.all([
      this.db.put("rawAssets", record),
      this.db.put("rawAssetBlobs", blobRecord),
    ]);
  }

  async saveTileset(record: TilesetDefinition): Promise<void> {
    await this.db.put("tilesets", record);
  }

  async saveSpriteSheet(record: SpriteSheetDefinition): Promise<void> {
    await this.db.put("spritesheets", record);
  }

  async saveAnimation(record: AnimationDefinition): Promise<void> {
    await this.db.put("animations", record);
  }

  async saveCharacter(record: CharacterDefinition): Promise<void> {
    await this.db.put("characters", record);
  }

  async saveMap(record: MapDefinition): Promise<void> {
    await this.db.put("maps", record);
  }

  async archiveAsset(asset: EditorEntityRecord): Promise<void> {
    const archivedRecord = {
      ...asset,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as EditorEntityRecord;
    await this.saveEntity(archivedRecord);
  }

  async unarchiveAsset(asset: EditorEntityRecord): Promise<void> {
    const unarchivedRecord = {
      ...asset,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    } as EditorEntityRecord;
    await this.saveEntity(unarchivedRecord);
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  private async saveEntity(record: EditorEntityRecord): Promise<void> {
    if ("sourceKind" in record) {
      await this.db.put("rawAssets", record);
      return;
    }

    if ("tiles" in record) {
      await this.db.put("tilesets", record);
      return;
    }
    if ("frames" in record) {
      await this.db.put("spritesheets", record);
      return;
    }
    if ("frameIds" in record) {
      await this.db.put("animations", record);
      return;
    }
    if ("idleAnimationId" in record) {
      await this.db.put("characters", record);
      return;
    }

    await this.db.put("maps", record);
  }
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
