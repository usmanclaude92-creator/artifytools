import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "remove-background",
  slug: "remove-background",
  name: "Remove Background",
  description: "Cut out the subject of a photo and remove the background automatically, for free.",
  intro: [
    "Add a photo of a person, product, pet or object and get it back with the background removed, as a transparent PNG or on white, black or any colour. It's ideal for product photos, profile pictures, ID-style photos, stickers and presentations, and you can process several images at once.",
    "An AI model runs inside your browser, so your photos are never uploaded. The model downloads once (about 88 MB) and is kept for next time; on computers and phones with WebGPU it works in a few seconds.",
  ],
  category: "images",
  icon: "eraser",
  tags: ["image", "background", "remove bg", "transparent", "ai"],
  keywords: ["remove background", "background remover", "remove bg", "transparent background", "remove background from image", "erase background", "cut out image", "product photo white background"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your photos are processed by an AI model running in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Remove Background from Image Free, No Upload | Artify Tools",
  seoDescription: "Remove image backgrounds automatically with AI in your browser. Transparent PNG or white/colour background, batch processing, no upload, no watermark. Free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Add one or more JPG, PNG or WebP images.",
    "The first time, wait for the AI model to download (about 88 MB); it's kept for next time.",
    "Choose a transparent, white, black or custom-colour background.",
    "Download each image, or all of them as a ZIP.",
  ],
  examples: [
    { label: "Product photo", input: "perfume.jpg · White", output: "perfume-no-bg.jpg on a clean white background" },
    { label: "Profile picture", input: "portrait.jpg · Transparent", output: "portrait-no-bg.png with a transparent background" },
  ],
  faqs: [
    { question: "Are my photos uploaded?", answer: "No. The AI model is downloaded to your browser and runs on your device. Your photos never leave it, which also means there are no limits or watermarks." },
    { question: "Why is the first use slow?", answer: "The AI model (about 88 MB) has to download once. After that it's stored by your browser and starts in seconds. On devices without WebGPU, each image takes longer because it's processed on the main processor." },
    { question: "What works best?", answer: "A clear subject that stands out from the background: people, products, animals, cars and objects. Fine hair and see-through objects such as glass may need a quick touch-up." },
    { question: "Which format should I download?", answer: "Transparent PNG keeps the cut-out so you can place it on anything. JPG with a white or coloured background is smaller and accepted everywhere, for example by online shops." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP"],
    accept: ["image/jpeg", "image/png", "image/webp", ".jpg", ".jpeg", ".png", ".webp"],
    outputFormats: ["PNG", "JPG", "ZIP"],
    maxFileBytes: 30_000_000,
    maxFiles: 20,
    maxTotalBytes: 300_000_000,
  },
  popularRank: 1.2,
  related: ["compress-image", "resize-image", "crop-image"],
};
