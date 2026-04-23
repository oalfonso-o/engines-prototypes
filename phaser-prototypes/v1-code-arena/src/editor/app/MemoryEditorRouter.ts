import type { EditorRoute } from "../domain/editorTypes";
import type { EditorRouteController } from "./EditorRouter";

type RouteListener = (route: EditorRoute) => void;

export class MemoryEditorRouter implements EditorRouteController {
  private readonly listeners = new Set<RouteListener>();

  constructor(private route: EditorRoute = { kind: "library" }) {}

  getCurrentRoute(): EditorRoute {
    return this.route;
  }

  subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    listener(this.route);
    return () => {
      this.listeners.delete(listener);
    };
  }

  navigate(route: EditorRoute): void {
    this.route = route;
    this.listeners.forEach((listener) => listener(route));
  }

  destroy(): void {
    this.listeners.clear();
  }
}
