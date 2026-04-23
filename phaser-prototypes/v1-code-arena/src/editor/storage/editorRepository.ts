import type {
  AnimationDefinition,
  CharacterDefinition,
  EditorEntityRecord,
  EditorSnapshot,
  FolderRecord,
  LevelCompositionRecord,
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
    const [folders, rawAssets, rawAssetBlobs, tilesets, spritesheets, animations, characters, maps, levelCompositions] = await Promise.all([
      this.db.getAll("folders"),
      this.db.getAll("rawAssets"),
      this.db.getAll("rawAssetBlobs"),
      this.db.getAll("tilesets"),
      this.db.getAll("spritesheets"),
      this.db.getAll("animations"),
      this.db.getAll("characters"),
      this.db.getAll("maps"),
      this.db.getAll("levelCompositions"),
    ]);

    return {
      folders: sortByCreatedAt(folders),
      rawAssets: sortByCreatedAt(rawAssets),
      rawAssetBlobs,
      tilesets: sortByCreatedAt(tilesets),
      spritesheets: sortByCreatedAt(spritesheets),
      animations: sortByCreatedAt(animations),
      characters: sortByCreatedAt(characters),
      maps: sortByCreatedAt(maps),
      levelCompositions: sortByCreatedAt(levelCompositions),
    };
  }

  async getMeta(id: string): Promise<string | null> {
    const record = await this.db.get("meta", id);
    return record?.value ?? null;
  }

  async setMeta(id: string, value: string): Promise<void> {
    await this.db.put("meta", { id, value });
  }

  async clearContent(): Promise<void> {
    await Promise.all([
      this.db.clear("folders"),
      this.db.clear("rawAssets"),
      this.db.clear("rawAssetBlobs"),
      this.db.clear("tilesets"),
      this.db.clear("spritesheets"),
      this.db.clear("animations"),
      this.db.clear("characters"),
      this.db.clear("maps"),
      this.db.clear("levelCompositions"),
    ]);
  }

  async saveFolder(record: FolderRecord): Promise<void> {
    await this.db.put("folders", record);
  }

  async saveFolders(records: FolderRecord[]): Promise<void> {
    for (const record of records) {
      await this.saveFolder(record);
    }
  }

  async saveRawAsset(record: RawAssetRecord, blobRecord?: RawAssetBlobRecord | null): Promise<void> {
    if (blobRecord) {
      await Promise.all([
        this.db.put("rawAssets", record),
        this.db.put("rawAssetBlobs", blobRecord),
      ]);
      return;
    }

    await this.db.put("rawAssets", record);
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

  async saveLevelComposition(record: LevelCompositionRecord): Promise<void> {
    await this.db.put("levelCompositions", record);
  }

  async saveEntities(records: EditorEntityRecord[]): Promise<void> {
    for (const record of records) {
      await this.saveEntity(record);
    }
  }

  async renameAsset(asset: EditorEntityRecord, name: string): Promise<void> {
    const renamedRecord = {
      ...asset,
      name,
      updatedAt: new Date().toISOString(),
    } as EditorEntityRecord;
    await this.saveEntity(renamedRecord);
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
    if ("placements" in record && "playerCharacterId" in record) {
      await this.db.put("levelCompositions", record);
      return;
    }

    await this.db.put("maps", record);
  }
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
