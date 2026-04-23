import type { PrototypeSettings } from "./prototypeSettings";

export const DEFAULT_UI_FONT_STACK = "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", sans-serif";

export function resolveUiFontStack(settings: Pick<PrototypeSettings, "theme">): string {
  const configured = settings.theme?.ui_font_stack?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_UI_FONT_STACK;
}

export function applyUiTheme(settings: Pick<PrototypeSettings, "theme">): void {
  document.documentElement.style.setProperty("--canuter-ui-font-stack", resolveUiFontStack(settings));
}
