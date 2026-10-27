import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "rotate-pdf",
  slug: "rotate-pdf",
  name: "Rotate PDF",
  description: "Turn PDF pages the right way up, one page at a time or all at once.",
  intro: [
    "Open a PDF to see every page, then rotate single pages left or right, or turn the whole document at once. It's the quick fix for scans and phone photos that came out sideways or upside down.",
    "Rotation is lossless: pages keep their exact quality and their text stays selectable. Everything runs in your browser, so the document never leaves your device.",
  ],
  category: "pdf-edit",
  icon: "rotate-cw",
  tags: ["pdf", "rotate", "turn pages", "scan"],
  keywords: ["rotate pdf", "rotate pdf pages", "turn pdf page", "rotate pdf online", "rotate scanned pdf", "flip pdf page"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is rotated in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Rotate PDF Pages Online Free | Artify Tools",
  seoDescription: "Rotate single PDF pages or the whole document left, right or upside down, with no loss of quality. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-23",
  howTo: ["Choose or drop one PDF file.", "Use the arrows under a page to rotate it, or rotate all pages at once.", "Press Save rotated PDF.", "Download the file."],
  examples: [
    { label: "Sideways scan", input: "scan.pdf · page 2 rotated right", output: "scan-rotated.pdf with every page upright" },
    { label: "Whole document", input: "slides.pdf · all left", output: "slides-rotated.pdf in portrait" },
  ],
  faqs: [
    { question: "Does rotating reduce quality?", answer: "No. Only the page's orientation setting changes; the content isn't redrawn or compressed." },
    { question: "Can I rotate just some pages?", answer: "Yes. Each page has its own rotate buttons; the others stay as they are." },
    { question: "Can I rotate a password-protected PDF?", answer: "Unlock it first with Unlock PDF, then choose it here." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser rotates the pages on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.3,
  related: ["split-pdf", "merge-pdf", "compress-pdf", "organize-pdf"],
};
