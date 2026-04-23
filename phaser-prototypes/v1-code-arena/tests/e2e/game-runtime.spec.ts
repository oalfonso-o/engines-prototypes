import { expect, test, type Page } from "@playwright/test";

interface RuntimeDebugState {
  gameId: string | null;
  sceneId: string | null;
  entryPointId: string | null;
  phase: "booting" | "running" | "transitioning";
  surface: "intro" | "main_menu" | "campaign" | "editor" | null;
  phaserSceneKey: string | null;
}

async function openGame(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("game-root")).toBeVisible();
}

async function readRuntimeDebugState(page: Page): Promise<RuntimeDebugState> {
  return page.evaluate(() => {
    const state = window.__CANUTER_RUNTIME__;
    if (!state) {
      throw new Error("Missing runtime debug state");
    }

    return state;
  });
}

test("game exposes runtime debug state and reaches the main menu", async ({ page }) => {
  await openGame(page);

  await expect(page.getByTestId("menu-campaign-button")).toBeVisible();

  const state = await readRuntimeDebugState(page);
  expect(state.gameId).toBe("legacy:game:campaign-v1");
  expect(state.phase).toBe("running");
  expect(state.surface).toBe("main_menu");
  expect(state.sceneId).toBeNull();
  expect(state.phaserSceneKey).toBe("MenuBackgroundScene");
});

test("starting the campaign updates runtime debug state", async ({ page }) => {
  await openGame(page);
  await expect(page.getByTestId("menu-campaign-button")).toBeVisible();

  await page.getByTestId("menu-campaign-button").click();
  await page.waitForFunction(() => window.__CANUTER_RUNTIME__?.surface === "campaign");

  const state = await readRuntimeDebugState(page);
  expect(state.gameId).toBe("legacy:game:campaign-v1");
  expect(state.phase).toBe("running");
  expect(state.surface).toBe("campaign");
  expect(state.sceneId).toBe("core:map:swamp-campaign-v1");
  expect(state.entryPointId).toBeNull();
  expect(state.phaserSceneKey).toBe("CampaignScene");
});
