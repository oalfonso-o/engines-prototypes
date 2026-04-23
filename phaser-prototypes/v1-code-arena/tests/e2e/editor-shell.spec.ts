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

async function createSceneFromEditor(page: Page, name: string): Promise<{ id: string; url: string }> {
  await page.getByTestId("editor-create-scene-button").click();
  await expect(page).toHaveURL(/#scene\/new$/);
  await expect(page.getByTestId("scene-workspace")).toBeVisible();

  const propertiesPanel = page.getByTestId("editor-properties-panel");
  await propertiesPanel.getByLabel("Name").fill(name);
  await propertiesPanel.getByTestId("scene-save-button").click();

  await expect(page).toHaveURL(/#scene\/[0-9a-f-]+$/);
  const url = page.url();
  const scene = await page.evaluate(async (sceneName) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; name: string; storageRoot: string } | null>((resolve, reject) => {
      const transaction = database.transaction("scenes", "readonly");
      const store = transaction.objectStore("scenes");
      const request = store.getAll();
      request.onsuccess = () => resolve(
        (request.result as Array<{ id: string; name: string; storageRoot: string }>).find((item) => item.name === sceneName) ?? null,
      );
      request.onerror = () => reject(request.error ?? new Error("Could not read scenes store"));
    });

    database.close();
    return entry;
  }, name);

  expect(scene?.storageRoot).toBe("user");
  return { id: scene?.id ?? "", url };
}

async function createActionFromEditor(
  page: Page,
  name: string,
  targetSceneId: string,
  targetEntryPointId?: string,
): Promise<{ id: string; url: string }> {
  await page.getByTestId("editor-create-action-button").click();
  await expect(page).toHaveURL(/#action\/new$/);
  await expect(page.getByTestId("action-workspace")).toBeVisible();

  const propertiesPanel = page.getByTestId("editor-properties-panel");
  await propertiesPanel.getByLabel("Name").fill(name);
  await propertiesPanel.getByLabel("Target scene").selectOption({ value: targetSceneId });
  if (targetEntryPointId) {
    await propertiesPanel.getByLabel("Target entry point").selectOption({ value: targetEntryPointId });
  }
  await propertiesPanel.getByTestId("action-save-button").click();

  await expect(page).toHaveURL(/#action\/[0-9a-f-]+$/);
  const url = page.url();
  const action = await page.evaluate(async (actionName) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; name: string; storageRoot: string } | null>((resolve, reject) => {
      const transaction = database.transaction("actions", "readonly");
      const store = transaction.objectStore("actions");
      const request = store.getAll();
      request.onsuccess = () => resolve(
        (request.result as Array<{ id: string; name: string; storageRoot: string }>).find((item) => item.name === actionName) ?? null,
      );
      request.onerror = () => reject(request.error ?? new Error("Could not read actions store"));
    });

    database.close();
    return entry;
  }, name);

  expect(action?.storageRoot).toBe("user");
  return { id: action?.id ?? "", url };
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

test("new scenes can be created and survive reload", async ({ page }) => {
  const sceneName = `playwright-scene-${Date.now()}`;
  await openEditor(page);

  const { url: urlAfterSave } = await createSceneFromEditor(page, sceneName);

  await page.reload();

  await expect(page).toHaveURL(urlAfterSave);
  await expect(page.getByTestId("scene-workspace")).toBeVisible();
});

test("new actions can target scenes and survive reload", async ({ page }) => {
  const sceneName = `playwright-target-scene-${Date.now()}`;
  const actionName = `playwright-action-${Date.now()}`;
  await openEditor(page);

  const { id: targetSceneId } = await createSceneFromEditor(page, sceneName);
  expect(targetSceneId).not.toBe("");
  const { url: urlAfterSave } = await createActionFromEditor(page, actionName, targetSceneId);
  const action = await page.evaluate(async (name) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; name: string; targetSceneId: string; storageRoot: string } | null>((resolve, reject) => {
      const transaction = database.transaction("actions", "readonly");
      const store = transaction.objectStore("actions");
      const request = store.getAll();
      request.onsuccess = () => resolve(
        (request.result as Array<{ id: string; name: string; targetSceneId: string; storageRoot: string }>).find((item) => item.name === name) ?? null,
      );
      request.onerror = () => reject(request.error ?? new Error("Could not read actions store"));
    });

    database.close();
    return entry;
  }, actionName);

  expect(action?.storageRoot).toBe("user");
  expect(action?.targetSceneId).toBe(targetSceneId);

  await page.reload();

  await expect(page).toHaveURL(urlAfterSave);
  await expect(page.getByTestId("action-workspace")).toBeVisible();
});

test("scene objects can be authored and survive reload", async ({ page }) => {
  const targetSceneName = `playwright-entry-target-${Date.now()}`;
  const sourceSceneName = `playwright-trigger-source-${Date.now()}`;
  const actionName = `playwright-scene-link-${Date.now()}`;
  await openEditor(page);

  const { id: targetSceneId } = await createSceneFromEditor(page, targetSceneName);
  expect(targetSceneId).not.toBe("");

  const previewCanvas = page.locator('[data-testid="scene-preview"] canvas');
  await expect(previewCanvas).toBeVisible();
  const targetBox = await previewCanvas.boundingBox();
  expect(targetBox).not.toBeNull();

  await page.getByTestId("scene-tool-entry-point").click();
  await page.mouse.click(
    (targetBox?.x ?? 0) + ((targetBox?.width ?? 0) * 0.55),
    (targetBox?.y ?? 0) + ((targetBox?.height ?? 0) * 0.45),
  );
  await expect(page.getByTestId("scene-object-row")).toHaveCount(1);
  await expect(page.getByTestId("scene-object-row").first()).toHaveAttribute("data-object-type", "entry-point");
  await page.getByTestId("editor-properties-panel").getByLabel("Entry point name").fill("North Gate");
  await page.getByTestId("scene-save-button").click();

  const targetScene = await page.evaluate(async (sceneId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> } | null>((resolve, reject) => {
      const transaction = database.transaction("scenes", "readonly");
      const store = transaction.objectStore("scenes");
      const request = store.get(sceneId);
      request.onsuccess = () => resolve((request.result as { id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> }) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not read scenes store"));
    });

    database.close();
    return entry;
  }, targetSceneId);

  const targetObjects = targetScene?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
  const entryPoint = targetObjects.find((object) => object.type === "entry-point") as { id: string; name: string } | undefined;
  expect(entryPoint?.name).toBe("North Gate");

  const { id: actionId } = await createActionFromEditor(page, actionName, targetSceneId, entryPoint?.id);
  expect(actionId).not.toBe("");

  const { id: sourceSceneId, url: sourceSceneUrl } = await createSceneFromEditor(page, sourceSceneName);
  expect(sourceSceneId).not.toBe("");
  await expect(page.getByTestId("scene-workspace")).toBeVisible();

  const sourceBox = await page.locator('[data-testid="scene-preview"] canvas').boundingBox();
  expect(sourceBox).not.toBeNull();

  await page.getByTestId("scene-tool-trigger-zone").click();
  await page.mouse.move(
    (sourceBox?.x ?? 0) + ((sourceBox?.width ?? 0) * 0.38),
    (sourceBox?.y ?? 0) + ((sourceBox?.height ?? 0) * 0.42),
  );
  await page.mouse.down();
  await page.mouse.move(
    (sourceBox?.x ?? 0) + ((sourceBox?.width ?? 0) * 0.58),
    (sourceBox?.y ?? 0) + ((sourceBox?.height ?? 0) * 0.60),
  );
  await page.mouse.up();

  await expect(page.getByTestId("scene-object-row")).toHaveCount(1);
  await expect(page.getByTestId("scene-object-row").first()).toHaveAttribute("data-object-type", "trigger-zone");
  await page.getByTestId("editor-properties-panel").getByLabel("Action").selectOption({ value: actionId });
  await page.getByTestId("scene-save-button").click();
  await expect.poll(async () => page.evaluate(async (sceneId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> } | null>((resolve, reject) => {
      const transaction = database.transaction("scenes", "readonly");
      const store = transaction.objectStore("scenes");
      const request = store.get(sceneId);
      request.onsuccess = () => resolve((request.result as { id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> }) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not read scenes store"));
    });

    database.close();
    const objects = entry?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
    const trigger = objects.find((object) => object.type === "trigger-zone") as { actionId: string | null } | undefined;
    return trigger?.actionId ?? null;
  }, sourceSceneId)).toBe(actionId);

  await page.reload();
  await expect(page).toHaveURL(sourceSceneUrl);
  await expect(page.getByTestId("scene-workspace")).toBeVisible();
  await expect(page.getByTestId("scene-object-row")).toHaveCount(1);

  const sourceScene = await page.evaluate(async (sceneId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> } | null>((resolve, reject) => {
      const transaction = database.transaction("scenes", "readonly");
      const store = transaction.objectStore("scenes");
      const request = store.get(sceneId);
      request.onsuccess = () => resolve((request.result as { id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> }) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not read scenes store"));
    });

    database.close();
    return entry;
  }, sourceSceneId);

  const sourceObjects = sourceScene?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
  const triggerZone = sourceObjects.find((object) => object.type === "trigger-zone") as { actionId: string | null; width: number; height: number } | undefined;
  expect(triggerZone?.actionId).toBe(actionId);
  expect((triggerZone?.width ?? 0) > 0).toBe(true);
  expect((triggerZone?.height ?? 0) > 0).toBe(true);
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
