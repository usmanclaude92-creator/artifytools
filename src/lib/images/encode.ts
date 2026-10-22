/** Browser-side image decoding and encoding with a canvas. */
import { MIME, type OutputFormat } from "./compress";

export class ImageReadError extends Error {}

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  hasAlpha: boolean;
}

const MAX_SIDE = 16_000;

/** Decodes a file (phone photos are turned upright) and checks whether it uses transparency. */
export async function loadImage(file: File): Promise<LoadedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageReadError("decode");
  }
  if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE) {
    bitmap.close();
    throw new ImageReadError("too-large");
  }
  let hasAlpha = false;
  if (file.type !== "image/jpeg") {
    const probe = document.createElement("canvas");
    const w = Math.min(128, bitmap.width);
    const h = Math.min(128, bitmap.height);
    probe.width = w;
    probe.height = h;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i]! < 255) {
          hasAlpha = true;
          break;
        }
      }
    }
  }
  return { bitmap, width: bitmap.width, height: bitmap.height, hasAlpha };
}

export interface Encoded {
  blob: Blob;
  format: OutputFormat;
  width: number;
  height: number;
}

/**
 * Draws the image at `scale` and encodes it. JPEG gets a white background (it has no
 * transparency). If the browser can't write the requested format (Safari can't write WebP),
 * it falls back to JPEG, or PNG when transparency matters.
 */
export async function encodeImage(img: LoadedImage, format: OutputFormat, quality: number, scale: number): Promise<Encoded> {
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const draw = (fmt: OutputFormat) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageReadError("decode");
    if (fmt === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img.bitmap, 0, 0, width, height);
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, MIME[fmt], quality));
  };
  let blob = await draw(format);
  let actual = format;
  if (!blob || blob.type !== MIME[format]) {
    actual = img.hasAlpha ? "png" : "jpeg";
    blob = await draw(actual);
  }
  if (!blob) throw new ImageReadError("decode");
  return { blob, format: actual, width, height };
}

/** Draws `plan` (a part of `source` placed on a new canvas) and encodes it, with the same format fallback as encodeImage. */
export async function encodePlan(
  source: CanvasImageSource,
  plan: { canvas: { width: number; height: number }; src: { x: number; y: number; w: number; h: number }; dst: { x: number; y: number; w: number; h: number } },
  format: OutputFormat,
  quality: number,
  hasAlpha: boolean,
): Promise<Encoded> {
  const { width, height } = plan.canvas;
  const draw = (fmt: OutputFormat) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageReadError("decode");
    if (fmt === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = "high";
    const { src: s, dst: d } = plan;
    ctx.drawImage(source, s.x, s.y, s.w, s.h, d.x, d.y, d.w, d.h);
    return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => { canvas.width = canvas.height = 0; resolve(b); }, MIME[fmt], quality));
  };
  let blob = await draw(format);
  let actual = format;
  if (!blob || blob.type !== MIME[format]) {
    actual = hasAlpha ? "png" : "jpeg";
    blob = await draw(actual);
  }
  if (!blob) throw new ImageReadError("decode");
  return { blob, format: actual, width, height };
}

/** The output format for "keep original": PNG/WebP stay as they are, everything else becomes JPEG. */
export function originalFormat(mime: string): OutputFormat {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpeg";
}
