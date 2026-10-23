import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "excel-to-pdf",
  slug: "excel-to-pdf",
  name: "Excel to PDF",
  description: "Turn an Excel spreadsheet (.xlsx) or CSV into a PDF that fits the page.",
  intro: [
    "Open an .xlsx or .csv file, choose the sheets you need, and save them as a PDF. Number and date formats, bold and coloured cells, fills, borders, merged cells, column widths and Arabic text are kept, and wide sheets can be shrunk to fit the page width so no column is cut off.",
    "Pick A4 or Letter, portrait or landscape (or let the tool decide from the sheet's width), and show or hide gridlines. The file is read in your browser and saved with its built-in “Save as PDF”, so nothing is uploaded.",
  ],
  category: "pdf",
  icon: "file-text",
  tags: ["excel", "xlsx", "csv", "pdf", "spreadsheet"],
  keywords: ["excel to pdf", "convert excel to pdf", "xlsx to pdf", "csv to pdf", "spreadsheet to pdf", "excel to pdf fit to page", "excel to pdf arabic"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your spreadsheet is opened and printed in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Excel to PDF: Convert XLSX & CSV to PDF Free | Artify Tools",
  seoDescription: "Convert Excel and CSV files to PDF with formats, colours and merged cells kept, fit-to-width and landscape. No upload, no watermark. Free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one .xlsx or .csv file.",
    "Pick the sheets to include, the paper size and the orientation.",
    "Keep “Fit each sheet to the page width” on so wide sheets aren't cut off.",
    "Press Save as PDF and choose “Save as PDF” in the print window.",
  ],
  examples: [
    { label: "Price list", input: "prices.xlsx (1 sheet, 9 columns)", output: "prices.pdf in landscape, fitted to the page width" },
    { label: "Workbook", input: "report.xlsx (3 sheets)", output: "One PDF, each sheet starting on a new page with its name as a heading" },
  ],
  faqs: [
    { question: "Will it look like Excel?", answer: "Values appear as Excel shows them, with number and date formats, and with fonts, fills, borders and merged cells kept. Charts, images, conditional formatting and theme colours aren't drawn." },
    { question: "Can I convert .xls files?", answer: "Not directly. Open the file in Excel, Google Sheets or LibreOffice, save it as .xlsx, then choose it here." },
    { question: "How are wide sheets handled?", answer: "With “Fit to page width” on, each sheet is scaled down to fit. “Automatic” orientation switches to landscape when a sheet is wider than a portrait page." },
    { question: "Is my file uploaded?", answer: "No. Your browser reads the spreadsheet and creates the PDF on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["XLSX", "CSV"],
    accept: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", ".xlsx", ".csv"],
    outputFormats: ["PDF"],
    maxFileBytes: 30_000_000,
    maxFiles: 1,
  },
  popularRank: 1.95,
  related: ["word-to-pdf", "pdf-to-word", "merge-pdf"],
};
