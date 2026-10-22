/** Browser JPEG encoder for compressPdf, using a canvas. */
import type { JpegEncoder } from "./compress";

export const canvasJpegEncoder: JpegEncoder = async (input, maxSide, quality) => {
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let release = () => {};
  if (input.kind === "jpeg") {
    // PDF viewers ignore a JPEG's EXIF rotation, so we must too ("none"), or pages would change.
    const bitmap = await createImageBitmap(new Blob([input.bytes.slice().buffer as ArrayBuffer], { type: "image/jpeg" }), { imageOrientation: "none" });
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    release = () => bitmap.close();
  } else {
    const raw = document.createElement("canvas");
    raw.width = input.width;
    raw.height = input.height;
    const rctx = raw.getContext("2d");
    if (!rctx) return null;
    rctx.putImageData(new ImageData(input.rgba as unknown as Uint8ClampedArray<ArrayBuffer>, input.width, input.height), 0, 0);
    source = raw;
    width = input.width;
    height = input.height;
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h };
  } finally {
    release();
  }
};
