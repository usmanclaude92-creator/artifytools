/** Image format conversion in the browser: decode anything the browser (or libheif, for HEIC) can read, write JPG, PNG or WebP. */

export type TargetFormat = "jpeg" | "png" | "webp";
export const TARGET_MIME: Record<TargetFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const TARGET_EXT: Record<TargetFormat, string> = { jpeg: ".jpg", png: ".png", webp: ".webp" };

export class ConvertError extends Error {
  constructor(public code: "decode" | "too-large" | "encode") {
    super(code);
  }
}

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);
const MAX_SIDE = 16_000;

/** HEIC/HEIF by MIME type, extension or the ISO-BMFF "ftyp" brand (iPhones don't always set a type). */
export function isHeicHeader(head: Uint8Array, name: string, type: string): boolean {
  if (/heic|heif/i.test(type) || /\.(heic|heif)$/i.test(name)) return true;
  if (/avif/i.test(type) || /\.avif$/i.test(name)) return false;
  if (head.length < 12) return false;
  const ascii = (a: number, b: number) => String.fromCharCode(...head.slice(a, b));
  return ascii(4, 8) === "ftyp" && HEIC_BRANDS.has(ascii(8, 12));
}

export interface Decoded {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  hasAlpha: boolean;
  heic: boolean;
}

function alphaOf(bitmap: ImageBitmap): boolean {
  const c = document.createElement("canvas");
  const w = Math.min(160, bitmap.width), h = Math.min(160, bitmap.height);
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return false;
  g.drawImage(bitmap, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 4) if (d[i]! < 255) return true;
  return false;
}

/** Decodes via an <img> element: covers SVG and anything createImageBitmap refuses. */
async function viaImgElement(file: Blob, svg: boolean): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    let w = img.naturalWidth, h = img.naturalHeight;
    if (svg && (!w || !h)) { w = 1024; h = 1024; }
    if (svg) {
      // Draw vector images at a useful size (at least 1600 px on the long side).
      const k = Math.max(1, 1600 / Math.max(w, h));
      w = Math.round(w * k);
      h = Math.round(h * k);
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return await createImageBitmap(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodeImage(file: File): Promise<Decoded> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const heic = isHeicHeader(head, file.name, file.type);
  const svg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  let bitmap: ImageBitmap | null = null;
  if (!svg) {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = null;
    }
  }
  if (!bitmap && heic) {
    try {
      const { heicTo } = await import("heic-to/next");
      bitmap = await heicTo({ blob: file, type: "bitmap" });
    } catch {
      throw new ConvertError("decode");
    }
  }
  if (!bitmap) {
    try {
      bitmap = await viaImgElement(file, svg);
    } catch {
      throw new ConvertError("decode");
    }
  }
  if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE) {
    bitmap.close();
    throw new ConvertError("too-large");
  }
  return { bitmap, width: bitmap.width, height: bitmap.height, hasAlpha: alphaOf(bitmap), heic };
}

/** Encodes a decoded image. Transparent areas get `background` in JPG, which can't be transparent. */
export async function encodeAs(img: Decoded, format: TargetFormat, quality: number, background: string): Promise<{ blob: Blob; format: TargetFormat }> {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  if (format === "jpeg") {
    g.fillStyle = background;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.drawImage(img.bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, TARGET_MIME[format], format === "png" ? undefined : quality));
  if (!blob) throw new ConvertError("encode");
  // Browsers that can't write a format fall back to PNG silently; report what was really written.
  const real: TargetFormat = blob.type === "image/jpeg" ? "jpeg" : blob.type === "image/webp" ? "webp" : "png";
  return { blob, format: real };
}

/** Short label for a file's current format, e.g. "HEIC", "PNG". */
export function formatLabel(file: File, heic: boolean): string {
  if (heic) return "HEIC";
  const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toUpperCase();
  const byType = file.type.replace(/^image\//, "").replace("svg+xml", "svg").replace("jpeg", "jpg").toUpperCase();
  return byType || (ext === "JPEG" ? "JPG" : ext) || "?";
}
