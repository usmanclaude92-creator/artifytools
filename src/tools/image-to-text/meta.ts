import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "image-to-text",
  slug: "image-to-text",
  name: "Image to Text (OCR)",
  description: "Copy the text out of photos, screenshots and scanned PDFs, in Arabic and English.",
  intro: [
    "Add a photo, a screenshot or a scanned PDF and get its text back to copy and edit. The OCR (optical character recognition) reads Arabic and English, even mixed on the same page, and you can download the result as plain text, as a Word file, or as a searchable PDF where the original pages gain selectable text.",
    "Recognition runs inside your browser with the open-source Tesseract engine, so your documents never leave your device. The engine downloads once (a few MB) and then works much faster.",
  ],
  category: "images",
  icon: "type",
  tags: ["ocr", "image to text", "scan", "arabic ocr", "pdf"],
  keywords: ["image to text", "ocr", "ocr online", "extract text from image", "picture to text", "arabic ocr", "scanned pdf to text", "jpg to text", "ocr pdf"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Images and PDFs are read in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Image to Text (OCR): Arabic & English, Free | Artify Tools",
  seoDescription: "Extract text from images, screenshots and scanned PDFs in Arabic and English. Copy it or download Word or a searchable PDF. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose the language of the text: Arabic, English, or both.",
    "Add photos, screenshots or a scanned PDF. They are read in the order you add them.",
    "Optionally tick “searchable PDF”, then press Extract text.",
    "Copy the text, or download it as .txt, Word or a searchable PDF.",
  ],
  examples: [
    { label: "Photo of a receipt", input: "receipt.jpg · English", output: "The shop name, items and totals as editable text" },
    { label: "Scanned Arabic letter", input: "letter.pdf (2 pages) · Arabic", output: "Arabic text, a Word file, and a searchable PDF" },
  ],
  faqs: [
    { question: "How accurate is it?", answer: "Clear printed text is usually read very accurately. Handwriting, blurry photos, low light, tilted pages and decorative fonts reduce accuracy. The tool shows an estimated accuracy so you know when to check more carefully." },
    { question: "Does it read handwriting?", answer: "Only neat, print-like handwriting, and not reliably. It is designed for printed text." },
    { question: "What is a searchable PDF?", answer: "A PDF that still shows the original scanned pages but has an invisible text layer, so you can search, select and copy the words." },
    { question: "Are my files uploaded?", answer: "No. The text is recognised by your browser on your device. Only the reading engine and language models are downloaded from our site, once." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP", "PDF"],
    accept: ["image/jpeg", "image/png", "image/webp", "image/bmp", "application/pdf", ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".pdf"],
    outputFormats: ["TXT", "DOCX", "PDF"],
    maxFileBytes: 50_000_000,
    maxFiles: 20,
    maxTotalBytes: 200_000_000,
  },
  popularRank: 1.85,
  related: ["pdf-to-word", "pdf-to-jpg", "compress-image"],
};
