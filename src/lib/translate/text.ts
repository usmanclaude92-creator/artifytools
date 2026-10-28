/** Sentence handling and the translate loop for the browser-local translator (unit-tested). */
import { splitLong } from "./chunks";
import type { LocalTranslator } from "./local";

/** Longest piece handed to the model at once; the models are trained on sentences. */
const PIECE_CHARS = 350;

/** Splits one paragraph into sentences (and cuts any very long one), the unit the model translates best. */
export function toPieces(segment: string): string[] {
  return segment
    .split(/(?<=[.!?؟۔。])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => splitLong(s, PIECE_CHARS));
}

/**
 * Translates each paragraph sentence by sentence and returns one string per paragraph,
 * or null if `isStopped` turned true part way through.
 */
export async function translateParagraphs(
  run: LocalTranslator,
  paragraphs: string[],
  onProgress: (done: number, total: number) => void,
  isStopped: () => boolean,
): Promise<string[] | null> {
  const pieces = paragraphs.map(toPieces);
  const total = pieces.reduce((n, p) => n + p.length, 0);
  let done = 0;
  const out: string[] = [];
  for (const sentences of pieces) {
    const parts: string[] = [];
    for (const sentence of sentences) {
      if (isStopped()) return null;
      onProgress(++done, total);
      parts.push(await run.translate(sentence));
    }
    out.push(parts.join(" "));
  }
  return out;
}
