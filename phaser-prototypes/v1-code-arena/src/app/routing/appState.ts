export type SupportedLocale = "en" | "es" | "ca";

export type AppScreen =
  | "boot"
  | "intro"
  | "main_menu"
  | "options"
  | "campaign"
  | "campaign_pause"
  | "editor";

export type RuntimeSurface = "intro" | "main_menu" | "campaign" | "editor";

export function getRuntimeSurface(screen: AppScreen): RuntimeSurface {
  switch (screen) {
    case "boot":
    case "intro":
      return "intro";
    case "main_menu":
    case "options":
      return "main_menu";
    case "campaign":
    case "campaign_pause":
      return "campaign";
    case "editor":
      return "editor";
  }
}

export function isPauseOverlayVisible(screen: AppScreen): boolean {
  return screen === "campaign_pause";
}
