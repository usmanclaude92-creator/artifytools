import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Download, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);
const bytesOf = async (d: Download) => readFileSync((await d.path())!);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Rotate PDF", () => {
  test("rotates one page and then all pages", async ({ page }) => {
    await open(page, "/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save rotated PDF" })).toBeDisabled();
    await page.getByRole("button", { name: "Rotate page 2 right" }).click();
    await page.getByRole("button", { name: "Save rotated PDF" }).click();
    const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d1.suggestedFilename()).toBe("plain-3-pages-rotated.pdf");
    const doc = await PDFDocument.load(await bytesOf(d1));
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90, 0]);
    await page.getByRole("button", { name: "All left" }).click();
    await page.getByRole("button", { name: "Save rotated PDF" }).click();
    const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect((await PDFDocument.load(await bytesOf(d2))).getPages().map((p) => p.getRotation().angle)).toEqual([270, 0, 270]);
  });
});

test.describe("Crop PDF", () => {
  test("crops all pages, then one page only", async ({ page }) => {
    await open(page, "/tools/crop-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save cropped PDF" })).toBeDisabled();
    const area = page.getByTestId("crop-area");
    const handle = page.locator('[data-handle="se"]');
    await area.scrollIntoViewIfNeeded();
    const a = (await area.boundingBox())!;
    const h = (await handle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Save cropped PDF" }).click();
    const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d1.suggestedFilename()).toBe("plain-3-pages-cropped.pdf");
    const all = (await PDFDocument.load(await bytesOf(d1))).getPages().map((p) => p.getCropBox());
    for (const b of all) {
      expect(b.width).toBeGreaterThan(50);
      expect(b.width).toBeLessThan(200);
    }
    // One page only: page 2 is cropped, the others keep their size.
    await page.getByRole("radio", { name: "This page only" }).check();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText("Page 2 of 3")).toBeVisible();
    await area.scrollIntoViewIfNeeded();
    const h2 = (await handle.boundingBox())!;
    const a2 = (await area.boundingBox())!;
    await page.mouse.move(h2.x + h2.width / 2, h2.y + h2.height / 2);
    await page.mouse.down();
    await page.mouse.move(a2.x + a2.width / 2, a2.y + a2.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Save cropped PDF" }).click();
    const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const widths = (await PDFDocument.load(await bytesOf(d2))).getPages().map((p) => Math.round(p.getCropBox().width));
    expect(widths[1]).toBeLessThan(widths[0]!);
    expect(widths[0]).toBe(widths[2]);
  });
});

test.describe("Crop PDF turning and straightening", () => {
  test("turns pages with the box following, straightens, and matches all pages", async ({ page }) => {
    await open(page, "/tools/crop-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    const area = page.getByTestId("crop-area");
    await area.scrollIntoViewIfNeeded();
    const before = (await area.boundingBox())!;
    await page.getByRole("button", { name: "Turn page right" }).click();
    await page.waitForTimeout(300);
    await area.scrollIntoViewIfNeeded();
    const after = (await area.boundingBox())!;
    // The frame takes the turned page's shape: portrait becomes landscape.
    expect(Math.abs(after.width / after.height - before.height / before.width)).toBeLessThan(0.02);
    // Turning alone is enough to save.
    await page.getByRole("button", { name: "Save cropped PDF" }).click();
    const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect((await PDFDocument.load(await bytesOf(d1))).getPages().map((p) => p.getRotation().angle)).toEqual([90, 90, 90]);
    // Straighten: the page is re-placed on a new page the size of the turned view.
    await page.getByLabel("Straighten", { exact: true }).fill("3");
    await expect(page.getByText("+3.0°")).toBeVisible();
    await page.getByRole("button", { name: "Save cropped PDF" }).click();
    const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const doc2 = await PDFDocument.load(await bytesOf(d2));
    expect(doc2.getPageCount()).toBe(3);
    expect(doc2.getPages().map((p) => p.getRotation().angle)).toEqual([0, 0, 0]);
    const turnedSize = (await PDFDocument.load(await bytesOf(d1))).getPages()[0]!;
    // Turned a quarter, the view's width and height swap.
    expect(doc2.getPages()[0]!.getWidth()).toBeCloseTo(turnedSize.getHeight(), 0);
    expect(doc2.getPages()[0]!.getHeight()).toBeCloseTo(turnedSize.getWidth(), 0);
    // Only this page: set a box on page 1 and copy it everywhere.
    await page.getByRole("radio", { name: "This page only" }).check();
    await page.getByRole("button", { name: "Match all pages" }).click();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText("Page 2 of 3")).toBeVisible();
  });
});

test.describe("Organize PDF", () => {
  test("turning a page keeps its card the same size", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    const card = page.locator("li[data-page-index='0']");
    const before = (await card.boundingBox())!;
    await page.getByRole("button", { name: "Rotate page 1 right" }).click();
    await page.waitForTimeout(400);
    const after = (await card.boundingBox())!;
    expect(Math.abs(after.height - before.height)).toBeLessThan(1);
    expect(Math.abs(after.width - before.width)).toBeLessThan(1);
    // The turned picture stays inside the frame.
    const frame = (await page.getByRole("img", { name: "Page 1" }).locator("xpath=..").boundingBox())!;
    const img = (await page.getByRole("img", { name: "Page 1" }).boundingBox())!;
    expect(img.width).toBeLessThanOrEqual(frame.width + 1);
    expect(img.height).toBeLessThanOrEqual(frame.height + 1);
  });

  test("reorders, deletes and rotates pages", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save organized PDF" })).toBeDisabled();
    await page.getByRole("button", { name: "Move page 3 earlier" }).click();
    await page.getByRole("button", { name: "Move page 3 earlier" }).click();
    await page.getByRole("button", { name: "Delete page 2" }).click();
    await page.getByRole("button", { name: "Rotate page 1 right" }).click();
    await expect(page.getByText("2 of 3 pages kept")).toBeVisible();
    await page.getByRole("button", { name: "Save organized PDF" }).click();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d.suggestedFilename()).toBe("plain-3-pages-organized.pdf");
    const doc = await PDFDocument.load(await bytesOf(d));
    // Order is now page 3, page 1 (rotated right); page 2 is gone.
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90]);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("3 of 3 pages kept")).toBeVisible();
  });
});

test.describe("Organize PDF files", () => {
  test("Replace File and Add More Files replace the old Choose another file button", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Replace File" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add More Files" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose another file" })).toHaveCount(0);

    // Add More Files: pages from a second PDF join the end, labelled by file.
    await page.locator('input[type="file"][multiple]').setInputFiles(fixture("plain-2-pages.pdf"));
    await expect(page.getByText("5 of 5 pages kept")).toBeVisible();
    await expect(page.getByRole("img", { name: "Page 2 of plain-2-pages.pdf" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Page 3 of plain-3-pages.pdf" })).toBeVisible();
    await page.getByRole("button", { name: "Save organized PDF" }).click();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d.suggestedFilename()).toBe("organized.pdf");
    expect((await PDFDocument.load(await bytesOf(d))).getPageCount()).toBe(5);

    // Removing a file drops its pages.
    await page.getByRole("button", { name: "Remove plain-2-pages.pdf" }).click();
    await expect(page.getByText("3 of 3 pages kept")).toBeVisible();

    // Replace File starts over with a different PDF.
    await page.locator('input[type="file"]:not([multiple])').setInputFiles(fixture("plain-2-pages.pdf"));
    await expect(page.getByText("2 of 2 pages kept")).toBeVisible();
    await expect(page.getByText("plain-3-pages.pdf")).toHaveCount(0);
    await expect(page.getByRole("img", { name: "Page 2" })).toBeVisible();
  });

  test("a file that is not a PDF is refused when adding", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-2-pages.pdf"));
    await expect(page.getByText("2 of 2 pages kept")).toBeVisible();
    await page.locator('input[type="file"][multiple]').setInputFiles(fixture("photo-upright.jpg"));
    await expect(page.getByText(/isn't a supported file type/)).toBeVisible();
    await expect(page.getByText("2 of 2 pages kept")).toBeVisible();
  });
});

test.describe("Organize PDF dragging", () => {
  // Bring the thumbnails fully into view first: dragging uses real pointer coordinates.
  const reveal = (page: Page) => page.locator("li[data-page-index]").first().evaluate((el) => el.parentElement!.scrollIntoView({ block: "center" }));
  const order = (page: Page) => page.locator("li[data-page-index] img").evaluateAll((els) => els.map((e) => (e as HTMLImageElement).alt));

  test("drags a page with the mouse", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await reveal(page);
    const from = (await page.locator("li[data-page-index]").nth(2).boundingBox())!;
    const to = (await page.locator("li[data-page-index]").nth(0).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await order(page)).toEqual(["Page 3", "Page 1", "Page 2"]);
    await expect(page.getByRole("button", { name: "Save organized PDF" })).toBeEnabled();
  });

  test("a click opens the page preview; moving past it picks the page up instead", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await reveal(page);
    await page.getByRole("button", { name: "Preview page 2" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Page 2 · position 2 of 3")).toBeVisible();
    await dialog.getByRole("button", { name: "Next page" }).click();
    await expect(dialog.getByText("Page 3 · position 3 of 3")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(await order(page)).toEqual(["Page 1", "Page 2", "Page 3"]);
    await expect(page.getByRole("button", { name: "Save organized PDF" })).toBeDisabled();
  });

  test("press and hold picks a page up without moving first", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await reveal(page);
    const from = (await page.getByRole("button", { name: "Preview page 3" }).boundingBox())!;
    const to = (await page.locator("li[data-page-index]").nth(0).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(450); // longer than the hold time, no movement
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(await order(page)).toEqual(["Page 3", "Page 1", "Page 2"]);
  });

  test("the size slider changes the thumbnail size", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    const width = async () => (await page.locator("li[data-page-index]").first().boundingBox())!.width;
    const before = await width();
    await page.getByRole("button", { name: "Larger thumbnails" }).click();
    await page.getByRole("button", { name: "Larger thumbnails" }).click();
    await expect.poll(width).toBeGreaterThan(before + 20);
    const larger = await width();
    await page.getByRole("button", { name: "Smaller thumbnails" }).click();
    await expect.poll(width).toBeLessThan(larger - 10);
  });

  test("the thumbnail picture fills its frame", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    const img = page.getByRole("img", { name: "Page 1" });
    await expect(img).toBeVisible();
    const [a, b] = await Promise.all([img.boundingBox(), img.locator("xpath=..").boundingBox()]);
    expect(Math.abs(a!.width - b!.width)).toBeLessThan(2);
    expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
  });

  test("Escape cancels a drag", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await reveal(page);
    const from = (await page.locator("li[data-page-index]").nth(2).boundingBox())!;
    const to = (await page.locator("li[data-page-index]").nth(0).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect(await order(page)).toEqual(["Page 1", "Page 2", "Page 3"]);
  });

  test("long press picks a page up and a tap opens the preview @mobile", async ({ page }) => {
    await open(page, "/tools/organize-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await reveal(page);
    await page.getByRole("button", { name: "Preview page 2" }).tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close preview" }).tap();
    await expect(page.getByRole("dialog")).toBeHidden();
    const frame = (await page.getByRole("button", { name: "Preview page 3" }).boundingBox())!;
    const target = (await page.locator("li[data-page-index]").nth(0).boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const pt = (x: number, y: number) => [{ x, y, id: 1 }];
    const sx = frame.x + frame.width / 2, sy = frame.y + frame.height / 2;
    const ex = target.x + target.width / 2, ey = target.y + target.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(sx, sy) });
    await page.waitForTimeout(600); // a long press
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(sx + ((ex - sx) * i) / 10, sy + ((ey - sy) * i) / 10) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => order(page)).toEqual(["Page 3", "Page 1", "Page 2"]);
  });

});

test.describe("Add Page Numbers", () => {
  test("numbers pages in English and Arabic", async ({ page }) => {
    await open(page, "/tools/add-page-numbers");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText(/· 2 pages/)).toBeVisible();
    await expect(page.getByText("«Page 1 of 2»")).toBeVisible();
    await page.getByRole("button", { name: "Add page numbers" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of the result" })).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d.suggestedFilename()).toBe("report-en-ar-numbered.pdf");
    const doc = await PDFDocument.load(await bytesOf(d));
    expect(doc.getPageCount()).toBe(2);
    await page.getByLabel("Words in").selectOption("ar");
    await page.getByLabel("Use Arabic-Indic digits (١٢٣)").check();
    await expect(page.getByText("«صفحة ١ من ٢»")).toBeVisible();
    await expect(page.getByText("Settings changed. Add page numbers again to update.")).toBeVisible();
    await page.getByLabel("Start at").fill("x");
    await expect(page.getByText("Enter a whole number from 0 to 99999.")).toBeVisible();
  });
});

test.describe("Watermark PDF", () => {
  test("adds a text watermark and validates the image option", async ({ page }) => {
    await open(page, "/tools/watermark-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByLabel("Watermark text")).toHaveValue("CONFIDENTIAL");
    await page.getByLabel("Placement").selectOption("tile");
    await page.getByRole("button", { name: "Add watermark" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of the result" })).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const before = readFileSync(fixture("report-en-ar.pdf")).length;
    expect((await bytesOf(d)).length).toBeGreaterThan(before);
    await page.getByRole("radio", { name: "Image / logo" }).check({ force: true });
    await expect(page.getByText("Choose a PNG or JPG image.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add watermark" })).toBeDisabled();
    await page.getByLabel("Logo or image (PNG or JPG)").setInputFiles(fixture("logo-transparent.png"));
    await expect(page.getByRole("button", { name: "Add watermark" })).toBeEnabled();
  });
});

test.describe("Protect and unlock PDF", () => {
  test("protects with a password and unlocks it again", async ({ page }) => {
    await open(page, "/tools/protect-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByLabel("Password to open the PDF").fill("ab");
    await expect(page.getByText("Use at least 4 characters.")).toBeVisible();
    await page.getByLabel("Password to open the PDF").fill("s3cret-pass");
    await page.getByLabel("Type it again").fill("s3cret-pasX");
    await expect(page.getByText("The passwords don't match.")).toBeVisible();
    await page.getByLabel("Type it again").fill("s3cret-pass");
    await page.getByRole("button", { name: "Protect PDF" }).click();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const protectedBytes = await bytesOf(d);
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow(/encrypted/i);

    await page.goto("/tools/unlock-pdf", { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles({ name: "report-protected.pdf", mimeType: "application/pdf", buffer: protectedBytes });
    await expect(page.getByText("Needs a password to open")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    await expect(page.getByText("That password is incorrect. Check it and try again.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("s3cret-pass");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    const [u] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(u.suggestedFilename()).toBe("report-protected-unlocked.pdf");
    expect((await PDFDocument.load(await bytesOf(u))).getPageCount()).toBe(2);
  });

  test("says when a PDF isn't protected", async ({ page }) => {
    await open(page, "/tools/unlock-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-2-pages.pdf"));
    await expect(page.getByText("This PDF isn't password-protected, so there's nothing to unlock.")).toBeVisible();
  });
});
