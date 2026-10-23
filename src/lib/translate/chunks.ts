/** Splitting a document into translate requests and putting it back together (pure, unit-tested). */

export const CHUNK_CHARS = 5_000;
export const CHUNK_SEGMENTS = 100;
export const MAX_DOCUMENT_CHARS = 60_000;

export interface Piece {
  /** Index of the paragraph this piece belongs to. */
  segment: number;
  text: string;
}

/** Splits text longer than `max` at sentence ends (or spaces) into parts no longer than `max`. */
export function splitLong(text: string, max = CHUNK_CHARS): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf("。"), window.lastIndexOf("؟ "), window.lastIndexOf("! "), window.lastIndexOf("? "));
    const at = cut > max * 0.5 ? cut + 1 : window.lastIndexOf(" ") > max * 0.5 ? window.lastIndexOf(" ") : max;
    parts.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Groups paragraphs into requests of at most CHUNK_CHARS characters and CHUNK_SEGMENTS items. */
export function makeChunks(segments: string[]): Piece[][] {
  const pieces: Piece[] = segments.flatMap((s, i) => splitLong(s).map((text) => ({ segment: i, text })));
  const chunks: Piece[][] = [];
  let current: Piece[] = [];
  let size = 0;
  for (const p of pieces) {
    if (current.length && (size + p.text.length > CHUNK_CHARS || current.length >= CHUNK_SEGMENTS)) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(p);
    size += p.text.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

/** Puts translated pieces back into one string per original paragraph. */
export function reassemble(count: number, chunks: Piece[][], translated: string[][]): string[] {
  const out = Array.from({ length: count }, () => [] as string[]);
  chunks.forEach((chunk, c) => chunk.forEach((p, k) => out[p.segment]!.push(translated[c]![k]!)));
  return out.map((parts) => parts.join(" "));
}

export const RTL_LANGUAGES = new Set(["ar", "ur", "fa"]);
