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
