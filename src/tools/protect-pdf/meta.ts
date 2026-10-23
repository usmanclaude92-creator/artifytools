import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "protect-pdf",
  slug: "protect-pdf",
  name: "Protect PDF",
  description: "Add a password to a PDF with AES encryption, and choose whether people can print, copy or edit it.",
  intro: [
    "Set a password that's needed to open the PDF, then choose what readers may do once it's open: print, copy text and images, or edit. The file is encrypted with AES, which works in Adobe Acrobat, browsers, Preview and phone PDF apps.",
    "Encryption happens in your browser, so the document and the password never leave your device. Keep the password safe: it can't be recovered if you forget it.",
  ],
  category: "pdf",
  icon: "shield-check",
  tags: ["pdf", "password", "encrypt", "protect", "security"],
  keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "add password to pdf", "lock pdf", "secure pdf"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF and password stay in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Protect PDF with Password (AES) Free | Artify Tools",
  seoDescription: "Password-protect a PDF with AES encryption and control printing, copying and editing. Your file and password never leave your browser. Free.",
  lastUpdated: "2026-10-23",
  howTo: ["Choose or drop one PDF file.", "Type the password twice.", "Choose whether people may print, copy or edit.", "Press Protect PDF and download the protected file."],
  examples: [
    { label: "Payslip", input: "payslip.pdf · password · printing allowed", output: "payslip-protected.pdf that asks for the password" },
    { label: "Contract draft", input: "draft.pdf · no copying or editing", output: "draft-protected.pdf, view and print only" },
  ],
  faqs: [
    { question: "How strong is the protection?", answer: "The PDF is encrypted with AES-128. Use a long password that isn't easy to guess; the password is what keeps the file safe." },
    { question: "Can I remove the password later?", answer: "Yes, with Unlock PDF, as long as you know the password." },
    { question: "Do the print and copy settings always work?", answer: "Standard PDF apps respect them, but they're not a guarantee against someone who can already open the file." },
    { question: "Is my password sent anywhere?", answer: "No. The PDF is encrypted on your device. Neither the file nor the password leaves your browser." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.34,
  related: ["unlock-pdf", "watermark-pdf", "compress-pdf"],
};
