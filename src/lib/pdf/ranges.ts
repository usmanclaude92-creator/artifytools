/**
 * Page-range parsing for PDF tools. Returns error codes (not sentences) so each
 * language can phrase them. Pages are 1-based in the input and the output.
 */

export type RangeError =
  | { code: "empty" }
  | { code: "syntax"; token: string }
  | { code: "outOfBounds"; page: number; pageCount: number }
  | { code: "reversed"; token: string };

export type RangeOutcome = { ok: true; groups: number[][] } | { ok: false; error: RangeError };

/**
 * "1-3, 5, 8-" → [[1,2,3],[5],[8..last]]. Each comma-separated item becomes one group.
 * Accepts "-" "–" "—" or "to" between numbers, Arabic-Indic digits, and Arabic commas.
 */
export function parseRanges(input: string, pageCount: number): RangeOutcome {
  const normalized = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[،؛;]/g, ",")
    .replace(/[–—]|\bto\b|إلى|الى/gi, "-");
  const tokens = normalized.split(",").map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: { code: "empty" } };

  const groups: number[][] = [];
  for (const token of tokens) {
    const m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(token);
    if (!m || (!m[1] && !m[3]) || (!m[2] && !m[1])) return { ok: false, error: { code: "syntax", token } };
    const start = m[1] ? Number(m[1]) : 1;
    const end = m[2] ? (m[3] ? Number(m[3]) : pageCount) : start;
    for (const p of [start, end]) {
      if (p < 1 || p > pageCount) return { ok: false, error: { code: "outOfBounds", page: p, pageCount } };
    }
    if (end < start) return { ok: false, error: { code: "reversed", token } };
    groups.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
  }
  return { ok: true, groups };
}

/** [1,2,3] → "1-3", [5] → "5" (for file names and labels). */
export function describeGroup(pages: number[]): string {
  if (pages.length === 0) return "";
  const first = pages[0]!;
  const last = pages[pages.length - 1]!;
  const contiguous = pages.every((p, i) => p === first + i);
  if (pages.length === 1) return String(first);
  return contiguous ? `${first}-${last}` : pages.join("_");
}

/** Splits 1..pageCount into chunks of `size` pages: size 2 of 5 → [[1,2],[3,4],[5]]. */
export function chunkPages(pageCount: number, size: number): number[][] {
  const out: number[][] = [];
  for (let start = 1; start <= pageCount; start += size) {
    out.push(Array.from({ length: Math.min(size, pageCount - start + 1) }, (_, i) => start + i));
  }
  return out;
}
