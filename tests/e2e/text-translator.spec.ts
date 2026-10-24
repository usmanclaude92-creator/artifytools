import { expect, test, type Page } from "@playwright/test";

// Wait for hydration so fills aren't lost to a pre-hydration race.
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("Text Translator is indexed, listed in the sitemap, and works without any key", async ({ page, request }) => {
  await page.goto("/tools/text-translator");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("https://tools.artifysols.com/tools/text-translator");
  expect(sm).toContain("https://tools.artifysols.com/ar/tools/text-translator");
  await expect(page.getByText("translated on this device and never uploaded")).toBeVisible();
  await expect(page.getByText("isn't switched on")).toHaveCount(0);
});

test("suggests the direction from the text and warns when it doesn't match", async ({ page }) => {
  await open(page, "/tools/text-translator");
  const direction = page.getByLabel("Translate", { exact: true });
  await page.getByRole("textbox").fill("Good morning");
  await expect(direction).toHaveValue("en-ar");
  await page.getByRole("textbox").fill("مرحبا بكم");
  await expect(direction).toHaveValue("ar-en");
  await direction.selectOption("en-ar");
  await expect(page.getByText("doesn't look like the language you chose")).toBeVisible();
});

test("never sends the text anywhere, and reports a failed model download", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => r.method() === "POST" && posts.push(r.url()));
  await page.route("https://huggingface.co/**", (r) => r.abort());
  await open(page, "/tools/text-translator");
  await page.getByRole("textbox").fill("Hello there");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByText("Translation failed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Translate", exact: true })).toBeEnabled();
  expect(posts.filter((u) => u.includes("/api/"))).toEqual([]);
});

test("Arabic page is right-to-left with Arabic labels", async ({ page }) => {
  await open(page, "/ar/tools/text-translator");
  await expect(page.locator("h1")).toHaveText("مترجم النصوص");
  await page.getByRole("textbox").fill("Good morning");
  await expect(page.locator("select")).toHaveValue("en-ar");
});

// Downloads the real models (about 118 MB per direction), so it only runs on request: RUN_MODEL_TESTS=1.
test("translates English to Arabic and swaps back, with the real model", async ({ page }) => {
  test.skip(!process.env.RUN_MODEL_TESTS, "downloads the translation model");
  test.setTimeout(240_000);
  await open(page, "/tools/text-translator");
  await page.getByRole("textbox").fill("Good morning.\n\nHow are you today?");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  const out = page.getByTestId("translation");
  await expect(out).toContainText("صباح", { timeout: 200_000 });
  await expect(out).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: /Swap/ }).click();
  await expect(page.getByLabel("Translate", { exact: true })).toHaveValue("ar-en");
});
