import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function pageCountOf(download: import("@playwright/test").Download): Promise<number> {
  const file = await download.path();
  return (await PDFDocument.load(readFileSync(file!))).getPageCount();
}

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test.describe("Merge PDF", () => {
  test("merges files in the chosen order and refuses locked PDFs", async ({ page }) => {
    await open(page, "/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([fixture("plain-3-pages.pdf"), fixture("plain-2-pages.pdf"), fixture("locked.pdf")]);
    await expect(page.getByText("This PDF is password-protected. Unlock it first, then add it again.")).toBeVisible();
    await expect(page.getByText("3 pages", { exact: true })).toBeVisible();
    await expect(page.getByText("2 pages", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Merge PDFs" })).toBeDisabled();
    await page.getByRole("button", { name: "Remove locked.pdf" }).click();

    await page.getByRole("button", { name: "Move plain-2-pages.pdf up" }).click();
    const names = await page.locator("li p[title]").allTextContents();
    expect(names).toEqual(["plain-2-pages.pdf", "plain-3-pages.pdf"]);

    await page.getByRole("button", { name: "Merge PDFs" }).click();
    await expect(page.getByText("merged.pdf", { exact: true })).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download merged PDF" }).click()]);
    expect(download.suggestedFilename()).toBe("merged.pdf");
    expect(await pageCountOf(download)).toBe(5);

    // Changing the list makes the old result stale
    await page.getByRole("button", { name: "Remove plain-3-pages.pdf" }).click();
    await expect(page.getByText("Add at least two PDF files to merge.")).toBeVisible();
  });

  test("works in Arabic", async ({ page }) => {
    await open(page, "/ar/tools/merge-pdf");
    await expect(page.locator("h1")).toHaveText("دمج ملفات PDF");
    await page.locator('input[type="file"]').setInputFiles([fixture("plain-3-pages.pdf"), fixture("plain-2-pages.pdf")]);
    await expect(page.getByText("3 صفحات")).toBeVisible();
    await expect(page.getByText("صفحتان", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "دمج الملفات" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "تنزيل الملف المدمج" }).click()]);
    expect(await pageCountOf(download)).toBe(5);
  });
});

test.describe("Split PDF", () => {
  test("splits by ranges, every page, and validates input", async ({ page }) => {
    await open(page, "/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByText(/3 pages/)).toBeVisible();

    const ranges = page.getByLabel("Page ranges");
    await ranges.fill("2-9");
    await expect(page.getByText("This PDF has 3 pages, so page 9 doesn't exist.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeDisabled();

    await ranges.fill("1, 2-");
    await expect(page.getByText("This creates 2 files.")).toBeVisible();
    await page.getByRole("button", { name: "Split PDF" }).click();
    await expect(page.getByText("plain-3-pages-page-1.pdf")).toBeVisible();
    await expect(page.getByText("plain-3-pages-pages-2-3.pdf")).toBeVisible();
    const [part] = await Promise.all([page.waitForEvent("download"), page.getByRole("listitem").filter({ hasText: "pages-2-3" }).getByRole("button", { name: "Download" }).click()]);
    expect(await pageCountOf(part)).toBe(2);
    const [zip] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download all (.zip)" }).click()]);
    expect(zip.suggestedFilename()).toBe("plain-3-pages-split.zip");

    await page.getByRole("radio", { name: "Every page" }).click();
    await expect(page.getByText("Settings changed. Split again to update the files.")).toBeVisible();
    await page.getByRole("button", { name: "Split PDF" }).click();
    await expect(page.locator("li", { hasText: "plain-3-pages-page-" })).toHaveCount(3);
  });

  test("refuses a password-protected PDF, in Arabic", async ({ page }) => {
    await open(page, "/ar/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("locked.pdf"));
    await expect(page.getByText("هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.")).toBeVisible();
  });
});

test.describe("JPG to PDF", () => {
  async function pdfSizes(download: import("@playwright/test").Download) {
    const doc = await PDFDocument.load(readFileSync((await download.path())!));
    return doc.getPages().map((p) => {
      const { width, height } = p.getSize();
      return [Math.round(width), Math.round(height)];
    });
  }

  test("converts JPG, PNG and WebP, turns phone photos upright, and explains unreadable files", async ({ page }) => {
    await open(page, "/tools/jpg-to-pdf");
    await page.locator('input[type="file"]').setInputFiles([fixture("photo-rotated.jpg"), fixture("logo-transparent.png"), fixture("graphic.webp"), fixture("broken.jpg")]);
    await expect(page.getByText("This image couldn't be read. It may be damaged or in an unsupported format.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to PDF" })).toBeDisabled();
    await page.getByRole("button", { name: "Remove broken.jpg" }).click();

    await page.getByLabel("Page size").selectOption("fit");
    await page.getByLabel("Margin").selectOption("none");
    await page.getByRole("button", { name: "Convert to PDF" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
    expect(download.suggestedFilename()).toBe("images.pdf");
    // 96 dpi: the 400×200 sideways photo is shown upright as 200×400 px → 150×300 pt
    expect(await pdfSizes(download)).toEqual([[150, 300], [225, 113], [180, 180]]);

    // A4 with automatic orientation; changing a setting asks to convert again
    await page.getByLabel("Page size").selectOption("a4");
    await expect(page.getByText("Images or settings changed. Convert again to update the PDF.")).toBeVisible();
    await page.getByRole("button", { name: "Convert to PDF" }).click();
    const [a4] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
    expect(await pdfSizes(a4)).toEqual([[595, 842], [842, 595], [595, 842]]);
  });

  test("works in Arabic and names a single-image PDF after the image", async ({ page }) => {
    await open(page, "/ar/tools/jpg-to-pdf");
    await expect(page.locator("h1")).toHaveText("تحويل الصور إلى PDF");
    await page.locator('input[type="file"]').setInputFiles(fixture("photo-upright.jpg"));
    await page.getByRole("button", { name: "تحويل إلى PDF" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "تنزيل ملف PDF" }).click()]);
    expect(download.suggestedFilename()).toBe("photo-upright.pdf");
    expect((await pdfSizes(download)).length).toBe(1);
  });
});

test.describe("Compress PDF", () => {
  async function photoPdf(): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const jpg = await doc.embedJpg(readFileSync(fixture("noisy-photo.jpg")));
    const png = await doc.embedPng(readFileSync(fixture("noisy-alpha.png")));
    for (let i = 0; i < 3; i++) {
      const page = doc.addPage([600, 800]);
      page.drawImage(jpg, { x: 0, y: 350, width: 600, height: 450 });
      page.drawImage(png, { x: 0, y: 0, width: 300, height: 200 });
    }
    return Buffer.from(await doc.save());
  }

  test("shrinks a photo-heavy PDF and keeps every page", async ({ page }) => {
    const input = await photoPdf();
    await open(page, "/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: input });
    await page.getByRole("radio", { name: "Strong" }).click();
    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText(/% smaller$/)).toBeVisible();
    await expect(page.getByText("2 of 3 images re-compressed.")).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download compressed PDF" }).click()]);
    expect(download.suggestedFilename()).toBe("scan-compressed.pdf");
    const out = readFileSync((await download.path())!);
    expect(out.length).toBeLessThan(input.length * 0.6);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(3);
  });

  test("says so when a text-only PDF can't be made smaller (Arabic)", async ({ page }) => {
    const doc = await PDFDocument.create();
    doc.addPage().drawText("Plain text");
    await open(page, "/ar/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles({ name: "text.pdf", mimeType: "application/pdf", buffer: Buffer.from(await doc.save({ useObjectStreams: true })) });
    await page.getByRole("button", { name: "ضغط الملف" }).click();
    await expect(page.getByText("هذا الملف صغير أصلًا", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "تنزيل الملف المضغوط" })).toHaveCount(0);
  });
});

test.describe("Compress Image", () => {
  test("hits a target size, keeps transparency, and keeps an already-optimised PNG", async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, "/tools/compress-image");
    await page.getByRole("radio", { name: "By target size" }).click();
    await page.getByRole("button", { name: "50 KB" }).click();
    await page.locator('input[type="file"]').setInputFiles([fixture("noisy-photo.jpg"), fixture("noisy-alpha.png")]);
    const photoRow = page.locator("li", { hasText: "noisy-photo.jpg" });
    await expect(photoRow.getByText(/% smaller$/)).toBeVisible({ timeout: 30_000 });
    const [jpg] = await Promise.all([page.waitForEvent("download"), photoRow.getByRole("button", { name: "Download" }).click()]);
    expect(jpg.suggestedFilename()).toBe("noisy-photo-compressed.jpg");
    expect(readFileSync((await jpg.path())!).length).toBeLessThanOrEqual(50_000);

    // A transparent PNG with a size target becomes WebP (keeps transparency) — or PNG where WebP can't be written
    const pngRow = page.locator("li", { hasText: "noisy-alpha.png" });
    await expect(pngRow.getByRole("button", { name: "Download" })).toBeVisible({ timeout: 30_000 });
    const [png] = await Promise.all([page.waitForEvent("download"), pngRow.getByRole("button", { name: "Download" }).click()]);
    expect(png.suggestedFilename()).toMatch(/^noisy-alpha-compressed\.(webp|png)$/);

    // Back to quality mode: a tiny, already-optimised PNG that wouldn't shrink is kept as-is
    await page.getByRole("radio", { name: "By quality" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixture("logo-transparent.png"));
    await expect(page.locator("li", { hasText: "logo-transparent.png" }).getByText("Already optimised: original kept")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Download all (.zip)" })).toBeEnabled();
  });

  test("Arabic labels and target size in Arabic digits", async ({ page }) => {
    await open(page, "/ar/tools/compress-image");
    await expect(page.locator("h1")).toHaveText("ضغط الصور");
    await page.getByRole("radio", { name: "حسب الحجم المطلوب" }).click();
    await page.getByLabel("الحجم المطلوب", { exact: true }).fill("٤٠ ك.ب");
    await page.locator('input[type="file"]').setInputFiles(fixture("noisy-photo.jpg"));
    await expect(page.getByText(/أصغر بنسبة/).first()).toBeVisible({ timeout: 30_000 });
    const [d] = await Promise.all([page.waitForEvent("download"), page.locator("li").getByRole("button", { name: "تنزيل" }).click()]);
    expect(readFileSync((await d.path())!).length).toBeLessThanOrEqual(40_000);
  });
});

test.describe("PDF to JPG", () => {
  test("renders chosen pages to images and refuses locked PDFs", async ({ page }) => {
    await open(page, "/tools/pdf-to-jpg");
    await page.locator('input[type="file"]').setInputFiles(fixture("locked.pdf"));
    await expect(page.getByText("This PDF is password-protected. Unlock it first, then choose it again.")).toBeVisible();
    await page.getByRole("button", { name: "Choose another file" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByText("3 pages", { exact: false })).toBeVisible();
    await expect(page.getByText("This creates 3 images.")).toBeVisible();
    await page.getByRole("radio", { name: "Choose pages" }).check({ force: true });
    await page.getByLabel("Page numbers").fill("2-3");
    await expect(page.getByText("This creates 2 images.")).toBeVisible();
    await page.getByRole("radio", { name: "PNG (sharpest)" }).check({ force: true });
    await page.getByRole("button", { name: "Convert to images" }).click();
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Page 2" })).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download/ }).nth(1).click()]);
    expect(download.suggestedFilename()).toMatch(/^plain-3-pages-page-[23]\.png$/);
    const bytes = readFileSync((await download.path())!);
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    // Changing settings marks results as stale.
    await page.getByRole("radio", { name: "JPG (smaller)" }).check({ force: true });
    await expect(page.getByText("Settings changed. Convert again to update the images.")).toBeVisible();
  });
});
