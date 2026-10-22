import { expect, test } from "@playwright/test";

test.describe("Arabic routing (unpublished)", () => {
  test("/ar pages render right-to-left in Arabic and are noindex", async ({ page, request }) => {
    const res = await page.goto("/ar/tools");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // internal links keep the visitor in Arabic
    const toolLink = page.locator('main a[href^="/ar/tools/"]').first();
    await expect(toolLink).toBeVisible();
    // the switcher leads back to the same page in English
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/tools$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    const home = await request.get("/ar");
    expect(home.status()).toBe(200);
  });

  test("site shell and legal pages are in Arabic on /ar", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("h1")).toContainText("الأداة المناسبة");
    await expect(page.locator("footer")).toContainText("الخصوصية");
    await expect(page).toHaveTitle(/أدوات قوية/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar$/);
    await page.goto("/ar/privacy");
    await expect(page.locator("h1")).toHaveText("سياسة الخصوصية");
    await expect(page.getByRole("navigation", { name: /مسار التنقل|breadcrumb/i })).toContainText("الرئيسية");
  });

  test("English pages are unchanged: ltr, no switcher, no robots header", async ({ page }) => {
    const res = await page.goto("/tools/word-counter");
    expect(res?.headers()["x-robots-tag"]).toBeUndefined();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("link", { name: "العربية" })).toHaveCount(0);
  });

  test("/en URLs redirect to the unprefixed English URL", async ({ request }) => {
    const res = await request.get("/en/tools", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/\/tools$/);
  });

  test("unknown Arabic and other-language paths return 404", async ({ request }) => {
    expect((await request.get("/ar/does-not-exist")).status()).toBe(404);
    expect((await request.get("/fr/tools")).status()).toBe(404);
  });

  test("Arabic is kept out of the sitemap", async ({ request }) => {
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/ar");
  });
});
