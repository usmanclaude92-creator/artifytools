/** Browser-side helpers that turn a drawn, typed or uploaded signature into a tight transparent PNG. */

export interface SignatureImage {
  png: Uint8Array;
  url: string;
  /** Pixel size of the trimmed image. */
  width: number;
  height: number;
}

/** Crops a canvas to its non-transparent pixels plus `pad`; returns null when it is empty. */
export function trimCanvas(src: HTMLCanvasElement, pad = 8): HTMLCanvasElement | null {
  const g = src.getContext("2d")!;
  const { width: w, height: h } = src;
  const data = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

export async function canvasToSignature(c: HTMLCanvasElement): Promise<SignatureImage> {
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
  return { png: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob), width: c.width, height: c.height };
}

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

/** Renders text in `fontFamily` (already loaded) as a trimmed transparent image. */
export async function typedSignature(text: string, fontFamily: string, color: string, px = 120): Promise<SignatureImage | null> {
  await document.fonts.load(`${px}px ${fontFamily}`, text).catch(() => {});
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const font = `${px}px ${fontFamily}`;
  g.font = font;
  c.width = Math.ceil(g.measureText(text).width + px * 1.2);
  c.height = Math.ceil(px * 2);
  const d = c.getContext("2d")!;
  d.font = font;
  d.fillStyle = color;
  d.textBaseline = "middle";
  d.textAlign = "center";
  d.direction = RTL.test(text) ? "rtl" : "ltr";
  d.fillText(text, c.width / 2, c.height / 2);
  const t = trimCanvas(c, Math.round(px * 0.08));
  return t ? canvasToSignature(t) : null;
}

/**
 * Loads an image file and, when `clearBackground` is set, makes light paper pixels transparent
 * (a scanned or photographed signature on white paper), then trims it.
 */
export async function uploadedSignature(file: Blob, clearBackground: boolean): Promise<SignatureImage | null> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * scale));
  c.height = Math.max(1, Math.round(bmp.height * scale));
  const g = c.getContext("2d")!;
  g.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  if (clearBackground) {
    const img = g.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
      // Fully clear above 215, fade between 150 and 215 so stroke edges stay smooth.
      const keep = lum >= 215 ? 0 : lum <= 150 ? 1 : (215 - lum) / 65;
      d[i + 3] = Math.round(d[i + 3]! * keep);
    }
    g.putImageData(img, 0, 0);
  }
  const t = trimCanvas(c, 4);
  return t ? canvasToSignature(t) : null;
}

export interface TextBlockImage extends SignatureImage {
  /** Size of the block in PDF points at the requested font size. */
  wPt: number;
  hPt: number;
}

/**
 * Renders (multi-line) text as a transparent PNG drawn by the browser, so any script, Arabic
 * included, comes out shaped correctly. `pt` is the font size it should have on the page.
 */
export async function textBlock(text: string, opts: { pt: number; color: string; bold: boolean; family: string; scale?: number }): Promise<TextBlockImage> {
  const scale = opts.scale ?? 4;
  const px = opts.pt * scale;
  const font = `${opts.bold ? 700 : 400} ${px}px ${opts.family}`;
  const lines = text.split(/\r?\n/);
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  g.font = font;
  const lineH = px * 1.3;
  const pad = Math.ceil(px * 0.12);
  c.width = Math.max(1, Math.ceil(Math.max(...lines.map((l) => g.measureText(l || " ").width)) + pad * 2));
  c.height = Math.ceil(lineH * lines.length + pad * 2);
  const d = c.getContext("2d")!;
  d.font = font;
  d.fillStyle = opts.color;
  d.textBaseline = "middle";
  lines.forEach((l, i) => {
    const rtl = RTL.test(l);
    d.direction = rtl ? "rtl" : "ltr";
    d.textAlign = rtl ? "right" : "left";
    d.fillText(l, rtl ? c.width - pad : pad, pad + lineH * (i + 0.5));
  });
  const img = await canvasToSignature(c);
  return { ...img, wPt: c.width / scale, hPt: c.height / scale };
}
