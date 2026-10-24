/** Sentence handling, language detection and the translate loop shared by the browser-local translators (unit-tested). */
import { splitLong } from "./chunks";
import type { LocalLanguage, LocalTranslator } from "./local";

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

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_SCRIPT = /[A-Za-zÀ-ɏ]/g;

/** Rough script of a text, from the share of Arabic-script versus Latin letters. */
export function detectScript(text: string): "arabic" | "latin" | "other" {
  const arabic = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const latin = text.match(LATIN_SCRIPT)?.length ?? 0;
  if (arabic === 0 && latin === 0) return "other";
  return arabic >= latin ? "arabic" : "latin";
}

/** The language to translate from: Arabic script means Arabic, Latin letters mean English. */
export function detectSource(text: string, fallback: LocalLanguage): LocalLanguage {
  const script = detectScript(text);
  if (script === "arabic") return "ar";
  if (script === "latin") return "en";
  return fallback;
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
