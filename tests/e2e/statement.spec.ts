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

  test("Manual Selection: Add table marks the transactions table and its columns in one tap", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await page.getByRole("button", { name: "Add table" }).first().click();
    await expect(page.getByText("Table 1 · page 1")).toBeVisible();
    // Date, Description, Debit, Credit, Balance were found from the headings.
    await expect(page.getByLabel(/^Column \d$/)).toHaveCount(5);
    await expect(page.getByLabel("Column 1")).toHaveValue("date");
    await page.getByRole("button", { name: "Add table" }).nth(1).click();
    await page.getByRole("button", { name: "Convert selected tables" }).click();
    const result = page.getByRole("region", { name: "Transactions" });
    await expect(result).toContainText("All 19 balances match");
    await expect(result.getByRole("cell", { name: /CARREFOUR.*4421/ })).toBeVisible();
  });

  test("Manual Selection: the round handle moves a table", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await page.getByRole("button", { name: "Add table" }).first().click();
    const handle = page.getByRole("button", { name: "Move table" }).first();
    await handle.scrollIntoViewIfNeeded();
    const before = (await handle.boundingBox())!;
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2 + 60, { steps: 6 });
    await page.mouse.up();
    const after = (await handle.boundingBox())!;
    expect(after.y).toBeGreaterThan(before.y + 30);
  });

  test("Manual Selection: Add table works by tap on a phone @mobile", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await page.getByRole("button", { name: "Add table" }).first().tap();
    await expect(page.getByText("Table 1 · page 1")).toBeVisible();
    await page.getByRole("button", { name: "Convert selected tables" }).tap();
    await expect(page.getByRole("region", { name: "Transactions" })).toContainText("transactions");
  });

  test("Manual Selection: corner dots resize a table", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    const overlay = page.getByTestId("overlay-1");
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await overlay.scrollIntoViewIfNeeded();
    const box = (await overlay.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.15);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 6 });
    await page.mouse.up();
    const handle = page.locator('[data-handle="se"]').first();
    const before = (await handle.boundingBox())!;
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.8, { steps: 6 });
    await page.mouse.up();
    const after = (await handle.boundingBox())!;
    expect(after.x).toBeGreaterThan(before.x + 50);
    expect(after.y).toBeGreaterThan(before.y + 50);
  });

  test("Manual Selection: press, hold and drag draws a table by touch @mobile", async ({ page }) => {
    await open(page, "/tools/bank-statement-converter");
    await page.locator('input[type="file"]').setInputFiles(fixture("statement-en.pdf"));
    await page.getByRole("radio", { name: /Manual Selection/ }).check();
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    const overlay = page.getByTestId("overlay-1");
    await overlay.scrollIntoViewIfNeeded();
    const box = (await overlay.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const pt = (x: number, y: number) => [{ x, y, id: 1 }];
    const sx = box.x + box.width * 0.1, sy = box.y + box.height * 0.2;
    const ex = box.x + box.width * 0.9;
    // A quick swipe over the page does not draw anything.
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(sx, sy) });
    for (let i = 1; i <= 4; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(sx, sy + i * 30) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByText(/Table 1 · page 1/)).toHaveCount(0);
    // Resting the finger first, then dragging, does.
    const box2 = (await overlay.boundingBox())!;
    const y0 = box2.y + box2.height * 0.2, y1 = box2.y + box2.height * 0.6;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(sx, y0) });
    await page.waitForTimeout(450);
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(sx + ((ex - sx) * i) / 10, y0 + ((y1 - y0) * i) / 10) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByText("Table 1 · page 1")).toBeVisible();
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
    // No balance is printed per row, so each one is calculated from the summary's previous balance and matched with the current outstanding.
    await expect(result).toContainText("Calculated balance 3,949.19 matches the statement");
    await expect(result).toContainText("Opening balance: 1,000.00");
    await expect(result.getByRole("cell", { name: "3,949.19", exact: true }).first()).toBeVisible();
    // Typing a different closing balance shows the difference.
    await page.getByLabel("Closing balance on the statement").fill("4,000.00");
    await expect(result).toContainText("difference -50.81");
    await page.getByLabel("Closing balance on the statement").fill("");
    await expect(result).toContainText("matches the statement");
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
