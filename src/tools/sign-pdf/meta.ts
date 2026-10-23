import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "sign-pdf",
  slug: "sign-pdf",
  name: "Sign PDF",
  description: "Draw, type or upload your signature and place it on any page of a PDF, with the date and text if needed.",
  intro: [
    "Sign a contract, form or letter without printing it. Draw your signature with a mouse, finger or pen, type your name in a handwriting style, or upload a photo of your signature (the white paper is removed automatically). Then drag it into place on any page, resize it, and add the date or your name beside it.",
    "Everything happens in your browser: the PDF and your signature are never uploaded. The signature is added as an image, which is what most people mean by signing a PDF; it is not a certificate-based digital signature.",
  ],
  category: "pdf-edit",
  icon: "signature",
  tags: ["pdf", "sign", "signature", "e-sign", "contract"],
  keywords: ["sign pdf", "sign pdf online", "add signature to pdf", "electronic signature pdf", "e sign pdf free", "draw signature on pdf", "sign a pdf without printing"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your PDF and signature stay in this tab. Nothing is uploaded, stored, or logged.",
  seoTitle: "Sign PDF Online Free: Draw, Type or Upload | Artify Tools",
  seoDescription: "Sign PDF documents online: draw, type or upload your signature, place it on any page, and add the date. Free and private, nothing is uploaded.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop the PDF you need to sign.",
    "Draw, type or upload your signature, then add it to the page you're viewing.",
    "Drag it into place and resize it; add the date or text if needed.",
    "Press Sign PDF and download the signed file.",
  ],
  examples: [
    { label: "Sign a contract", input: "contract.pdf · drawn signature on page 3", output: "contract-signed.pdf" },
    { label: "Fill in a form", input: "form.pdf · typed name, date and signature", output: "form-signed.pdf" },
  ],
  faqs: [
    { question: "Is this a legally valid signature?", answer: "It adds your signature as an image, which is accepted for many everyday documents. Some contracts require a certificate-based digital signature from a trust provider; check what the other party needs." },
    { question: "Is my signature uploaded or saved?", answer: "No. The PDF and your signature are processed in your browser and are gone when you close the tab." },
    { question: "Can I sign several pages?", answer: "Yes. Go to each page and add your signature, initials, date or text there. Every item can be moved, resized or removed before you save." },
    { question: "Can I use a photo of my signature?", answer: "Yes. Upload a photo or scan on white paper; the white background is made transparent so only the ink shows." },
  ],
  files: { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 1 },
  popularRank: 1.72,
  related: ["edit-pdf", "protect-pdf", "merge-pdf"],
};
