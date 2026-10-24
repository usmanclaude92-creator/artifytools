/** Pure helpers for the text translator: line handling (unit-tested). */
/** Translation runs on the device, so the limit keeps a single run to a sensible time. */
export const MAX_TEXT_CHARS = 10_000;

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
