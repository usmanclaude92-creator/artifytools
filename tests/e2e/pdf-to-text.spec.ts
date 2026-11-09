import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url = "/tools/pdf-to-text") {
  page.on("pageerror", (e) => { throw e; });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("PDF to Text", () => {
  test("extracts English and Arabic text and downloads a .txt file", async ({ page }) => {
    await open(page);
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText(/· 2 pages/)).toBeVisible();
    await page.getByRole("button", { name: "Extract text" }).click();
    const box = page.getByRole("textbox", { name: "Extracted text" });
    await expect(box).toHaveValue(/Quarterly Report/);
    await expect(box).toHaveValue(/ملخص باللغة العربية/);
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download .txt" }).click()]);
    expect(d.suggestedFilename()).toBe("report-en-ar.txt");
    expect(readFileSync((await d.path())!, "utf8")).toContain("Quarterly Report");
  });

  test("page markers and layout changes update the text", async ({ page }) => {
    await open(page);
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByRole("button", { name: "Extract text" }).click();
    const box = page.getByRole("textbox", { name: "Extracted text" });
    await expect(box).not.toHaveValue(/— Page 2 —/);
    await page.getByLabel("Show where each page starts").check();
    await expect(box).toHaveValue(/— Page 2 —/);
    await page.getByRole("radio", { name: "Same lines as the PDF" }).check({ force: true });
    await expect(page.getByText("Options changed. Extract again to update the text.")).toBeVisible();
  });

  test("a scanned PDF is read with OCR", async ({ page }) => {
    test.setTimeout(120_000);
    await open(page);
    await page.locator('input[type="file"]').setInputFiles(fixture("scanned.pdf"));
    await expect(page.getByText(/page/).first()).toBeVisible();
    await page.getByRole("button", { name: "Extract text" }).click();
    await expect(page.getByText(/scanned pages? (was|were) read with OCR/)).toBeVisible({ timeout: 100_000 });
    await expect(page.getByRole("textbox", { name: "Extracted text" })).not.toHaveValue("");
  });

  test("a scanned PDF without OCR says so", async ({ page }) => {
    await open(page);
    await page.locator('input[type="file"]').setInputFiles(fixture("scanned.pdf"));
    await page.getByLabel("Read scanned pages with OCR (pages that are pictures)").uncheck();
    await page.getByRole("button", { name: "Extract text" }).click();
    await expect(page.getByText(/No text was found/)).toBeVisible();
    await expect(page.getByText(/Turn on OCR/)).toBeVisible();
  });

  test("a password-protected PDF points to Unlock PDF", async ({ page }) => {
    await open(page);
    await page.locator('input[type="file"]').setInputFiles(fixture("locked.pdf"));
    const msg = page.getByText(/This PDF is password-protected\./).first();
    await expect(msg).toBeVisible();
    await expect(msg.getByRole("link", { name: "Unlock PDF" })).toBeVisible();
  });

  test("the Arabic page works", async ({ page }) => {
    await open(page, "/ar/tools/pdf-to-text");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("تحويل PDF إلى نص");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByRole("button", { name: "استخراج النص" }).click();
    await expect(page.getByRole("textbox", { name: "النص المستخرج" })).toHaveValue(/ملخص باللغة العربية/);
  });
});
