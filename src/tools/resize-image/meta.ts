import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "resize-image",
  slug: "resize-image",
  name: "Resize Image",
  description: "Change the width and height of photos, by pixels or percentage, one or many at once.",
  intro: [
    "Resize JPG, PNG and WebP images to an exact size in pixels, or scale them by a percentage. Fill in only the width or the height to keep the proportions, or set both and choose whether to fit inside, crop to fill, add borders, or stretch. Quick sizes cover square posts, stories, Full HD, video thumbnails, banners and profile photos.",
    "Add as many images as you like and download them one by one or as a ZIP. Photos are turned the right way up and resized in your browser, so they never leave your device.",
  ],
  category: "images",
  icon: "image",
  tags: ["image", "resize", "photo", "dimensions", "social media"],
  keywords: ["resize image", "image resizer", "resize photo", "change image size", "resize image to 1080x1080", "resize picture online", "reduce image dimensions", "resize jpg"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Images are resized in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Resize Image Online: Change Photo Size in Pixels | Artify Tools",
  seoDescription: "Resize JPG, PNG and WebP images by pixels or percentage, with quick sizes for posts, stories, banners and thumbnails. Batch and ZIP. Free and private.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose “By pixels” or “By percentage”.",
    "Type the width, the height, or both, or tap a quick size. With both set, choose fit, fill and crop, borders, or stretch.",
    "Add your images. They are resized straight away and update when you change the settings.",
    "Download each image or all of them as a ZIP.",
  ],
  examples: [
    { label: "Instagram post", input: "photo.jpg 4000×3000 · 1080×1080 · fill and crop", output: "photo-1080x1080.jpg, centred square crop" },
    { label: "Half size", input: "screenshot.png 2880×1800 · 50%", output: "screenshot-1440x900.png" },
  ],
  faqs: [
    { question: "How do I keep the proportions?", answer: "Fill in only the width or only the height and leave the other empty. The other side is worked out from each image’s own proportions." },
    { question: "What’s the difference between fit, fill and borders?", answer: "Fit keeps the whole picture and makes it as large as possible inside the size, so one side may be smaller. Fill covers the exact size and crops what sticks out from the centre. Borders keep the whole picture at the exact size and add white (JPG) or transparent (PNG, WebP) edges." },
    { question: "Will enlarging make my photo sharper?", answer: "No. Making an image bigger than the original spreads the same detail over more pixels, so it can look soft. Resizing down keeps it sharp." },
    { question: "Are my images uploaded?", answer: "No. Your browser does all the work on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP"],
    accept: ["image/jpeg", "image/png", "image/webp", ".jpg", ".jpeg", ".png", ".webp"],
    outputFormats: ["JPG", "PNG", "WebP"],
    maxFileBytes: 30_000_000,
    maxFiles: 50,
    maxTotalBytes: 400_000_000,
  },
  popularRank: 1.9,
  related: ["crop-image", "compress-image", "jpg-to-pdf"],
};
