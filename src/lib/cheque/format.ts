import type { DateFormat } from "./templates";

/** Formats an ISO date (YYYY-MM-DD) for a cheque. Box formats return the digits only. */
export function formatChequeDate(iso: string, format: DateFormat): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const [, y, mo, d] = m as unknown as [string, string, string, string];
  switch (format) {
    case "DD/MM/YYYY": return `${d}/${mo}/${y}`;
    case "DD-MM-YYYY": return `${d}-${mo}-${y}`;
    case "YYYY-MM-DD": return `${y}-${mo}-${d}`;
    case "MM/DD/YYYY": return `${mo}/${d}/${y}`;
    case "DDMMYYYY-boxes": return `${d}${mo}${y}`;
    case "YYYYMMDD-boxes": return `${y}${mo}${d}`;
  }
}

/** "1250.5" with 3 decimals → "1,250.500"; optional protective asterisks: "**1,250.500**". */
export function formatFigures(whole: number, fraction: number, decimals: number, protect: boolean): string {
  const w = whole.toLocaleString("en-US");
  const text = decimals ? `${w}.${String(fraction).padStart(decimals, "0")}` : w;
  return protect ? `**${text}**` : text;
}

/**
 * Splits text into two lines that fit `width1` and `width2`, shrinking the font size if needed.
 * `measure(text, size)` returns the rendered width in the same unit as the widths.
 */
export function fitTwoLines(
  text: string,
  width1: number,
  width2: number,
  measure: (text: string, size: number) => number,
  size: number,
  minSize: number,
): { line1: string; line2: string; size: number } {
  const words = text.split(/\s+/).filter(Boolean);
  for (let s = size; s >= minSize - 1e-9; s -= 0.5) {
    let i = 0;
    let line1 = "";
    while (i < words.length) {
      const next = line1 ? `${line1} ${words[i]}` : words[i]!;
      if (measure(next, s) > width1) break;
      line1 = next;
      i++;
    }
    const line2 = words.slice(i).join(" ");
    if (line1 && measure(line2, s) <= width2) return { line1, line2, size: s };
  }
  // Still too long at the minimum size: keep the split at the minimum size (the preview flags overflow).
  const half = Math.ceil(words.length / 2);
  return { line1: words.slice(0, half).join(" "), line2: words.slice(half).join(" "), size: minSize };
}

export interface BatchRow {
  payee: string;
  amount: string;
  date: string;
}

export type BatchError = { line: number; problem: "columns" | "date" };

/**
 * Parses pasted rows: payee, amount, date (YYYY-MM-DD or DD/MM/YYYY). Accepts tabs (from Excel),
 * commas or semicolons. A header row starting with "payee"/"المستفيد" is skipped.
 */
export function parseBatch(text: string): { rows: BatchRow[]; errors: BatchError[] } {
  const rows: BatchRow[] = [];
  const errors: BatchError[] = [];
  text.split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;
    const sep = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    // Split on the last two separators so payee names may contain commas.
    const parts = line.split(sep).map((p) => p.trim());
    if (idx === 0 && /^(payee|name|المستفيد|الاسم)/i.test(parts[0] ?? "")) return;
    if (parts.length < 3) return errors.push({ line: idx + 1, problem: "columns" });
    const date = parts.pop()!;
    const amount = parts.pop()!;
    const payee = parts.join(sep === "\t" ? " " : `${sep} `).trim();
    const iso = toIsoDate(date);
    if (!iso) return errors.push({ line: idx + 1, problem: "date" });
    rows.push({ payee, amount, date: iso });
  });
  return { rows, errors };
}

/** "2026-11-05", "05/11/2026", "5-11-2026" → "2026-11-05" (day first for slashed dates). */
export function toIsoDate(s: string): string | null {
  const t = s.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t))) [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
