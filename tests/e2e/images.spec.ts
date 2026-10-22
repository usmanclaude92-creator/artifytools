import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Download, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

/** Width and height from a PNG or JPEG file. */
async function dimensions(download: Download): Promise<[number, number]> {
  const b = readFileSync((await download.path())!);
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1]!;
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error("no size");
}

test.describe("Resize Image", () => {
  test("resizes to an exact size, by one side, and by percentage", async ({ page }) => {
    await open(page, "/tools/resize-image");
    await page.getByRole("button", { name: /Square post/ }).click();
    await page.locator('input[type="file"]').setInputFiles([fixture("photo-upright.jpg"), fixture("logo-transparent.png")]);
    await expect(page.getByText(/→ 1080×1080/)).toHaveCount(2);
    const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).first().click()]);
    expect(d1.suggestedFilename()).toBe("photo-upright-1080x1080.jpg");
    expect(await dimensions(d1)).toEqual([1080, 1080]);

    await page.getByLabel("Height (px)").fill("");
    await page.getByLabel("Width (px)").fill("200");
    await expect(page.getByText(/→ 200×/)).toHaveCount(2);
    await expect(page.getByLabel("When both sides are set")).toBeDisabled();

    await page.getByRole("radio", { name: "By percentage" }).check({ force: true });
    await page.getByRole("button", { name: "25%" }).click();
    await expect(page.getByText(/→ \d+×\d+/)).toHaveCount(2);
    await page.getByRole("textbox", { name: "Percentage" }).fill("0");
    await expect(page.getByText("Enter a percentage above 0 that keeps the image under 16000 px.")).toBeVisible();
  });
});

test.describe("Crop Image", () => {
  test("crops to an aspect ratio, by dragging and by typed pixels", async ({ page }) => {
    await open(page, "/tools/crop-image");
    await page.locator('input[type="file"]').setInputFiles(fixture("logo-transparent.png"));
    const w = page.getByLabel("Width (px)");
    const h = page.getByLabel("Height (px)");
    const full = [Number(await w.inputValue()), Number(await h.inputValue())];
    await page.getByRole("radio", { name: "16:9" }).click();
    const [cw, ch] = [Number(await w.inputValue()), Number(await h.inputValue())];
    expect(cw / ch).toBeCloseTo(16 / 9, 1);
    expect(cw).toBeLessThanOrEqual(full[0]!);

    // Dragging the box moves it.
    await page.getByRole("radio", { name: "Free" }).click();
    await w.fill(String(Math.round(full[0]! / 2)));
    await h.fill(String(Math.round(full[1]! / 2)));
    await page.getByLabel("Left (px)").fill("0");
    await page.getByLabel("Top (px)").fill("0");
    const box = page.getByRole("group", { name: /Crop area/ });
    const bb = (await box.boundingBox())!;
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + 30, bb.y + bb.height / 2 + 20, { steps: 5 });
    await page.mouse.up();
    expect(Number(await page.getByLabel("Left (px)").inputValue())).toBeGreaterThan(0);
    // Keyboard moves it too.
    const before = Number(await page.getByLabel("Top (px)").inputValue());
    await box.focus();
    await page.keyboard.press("ArrowDown");
    expect(Number(await page.getByLabel("Top (px)").inputValue())).toBeGreaterThan(before);

    await w.fill("40");
    await h.fill("30");
    await page.getByLabel("Output format").selectOption("png");
    await page.getByRole("button", { name: "Crop image" }).click();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).click()]);
    expect(d.suggestedFilename()).toBe("logo-transparent-cropped.png");
    expect(await dimensions(d)).toEqual([40, 30]);
    await page.getByRole("button", { name: "Rotate right" }).click();
    await expect(page.getByText("The crop changed. Crop again to update the image.")).toBeVisible();
  });
});
