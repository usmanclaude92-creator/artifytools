import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "word-to-pdf",
  slug: "word-to-pdf",
  name: "Word to PDF",
  description: "Turn a Word document (.docx) into a PDF, with Arabic and right-to-left text.",
  intro: [
    "Open a .docx file to see it laid out page by page, then save it as a PDF. Headings, fonts, bold and italic, lists, tables, pictures, headers and footers, and right-to-left Arabic paragraphs are all laid out by your browser, and the text in the PDF stays selectable and searchable.",
    "Saving uses your browser's built-in “Save as PDF”, so the document never leaves your device and there are no watermarks or page limits.",
  ],
  category: "pdf",
  icon: "file-text",
  tags: ["word", "docx", "pdf", "convert"],
  keywords: ["word to pdf", "convert word to pdf", "docx to pdf", "word to pdf converter", "doc to pdf", "save word as pdf", "word to pdf arabic"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your document is opened and printed in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Word to PDF: Convert DOCX to PDF Free | Artify Tools",
  seoDescription: "Convert Word documents to PDF with tables, pictures and Arabic text laid out by your browser. Selectable text, no watermarks, no upload. Free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one .docx file.",
    "Check the preview.",
    "Press Save as PDF. In the print window, choose “Save as PDF” as the printer.",
    "Save the PDF to your device.",
  ],
  examples: [
    { label: "Contract", input: "agreement.docx (3 pages)", output: "agreement.pdf, 3 pages with selectable text" },
    { label: "Arabic letter", input: "خطاب.docx", output: "خطاب.pdf with right-to-left Arabic text" },
  ],
  faqs: [
    { question: "Why does a print window open?", answer: "Your browser has the best PDF engine on your device, with full support for Arabic and other scripts. Choosing “Save as PDF” in the print window writes a real PDF with selectable text, without uploading anything." },
    { question: "Can I convert old .doc files?", answer: "Not directly. Open the file in Word, Google Docs or LibreOffice, save it as .docx, then choose it here." },
    { question: "Will it look exactly like in Word?", answer: "Very close for most documents. Fonts that aren't installed on your device are replaced with similar ones, which can move line or page breaks slightly. Complex elements such as text boxes, charts and SmartArt may look simpler." },
    { question: "Is my document uploaded?", answer: "No. Your browser opens the document and creates the PDF on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["DOCX"],
    accept: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
    outputFormats: ["PDF"],
    maxFileBytes: 50_000_000,
    maxFiles: 1,
  },
  popularRank: 1.75,
  related: ["pdf-to-word", "merge-pdf", "compress-pdf"],
};
