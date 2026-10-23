import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "image-converter",
  slug: "image-converter",
  name: "Image Converter",
  description: "Convert HEIC, PNG, WebP, AVIF, GIF, BMP and SVG images to JPG, PNG or WebP, many at once.",
  intro: [
    "Turn iPhone HEIC photos into JPG, make PNG screenshots smaller as JPG or WebP, or turn WebP and AVIF images from websites into JPG or PNG that every app opens. Add as many images as you like, choose the format and quality, and download them one by one or all together as a ZIP.",
    "Photos are turned upright, transparent areas get a background of your choice when saved as JPG, and location and other hidden photo details are removed. Everything happens in your browser, so your photos never leave your device.",
  ],
  category: "images",
  icon: "refresh-cw",
  tags: ["image", "convert", "heic", "jpg", "png", "webp"],
  keywords: ["image converter", "heic to jpg", "png to jpg", "jpg to png", "webp to jpg", "webp to png", "heic to png", "avif to jpg", "convert image to jpg", "iphone photo to jpg"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your images are converted in this tab. They are never uploaded, stored, or logged.",
  seoTitle: "Image Converter: HEIC, PNG, WebP to JPG Free | Artify Tools",
  seoDescription: "Convert HEIC, PNG, WebP, AVIF, GIF and SVG images to JPG, PNG or WebP in batches. Free and private: your photos never leave your device.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose the format to convert to: JPG, PNG or WebP.",
    "Add or drop your images. HEIC photos from an iPhone work too.",
    "Download each converted image, or all of them as a ZIP.",
  ],
  examples: [
    { label: "iPhone photos", input: "IMG_2041.HEIC … IMG_2060.HEIC", output: "20 JPG files you can open anywhere" },
    { label: "Website image", input: "banner.webp", output: "banner.png" },
  ],
  faqs: [
    { question: "How do I convert HEIC to JPG?", answer: "Choose JPG, then add your HEIC photos. They are converted in your browser and can be downloaded one by one or as a ZIP." },
    { question: "Which format should I choose?", answer: "JPG for photos you want to share or upload anywhere, PNG for screenshots, logos and images with transparency, and WebP for the smallest files on websites." },
    { question: "What happens to transparent areas in JPG?", answer: "JPG can't be transparent, so those areas are filled with the background colour you choose (white by default)." },
    { question: "Are animated GIFs supported?", answer: "The first frame is converted. To keep the animation, keep the GIF." },
    { question: "Are my images uploaded?", answer: "No. Your browser does the conversion on your device, and photo location data is removed from the converted files." },
  ],
  files: {
    inputFormats: ["HEIC", "JPG", "PNG", "WebP", "AVIF", "GIF", "BMP", "SVG"],
    accept: ["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/bmp", "image/svg+xml", ".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp", ".svg"],
    outputFormats: ["JPG", "PNG", "WebP"],
    maxFileBytes: 40_000_000,
    maxFiles: 50,
    maxTotalBytes: 500_000_000,
  },
  popularRank: 1.71,
  related: ["compress-image", "resize-image", "jpg-to-pdf"],
};
