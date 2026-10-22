import { expect, test } from "@playwright/test";

test.describe("Arabic site", () => {
  test("/ar pages render right-to-left in Arabic and are indexable", async ({ page, request }) => {
    const res = await page.goto("/ar/tools");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["x-robots-tag"]).toBeUndefined();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
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

  test("Arabic tool pages, directory and search work", async ({ page }) => {
    await page.goto("/ar/tools/word-counter");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("عدّاد الكلمات");
    await page.getByRole("textbox", { name: "النص المراد تحليله" }).fill("القراءة غذاء العقل، والكتابة مرآة الفكر.");
    await expect(page.locator("dt", { hasText: /^الكلمات$/ }).locator("xpath=following-sibling::dd")).toHaveText("6");
    await page.goto("/ar/tools");
    await page.getByRole("searchbox", { name: "البحث في كل الأدوات" }).fill("كلمات");
    await expect(page.getByRole("heading", { name: "عدّاد الكلمات" })).toBeVisible();
    // English names stay searchable on the Arabic site
    await page.getByRole("searchbox", { name: "البحث في كل الأدوات" }).fill("word counter");
    await expect(page.getByRole("heading", { name: "عدّاد الكلمات" })).toBeVisible();
  });

  test("every Arabic tool page renders without errors", async ({ page }) => {
    const slugs = ["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines", "percentage-calculator", "vat-calculator", "discount-calculator", "json-formatter", "url-encoder-decoder", "base64-encoder-decoder", "uuid-generator", "password-generator", "qr-code-generator", "date-difference", "color-converter", "ai-text-summarizer", "merge-pdf", "split-pdf", "jpg-to-pdf", "compress-pdf", "compress-image", "amount-in-words", "cheque-printer"];
    for (const slug of slugs) {
      const errors: string[] = [];
      const h = (m: import("@playwright/test").ConsoleMessage) => (m.type() === "error" || m.type() === "warning") && errors.push(m.text());
      page.on("console", h);
      await page.goto(`/ar/tools/${slug}`);
      await expect(page.getByRole("heading", { name: "طريقة الاستخدام" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "أدوات ذات صلة" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      page.off("console", h);
      expect(errors, slug).toEqual([]);
    }
  });

  test("Arabic calculators show Arabic sentences and errors", async ({ page }) => {
    await page.goto("/ar/tools/percentage-calculator");
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "النسبة (%)" }).fill("15");
    await page.getByRole("textbox", { name: "الرقم" }).fill("200");
    await expect(page.getByText("15% من 200 تساوي 30")).toBeVisible();
    await page.getByRole("textbox", { name: "الرقم" }).fill("abc");
    await expect(page.getByRole("alert").filter({ hasText: "القيمة الثانية ليست رقمًا صحيحًا." })).toBeVisible();
    await page.goto("/ar/tools/date-difference");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("تاريخ البداية").fill("2020-01-15");
    await page.getByLabel("تاريخ النهاية").fill("2024-03-20");
    await expect(page.getByRole("region", { name: "الفرق" }).getByText("4 سنوات، شهران، 5 أيام")).toBeVisible();
  });

  test("Arabic developer tools translate errors and keep code left-to-right", async ({ page }) => {
    await page.goto("/ar/tools/json-formatter");
    await page.waitForLoadState("networkidle");
    const input = page.getByRole("textbox", { name: "مدخل JSON" });
    await expect(input).toHaveAttribute("dir", "ltr");
    await input.fill('{"a": 1,}');
    await expect(page.getByText("JSON غير صالح — السطر 1، العمود 9")).toBeVisible();
    await expect(page.getByText("فاصلة زائدة — احذف الفاصلة قبل القوس المعقوف الختامي }")).toBeVisible();
    await page.goto("/ar/tools/base64-encoder-decoder");
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "النص المراد ترميزه" }).fill("مرحبا");
    await expect(page.getByRole("textbox", { name: "النتيجة" })).toHaveValue("2YXYsdit2KjYpw==");
  });

  test("Arabic password, QR and colour tools", async ({ page }) => {
    await page.goto("/ar/tools/password-generator");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/^القوة: /)).toBeVisible();
    await page.goto("/ar/tools/qr-code-generator");
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "النص أو الرابط" }).fill("https://tools.artifysols.com/ar");
    await expect(page.getByRole("img", { name: "رمز QR المُنشأ" })).toBeVisible();
    await page.goto("/ar/tools/color-converter");
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "قيمة اللون" }).fill("#12");
    await expect(page.getByText("تعذّرت قراءة هذا اللون", { exact: false }).first()).toBeVisible();
  });

  test("English pages stay ltr and link to their Arabic version", async ({ page }) => {
    const res = await page.goto("/tools/word-counter");
    expect(res?.headers()["x-robots-tag"]).toBeUndefined();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://tools.artifysols.com/tools/word-counter");
    await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute("href", "https://tools.artifysols.com/ar/tools/word-counter");
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", "https://tools.artifysols.com/tools/word-counter");
    await page.getByRole("link", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/tools\/word-counter$/);
    await expect(page.locator("h1")).toHaveText("عدّاد الكلمات");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://tools.artifysols.com/ar/tools/word-counter");
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://tools.artifysols.com/tools/word-counter");
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

  test("sitemap lists both languages with hreflang links", async ({ request }) => {
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain("<loc>https://tools.artifysols.com/ar/tools/word-counter</loc>");
    expect(sm).toContain("<loc>https://tools.artifysols.com/ar</loc>");
    expect(sm).toContain('hreflang="ar" href="https://tools.artifysols.com/ar/tools/word-counter"');
    expect(sm).not.toContain("ai-text-summarizer");
  });
});
