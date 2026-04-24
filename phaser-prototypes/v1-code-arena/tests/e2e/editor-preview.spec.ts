import { expect, test, type Page } from "@playwright/test";

async function openEditor(page: Page, hash: string): Promise<void> {
  await page.goto(`/editor.html${hash}`);
  await expect(page.getByTestId("editor-shell")).toBeVisible();
}

async function waitForPreviewPixels(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".animation-preview canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      return false;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return false;
    }
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] !== 0) {
        return true;
      }
    }
    return false;
  });
}

async function getPreviewDataUrl(page: Page): Promise<string> {
  return page.evaluate(() => {
    const canvas = document.querySelector(".animation-preview canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error("Preview canvas not found");
    }
    return canvas.toDataURL();
  });
}

test("attack preview keeps cycling in the animation editor", async ({ page }) => {
  await openEditor(page, "#animation/core:animation:player-attack-1");
  await waitForPreviewPixels(page);

  const properties = page.getByTestId("editor-properties-panel");
  await properties.getByRole("button", { name: "Preview", exact: true }).click();

  await page.waitForTimeout(620);
  const sampleA = await getPreviewDataUrl(page);

  await page.waitForTimeout(120);
  const sampleB = await getPreviewDataUrl(page);

  expect(sampleA).not.toBe(sampleB);
});

test("run side facing mirrors the character run preview", async ({ page }) => {
  await openEditor(page, "#character/new");

  const properties = page.getByTestId("editor-properties-panel");
  const selects = properties.locator("select");
  await selects.nth(0).selectOption("core:animation:player-idle");
  await selects.nth(1).selectOption("core:animation:player-run");
  await waitForPreviewPixels(page);
  await properties.getByRole("button", { name: "Run", exact: true }).click();
  await properties.getByRole("button", { name: "Pause", exact: true }).click();

  const facing = selects.nth(4);
  await facing.selectOption("right");
  const rightFacing = await getPreviewDataUrl(page);

  await facing.selectOption("left");
  const leftFacing = await getPreviewDataUrl(page);

  expect(rightFacing).not.toBe(leftFacing);
});
