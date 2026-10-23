import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import ExcelJS from "exceljs";

const fixture = (name: string) => path.join(__dirname, "../fixtures", name);

async function open(page: Page, url: string) {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto(url, { waitUntil: "networkidle" });
}

test.describe("PDF to Word", () => {
  test("rebuilds headings, bold and Arabic paragraphs into a .docx", async ({ page }) => {
    await open(page, "/tools/pdf-to-word");
    await page.locator('input[type="file"]').setInputFiles(fixture("report-en-ar.pdf"));
    await expect(page.getByText(/· 2 pages/)).toBeVisible();
    await page.getByRole("button", { name: "Convert to Word" }).click();
    await expect(page.getByText("4 headings and 5 paragraphs from 2 pages.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quarterly Report" })).toBeVisible();
    await expect(page.getByText("ملخص باللغة العربية")).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).click()]);
    expect(d.suggestedFilename()).toBe("report-en-ar.docx");
    const bytes = readFileSync((await d.path())!);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    await page.getByLabel("Start each PDF page on a new page in Word").uncheck();
    await expect(page.getByText("Options changed. Convert again to update the file.")).toBeVisible();
  });

  test("refuses locked PDFs", async ({ page }) => {
    await open(page, "/tools/pdf-to-word");
    await page.locator('input[type="file"]').setInputFiles(fixture("locked.pdf"));
    await expect(page.getByText("This PDF is password-protected. Unlock it first, then choose it again.")).toBeVisible();
  });
});

test.describe("Word to PDF", () => {
  test("lays out the document and prints it at its page size", async ({ page, browser }) => {
    await open(page, "/tools/word-to-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("agreement.docx"));
    await expect(page.getByRole("button", { name: "Save as PDF" })).toBeVisible();
    await expect(page.getByText("1 page in the preview")).toBeVisible();
    const frame = page.frameLocator('iframe[title="Preview"]');
    await expect(frame.getByText("Service Agreement")).toBeVisible();
    await expect(frame.locator("p", { hasText: "هذه الاتفاقية" })).toHaveAttribute("dir", "rtl");

    // Print the preview document exactly as the browser would and check the PDF.
    const html = await page.locator('iframe[title="Preview"]').evaluate((f: HTMLIFrameElement) => f.contentDocument!.documentElement.outerHTML);
    const printPage = await browser.newPage();
    await printPage.setContent(html);
    const pdf = await PDFDocument.load(await printPage.pdf({ preferCSSPageSize: true, printBackground: true }));
    expect(pdf.getPageCount()).toBe(1);
    const { width, height } = pdf.getPage(0).getSize();
    expect(Math.round(width)).toBe(595); // A4
    expect(Math.round(height)).toBe(842);
    await printPage.close();

    // The button opens the browser's print dialog.
    await page.locator('iframe[title="Preview"]').evaluate((f: HTMLIFrameElement) => {
      (f.contentWindow as unknown as { printed: boolean }).printed = false;
      f.contentWindow!.print = () => { (f.contentWindow as unknown as { printed: boolean }).printed = true; };
    });
    await page.getByRole("button", { name: "Save as PDF" }).click();
    expect(await page.locator('iframe[title="Preview"]').evaluate((f: HTMLIFrameElement) => (f.contentWindow as unknown as { printed: boolean }).printed)).toBe(true);
  });

  test("explains that .doc and broken files can't be opened", async ({ page }) => {
    await open(page, "/tools/word-to-pdf");
    await page.locator('input[type="file"]').setInputFiles({ name: "broken.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("not a zip") });
    await expect(page.getByText(/couldn't be opened as a Word document/)).toBeVisible();
  });
});

test.describe("Excel to PDF", () => {
  test("lays out sheets with formats and prints landscape when wide", async ({ page, browser }) => {
    await open(page, "/tools/excel-to-pdf");
    await page.locator('input[type="file"]').setInputFiles(fixture("prices.xlsx"));
    await expect(page.getByText(/2 sheets/)).toBeVisible();
    const frame = page.frameLocator('iframe[title="Preview"]');
    await expect(frame.getByText("Design service")).toBeVisible();
    await expect(frame.getByText("5,250.525")).toBeVisible();
    await expect(frame.getByText("23/10/2026").first()).toBeVisible();
    await expect(frame.locator("td[colspan='9']")).toContainText("Price list 2026");

    const printed = async () => {
      const html = await page.locator('iframe[title="Preview"]').evaluate((f: HTMLIFrameElement) => f.contentDocument!.documentElement.outerHTML);
      const p = await browser.newPage();
      await p.setContent(html);
      const pdf = await PDFDocument.load(await p.pdf({ preferCSSPageSize: true }));
      await p.close();
      return pdf;
    };
    let pdf = await printed();
    expect(pdf.getPageCount()).toBe(2);
    expect(Math.round(pdf.getPage(0).getSize().width)).toBe(842); // A4 landscape

    await page.getByLabel("Notes").uncheck();
    await page.getByRole("radio", { name: "Portrait" }).check({ force: true });
    await expect(frame.getByText("Second sheet")).toHaveCount(0);
    pdf = await printed();
    expect(pdf.getPageCount()).toBe(1);
    expect(Math.round(pdf.getPage(0).getSize().width)).toBe(595);
  });

  test("explains old .xls files can't be opened", async ({ page }) => {
    await open(page, "/tools/excel-to-pdf");
    await page.locator('input[type="file"]').setInputFiles({ name: "old.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from("not a zip") });
    await expect(page.getByText(/couldn't be opened as a spreadsheet/)).toBeVisible();
  });
});

test.describe("PDF to Excel", () => {
  test("rebuilds the table with real numbers and Arabic text", async ({ page }) => {
    await open(page, "/tools/pdf-to-excel");
    await page.locator('input[type="file"]').setInputFiles(fixture("prices.pdf"));
    await expect(page.getByText(/· 2 pages/)).toBeVisible();
    await page.getByRole("button", { name: "Convert to Excel" }).click();
    await expect(page.getByText("8 rows from 2 pages.")).toBeVisible();
    const preview = page.locator("table").last();
    await expect(preview.locator("tr").nth(2)).toContainText("Item");
    await expect(preview.getByText("دعم فني")).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).click()]);
    expect(d.suggestedFilename()).toBe("prices.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync((await d.path())!).buffer as ArrayBuffer);
    const ws = wb.getWorksheet("Page 1")!;
    const row = ws.getRow(4).values as unknown[];
    expect(row.slice(1, 4)).toEqual(["Design service", 1200.5, 980]);
    expect(ws.getRow(4).getCell(2).numFmt).toBe("#,##0.000");
    await page.getByRole("radio", { name: "All pages in one sheet" }).check({ force: true });
    await expect(page.getByText("Options changed. Convert again to update the file.")).toBeVisible();
  });

  test("explains scanned PDFs have no table text", async ({ page }) => {
    await open(page, "/tools/pdf-to-excel");
    await page.locator('input[type="file"]').setInputFiles(fixture("scanned.pdf"));
    await page.getByRole("button", { name: "Convert to Excel" }).click();
    await expect(page.getByText(/no selectable text/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Use Image to Text (OCR) for scanned pages." })).toBeVisible();
  });
});
