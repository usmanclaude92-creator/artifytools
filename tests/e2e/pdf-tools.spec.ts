import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Download, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);
const bytesOf = async (d: Download) => readFileSync((await d.path())!);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Rotate PDF", () => {
  test("rotates one page and then all pages", async ({ page }) => {
    await open(page, "/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-3-pages.pdf"));
    await expect(page.getByRole("img", { name: "Page 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save rotated PDF" })).toBeDisabled();
    await page.getByRole("button", { name: "Rotate page 2 right" }).click();
    await page.getByRole("button", { name: "Save rotated PDF" }).click();
    const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d1.suggestedFilename()).toBe("plain-3-pages-rotated.pdf");
    const doc = await PDFDocument.load(await bytesOf(d1));
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90, 0]);
    await page.getByRole("button", { name: "All left" }).click();
    await page.getByRole("button", { name: "Save rotated PDF" }).click();
    const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect((await PDFDocument.load(await bytesOf(d2))).getPages().map((p) => p.getRotation().angle)).toEqual([270, 0, 270]);
  });
});

test.describe("Add Page Numbers", () => {
  test("numbers pages in English and Arabic", async ({ page }) => {
    await open(page, "/tools/add-page-numbers");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText(/· 2 pages/)).toBeVisible();
    await expect(page.getByText("«Page 1 of 2»")).toBeVisible();
    await page.getByRole("button", { name: "Add page numbers" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of the result" })).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(d.suggestedFilename()).toBe("report-en-ar-numbered.pdf");
    const doc = await PDFDocument.load(await bytesOf(d));
    expect(doc.getPageCount()).toBe(2);
    await page.getByLabel("Words in").selectOption("ar");
    await page.getByLabel("Use Arabic-Indic digits (١٢٣)").check();
    await expect(page.getByText("«صفحة ١ من ٢»")).toBeVisible();
    await expect(page.getByText("Settings changed. Add page numbers again to update.")).toBeVisible();
    await page.getByLabel("Start at").fill("x");
    await expect(page.getByText("Enter a whole number from 0 to 99999.")).toBeVisible();
  });
});

test.describe("Watermark PDF", () => {
  test("adds a text watermark and validates the image option", async ({ page }) => {
    await open(page, "/tools/watermark-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByLabel("Watermark text")).toHaveValue("CONFIDENTIAL");
    await page.getByLabel("Placement").selectOption("tile");
    await page.getByRole("button", { name: "Add watermark" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of the result" })).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const before = readFileSync(fixture("report-en-ar.pdf")).length;
    expect((await bytesOf(d)).length).toBeGreaterThan(before);
    await page.getByRole("radio", { name: "Image / logo" }).check({ force: true });
    await expect(page.getByText("Choose a PNG or JPG image.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add watermark" })).toBeDisabled();
    await page.getByLabel("Logo or image (PNG or JPG)").setInputFiles(fixture("logo-transparent.png"));
    await expect(page.getByRole("button", { name: "Add watermark" })).toBeEnabled();
  });
});

test.describe("Protect and unlock PDF", () => {
  test("protects with a password and unlocks it again", async ({ page }) => {
    await open(page, "/tools/protect-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await page.getByLabel("Password to open the PDF").fill("ab");
    await expect(page.getByText("Use at least 4 characters.")).toBeVisible();
    await page.getByLabel("Password to open the PDF").fill("s3cret-pass");
    await page.getByLabel("Type it again").fill("s3cret-pasX");
    await expect(page.getByText("The passwords don't match.")).toBeVisible();
    await page.getByLabel("Type it again").fill("s3cret-pass");
    await page.getByRole("button", { name: "Protect PDF" }).click();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    const protectedBytes = await bytesOf(d);
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow(/encrypted/i);

    await page.goto("/tools/unlock-pdf", { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles({ name: "report-protected.pdf", mimeType: "application/pdf", buffer: protectedBytes });
    await expect(page.getByText("Needs a password to open")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    await expect(page.getByText("That password is incorrect. Check it and try again.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("s3cret-pass");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    const [u] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
    expect(u.suggestedFilename()).toBe("report-protected-unlocked.pdf");
    expect((await PDFDocument.load(await bytesOf(u))).getPageCount()).toBe(2);
  });

  test("says when a PDF isn't protected", async ({ page }) => {
    await open(page, "/tools/unlock-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("plain-2-pages.pdf"));
    await expect(page.getByText("This PDF isn't password-protected, so there's nothing to unlock.")).toBeVisible();
  });
});
