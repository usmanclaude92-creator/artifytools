import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "bank-statement-converter",
  slug: "bank-statement-converter",
  name: "Bank Statement Converter",
  description: "Turn PDF bank statements into clean Excel or CSV: date, description, debit, credit and balance.",
  intro: [
    "Convert a PDF bank statement into a spreadsheet with one row per transaction and the columns Date, Description, Debit, Credit and Balance. Descriptions that run over several lines are joined, repeated page headers and footers are removed, and amounts become real numbers you can add up.",
    "Every row's running balance is checked against the one before it, so you can see straight away if a transaction was missed. The statement is read in your browser and never uploaded.",
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
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop a PDF bank statement.",
    "Check the transactions found, the totals and the balance check, and switch the date format if needed.",
    "Download the statement as Excel or CSV.",
  ],
  examples: [
    { label: "Monthly statement", input: "statement-october.pdf (4 pages)", output: "statement-october.xlsx · 126 transactions · balance check passed" },
  ],
  faqs: [
    { question: "Which banks are supported?", answer: "Any bank whose statement PDF has selectable text and lists transactions in columns, in English or Arabic. Debit and credit columns, a single signed amount column, CR/DR markers and newest-first statements are all handled. Scanned statements need Image to Text first." },
    { question: "How are dates read?", answer: "Day-first and month-first dates are told apart automatically, and you can switch if a statement is ambiguous. Dates become real Excel dates you can sort and filter." },
    { question: "Is my statement uploaded?", answer: "No. The PDF is read inside your browser and never leaves your device." },
    { question: "What does the balance check do?", answer: "It adds each credit and subtracts each debit from the previous balance and compares the result with the balance printed on the statement, flagging any row that doesn't match." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["XLSX", "CSV"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 1.75,
  related: ["pdf-to-excel", "cheque-printer", "amount-in-words"],
};
