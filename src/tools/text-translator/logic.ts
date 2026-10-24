/** Pure helpers for the text translator: line handling, script detection and default target (unit-tested). */
import type { TranslateLanguage } from "@/lib/ai/types";

export const MAX_TEXT_CHARS = 20_000;

export interface Lines {
  /** The original lines, so blank lines and spacing can be put back after translating. */
  lines: string[];
  /** Index into `lines` for every line that has text, in order. */
  indexes: number[];
  /** The text of those lines, trimmed. This is what gets translated. */
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

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_SCRIPT = /[A-Za-zÀ-ɏ]/g;

/** Rough script of a text, from the share of Arabic-script versus Latin letters. */
export function detectScript(text: string): "arabic" | "latin" | "other" {
  const arabic = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const latin = text.match(LATIN_SCRIPT)?.length ?? 0;
  if (arabic === 0 && latin === 0) return "other";
  return arabic >= latin ? "arabic" : "latin";
}

/** Arabic text is most often translated into English, and anything else into Arabic. */
export function defaultTarget(text: string, fallback: TranslateLanguage): TranslateLanguage {
  const script = detectScript(text);
  if (script === "arabic") return "en";
  if (script === "latin") return "ar";
  return fallback;
}

/** Same language as the chosen target (by script only), so we can warn instead of "translating" it. */
export function looksLikeTarget(text: string, target: TranslateLanguage): boolean {
  const script = detectScript(text);
  if (script === "other") return false;
  if (target === "ar" || target === "fa" || target === "ur") return script === "arabic";
  if (target === "en") return script === "latin" && !/[^\x00-\x7F]/.test(text.replace(/[‘-‟–—… ]/g, ""));
  return false;
}
