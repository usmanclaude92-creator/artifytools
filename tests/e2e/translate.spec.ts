import { expect, test } from "@playwright/test";

// Translate PDF stays "coming soon" until an AI key is configured; it must not be promoted or indexed meanwhile.
test("Translate PDF is listed as coming soon and kept out of search until AI is configured", async ({ page, request }) => {
  await page.goto("/tools/translate-pdf");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).not.toContain("translate-pdf");
  const status = await (await request.get("/api/ai/status")).json();
  expect(status).toEqual({ configured: false });
  const res = await request.post("/api/ai/translate", { data: { segments: ["Hello"], target: "ar" } });
  expect(res.status()).toBe(503);
});
