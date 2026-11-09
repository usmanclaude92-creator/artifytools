import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "pdf-to-text",
  slug: "pdf-to-text",
  name: "PDF to Text",
  description: "Extract the text from a PDF to copy or save as a .txt file, including scanned pages in Arabic and English.",
  intro: [
    "Open a PDF and get all of its text back as plain text you can copy, search or paste anywhere. Wrapped lines are joined into proper paragraphs, or you can keep every line exactly as it sits on the page, which suits statements, lists and code. Arabic text keeps its right-to-left order.",
    "Most PDFs already contain real text, and this tool reads it instantly. Pages that are only pictures, such as scans, have no text to read, so the tool can run OCR on those pages (Arabic and English). Everything happens in your browser, so the document never leaves your device.",
  ],
  category: "pdf",
  icon: "file-text",
  tags: ["pdf", "text", "extract", "txt", "ocr"],
  keywords: ["pdf to text", "pdf to txt", "extract text from pdf", "copy text from pdf", "convert pdf to text", "pdf text extractor", "scanned pdf to text", "pdf to text online", "arabic pdf to text"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF is read in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "PDF to Text: Extract Text from PDF Free | Artify Tools",
  seoDescription: "Extract text from any PDF and copy it or download a .txt file. Reads scanned pages with OCR in Arabic and English. Free, private, in your browser.",
  lastUpdated: "2026-11-09",
  howTo: [
    "Choose or drop your PDF.",
    "Pick how the text is laid out: paragraphs, or the same lines as in the PDF. Tick page markers if you want to see where each page starts.",
    "Leave “Read scanned pages with OCR” on if the PDF may contain scans, and choose the language.",
    "Press Extract text, then copy it or download the .txt file.",
  ],
  examples: [
    { label: "A report", input: "report.pdf (12 pages)", output: "All the text, wrapped lines joined into paragraphs, ready to paste" },
    { label: "A mixed PDF", input: "contract.pdf · pages 1–3 typed, page 4 scanned", output: "Pages 1–3 read instantly, page 4 read with OCR" },
  ],
  faqs: [
    { question: "Why is my PDF's text empty?", answer: "The pages are probably pictures, such as a scan or a photo saved as PDF. Keep “Read scanned pages with OCR” ticked and the tool will recognise the text from the picture instead." },
    { question: "What is the difference between paragraphs and lines?", answer: "Paragraphs joins lines that wrap in the same block and separates blocks with a blank line, which reads best for letters and reports. Lines keeps every line break exactly as on the page, which suits tables, statements, lists and code." },
    { question: "Does it keep Arabic text correct?", answer: "Yes. Right-to-left lines are read in the correct order and Arabic letter forms are converted to normal letters, so the text can be searched and edited. Some PDFs store Arabic with unusual fonts, so check the result." },
    { question: "Does it keep tables and columns?", answer: "It gives you the text only. Use Lines mode to keep rows together, or PDF to Excel or the Bank Statement Converter for real tables." },
    { question: "Are my files uploaded?", answer: "No. Your browser reads the PDF on your device. OCR also runs locally; only the reading engine and language models are downloaded from our site, once." },
    { question: "My PDF is password-protected. Can I use it?", answer: "Unlock it first with Unlock PDF, using the password you were given, then choose the unlocked file." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["TXT"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 1.2,
  related: ["image-to-text", "pdf-to-word", "pdf-to-excel", "unlock-pdf"],
};
