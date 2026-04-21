export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const TILE_SIZE = 32;
export const WORLD_WIDTH_TILES = 60;
export const WORLD_HEIGHT_TILES = 18;
export const WORLD_WIDTH = WORLD_WIDTH_TILES * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_HEIGHT_TILES * TILE_SIZE;

export const TILE_FRAME = {
  groundLeft: 0,
  groundMid: 1,
  groundRight: 2,
  platformLeft: 6,
  platformMid: 7,
  platformRight: 8,
  water: 9,
  fillLeft: 30,
  fillMid: 34,
  fillRight: 43,
} as const;

export interface GroundSegment {
  start: number;
  end: number;
  top: number;
  height: number;
}

export interface FloatingPlatform {
  start: number;
  end: number;
  y: number;
}

export interface WaterStrip {
  start: number;
  end: number;
  top: number;
  rows: number;
}

export interface CoinPosition {
  x: number;
  y: number;
}

export const GROUND_SEGMENTS: GroundSegment[] = [
  { start: 0, end: 11, top: 15, height: 3 },
  { start: 16, end: 27, top: 15, height: 3 },
  { start: 33, end: 44, top: 15, height: 3 },
  { start: 50, end: 59, top: 15, height: 3 },
  { start: 24, end: 26, top: 13, height: 5 },
  { start: 46, end: 48, top: 12, height: 6 },
];

export const FLOATING_PLATFORMS: FloatingPlatform[] = [
  { start: 4, end: 8, y: 12 },
  { start: 10, end: 13, y: 10 },
  { start: 18, end: 22, y: 11 },
  { start: 26, end: 30, y: 9 },
  { start: 35, end: 38, y: 11 },
  { start: 40, end: 44, y: 8 },
  { start: 52, end: 55, y: 9 },
];

export const WATER_STRIPS: WaterStrip[] = [
  { start: 12, end: 15, top: 15, rows: 3 },
  { start: 28, end: 32, top: 15, rows: 3 },
  { start: 45, end: 49, top: 15, rows: 3 },
];

export const COIN_POSITIONS: CoinPosition[] = [
  { x: 6.5, y: 10.8 },
  { x: 11.5, y: 8.8 },
  { x: 20.5, y: 9.8 },
  { x: 28.5, y: 7.0 },
  { x: 25.5, y: 11.8 },
  { x: 37.0, y: 9.8 },
  { x: 42.0, y: 6.0 },
  { x: 54.0, y: 7.0 },
];
