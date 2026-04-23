import type {
  GameDefinition,
  AnimationDefinition,
  CharacterDefinition,
  LevelCompositionRecord,
  LevelPlacementRecord,
  MapCellRecord,
  MapDefinition,
  SceneBackgroundLayerRecord,
  SceneCollisionCellRecord,
  SceneCollisionLayerRecord,
  SceneDefinition,
  SceneObjectLayerRecord,
  SceneObjectRecord,
  SceneTileLayerRecord,
  SpriteFrameRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
  TilesetTileRecord,
} from "../domain/editorTypes";
import { TILE_FRAME } from "../../game/level/levelData";
import { loadPrototypeSettings } from "../../settings/loadPrototypeSettings";

const SETTINGS = loadPrototypeSettings();

export const CORE_DERIVED_IDS = {
  tilesetSwampMain: "core:tileset:swamp-main",
  spritesheetShinobiIdle: "core:spritesheet:shinobi-idle",
  spritesheetShinobiRun: "core:spritesheet:shinobi-run",
  spritesheetShinobiJump: "core:spritesheet:shinobi-jump",
  spritesheetShinobiAttack1: "core:spritesheet:shinobi-attack-1",
  spritesheetShinobiHurt: "core:spritesheet:shinobi-hurt",
  spritesheetShinobiDead: "core:spritesheet:shinobi-dead",
  spritesheetCoinSpin: "core:spritesheet:coin-spin",
  animationPlayerIdle: "core:animation:player-idle",
  animationPlayerRun: "core:animation:player-run",
  animationPlayerJump: "core:animation:player-jump",
  animationPlayerAttack1: "core:animation:player-attack-1",
  animationPlayerHurt: "core:animation:player-hurt",
  animationPlayerDead: "core:animation:player-dead",
  animationCoinSpin: "core:animation:coin-spin",
  characterPlayerShinobi: "core:character:player-shinobi",
  mapSwampCampaignV1: "core:map:swamp-campaign-v1",
  levelCampaignV1: "core:level:campaign-v1",
  sceneSwampCampaignV1: "core:scene:swamp-campaign-v1",
  gameCanuterMain: "core:game:canuter-main",
} as const;

const CORE_FOLDERS = {
  shinobi: "folder:core:characters:shinobi",
  shinobiSpriteSheets: "folder:core:characters:shinobi:sprite-sheets",
  shinobiAnimations: "folder:core:characters:shinobi:animations",
  swampTilesets: "folder:core:worlds:swamp:tilesets",
  swampMaps: "folder:core:worlds:swamp:maps",
  swampLevels: "folder:core:worlds:swamp:levels",
  coinSpriteSheets: "folder:core:pickups:coin:sprite-sheets",
  coinAnimations: "folder:core:pickups:coin:animations",
} as const;

export function createCoreTilesetRecords(now: string): TilesetDefinition[] {
  return [
    {
      id: CORE_DERIVED_IDS.tilesetSwampMain,
      name: "Swamp Main Tileset",
      storageRoot: "core",
      folderId: CORE_FOLDERS.swampTilesets,
      relativePath: "worlds/swamp/tilesets/swamp-main.json",
      sourceAssetId: "core:raw:swamp:tileset",
      cellWidth: 32,
      cellHeight: 32,
      offsetX: 0,
      offsetY: 0,
      tiles: buildTilesetTiles(10, 6, 32, 32),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createCoreSpriteSheetRecords(now: string): SpriteSheetDefinition[] {
  return [
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiIdle, "Shinobi Idle Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:idle", "characters/shinobi/sprite-sheets/shinobi-idle.json", 128, 128, 6),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiRun, "Shinobi Run Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:run", "characters/shinobi/sprite-sheets/shinobi-run.json", 128, 128, 8),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiJump, "Shinobi Jump Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:jump", "characters/shinobi/sprite-sheets/shinobi-jump.json", 128, 128, 12),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiAttack1, "Shinobi Attack 1 Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:attack-1", "characters/shinobi/sprite-sheets/shinobi-attack-1.json", 128, 128, 5),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiHurt, "Shinobi Hurt Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:hurt", "characters/shinobi/sprite-sheets/shinobi-hurt.json", 128, 128, 2),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetShinobiDead, "Shinobi Dead Sheet", CORE_FOLDERS.shinobiSpriteSheets, "core:raw:shinobi:dead", "characters/shinobi/sprite-sheets/shinobi-dead.json", 128, 128, 4),
    createSpriteSheetRecord(now, CORE_DERIVED_IDS.spritesheetCoinSpin, "Coin Spin Sheet", CORE_FOLDERS.coinSpriteSheets, "core:raw:coin:spin", "pickups/coin/sprite-sheets/coin-spin.json", 10, 10, 4),
  ];
}

export function createCoreAnimationRecords(now: string): AnimationDefinition[] {
  return [
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerIdle, "Player Idle", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-idle.json", CORE_DERIVED_IDS.spritesheetShinobiIdle, 6, 125, true),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerRun, "Player Run", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-run.json", CORE_DERIVED_IDS.spritesheetShinobiRun, 8, 83, true),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerJump, "Player Jump", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-jump.json", CORE_DERIVED_IDS.spritesheetShinobiJump, 12, 71, true),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerAttack1, "Player Attack 1", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-attack-1.json", CORE_DERIVED_IDS.spritesheetShinobiAttack1, 5, 90, false),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerHurt, "Player Hurt", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-hurt.json", CORE_DERIVED_IDS.spritesheetShinobiHurt, 2, 120, false),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationPlayerDead, "Player Dead", CORE_FOLDERS.shinobiAnimations, "characters/shinobi/animations/player-dead.json", CORE_DERIVED_IDS.spritesheetShinobiDead, 4, 120, false),
    createAnimationRecord(now, CORE_DERIVED_IDS.animationCoinSpin, "Coin Spin", CORE_FOLDERS.coinAnimations, "pickups/coin/animations/coin-spin.json", CORE_DERIVED_IDS.spritesheetCoinSpin, 4, 100, true),
  ];
}

export function createCoreCharacterRecords(now: string): CharacterDefinition[] {
  return [
    {
      id: CORE_DERIVED_IDS.characterPlayerShinobi,
      name: "Player Shinobi",
      storageRoot: "core",
      folderId: CORE_FOLDERS.shinobi,
      relativePath: "characters/shinobi/player-shinobi.json",
      idleAnimationId: CORE_DERIVED_IDS.animationPlayerIdle,
      runSideAnimationId: CORE_DERIVED_IDS.animationPlayerRun,
      runSideFacing: "right",
      jumpAnimationId: CORE_DERIVED_IDS.animationPlayerJump,
      attackAnimationId: CORE_DERIVED_IDS.animationPlayerAttack1,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createCoreMapRecords(now: string): MapDefinition[] {
  const tileSize = SETTINGS.world.tile_size;
  return [
    {
      id: CORE_DERIVED_IDS.mapSwampCampaignV1,
      name: "Swamp Campaign Map",
      storageRoot: "core",
      folderId: CORE_FOLDERS.swampMaps,
      relativePath: "worlds/swamp/maps/swamp-campaign-v1.json",
      widthInCells: SETTINGS.world.width_tiles,
      heightInCells: SETTINGS.world.height_tiles,
      tileWidth: tileSize,
      tileHeight: tileSize,
      tileFitMode: "crop",
      cells: buildMapCells(),
      collisionCells: buildCollisionCells(),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createCoreLevelCompositionRecords(now: string): LevelCompositionRecord[] {
  return [
    {
      id: CORE_DERIVED_IDS.levelCampaignV1,
      name: "Campaign V1",
      storageRoot: "core",
      folderId: CORE_FOLDERS.swampLevels,
      relativePath: "worlds/swamp/levels/campaign-v1.json",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      mapId: CORE_DERIVED_IDS.mapSwampCampaignV1,
      playerCharacterId: CORE_DERIVED_IDS.characterPlayerShinobi,
      spawnX: SETTINGS.player.spawn_x,
      spawnY: SETTINGS.player.spawn_y,
      groundSegments: SETTINGS.level.ground_segments.map((segment) => ({ ...segment })),
      floatingPlatforms: SETTINGS.level.floating_platforms.map((segment) => ({ ...segment })),
      waterStrips: SETTINGS.level.water_strips.map((strip) => ({ ...strip })),
      placements: SETTINGS.level.coin_positions.map((position, index) => createCoinPlacement(index, position.x, position.y)),
    },
  ];
}

export function createCoreSceneRecords(now: string): SceneDefinition[] {
  const map = createCoreMapRecords(now)[0];
  const level = createCoreLevelCompositionRecords(now)[0];

  return [
    {
      id: CORE_DERIVED_IDS.sceneSwampCampaignV1,
      name: "Swamp Campaign Scene",
      storageRoot: "core",
      folderId: CORE_FOLDERS.swampLevels,
      relativePath: "worlds/swamp/scenes/swamp-campaign-v1.json",
      widthInCells: map.widthInCells,
      heightInCells: map.heightInCells,
      tileWidth: map.tileWidth,
      tileHeight: map.tileHeight,
      tileFitMode: map.tileFitMode,
      defaultPlayerCharacterId: level.playerCharacterId,
      layers: [
        ...createSwampBackgroundLayers(),
        createSwampTileLayer(map.cells),
        createSwampSolidCollisionLayer(),
        createSwampPlatformCollisionLayer(),
        createSwampWaterCollisionLayer(),
        createSwampObjectLayer(level),
      ],
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createCoreGameRecords(now: string): GameDefinition[] {
  return [
    {
      id: CORE_DERIVED_IDS.gameCanuterMain,
      name: "Canuter Main",
      storageRoot: "core",
      folderId: null,
      relativePath: "games/canuter-main.json",
      entrySceneId: CORE_DERIVED_IDS.sceneSwampCampaignV1,
      entryPointId: null,
      defaultPlayerCharacterId: CORE_DERIVED_IDS.characterPlayerShinobi,
      initialFlags: [],
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createSpriteSheetRecord(
  now: string,
  id: string,
  name: string,
  folderId: string,
  sourceAssetId: string,
  relativePath: string,
  cellWidth: number,
  cellHeight: number,
  frameCount: number,
): SpriteSheetDefinition {
  return {
    id,
    name,
    storageRoot: "core",
    folderId,
    relativePath,
    sourceAssetId,
    cellWidth,
    cellHeight,
    offsetX: 0,
    offsetY: 0,
    frames: buildFrames(frameCount, cellWidth, cellHeight),
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createAnimationRecord(
  now: string,
  id: string,
  name: string,
  folderId: string,
  relativePath: string,
  spriteSheetId: string,
  frameCount: number,
  frameDurationMs: number,
  loop: boolean,
): AnimationDefinition {
  return {
    id,
    name,
    storageRoot: "core",
    folderId,
    relativePath,
    spriteSheetId,
    frameIds: buildFrameIds(frameCount),
    frameDurationMs,
    loop,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildFrames(frameCount: number, cellWidth: number, cellHeight: number): SpriteFrameRecord[] {
  return Array.from({ length: frameCount }, (_, index) => ({
    id: `frame-${index}`,
    rect: {
      x: index * cellWidth,
      y: 0,
      width: cellWidth,
      height: cellHeight,
    },
    label: null,
  }));
}

function buildFrameIds(frameCount: number): string[] {
  return Array.from({ length: frameCount }, (_, index) => `frame-${index}`);
}

function buildTilesetTiles(columns: number, rows: number, cellWidth: number, cellHeight: number): TilesetTileRecord[] {
  const tiles: TilesetTileRecord[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns) + column;
      tiles.push({
        id: `tile-${index}`,
        rect: {
          x: column * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        },
        label: null,
      });
    }
  }
  return tiles;
}

function buildMapCells(): MapCellRecord[] {
  const cells: MapCellRecord[] = [];
  SETTINGS.level.ground_segments.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      cells.push(createMapCell(x, segment.top, x === segment.start ? TILE_FRAME.groundLeft : x === segment.end ? TILE_FRAME.groundRight : TILE_FRAME.groundMid));
      for (let row = 1; row < segment.height; row += 1) {
        cells.push(createMapCell(x, segment.top + row, x === segment.start ? TILE_FRAME.fillLeft : x === segment.end ? TILE_FRAME.fillRight : TILE_FRAME.fillMid));
      }
    }
  });

  SETTINGS.level.floating_platforms.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      cells.push(createMapCell(x, segment.y, x === segment.start ? TILE_FRAME.platformLeft : x === segment.end ? TILE_FRAME.platformRight : TILE_FRAME.platformMid));
    }
  });

  SETTINGS.level.water_strips.forEach((strip) => {
    for (let x = strip.start; x <= strip.end; x += 1) {
      for (let row = 0; row < strip.rows; row += 1) {
        cells.push(createMapCell(x, strip.top + row, TILE_FRAME.water));
      }
    }
  });

  return cells;
}

function buildCollisionCells(): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  SETTINGS.level.ground_segments.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      for (let row = 0; row < segment.height; row += 1) {
        cells.push({ x, y: segment.top + row });
      }
    }
  });
  return cells;
}

function createMapCell(x: number, y: number, frame: number): MapCellRecord {
  return {
    x,
    y,
    tilesetId: CORE_DERIVED_IDS.tilesetSwampMain,
    tileId: `tile-${frame}`,
  };
}

function createCoinPlacement(index: number, x: number, y: number): LevelPlacementRecord {
  return {
    id: `coin-${index}`,
    type: "coin",
    assetId: CORE_DERIVED_IDS.animationCoinSpin,
    x,
    y,
  };
}

function createSwampBackgroundLayers(): SceneBackgroundLayerRecord[] {
  return [
    createBackgroundLayer("bg-layer-1", "Background 1", "core:raw:swamp:bg-1", 0.04),
    createBackgroundLayer("bg-layer-2", "Background 2", "core:raw:swamp:bg-2", 0.08),
    createBackgroundLayer("bg-layer-3", "Background 3", "core:raw:swamp:bg-3", 0.12),
    createBackgroundLayer("bg-layer-4", "Background 4", "core:raw:swamp:bg-4", 0.18),
    createBackgroundLayer("bg-layer-5", "Background 5", "core:raw:swamp:bg-5", 0.26),
  ];
}

function createBackgroundLayer(
  id: string,
  name: string,
  assetId: string,
  parallaxX: number,
): SceneBackgroundLayerRecord {
  return {
    id,
    name,
    kind: "background",
    visible: true,
    locked: false,
    assetId,
    parallaxX,
    parallaxY: 0,
    fitMode: "cover",
    offsetX: 0,
    offsetY: 0,
  };
}

function createSwampTileLayer(cells: MapCellRecord[]): SceneTileLayerRecord {
  return {
    id: "terrain-layer",
    name: "Terrain",
    kind: "tiles",
    visible: true,
    locked: false,
    cells: cells.map((cell) => ({ ...cell })),
  };
}

function createSwampSolidCollisionLayer(): SceneCollisionLayerRecord {
  return {
    id: "solid-layer",
    name: "Solid",
    kind: "collision",
    visible: true,
    locked: false,
    collisionKind: "solid",
    cells: buildCollisionCells().map((cell) => ({ ...cell })),
  };
}

function createSwampPlatformCollisionLayer(): SceneCollisionLayerRecord {
  const cells: SceneCollisionCellRecord[] = [];
  SETTINGS.level.floating_platforms.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      cells.push({ x, y: segment.y });
    }
  });

  return {
    id: "platform-layer",
    name: "Platforms",
    kind: "collision",
    visible: true,
    locked: false,
    collisionKind: "one-way",
    cells,
  };
}

function createSwampWaterCollisionLayer(): SceneCollisionLayerRecord {
  const cells: SceneCollisionCellRecord[] = [];
  SETTINGS.level.water_strips.forEach((strip) => {
    for (let x = strip.start; x <= strip.end; x += 1) {
      for (let row = 0; row < strip.rows; row += 1) {
        cells.push({ x, y: strip.top + row });
      }
    }
  });

  return {
    id: "water-layer",
    name: "Water",
    kind: "collision",
    visible: true,
    locked: false,
    collisionKind: "water",
    cells,
  };
}

function createSwampObjectLayer(level: LevelCompositionRecord): SceneObjectLayerRecord {
  const objects: SceneObjectRecord[] = [
    {
      id: "player-spawn-default",
      type: "player-spawn",
      x: level.spawnX,
      y: level.spawnY,
      characterId: level.playerCharacterId,
    },
    ...level.placements.map((placement) => ({
      id: placement.id,
      type: "pickup" as const,
      x: placement.x,
      y: placement.y,
      assetId: placement.assetId ?? null,
    })),
  ];

  return {
    id: "objects-layer",
    name: "Objects",
    kind: "objects",
    visible: true,
    locked: false,
    objects,
  };
}
