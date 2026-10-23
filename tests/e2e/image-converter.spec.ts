import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Image Converter", () => {
  test("HEIC and transparent WebP to JPG, then everything to PNG", async ({ page }) => {
    await open(page, "/tools/image-converter");
    await page.locator('input[type="file"]').setInputFiles([fixture("photo.heic"), fixture("logo-transparent.webp")]);
    await expect(page.getByText(/HEIC → JPG · .* · 640×480/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/WEBP → JPG · .* · 300×200/)).toBeVisible();

    const [one] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download/ }).first().click()]);
    expect(one.suggestedFilename()).toBe("photo.jpg");
    const jpg = readFileSync((await one.path())!);
    expect([jpg[0], jpg[1]]).toEqual([0xff, 0xd8]);

    await page.getByRole("radio", { name: "PNG" }).check();
    await expect(page.getByText(/WEBP → PNG/)).toBeVisible();
    await expect(page.getByText(/HEIC → PNG/)).toBeVisible({ timeout: 30_000 });
    const [zip] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download all/ }).click()]);
    expect(zip.suggestedFilename()).toBe("converted-images.zip");

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
  });

  test("Arabic page converts a PNG to WebP", async ({ page }) => {
    await open(page, "/ar/tools/image-converter");
    await page.getByRole("radio", { name: "WebP" }).check();
    await page.locator('input[type="file"]').setInputFiles(fixture("logo-transparent.webp"));
    await expect(page.getByText(/WEBP ← WebP/)).toBeVisible();
  });
});
