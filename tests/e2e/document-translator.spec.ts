import { readFileSync } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

/** Replaces the translation model with a stand-in that tags each sentence with the model it went through. */
async function fakeModels(page: Page) {
  await page.addInitScript(() => {
    (globalThis as unknown as { __ARTIFY_TRANSLATE__: (model: string) => unknown }).__ARTIFY_TRANSLATE__ = (model: string) => ({
      translate: async (text: string) => `[${model}] ${text}`,
    });
  });
}

async function open(page: Page, url = "/tools/document-translator") {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("Document Translator", () => {
  test("old translator links lead to the new tool", async ({ page }) => {
    for (const old of ["/tools/translate-pdf", "/tools/text-translator"]) {
      await page.goto(old);
      await expect(page).toHaveURL(/\/tools\/document-translator$/);
    }
    await page.goto("/ar/tools/text-translator");
    await expect(page).toHaveURL(/\/ar\/tools\/document-translator$/);
  });

  test("pasted text: detects the language, picks a target and translates", async ({ page }) => {
    await fakeModels(page);
    await open(page);
    await page.getByRole("textbox", { name: "Text to translate" }).fill("Bonjour tout le monde. La réunion est lundi à dix heures.");
    await expect(page.getByText("Detected: French")).toBeVisible();
    // French is translated into Arabic through English (two models) unless another target is picked.
    await page.getByRole("combobox", { name: "To", exact: true }).selectOption("de");
    await expect(page.getByText(/through English with two models/)).toBeVisible();
    await page.getByRole("button", { name: "Translate" }).click();
    const out = page.getByTestId("translation");
    await expect(out).toContainText("[en-de] [fr-en] Bonjour tout le monde.");
    await expect(out).toContainText("La réunion est lundi à dix heures.");
    await expect(out).toHaveAttribute("lang", "de");
  });

  test("Arabic text goes to English, English goes to Arabic, and the result is right-to-left", async ({ page }) => {
    await fakeModels(page);
    await open(page);
    await page.getByRole("textbox", { name: "Text to translate" }).fill("Your appointment is confirmed for Sunday at ten.");
    await expect(page.getByRole("combobox", { name: "To", exact: true })).toHaveValue("ar");
    await page.getByRole("button", { name: "Translate" }).click();
    const out = page.getByTestId("translation");
    await expect(out).toContainText("[en-ar]");
    await expect(out).toHaveAttribute("dir", "rtl");
    // Using the translation as the new text flips the languages.
    await page.getByRole("button", { name: "Use the translation as the new text" }).click();
    await expect(page.getByRole("combobox", { name: "From", exact: true })).toHaveValue("ar");
    await expect(page.getByRole("combobox", { name: "To", exact: true })).toHaveValue("en");
  });

  test("warns when the two languages are the same, or the text is not in the chosen language", async ({ page }) => {
    await open(page);
    await page.getByRole("textbox", { name: "Text to translate" }).fill("Hello there, how are you doing today with the report.");
    await page.getByRole("combobox", { name: "To", exact: true }).selectOption("en");
    await expect(page.getByText("The two languages are the same")).toBeVisible();
    await expect(page.getByRole("button", { name: "Translate" })).toBeDisabled();
    // Japanese can be read but not written, so it is only offered as a source.
    await expect(page.getByRole("combobox", { name: "To", exact: true }).locator('option[value="ja"]')).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "From", exact: true }).locator('option[value="ja"]')).toHaveCount(1);
    await page.getByRole("combobox", { name: "From", exact: true }).selectOption("ja");
    await page.getByRole("combobox", { name: "To", exact: true }).selectOption("fr");
    await expect(page.getByText("This text doesn't look like Japanese")).toBeVisible();
    await expect(page.getByText(/through English with two models/)).toBeVisible();
  });

  test("a Word file comes back as a Word file with its formatting", async ({ page }) => {
    await fakeModels(page);
    await open(page);
    await page.getByRole("radio", { name: "Upload a document" }).check();
    await page.locator('input[type="file"]').setInputFiles(fixture("translate-sample.docx"));
    await expect(page.getByText(/1 page · 62 characters of text/)).toBeVisible();
    await page.getByRole("combobox", { name: "To", exact: true }).selectOption("fr");
    await page.getByRole("button", { name: "Translate" }).click();
    await expect(page.getByText("Start of the translation")).toBeVisible();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download .docx" }).click()]);
    expect(dl.suggestedFilename()).toBe("translate-sample-fr.docx");
    const zip = await JSZip.loadAsync(readFileSync((await dl.path())!));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("[en-fr] Quarterly report");
    expect(xml).toContain("<w:b/>");
  });

  test("a CSV, a PDF and an unsupported file", async ({ page }) => {
    await fakeModels(page);
    await open(page);
    await page.getByRole("radio", { name: "Upload a document" }).check();
    await page.locator('input[type="file"]').setInputFiles({ name: "prices.csv", mimeType: "text/csv", buffer: Buffer.from("Name,Price\nApple,3\n") });
    await page.getByRole("combobox", { name: "To", exact: true }).selectOption("fr");
    await page.getByRole("button", { name: "Translate" }).click();
    await expect(page.getByRole("button", { name: "Download .csv" })).toBeVisible();
    await page.getByRole("button", { name: "Choose another file" }).click();
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText(/KB · 2 pages/)).toBeVisible();
    await page.getByRole("button", { name: "Translate" }).click();
    await expect(page.getByRole("button", { name: "Download Word" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download .pdf" })).toHaveCount(0);
    await page.getByRole("button", { name: "Choose another file" }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: "old.doc", mimeType: "application/msword", buffer: Buffer.from("x") });
    await expect(page.getByText(/old Office format/)).toBeVisible();
  });

  test("the Arabic page works", async ({ page }) => {
    await fakeModels(page);
    await open(page, "/ar/tools/document-translator");
    await page.getByRole("textbox", { name: "النص المراد ترجمته" }).fill("Good morning everyone, the meeting is on Monday.");
    await page.getByRole("button", { name: "ترجمة", exact: true }).click();
    await expect(page.getByTestId("translation")).toContainText("[en-ar]");
  });
});
