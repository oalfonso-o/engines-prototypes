import type { SceneTransitionPlan } from "./SceneRuntimeController";
import { SceneRuntimeController } from "./SceneRuntimeController";

export class ActionExecutor {
  constructor(private readonly runtimeController: SceneRuntimeController) {}

  execute(actionId: string): SceneTransitionPlan | null {
    const action = this.runtimeController.getAction(actionId);
    if (!action || action.archivedAt) {
      return null;
    }

    switch (action.kind) {
      case "scene-transition":
        return this.runtimeController.transitionToScene(
          action.targetSceneId,
          action.targetEntryPointId,
          action.transitionStyle,
        );
      case "sequence":
        return this.executeSequence(action.actionIds);
      case "conditional":
      case "set-flag":
        return null;
      default:
        return assertNever(action);
    }
  }

  private executeSequence(actionIds: string[]): SceneTransitionPlan | null {
    for (const actionId of actionIds) {
      const result = this.execute(actionId);
      if (result) {
        return result;
      }
    }

    return null;
  }
}

function assertNever(_value: never): null {
  return null;
}
