import type { EditorRoute } from "../domain/editorTypes";

type RouteListener = (route: EditorRoute) => void;

export interface EditorRouteController {
  getCurrentRoute(): EditorRoute;
  subscribe(listener: RouteListener): () => void;
  navigate(route: EditorRoute): void;
  destroy(): void;
}

export class EditorRouter implements EditorRouteController {
  private readonly listeners = new Set<RouteListener>();

  constructor() {
    window.addEventListener("hashchange", this.handleHashChange);
    if (!window.location.hash) {
      window.location.hash = "#library";
    }
  }

  getCurrentRoute(): EditorRoute {
    return parseHash(window.location.hash);
  }

  subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentRoute());
    return () => {
      this.listeners.delete(listener);
    };
  }

  navigate(route: EditorRoute): void {
    window.location.hash = formatRoute(route);
  }

  destroy(): void {
    window.removeEventListener("hashchange", this.handleHashChange);
  }

  private readonly handleHashChange = (): void => {
    const route = this.getCurrentRoute();
    this.listeners.forEach((listener) => listener(route));
  };
}

export function parseHash(hash: string): EditorRoute {
  const normalized = hash.replace(/^#/, "");
  if (!normalized || normalized === "library") {
    return { kind: "library" };
  }

  const [kind, id] = normalized.split("/");
  switch (kind) {
    case "tileset":
      return { kind: "tileset", id: id ?? "" };
    case "spritesheet":
      return { kind: "spritesheet", id: id ?? "" };
    case "animation":
      return { kind: "animation", id: id ?? "" };
    case "character":
      return { kind: "character", id: id ?? "" };
    case "map":
      return { kind: "map", id: id ?? "" };
    default:
      return { kind: "library" };
  }
}

export function formatRoute(route: EditorRoute): string {
  if (route.kind === "library") {
    return "#library";
  }

  return `#${route.kind}/${route.id}`;
}
