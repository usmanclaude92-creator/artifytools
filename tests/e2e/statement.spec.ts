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
    await expect(page.getByText("no selectable text")).toBeVisible();
  });
});
