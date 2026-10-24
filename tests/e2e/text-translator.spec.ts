import { expect, test, type Page } from "@playwright/test";

async function mockAi(page: Page, configured = true) {
  await page.route("**/api/ai/status", (r) => r.fulfill({ json: { configured } }));
  await page.route("**/api/ai/translate", async (r) => {
    const { segments, target } = r.request().postDataJSON() as { segments: string[]; target: string };
    await r.fulfill({ json: { segments: segments.map((s) => `[${target}] ${s}`) } });
  });
}

// Wait for hydration so fills aren't lost to a pre-hydration race.
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("Text Translator is a beta page, kept out of the sitemap", async ({ page, request }) => {
  await page.goto("/tools/text-translator");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("text-translator");
});

test("translates text line by line, suggests Arabic for English, and swaps back", async ({ page }) => {
  await mockAi(page);
  await open(page, "/tools/text-translator");
  const input = page.getByRole("textbox");
  await input.fill("Hello there\n\nSecond line");
  await expect(page.getByLabel("Translate into")).toHaveValue("ar");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  const out = page.getByTestId("translation");
  await expect(out).toHaveText("[ar] Hello there\n\n[ar] Second line");
  await expect(out).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: /Swap/ }).click();
  await expect(input).toHaveValue("[ar] Hello there\n\n[ar] Second line");
  await expect(page.getByTestId("translation")).toHaveCount(0);
});

test("suggests English for Arabic text and warns when text is already in the target language", async ({ page }) => {
  await mockAi(page);
  await open(page, "/tools/text-translator");
  await page.getByRole("textbox").fill("مرحبا بكم");
  await expect(page.getByLabel("Translate into")).toHaveValue("en");
  await page.getByLabel("Translate into").selectOption("ar");
  await expect(page.getByText("already looks like it is in the target language")).toBeVisible();
});

test("shows an error when the provider fails, and stays off when not configured", async ({ page }) => {
  await page.route("**/api/ai/status", (r) => r.fulfill({ json: { configured: true } }));
  await page.route("**/api/ai/translate", (r) => r.fulfill({ status: 429, json: { error: "rate_limited", message: "Too many requests. Please wait a moment and try again." } }));
  await open(page, "/tools/text-translator");
  await page.getByRole("textbox").fill("Hello");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByText("Too many requests")).toBeVisible();

  await mockAi(page, false);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("isn't switched on yet")).toBeVisible();
  await page.getByRole("textbox").fill("Hello");
  await expect(page.getByRole("button", { name: "Translate", exact: true })).toBeDisabled();
});

test("Arabic page works right-to-left", async ({ page }) => {
  await mockAi(page);
  await open(page, "/ar/tools/text-translator");
  await expect(page.locator("h1")).toHaveText("مترجم النصوص");
  await page.getByRole("textbox").fill("Good morning");
  await page.getByRole("button", { name: "ترجمة", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("[ar] Good morning");
});
