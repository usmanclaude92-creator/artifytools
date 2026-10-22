/**
 * Browser-side image preparation for Images → PDF. Upright JPEGs pass through untouched;
 * rotated JPEGs and other formats (PNG with transparency, WebP, GIF…) are decoded by the
 * browser — which applies EXIF rotation — and re-encoded.
 */
import { jpegOrientation, type PreparedImage } from "./images";

export class ImageDecodeError extends Error {}

const MAX_SIDE = 16_000; // beyond this, canvases fail in some browsers

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageDecodeError("decode");
  }
  try {
    const { width, height } = bitmap;
    if (width > MAX_SIDE || height > MAX_SIDE) throw new ImageDecodeError("too-large");
    if (isJpeg && jpegOrientation(bytes) === 1) return { format: "jpg", bytes, width, height };
    if (isPng) return { format: "png", bytes, width, height };

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageDecodeError("decode");
    ctx.drawImage(bitmap, 0, 0);
    // Rotated JPEGs stay JPEG (photos); anything else becomes PNG to keep transparency and sharp edges.
    const type = isJpeg ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
    if (!blob) throw new ImageDecodeError("decode");
    return { format: isJpeg ? "jpg" : "png", bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
  } finally {
    bitmap.close();
  }
}
