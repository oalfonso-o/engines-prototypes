export type RawAssetKind = "tileset-source" | "spritesheet-source" | "image-source";
export type StorageRoot = "core" | "user" | "archived";

export type DerivedAssetType = "tileset" | "spritesheet" | "animation" | "character" | "map" | "level";
export type AssetEntityType = "raw-asset" | DerivedAssetType;
export type AssetStatus = "active" | "archived" | "uses-archived-dependencies" | "missing-dependencies";
export type DependencyStatus = "active" | "archived" | "missing";
export type LibraryTab = "raw" | "game";
export type PropertiesTab = "properties" | "tiles" | "used-by" | "dependencies";
export type DetailTab = PropertiesTab;
export type TileFitMode = "crop" | "scale-to-fit";
export type CharacterSlot = "idle" | "run_side" | "jump" | "attack";
export type RunSideFacing = "left" | "right";

export interface AssetBaseRecord {
  id: string;
  name: string;
  storageRoot: StorageRoot;
  folderId: string | null;
  relativePath: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawAssetRecord extends AssetBaseRecord {
  originalFilename: string;
  mimeType: "image/png";
  width: number;
  height: number;
  sizeBytes: number;
  sourceKind: RawAssetKind;
  storageMode: "disk" | "blob";
  blobKey: string | null;
}

export interface RawAssetBlobRecord {
  id: string;
  blob: Blob;
}

export interface FolderRecord {
  id: string;
  name: string;
  slug: string;
  storageRoot: StorageRoot;
  parentFolderId: string | null;
  relativePath: string;
  createdAt: string;
  updatedAt: string;
  system: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TilesetTileRecord {
  id: string;
  rect: Rect;
  label: string | null;
}

export interface TilesetDefinition extends AssetBaseRecord {
  sourceAssetId: string;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  tiles: TilesetTileRecord[];
}

export interface SpriteFrameRecord {
  id: string;
  rect: Rect;
  label: string | null;
}

export interface SpriteSheetDefinition extends AssetBaseRecord {
  sourceAssetId: string;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  frames: SpriteFrameRecord[];
}

export interface AnimationDefinition extends AssetBaseRecord {
  spriteSheetId: string;
  frameIds: string[];
  frameDurationMs: number;
  loop: boolean;
}

export interface CharacterDefinition extends AssetBaseRecord {
  idleAnimationId: string;
  runSideAnimationId: string | null;
  runSideFacing: RunSideFacing | null;
  jumpAnimationId: string | null;
  attackAnimationId: string | null;
}

export interface MapCellRecord {
  x: number;
  y: number;
  tilesetId: string;
  tileId: string;
}

export interface CollisionCellRecord {
  x: number;
  y: number;
}

export interface MapDefinition extends AssetBaseRecord {
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  cells: MapCellRecord[];
  collisionCells: CollisionCellRecord[];
}

export interface LevelPlacementRecord {
  id: string;
  type: "coin";
  assetId?: string | null;
  x: number;
  y: number;
}

export interface LevelCompositionRecord {
  id: string;
  name: string;
  storageRoot: StorageRoot;
  folderId: string | null;
  relativePath: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  mapId: string;
  playerCharacterId: string;
  spawnX: number;
  spawnY: number;
  groundSegments: Array<{ start: number; end: number; top: number; height: number }>;
  floatingPlatforms: Array<{ start: number; end: number; y: number }>;
  waterStrips: Array<{ start: number; end: number; top: number; rows: number }>;
  placements: LevelPlacementRecord[];
}

export type EditorEntityRecord =
  | RawAssetRecord
  | TilesetDefinition
  | SpriteSheetDefinition
  | AnimationDefinition
  | CharacterDefinition
  | MapDefinition
  | LevelCompositionRecord;

export interface EditorSnapshot {
  folders: FolderRecord[];
  rawAssets: RawAssetRecord[];
  rawAssetBlobs: RawAssetBlobRecord[];
  tilesets: TilesetDefinition[];
  spritesheets: SpriteSheetDefinition[];
  animations: AnimationDefinition[];
  characters: CharacterDefinition[];
  maps: MapDefinition[];
  levelCompositions: LevelCompositionRecord[];
}

export interface AssetSummary {
  id: string;
  entityType: AssetEntityType;
  name: string;
  archivedAt: string | null;
  status: AssetStatus;
}

export interface AssetDependencyEntry {
  id: string;
  entityType: AssetEntityType | "missing";
  name: string;
  status: DependencyStatus;
}

export type EditorRoute =
  | { kind: "library" }
  | { kind: "raw-asset"; id: string }
  | { kind: "tileset"; id: string }
  | { kind: "spritesheet"; id: string }
  | { kind: "animation"; id: string }
  | { kind: "character"; id: string }
  | { kind: "map"; id: string }
  | { kind: "level"; id: string };

export type WorkspaceRoute = Exclude<EditorRoute, { kind: "library" }>;

export interface EditorState {
  isReady: boolean;
  route: EditorRoute;
  snapshot: EditorSnapshot;
  searchQuery: string;
  libraryTab: LibraryTab;
  propertiesTab: PropertiesTab;
  selectedAssetId: string | null;
  selectedFolderId: string | null;
  workspaceTabs: WorkspaceRoute[];
  importModalOpen: boolean;
}

export interface ImportDraft {
  file: File | null;
  name: string;
  sourceKind: RawAssetKind | null;
  destinationFolderId: string | null;
  error: string | null;
}

export interface MappingDraft {
  sourceAssetId: string;
  name: string;
  cellWidth: string;
  cellHeight: string;
  offsetX: string;
  offsetY: string;
  activeCellIds: string[];
}

export interface AnimationDraft {
  name: string;
  frameDurationMs: string;
  loop: boolean;
  frameIds: string[];
}

export interface CharacterDraft {
  name: string;
  idleAnimationId: string | null;
  runSideAnimationId: string | null;
  runSideFacing: RunSideFacing | null;
  jumpAnimationId: string | null;
  attackAnimationId: string | null;
}

export interface MapDraft {
  name: string;
  widthInCells: string;
  heightInCells: string;
  tileWidth: string;
  tileHeight: string;
  tileFitMode: TileFitMode;
  cells: MapCellRecord[];
  collisionCells: CollisionCellRecord[];
  selectedTilesetId: string | null;
  selectedTileId: string | null;
  activeTool: "paint" | "erase" | "collision";
}
