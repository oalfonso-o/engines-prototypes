export type RuntimeDebugPhase = "booting" | "running" | "transitioning";
export type RuntimeDebugSurface = "intro" | "main_menu" | "campaign" | "editor" | null;

export interface RuntimeDebugState {
  gameId: string | null;
  sceneId: string | null;
  entryPointId: string | null;
  phase: RuntimeDebugPhase;
  surface: RuntimeDebugSurface;
  phaserSceneKey: string | null;
}

const DEFAULT_RUNTIME_DEBUG_STATE: RuntimeDebugState = {
  gameId: null,
  sceneId: null,
  entryPointId: null,
  phase: "booting",
  surface: null,
  phaserSceneKey: null,
};

export function setRuntimeDebugState(patch: Partial<RuntimeDebugState>): RuntimeDebugState {
  const nextState = {
    ...readRuntimeDebugState(),
    ...patch,
  };
  window.__CANUTER_RUNTIME__ = nextState;
  return nextState;
}

export function resetRuntimeDebugState(): RuntimeDebugState {
  window.__CANUTER_RUNTIME__ = { ...DEFAULT_RUNTIME_DEBUG_STATE };
  return window.__CANUTER_RUNTIME__;
}

export function readRuntimeDebugState(): RuntimeDebugState {
  if (!window.__CANUTER_RUNTIME__) {
    return resetRuntimeDebugState();
  }

  return window.__CANUTER_RUNTIME__;
}

declare global {
  interface Window {
    __CANUTER_RUNTIME__?: RuntimeDebugState;
  }
}
