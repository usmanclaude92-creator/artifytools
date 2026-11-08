import { expect, test } from "@playwright/test";

test.describe("Guides", () => {
  test("the index lists the guides and each opens with its tools", async ({ page }) => {
    await page.goto("/guides");
    await expect(page.getByRole("heading", { level: 1, name: "Guides" })).toBeVisible();
    await page.getByRole("link", { name: /How to merge PDF files/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("merge PDF files");
    await expect(page.getByRole("link", { name: "Merge PDF", exact: true })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    expect(ld.some((t) => t.includes('"@type":"Article"'))).toBe(true);
  });

  test("a tool page links to its guides", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await expect(page.getByRole("heading", { name: "Guides", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /How to compress a PDF/ }).first()).toBeVisible();
  });

  test("the Arabic URL shows the guide but is kept out of search", async ({ page }) => {
    await page.goto("/ar/guides/how-to-merge-pdf-files");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("merge PDF files");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://tools.artifysols.com/guides/how-to-merge-pdf-files");
  });

  test("ads.txt authorizes Google, and the AdSense verification tag is on the page", async ({ request, page }) => {
    const res = await request.get("/ads.txt");
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("google.com, pub-5321065144371084, DIRECT, f08c47fec0942fa0\n");
    await page.goto("/");
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute("content", "ca-pub-5321065144371084");
  });

  test("an unknown guide is a 404", async ({ request }) => {
    expect((await request.get("/guides/nope")).status()).toBe(404);
  });
});
