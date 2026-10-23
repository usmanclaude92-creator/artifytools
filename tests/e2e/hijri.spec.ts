import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Hijri Date Converter", () => {
  test("converts both ways", async ({ page }) => {
    await open(page, "/tools/hijri-date-converter");
    await page.getByLabel("Gregorian date").fill("2026-10-23");
    const result = page.getByRole("region", { name: "Result" });
    await expect(result).toContainText("Friday, 12 Jumada al-Ula 1448 AH");
    await expect(result).toContainText("12/05/1448");
    await page.getByRole("radio", { name: "Hijri → Gregorian" }).check();
    await page.getByLabel("Day").selectOption("1");
    await page.getByLabel("Month").selectOption("9");
    await page.getByLabel("Year (AH)").fill("1447");
    await expect(result).toContainText("Wednesday, 18 February 2026");
    await expect(result).toContainText("ISO 2026-02-18");
  });

  test("Arabic page", async ({ page }) => {
    await open(page, "/ar/tools/hijri-date-converter");
    await page.getByRole("radio", { name: "هجري ← ميلادي" }).check();
    await page.getByLabel("الشهر").selectOption("10");
    await page.getByLabel("السنة (هـ)").fill("1446");
    await expect(page.getByRole("region", { name: "النتيجة" })).toContainText("الأحد، 30 مارس 2025 م");
    await page.getByLabel("السنة (هـ)").fill("1200");
    await expect(page.getByText("أدخل سنة هجرية بين 1343 و1500.")).toBeVisible();
  });
});
