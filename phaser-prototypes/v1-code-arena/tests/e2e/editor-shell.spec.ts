import { expect, test, type Page } from "@playwright/test";

function folderRow(page: Page, name: string) {
  return page.locator(`[data-testid="explorer-folder-row"][data-folder-name="${name}"]`).first();
}

function assetRow(page: Page, name: string) {
  return page.locator(`[data-testid="explorer-asset-row"][data-asset-name="${name}"]`).first();
}

async function openEditor(page: Page, hash = "#library"): Promise<void> {
  await page.goto(`/editor.html${hash}`);
  await expect(page.getByTestId("editor-shell")).toBeVisible();
  await expect(folderRow(page, "Core")).toBeVisible();
}

async function expandExplorerPath(page: Page, folderNames: string[]): Promise<void> {
  for (const name of folderNames) {
    await folderRow(page, name).click();
  }
}

test("folder rows expand when clicked", async ({ page }) => {
  await openEditor(page);

  await folderRow(page, "Core").click();
  await expect(folderRow(page, "Worlds")).toBeVisible();

  await folderRow(page, "Worlds").click();
  await expect(folderRow(page, "Swamp")).toBeVisible();

  await folderRow(page, "Swamp").click();
  await expect(folderRow(page, "Maps")).toBeVisible();
});

test("new folder starts inline under User root and cancels cleanly", async ({ page }) => {
  await openEditor(page);

  await page.getByTestId("explorer-new-folder-button").click();

  const createInput = page.getByTestId("explorer-folder-create-input");
  await expect(createInput).toBeVisible();
  await createInput.press("Escape");
  await expect(createInput).toHaveCount(0);
});

test("editor database includes stores for games, scenes and actions", async ({ page }) => {
  await openEditor(page);

  const storeNames = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const names = Array.from(database.objectStoreNames);
    database.close();
    return names;
  });

  expect(storeNames).toContain("games");
  expect(storeNames).toContain("scenes");
  expect(storeNames).toContain("actions");
});

test("editor seeds a core game and scene migration baseline", async ({ page }) => {
  await openEditor(page);

  const snapshot = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const readAll = <T,>(storeName: string) => new Promise<T[]>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error ?? new Error(`Could not read ${storeName}`));
    });

    const [games, scenes] = await Promise.all([
      readAll<{ id: string; entrySceneId: string }>("games"),
      readAll<{ id: string; defaultPlayerCharacterId: string | null; layers: Array<{ kind: string }> }>("scenes"),
    ]);

    database.close();
    return { games, scenes };
  });

  expect(snapshot.games.some((entry) => entry.id === "core:game:canuter-main")).toBe(true);
  expect(snapshot.scenes.some((entry) => entry.id === "core:scene:swamp-campaign-v1")).toBe(true);

  const swampScene = snapshot.scenes.find((entry) => entry.id === "core:scene:swamp-campaign-v1");
  expect(swampScene?.defaultPlayerCharacterId).toBe("core:character:player-shinobi");
  expect(swampScene?.layers.some((entry) => entry.kind === "tiles")).toBe(true);
  expect(swampScene?.layers.some((entry) => entry.kind === "collision")).toBe(true);
  expect(swampScene?.layers.some((entry) => entry.kind === "objects")).toBe(true);
});

test("folder properties keep archive in the header and no footer action buttons", async ({ page }) => {
  await openEditor(page);

  await page.getByTestId("explorer-new-folder-button").click();
  const createInput = page.getByTestId("explorer-folder-create-input");
  await createInput.fill("playwright-folder");
  await createInput.press("Enter");

  await expect(folderRow(page, "playwright-folder")).toBeVisible();
  await expect(page.getByTestId("editor-properties-panel")).toContainText("playwright-folder");
  await expect(page.getByTestId("properties-archive-button")).toBeVisible();
  await expect(page.getByRole("button", { name: /^rename folder$/i })).toHaveCount(0);
  await expect(page.locator(".properties-actions button")).toHaveCount(0);

  await page.getByTestId("properties-archive-button").click();
  const archivedFolderRow = folderRow(page, "playwright-folder");
  await expect(folderRow(page, "Archived")).toBeVisible();
  await expect(archivedFolderRow).toBeVisible();
  await expect(archivedFolderRow).toHaveClass(/is-selected/);
  await expect(page.locator('[data-testid="properties-archive-button"] [data-icon-name="restore"]')).toBeVisible();

  await page.getByTestId("properties-archive-button").click();
  const restoredFolderRow = folderRow(page, "playwright-folder");
  await expect(folderRow(page, "User")).toBeVisible();
  await expect(restoredFolderRow).toBeVisible();
  await expect(restoredFolderRow).toHaveClass(/is-selected/);
});

test("clicking a map asset opens the map workspace directly", async ({ page }) => {
  await openEditor(page);
  await expandExplorerPath(page, ["Core", "Worlds", "Swamp", "Maps"]);

  await assetRow(page, "Swamp Campaign Map").click();

  await expect(page).toHaveURL(/#map\/core:map:swamp-campaign-v1$/);
  await expect(page.getByTestId("map-workspace")).toBeVisible();
  await expect(page.getByTestId("map-preview")).toBeVisible();
  await expect(page.locator('[data-testid="map-preview"] canvas')).toBeVisible();
  await page.getByTestId("editor-properties-panel").getByRole("button", { name: "Tiles" }).click();
  await expect(page.locator('[data-testid="map-palette"] .palette-tile').first()).toBeVisible();
  await expect(
    page.getByTestId("editor-properties-panel").getByRole("button", { name: /open map/i }),
  ).toHaveCount(0);
});

test("editor shell keeps scrolling contained to the workspace area", async ({ page }) => {
  await openEditor(page, "#map/core:map:swamp-campaign-v1");

  await expect(page.getByTestId("map-workspace")).toBeVisible();

  const layout = await page.evaluate(() => {
    const scrollingElement = document.scrollingElement ?? document.documentElement;
    const centerPane = document.querySelector<HTMLElement>('[data-testid="editor-center-pane"]');
    if (!centerPane) {
      throw new Error("Missing editor center pane");
    }

    return {
      documentHasHorizontalScroll: scrollingElement.scrollWidth > scrollingElement.clientWidth,
      documentHasVerticalScroll: scrollingElement.scrollHeight > scrollingElement.clientHeight,
      centerOverflowX: window.getComputedStyle(centerPane).overflowX,
      centerOverflowY: window.getComputedStyle(centerPane).overflowY,
    };
  });

  expect(layout.documentHasHorizontalScroll).toBe(false);
  expect(layout.documentHasVerticalScroll).toBe(false);
  expect(["auto", "scroll"]).toContain(layout.centerOverflowX);
  expect(["auto", "scroll"]).toContain(layout.centerOverflowY);
});

test("route-backed assets open directly in compact workspace tabs", async ({ page }) => {
  await openEditor(page);
  await expandExplorerPath(page, ["Core", "Characters", "Shinobi", "Animations"]);
  await assetRow(page, "Player Jump").click();

  await expect(page).toHaveURL(/#animation\/core:animation:player-jump$/);
  await expect(page.getByTestId("workspace-tabbar")).toBeVisible();
  await expect(page.locator('[data-route-key="animation:core:animation:player-jump"]')).toBeVisible();
  await expect(page.locator('[data-route-key="library"]')).toHaveCount(0);

  await assetRow(page, "Player Shinobi").click();

  const tabBar = page.getByTestId("workspace-tabbar");
  await expect(tabBar).toBeVisible();
  await expect(tabBar.getByTestId("workspace-tab")).toHaveCount(2);
  await expect(page).toHaveURL(/#character\/core:character:player-shinobi$/);

  const tabStyles = await tabBar.evaluate((element) => window.getComputedStyle(element).flexWrap);
  expect(tabStyles).toBe("wrap");

  await tabBar.locator('[data-route-key="character:core:character:player-shinobi"] [data-testid="workspace-tab-close"]').click();
  await expect(page).toHaveURL(/#animation\/core:animation:player-jump$/);
  await expect(tabBar.getByTestId("workspace-tab")).toHaveCount(1);
});

test("explorer tree and active workspace survive reload", async ({ page }) => {
  await openEditor(page);
  await expandExplorerPath(page, ["Core", "Worlds", "Swamp", "Maps"]);
  await assetRow(page, "Swamp Campaign Map").click();

  await page.reload();

  await expect(page).toHaveURL(/#map\/core:map:swamp-campaign-v1$/);
  await expect(page.getByTestId("map-workspace")).toBeVisible();
  await expect(folderRow(page, "Worlds")).toBeVisible();
  await expect(folderRow(page, "Swamp")).toBeVisible();
  await expect(folderRow(page, "Maps")).toBeVisible();
  await expect(assetRow(page, "Swamp Campaign Map")).toBeVisible();
  await expect(
    page.locator('[data-route-key="map:core:map:swamp-campaign-v1"] [data-testid="workspace-tab-button"]'),
  ).toBeVisible();
});

test("raw assets and levels open as route-backed workspaces", async ({ page }) => {
  await openEditor(page);
  await expandExplorerPath(page, ["Core", "Worlds", "Swamp", "Levels"]);
  await assetRow(page, "Campaign V1").click();

  await expect(page).toHaveURL(/#level\/core:level:campaign-v1$/);
  await expect(page.getByTestId("level-workspace")).toBeVisible();
  await expect(page.getByTestId("level-preview")).toBeVisible();

  await expandExplorerPath(page, ["Core", "Worlds", "Forest", "Backgrounds"]);
  await assetRow(page, "Forest Background 1").click();

  await expect(page).toHaveURL(/#raw-asset\/core:raw:worlds:forest:backgrounds:1$/);
  await expect(page.getByTestId("raw-asset-workspace")).toBeVisible();
  await expect(page.getByTestId("raw-asset-visual")).toBeVisible();
  await expect(page.getByTestId("workspace-tabbar").getByTestId("workspace-tab")).toHaveCount(2);
});
