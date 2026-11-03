import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "remove-pages-from-pdf",
  slug: "remove-pages-from-pdf",
  name: "Remove Pages from PDF",
  description: "Delete the pages you don't want from a PDF: tap them on the thumbnails or type page numbers.",
  intro: [
    "Open a PDF to see every page. Tap the pages you want to remove, or type page numbers and ranges such as 2, 5-7. The pages you keep are saved as a new PDF in their original order.",
    "Pages are copied exactly as they are, so quality is unchanged and text stays selectable. Everything runs in your browser, so the document never leaves your device.",
  ],
  category: "pdf-edit",
  icon: "trash",
  tags: ["pdf", "remove pages", "delete pages", "extract pages", "blank pages"],
  keywords: ["remove pages from pdf", "delete pages from pdf", "how to delete pages from pdf", "remove one page from pdf", "delete pdf pages online", "remove blank pages from pdf", "pdf page remover"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is edited in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Remove Pages from PDF Online Free | Artify Tools",
  seoDescription: "Delete pages from a PDF online: tap the pages to remove or type page numbers. Free, no sign-up, and processed in your browser so your file stays private.",
  lastUpdated: "2026-11-03",
  howTo: ["Choose or drop one PDF file.", "Tap the pages you want to remove, or type page numbers such as 2, 5-7.", "Check the count of pages that will be kept.", "Press Save PDF, then download the file."],
  examples: [
    { label: "Remove blank pages", input: "scan.pdf · pages 2 and 7", output: "scan-edited.pdf without the blank pages" },
    { label: "Delete a range", input: "report.pdf · pages 10-14", output: "report-edited.pdf with those pages gone" },
  ],
  faqs: [
    { question: "How do I delete pages from a PDF?", answer: "Open the PDF, tap the pages you want to remove (or type their numbers), then press Save PDF. The remaining pages are saved as a new file and your original is left untouched." },
    { question: "Can I remove just one page?", answer: "Yes. Tap that single page, or type its number, and save." },
    { question: "Does removing pages reduce quality?", answer: "No. The pages you keep are copied as they are; nothing is redrawn or compressed." },
    { question: "Can I undo a removal before saving?", answer: "Yes. Tap a page again to bring it back, or press Clear to keep every page." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser edits the file on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.2,
  related: ["organize-pdf", "split-pdf", "merge-pdf", "rotate-pdf"],
};
