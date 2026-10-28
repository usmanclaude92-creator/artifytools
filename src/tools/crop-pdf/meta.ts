import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "crop-pdf",
  slug: "crop-pdf",
  name: "Crop PDF",
  description: "Trim the margins off PDF pages: drag a box over the part you want to keep.",
  intro: [
    "Open a PDF, drag the crop box over the part of the page you want to keep, and save. You can apply one crop to every page, or crop a single page and leave the rest alone.",
    "Cropping only changes the visible page area, so the content keeps its exact quality and its text stays selectable. Everything runs in your browser, so the document never leaves your device.",
  ],
  category: "pdf-edit",
  icon: "crop",
  tags: ["pdf", "crop", "trim margins", "scan"],
  keywords: ["crop pdf", "crop pdf pages", "trim pdf margins", "cut pdf page", "remove pdf margins", "crop pdf online"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is cropped in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Crop PDF Pages Online Free | Artify Tools",
  seoDescription: "Crop PDF pages by dragging a box over the part to keep. Apply it to every page or just one, with no loss of quality. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-28",
  howTo: ["Choose or drop one PDF file.", "Drag the corners of the crop box over the part of the page to keep.", "Choose whether it applies to all pages or only this page.", "Press Save cropped PDF, then download the file."],
  examples: [
    { label: "Scan with wide margins", input: "scan.pdf · all pages", output: "scan-cropped.pdf with the margins trimmed" },
    { label: "One page only", input: "report.pdf · page 3", output: "report-cropped.pdf with just page 3 cropped" },
  ],
  faqs: [
    { question: "Does cropping reduce quality?", answer: "No. Only the visible page area changes; the content isn't redrawn or compressed." },
    { question: "Can I crop just one page?", answer: "Yes. Choose “This page only”, move to the page and set its box; the other pages stay as they are." },
    { question: "Is the cropped-away part deleted?", answer: "The page no longer shows it, but the file may still contain it. For confidential content, use a tool that removes it, such as printing the cropped result to a new PDF." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser crops the pages on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.4,
  related: ["rotate-pdf", "split-pdf", "organize-pdf", "compress-pdf"],
};
