import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "compress-image",
  slug: "compress-image",
  name: "Compress Image",
  description: "Make JPG, PNG and WebP images smaller, or hit an exact size like 100 KB.",
  intro: [
    "Shrink photos for email, websites and upload forms. Pick a quality level, or type a target size such as 50 KB, 100 KB or 200 KB and the tool finds the best quality that fits, reducing the dimensions only if it has to.",
    "You can also cap the width and height and switch to WebP for even smaller files. Location data and other hidden photo metadata are removed. Everything happens in your browser, so your photos never leave your device.",
  ],
  category: "images",
  icon: "image",
  tags: ["image", "compress", "jpg", "png", "webp", "reduce size"],
  keywords: ["compress image", "reduce image size", "compress jpg", "image to 100kb", "resize image to 50kb", "compress photo", "make picture smaller", "compress png"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your images are compressed in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Compress Image: Reduce Size to 100KB, JPG & PNG | Artify Tools",
  seoDescription: "Compress JPG, PNG and WebP images, or hit an exact size like 50, 100 or 200 KB for upload forms. Batch, free and private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose By quality, or By target size and enter the size you need (for example 100 KB).",
    "Optionally limit the width and height, and pick the output format.",
    "Add your images (up to 50). They are compressed straight away.",
    "Download each image, or all of them as a ZIP.",
  ],
  examples: [
    { label: "Photo for a government portal", input: "IMG_2041.jpg · 4.8 MB · target 100 KB", output: "IMG_2041-compressed.jpg · 98 KB" },
    { label: "Website images", input: "12 PNG screenshots · Balanced · WebP", output: "12 WebP files, typically 70–90% smaller" },
  ],
  faqs: [
    { question: "How does the target size work?", answer: "The tool tries different quality levels to find the highest one that fits under your size. If even low quality is too big, it also reduces the width and height a little at a time, so the result is as sharp as the size allows." },
    { question: "Why did a PNG stay the same size?", answer: "PNG is a lossless format, so re-saving it rarely helps. Choose WebP or JPG as the output format, or use a target size, to make it much smaller." },
    { question: "Is photo location data removed?", answer: "Yes. Compressed images are saved without EXIF metadata such as GPS location and camera details. Photos are turned the right way up first." },
    { question: "Are my images uploaded?", answer: "No. Everything is done by your browser on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP"],
    accept: ["image/jpeg", "image/png", "image/webp", ".jpg", ".jpeg", ".png", ".webp"],
    outputFormats: ["JPG", "PNG", "WebP"],
    maxFileBytes: 30_000_000,
    maxFiles: 50,
    maxTotalBytes: 400_000_000,
  },
  popularRank: 1.8,
  related: ["jpg-to-pdf", "compress-pdf", "merge-pdf"],
};
