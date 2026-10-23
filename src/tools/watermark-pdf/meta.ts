import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "watermark-pdf",
  slug: "watermark-pdf",
  name: "Watermark PDF",
  description: "Stamp text or your logo across PDF pages, in any language, with your choice of angle and transparency.",
  intro: [
    "Add a watermark such as CONFIDENTIAL, DRAFT, «سري» or your company logo to every page of a PDF. Choose the text, colour and size or upload a PNG or JPG logo, set the transparency and angle, and place it once in the centre or repeat it across the page.",
    "Arabic and other scripts are drawn correctly, rotated pages are handled, and the original content stays sharp underneath. Everything runs in your browser.",
  ],
  category: "pdf-edit",
  icon: "layers",
  tags: ["pdf", "watermark", "stamp", "logo", "confidential"],
  keywords: ["watermark pdf", "add watermark to pdf", "pdf watermark online", "stamp pdf", "add logo to pdf", "confidential watermark"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is watermarked in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Add Watermark to PDF: Text or Logo Free | Artify Tools",
  seoDescription: "Watermark PDF pages with text or a logo, in Arabic or English, with angle, transparency and tiling options. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: ["Choose or drop one PDF file.", "Choose text or image, then set the text or upload your logo.", "Set transparency, angle and placement, then press Add watermark.", "Check the preview and download the PDF."],
  examples: [
    { label: "Confidential stamp", input: "contract.pdf · CONFIDENTIAL · diagonal · 25%", output: "contract-watermarked.pdf" },
    { label: "Company logo", input: "brochure.pdf · logo.png · centre · 15%", output: "Logo faintly behind every page's content" },
  ],
  faqs: [
    { question: "Can the watermark be removed?", answer: "It is added on top of each page's content. Anyone with PDF editing software could still remove it, so for real protection also use Protect PDF." },
    { question: "Can I use Arabic text?", answer: "Yes. The text is drawn by your browser, so Arabic and other scripts appear correctly shaped." },
    { question: "Which images can I use?", answer: "PNG (including transparent logos) or JPG. Transparent PNGs look best." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser adds the watermark on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.32,
  related: ["protect-pdf", "add-page-numbers", "merge-pdf"],
};
