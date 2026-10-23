import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Sign PDF", () => {
  test("draw a signature, place it, add the date, and download the signed PDF", async ({ page }) => {
    await open(page, "/tools/sign-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(fixture("report-en-ar.pdf"));
    const canvas = page.getByRole("img", { name: /Sign in the box/ });
    await canvas.scrollIntoViewIfNeeded();
    const bb = (await canvas.boundingBox())!;
    await page.mouse.move(bb.x + 40, bb.y + 90);
    await page.mouse.down();
    for (let i = 0; i <= 25; i++) await page.mouse.move(bb.x + 40 + i * 10, bb.y + 90 - Math.sin(i / 3) * 30);
    await page.mouse.up();
    await page.getByRole("button", { name: "Add signature to this page" }).click();
    await page.getByRole("button", { name: "Add date" }).click();
    await expect(page.getByText("2 items added.")).toBeVisible();

    // Move the signature with the keyboard, then remove and re-add the date.
    const sig = page.getByRole("button", { name: /^Signature \(Page 1 of 2\)/ });
    await sig.focus();
    await page.keyboard.press("Shift+ArrowUp");
    const date = page.getByRole("button", { name: /^Date/ });
    await date.focus();
    await page.keyboard.press("Delete");
    await expect(page.getByText("1 item added.")).toBeVisible();

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);

    await page.getByRole("button", { name: "Sign PDF" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of the result" })).toBeVisible();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(dl.suggestedFilename()).toBe("report-en-ar-signed.pdf");
    const doc = await PDFDocument.load(readFileSync((await dl.path())!));
    expect(doc.getPageCount()).toBe(2);
    expect(readFileSync((await dl.path())!).length).toBeGreaterThan(readFileSync(fixture("report-en-ar.pdf")).length);
  });

  test("typed signature on a phone fits the screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, "/tools/sign-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByRole("radio", { name: "Type" }).check();
    await page.getByLabel("Your name").fill("Usman Ali");
    await page.getByRole("button", { name: "Add signature to this page" }).click();
    await expect(page.getByText("1 item added.")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("Edit PDF", () => {
  test("Arabic: white-out, styled text, next page, save", async ({ page }) => {
    await open(page, "/ar/tools/edit-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByRole("button", { name: "تغطية بالأبيض" }).click();
    await page.getByRole("button", { name: "إضافة نص" }).click();
    await page.getByLabel("النص").fill("تم التعديل: 1,250 ريال");
    await page.getByLabel("الحجم").selectOption("18");
    await page.getByLabel("عريض").check();
    await page.getByRole("button", { name: "الصفحة التالية" }).click();
    await expect(page.getByText("الصفحة 2 من 2")).toBeVisible();
    await page.getByRole("button", { name: "إضافة نص" }).click();
    await expect(page.getByText("أُضيف 3 عناصر.")).toBeVisible();
    await page.getByRole("button", { name: "حفظ ملف PDF" }).click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /تنزيل|Download/ }).click()]);
    expect(dl.suggestedFilename()).toBe("report-en-ar-edited.pdf");
  });
});
