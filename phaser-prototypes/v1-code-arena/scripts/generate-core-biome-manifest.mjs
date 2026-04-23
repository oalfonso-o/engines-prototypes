import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const editorAssetsRoot = resolve(projectRoot, "editor-assets", "core");
const generatedManifestPath = resolve(projectRoot, "src", "editor", "content", "generatedCoreBiomeManifest.ts");

const existingFolderPaths = new Set([
  "characters",
  "characters/shinobi",
  "characters/shinobi/sources",
  "characters/shinobi/sprite-sheets",
  "characters/shinobi/animations",
  "worlds",
  "worlds/swamp",
  "worlds/swamp/tilesets",
  "worlds/swamp/backgrounds",
  "worlds/swamp/maps",
  "worlds/swamp/levels",
  "pickups",
  "pickups/coin",
  "pickups/coin/sources",
  "pickups/coin/sprite-sheets",
  "pickups/coin/animations",
]);

const segmentNameOverrides = new Map([
  ["animated-objects", "Animated Objects"],
  ["animated-frames", "Animated Frames"],
  ["setpieces", "Setpieces"],
  ["characters", "Characters"],
  ["sources", "Sources"],
  ["bosses", "Bosses"],
  ["enemies", "Enemies"],
  ["tilesets", "Tilesets"],
  ["backgrounds", "Backgrounds"],
  ["props", "Props"],
  ["variants", "Variants"],
  ["workers", "Workers"],
  ["miner", "Miner"],
  ["mining", "Mining"],
]);

const folderEntries = new Map();
const rawAssetEntries = [];
const rawAssetIds = new Set();
const rawAssetRelativePaths = new Set();

await importSwampBiome();
await importMineBiome();
await importForestBiome();
await importSnowBiome();
await writeGeneratedManifest();

console.log(`Generated ${generatedManifestPath}`);
console.log(`Folders: ${folderEntries.size}`);
console.log(`Raw assets: ${rawAssetEntries.length}`);

async function importSwampBiome() {
  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-891178-swamp-enemies-sprite-sheets-pixel-art",
    worldSlug: "swamp",
    categorySlug: "enemies",
    fallbackLabelPrefix: "Swamp Enemy",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-781167-free-swamp-bosses-pixel-art-character-pack",
    worldSlug: "swamp",
    categorySlug: "bosses",
    fallbackLabelPrefix: "Swamp Boss",
  });

  await importRecursiveDirectory({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-net-672461-free-swamp-game-tileset-pixel-art/3 Objects",
    destinationFolder: "worlds/swamp/props",
    sourceKind: "image-source",
    nameBuilder: buildWorldAssetName("Swamp"),
  });

  await importRecursiveDirectory({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-net-672461-free-swamp-game-tileset-pixel-art/4 Animated objects",
    destinationFolder: "worlds/swamp/animated-objects",
    sourceKind: "spritesheet-source",
    nameBuilder: buildWorldAssetName("Swamp"),
    skipFilenames: new Set(["coin.png"]),
  });
}

async function importMineBiome() {
  await importEnvironmentPack({
    worldSlug: "mine",
    worldLabel: "Mine",
    sourceDir: "/Users/oalfonso/2dassets/craftpix-781156-mine-tileset-platformer-pixel-art",
    tileset: {
      sourceRelativePath: "1 Tiles/Tileset.png",
      destinationFilename: "mine-main-tileset.png",
      assetName: "Mine Main Tileset",
    },
    backgroundDir: "2 Background/Layers",
    propsDir: "3 Objects",
    animatedDir: "4 Animated objects",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-781105-underground-mine-character-spritesheets-pixel-art",
    worldSlug: "mine",
    categorySlug: "enemies",
    fallbackLabelPrefix: "Mine Enemy",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-781670-mine-bosses-game-character-pixel-art-pack",
    worldSlug: "mine",
    categorySlug: "bosses",
    fallbackLabelPrefix: "Mine Boss",
  });

  await importSingleEntitySpritesheets({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-891165-mining-game-assets-pixel-art-pack/1 Miner",
    destinationFolder: "worlds/mine/characters/miner/sources",
    entityLabel: "Miner",
  });

  await importFlatDirectory({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-891165-mining-game-assets-pixel-art-pack/2 Objects",
    destinationFolder: "worlds/mine/setpieces/mining",
    sourceKind: "image-source",
    nameBuilder: buildWorldAssetName("Mine"),
  });

  await importFlatDirectory({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-891165-mining-game-assets-pixel-art-pack/3 Character animation",
    destinationFolder: "worlds/mine/characters/workers/sources",
    sourceKind: "spritesheet-source",
    nameBuilder: buildWorldAssetName("Mine"),
  });
}

async function importForestBiome() {
  await importEnvironmentPack({
    worldSlug: "forest",
    worldLabel: "Forest",
    sourceDir: "/Users/oalfonso/2dassets/craftpix-net-247157-tiny-forest-tileset-platformer-pixel-art",
    tileset: {
      sourceRelativePath: "2 Tiles/Jungle_Tileset.png",
      destinationFilename: "forest-main-tileset.png",
      assetName: "Forest Main Tileset",
    },
    backgroundDir: "1 Background/Layers",
    propsDir: "3 Objects",
    animatedDir: "4 Objects_Animated",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-net-889816-forest-enemies-pixel-art-sprite-sheet-pack",
    worldSlug: "forest",
    categorySlug: "enemies",
    fallbackLabelPrefix: "Forest Enemy",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-net-413641-free-forest-bosses-pixel-art-sprite-sheet-pack",
    worldSlug: "forest",
    categorySlug: "bosses",
    fallbackLabelPrefix: "Forest Boss",
  });
}

async function importSnowBiome() {
  await importEnvironmentPack({
    worldSlug: "snow",
    worldLabel: "Snow",
    sourceDir: "/Users/oalfonso/2dassets/craftpix-891179-snow-2d-game-tileset-pixel-art",
    tileset: {
      sourceRelativePath: "1 Tiles/Tileset.png",
      destinationFilename: "snow-main-tileset.png",
      assetName: "Snow Main Tileset",
    },
    backgroundDir: "2 Background/Layers",
    propsDir: "3 Objects",
    animatedDir: "4 Animated objects",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-781196-snow-enemy-character-sprites-pixel-art",
    worldSlug: "snow",
    categorySlug: "enemies",
    fallbackLabelPrefix: "Snow Enemy",
  });

  await importCharacterPack({
    sourceDir: "/Users/oalfonso/2dassets/craftpix-896711-snow-bosses-game-character-pixel-art-pack",
    worldSlug: "snow",
    categorySlug: "bosses",
    fallbackLabelPrefix: "Snow Boss",
  });
}

async function importEnvironmentPack({
  worldSlug,
  worldLabel,
  sourceDir,
  tileset,
  backgroundDir,
  propsDir,
  animatedDir,
}) {
  await importSingleFile({
    sourcePath: resolve(sourceDir, tileset.sourceRelativePath),
    destinationRelativePath: `worlds/${worldSlug}/tilesets/${tileset.destinationFilename}`,
    name: tileset.assetName,
    sourceKind: "tileset-source",
  });

  await importFlatDirectory({
    sourceDir: resolve(sourceDir, backgroundDir),
    destinationFolder: `worlds/${worldSlug}/backgrounds`,
    sourceKind: "image-source",
    nameBuilder: (_parts, stem) => `${worldLabel} Background ${titleCase(stem)}`,
  });

  await importRecursiveDirectory({
    sourceDir: resolve(sourceDir, propsDir),
    destinationFolder: `worlds/${worldSlug}/props`,
    sourceKind: "image-source",
    nameBuilder: buildWorldAssetName(worldLabel),
  });

  await importFlatDirectory({
    sourceDir: resolve(sourceDir, animatedDir),
    destinationFolder: `worlds/${worldSlug}/animated-objects`,
    sourceKind: "spritesheet-source",
    nameBuilder: buildWorldAssetName(worldLabel),
  });
}

async function importCharacterPack({
  sourceDir,
  worldSlug,
  categorySlug,
  fallbackLabelPrefix,
}) {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  const entityDirs = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !["PSD", "Font"].includes(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const [index, entityDir] of entityDirs.entries()) {
    const entityLabel = extractPackEntityLabel(entityDir.name, fallbackLabelPrefix, index + 1);
    const entitySlug = slugify(entityLabel);
    const entitySourceDir = resolve(sourceDir, entityDir.name);
    const files = await collectPngFiles(entitySourceDir, { recursive: false });
    for (const file of files) {
      const stem = file.slice(0, -4);
      const actionLabel = deriveActionLabel(stem, entityLabel);
      const name = actionLabel ? `${entityLabel} ${actionLabel}` : entityLabel;
      const filename = actionLabel ? `${slugify(actionLabel)}.png` : `${entitySlug}.png`;
      await importSingleFile({
        sourcePath: resolve(entitySourceDir, file),
        destinationRelativePath: `worlds/${worldSlug}/${categorySlug}/${entitySlug}/sources/${filename}`,
        name,
        sourceKind: "spritesheet-source",
      });
    }
  }
}

async function importSingleEntitySpritesheets({
  sourceDir,
  destinationFolder,
  entityLabel,
}) {
  const files = await collectPngFiles(sourceDir, { recursive: false });
  const entitySlug = slugify(entityLabel);
  for (const file of files) {
    const stem = file.slice(0, -4);
    const actionLabel = deriveActionLabel(stem, entityLabel);
    const name = actionLabel ? `${entityLabel} ${actionLabel}` : entityLabel;
    const filename = actionLabel ? `${slugify(actionLabel)}.png` : `${entitySlug}.png`;
    await importSingleFile({
      sourcePath: resolve(sourceDir, file),
      destinationRelativePath: `${destinationFolder}/${filename}`,
      name,
      sourceKind: "spritesheet-source",
    });
  }
}

async function importFlatDirectory({
  sourceDir,
  destinationFolder,
  sourceKind,
  nameBuilder,
  skipFilenames = new Set(),
}) {
  const files = await collectPngFiles(sourceDir, { recursive: false });
  for (const file of files) {
    if (skipFilenames.has(file.toLowerCase())) {
      continue;
    }
    const stem = file.slice(0, -4);
    await importSingleFile({
      sourcePath: resolve(sourceDir, file),
      destinationRelativePath: `${destinationFolder}/${slugify(stem)}.png`,
      name: nameBuilder([], stem),
      sourceKind,
    });
  }
}

async function importRecursiveDirectory({
  sourceDir,
  destinationFolder,
  sourceKind,
  nameBuilder,
  skipFilenames = new Set(),
}) {
  const files = await walkPngFiles(sourceDir);
  for (const absolutePath of files) {
    const relativePath = relative(sourceDir, absolutePath).replaceAll("\\", "/");
    const basename = relativePath.split("/").at(-1);
    if (!basename) {
      continue;
    }
    if (skipFilenames.has(basename.toLowerCase())) {
      continue;
    }
    const parts = relativePath.split("/");
    const stem = parts.at(-1)?.slice(0, -4) ?? "";
    const folderParts = parts.slice(0, -1).map((entry) => slugify(entry));
    const destinationDir = folderParts.length > 0
      ? `${destinationFolder}/${folderParts.join("/")}`
      : destinationFolder;
    await importSingleFile({
      sourcePath: absolutePath,
      destinationRelativePath: `${destinationDir}/${slugify(stem)}.png`,
      name: nameBuilder(folderParts, stem),
      sourceKind,
    });
  }
}

async function importSingleFile({
  sourcePath,
  destinationRelativePath,
  name,
  sourceKind,
}) {
  const normalizedRelativePath = destinationRelativePath.replaceAll("\\", "/");
  const folderPath = dirname(normalizedRelativePath).replaceAll("\\", "/");
  const filename = normalizedRelativePath.split("/").at(-1);
  if (!filename) {
    throw new Error(`Missing filename for ${normalizedRelativePath}`);
  }

  ensureFolderPath(folderPath);

  const assetId = buildRawAssetId(normalizedRelativePath);
  if (rawAssetIds.has(assetId)) {
    throw new Error(`Duplicate raw asset id: ${assetId}`);
  }
  if (rawAssetRelativePaths.has(normalizedRelativePath)) {
    throw new Error(`Duplicate raw asset path: ${normalizedRelativePath}`);
  }

  const targetPath = resolve(editorAssetsRoot, normalizedRelativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);

  const inspection = await inspectPng(sourcePath);
  rawAssetIds.add(assetId);
  rawAssetRelativePaths.add(normalizedRelativePath);
  rawAssetEntries.push({
    id: assetId,
    name,
    originalFilename: sourcePath.split("/").at(-1) ?? filename,
    width: inspection.width,
    height: inspection.height,
    sizeBytes: inspection.sizeBytes,
    sourceKind,
    folderId: buildFolderId(folderPath),
    filename,
  });
}

function ensureFolderPath(relativeFolderPath) {
  const segments = relativeFolderPath.split("/").filter(Boolean);
  let currentPath = "";
  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    if (existingFolderPaths.has(currentPath) || folderEntries.has(currentPath)) {
      continue;
    }
    const parentPath = currentPath.includes("/")
      ? currentPath.slice(0, currentPath.lastIndexOf("/"))
      : "";
    folderEntries.set(currentPath, {
      id: buildFolderId(currentPath),
      name: segmentNameOverrides.get(segment) ?? titleCase(segment),
      slug: segment,
      parentFolderId: parentPath ? buildFolderId(parentPath) : "folder:root:core",
    });
  }
}

function buildFolderId(relativeFolderPath) {
  return `folder:core:${relativeFolderPath.split("/").join(":")}`;
}

function buildRawAssetId(relativeFilePath) {
  return `core:raw:${relativeFilePath.replace(/\.png$/i, "").split("/").join(":")}`;
}

function buildWorldAssetName(worldLabel) {
  return (folderParts, stem) => {
    const folderLabel = folderParts.map((part) => titleCase(part)).join(" ");
    const stemLabel = titleCase(stem);
    return [worldLabel, folderLabel, stemLabel].filter(Boolean).join(" ");
  };
}

function extractPackEntityLabel(rawName, fallbackPrefix, index) {
  const cleaned = rawName.replace(/^\d+\s*/, "").trim();
  const pretty = titleCase(cleaned);
  if (pretty.length > 0 && /[A-Za-z]/.test(pretty)) {
    return pretty;
  }
  return `${fallbackPrefix} ${index}`;
}

function deriveActionLabel(stem, entityLabel) {
  const prettyStem = titleCase(stem);
  const prettyEntity = titleCase(entityLabel);
  if (prettyStem.toLowerCase() === prettyEntity.toLowerCase()) {
    return "";
  }
  if (prettyStem.toLowerCase().startsWith(`${prettyEntity.toLowerCase()} `)) {
    return prettyStem.slice(prettyEntity.length + 1);
  }
  return prettyStem;
}

async function collectPngFiles(dirPath, { recursive }) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...await walkPngFiles(absolutePath));
      }
      continue;
    }
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".png") {
      files.push(entry.name);
    }
  }
  return files;
}

async function walkPngFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkPngFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".png") {
      files.push(absolutePath);
    }
  }
  return files;
}

async function inspectPng(filePath) {
  const [fileStat, header] = await Promise.all([
    stat(filePath),
    readFile(filePath, { encoding: null }),
  ]);
  if (header.byteLength < 24) {
    throw new Error(`Invalid PNG file: ${filePath}`);
  }
  const signature = header.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Unexpected PNG signature: ${filePath}`);
  }
  if (header.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`Missing IHDR chunk: ${filePath}`);
  }
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
    sizeBytes: fileStat.size,
  };
}

async function writeGeneratedManifest() {
  const folderSeeds = [...folderEntries.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
  const rawSeeds = [...rawAssetEntries].sort((left, right) => left.id.localeCompare(right.id));
  const content = `// Auto-generated by scripts/generate-core-biome-manifest.mjs\n` +
    `// Do not edit manually.\n\n` +
    `export const GENERATED_CORE_FOLDER_SEEDS = ${JSON.stringify(folderSeeds, null, 2)} as const;\n\n` +
    `export const GENERATED_CORE_RAW_ASSET_SEEDS = ${JSON.stringify(rawSeeds, null, 2)} as const;\n`;
  await writeFile(generatedManifestPath, content, "utf8");
}

function titleCase(value) {
  const normalized = String(value)
    .replace(/\.png$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length === 0) {
    return "";
  }
  return normalized.split(" ").map((part) => {
    if (/^\d+$/.test(part)) {
      return part;
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function slugify(value) {
  const normalized = String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
  return normalized.length > 0 ? normalized : "item";
}
