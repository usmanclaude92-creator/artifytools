import { expect, test } from "@playwright/test";

test.describe("Guides", () => {
  test("the index lists the guides and each opens with its tools", async ({ page }) => {
    await page.goto("/guides");
    await expect(page.getByRole("heading", { level: 1, name: "Guides" })).toBeVisible();
    await page.getByRole("link", { name: /How to merge PDF files/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("merge PDF files");
    await expect(page.getByRole("link", { name: "Merge PDF", exact: true }).first()).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    expect(ld.some((t) => t.includes('"@type":"Article"'))).toBe(true);
  });

  test("a tool page links to its guides", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await expect(page.getByRole("heading", { name: "Guides", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /How to compress a PDF/ }).first()).toBeVisible();
  });

  test("Arabic guides are written in Arabic and indexable; English guides do not exist under Arabic URLs", async ({ page, request }) => {
    await page.goto("/ar/guides/dmj-pdf");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("دمج ملفات PDF");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://tools.artifysols.com/ar/guides/dmj-pdf");
    expect((await request.get("/ar/guides/how-to-merge-pdf-files")).status()).toBe(404);
    expect((await request.get("/guides/dmj-pdf")).status()).toBe(404);
    await page.goto("/ar/guides");
    await expect(page.getByRole("link", { name: /ضغط ملف PDF/ })).toBeVisible();
  });

  test("a guide opens with a short answer, in-text links to tools and a related-guides list", async ({ page }) => {
    await page.goto("/guides/how-to-extract-text-from-a-pdf");
    await expect(page.getByText("Short answer")).toBeVisible();
    await expect(page.locator("article").getByRole("link", { name: "PDF to Text" }).first()).toHaveAttribute("href", "/tools/pdf-to-text");
    await expect(page.getByRole("heading", { name: "More guides" })).toBeVisible();
  });

  test("tool pages show tips and the home page lists guides", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await expect(page.getByRole("heading", { name: "Tips and common problems: Compress PDF" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Guides", exact: true })).toBeVisible();
  });

  test("llms.txt and robots.txt serve the site map for AI crawlers", async ({ request }) => {
    const llms = await request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    const text = await llms.text();
    expect(text).toContain("/tools/pdf-to-text");
    expect(text).toContain("/guides/how-to-merge-pdf-files");
    expect(text).toContain("/ar/guides/dmj-pdf");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/GPTBot/);
    expect(robots).toMatch(/ClaudeBot/);
  });

  test("ads.txt authorizes Google, and the AdSense verification tag is on the page", async ({ request, page }) => {
    const res = await request.get("/ads.txt");
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("google.com, pub-5321065144371084, DIRECT, f08c47fec0942fa0\n");
    await page.goto("/");
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute("content", "ca-pub-5321065144371084");
  });

  test("the contact page shows a real email address, and unfinished pages stay out of search", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "usmanclaude92@gmail.com" }).first()).toHaveAttribute("href", "mailto:usmanclaude92@gmail.com");
    for (const path of ["/apps", "/ai-tools"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("an unknown guide is a 404", async ({ request }) => {
    expect((await request.get("/guides/nope")).status()).toBe(404);
  });
});
