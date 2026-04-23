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

async function openEditor(page: Page): Promise<void> {
  await page.goto("/editor.html#library");
  await expect(page.getByTestId("editor-shell")).toBeVisible();
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
