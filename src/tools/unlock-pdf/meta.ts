import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "unlock-pdf",
  slug: "unlock-pdf",
  name: "Unlock PDF",
  description: "Remove the password and restrictions from a PDF you can open, so it's easier to use.",
  intro: [
    "Enter the password once and save a copy of the PDF that opens without it, or remove printing and copying restrictions from a PDF that opens freely. It's useful for statements, payslips and reports you need to merge, edit or print often.",
    "The file is decrypted in your browser, so neither the PDF nor the password is ever sent anywhere. This tool doesn't guess or recover forgotten passwords.",
  ],
  category: "pdf-edit",
  icon: "lock",
  tags: ["pdf", "unlock", "remove password", "decrypt"],
  keywords: ["unlock pdf", "remove password from pdf", "pdf password remover", "decrypt pdf", "remove pdf restrictions", "unlock pdf online"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF and password stay in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Unlock PDF: Remove Password from PDF Free | Artify Tools",
  seoDescription: "Remove the password or restrictions from a PDF you can open, so it opens and prints freely. AES supported. Private: your file and password never leave your browser.",
  lastUpdated: "2026-10-23",
  howTo: ["Choose or drop the protected PDF.", "Type the password you use to open it (not needed for restriction-only files).", "Press Unlock PDF.", "Download the unlocked copy."],
  examples: [
    { label: "Bank statement", input: "statement.pdf · password", output: "statement-unlocked.pdf that opens without a password" },
    { label: "Restricted report", input: "report.pdf · printing blocked", output: "report-unlocked.pdf that prints normally" },
  ],
  faqs: [
    { question: "I forgot the password. Can you recover it?", answer: "No. This tool only removes a password you know. It doesn't guess or crack passwords." },
    { question: "Is it legal?", answer: "Unlock only files you own or have permission to change, such as your own statements and documents." },
    { question: "Which encryption is supported?", answer: "Standard PDF passwords, including AES-128 and AES-256 used by banks and modern apps." },
    { question: "Is my password sent anywhere?", answer: "No. The PDF is decrypted on your device. Neither the file nor the password leaves your browser." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 2.33,
  related: ["protect-pdf", "merge-pdf", "compress-pdf"],
};
