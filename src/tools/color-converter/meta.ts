import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "color-converter",
  slug: "color-converter",
  name: "HEX / RGB / HSL Color Converter",
  description: "Convert colors between HEX, RGB, and HSL, with a picker and contrast check.",
  intro: [
    "Paste a color in any common format, or pick one visually, and get its HEX, RGB, and HSL values side by side. Every value has its own copy button so you can paste straight into CSS.",
    "The tool also shows the WCAG contrast ratio against white and black, with pass or fail for normal and large text, so you can check at a glance whether a color is readable.",
  ],
  category: "developer",
  icon: "palette",
  tags: ["color", "hex", "rgb", "hsl", "css"],
  keywords: ["hex to rgb", "rgb to hex", "hsl to rgb", "color converter", "color picker", "css color", "contrast checker"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Color conversion happens in your browser. Nothing is uploaded.",
  seoTitle: "HEX to RGB to HSL Color Converter | Artify Tools",
  seoDescription: "Convert colors between HEX, RGB, and HSL and check WCAG contrast with Artify Tools' free online color converter.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Type a color such as #5B3DF5, rgb(91, 61, 245) or hsl(250, 90%, 60%), or use the color picker.",
    "Read the converted HEX, RGB, and HSL values.",
    "Copy the one you need, and check the contrast ratings below.",
  ],
  examples: [
    { label: "HEX to RGB/HSL", input: "#5B3DF5", output: "rgb(91, 61, 245) · hsl(250, 91%, 60%)" },
  ],
  faqs: [
    { question: "Which formats can I paste?", answer: "3- or 6-digit hex (with or without #), rgb(r, g, b), hsl(h, s%, l%), or three bare numbers like 255, 136, 0." },
    { question: "Why might HSL values be rounded?", answer: "HSL is shown in whole numbers, so converting back may differ from the original by a point or two." },
    { question: "Is transparency supported?", answer: "Not yet. 8-digit hex colors with alpha are rejected with a clear message rather than silently dropping transparency." },
  ],
  popularRank: 15,
  featuredRank: 6,
  related: ["qr-code-generator", "base64-encoder-decoder"],
};
