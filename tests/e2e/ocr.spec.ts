import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

test.describe("Image to Text (OCR)", () => {
  test.setTimeout(120_000);

  test("reads English and Arabic from an image and a scanned PDF", async ({ page }) => {
    page.on("pageerror", (e) => {
      throw e;
    });
    await page.goto("/tools/image-to-text", { waitUntil: "networkidle" });
    await page.getByLabel("Arabic").check();
    await page.locator('input[type="file"]').setInputFiles([fixture("ocr-sample.png"), fixture("scanned.pdf")]);
    await page.getByLabel(/searchable PDF/).check();
    await page.getByRole("button", { name: "Extract text" }).click();
    const box = page.getByRole("textbox", { name: "Extracted text" });
    await expect(box).toBeVisible({ timeout: 90_000 });
    const text = await box.inputValue();
    expect(text).toContain("— Page 2 —");
    expect(text).toContain("Invoice 0457");
    expect(text).toContain("1,250.500 OMR");
    expect(text).toContain("فاتورة ضريبية");
    expect(text).toContain("المبلغ المستحق");
    await expect(page.getByText(/2 pages · estimated accuracy \d+%/)).toBeVisible();

    const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download searchable PDF" }).click()]);
    expect(pdf.suggestedFilename()).toBe("extracted-text-searchable.pdf");
    expect((await PDFDocument.load(readFileSync((await pdf.path())!))).getPageCount()).toBe(2);
    const [word] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Word" }).click()]);
    expect(readFileSync((await word.path())!).subarray(0, 2).toString()).toBe("PK");

    await page.getByLabel("English").uncheck();
    await expect(page.getByText("Settings changed. Extract again to update the result.")).toBeVisible();
    await page.getByLabel("Arabic").uncheck();
    await expect(page.getByText("Choose at least one language.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Extract text" })).toBeDisabled();
  });
});
