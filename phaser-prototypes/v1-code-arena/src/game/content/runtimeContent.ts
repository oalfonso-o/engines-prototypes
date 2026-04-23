import type {
  CoinPosition,
  FloatingPlatform,
  GroundSegment,
  PrototypeSettings,
  WaterStrip,
} from "../../settings/prototypeSettings";
import { bootstrapEditorData } from "../../editor/bootstrap/bootstrapEditorData";
import { CORE_DERIVED_IDS } from "../../editor/content/coreDerivedManifest";
import { resolveAssetById } from "../../editor/domain/assetReferences";
import { resolveAssetUrl } from "../../editor/storage/assetPathResolver";
import { EditorRepository } from "../../editor/storage/editorRepository";
import { EditorDb } from "../../editor/storage/editorDb";

export interface RuntimeTextureSource {
  key: string;
  type: "image" | "spritesheet";
  url: string;
  frameWidth?: number;
  frameHeight?: number;
}

export interface RuntimeAnimationSource {
  key: string;
  textureKey: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
}

export interface RuntimeCampaignContent {
  mapId: string;
  playerCharacterId: string;
  spawnX: number;
  spawnY: number;
  groundSegments: GroundSegment[];
  floatingPlatforms: FloatingPlatform[];
  waterStrips: WaterStrip[];
  coinPositions: CoinPosition[];
}

export interface RuntimeContentCatalog {
  textures: RuntimeTextureSource[];
  animations: RuntimeAnimationSource[];
  campaign: RuntimeCampaignContent;
}

export async function loadRuntimeContent(settings: PrototypeSettings): Promise<RuntimeContentCatalog> {
  const db = new EditorDb();
  const repository = new EditorRepository(db);

  try {
    await bootstrapEditorData(repository);
    const snapshot = await repository.loadSnapshot();
    const textures = buildTextureCatalog(snapshot);
    const animations = buildAnimationCatalog(snapshot);
    const composition = snapshot.levelCompositions.find((entry) => entry.id === CORE_DERIVED_IDS.levelCampaignV1) ?? null;
    if (!composition) {
      return {
        textures: textures.length > 0 ? textures : createFallbackTextures(),
        animations: animations.length > 0 ? animations : createFallbackAnimations(),
        campaign: createFallbackCampaignContent(settings),
      };
    }

    return {
      textures: textures.length > 0 ? textures : createFallbackTextures(),
      animations: animations.length > 0 ? animations : createFallbackAnimations(),
      campaign: {
        mapId: composition.mapId,
        playerCharacterId: composition.playerCharacterId,
        spawnX: composition.spawnX,
        spawnY: composition.spawnY,
        groundSegments: composition.groundSegments.map((segment) => ({ ...segment })),
        floatingPlatforms: composition.floatingPlatforms.map((segment) => ({ ...segment })),
        waterStrips: composition.waterStrips.map((strip) => ({ ...strip })),
        coinPositions: composition.placements
          .filter((entry) => entry.type === "coin")
          .map((entry) => ({ x: entry.x, y: entry.y })),
      },
    };
  } finally {
    await repository.close();
  }
}

function createFallbackCampaignContent(settings: PrototypeSettings): RuntimeCampaignContent {
  return {
    mapId: CORE_DERIVED_IDS.mapSwampCampaignV1,
    playerCharacterId: CORE_DERIVED_IDS.characterPlayerShinobi,
    spawnX: settings.player.spawn_x,
    spawnY: settings.player.spawn_y,
    groundSegments: settings.level.ground_segments.map((segment) => ({ ...segment })),
    floatingPlatforms: settings.level.floating_platforms.map((segment) => ({ ...segment })),
    waterStrips: settings.level.water_strips.map((strip) => ({ ...strip })),
    coinPositions: settings.level.coin_positions.map((position) => ({ ...position })),
  };
}

export function createFallbackTextures(): RuntimeTextureSource[] {
  return [
    { key: "shinobi-idle", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/idle.png", frameWidth: 128, frameHeight: 128 },
    { key: "shinobi-run", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/run.png", frameWidth: 128, frameHeight: 128 },
    { key: "shinobi-jump", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/jump.png", frameWidth: 128, frameHeight: 128 },
    { key: "swamp-tiles", type: "spritesheet", url: "editor-assets/core/worlds/swamp/tilesets/swamp-tileset.png", frameWidth: 32, frameHeight: 32 },
    { key: "swamp-bg-1", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-1.png" },
    { key: "swamp-bg-2", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-2.png" },
    { key: "swamp-bg-3", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-3.png" },
    { key: "swamp-bg-4", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-4.png" },
    { key: "swamp-bg-5", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-5.png" },
    { key: "swamp-coin", type: "spritesheet", url: "editor-assets/core/pickups/coin/sources/coin.png", frameWidth: 10, frameHeight: 10 },
  ];
}

export function createFallbackAnimations(): RuntimeAnimationSource[] {
  return [
    { key: "player-idle", textureKey: "shinobi-idle", frameCount: 6, frameRate: 8, repeat: -1 },
    { key: "player-run", textureKey: "shinobi-run", frameCount: 8, frameRate: 12, repeat: -1 },
    { key: "player-jump", textureKey: "shinobi-jump", frameCount: 12, frameRate: 14, repeat: -1 },
    { key: "coin-spin", textureKey: "swamp-coin", frameCount: 4, frameRate: 10, repeat: -1 },
  ];
}

function buildTextureCatalog(snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>): RuntimeTextureSource[] {
  return [
    createSpriteSheetTexture(snapshot, "shinobi-idle", CORE_DERIVED_IDS.spritesheetShinobiIdle),
    createSpriteSheetTexture(snapshot, "shinobi-run", CORE_DERIVED_IDS.spritesheetShinobiRun),
    createSpriteSheetTexture(snapshot, "shinobi-jump", CORE_DERIVED_IDS.spritesheetShinobiJump),
    createTilesetTexture(snapshot, "swamp-tiles", CORE_DERIVED_IDS.tilesetSwampMain),
    createImageTexture(snapshot, "swamp-bg-1", "core:raw:swamp:bg-1"),
    createImageTexture(snapshot, "swamp-bg-2", "core:raw:swamp:bg-2"),
    createImageTexture(snapshot, "swamp-bg-3", "core:raw:swamp:bg-3"),
    createImageTexture(snapshot, "swamp-bg-4", "core:raw:swamp:bg-4"),
    createImageTexture(snapshot, "swamp-bg-5", "core:raw:swamp:bg-5"),
    createSpriteSheetTexture(snapshot, "swamp-coin", CORE_DERIVED_IDS.spritesheetCoinSpin),
  ].filter((entry): entry is RuntimeTextureSource => entry !== null);
}

function buildAnimationCatalog(snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>): RuntimeAnimationSource[] {
  return [
    createAnimationSource(snapshot, "player-idle", CORE_DERIVED_IDS.animationPlayerIdle, "shinobi-idle"),
    createAnimationSource(snapshot, "player-run", CORE_DERIVED_IDS.animationPlayerRun, "shinobi-run"),
    createAnimationSource(snapshot, "player-jump", CORE_DERIVED_IDS.animationPlayerJump, "shinobi-jump"),
    createAnimationSource(snapshot, "coin-spin", CORE_DERIVED_IDS.animationCoinSpin, "swamp-coin"),
  ].filter((entry): entry is RuntimeAnimationSource => entry !== null);
}

function createImageTexture(
  snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>,
  key: string,
  rawAssetId: string,
): RuntimeTextureSource | null {
  const resolved = resolveAssetById(snapshot, rawAssetId);
  if (!resolved || !("sourceKind" in resolved.asset)) {
    return null;
  }

  return {
    key,
    type: "image",
    url: resolveAssetUrl(resolved.asset.storageRoot, resolved.asset.relativePath),
  };
}

function createTilesetTexture(
  snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>,
  key: string,
  tilesetId: string,
): RuntimeTextureSource | null {
  const resolved = resolveAssetById(snapshot, tilesetId);
  if (!resolved) {
    return null;
  }
  const tileset = resolved.asset;
  if (!("tiles" in tileset) || !("sourceAssetId" in tileset)) {
    return null;
  }

  const rawAsset = snapshot.rawAssets.find((entry) => entry.id === tileset.sourceAssetId);
  if (!rawAsset) {
    return null;
  }

  return {
    key,
    type: "spritesheet",
    url: resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath),
    frameWidth: tileset.cellWidth,
    frameHeight: tileset.cellHeight,
  };
}

function createSpriteSheetTexture(
  snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>,
  key: string,
  spriteSheetId: string,
): RuntimeTextureSource | null {
  const resolved = resolveAssetById(snapshot, spriteSheetId);
  if (!resolved) {
    return null;
  }
  const spriteSheet = resolved.asset;
  if (!("frames" in spriteSheet) || !("sourceAssetId" in spriteSheet)) {
    return null;
  }

  const rawAsset = snapshot.rawAssets.find((entry) => entry.id === spriteSheet.sourceAssetId);
  if (!rawAsset) {
    return null;
  }

  return {
    key,
    type: "spritesheet",
    url: resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath),
    frameWidth: spriteSheet.cellWidth,
    frameHeight: spriteSheet.cellHeight,
  };
}

function createAnimationSource(
  snapshot: Awaited<ReturnType<EditorRepository["loadSnapshot"]>>,
  key: string,
  animationId: string,
  textureKey: string,
): RuntimeAnimationSource | null {
  const animation = snapshot.animations.find((entry) => entry.id === animationId);
  if (!animation) {
    return null;
  }

  return {
    key,
    textureKey,
    frameCount: animation.frameIds.length,
    frameRate: Math.max(1, Math.round(1000 / animation.frameDurationMs)),
    repeat: animation.loop ? -1 : 0,
  };
}
