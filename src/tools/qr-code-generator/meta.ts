import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "qr-code-generator",
  slug: "qr-code-generator",
  name: "QR Code Generator",
  description: "Turn any link or text into a QR code, as PNG or SVG.",
  intro: [
    "Type a web address, Wi-Fi details, a phone number, or any text and get a real, standards-compliant QR code. Download it as a PNG for documents and screens, or as an SVG that stays sharp at any print size.",
    "Pick an error-correction level to balance density against resilience: higher levels let a code still scan when it is smudged or partly covered. The tool warns you when your chosen colors have too little contrast for scanners to read reliably.",
  ],
  category: "productivity",
  icon: "qr-code",
  tags: ["qr", "qr code", "link", "barcode"],
  keywords: ["create qr code", "qr code for url", "make a qr code", "free qr generator", "qr code png", "qr svg"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "The QR code is encoded in your browser. Your text or link is not uploaded or stored, and the codes link directly to your content with no tracking redirect.",
  seoTitle: "Free QR Code Generator (PNG & SVG) | Artify Tools",
  seoDescription: "Create QR codes for links and text and download them as PNG or SVG. Private, in-browser QR code generator by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Enter the text or URL you want to encode.",
    "Optionally choose error correction, size, margin, and colors.",
    "Check the preview, then download as PNG or SVG.",
    "Test the code with a phone camera before printing.",
  ],
  examples: [
    { label: "Website link", input: "https://artifytools.com", output: "QR code that opens the site" },
  ],
  faqs: [
    { question: "Do these QR codes expire?", answer: "No. The data is encoded directly in the image, so the code works as long as the destination does. There is no tracking redirect." },
    { question: "Which error-correction level should I choose?", answer: "Medium suits most uses. Choose Quartile or High for printed or outdoor codes, or if you add a logo; higher levels make the pattern denser." },
    { question: "How much can a QR code hold?", answer: "Several thousand characters, but shorter content makes simpler codes that scan faster. This tool accepts up to 2,000 characters." },
    { question: "Why does the tool warn about colors?", answer: "Scanners need a dark pattern on a light background with strong contrast. Light-on-dark (inverted) and low-contrast codes often fail to scan." },
  ],
  popularRank: 5,
  featuredRank: 1,
  related: ["url-encoder-decoder", "color-converter", "password-generator"],
};
