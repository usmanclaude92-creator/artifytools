import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "compress-pdf",
  slug: "compress-pdf",
  name: "Compress PDF",
  description: "Make a PDF smaller by shrinking the photos and scans inside it.",
  intro: [
    "Large PDFs are almost always large because of the photos and scanned pages inside them. This tool re-saves those images at a sensible size and quality, while text, fonts and drawings stay exactly as they were, sharp and selectable. You see the size before and after, and choose how strong the compression should be.",
    "Everything happens in your browser, so contracts, IDs and statements never leave your device. A PDF that is mostly text is already small; if we can't make it meaningfully smaller, the tool says so instead of giving you a worse copy.",
  ],
  category: "pdf-edit",
  icon: "file-archive",
  tags: ["pdf", "compress", "reduce size", "shrink"],
  keywords: ["compress pdf", "reduce pdf size", "make pdf smaller", "pdf compressor", "shrink pdf", "pdf too large to email", "decrease pdf file size"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is compressed in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Compress PDF: Reduce PDF File Size Free | Artify Tools",
  seoDescription: "Reduce PDF file size by compressing the images inside, while text stays sharp. Choose light, balanced or strong. Free and private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF file.",
    "Pick a level: Light keeps images close to the original, Strong gives the smallest file.",
    "Press Compress PDF and compare the size before and after.",
    "Download the smaller PDF, or try another level.",
  ],
  examples: [
    { label: "Scanned contract", input: "contract-scan.pdf · 14.2 MB · Balanced", output: "contract-scan-compressed.pdf · about 2–3 MB" },
    { label: "Text-only report", input: "report.pdf · 380 KB", output: "Already compact: no meaningful saving, so the tool tells you" },
  ],
  faqs: [
    { question: "Will my text get blurry?", answer: "No. Only photos and scanned images are re-encoded. Text, fonts, lines and shapes are copied as they are, so they stay sharp and selectable." },
    { question: "Which level should I choose?", answer: "Balanced suits email and uploads. Choose Light for documents you will print, and Strong when a website or portal has a tight size limit." },
    { question: "Why didn't my PDF get smaller?", answer: "PDFs that are mostly text, or whose images are already well compressed, have little left to remove. In that case your original file is already the best version." },
    { question: "Is my file uploaded?", answer: "No. The compression runs in your browser on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 150_000_000, maxFiles: 1 },
  popularRank: 1.3,
  related: ["merge-pdf", "pdf-to-word", "split-pdf"],
};
