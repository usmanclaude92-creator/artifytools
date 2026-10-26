import { expect, test, type Page } from "@playwright/test";

// Wait for hydration so fills aren't lost to a pre-hydration race.
async function open(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
}

test("adds and subtracts days, months and years", async ({ page }) => {
  await open(page, "/tools/date-difference");
  await page.getByLabel("Add or subtract").check();
  await page.getByLabel("Starting date").fill("2024-01-31");
  await page.getByLabel("Months").fill("1");
  await expect(page.getByText("2024-02-29", { exact: true })).toBeVisible();
  await expect(page.getByText("Thursday", { exact: true }).first()).toBeVisible();

  await page.getByLabel("Subtract", { exact: true }).check();
  await page.getByLabel("Months").fill("");
  await page.getByLabel("Days").fill("90");
  await expect(page.getByText("2023-11-02", { exact: true })).toBeVisible();
  await expect(page.getByText("90 days before the start date")).toBeVisible();

  await page.getByLabel("Years").fill("1.5");
  await expect(page.getByRole("alert").filter({ hasText: "whole numbers" })).toBeVisible();
});

test("the difference calculator still works in the first mode", async ({ page }) => {
  await open(page, "/tools/date-difference");
  await page.getByLabel("Start date", { exact: true }).fill("2024-02-28");
  await page.getByLabel("End date", { exact: true }).fill("2024-03-01");
  await expect(page.getByText("2 days", { exact: true }).first()).toBeVisible();
});

test("Arabic page adds days with Arabic labels", async ({ page }) => {
  await open(page, "/ar/tools/date-difference");
  await page.getByLabel("إضافة أو طرح").check();
  await page.getByLabel("تاريخ البداية").fill("2026-10-26");
  await page.getByLabel("الأيام").fill("7");
  await expect(page.getByText("2026-11-02", { exact: true })).toBeVisible();
  await expect(page.getByText("الاثنين", { exact: true }).first()).toBeVisible();
});
