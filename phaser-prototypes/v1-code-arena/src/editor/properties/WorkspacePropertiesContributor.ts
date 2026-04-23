export interface WorkspacePropertiesContributor {
  renderProperties(container: HTMLElement): void;
  renderTiles?(container: HTMLElement): void;
}

export function isWorkspacePropertiesContributor(value: unknown): value is WorkspacePropertiesContributor {
  return typeof value === "object"
    && value !== null
    && "renderProperties" in value
    && typeof (value as { renderProperties?: unknown }).renderProperties === "function";
}
