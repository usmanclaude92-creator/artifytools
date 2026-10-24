import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

// Wait for hydration so interactions aren't lost to a pre-hydration race.
async function open(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
}

test("Translate PDF is indexed, listed in the sitemap, and needs no key", async ({ page, request }) => {
  await page.goto("/tools/translate-pdf");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await expect(page.getByText("translated on this device and never uploaded")).toBeVisible();
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("https://tools.artifysols.com/tools/translate-pdf");
  expect(sm).toContain("https://tools.artifysols.com/ar/tools/translate-pdf");
});

test("reads an English PDF, suggests English to Arabic, and reports a failed model download", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => r.method() === "POST" && posts.push(r.url()));
  await page.route("https://huggingface.co/**", (r) => r.abort());
  await open(page, "/tools/translate-pdf");
  await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
  await expect(page.getByText(/2 pages · [\d,]+ characters of text/)).toBeVisible();
  await expect(page.getByLabel("Translate", { exact: true })).toHaveValue("en-ar");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByText("Translation failed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Translate", exact: true })).toBeEnabled();
  expect(posts.filter((u) => u.includes("/api/"))).toEqual([]);
});

test("Arabic page uses Arabic labels", async ({ page }) => {
  await open(page, "/ar/tools/translate-pdf");
  await expect(page.locator("h1")).toHaveText("ترجمة ملفات PDF");
  await expect(page.getByText("يُترجم مستندك على جهازك")).toBeVisible();
});

// Downloads the real model (about 118 MB), so it only runs on request: RUN_MODEL_TESTS=1.
test("translates a PDF with the real model", async ({ page }) => {
  test.skip(!process.env.RUN_MODEL_TESTS, "downloads the translation model");
  test.setTimeout(300_000);
  await open(page, "/tools/translate-pdf");
  await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
  await expect(page.getByText(/2 pages · [\d,]+ characters of text/)).toBeVisible();
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download Word" })).toBeVisible({ timeout: 280_000 });
  await expect(page.locator('[lang="ar"]').first()).toContainText(/[؀-ۿ]/);
});
