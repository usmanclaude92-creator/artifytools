import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "pdf-to-word",
  slug: "pdf-to-word",
  name: "PDF to Word",
  description: "Turn a PDF into an editable Word document (.docx), including Arabic text.",
  intro: [
    "Open a PDF and get a Word file you can edit. The text is rebuilt into real paragraphs and headings, bold and italic are kept, and Arabic text keeps its right-to-left direction, so you can change wording instead of retyping the document.",
    "The conversion runs in your browser, so the PDF never leaves your device. It works best on PDFs made from documents; scanned pages are added as pictures because their text can't be read without OCR.",
  ],
  category: "pdf",
  icon: "file-text",
  tags: ["pdf", "word", "docx", "convert", "edit pdf"],
  keywords: ["pdf to word", "convert pdf to word", "pdf to docx", "pdf to word converter", "pdf to editable word", "pdf to word arabic", "edit pdf in word"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is converted in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "PDF to Word: Convert PDF to Editable DOCX Free | Artify Tools",
  seoDescription: "Convert PDF to an editable Word document with headings, paragraphs, bold and Arabic text kept. Free, private, and processed in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one PDF file.",
    "Choose whether each PDF page should start a new page in Word.",
    "Press Convert to Word.",
    "Download the .docx file and open it in Word, Google Docs, Pages or LibreOffice.",
  ],
  examples: [
    { label: "Report", input: "report.pdf (12 pages)", output: "report.docx with its headings and paragraphs, ready to edit" },
    { label: "Arabic letter", input: "خطاب.pdf", output: "خطاب.docx with right-to-left Arabic paragraphs" },
  ],
  faqs: [
    { question: "Will the Word file look exactly like the PDF?", answer: "The text, headings, paragraphs, bold and italic come across so you can edit them. Complex layouts such as tables, multiple columns, text boxes and pictures inside text pages are not rebuilt, so check the layout and adjust it in Word." },
    { question: "Does it work with scanned PDFs?", answer: "A scan is a picture of text, so there is no text to extract. Scanned pages are added to the Word file as pictures. To edit them you need OCR (text recognition) first." },
    { question: "Does it support Arabic?", answer: "Yes. Arabic lines are detected and saved as right-to-left paragraphs. PDFs that store Arabic with unusual font encodings can still come out garbled; check the result." },
    { question: "Is my PDF uploaded?", answer: "No. Your browser reads the PDF and writes the Word file on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["DOCX"], maxFileBytes: 60_000_000, maxFiles: 1 },
  popularRank: 1.7,
  related: ["word-to-pdf", "image-to-text", "pdf-to-jpg"],
};
