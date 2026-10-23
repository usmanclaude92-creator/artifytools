import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "split-pdf",
  slug: "split-pdf",
  name: "Split PDF",
  description: "Split a PDF into separate files, or extract just the pages you need.",
  intro: [
    "Open a PDF and choose how to split it: every page as its own file, a new file every few pages, or custom ranges such as 1-3, 5, 8-10. Each range becomes its own PDF, and you can download them one by one or together in a ZIP.",
    "Pages are copied exactly, so quality is unchanged and text stays selectable. Everything runs in your browser, so the document never leaves your device.",
  ],
  category: "pdf",
  icon: "scissors",
  tags: ["pdf", "split", "extract pages", "separate"],
  keywords: ["split pdf", "extract pages from pdf", "separate pdf pages", "pdf splitter", "cut pdf", "save one page of a pdf"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is read and split in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Split PDF: Extract Pages Online Free | Artify Tools",
  seoDescription: "Split a PDF by page ranges, every page, or every few pages, and download the parts or a ZIP. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF file.",
    "Pick a split mode: custom ranges, every page, or every few pages.",
    "For ranges, type them like 1-3, 5, 8-10. Each range becomes one file.",
    "Download each part, or all of them as a ZIP.",
  ],
  examples: [
    { label: "Custom ranges", input: "report.pdf (10 pages) · 1-3, 5, 8-", output: "report-pages-1-3.pdf, report-page-5.pdf, report-pages-8-10.pdf" },
    { label: "Every 2 pages", input: "scan.pdf (5 pages)", output: "3 files: pages 1-2, 3-4, 5" },
  ],
  faqs: [
    { question: "How do I write page ranges?", answer: "Separate items with commas. Use a dash for a range (2-4), a single number for one page (7), and leave the end open to go to the last page (8-)." },
    { question: "Can I put several separate pages into one file?", answer: "Each comma-separated item becomes its own file. To combine pages from different places into one document, split them out first and join them with Merge PDF." },
    { question: "Are my files uploaded?", answer: "No. The PDF is split by your browser on your device. Nothing is sent to Artify or anyone else." },
    { question: "Why was my file refused?", answer: "It may be password-protected or damaged. Remove the password in the app that created it, then try again." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF", "ZIP"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 1.95,
  related: ["merge-pdf", "pdf-to-jpg", "compress-pdf"],
};
