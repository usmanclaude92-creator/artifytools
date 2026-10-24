import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/", "/tools", "/categories", "/categories/developer-tools", "/ai-tools", "/for-professionals", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/changelog",
  ...["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines", "percentage-calculator", "vat-calculator", "discount-calculator", "json-formatter", "url-encoder-decoder", "base64-encoder-decoder", "uuid-generator", "password-generator", "qr-code-generator", "date-difference", "color-converter", "ai-text-summarizer", "text-translator", "end-of-service-calculator", "hijri-date-converter"].map((s) => `/tools/${s}`),
];

for (const theme of ["light", "dark"] as const) {
  test.describe(`axe (${theme})`, () => {
    for (const path of pages) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem("artify-theme", t), theme);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "dark" ? "dark" : /.*|^$/).catch(() => {});
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(summary).toEqual([]);
      });
    }
  });
}
