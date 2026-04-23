import type { RuntimeContentCatalog, RuntimeSceneContent } from "../content/runtimeContent";
import { materializeRuntimeScene } from "../content/runtimeContent";
import type { ActionDefinition } from "../../editor/domain/editorTypes";

export interface SceneTransitionPlan {
  scene: RuntimeSceneContent;
  entryPointId: string | null;
  transitionStyle: "none" | "fade";
}

export class SceneRuntimeController {
  private readonly scenes = new Map<string, RuntimeSceneContent>();
  private readonly actions = new Map<string, ActionDefinition>();
  private currentSceneId: string;
  private currentEntryPointId: string | null;

  constructor(private readonly catalog: RuntimeContentCatalog) {
    catalog.scenes.forEach((scene) => {
      this.scenes.set(scene.sceneId, scene);
    });
    catalog.actions.forEach((action) => {
      this.actions.set(action.id, action);
    });
    this.currentSceneId = catalog.scene.sceneId;
    this.currentEntryPointId = catalog.scene.entryPointId;
  }

  getGameId(): string {
    return this.catalog.gameId;
  }

  getCurrentScene(): RuntimeSceneContent {
    return materializeRuntimeScene(
      [...this.scenes.values()],
      this.currentSceneId,
      this.currentEntryPointId,
    ) ?? this.catalog.scene;
  }

  getCurrentSceneId(): string {
    return this.currentSceneId;
  }

  getCurrentEntryPointId(): string | null {
    return this.currentEntryPointId;
  }

  getAction(id: string): ActionDefinition | null {
    return this.actions.get(id) ?? null;
  }

  resetToEntryScene(): RuntimeSceneContent {
    const scene = materializeRuntimeScene(
      [...this.scenes.values()],
      this.catalog.entrySceneId,
      this.catalog.entryPointId,
    ) ?? this.catalog.scene;
    this.currentSceneId = scene.sceneId;
    this.currentEntryPointId = scene.entryPointId;
    return scene;
  }

  transitionToScene(
    sceneId: string,
    entryPointId: string | null,
    transitionStyle: "none" | "fade" = "none",
  ): SceneTransitionPlan | null {
    const scene = materializeRuntimeScene([...this.scenes.values()], sceneId, entryPointId);
    if (!scene) {
      return null;
    }

    this.currentSceneId = scene.sceneId;
    this.currentEntryPointId = scene.entryPointId;
    return {
      scene,
      entryPointId: scene.entryPointId,
      transitionStyle,
    };
  }
}
