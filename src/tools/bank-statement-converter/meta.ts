import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "bank-statement-converter",
  slug: "bank-statement-converter",
  name: "Bank Statement Converter",
  description: "Turn PDF bank statements into clean Excel or CSV: date, description, debit, credit and balance.",
  intro: [
    "Convert a PDF bank statement into a spreadsheet with one row per transaction and the columns Date, Description, Debit, Credit and Balance. Descriptions that run over several lines are joined, repeated page headers and footers are removed, and amounts become real numbers you can add up.",
    "Choose Automatic Conversion and the statement is read for you, with OCR for scanned pages. Choose Manual Selection to mark the tables on the pages yourself, label their columns, and convert only those. Every row's running balance is checked against the one before it, so you can see straight away if a transaction was missed. The statement is read in your browser and never uploaded.",
  ],
  category: "business",
  icon: "file-text",
  tags: ["bank statement", "pdf", "excel", "csv", "accounting"],
  keywords: ["bank statement converter", "bank statement to excel", "convert bank statement pdf to excel", "bank statement to csv", "pdf statement converter"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your statement is read in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Bank Statement Converter: PDF to Excel & CSV | Artify Tools",
  seoDescription: "Convert PDF bank statements to Excel or CSV with date, description, debit, credit and balance columns, checked row by row. Private, in your browser.",
  lastUpdated: "2026-10-27",
  howTo: [
    "Choose or drop a PDF bank statement.",
    "Pick Automatic Conversion, or Manual Selection to draw boxes around the tables and label their columns.",
    "Check the transactions found, the totals and the balance check, and switch the date format if needed.",
    "Download the statement as Excel or CSV.",
  ],
  examples: [
    { label: "Monthly statement", input: "statement-october.pdf (4 pages)", output: "statement-october.xlsx · 126 transactions · balance check passed" },
  ],
  faqs: [
    { question: "Which banks are supported?", answer: "Any bank whose statement PDF has selectable text and lists transactions in columns, in English or Arabic. Debit and credit columns, a single signed amount column, CR/DR markers and newest-first statements are all handled. Scanned pages are read with OCR in your browser; for a poor scan, use Manual Selection." },
    { question: "What is Manual Selection?", answer: "You draw a box around each table on the page preview, add column lines and say what each column holds (date, description, debit, credit, amount, balance). Only what is inside your boxes is converted, so headers, footers and notes are left out. Use it when Automatic Conversion mixes up columns or the statement has an unusual layout." },
    { question: "How are dates read?", answer: "Day-first and month-first dates are told apart automatically, and you can switch if a statement is ambiguous. Dates become real Excel dates you can sort and filter." },
    { question: "Is my statement uploaded?", answer: "No. The PDF is read inside your browser and never leaves your device." },
    { question: "What does the balance check do?", answer: "It adds each credit and subtracts each debit from the previous balance and compares the result with the balance printed on the statement, flagging any row that doesn't match." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["XLSX", "CSV"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 1.75,
  related: ["pdf-to-excel", "cheque-printer", "amount-in-words"],
};
