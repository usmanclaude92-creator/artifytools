import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "organize-pdf",
  slug: "organize-pdf",
  name: "Organize PDF",
  description: "Reorder, delete and rotate the pages of a PDF, then save it as a new file.",
  intro: [
    "Open a PDF to see every page as a thumbnail. Drag pages into a new order, delete the ones you don't need, and rotate any page that came out sideways. When the layout looks right, save it as a new PDF.",
    "Pages are copied exactly, so quality is unchanged and text stays selectable. Everything runs in your browser, so the document never leaves your device.",
  ],
  category: "pdf-edit",
  icon: "layers",
  tags: ["pdf", "organize", "reorder pages", "delete pages", "rearrange"],
  keywords: ["organize pdf", "reorder pdf pages", "rearrange pdf pages", "delete pages from pdf", "remove pages from pdf", "pdf page organizer", "move pdf pages"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is reorganized in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Organize PDF: Reorder, Delete and Rotate Pages | Artify Tools",
  seoDescription: "Rearrange PDF pages by dragging, delete the pages you don't need and rotate single pages. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-27",
  howTo: ["Choose or drop one PDF file.", "Drag pages to reorder them, or use the arrow buttons on each page.", "Delete pages you don't need and rotate any that are sideways.", "Press Save organized PDF, then download the file."],
  examples: [
    { label: "Fix the order", input: "report.pdf · page 5 moved to the front", output: "report-organized.pdf with the cover first" },
    { label: "Drop pages", input: "scan.pdf · blank pages 2 and 7 deleted", output: "scan-organized.pdf without the blank pages" },
  ],
  faqs: [
    { question: "Does organizing reduce quality?", answer: "No. Pages are copied as they are; nothing is redrawn or compressed." },
    { question: "Can I undo a deletion?", answer: "Yes. Press Reset to bring back every page in its original order and rotation, before you save." },
    { question: "Can I organize a password-protected PDF?", answer: "Unlock it first with Unlock PDF, then choose it here." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser rebuilds the file on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.4,
  related: ["merge-pdf", "split-pdf", "rotate-pdf"],
};
