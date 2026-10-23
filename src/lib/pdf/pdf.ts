/**
 * Thin wrapper around pdf-lib for the browser PDF tools. pdf-lib is loaded on demand,
 * so pages that never touch a PDF don't download it. Errors are reported as codes.
 */
import type { PDFDocument as PDFDocumentType } from "pdf-lib";

export type PdfErrorCode = "encrypted" | "invalid";

export class PdfError extends Error {
  constructor(public code: PdfErrorCode) {
    super(code);
  }
}

export async function lib() {
  return import("pdf-lib");
}

export interface LoadedPdf {
  bytes: Uint8Array;
  pageCount: number;
}

/** Reads a PDF and checks it can be edited: valid and not password-protected. */
export async function inspectPdf(bytes: Uint8Array): Promise<LoadedPdf> {
  const doc = await open(bytes);
  return { bytes, pageCount: doc.getPageCount() };
}

export async function open(bytes: Uint8Array): Promise<PDFDocumentType> {
  const { PDFDocument, EncryptedPDFError } = await lib();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError || /encrypt/i.test(String((err as Error)?.message))) throw new PdfError("encrypted");
    throw new PdfError("invalid");
  }
}

export async function finish(doc: PDFDocumentType): Promise<Uint8Array> {
  doc.setProducer("Artify Tools (tools.artifysols.com)");
  doc.setCreator("Artify Tools");
  doc.setModificationDate(new Date());
  return doc.save({ useObjectStreams: true });
}

/** Merges whole documents in the given order. `onProgress` gets 0–1 per document copied. */
export async function mergePdfs(inputs: Uint8Array[], onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  const { PDFDocument } = await lib();
  const out = await PDFDocument.create();
  for (let i = 0; i < inputs.length; i++) {
    const src = await open(inputs[i]!);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
    onProgress?.((i + 1) / inputs.length);
    await new Promise((r) => setTimeout(r, 0)); // let the progress bar paint between documents
  }
  return finish(out);
}

/** Creates one new PDF per group of 1-based page numbers. */
export async function splitPdf(input: Uint8Array, groups: number[][], onProgress?: (fraction: number) => void): Promise<Uint8Array[]> {
  const { PDFDocument } = await lib();
  const src = await open(input);
  const results: Uint8Array[] = [];
  for (let i = 0; i < groups.length; i++) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, groups[i]!.map((p) => p - 1));
    for (const p of pages) out.addPage(p);
    results.push(await finish(out));
    onProgress?.((i + 1) / groups.length);
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
  }
  return results;
}
