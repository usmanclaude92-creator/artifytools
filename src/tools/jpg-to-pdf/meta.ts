import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "jpg-to-pdf",
  slug: "jpg-to-pdf",
  name: "JPG to PDF",
  description: "Turn JPG, PNG and other images into one PDF, one image per page.",
  intro: [
    "Add photos, scans or screenshots, put them in order, and download a single PDF with one image on each page. Choose A4 or Letter pages with a margin for printing and sharing, or let each page match its image exactly.",
    "JPG photos are placed into the PDF without being re-compressed, so they keep their full quality. Phone photos are turned the right way up automatically. Everything happens in your browser, so your images never leave your device.",
  ],
  category: "pdf",
  icon: "image",
  tags: ["jpg", "image", "pdf", "convert", "photos"],
  keywords: ["jpg to pdf", "image to pdf", "convert images to pdf", "png to pdf", "photos to pdf", "combine images into one pdf", "picture to pdf"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your images are converted in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "JPG to PDF: Convert Images to PDF Free | Artify Tools",
  seoDescription: "Convert JPG, PNG and WebP images to one PDF. Reorder, choose A4 or Letter and margins, keep full photo quality. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop your images (up to 100). You can also paste a screenshot.",
    "Put them in order with the up and down arrows. Each image becomes one page.",
    "Pick the page size, orientation and margin.",
    "Press Convert to PDF, then download the file.",
  ],
  examples: [
    { label: "Receipts for an expense claim", input: "6 phone photos (JPG)", output: "receipts.pdf · 6 A4 pages, each photo upright and centred" },
    { label: "Screenshots, exact size", input: "3 PNG screenshots · page size: same as image", output: "3 pages, each the size of its screenshot" },
  ],
  faqs: [
    { question: "Does converting reduce photo quality?", answer: "No. JPG photos are placed into the PDF as they are. Only images that must be rotated, and formats PDF can't hold directly (such as WebP), are re-encoded, at high quality." },
    { question: "Can I convert HEIC photos from an iPhone?", answer: "Yes in Safari, which can read HEIC. Other browsers can't, so on those, change the iPhone camera to “Most Compatible” or convert the photos to JPG first." },
    { question: "Which page size should I choose?", answer: "A4 or Letter with a small margin is best for printing and official forms. “Same as image” keeps each page exactly the size of its picture, which suits screenshots and slides." },
    { question: "Are my images uploaded?", answer: "No. Your browser reads the images and builds the PDF on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP", "GIF", "HEIC"],
    accept: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/heic", "image/heif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".heic", ".heif"],
    outputFormats: ["PDF"],
    maxFileBytes: 30_000_000,
    maxFiles: 100,
    maxTotalBytes: 500_000_000,
  },
  popularRank: 1.6,
  related: ["merge-pdf", "split-pdf", "qr-code-generator"],
};
