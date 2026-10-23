import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "add-page-numbers",
  slug: "add-page-numbers",
  name: "Add Page Numbers to PDF",
  description: "Number the pages of a PDF in the position and style you choose, in English or Arabic.",
  intro: [
    "Add page numbers to any PDF: pick one of six positions, a style such as “Page 1 of 10” or “1 / 10”, the starting number, text size and colour. Skip the cover page if you like, and use Arabic words and digits («صفحة ١ من ١٠») for Arabic documents.",
    "Numbers are placed where readers see them, even on rotated pages, and the rest of the document is untouched. Everything runs in your browser.",
  ],
  category: "pdf-edit",
  icon: "hash",
  tags: ["pdf", "page numbers", "numbering", "bates"],
  keywords: ["add page numbers to pdf", "number pdf pages", "pdf page numbering", "insert page numbers pdf", "page numbers online"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is numbered in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Add Page Numbers to PDF Online Free | Artify Tools",
  seoDescription: "Number PDF pages in any corner, with styles like Page 1 of 10, a custom start and Arabic digits. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-23",
  howTo: ["Choose or drop one PDF file.", "Pick the position, style, starting number and size.", "Press Add page numbers and check the preview.", "Download the numbered PDF."],
  examples: [
    { label: "Report", input: "report.pdf · bottom centre · Page 1 of 12", output: "report-numbered.pdf" },
    { label: "Arabic document", input: "تقرير.pdf · Arabic words and digits", output: "«صفحة ١ من ١٢» at the bottom of each page" },
  ],
  faqs: [
    { question: "Can I skip the cover page?", answer: "Yes. Tick “Don’t number the first page”; numbering then starts on page 2 with your chosen start number." },
    { question: "Can I start from a number other than 1?", answer: "Yes, for example to continue numbering from another document." },
    { question: "Will it cover my content?", answer: "Numbers sit in the margin you choose. If your pages have content right at the edge, increase the distance from the edge." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser adds the numbers on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.31,
  related: ["merge-pdf", "watermark-pdf", "split-pdf"],
};
