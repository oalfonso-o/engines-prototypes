import type {
  ActionDefinition,
  AnimationDefinition,
  CharacterDefinition,
  EditorEntityRecord,
  EditorSnapshot,
  FolderRecord,
  GameDefinition,
  LevelCompositionRecord,
  MapDefinition,
  RawAssetBlobRecord,
  RawAssetRecord,
  SceneDefinition,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "../domain/editorTypes";
import { EditorDb } from "./editorDb";

export class EditorRepository {
  constructor(private readonly db: EditorDb) {}

  async loadSnapshot(): Promise<EditorSnapshot> {
    const [folders, rawAssets, rawAssetBlobs, tilesets, spritesheets, animations, characters, maps, levelCompositions, scenes, games, actions] = await Promise.all([
      this.db.getAll("folders"),
      this.db.getAll("rawAssets"),
      this.db.getAll("rawAssetBlobs"),
      this.db.getAll("tilesets"),
      this.db.getAll("spritesheets"),
      this.db.getAll("animations"),
      this.db.getAll("characters"),
      this.db.getAll("maps"),
      this.db.getAll("levelCompositions"),
      this.db.getAll("scenes"),
      this.db.getAll("games"),
      this.db.getAll("actions"),
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
      scenes: sortByCreatedAt(scenes),
      games: sortByCreatedAt(games),
      actions: sortByCreatedAt(actions),
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
      this.db.clear("scenes"),
      this.db.clear("games"),
      this.db.clear("actions"),
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

  async saveScene(record: SceneDefinition): Promise<void> {
    await this.db.put("scenes", record);
  }

  async saveGame(record: GameDefinition): Promise<void> {
    await this.db.put("games", record);
  }

  async saveAction(record: ActionDefinition): Promise<void> {
    await this.db.put("actions", record);
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
    if ("layers" in record && "defaultPlayerCharacterId" in record) {
      await this.db.put("scenes", record);
      return;
    }
    if ("entrySceneId" in record && "initialFlags" in record) {
      await this.db.put("games", record);
      return;
    }
    if ("kind" in record && !("layers" in record) && !("cells" in record)) {
      await this.db.put("actions", record);
      return;
    }
    if ("cells" in record && "tileFitMode" in record) {
      await this.db.put("maps", record);
      return;
    }

    throw new Error(`Unsupported entity record: ${record.id}`);
  }
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
