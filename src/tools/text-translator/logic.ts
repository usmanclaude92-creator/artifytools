/** Pure helpers for the text translator: line and sentence handling, and language detection (unit-tested). */
import { splitLong } from "@/lib/translate/chunks";
import type { LocalLanguage } from "@/lib/translate/local";

/** Translation runs on the device, so the limit keeps a single run to a sensible time. */
export const MAX_TEXT_CHARS = 10_000;
/** Longest piece handed to the model at once; the models are trained on sentences. */
const PIECE_CHARS = 350;

export interface Lines {
  /** The original lines, so blank lines and spacing can be put back after translating. */
  lines: string[];
  /** Index into `lines` for every line that has text, in order. */
  indexes: number[];
  /** The text of those lines, trimmed. */
  segments: string[];
}

export function splitLines(text: string): Lines {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const indexes: number[] = [];
  const segments: string[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t) {
      indexes.push(i);
      segments.push(t);
    }
  });
  return { lines, indexes, segments };
}

/** Puts translated segments back on their lines; blank lines stay where they were. */
export function joinLines(parts: Lines, translated: string[]): string {
  const out = parts.lines.map(() => "");
  parts.indexes.forEach((lineIndex, k) => {
    out[lineIndex] = translated[k] ?? "";
  });
  return out.join("\n");
}

/** Splits one line into sentences (and cuts any very long one), the unit the model translates best. */
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
