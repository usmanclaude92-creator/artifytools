import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "translate-pdf",
  slug: "translate-pdf",
  name: "Translate PDF",
  description: "Translate a PDF between Arabic and English privately in your browser, and download it as Word.",
  intro: [
    "Open a PDF, check the direction, and get the whole document translated with its headings and paragraphs kept in order. Translate English documents into Arabic or Arabic into English, and download the result as an editable Word file, with right-to-left layout for Arabic.",
    "The translation runs on your own device, so the PDF and its text are never uploaded. The first time you use a direction, your browser downloads a translation model (about 118 MB) and keeps it for next time. Machine translation can contain mistakes, so have important documents checked.",
  ],
  category: "pdf",
  icon: "globe",
  tags: ["pdf", "translate", "arabic", "english", "word"],
  keywords: ["translate pdf", "pdf translator", "translate pdf to arabic", "translate pdf to english", "translate document", "arabic to english pdf translation"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is read and translated by code and a model running in this tab. Neither the file nor its text is uploaded, stored, or logged. Only the model is downloaded, once, from Hugging Face, and cached by your browser.",
  seoTitle: "Translate PDF Arabic English, Private | Artify Tools",
  seoDescription: "Translate PDF documents between Arabic and English privately in your browser, with headings and paragraphs kept, and download an editable Word file.",
  lastUpdated: "2026-10-24",
  howTo: [
    "Choose or drop a PDF with selectable text (for scans, use Image to Text first).",
    "Check the direction, Arabic to English or English to Arabic. It is suggested from the document.",
    "Press Translate. The first time, wait for the model to download. Long documents are translated sentence by sentence.",
    "Check the preview, then download the Word file or copy the text.",
  ],
  examples: [
    { label: "English to Arabic", input: "policy.pdf (6 pages) · English to Arabic", output: "policy-ar.docx with right-to-left Arabic headings and paragraphs" },
    { label: "Arabic to English", input: "عقد.pdf · Arabic to English", output: "عقد-en.docx in English" },
  ],
  faqs: [
    { question: "Is the layout of the PDF kept?", answer: "The order of headings and paragraphs is kept and the result is an editable Word file. Tables, columns, pictures and exact positions are not reproduced, because translated text has a different length." },
    { question: "Which languages are supported?", answer: "Arabic to English and English to Arabic." },
    { question: "How long can the document be?", answer: "Up to about 30,000 characters of text, roughly 12 pages. Translation runs on your device, sentence by sentence, so long documents take a while. Split longer ones into parts first." },
    { question: "Can I translate a scanned PDF?", answer: "A scan has no text to translate. Use Image to Text (OCR) to extract the text first." },
    { question: "Is my document uploaded?", answer: "No. The PDF is read and translated inside your browser. Only the translation model is downloaded, once, and kept by your browser." },
    { question: "How accurate is it?", answer: "It is a compact model that runs on your device, so it is good for understanding and everyday sentences, but weaker than large online services on idioms, names, numbers and legal wording. Have important documents checked by a qualified translator." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["DOCX"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 2.2,
  related: ["pdf-to-word", "image-to-text", "word-to-pdf"],
};
