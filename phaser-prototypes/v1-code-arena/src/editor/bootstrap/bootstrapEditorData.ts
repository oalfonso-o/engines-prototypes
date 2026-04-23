import { createCoreRawAssetRecords, createRootFolderRecords, ROOT_FOLDER_IDS } from "../content/coreAssetManifest";
import {
  createCoreAnimationRecords,
  createCoreCharacterRecords,
  createCoreGameRecords,
  createCoreLevelCompositionRecords,
  createCoreMapRecords,
  createCoreSceneRecords,
  createCoreSpriteSheetRecords,
  createCoreTilesetRecords,
} from "../content/coreDerivedManifest";
import type { ActionDefinition, EditorEntityRecord, FolderRecord, GameDefinition, SceneDefinition } from "../domain/editorTypes";
import { EditorRepository } from "../storage/editorRepository";
import { writeJsonOnDisk } from "../storage/devFsClient";

const META_BOOTSTRAPPED = "editor-bootstrap-seeded";
const META_CORE_SEEDED = "editor-core-seeded";
const META_RUNTIME_SEEDED = "editor-runtime-seeded";
const META_DEV_RESET_TOKEN = "editor-dev-reset-token";

export async function bootstrapEditorData(repository: EditorRepository): Promise<void> {
  await applyPendingDevReset(repository);
  const alreadySeeded = await repository.getMeta(META_BOOTSTRAPPED);
  const coreSeeded = await repository.getMeta(META_CORE_SEEDED);
  const runtimeSeeded = await repository.getMeta(META_RUNTIME_SEEDED);
  if (coreSeeded === "true" && runtimeSeeded === "true") {
    return;
  }

  const now = new Date().toISOString();
  const snapshot = await repository.loadSnapshot();
  const rootFolders = createRootFolderRecords(now);
  const existingFolderIds = new Set(snapshot.folders.map((entry) => entry.id));
  for (const folder of rootFolders) {
    if (!existingFolderIds.has(folder.id)) {
      await repository.saveFolder(folder);
    }
  }

  const existingAssetIds = new Set(snapshot.rawAssets.map((entry) => entry.id));
  for (const rawAsset of createCoreRawAssetRecords(now)) {
    if (!existingAssetIds.has(rawAsset.id)) {
      await repository.saveRawAsset(rawAsset);
    }
  }

  const existingTilesetIds = new Set(snapshot.tilesets.map((entry) => entry.id));
  const coreTilesets = createCoreTilesetRecords(now);
  for (const record of coreTilesets) {
    if (!existingTilesetIds.has(record.id)) {
      await repository.saveTileset(record);
    }
  }

  const existingSpriteSheetIds = new Set(snapshot.spritesheets.map((entry) => entry.id));
  const coreSpriteSheets = createCoreSpriteSheetRecords(now);
  for (const record of coreSpriteSheets) {
    if (!existingSpriteSheetIds.has(record.id)) {
      await repository.saveSpriteSheet(record);
    }
  }

  const existingAnimationIds = new Set(snapshot.animations.map((entry) => entry.id));
  const coreAnimations = createCoreAnimationRecords(now);
  for (const record of coreAnimations) {
    if (!existingAnimationIds.has(record.id)) {
      await repository.saveAnimation(record);
    }
  }

  const existingCharacterIds = new Set(snapshot.characters.map((entry) => entry.id));
  const coreCharacters = createCoreCharacterRecords(now);
  for (const record of coreCharacters) {
    if (!existingCharacterIds.has(record.id)) {
      await repository.saveCharacter(record);
    }
  }

  const existingMapIds = new Set(snapshot.maps.map((entry) => entry.id));
  const coreMaps = createCoreMapRecords(now);
  for (const record of coreMaps) {
    if (!existingMapIds.has(record.id)) {
      await repository.saveMap(record);
    }
  }

  const existingLevelIds = new Set(snapshot.levelCompositions.map((entry) => entry.id));
  const coreLevels = createCoreLevelCompositionRecords(now);
  for (const record of coreLevels) {
    if (!existingLevelIds.has(record.id)) {
      await repository.saveLevelComposition(record);
    }
  }

  const existingSceneIds = new Set(snapshot.scenes.map((entry) => entry.id));
  const coreScenes = createCoreSceneRecords(now);
  for (const record of coreScenes) {
    if (!existingSceneIds.has(record.id)) {
      await repository.saveScene(record);
    }
  }

  const existingGameIds = new Set(snapshot.games.map((entry) => entry.id));
  const coreGames = createCoreGameRecords(now);
  for (const record of coreGames) {
    if (!existingGameIds.has(record.id)) {
      await repository.saveGame(record);
    }
  }

  if (import.meta.env.DEV) {
    await persistCoreDefinitionsOnDisk([
      ...coreTilesets,
      ...coreSpriteSheets,
      ...coreAnimations,
      ...coreCharacters,
      ...coreMaps,
      ...coreLevels,
      ...coreScenes,
      ...coreGames,
    ]);
  }

  if (alreadySeeded !== "true") {
    const assetsRawFolder = rootFolders.find((entry) => entry.id === ROOT_FOLDER_IDS.userAssetsRaw) ?? null;
    if (assetsRawFolder) {
      await migrateLegacyAssets(snapshot.rawAssets, assetsRawFolder, (record) => repository.saveRawAsset(record));
      await migrateLegacyAssets(snapshot.tilesets, assetsRawFolder, (record) => repository.saveTileset(record));
      await migrateLegacyAssets(snapshot.spritesheets, assetsRawFolder, (record) => repository.saveSpriteSheet(record));
      await migrateLegacyAssets(snapshot.animations, assetsRawFolder, (record) => repository.saveAnimation(record));
      await migrateLegacyAssets(snapshot.characters, assetsRawFolder, (record) => repository.saveCharacter(record));
      await migrateLegacyAssets(snapshot.maps, assetsRawFolder, (record) => repository.saveMap(record));
    }

    await repository.setMeta(META_BOOTSTRAPPED, "true");
  }

  await repository.setMeta(META_CORE_SEEDED, "true");
  await repository.setMeta(META_RUNTIME_SEEDED, "true");
}

async function migrateLegacyAssets<TAsset extends EditorEntityRecord>(
  records: TAsset[],
  assetsRawFolder: FolderRecord,
  save: (record: TAsset) => Promise<void>,
): Promise<void> {
  for (const record of records) {
    if ("storageRoot" in record && "relativePath" in record && "folderId" in record) {
      continue;
    }

    const normalized = {
      ...(record as Record<string, unknown>),
      storageRoot: "user",
      folderId: assetsRawFolder.id,
      relativePath: String((record as { name?: string }).name ?? "item").toLowerCase().replace(/\s+/g, "-"),
    } as TAsset & { storageMode?: "disk" | "blob"; blobKey?: string | null };

    if ("storageMode" in normalized) {
      normalized.storageMode = normalized.blobKey ? "blob" : "disk";
      if (!normalized.blobKey) {
        normalized.blobKey = null;
      }
    }

    await save(normalized);
  }
}

async function persistCoreDefinitionsOnDisk(
  records: Array<EditorEntityRecord | SceneDefinition | GameDefinition | ActionDefinition>,
): Promise<void> {
  for (const record of records) {
    if (record.storageRoot !== "core") {
      continue;
    }
    if ("sourceKind" in record) {
      continue;
    }
    await writeJsonOnDisk("core", record.relativePath, JSON.stringify(record, null, 2));
  }
}

async function applyPendingDevReset(repository: EditorRepository): Promise<void> {
  if (!import.meta.env.DEV) {
    return;
  }

  const resetToken = await readDevResetToken();
  if (!resetToken) {
    return;
  }

  const appliedToken = await repository.getMeta(META_DEV_RESET_TOKEN);
  if (appliedToken === resetToken) {
    return;
  }

  await repository.clearContent();
  await repository.setMeta(META_BOOTSTRAPPED, "false");
  await repository.setMeta(META_CORE_SEEDED, "false");
  await repository.setMeta(META_RUNTIME_SEEDED, "false");
  await repository.setMeta(META_DEV_RESET_TOKEN, resetToken);
}

async function readDevResetToken(): Promise<string | null> {
  try {
    const response = await fetch(`/__dev/editor/reset-token?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as { token?: unknown };
    return typeof payload.token === "string" && payload.token.trim().length > 0
      ? payload.token
      : null;
  } catch {
    return null;
  }
}
