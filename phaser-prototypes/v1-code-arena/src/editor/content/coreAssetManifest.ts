import type { FolderRecord, RawAssetKind, RawAssetRecord } from "../domain/editorTypes";
import { GENERATED_CORE_FOLDER_SEEDS, GENERATED_CORE_RAW_ASSET_SEEDS } from "./generatedCoreBiomeManifest";

export const ROOT_FOLDER_IDS = {
  core: "folder:root:core",
  user: "folder:root:user",
  archived: "folder:root:archived",
  userAssetsRaw: "folder:user:assets-raw",
} as const;

interface CoreFolderSeed {
  id: string;
  name: string;
  slug: string;
  parentFolderId: string;
}

interface CoreRawAssetSeed {
  id: string;
  name: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  sourceKind: RawAssetKind;
  folderId: string;
  filename: string;
}

const CORE_FOLDER_SEEDS: CoreFolderSeed[] = [
  { id: "folder:core:characters", name: "Characters", slug: "characters", parentFolderId: ROOT_FOLDER_IDS.core },
  { id: "folder:core:characters:shinobi", name: "Shinobi", slug: "shinobi", parentFolderId: "folder:core:characters" },
  { id: "folder:core:characters:shinobi:sources", name: "Sources", slug: "sources", parentFolderId: "folder:core:characters:shinobi" },
  { id: "folder:core:characters:shinobi:sprite-sheets", name: "Sprite Sheets", slug: "sprite-sheets", parentFolderId: "folder:core:characters:shinobi" },
  { id: "folder:core:characters:shinobi:animations", name: "Animations", slug: "animations", parentFolderId: "folder:core:characters:shinobi" },
  { id: "folder:core:worlds", name: "Worlds", slug: "worlds", parentFolderId: ROOT_FOLDER_IDS.core },
  { id: "folder:core:worlds:swamp", name: "Swamp", slug: "swamp", parentFolderId: "folder:core:worlds" },
  { id: "folder:core:worlds:swamp:tilesets", name: "Tilesets", slug: "tilesets", parentFolderId: "folder:core:worlds:swamp" },
  { id: "folder:core:worlds:swamp:backgrounds", name: "Backgrounds", slug: "backgrounds", parentFolderId: "folder:core:worlds:swamp" },
  { id: "folder:core:worlds:swamp:maps", name: "Maps", slug: "maps", parentFolderId: "folder:core:worlds:swamp" },
  { id: "folder:core:worlds:swamp:levels", name: "Levels", slug: "levels", parentFolderId: "folder:core:worlds:swamp" },
  { id: "folder:core:pickups", name: "Pickups", slug: "pickups", parentFolderId: ROOT_FOLDER_IDS.core },
  { id: "folder:core:pickups:coin", name: "Coin", slug: "coin", parentFolderId: "folder:core:pickups" },
  { id: "folder:core:pickups:coin:sources", name: "Sources", slug: "sources", parentFolderId: "folder:core:pickups:coin" },
  { id: "folder:core:pickups:coin:sprite-sheets", name: "Sprite Sheets", slug: "sprite-sheets", parentFolderId: "folder:core:pickups:coin" },
  { id: "folder:core:pickups:coin:animations", name: "Animations", slug: "animations", parentFolderId: "folder:core:pickups:coin" },
  ...GENERATED_CORE_FOLDER_SEEDS,
];

const CORE_RAW_ASSET_SEEDS: CoreRawAssetSeed[] = [
  {
    id: "core:raw:shinobi:idle",
    name: "Shinobi Idle",
    originalFilename: "Idle.png",
    width: 768,
    height: 128,
    sizeBytes: 21457,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "idle.png",
  },
  {
    id: "core:raw:shinobi:run",
    name: "Shinobi Run",
    originalFilename: "Run.png",
    width: 1024,
    height: 128,
    sizeBytes: 23573,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "run.png",
  },
  {
    id: "core:raw:shinobi:jump",
    name: "Shinobi Jump",
    originalFilename: "Jump.png",
    width: 1536,
    height: 128,
    sizeBytes: 27315,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "jump.png",
  },
  {
    id: "core:raw:shinobi:attack-1",
    name: "Shinobi Attack 1",
    originalFilename: "Attack_1.png",
    width: 640,
    height: 128,
    sizeBytes: 23153,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "attack-1.png",
  },
  {
    id: "core:raw:shinobi:hurt",
    name: "Shinobi Hurt",
    originalFilename: "Hurt.png",
    width: 256,
    height: 128,
    sizeBytes: 19694,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "hurt.png",
  },
  {
    id: "core:raw:shinobi:dead",
    name: "Shinobi Dead",
    originalFilename: "Dead.png",
    width: 512,
    height: 128,
    sizeBytes: 21543,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:characters:shinobi:sources",
    filename: "dead.png",
  },
  {
    id: "core:raw:swamp:tileset",
    name: "Swamp Tileset",
    originalFilename: "Tileset.png",
    width: 320,
    height: 192,
    sizeBytes: 5921,
    sourceKind: "tileset-source",
    folderId: "folder:core:worlds:swamp:tilesets",
    filename: "swamp-tileset.png",
  },
  {
    id: "core:raw:swamp:bg-1",
    name: "Swamp Background 1",
    originalFilename: "1.png",
    width: 0,
    height: 0,
    sizeBytes: 0,
    sourceKind: "image-source",
    folderId: "folder:core:worlds:swamp:backgrounds",
    filename: "background-1.png",
  },
  {
    id: "core:raw:swamp:bg-2",
    name: "Swamp Background 2",
    originalFilename: "2.png",
    width: 0,
    height: 0,
    sizeBytes: 0,
    sourceKind: "image-source",
    folderId: "folder:core:worlds:swamp:backgrounds",
    filename: "background-2.png",
  },
  {
    id: "core:raw:swamp:bg-3",
    name: "Swamp Background 3",
    originalFilename: "3.png",
    width: 0,
    height: 0,
    sizeBytes: 0,
    sourceKind: "image-source",
    folderId: "folder:core:worlds:swamp:backgrounds",
    filename: "background-3.png",
  },
  {
    id: "core:raw:swamp:bg-4",
    name: "Swamp Background 4",
    originalFilename: "4.png",
    width: 0,
    height: 0,
    sizeBytes: 0,
    sourceKind: "image-source",
    folderId: "folder:core:worlds:swamp:backgrounds",
    filename: "background-4.png",
  },
  {
    id: "core:raw:swamp:bg-5",
    name: "Swamp Background 5",
    originalFilename: "5.png",
    width: 0,
    height: 0,
    sizeBytes: 0,
    sourceKind: "image-source",
    folderId: "folder:core:worlds:swamp:backgrounds",
    filename: "background-5.png",
  },
  {
    id: "core:raw:coin:spin",
    name: "Coin Spin",
    originalFilename: "Coin.png",
    width: 40,
    height: 10,
    sizeBytes: 1056,
    sourceKind: "spritesheet-source",
    folderId: "folder:core:pickups:coin:sources",
    filename: "coin.png",
  },
  ...GENERATED_CORE_RAW_ASSET_SEEDS,
];

export function createRootFolderRecords(now: string): FolderRecord[] {
  return [
    createFolderRecord(ROOT_FOLDER_IDS.core, "Core", "core", "core", null, "", now, true),
    createFolderRecord(ROOT_FOLDER_IDS.user, "User", "user", "user", null, "", now, true),
    createFolderRecord(ROOT_FOLDER_IDS.archived, "Archived", "archived", "archived", null, "", now, true),
    createFolderRecord(ROOT_FOLDER_IDS.userAssetsRaw, "assets-raw", "assets-raw", "user", ROOT_FOLDER_IDS.user, "assets-raw", now),
    ...CORE_FOLDER_SEEDS.map((seed) => {
      const parent = seed.parentFolderId === ROOT_FOLDER_IDS.core
        ? ""
        : findCoreFolderRelativePath(seed.parentFolderId);
      const relativePath = parent ? `${parent}/${seed.slug}` : seed.slug;
      return createFolderRecord(
        seed.id,
        seed.name,
        seed.slug,
        "core",
        seed.parentFolderId,
        relativePath,
        now,
      );
    }),
  ];
}

export function createCoreRawAssetRecords(now: string): RawAssetRecord[] {
  return CORE_RAW_ASSET_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    originalFilename: seed.originalFilename,
    mimeType: "image/png",
    width: seed.width,
    height: seed.height,
    sizeBytes: seed.sizeBytes,
    sourceKind: seed.sourceKind,
    storageMode: "disk",
    blobKey: null,
    storageRoot: "core",
    folderId: seed.folderId,
    relativePath: `${findCoreFolderRelativePath(seed.folderId)}/${seed.filename}`,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
}

function createFolderRecord(
  id: string,
  name: string,
  slug: string,
  storageRoot: "core" | "user" | "archived",
  parentFolderId: string | null,
  relativePath: string,
  now: string,
  system = false,
): FolderRecord {
  return {
    id,
    name,
    slug,
    storageRoot,
    parentFolderId,
    relativePath,
    createdAt: now,
    updatedAt: now,
    system,
  };
}

function findCoreFolderRelativePath(folderId: string): string {
  if (folderId === ROOT_FOLDER_IDS.core) {
    return "";
  }
  const seed = CORE_FOLDER_SEEDS.find((entry) => entry.id === folderId);
  if (!seed) {
    throw new Error(`Unknown core folder id: ${folderId}`);
  }

  const parentPath = seed.parentFolderId === ROOT_FOLDER_IDS.core
    ? ""
    : findCoreFolderRelativePath(seed.parentFolderId);
  return parentPath ? `${parentPath}/${seed.slug}` : seed.slug;
}
