import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "edit-pdf",
  slug: "edit-pdf",
  name: "Edit PDF",
  description: "Add text, dates, images and signatures to a PDF, or cover parts of a page with white-out.",
  intro: [
    "Fill in a form, correct a detail or add a note to any PDF. Type text anywhere on a page in any language, Arabic included, and choose its size, colour and weight. Cover old text or numbers with a white-out box, add a logo, stamp or photo, and place your signature and the date.",
    "Everything you add can be moved and resized before you save, on any page. The original content is kept as it is, and the file is edited in your browser, so it is never uploaded. Existing text in the PDF can be covered and typed over, not retyped in place.",
  ],
  category: "pdf-edit",
  icon: "file-pen",
  tags: ["pdf", "edit", "text", "white-out", "annotate"],
  keywords: ["edit pdf", "pdf editor", "edit pdf online free", "add text to pdf", "write on pdf", "fill pdf form", "white out pdf", "add image to pdf"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is edited in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Edit PDF Online Free: Add Text, Images & White-out | Artify Tools",
  seoDescription: "Edit PDF files online: add text in any language, white-out mistakes, insert images and signatures, and add dates. Free and private, nothing is uploaded.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF.",
    "Add text, a white-out box, an image, a signature or the date to the page you're viewing.",
    "Drag items into place and resize them; select text to change its wording, size and colour.",
    "Press Save PDF and download the edited file.",
  ],
  examples: [
    { label: "Fill in a form", input: "application.pdf · name, date and signature", output: "application-edited.pdf" },
    { label: "Correct a figure", input: "quote.pdf · white-out over 1,200 and new text 1,250", output: "quote-edited.pdf" },
  ],
  faqs: [
    { question: "Can I change the existing text in a PDF?", answer: "You can cover it with a white-out box and type the new text on top, which works for most corrections. Retyping text inside the original paragraph isn't supported." },
    { question: "Does it work with Arabic?", answer: "Yes. Text is drawn by your browser, so Arabic and other scripts come out correctly shaped and right to left." },
    { question: "Is my PDF uploaded?", answer: "No. The PDF is opened and saved in your browser and never leaves your device." },
    { question: "Will the rest of the page change?", answer: "No. Only what you add is drawn on top; the original text, images and quality stay as they were." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 1.73,
  related: ["sign-pdf", "watermark-pdf", "add-page-numbers"],
};
