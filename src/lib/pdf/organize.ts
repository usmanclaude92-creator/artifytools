/** Rebuilds a PDF from a list of pages: any order, any subset, with extra rotation per page. Lossless. */
import { finish, lib, open } from "./pdf";

export interface OrganizedPage {
  /** 1-based page number in the source PDF. */
  source: number;
  /** Extra rotation in degrees clockwise (multiples of 90). */
  turn: number;
}

/** A page taken from one of several source PDFs; `file` is the index into the list of inputs. */
export interface OrganizedFilePage extends OrganizedPage {
  file: number;
}

/** Builds one PDF from pages of one or more source PDFs, in the order given. */
export async function organizePdfs(inputs: Uint8Array[], pages: OrganizedFilePage[], onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages to keep.");
  const { PDFDocument, degrees } = await lib();
  const sources = await Promise.all(inputs.map((bytes) => open(bytes)));
  for (const p of pages) {
    const src = sources[p.file];
    if (!src || !Number.isInteger(p.source) || p.source < 1 || p.source > src.getPageCount()) throw new Error("Page out of range.");
  }
  const out = await PDFDocument.create();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!;
    const [page] = await out.copyPages(sources[p.file]!, [p.source - 1]);
    if (p.turn % 360) page!.setRotation(degrees((((page!.getRotation().angle + p.turn) % 360) + 360) % 360));
    out.addPage(page!);
    onProgress?.((i + 1) / pages.length);
  }
  return finish(out);
}

/** Rebuilds one PDF from a list of its own pages: any order, any subset, with extra rotation. */
export function organizePdf(bytes: Uint8Array, pages: OrganizedPage[], onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  return organizePdfs([bytes], pages.map((p) => ({ ...p, file: 0 })), onProgress);
}

/** Moves the item at `from` to position `to` (both clamped to the list). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const target = Math.max(0, Math.min(list.length - 1, to));
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item!);
  return next;
}
