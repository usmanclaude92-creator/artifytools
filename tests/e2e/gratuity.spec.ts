import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("End of Service Gratuity Calculator", () => {
  test("Saudi resignation, UAE and Oman results", async ({ page }) => {
    await open(page, "/tools/end-of-service-calculator");
    await page.getByText("Saudi Arabia", { exact: true }).click();
    await page.getByLabel("Start date").fill("2016-01-01");
    await page.getByLabel("Last working day").fill("2023-12-31");
    await page.getByLabel("Basic monthly salary").fill("8000");
    await page.getByLabel("Fixed monthly allowances").fill("2,000");
    const result = page.getByRole("region", { name: "End-of-service gratuity" });
    await expect(result).toContainText("55,000.00 SAR"); // 5 × 5,000 + 3 × 10,000
    await page.getByLabel("How the job ended").selectOption("resigned");
    await expect(result).toContainText("36,666.67 SAR");
    await expect(result).toContainText("Resignation share (two thirds)");

    await page.getByText("UAE", { exact: true }).click();
    await expect(page.getByLabel("Fixed monthly allowances")).toHaveCount(0);
    await expect(result).toContainText("52,000.00 AED"); // 8000/30 × 21 × 5 = 28,000 + 3 × 8,000

    await page.getByText("Oman", { exact: true }).click();
    await page.getByLabel("Start date").fill("2021-08-01");
    await page.getByLabel("Last working day").fill("2025-07-31");
    await page.getByLabel("Basic monthly salary").fill("500");
    await expect(result).toContainText("1,500.000 OMR");
    await expect(result).toContainText("Up to 31 Jul 2023: first 3 years");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
  });

  test("Arabic page and validation", async ({ page }) => {
    await open(page, "/ar/tools/end-of-service-calculator");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("مكافأة نهاية الخدمة");
    await page.getByLabel("تاريخ بداية العمل").fill("2024-01-01");
    await page.getByLabel("آخر يوم عمل").fill("2023-01-01");
    await page.getByLabel("الراتب الأساسي الشهري").fill("5000");
    await expect(page.getByText("يجب أن يكون آخر يوم عمل في تاريخ البداية أو بعده.")).toBeVisible();
    await page.getByLabel("آخر يوم عمل").fill("2024-12-31");
    await page.getByLabel("سبب انتهاء العلاقة").selectOption("resigned");
    await expect(page.getByText("لا يستحق العامل المستقيل مكافأة نهاية الخدمة")).toBeVisible();
  });
});
