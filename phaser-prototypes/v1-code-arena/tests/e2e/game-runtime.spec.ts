import { expect, test, type Page } from "@playwright/test";

interface RuntimeDebugState {
  gameId: string | null;
  sceneId: string | null;
  entryPointId: string | null;
  phase: "booting" | "running" | "transitioning";
  surface: "intro" | "main_menu" | "campaign" | "editor" | null;
  phaserSceneKey: string | null;
}

const DEFAULT_SCENE_DIMENSIONS = {
  widthInCells: 24,
  heightInCells: 14,
  tileWidth: 32,
  tileHeight: 32,
} as const;

async function openGame(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("game-root")).toBeVisible();
}

async function openEditor(page: Page): Promise<void> {
  await page.goto("/editor.html#library");
  await expect(page.getByTestId("editor-shell")).toBeVisible();
}

async function readSceneRecord(
  page: Page,
  sceneId: string,
): Promise<{ id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> } | null> {
  return page.evaluate(async (id) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entry = await new Promise<{ id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> } | null>((resolve, reject) => {
      const transaction = database.transaction("scenes", "readonly");
      const store = transaction.objectStore("scenes");
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as { id: string; layers: Array<{ kind: string; objects?: Array<Record<string, unknown>> }> }) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not read scenes store"));
    });

    database.close();
    return entry;
  }, sceneId);
}

async function readGameEntryScene(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    const entrySceneId = await new Promise<string | null>((resolve, reject) => {
      const transaction = database.transaction("games", "readonly");
      const store = transaction.objectStore("games");
      const request = store.get("core:game:canuter-main");
      request.onsuccess = () => resolve((request.result as { entrySceneId?: string } | undefined)?.entrySceneId ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not read games store"));
    });

    database.close();
    return entrySceneId;
  });
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

async function createEntryPointInCurrentScene(page: Page, sceneId: string, name: string): Promise<string> {
  const previewCanvas = page.locator('[data-testid="scene-preview"] canvas');
  await expect(previewCanvas).toBeVisible();
  const box = await previewCanvas.boundingBox();
  expect(box).not.toBeNull();
  const targetPoint = getSceneCellPoint(box, 13, 6);

  await page.getByTestId("scene-tool-entry-point").click();
  await page.mouse.click(targetPoint.x, targetPoint.y);
  await expect(page.getByTestId("scene-object-row")).toHaveCount(1);
  await page.getByTestId("editor-properties-panel").getByLabel("Entry point name").fill(name);
  await page.getByTestId("scene-save-button").click();

  await expect.poll(async () => {
    const scene = await readSceneRecord(page, sceneId);
    const objects = scene?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
    const entryPoint = objects.find((object) => object.type === "entry-point") as { id?: string; name?: string } | undefined;
    return entryPoint?.name ?? null;
  }).toBe(name);

  const scene = await readSceneRecord(page, sceneId);
  const objects = scene?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
  const entryPoint = objects.find((object) => object.type === "entry-point") as { id?: string } | undefined;
  return entryPoint?.id ?? "";
}

async function createTriggerZoneInCurrentScene(page: Page, sceneId: string, actionId: string): Promise<void> {
  const previewCanvas = page.locator('[data-testid="scene-preview"] canvas');
  await expect(previewCanvas).toBeVisible();
  const box = await previewCanvas.boundingBox();
  expect(box).not.toBeNull();
  const startPoint = getSceneCellPoint(box, 0, 0);
  const endPoint = getSceneCellPoint(box, 4, 13);

  await page.getByTestId("scene-tool-trigger-zone").click();
  await page.mouse.move(startPoint.x, startPoint.y);
  await page.mouse.down();
  await page.mouse.move(endPoint.x, endPoint.y);
  await page.mouse.up();

  await expect(page.getByTestId("scene-object-row")).toHaveCount(1);
  await page.getByTestId("editor-properties-panel").getByLabel("Action").selectOption({ value: actionId });
  await page.getByTestId("scene-save-button").click();

  await expect.poll(async () => {
    const scene = await readSceneRecord(page, sceneId);
    const objects = scene?.layers.find((layer) => layer.kind === "objects")?.objects ?? [];
    const trigger = objects.find((object) => object.type === "trigger-zone") as { actionId?: string | null } | undefined;
    return trigger?.actionId ?? null;
  }).toBe(actionId);
}

async function updateGameEntryScene(page: Page, entrySceneId: string): Promise<void> {
  await page.getByTestId("editor-open-game-button").click();
  await expect(page.getByTestId("game-workspace")).toBeVisible();

  const propertiesPanel = page.getByTestId("editor-properties-panel");
  await propertiesPanel.getByLabel("Entry scene").selectOption({ value: entrySceneId });
  await propertiesPanel.getByTestId("game-save-button").click();

  await expect.poll(async () => readGameEntryScene(page)).toBe(entrySceneId);
}

function getSceneCellPoint(
  box: { x: number; y: number; width: number; height: number } | null,
  cellX: number,
  cellY: number,
): { x: number; y: number } {
  const safeBox = box ?? { x: 0, y: 0, width: 0, height: 0 };
  const scenePixelWidth = DEFAULT_SCENE_DIMENSIONS.widthInCells * DEFAULT_SCENE_DIMENSIONS.tileWidth;
  const scenePixelHeight = DEFAULT_SCENE_DIMENSIONS.heightInCells * DEFAULT_SCENE_DIMENSIONS.tileHeight;
  const scale = Math.min(
    (safeBox.width - 80) / scenePixelWidth,
    (safeBox.height - 80) / scenePixelHeight,
    3,
  );
  const offsetX = (safeBox.width - (scenePixelWidth * scale)) * 0.5;
  const offsetY = (safeBox.height - (scenePixelHeight * scale)) * 0.5;
  return {
    x: safeBox.x + offsetX + ((cellX + 0.5) * DEFAULT_SCENE_DIMENSIONS.tileWidth * scale),
    y: safeBox.y + offsetY + ((cellY + 0.5) * DEFAULT_SCENE_DIMENSIONS.tileHeight * scale),
  };
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

async function seedSceneTransitionRuntime(page: Page): Promise<{ sourceSceneId: string; targetSceneId: string; entryPointId: string }> {
  await openEditor(page);

  return page.evaluate(async () => {
    const now = new Date().toISOString();
    const stamp = `${Date.now()}`;
    const sourceSceneId = `user:scene:runtime-source-${stamp}`;
    const targetSceneId = `user:scene:runtime-target-${stamp}`;
    const actionId = `user:action:runtime-transition-${stamp}`;
    const entryPointId = `user:entry-point:${stamp}`;

    const sourceScene = {
      id: sourceSceneId,
      name: `Runtime Source ${stamp}`,
      storageRoot: "user",
      folderId: "folder:root:user",
      relativePath: `runtime-source-${stamp}.json`,
      widthInCells: 24,
      heightInCells: 14,
      tileWidth: 32,
      tileHeight: 32,
      tileFitMode: "crop",
      defaultPlayerCharacterId: "core:character:player-shinobi",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      layers: [
        {
          id: "layer-terrain",
          name: "Terrain",
          kind: "tiles",
          visible: true,
          locked: false,
          cells: [],
        },
        {
          id: "layer-solid",
          name: "Solid",
          kind: "collision",
          visible: true,
          locked: false,
          collisionKind: "solid",
          cells: [],
        },
        {
          id: "layer-objects",
          name: "Objects",
          kind: "objects",
          visible: true,
          locked: false,
          objects: [
            {
              id: `trigger-zone:${stamp}`,
              type: "trigger-zone",
              x: 96,
              y: 0,
              width: 128,
              height: 14 * 32,
              triggerMode: "overlap",
              actionId,
            },
          ],
        },
      ],
    };

    const targetScene = {
      id: targetSceneId,
      name: `Runtime Target ${stamp}`,
      storageRoot: "user",
      folderId: "folder:root:user",
      relativePath: `runtime-target-${stamp}.json`,
      widthInCells: 24,
      heightInCells: 14,
      tileWidth: 32,
      tileHeight: 32,
      tileFitMode: "crop",
      defaultPlayerCharacterId: "core:character:player-shinobi",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      layers: [
        {
          id: "layer-terrain",
          name: "Terrain",
          kind: "tiles",
          visible: true,
          locked: false,
          cells: [],
        },
        {
          id: "layer-solid",
          name: "Solid",
          kind: "collision",
          visible: true,
          locked: false,
          collisionKind: "solid",
          cells: [],
        },
        {
          id: "layer-objects",
          name: "Objects",
          kind: "objects",
          visible: true,
          locked: false,
          objects: [
            {
              id: entryPointId,
              type: "entry-point",
              name: "Target Entry",
              x: 320,
              y: 160,
            },
          ],
        },
      ],
    };

    const action = {
      id: actionId,
      name: `Runtime Transition ${stamp}`,
      storageRoot: "user",
      folderId: "folder:root:user",
      relativePath: `runtime-transition-${stamp}.json`,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      kind: "scene-transition",
      targetSceneId,
      targetEntryPointId: entryPointId,
      transitionStyle: "none",
    };

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("canuter-phaser-v1-editor");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open editor database"));
    });

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("scenes", "readwrite");
        transaction.objectStore("scenes").put(sourceScene);
        transaction.objectStore("scenes").put(targetScene);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not seed scenes"));
      }),
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("actions", "readwrite");
        transaction.objectStore("actions").put(action);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not seed actions"));
      }),
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("games", "readwrite");
        const store = transaction.objectStore("games");
        const request = store.get("core:game:canuter-main");
        request.onsuccess = () => {
          const currentGame = request.result;
          if (!currentGame) {
            reject(new Error("Missing core game definition"));
            return;
          }

          store.put({
            ...currentGame,
            entrySceneId: sourceSceneId,
            entryPointId: null,
            updatedAt: now,
          });
        };
        request.onerror = () => reject(request.error ?? new Error("Could not read core game"));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not seed game"));
      }),
    ]);

    database.close();
    return { sourceSceneId, targetSceneId, entryPointId };
  });
}

test("game exposes runtime debug state and reaches the main menu", async ({ page }) => {
  await openGame(page);

  await expect(page.getByTestId("menu-campaign-button")).toBeVisible();

  const state = await readRuntimeDebugState(page);
  expect(state.gameId).toBe("core:game:canuter-main");
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
  expect(state.gameId).toBe("core:game:canuter-main");
  expect(state.phase).toBe("running");
  expect(state.surface).toBe("campaign");
  expect(state.sceneId).toBe("core:scene:swamp-campaign-v1");
  expect(state.entryPointId).toBeNull();
  expect(state.phaserSceneKey).toBe("CampaignScene");
});

test("campaign trigger zones execute scene-transition actions", async ({ page }) => {
  const runtimeSeed = await seedSceneTransitionRuntime(page);

  await openGame(page);
  await expect(page.getByTestId("menu-campaign-button")).toBeVisible();

  await page.getByTestId("menu-campaign-button").click();
  await page.waitForFunction((expectedSceneId) => window.__CANUTER_RUNTIME__?.sceneId === expectedSceneId, runtimeSeed.sourceSceneId);

  await page.keyboard.down("ArrowRight");
  await page.waitForFunction((expected) => {
    const runtime = window.__CANUTER_RUNTIME__;
    return runtime?.phase === "running" && runtime.sceneId === expected.targetSceneId && runtime.entryPointId === expected.entryPointId;
  }, runtimeSeed);
  await page.keyboard.up("ArrowRight");

  const state = await readRuntimeDebugState(page);
  expect(state.gameId).toBe("core:game:canuter-main");
  expect(state.surface).toBe("campaign");
  expect(state.sceneId).toBe(runtimeSeed.targetSceneId);
  expect(state.entryPointId).toBe(runtimeSeed.entryPointId);
});

test("campaign can transition across scenes authored from the editor", async ({ page }) => {
  const stamp = Date.now();
  const targetSceneName = `runtime-target-${stamp}`;
  const sourceSceneName = `runtime-source-${stamp}`;
  const actionName = `runtime-action-${stamp}`;

  await openEditor(page);

  const { id: targetSceneId } = await createSceneFromEditor(page, targetSceneName);
  expect(targetSceneId).not.toBe("");
  const targetEntryPointId = await createEntryPointInCurrentScene(page, targetSceneId, "Target Entry");
  expect(targetEntryPointId).not.toBe("");

  const { id: actionId } = await createActionFromEditor(page, actionName, targetSceneId, targetEntryPointId);
  expect(actionId).not.toBe("");

  const { id: sourceSceneId } = await createSceneFromEditor(page, sourceSceneName);
  expect(sourceSceneId).not.toBe("");
  await createTriggerZoneInCurrentScene(page, sourceSceneId, actionId);

  await updateGameEntryScene(page, sourceSceneId);

  await openGame(page);
  await expect(page.getByTestId("menu-campaign-button")).toBeVisible();

  await page.getByTestId("menu-campaign-button").click();
  await page.waitForFunction((expected) => {
    const runtime = window.__CANUTER_RUNTIME__;
    return runtime?.phase === "running" && runtime.sceneId === expected.targetSceneId && runtime.entryPointId === expected.targetEntryPointId;
  }, { targetSceneId, targetEntryPointId });

  const state = await readRuntimeDebugState(page);
  expect(state.gameId).toBe("core:game:canuter-main");
  expect(state.surface).toBe("campaign");
  expect(state.sceneId).toBe(targetSceneId);
  expect(state.entryPointId).toBe(targetEntryPointId);

  await openEditor(page);
  await page.getByTestId("editor-open-game-button").click();
  await expect(page.getByTestId("game-workspace")).toBeVisible();
  await expect(page.getByTestId("editor-properties-panel").getByLabel("Entry scene")).toHaveValue(sourceSceneId);
});
