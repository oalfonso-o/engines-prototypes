import { createRoot } from "react-dom/client";
import "./editor/styles/editor.css";
import "./app/styles/app.css";
import { AppShell } from "./app/AppShell";
import { getInitialLocale, initializeI18n } from "./app/i18n/i18n";
import { loadPrototypeSettings } from "./settings/loadPrototypeSettings";
import { applyUiTheme } from "./settings/applyUiTheme";
import { loadRuntimeContent } from "./game/content/runtimeContent";

function renderLoadError(message: string): void {
  const target = document.getElementById("app-root");
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = "boot-error";
}

async function main(): Promise<void> {
  const initialLocale = getInitialLocale();
  await initializeI18n(initialLocale);
  const settings = loadPrototypeSettings();
  applyUiTheme(settings);
  const runtimeContent = await loadRuntimeContent(settings);
  const target = document.getElementById("app-root");
  if (!target) {
    throw new Error("Missing #app-root");
  }

  createRoot(target).render(
    <AppShell settings={settings} runtimeContent={runtimeContent} initialLocale={initialLocale} />,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Unknown startup error";
  renderLoadError(`Failed to boot Canuter Phaser V1: ${message}`);
});
