/**
 * Renders PDF pages to images with pdf.js, in the browser. pdf.js is loaded on
 * demand so tools that don't need it stay small.
 */
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { PdfError } from "./pdf";

export const PDFJS_VERSION = "4.10.38";
const ASSETS = `/vendor/pdfjs-${PDFJS_VERSION}/`;
let lib: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfJs() {
  lib ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((m) => {
    const pdfjs = m as unknown as typeof import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `${ASSETS}pdf.worker.min.mjs`;
    return pdfjs;
  });
  return lib;
}

export type RenderedDoc = PDFDocumentProxy;

export async function openPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  try {
    // pdf.js takes ownership of the buffer, so give it a copy.
    return await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false, cMapUrl: `${ASSETS}cmaps/`, cMapPacked: true, standardFontDataUrl: `${ASSETS}standard_fonts/` }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "PasswordException") throw new PdfError("encrypted");
    throw new PdfError("invalid");
  }
}

/** Largest canvas side and area most browsers accept. */
export const MAX_SIDE = 12_000;
export const MAX_PIXELS = 40_000_000;

/** Scale for a page of `widthPt × heightPt` points at `dpi`, reduced to stay inside canvas limits. */
export function scaleFor(widthPt: number, heightPt: number, dpi: number): number {
  let scale = dpi / 72;
  const w = widthPt * scale, h = heightPt * scale;
  const side = Math.max(w, h);
  if (side > MAX_SIDE) scale *= MAX_SIDE / side;
  const area = widthPt * scale * heightPt * scale;
  if (area > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / area);
  return scale;
}

export type ImageFormat = "jpg" | "png";

export interface RenderedPage {
  page: number;
  width: number;
  height: number;
  blob: Blob;
}

export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, opts: { dpi: number; format: ImageFormat; quality: number }): Promise<RenderedPage> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: scaleFor(base.width, base.height, opts.dpi) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d", { alpha: opts.format === "png" })!;
  if (opts.format === "jpg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: ctx, viewport, background: opts.format === "jpg" ? "#ffffff" : undefined }).promise;
  page.cleanup();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), opts.format === "png" ? "image/png" : "image/jpeg", opts.quality),
  );
  const out = { page: pageNumber, width: canvas.width, height: canvas.height, blob };
  canvas.width = canvas.height = 0; // release memory early (Safari)
  return out;
}
