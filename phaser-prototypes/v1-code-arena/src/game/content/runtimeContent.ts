import type { PrototypeSettings } from "../../settings/prototypeSettings";
import { bootstrapEditorData } from "../../editor/bootstrap/bootstrapEditorData";
import { CORE_DERIVED_IDS } from "../../editor/content/coreDerivedManifest";
import type {
  ActionDefinition,
  AnimationDefinition,
  EditorSnapshot,
  SceneBackgroundLayerRecord,
  SceneCollisionCellRecord,
  SceneDefinition,
  SceneEntryPointObjectRecord,
  SceneObjectLayerRecord,
  SceneTileLayerRecord,
  SceneTriggerMode,
  SceneTriggerZoneObjectRecord,
} from "../../editor/domain/editorTypes";
import { resolveAssetUrl } from "../../editor/storage/assetPathResolver";
import { EditorDb } from "../../editor/storage/editorDb";
import { EditorRepository } from "../../editor/storage/editorRepository";
import { TILE_FRAME } from "../level/levelData";

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

export interface RuntimeBackgroundLayerSource {
  textureKey: string;
  factor: number;
  fitMode: "cover" | "contain" | "repeat";
  offsetX: number;
  offsetY: number;
}

export interface RuntimeTileCell {
  x: number;
  y: number;
  textureKey: string;
  frame: number;
}

export interface RuntimeSolidBlock {
  start: number;
  end: number;
  top: number;
  height: number;
}

export interface RuntimeOneWayPlatform {
  start: number;
  end: number;
  y: number;
}

export interface RuntimePickupSpawn {
  id: string;
  x: number;
  y: number;
  textureKey: string;
  animationKey: string;
  scale: number;
}

export interface RuntimeSceneEntryPoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface RuntimeTriggerZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  triggerMode: SceneTriggerMode;
  actionId: string | null;
}

export interface RuntimePlayerContent {
  characterId: string | null;
  spawnX: number;
  spawnY: number;
  idleTextureKey: string;
  animationKeys: {
    idle: string;
    run: string;
    jump: string;
    attack: string | null;
  };
}

export interface RuntimeSceneContent {
  gameId: string;
  sceneId: string;
  entryPointId: string | null;
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  backgroundLayers: RuntimeBackgroundLayerSource[];
  tiles: RuntimeTileCell[];
  solidBlocks: RuntimeSolidBlock[];
  oneWayPlatforms: RuntimeOneWayPlatform[];
  pickups: RuntimePickupSpawn[];
  entryPoints: RuntimeSceneEntryPoint[];
  triggerZones: RuntimeTriggerZone[];
  player: RuntimePlayerContent;
}

export interface RuntimeContentCatalog {
  textures: RuntimeTextureSource[];
  animations: RuntimeAnimationSource[];
  gameId: string;
  entrySceneId: string;
  entryPointId: string | null;
  scene: RuntimeSceneContent;
  scenes: RuntimeSceneContent[];
  actions: ActionDefinition[];
}

export async function loadRuntimeContent(settings: PrototypeSettings): Promise<RuntimeContentCatalog> {
  const db = new EditorDb();
  const repository = new EditorRepository(db);

  try {
    await bootstrapEditorData(repository);
    const snapshot = await repository.loadSnapshot();
    const catalog = buildCatalogFromGame(snapshot);
    if (catalog) {
      return catalog;
    }

    return createFallbackRuntimeContent(settings);
  } finally {
    await repository.close();
  }
}

export function createFallbackTextures(): RuntimeTextureSource[] {
  return [
    { key: "player-idle-texture", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/idle.png", frameWidth: 128, frameHeight: 128 },
    { key: "player-run-texture", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/run.png", frameWidth: 128, frameHeight: 128 },
    { key: "player-jump-texture", type: "spritesheet", url: "editor-assets/core/characters/shinobi/sources/jump.png", frameWidth: 128, frameHeight: 128 },
    { key: "tileset:core:tileset:swamp-main", type: "spritesheet", url: "editor-assets/core/worlds/swamp/tilesets/swamp-tileset.png", frameWidth: 32, frameHeight: 32 },
    { key: "background:core:raw:swamp:bg-1", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-1.png" },
    { key: "background:core:raw:swamp:bg-2", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-2.png" },
    { key: "background:core:raw:swamp:bg-3", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-3.png" },
    { key: "background:core:raw:swamp:bg-4", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-4.png" },
    { key: "background:core:raw:swamp:bg-5", type: "image", url: "editor-assets/core/worlds/swamp/backgrounds/background-5.png" },
    { key: "pickup-texture:core:animation:coin-spin", type: "spritesheet", url: "editor-assets/core/pickups/coin/sources/coin.png", frameWidth: 10, frameHeight: 10 },
  ];
}

export function createFallbackAnimations(): RuntimeAnimationSource[] {
  return [
    { key: "player-idle", textureKey: "player-idle-texture", frameCount: 6, frameRate: 8, repeat: -1 },
    { key: "player-run", textureKey: "player-run-texture", frameCount: 8, frameRate: 12, repeat: -1 },
    { key: "player-jump", textureKey: "player-jump-texture", frameCount: 12, frameRate: 14, repeat: -1 },
    { key: "pickup-animation:core:animation:coin-spin", textureKey: "pickup-texture:core:animation:coin-spin", frameCount: 4, frameRate: 10, repeat: -1 },
  ];
}

function createFallbackRuntimeContent(settings: PrototypeSettings): RuntimeContentCatalog {
  const scene: RuntimeSceneContent = {
    gameId: CORE_DERIVED_IDS.gameCanuterMain,
    sceneId: CORE_DERIVED_IDS.sceneSwampCampaignV1,
    entryPointId: null,
    widthInCells: settings.world.width_tiles,
    heightInCells: settings.world.height_tiles,
    tileWidth: settings.world.tile_size,
    tileHeight: settings.world.tile_size,
    backgroundLayers: [
      createRuntimeBackgroundLayer("background:core:raw:swamp:bg-1", 0.04),
      createRuntimeBackgroundLayer("background:core:raw:swamp:bg-2", 0.08),
      createRuntimeBackgroundLayer("background:core:raw:swamp:bg-3", 0.12),
      createRuntimeBackgroundLayer("background:core:raw:swamp:bg-4", 0.18),
      createRuntimeBackgroundLayer("background:core:raw:swamp:bg-5", 0.26),
    ],
    tiles: createFallbackSceneTiles(settings),
    solidBlocks: settings.level.ground_segments.map((segment) => ({ ...segment })),
    oneWayPlatforms: settings.level.floating_platforms.map((segment) => ({ ...segment })),
    pickups: settings.level.coin_positions.map((position, index) => ({
      id: `coin-${index}`,
      x: position.x * settings.world.tile_size,
      y: position.y * settings.world.tile_size,
      textureKey: "pickup-texture:core:animation:coin-spin",
      animationKey: "pickup-animation:core:animation:coin-spin",
      scale: 2.4,
    })),
    entryPoints: [],
    triggerZones: [],
    player: {
      characterId: CORE_DERIVED_IDS.characterPlayerShinobi,
      spawnX: settings.player.spawn_x,
      spawnY: settings.player.spawn_y,
      idleTextureKey: "player-idle-texture",
      animationKeys: {
        idle: "player-idle",
        run: "player-run",
        jump: "player-jump",
        attack: null,
      },
    },
  };

  return {
    textures: createFallbackTextures(),
    animations: createFallbackAnimations(),
    gameId: CORE_DERIVED_IDS.gameCanuterMain,
    entrySceneId: scene.sceneId,
    entryPointId: null,
    scene,
    scenes: [scene],
    actions: [],
  };
}

function buildCatalogFromGame(snapshot: EditorSnapshot): RuntimeContentCatalog | null {
  const game = snapshot.games.find((entry) => entry.id === CORE_DERIVED_IDS.gameCanuterMain) ?? snapshot.games[0] ?? null;
  if (!game) {
    return null;
  }

  const scene = snapshot.scenes.find((entry) => entry.id === game.entrySceneId) ?? null;
  if (!scene) {
    return null;
  }

  const textures: RuntimeTextureSource[] = [];
  const animations: RuntimeAnimationSource[] = [];

  const runtimeScenes = snapshot.scenes
    .filter((entry) => !entry.archivedAt)
    .map((entry) => buildRuntimeScene(snapshot, game.id, entry, game.defaultPlayerCharacterId, textures, animations))
    .filter((entry): entry is RuntimeSceneContent => entry !== null);
  const runtimeScene = materializeRuntimeScene(runtimeScenes, game.entrySceneId, game.entryPointId);
  if (!runtimeScene) {
    return null;
  }

  return {
    textures,
    animations,
    gameId: game.id,
    entrySceneId: game.entrySceneId,
    entryPointId: runtimeScene.entryPointId,
    scene: runtimeScene,
    scenes: runtimeScenes,
    actions: snapshot.actions.filter((entry) => !entry.archivedAt),
  };
}

function buildRuntimeScene(
  snapshot: EditorSnapshot,
  gameId: string,
  scene: SceneDefinition,
  fallbackCharacterId: string | null,
  textures: RuntimeTextureSource[],
  animations: RuntimeAnimationSource[],
): RuntimeSceneContent | null {
  const backgroundLayers = buildBackgroundLayers(snapshot, scene, textures);
  const tiles = buildRuntimeTiles(snapshot, scene, textures);
  const solidBlocks = buildSolidBlocks(scene);
  const oneWayPlatforms = buildOneWayPlatforms(scene);
  const player = buildRuntimePlayer(snapshot, scene, fallbackCharacterId, textures, animations);
  if (!player) {
    return null;
  }
  const pickups = buildRuntimePickups(snapshot, scene, textures, animations);
  const entryPoints = buildRuntimeEntryPoints(scene);
  const triggerZones = buildRuntimeTriggerZones(scene);

  return {
    gameId,
    sceneId: scene.id,
    entryPointId: null,
    widthInCells: scene.widthInCells,
    heightInCells: scene.heightInCells,
    tileWidth: scene.tileWidth,
    tileHeight: scene.tileHeight,
    backgroundLayers,
    tiles,
    solidBlocks,
    oneWayPlatforms,
    pickups,
    entryPoints,
    triggerZones,
    player,
  };
}

function buildBackgroundLayers(
  snapshot: EditorSnapshot,
  scene: SceneDefinition,
  textures: RuntimeTextureSource[],
): RuntimeBackgroundLayerSource[] {
  return scene.layers
    .filter((layer): layer is SceneBackgroundLayerRecord => layer.kind === "background" && layer.visible)
    .map((layer) => {
      const rawAsset = snapshot.rawAssets.find((entry) => entry.id === layer.assetId);
      const textureKey = `background:${layer.assetId}`;
      if (rawAsset) {
        pushTexture(textures, {
          key: textureKey,
          type: "image",
          url: resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath),
        });
      }

      return {
        textureKey,
        factor: layer.parallaxX,
        fitMode: layer.fitMode,
        offsetX: layer.offsetX,
        offsetY: layer.offsetY,
      };
    });
}

function buildRuntimeTiles(
  snapshot: EditorSnapshot,
  scene: SceneDefinition,
  textures: RuntimeTextureSource[],
): RuntimeTileCell[] {
  const tilesetCache = new Map<string, { textureKey: string; frames: Map<string, number> }>();
  const tileCells: RuntimeTileCell[] = [];

  scene.layers
    .filter((layer): layer is SceneTileLayerRecord => layer.kind === "tiles" && layer.visible)
    .forEach((layer) => {
      layer.cells.forEach((cell) => {
        const cached = resolveTilesetRuntime(snapshot, cell.tilesetId, textures, tilesetCache);
        if (!cached) {
          return;
        }

        tileCells.push({
          x: cell.x,
          y: cell.y,
          textureKey: cached.textureKey,
          frame: cached.frames.get(cell.tileId) ?? 0,
        });
      });
    });

  return tileCells;
}

function resolveTilesetRuntime(
  snapshot: EditorSnapshot,
  tilesetId: string,
  textures: RuntimeTextureSource[],
  cache: Map<string, { textureKey: string; frames: Map<string, number> }>,
): { textureKey: string; frames: Map<string, number> } | null {
  const existing = cache.get(tilesetId);
  if (existing) {
    return existing;
  }

  const tileset = snapshot.tilesets.find((entry) => entry.id === tilesetId);
  if (!tileset) {
    return null;
  }

  const rawAsset = snapshot.rawAssets.find((entry) => entry.id === tileset.sourceAssetId);
  if (!rawAsset) {
    return null;
  }

  const textureKey = `tileset:${tileset.id}`;
  pushTexture(textures, {
    key: textureKey,
    type: "spritesheet",
    url: resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath),
    frameWidth: tileset.cellWidth,
    frameHeight: tileset.cellHeight,
  });

  const frames = new Map<string, number>();
  tileset.tiles.forEach((tile, index) => frames.set(tile.id, index));
  const runtime = { textureKey, frames };
  cache.set(tilesetId, runtime);
  return runtime;
}

function buildSolidBlocks(scene: SceneDefinition): RuntimeSolidBlock[] {
  const solidCells = scene.layers
    .filter((layer): layer is Extract<SceneDefinition["layers"][number], { kind: "collision" }> =>
      layer.kind === "collision" && layer.visible && layer.collisionKind === "solid")
    .flatMap((layer) => layer.cells);

  return groupCellsIntoSolidBlocks(solidCells);
}

function buildOneWayPlatforms(scene: SceneDefinition): RuntimeOneWayPlatform[] {
  const platformCells = scene.layers
    .filter((layer): layer is Extract<SceneDefinition["layers"][number], { kind: "collision" }> =>
      layer.kind === "collision" && layer.visible && layer.collisionKind === "one-way")
    .flatMap((layer) => layer.cells);

  return groupCellsIntoPlatformSegments(platformCells);
}

function buildRuntimePlayer(
  snapshot: EditorSnapshot,
  scene: SceneDefinition,
  fallbackCharacterId: string | null,
  textures: RuntimeTextureSource[],
  animations: RuntimeAnimationSource[],
): RuntimePlayerContent | null {
  const spawnObject = scene.layers
    .filter((layer): layer is SceneObjectLayerRecord => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .find((entry) => entry.type === "player-spawn") ?? null;

  const characterId = scene.defaultPlayerCharacterId ?? fallbackCharacterId ?? CORE_DERIVED_IDS.characterPlayerShinobi;
  const character = snapshot.characters.find((entry) => entry.id === characterId) ?? null;
  if (!character) {
    return null;
  }

  const idle = resolveAnimationRuntime(snapshot, character.idleAnimationId, "player-idle", "player-idle-texture", textures, animations);
  const run = resolveAnimationRuntime(snapshot, character.runSideAnimationId ?? character.idleAnimationId, "player-run", "player-run-texture", textures, animations);
  const jump = resolveAnimationRuntime(snapshot, character.jumpAnimationId ?? character.idleAnimationId, "player-jump", "player-jump-texture", textures, animations);
  const attack = character.attackAnimationId
    ? resolveAnimationRuntime(snapshot, character.attackAnimationId, "player-attack", "player-attack-texture", textures, animations)
    : null;

  if (!idle || !run || !jump) {
    return null;
  }

  return {
    characterId: character.id,
    spawnX: spawnObject?.x ?? 0,
    spawnY: spawnObject?.y ?? 0,
    idleTextureKey: idle.textureKey,
    animationKeys: {
      idle: idle.animationKey,
      run: run.animationKey,
      jump: jump.animationKey,
      attack: attack?.animationKey ?? null,
    },
  };
}

function buildRuntimePickups(
  snapshot: EditorSnapshot,
  scene: SceneDefinition,
  textures: RuntimeTextureSource[],
  animations: RuntimeAnimationSource[],
): RuntimePickupSpawn[] {
  return scene.layers
    .filter((layer): layer is SceneObjectLayerRecord => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .filter((entry) => entry.type === "pickup")
    .map((entry) => {
      const animationId = entry.assetId ?? CORE_DERIVED_IDS.animationCoinSpin;
      const runtime = resolveAnimationRuntime(
        snapshot,
        animationId,
        `pickup-animation:${animationId}`,
        `pickup-texture:${animationId}`,
        textures,
        animations,
      );
      if (!runtime) {
        return null;
      }

      return {
        id: entry.id,
        x: entry.x,
        y: entry.y,
        textureKey: runtime.textureKey,
        animationKey: runtime.animationKey,
        scale: 2.4,
      };
    })
    .filter((entry): entry is RuntimePickupSpawn => entry !== null);
}

function buildRuntimeEntryPoints(scene: SceneDefinition): RuntimeSceneEntryPoint[] {
  return scene.layers
    .filter((layer): layer is SceneObjectLayerRecord => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .filter((entry): entry is SceneEntryPointObjectRecord => entry.type === "entry-point")
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      x: entry.x,
      y: entry.y,
    }));
}

function buildRuntimeTriggerZones(scene: SceneDefinition): RuntimeTriggerZone[] {
  return scene.layers
    .filter((layer): layer is SceneObjectLayerRecord => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .filter((entry): entry is SceneTriggerZoneObjectRecord => entry.type === "trigger-zone")
    .map((entry) => ({
      id: entry.id,
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      triggerMode: entry.triggerMode,
      actionId: entry.actionId,
    }));
}

export function materializeRuntimeScene(
  scenes: RuntimeSceneContent[],
  sceneId: string,
  entryPointId: string | null,
): RuntimeSceneContent | null {
  const baseScene = scenes.find((entry) => entry.sceneId === sceneId) ?? null;
  if (!baseScene) {
    return null;
  }

  const entryPoint = entryPointId
    ? baseScene.entryPoints.find((entry) => entry.id === entryPointId) ?? null
    : null;

  return {
    ...baseScene,
    entryPointId: entryPoint?.id ?? null,
    player: entryPoint
      ? {
        ...baseScene.player,
        spawnX: entryPoint.x,
        spawnY: entryPoint.y,
      }
      : { ...baseScene.player },
  };
}

function resolveAnimationRuntime(
  snapshot: EditorSnapshot,
  animationId: string,
  animationKey: string,
  textureKey: string,
  textures: RuntimeTextureSource[],
  runtimeAnimations: RuntimeAnimationSource[],
): { animationKey: string; textureKey: string } | null {
  const animation = snapshot.animations.find((entry) => entry.id === animationId);
  if (!animation) {
    return null;
  }

  const spriteSheet = snapshot.spritesheets.find((entry) => entry.id === animation.spriteSheetId);
  if (!spriteSheet) {
    return null;
  }

  const rawAsset = snapshot.rawAssets.find((entry) => entry.id === spriteSheet.sourceAssetId);
  if (!rawAsset) {
    return null;
  }

  pushTexture(textures, {
    key: textureKey,
    type: "spritesheet",
    url: resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath),
    frameWidth: spriteSheet.cellWidth,
    frameHeight: spriteSheet.cellHeight,
  });
  pushAnimation(runtimeAnimations, buildRuntimeAnimationSource(animation, animationKey, textureKey));
  return { animationKey, textureKey };
}

function buildRuntimeAnimationSource(
  animation: AnimationDefinition,
  key: string,
  textureKey: string,
): RuntimeAnimationSource {
  return {
    key,
    textureKey,
    frameCount: animation.frameIds.length,
    frameRate: Math.max(1, Math.round(1000 / animation.frameDurationMs)),
    repeat: animation.loop ? -1 : 0,
  };
}

function pushTexture(textures: RuntimeTextureSource[], texture: RuntimeTextureSource): void {
  if (!textures.some((entry) => entry.key === texture.key)) {
    textures.push(texture);
  }
}

function pushAnimation(animations: RuntimeAnimationSource[], animation: RuntimeAnimationSource): void {
  if (!animations.some((entry) => entry.key === animation.key)) {
    animations.push(animation);
  }
}

function createRuntimeBackgroundLayer(textureKey: string, factor: number): RuntimeBackgroundLayerSource {
  return {
    textureKey,
    factor,
    fitMode: "cover",
    offsetX: 0,
    offsetY: 0,
  };
}

function createFallbackSceneTiles(settings: PrototypeSettings): RuntimeTileCell[] {
  const cells: Array<{ x: number; y: number; frame: number }> = [];

  settings.level.ground_segments.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      cells.push({
        x,
        y: segment.top,
        frame: x === segment.start ? TILE_FRAME.groundLeft : x === segment.end ? TILE_FRAME.groundRight : TILE_FRAME.groundMid,
      });
      for (let row = 1; row < segment.height; row += 1) {
        cells.push({
          x,
          y: segment.top + row,
          frame: x === segment.start ? TILE_FRAME.fillLeft : x === segment.end ? TILE_FRAME.fillRight : TILE_FRAME.fillMid,
        });
      }
    }
  });

  settings.level.floating_platforms.forEach((segment) => {
    for (let x = segment.start; x <= segment.end; x += 1) {
      cells.push({
        x,
        y: segment.y,
        frame: x === segment.start ? TILE_FRAME.platformLeft : x === segment.end ? TILE_FRAME.platformRight : TILE_FRAME.platformMid,
      });
    }
  });

  settings.level.water_strips.forEach((strip) => {
    for (let x = strip.start; x <= strip.end; x += 1) {
      for (let row = 0; row < strip.rows; row += 1) {
        cells.push({
          x,
          y: strip.top + row,
          frame: TILE_FRAME.water,
        });
      }
    }
  });

  return cells.map((cell) => ({
    x: cell.x,
    y: cell.y,
    textureKey: "tileset:core:tileset:swamp-main",
    frame: cell.frame,
  }));
}

function groupCellsIntoSolidBlocks(cells: SceneCollisionCellRecord[]): RuntimeSolidBlock[] {
  const remaining = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
  const ordered = [...cells].sort((left, right) => left.y - right.y || left.x - right.x);
  const blocks: RuntimeSolidBlock[] = [];

  for (const cell of ordered) {
    const key = `${cell.x},${cell.y}`;
    if (!remaining.has(key)) {
      continue;
    }

    let end = cell.x;
    while (remaining.has(`${end + 1},${cell.y}`)) {
      end += 1;
    }

    let height = 1;
    while (rowRangeExists(remaining, cell.x, end, cell.y + height)) {
      height += 1;
    }

    for (let row = cell.y; row < cell.y + height; row += 1) {
      for (let x = cell.x; x <= end; x += 1) {
        remaining.delete(`${x},${row}`);
      }
    }

    blocks.push({
      start: cell.x,
      end,
      top: cell.y,
      height,
    });
  }

  return blocks;
}

function rowRangeExists(cells: Set<string>, startX: number, endX: number, y: number): boolean {
  for (let x = startX; x <= endX; x += 1) {
    if (!cells.has(`${x},${y}`)) {
      return false;
    }
  }
  return true;
}

function groupCellsIntoPlatformSegments(cells: SceneCollisionCellRecord[]): RuntimeOneWayPlatform[] {
  const rows = new Map<number, number[]>();
  cells.forEach((cell) => {
    const row = rows.get(cell.y) ?? [];
    row.push(cell.x);
    rows.set(cell.y, row);
  });

  const segments: RuntimeOneWayPlatform[] = [];
  [...rows.entries()]
    .sort((left, right) => left[0] - right[0])
    .forEach(([y, xValues]) => {
      const sorted = [...xValues].sort((left, right) => left - right);
      let start = sorted[0];
      let end = sorted[0];
      for (let index = 1; index < sorted.length; index += 1) {
        const value = sorted[index];
        if (value === end + 1) {
          end = value;
          continue;
        }

        segments.push({ start, end, y });
        start = value;
        end = value;
      }

      if (sorted.length > 0) {
        segments.push({ start, end, y });
      }
    });

  return segments;
}
