import { readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Bank Statement Converter", () => {
  test("Manual Selection: mark a table, detect its columns and convert only that", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await expect(page.getByRole("region", { name: "Transactions" })).toContainText("All 19 balances match");
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    // Converting is separate: nothing is read from the marked tables until Convert.
    await expect(page.getByRole("region", { name: "Transactions" })).toHaveCount(0);
    const overlay = page.getByTestId("overlay-1");
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await overlay.scrollIntoViewIfNeeded();
    const box = (await overlay.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.1);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.9, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByText("Table 1 · page 1")).toBeVisible();
    await page.getByRole("button", { name: "Detect columns" }).click();
    await expect(page.getByLabel("Column 3")).toBeVisible();
    await page.getByRole("button", { name: "Convert selected tables" }).click();
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result.getByRole("cell", { name: /CARREFOUR.*4421/ })).toBeVisible();
    await expect(result).toContainText("Money in");
    // Only page 1 was marked, so page 2's transactions are not included.
    const manualCount = Number((await result.getByText(/^\d+ transactions$/).first().textContent())!.replace(/\D/g, ""));
    expect(manualCount).toBeGreaterThan(0);
    expect(manualCount).toBeLessThan(19);
    const [xlsx] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Excel" }).click()]);
    expect(xlsx.suggestedFilename()).toBe("statement-en.xlsx");
  });

  test("English two-page statement: totals, balance check and downloads", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result).toContainText("All 19 balances match");
    await expect(result).toContainText("28,341.84"); // money in
    await expect(result).toContainText("Opening balance: 3,250.00");
    await expect(result.getByRole("cell", { name: /CARREFOUR.*4421/ })).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);

    const [xlsx] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Excel" }).click()]);
    expect(xlsx.suggestedFilename()).toBe("statement-en.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync((await xlsx.path())!).buffer as ArrayBuffer);
    const ws = wb.getWorksheet("Transactions")!;
    expect(ws.getRow(1).values).toEqual([undefined, "Date", "Description", "Debit", "Credit", "Balance", "Balance check"]);
    const r3 = ws.getRow(3);
    expect(r3.getCell(1).value).toEqual(new Date("2026-10-02T00:00:00Z"));
    expect(r3.getCell(3).value).toBe(412.75);
    expect(r3.getCell(6).value).toBe("✓");
    expect(ws.rowCount).toBe(21); // header + 19 + total

    const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download CSV" }).click()]);
    const text = readFileSync((await csv.path())!, "utf8");
    expect(text.split("\r\n")[1]).toBe("2026-10-01,Salary October ACME TRADING LLC,,18500.00,21750.00");
  });

  test("Automatic Conversion reads a scanned statement with OCR", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en-scan.pdf"));
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result).toContainText("read with OCR", { timeout: 120_000 });
    await expect(result).toContainText("All 19 balances match");
    await expect(result.getByRole("cell", { name: /CARREFOUR.*4421/ })).toBeVisible();
  });

  test("Card statement: two-line headings, D/C letters, a picture-only last page", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-card.pdf"));
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result).toContainText("9 transactions");
    // D is money out (debit) and C is money in (credit), whatever the sign printed next to the amount.
    await expect(result.getByText("Money in (credits)").locator("xpath=following-sibling::*[1]")).toHaveText("27,200.00");
    await expect(result.getByText("Money out (debits)").locator("xpath=following-sibling::*[1]")).toHaveText("30,149.19");
    await expect(result.getByRole("cell", { name: "BLUE ORCHARD STORE CITYVILLE PK" })).toBeVisible();
    await expect(result.getByRole("cell", { name: /MISSED/ })).toHaveCount(0);
    // Page 3 is only a picture: it is reported, not OCR'd into extra rows.
    await expect(result).toContainText("Page 3 had no text");
    await expect(result).not.toContainText("read with OCR");
  });

  test("US statement: month-first dates, newest first", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-us.pdf"));
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result).toContainText("All 7 balances match");
    await expect(result).toContainText("newest transactions first");
    await expect(page.getByLabel("Date format")).toHaveValue("auto");
    await expect(result.getByRole("cell", { name: "2026-09-28" })).toBeVisible();
  });

  test("Arabic statement on the Arabic page", async ({ page }) => {
    await open(page, "/ar/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-ar.pdf"));
    const result = page.getByRole("region", { name: "العمليات" });
    await expect(result).toContainText("كل الأرصدة مطابقة (6)");
    await expect(result.getByRole("cell", { name: "راتب شهر سبتمبر" })).toBeVisible();
    await expect(result).toContainText("الرصيد الافتتاحي: 5,400.00");
    // The wide table scrolls inside its box; the page itself must not scroll sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("PDFs that aren't statements explain what to do", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText("No transactions were found")).toBeVisible();
    await page.getByRole("button", { name: "Choose another file" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    // Blank pages go through OCR first, which takes a moment, and still find nothing.
    await expect(page.getByText("no selectable text")).toBeVisible({ timeout: 60_000 });
  });
});
