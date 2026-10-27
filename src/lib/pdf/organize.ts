/** Rebuilds a PDF from a list of pages: any order, any subset, with extra rotation per page. Lossless. */
import { finish, lib, open } from "./pdf";

export interface OrganizedPage {
  /** 1-based page number in the source PDF. */
  source: number;
  /** Extra rotation in degrees clockwise (multiples of 90). */
  turn: number;
}

export async function organizePdf(bytes: Uint8Array, pages: OrganizedPage[], onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages to keep.");
  const { PDFDocument, degrees } = await lib();
  const src = await open(bytes);
  const total = src.getPageCount();
  if (pages.some((p) => !Number.isInteger(p.source) || p.source < 1 || p.source > total)) throw new Error("Page out of range.");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pages.map((p) => p.source - 1));
  copied.forEach((page, i) => {
    const turn = pages[i]!.turn;
    if (turn % 360) page.setRotation(degrees((((page.getRotation().angle + turn) % 360) + 360) % 360));
    out.addPage(page);
    onProgress?.((i + 1) / copied.length);
  });
  return finish(out);
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
