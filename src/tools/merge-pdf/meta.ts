import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "merge-pdf",
  slug: "merge-pdf",
  name: "Merge PDF",
  description: "Combine several PDF files into one, in the order you choose.",
  intro: [
    "Add two or more PDFs, drag them into the right order with the up and down arrows, and download a single combined document. Every page is copied exactly as it is, so text stays selectable and nothing is re-compressed or blurred.",
    "Merging happens entirely in your browser, which makes it fast and keeps contracts, invoices and records on your own device. Password-protected PDFs need to be unlocked first; the tool tells you which file is protected.",
  ],
  category: "pdf",
  icon: "combine",
  tags: ["pdf", "merge", "combine", "join"],
  keywords: ["merge pdf", "combine pdf", "join pdf files", "merge pdf files into one", "pdf merger", "put pdfs together"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDFs are read and combined in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Merge PDF: Combine PDF Files Online Free | Artify Tools",
  seoDescription: "Combine PDF files into one document in seconds. Set the page order, keep full quality, and download. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop the PDF files you want to combine (up to 30).",
    "Put them in order with the up and down arrows. The top file comes first.",
    "Press Merge PDFs, then download the combined file.",
  ],
  examples: [
    { label: "Three files", input: "cover.pdf (1 page), report.pdf (12 pages), appendix.pdf (4 pages)", output: "merged.pdf · 17 pages, in that order" },
  ],
  faqs: [
    { question: "Are my files uploaded?", answer: "No. The PDFs are read and combined by your browser on your device. Nothing is sent to Artify or anyone else." },
    { question: "Will the quality change?", answer: "No. Pages are copied as they are, without re-compressing images or turning text into pictures." },
    { question: "Why was one of my files refused?", answer: "It may be password-protected or damaged. Remove the password in the app that created it (or with its owner’s permission), then try again." },
    { question: "Is anything left out of the merged file?", answer: "Page content, links and annotations are kept. Bookmarks (the outline) and some interactive form features from the original files may not carry over." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 30, maxTotalBytes: 300_000_000 },
  popularRank: 1.5,
  related: ["split-pdf", "word-counter", "qr-code-generator"],
};
