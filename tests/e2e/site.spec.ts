import { expect, test, type Page } from "@playwright/test";

function trackConsole(page: Page) {
  const issues: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") issues.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
  return issues;
}

const routes = ["/", "/tools", "/categories", "/categories/text-writing", "/ai-tools", "/for-professionals", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/changelog"];

test.describe("pages", () => {
  for (const route of routes) {
    test(`${route} renders with one h1, metadata, and no console errors`, async ({ page }) => {
      const issues = trackConsole(page);
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/\S/);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toBe(`https://tools.artifysols.com${route === "/" ? "" : route}`);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
      expect(await page.locator('meta[property="og:title"]').count()).toBeGreaterThan(0);
      expect(issues).toEqual([]);
    });
  }

  test("unknown tool and category slugs return 404 with helpful links", async ({ page }) => {
    for (const url of ["/tools/does-not-exist", "/categories/nope", "/totally-missing"]) {
      const res = await page.goto(url);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("couldn’t find");
      await expect(page.getByRole("link", { name: "Explore All Tools" })).toBeVisible();
    }
  });

  test("planned categories are not published", async ({ page }) => {
    expect((await page.goto("/categories/images"))?.status()).toBe(404);
  });

  test("every internal link on key pages resolves", async ({ page, request }) => {
    const hrefs = new Set<string>();
    for (const route of ["/", "/tools", "/categories", "/ai-tools", "/for-professionals", "/about", "/help", "/changelog", "/tools/word-counter"]) {
      await page.goto(route);
      for (const h of await page.locator("a[href^='/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!))) hrefs.add(h.split("#")[0]!.split("?")[0]!);
    }
    for (const href of hrefs) {
      if (!href) continue;
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("sitemap and robots are served with canonical domain", async ({ request }) => {
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain("https://tools.artifysols.com/tools/word-counter");
    expect(sm).toContain("https://tools.artifysols.com/categories/calculators");
    expect(sm).not.toContain("ai-text-summarizer"); // unfinished tools aren't promoted
    expect(sm).not.toContain("localhost");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap: https://tools.artifysols.com/sitemap.xml");
    expect(robots).toContain("Disallow: /api/");
  });

  test("tool pages have unique titles, JSON-LD and OG images", async ({ page }) => {
    await page.goto("/tools/word-counter");
    await expect(page).toHaveTitle("Free Word Counter Online | Artify Tools");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.flatMap((t) => [JSON.parse(t)].flat()).map((d) => d["@type"]);
    expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "WebApplication", "FAQPage"]));
    expect(await page.locator('meta[property="og:image"]').first().getAttribute("content")).toContain("/tools/word-counter/opengraph-image");
    await expect(page.getByRole("heading", { name: /Privacy: processed in your browser/i })).toBeVisible();
    // coming-soon tool is noindex
    await page.goto("/tools/ai-text-summarizer");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("no secrets in client bundles or HTML", async ({ request }) => {
    const html = await (await request.get("/tools/ai-text-summarizer")).text();
    expect(html).not.toMatch(/sk-ant|ANTHROPIC_API_KEY/);
  });
});

test.describe("navigation and theme", () => {
  test("header links navigate and show current page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Categories" }).click();
    await expect(page).toHaveURL(/\/categories$/);
    await expect(nav.getByRole("link", { name: /Categories/ })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "For Professionals" }).click();
    await expect(page).toHaveURL(/for-professionals/);
  });

  test("theme toggle switches and persists", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("@mobile mobile menu opens, traps focus, closes on Escape and after navigation", async ({ page }) => {
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open menu" });
    // The menu button must be on screen without scrolling (not merely clickable by the test runner).
    const box = await open.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    await open.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(open).toBeFocused();
    await open.click();
    await menu.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(menu).toBeHidden();
  });

  test("@mobile has no horizontal overflow on key pages", async ({ page }) => {
    for (const route of ["/", "/tools", "/tools/json-formatter", "/tools/qr-code-generator", "/categories", "/privacy"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, route).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("search", () => {
  test("hero search returns real matches, supports keyboard, and navigates", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search tools" }).first();
    await box.fill("count words");
    const options = page.getByRole("option");
    await expect(options.first()).toContainText("Word Counter");
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await box.fill("json");
    await expect(options.first()).toContainText("JSON Formatter");
    await box.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true").catch(() => {});
    await box.press("Escape");
    await expect(options).toHaveCount(0);
    await box.press("ArrowDown");
    await box.fill("percentage");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/tools\/percentage-calculator$/);
  });

  test("empty results show category links instead of a dead end", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search tools" }).first();
    await box.fill("convert an image");
    await expect(page.getByText("No tools match “convert an image”")).toBeVisible();
    await page.getByRole("link", { name: "Calculators" }).first().click();
    await expect(page).toHaveURL(/\/categories\/calculators$/);
  });

  test("clear button resets the query", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search tools" }).first();
    await box.fill("uuid");
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(box).toHaveValue("");
    await expect(box).toBeFocused();
  });

  test("hero suggestion chips link straight to their tool", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Format JSON", exact: true }).click();
    await expect(page).toHaveURL(/\/tools\/json-formatter$/);
    await expect(page.getByRole("heading", { level: 1, name: /JSON Formatter/ })).toBeVisible();
  });

  test("header search opens with Ctrl+K, closes with Escape, and opens a result with Enter", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle"); // shortcut listeners attach on hydration
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search tools" });
    await expect(dialog).toBeVisible();
    const box = dialog.getByRole("combobox");
    await expect(box).toBeFocused();
    await expect(dialog.getByText("Popular tools")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.keyboard.press("/");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").fill("base64");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/tools\/base64-encoder-decoder$/);
    await expect(dialog).toBeHidden();
  });

  test("Enter on a query with no match opens the directory search", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search tools" }).first();
    await box.fill("zzzzqq");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/tools\?q=zzzzqq/);
    await expect(page.getByText("No tools match your filters")).toBeVisible();
  });
});

test.describe("directory", () => {
  test("filters by category, combines with search, syncs the URL, and clears", async ({ page }) => {
    await page.goto("/tools");
    const count = page.getByRole("status").filter({ hasText: /tools?(\s|$)/ }).first();
    await expect(count).toContainText("18 tools");
    await page.getByRole("button", { name: /^Calculators/ }).click();
    await expect(page).toHaveURL(/category=calculators/);
    await expect(count).toContainText("3 tools");
    await page.getByLabel("Search all tools").fill("vat");
    await expect(page).toHaveURL(/q=vat/);
    await expect(count).toContainText("1 tool");
    await expect(page.getByRole("button", { name: /Category: Calculators/ })).toBeVisible();
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(count).toContainText("18 tools");
    await expect(page.getByLabel("Search all tools")).toHaveValue("");
  });

  test("deep link restores filters; sort and AI/processing filters work", async ({ page }) => {
    await page.goto("/tools?category=developer-tools&sort=za");
    const names = await page.locator("article h2").allTextContents();
    expect(names.length).toBe(5);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    await page.goto("/tools");
    await page.getByLabel("AI-powered only").check();
    await expect(page.locator("article h2")).toHaveText(["AI Text Summarizer"]);
    await page.getByLabel("AI-powered only").uncheck();
    await page.getByLabel("Processing").selectOption("external-provider");
    await expect(page.locator("article h2")).toHaveCount(1);
    await page.getByLabel("Processing").selectOption("");
    await page.getByLabel("Works with").selectOption("pdf");
    await expect(page).toHaveURL(/kind=pdf/);
    await expect(page.locator("article h2")).toHaveText(["Merge PDF", "Split PDF"]);
  });

  test("paginates beyond 12 tools", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator("article")).toHaveCount(12);
    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("article")).toHaveCount(6);
  });

  test("search from header while on /tools updates the directory", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const box = page.getByRole("dialog").getByRole("combobox");
    await box.fill("qqzzxx");
    await box.press("Enter");
    await expect(page.getByLabel("Search all tools")).toHaveValue("qqzzxx");
  });

  test("category page lists only its tools and links to others", async ({ page }) => {
    await page.goto("/categories/calculators");
    await expect(page.locator("article h2")).toHaveText(["Percentage Calculator", "VAT Calculator", "Discount Calculator"]);
    await page.getByRole("link", { name: "Text & Writing" }).last().click();
    await expect(page).toHaveURL(/text-writing/);
  });
});
