import { startGame } from "./game/main";
import { loadPrototypeSettings } from "./settings/loadPrototypeSettings";

function renderLoadError(error: unknown): void {
  const gameElement = document.getElementById("game");
  if (!gameElement) {
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  gameElement.textContent = `Failed to load settings.yaml: ${message}`;
  gameElement.style.color = "#ffd7a8";
  gameElement.style.padding = "24px";
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const settings = loadPrototypeSettings();
    startGame("game", settings);
  } catch (error) {
    console.error(error);
    renderLoadError(error);
  }
});
