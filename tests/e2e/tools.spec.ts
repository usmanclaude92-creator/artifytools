import { expect, test, type Page } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const out = (page: Page, name: string | RegExp) => page.getByRole("textbox", { name });
// Next.js keeps its own role="alert" route announcer on every page; exclude it.
const alert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
// Wait for hydration so fills aren't lost to a pre-hydration race.
async function open(page: Page, slug: string) {
  await page.goto(`/tools/${slug}`);
  await page.waitForLoadState("networkidle");
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (e) => {
    throw e;
  });
});

test("every published tool page renders its workspace", async ({ page }) => {
  test.setTimeout(120_000); // one test visits every tool page
  const slugs = ["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines", "percentage-calculator", "vat-calculator", "discount-calculator", "json-formatter", "url-encoder-decoder", "base64-encoder-decoder", "uuid-generator", "password-generator", "qr-code-generator", "date-difference", "color-converter", "ai-text-summarizer", "merge-pdf", "split-pdf", "jpg-to-pdf", "compress-pdf", "compress-image", "amount-in-words", "cheque-printer", "pdf-to-jpg", "resize-image", "crop-image", "pdf-to-word", "word-to-pdf", "image-to-text", "document-translator", "remove-background", "excel-to-pdf", "pdf-to-excel", "rotate-pdf", "organize-pdf", "add-page-numbers", "watermark-pdf", "unlock-pdf", "protect-pdf"];
  for (const slug of slugs) {
    const errors: string[] = [];
    const h = (m: import("@playwright/test").ConsoleMessage) => (m.type() === "error" || m.type() === "warning") && errors.push(m.text());
    page.on("console", h);
    await page.goto(`/tools/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main section").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "How to use" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Related tools" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    page.off("console", h);
    expect(errors, slug).toEqual([]);
  }
});

test("word counter counts live and resets", async ({ page }) => {
  await open(page, "word-counter");
  await out(page, /Text to analyse/).fill("The quick brown fox. Jumps over the lazy dog!\n\nNew paragraph.");
  const stats = page.getByRole("region", { name: "Statistics" });
  await expect(stats.locator("div", { hasText: /^Words/ }).first()).toContainText("11");
  await expect(stats).toContainText("Sentences");
  await expect(stats.locator("div", { hasText: /^Paragraphs/ }).first()).toContainText("2");
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(out(page, /Text to analyse/)).toHaveValue("");
  await expect(stats.locator("div", { hasText: /^Words/ }).first()).toContainText("0");
});

test("case converter converts and copies", async ({ page }) => {
  await open(page, "case-converter");
  await out(page, /Text to convert/).fill("hello big world");
  await page.getByRole("radio", { name: "camelCase" }).click();
  await expect(out(page, /Converted text/)).toHaveValue("helloBigWorld");
  await page.getByRole("radio", { name: "UPPER CASE" }).click();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByText("Copied to clipboard")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("HELLO BIG WORLD");
});

test("text cleaner cleans and downloads", async ({ page }) => {
  await open(page, "text-cleaner");
  await out(page, /Text to clean/).fill("  a    b  \n\n\n\n c ");
  await expect(out(page, "Cleaned text")).toHaveValue("a b\n\nc");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
  expect(download.suggestedFilename()).toBe("cleaned-text.txt");
});

test("remove duplicate lines", async ({ page }) => {
  await open(page, "remove-duplicate-lines");
  await out(page, /List to de-duplicate/).fill("b\nA\nb\na\nc");
  await expect(out(page, "Unique lines")).toHaveValue("b\nA\na\nc");
  await page.getByLabel("Case-sensitive").uncheck();
  await expect(out(page, "Unique lines")).toHaveValue("b\nA\nc");
  await page.getByLabel("Sort").selectOption("asc");
  await expect(out(page, "Unique lines")).toHaveValue("A\nb\nc");
});

test("percentage calculator modes and validation", async ({ page }) => {
  await open(page, "percentage-calculator");
  await page.getByLabel("Percentage (%)").fill("15");
  await page.getByLabel("Number", { exact: true }).fill("200");
  await expect(page.getByText("15% of 200 is 30")).toBeVisible();
  await page.getByText("X is what % of Y").click();
  await page.getByLabel("Value (X)").fill("25");
  await page.getByLabel("Total (Y)").fill("200");
  await expect(page.getByText("25 is 12.5% of 200")).toBeVisible();
  await page.getByLabel("Total (Y)").fill("0");
  await expect(alert(page)).toContainText("can't be zero");
  await page.getByLabel("Total (Y)").fill("abc");
  await expect(alert(page)).toContainText("isn't a valid number");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Value (X)")).toHaveValue("");
});

test("VAT calculator adds and removes VAT", async ({ page }) => {
  await open(page, "vat-calculator");
  await page.getByLabel(/Amount excluding VAT/).fill("100");
  await expect(page.getByRole("region", { name: "Result" }).getByText("120.00")).toBeVisible();
  await page.getByText("Remove VAT (gross → net)").click();
  await page.getByLabel(/Amount including VAT/).fill("99.99");
  await page.getByLabel("VAT rate (%)").fill("19");
  await expect(page.getByRole("region", { name: "Result" }).getByText("84.03")).toBeVisible();
  await page.getByLabel("VAT rate (%)").fill("150");
  await expect(alert(page)).toContainText("exceed 100%");
});

test("discount calculator", async ({ page }) => {
  await open(page, "discount-calculator");
  await page.getByLabel("Original price").fill("100");
  await page.getByLabel("Discount (%)", { exact: true }).fill("20");
  await page.getByLabel(/Extra discount/).fill("10");
  await expect(page.getByRole("region", { name: "Result" }).getByText("72.00")).toBeVisible();
  await page.getByRole("radio", { name: "Find the discount" }).click();
  await page.getByLabel("Original price").fill("200");
  await page.getByLabel("Sale price").fill("150");
  await expect(page.getByText("25%").first()).toBeVisible();
});

test("JSON formatter formats, minifies, explains errors and jumps to them", async ({ page }) => {
  await open(page, "json-formatter");
  await out(page, "JSON input").fill('{"b":1,"a":[1,2]}');
  await expect(page.getByText(/Valid JSON/)).toBeVisible();
  await expect(out(page, "Formatted output")).toHaveValue('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');
  await page.getByLabel("Sort keys A–Z").check();
  await expect(out(page, "Formatted output")).toHaveValue(/^\{\n {2}"a"/);
  await page.getByText("Minify", { exact: true }).click();
  await expect(out(page, "Formatted output")).toHaveValue('{"a":[1,2],"b":1}');
  await out(page, "JSON input").fill('{\n  "a": 1,\n}');
  const error = alert(page);
  await expect(error).toContainText("line 3, column 1");
  await expect(error).toContainText("Trailing comma");
  await error.getByRole("button", { name: "Jump to error" }).click();
  await expect(out(page, "JSON input")).toBeFocused();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(out(page, "JSON input")).toHaveValue("");
});

test("JSON formatter opens files and rejects wrong types", async ({ page }) => {
  await open(page, "json-formatter");
  await page.locator("#json-file").setInputFiles({ name: "d.json", mimeType: "application/json", buffer: Buffer.from('{"x":true}') });
  await expect(out(page, "JSON input")).toHaveValue('{"x":true}');
  await page.locator("#json-file").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("x") });
  await expect(alert(page)).toContainText(".json or .txt");
});

test("URL encoder/decoder", async ({ page }) => {
  await open(page, "url-encoder-decoder");
  await out(page, /Text to encode/).fill("coffee & cream/é");
  await expect(out(page, "Result")).toHaveValue("coffee%20%26%20cream%2F%C3%A9");
  await page.getByRole("radio", { name: "Full URL" }).click();
  await expect(out(page, "Result")).toHaveValue("coffee%20&%20cream/%C3%A9");
  await page.getByRole("radio", { name: "Decode" }).click();
  await out(page, /Text to decode/).fill("100%");
  await expect(alert(page).first()).toContainText("invalid percent-sequence");
});

test("Base64 encoder/decoder with swap", async ({ page }) => {
  await open(page, "base64-encoder-decoder");
  await out(page, /Text to encode/).fill("héllo ✓");
  await expect(out(page, "Result")).toHaveValue("aMOpbGxvIOKckw==");
  await page.getByRole("button", { name: "Swap" }).click();
  await expect(out(page, "Result")).toHaveValue("héllo ✓");
  await out(page, /Text to decode/).fill("not base64!");
  await expect(alert(page)).toContainText("Invalid character");
});

test("UUID generator", async ({ page }) => {
  await open(page, "uuid-generator");
  const items = page.getByRole("list").filter({ has: page.locator("code") }).locator("code");
  await expect(items).toHaveCount(5);
  await expect(items.first()).toHaveText(/^[0-9a-f-]{36}$/);
  await page.getByLabel(/How many/).fill("3");
  await page.getByText("v7 · time-ordered").click();
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(items).toHaveCount(3);
  await expect(items.first()).toHaveText(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
  await page.getByLabel("Uppercase").check();
  await page.getByLabel("Include hyphens").uncheck();
  await expect(items.first()).toHaveText(/^[0-9A-F]{32}$/);
  await page.getByLabel(/How many/).fill("101");
  await expect(page.getByText("Enter a whole number from 1 to 100.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate" })).toBeDisabled();
});

test("password generator", async ({ page }) => {
  await open(page, "password-generator");
  const pw = page.locator("output");
  await expect(pw).toHaveText(/^.{20}$/);
  const first = await pw.textContent();
  await page.getByRole("button", { name: "Generate new" }).click();
  expect(await pw.textContent()).not.toBe(first);
  await page.getByLabel("Symbols (!@#$…)").uncheck();
  await page.getByLabel("Digits (0–9)").uncheck();
  await expect(pw).toHaveText(/^[A-Za-z]{20}$/);
  await page.getByLabel(/^Length/).fill("40");
  await expect(pw).toHaveText(/^[A-Za-z]{40}$/);
  await expect(page.getByText(/Strength:/)).toBeVisible();
  await page.getByLabel("Lowercase (a–z)").uncheck();
  await page.getByLabel("Uppercase (A–Z)").uncheck();
  await expect(alert(page)).toContainText("at least one character type");
  await page.getByLabel("Uppercase (A–Z)").check();
  await page.getByLabel(/^Length/).fill("4");
  await expect(page.getByText("Enter a whole number from 8 to 128.")).toBeVisible();
  // never transmitted
  const requests: string[] = [];
  page.on("request", (r) => { if (r.method() === "POST") requests.push(r.url()); });
  await page.getByLabel(/^Length/).fill("16");
  await page.getByRole("button", { name: "Copy password" }).click();
  await expect(page.getByText("Password copied")).toBeVisible();
  expect(requests).toEqual([]);
});

test("QR code generator renders a real code and downloads PNG/SVG", async ({ page }) => {
  await open(page, "qr-code-generator");
  await expect(page.getByText("Enter text or a link")).toBeVisible();
  await page.getByLabel("Text or URL").fill("https://tools.artifysols.com");
  const img = page.getByRole("img", { name: "Generated QR code" });
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute("src", /^data:image\/svg\+xml/);
  const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PNG" }).click()]);
  expect(png.suggestedFilename()).toBe("qr-code.png");
  const [svg] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download SVG" }).click()]);
  const svgText = (await (await svg.createReadStream()).toArray()).join("");
  expect(svgText).toContain("<svg");
  // low-contrast warning
  await page.getByLabel("Foreground color").fill("#dddddd");
  await expect(page.getByRole("status").filter({ hasText: "Low contrast" })).toBeVisible();
  await page.getByLabel("Text or URL").fill("x".repeat(2001));
  await expect(alert(page)).toContainText("too long");
});

test("date difference", async ({ page }) => {
  await open(page, "date-difference");
  await page.getByLabel("Start date", { exact: true }).fill("2020-01-15");
  await page.getByLabel("End date", { exact: true }).fill("2024-03-20");
  const diff = page.getByRole("region", { name: "Difference" });
  await expect(diff.getByText("4 years, 2 months, 5 days")).toBeVisible();
  await page.getByLabel("Start date", { exact: true }).fill("2024-02-28");
  await page.getByLabel("End date", { exact: true }).fill("2024-03-01");
  await expect(diff.getByText("2 days", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Include the end date").check();
  await expect(diff.getByText("3 days", { exact: true }).first()).toBeVisible();
  await page.getByLabel("End date", { exact: true }).fill("2024-02-01");
  await expect(page.getByText(/dates were swapped/)).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Start date", { exact: true })).toHaveValue("");
});

test("color converter", async ({ page }) => {
  await open(page, "color-converter");
  const input = page.getByLabel("Color value");
  const converted = page.getByRole("region", { name: "Converted values" });
  await expect(converted.getByText("rgb(91, 61, 245)")).toBeVisible();
  await input.fill("hsl(32, 100%, 50%)");
  await expect(converted.getByText("#FF8800")).toBeVisible();
  await input.fill("#12345");
  await expect(alert(page).first()).toBeVisible();
  await input.fill("#ff880080");
  await expect(alert(page).first()).toContainText("alpha");
  await input.fill("#000");
  await expect(page.getByText("21.00:1").first()).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(input).toHaveValue("#5B3DF5");
});

test("AI summarizer is marked coming soon and the API stays switched off", async ({ page, request }) => {
  const status = await (await request.get("/api/ai/status")).json();
  test.skip(status.configured === true, "AI is configured in this environment");
  await page.goto("/tools/ai-text-summarizer");
  await expect(page.getByText("This tool is on its way.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Summarize" })).toHaveCount(0);
  const res = await request.post("/api/ai/summarize", { data: { text: "hello", length: "short" } });
  expect(res.status()).toBe(503);
  expect((await res.json()).error).toBe("not_configured");
});
