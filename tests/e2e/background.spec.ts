import path from "node:path";
import { expect, test } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

test.describe("Remove Background", () => {
  test("explains the one-time model download and reports when it can't be fetched", async ({ page }) => {
    // Don't download the 88 MB model in tests: simulate being offline for it.
    await page.route("https://huggingface.co/**", (r) => r.abort());
    await page.goto("/tools/remove-background", { waitUntil: "networkidle" });
    await expect(page.getByText(/downloads the AI model \(88 MB\)/)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(fixture("photo-upright.jpg"));
    await expect(page.getByText("The AI model couldn't be loaded. Check your connection and try again.")).toBeVisible({ timeout: 30_000 });
  });

  test("Arabic page renders", async ({ page }) => {
    await page.goto("/ar/tools/remove-background");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("إزالة خلفية الصورة");
    await expect(page.getByText(/88 ميغابايت/).first()).toBeVisible();
  });
});
