/** PDF → plain text in the browser: pdf.js reads positioned text, text-layout rebuilds lines or paragraphs. */
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { readPageText, type PageText } from "./to-word";
import { bodySize, groupLines, lineRuns, pageBlocks, type TextItem } from "./text-layout";

export type TextMode = "paragraphs" | "lines";

/** One page's text from its positioned items. Empty string when the page has no text. */
export function pageToText(items: TextItem[], width: number, body: number, mode: TextMode): string {
  if (mode === "lines") {
    return groupLines(items)
      .map((l) => lineRuns(l).map((r) => r.text).join("").replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }
  return pageBlocks(items, width, body)
    .map((b) => b.runs.map((r) => r.text).join("").replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Joins page texts; with markers each page starts with a label line. Pages with no text are skipped in the body. */
export function joinText(pages: { n: number; text: string }[], markers: boolean, label: (n: number) => string): string {
  if (!markers) return pages.map((p) => p.text.trim()).filter(Boolean).join("\n\n");
  return pages.map((p) => `${label(p.n)}\n\n${p.text.trim()}`.trimEnd()).join("\n\n\n");
}

export interface ExtractedPage {
  n: number;
  text: string;
  /** True when the page had no selectable text. */
  scanned: boolean;
}

/** Reads every page. Pages with no selectable text come back with `scanned: true` and an empty `text`. */
export async function extractPages(doc: PDFDocumentProxy, mode: TextMode, onProgress?: (done: number, total: number) => void): Promise<ExtractedPage[]> {
  const total = doc.numPages;
  const raw: PageText[] = [];
  for (let p = 1; p <= total; p++) {
    raw.push(await readPageText(doc, p));
    onProgress?.(p, total);
  }
  const body = bodySize(raw.flatMap((p) => p.items));
  return raw.map((p, i) => {
    const text = pageToText(p.items, p.width, body, mode);
    return { n: i + 1, text, scanned: !text.trim() };
  });
}
