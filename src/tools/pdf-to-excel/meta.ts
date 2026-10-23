import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "pdf-to-excel",
  slug: "pdf-to-excel",
  name: "PDF to Excel",
  description: "Pull the tables out of a PDF into an Excel spreadsheet (.xlsx), with real numbers.",
  intro: [
    "Open a PDF statement, invoice, price list or report and get its tables back as an Excel file. Rows and columns are rebuilt from the layout of the page, numbers such as 1,250.500 or (300.00) become real numbers you can sum and sort, and Arabic tables keep their right-to-left order.",
    "Choose one sheet per page or all pages in one sheet. The conversion runs in your browser, so the PDF never leaves your device. It works best on PDFs exported from Excel or accounting software; scanned pages need OCR first.",
  ],
  category: "pdf",
  icon: "file-text",
  tags: ["pdf", "excel", "xlsx", "tables", "convert"],
  keywords: ["pdf to excel", "convert pdf to excel", "pdf to xlsx", "extract tables from pdf", "pdf table to excel", "bank statement pdf to excel", "pdf to excel arabic"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is converted in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "PDF to Excel: Extract Tables to XLSX Free | Artify Tools",
  seoDescription: "Convert PDF tables to Excel with rows, columns and real numbers, including Arabic right-to-left tables. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF with selectable text.",
    "Choose one sheet per page, or all pages in one sheet.",
    "Press Convert to Excel and check the preview.",
    "Download the .xlsx file and open it in Excel, Google Sheets or LibreOffice.",
  ],
  examples: [
    { label: "Price list", input: "prices.pdf (2 pages)", output: "prices.xlsx with a sheet per page and numbers you can sum" },
    { label: "Statement", input: "statement.pdf · all pages in one sheet", output: "One continuous table of transactions" },
  ],
  faqs: [
    { question: "Which PDFs work best?", answer: "PDFs created by Excel, accounting systems, banks and invoicing software, where the text can be selected. Each page's columns are found from the white space between them, so clearly separated columns convert best." },
    { question: "Are numbers kept as numbers?", answer: "Yes. Values such as 1,250.500, 15% and (300.00) become real numbers with a matching format, so totals and sorting work in Excel. Codes with leading zeros stay as text." },
    { question: "Does it work with scanned PDFs?", answer: "No. A scan is a picture with no text to read. Use Image to Text (OCR) first." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser reads the PDF and writes the Excel file on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["XLSX"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 1.8,
  related: ["excel-to-pdf", "pdf-to-word", "image-to-text"],
};
