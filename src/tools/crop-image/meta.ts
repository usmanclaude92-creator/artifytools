import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "crop-image",
  slug: "crop-image",
  name: "Crop Image",
  description: "Cut a photo to the area you want, freely or to a set shape like 1:1 or 16:9.",
  intro: [
    "Open a JPG, PNG or WebP image, drag the crop box over the part you want to keep, and save it. Lock the shape to square, 4:5, 4:3, 3:2, 16:9 or 9:16 for social posts, profile photos and thumbnails, or type the exact position and size in pixels.",
    "You can also rotate and flip the picture before cropping. Everything happens in your browser, so the image never leaves your device.",
  ],
  category: "images",
  icon: "crop",
  tags: ["image", "crop", "photo", "aspect ratio", "rotate"],
  keywords: ["crop image", "crop photo", "image cropper", "crop picture online", "crop image to square", "crop jpg", "cut image", "crop image 16:9"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your image is cropped in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Crop Image Online: Free Photo Cropper | Artify Tools",
  seoDescription: "Crop JPG, PNG and WebP images freely or to 1:1, 4:5, 16:9 and more, rotate or flip them, and set exact pixels. Free, private, in your browser.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose or drop one image.",
    "Pick a shape such as Free, 1:1 or 16:9.",
    "Drag the box to move it and its corners to resize, or type exact pixel values. Rotate or flip if needed.",
    "Press Crop image and download the result.",
  ],
  examples: [
    { label: "Profile photo", input: "portrait.jpg 3024×4032 · 1:1", output: "portrait-cropped.jpg, 3024×3024 square" },
    { label: "Video thumbnail", input: "screenshot.png · 16:9", output: "screenshot-cropped.png at 16:9" },
  ],
  faqs: [
    { question: "Does cropping lower the quality?", answer: "No. The pixels you keep are not resized. PNG stays lossless; JPG and WebP are saved at high quality." },
    { question: "How do I crop to an exact pixel size?", answer: "Type the width and height in the boxes under the picture. To also make the image smaller, use Resize Image afterwards." },
    { question: "Can I crop several images at once?", answer: "This tool crops one image at a time so you can place each crop by hand. For the same centred crop on many images, use Resize Image with “Fill and crop”." },
    { question: "Is my image uploaded?", answer: "No. Your browser does all the work on your device. Nothing is sent to Artify or anyone else." },
  ],
  files: {
    inputFormats: ["JPG", "PNG", "WebP"],
    accept: ["image/jpeg", "image/png", "image/webp", ".jpg", ".jpeg", ".png", ".webp"],
    outputFormats: ["JPG", "PNG", "WebP"],
    maxFileBytes: 30_000_000,
    maxFiles: 1,
  },
  popularRank: 2.1,
  related: ["resize-image", "compress-image", "jpg-to-pdf"],
};
