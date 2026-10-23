import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "pdf-to-jpg",
  slug: "pdf-to-jpg",
  name: "PDF to JPG",
  description: "Turn every page of a PDF into a JPG or PNG image.",
  intro: [
    "Open a PDF and get each page back as an image, ready to post, share in a chat, or insert into a presentation. Choose JPG for small files or PNG for the sharpest text, pick a resolution from screen to print quality, and convert all pages or only the ones you need.",
    "Download images one by one or all together in a ZIP. The PDF is rendered in your browser, so the document never leaves your device.",
  ],
  category: "pdf",
  icon: "image",
  tags: ["pdf", "jpg", "png", "convert", "images"],
  keywords: ["pdf to jpg", "pdf to image", "pdf to png", "convert pdf to jpg", "pdf to jpeg", "save pdf page as image", "pdf to picture"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is rendered in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "PDF to JPG: Convert PDF Pages to Images Free | Artify Tools",
  seoDescription: "Convert PDF pages to JPG or PNG images at screen or print resolution, and download them one by one or as a ZIP. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF file.",
    "Pick JPG or PNG and a resolution: 72 DPI for screens, 150 for most uses, 300 for printing.",
    "Convert all pages, or type the pages you want, like 1-3, 5.",
    "Download each image, or all of them as a ZIP.",
  ],
  examples: [
    { label: "Whole document", input: "report.pdf (4 pages) · JPG · 150 DPI", output: "4 images: report-page-1.jpg … report-page-4.jpg" },
    { label: "One page for print", input: "certificate.pdf · page 1 · PNG · 300 DPI", output: "certificate-page-1.png, about 2480×3508 px for A4" },
  ],
  faqs: [
    { question: "Which resolution should I choose?", answer: "150 DPI suits screens, chats and documents. Choose 300 DPI for printing or when you need to zoom into small text. 72 DPI gives the smallest files." },
    { question: "JPG or PNG?", answer: "JPG files are much smaller and fine for most pages. PNG keeps text and lines perfectly sharp and supports transparent backgrounds, but files are larger." },
    { question: "Can I convert a password-protected PDF?", answer: "Not yet. Remove the password first in the app you normally open it with, then choose the file again." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser draws each page on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["JPG", "PNG", "ZIP"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 1.6,
  related: ["jpg-to-pdf", "image-to-text", "compress-pdf"],
};
