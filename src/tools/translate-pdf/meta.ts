import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "translate-pdf",
  slug: "translate-pdf",
  name: "Translate PDF",
  description: "Translate a PDF between Arabic, English and 13 other languages, and download it as Word.",
  intro: [
    "Open a PDF, choose a language, and get the whole document translated with its headings and paragraphs kept in order. Translate English documents into Arabic or Arabic into English, or use French, Spanish, German, Turkish, Urdu, Hindi, Persian, Chinese, Russian, Portuguese, Italian, Indonesian or Bengali. Download the result as an editable Word file, with right-to-left layout for Arabic, Urdu and Persian.",
    "The text is translated by a third-party AI provider, so it leaves your device when you press Translate; the PDF file itself is not uploaded, and nothing is stored. Machine translation can contain mistakes, so have important documents checked.",
  ],
  category: "pdf",
  icon: "globe",
  tags: ["pdf", "translate", "arabic", "ai", "word"],
  keywords: ["translate pdf", "pdf translator", "translate pdf to arabic", "translate pdf to english", "translate document", "arabic to english pdf translation"],
  status: "coming-soon",
  processingMode: "external-provider",
  aiPowered: true,
  privacyNote: "The document's text is sent to an Artify server and on to a third-party AI provider (Anthropic) for translation. The file isn't uploaded, and the text isn't stored or logged.",
  seoTitle: "Translate PDF: Arabic, English & More | Artify Tools",
  seoDescription: "Translate PDF documents into Arabic, English and 13 more languages with headings and paragraphs kept, and download an editable Word file.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop a PDF with selectable text (for scans, use Image to Text first).",
    "Choose the language to translate into.",
    "Press Translate. Long documents are translated part by part.",
    "Check the preview, then download the Word file or copy the text.",
  ],
  examples: [
    { label: "English to Arabic", input: "policy.pdf (6 pages) · Arabic", output: "policy-ar.docx with right-to-left Arabic headings and paragraphs" },
    { label: "Arabic to English", input: "عقد.pdf · English", output: "عقد-en.docx in English" },
  ],
  faqs: [
    { question: "Is the layout of the PDF kept?", answer: "The order of headings and paragraphs is kept and the result is an editable Word file. Tables, columns, pictures and exact positions are not reproduced, because translated text has a different length." },
    { question: "How long can the document be?", answer: "Up to about 60,000 characters of text, roughly 25 pages. Split longer documents into parts first." },
    { question: "Can I translate a scanned PDF?", answer: "A scan has no text to translate. Use Image to Text (OCR) to extract the text first." },
    { question: "Is my document stored?", answer: "No. Only the text is sent, it is translated and returned straight away, and Artify does not store or log it. Don't translate confidential documents you aren't allowed to share with a third-party service." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["DOCX"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 2.2,
  related: ["pdf-to-word", "image-to-text", "word-to-pdf"],
};
