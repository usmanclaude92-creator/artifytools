/**
 * Rebuilding tables from positioned PDF text (pure, unit-tested): lines are split into
 * cells at wide gaps, and columns come from the vertical "rivers" of whitespace that run
 * through the page's lines.
 */
import { groupLines, type TextItem } from "./text-layout";

export interface TableCell {
  text: string;
  bold: boolean;
}

export interface PageTable {
  rows: (TableCell | null)[][];
  columns: number;
  rtl: boolean;
}

interface Span {
  x0: number;
  x1: number;
  text: string;
  bold: boolean;
}

const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const isRtlText = (t: string) => (t.match(RTL)?.length ?? 0) > t.replace(/\s/g, "").length / 2;

/**
 * Items on one line → cells: neighbours closer than ~1 em belong to the same cell. Within a
 * cell, Arabic/Hebrew pieces are joined right to left (PDFs often store them glyph by glyph
 * in visual order), everything else left to right.
 */
export function lineCells(items: TextItem[], _lineRtl?: boolean): Span[] {
  void _lineRtl;
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const groups: TextItem[][] = [];
  let end = -Infinity;
  for (const it of sorted) {
    const last = groups[groups.length - 1];
    if (last && it.x - end < Math.max(it.size, 6) * 0.9) {
      last.push(it);
      end = Math.max(end, it.x + it.width);
    } else {
      groups.push([it]);
      end = it.x + it.width;
    }
  }
  return groups
    .map((g) => {
      // Visual order (left to right) with a flag for the space after each piece.
      const vis = g.map((it, k) => {
        const next = g[k + 1];
        const space = Boolean(next && next.x - (it.x + it.width) > it.size * 0.15 && !/\s$/.test(it.str) && !/^\s/.test(next.str));
        return { str: it.str, space, rtl: /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(it.str) };
      });
      // Runs of right-to-left pieces read right to left; whitespace-only pieces join the run before them.
      const runs: { rtl: boolean; parts: typeof vis }[] = [];
      for (const v of vis) {
        const last = runs[runs.length - 1];
        const dir = !v.str.trim() && last ? last.rtl : v.rtl;
        if (last && last.rtl === dir) last.parts.push(v);
        else runs.push({ rtl: dir, parts: [v] });
      }
      const base = isRtlText(g.map((i) => i.str).join(""));
      const ordered = base ? [...runs].reverse() : runs;
      const text = ordered
        .map((r) => {
          const parts = r.rtl ? [...r.parts].reverse() : r.parts;
          // In a reversed run, the space "after" a piece visually sits before it logically.
          return parts.map((p, k) => (r.rtl ? (k > 0 && p.space ? " " : "") + p.str : p.str + (p.space && k < parts.length - 1 ? " " : ""))).join("");
        })
        .join(" ");
      return { x0: Math.min(...g.map((i) => i.x)), x1: Math.max(...g.map((i) => i.x + i.width)), text: text.replace(/\s+/g, " ").trim(), bold: g.every((i) => i.bold) };
    })
    .filter((c) => c.text);
}

/** Column boundaries: x positions that no cell (of lines with 2+ cells) covers. */
export function columnBreaks(lines: Span[][], minGap = 3): number[] {
  const multi = lines.filter((l) => l.length > 1);
  if (!multi.length) return [];
  const spans = multi.flat().map((c) => [c.x0, c.x1] as const).sort((a, b) => a[0] - b[0]);
  const breaks: number[] = [];
  let end = spans[0]![1];
  for (const [x0, x1] of spans.slice(1)) {
    if (x0 - end >= minGap) breaks.push((x0 + end) / 2);
    end = Math.max(end, x1);
  }
  return breaks;
}

export function pageTable(items: TextItem[]): PageTable {
  const lines = groupLines(items);
  const rtlLines = lines.filter((l) => l.rtl).length;
  const rtl = rtlLines > lines.length / 2;
  const cellLines = lines.map((l) => lineCells(l.items, l.rtl));
  let breaks = columnBreaks(cellLines);
  const rawCol = (c: Span, b: number[]) => {
    const mid = (c.x0 + c.x1) / 2;
    let i = 0;
    while (i < b.length && mid > b[i]!) i++;
    return i;
  };
  // A header aligned left and numbers aligned right in the same column leave a gap between them;
  // merge neighbouring columns that never both have content on the same line.
  for (let changed = true; changed && breaks.length; ) {
    changed = false;
    for (let k = 0; k < breaks.length; k++) {
      const clash = cellLines.some((cells) => cells.length > 1 && cells.some((c) => rawCol(c, breaks) === k) && cells.some((c) => rawCol(c, breaks) === k + 1));
      if (!clash) {
        breaks = breaks.filter((_, j) => j !== k);
        changed = true;
        break;
      }
    }
  }
  const columns = breaks.length + 1;
  const colOf = (c: Span, alone: boolean) => {
    // A title on its own line that spans several columns goes in the first column.
    const spansMany = breaks.filter((b) => b > c.x0 && b < c.x1).length >= 2;
    const i = alone && spansMany ? (rtl ? columns - 1 : 0) : rawCol(c, breaks);
    return rtl ? columns - 1 - i : i;
  };
  const rows = cellLines
    .filter((cells) => cells.length)
    .map((cells) => {
      const row: (TableCell | null)[] = Array.from({ length: columns }, () => null);
      for (const c of cells) {
        const i = colOf(c, cells.length === 1);
        const prev = row[i];
        row[i] = prev ? { text: `${prev.text} ${c.text}`, bold: prev.bold && c.bold } : { text: c.text, bold: c.bold };
      }
      return row;
    });
  return { rows, columns, rtl };
}

/** "1,250.500" → 1250.5 with its format; "15%" → 0.15; otherwise null (kept as text). */
export function parseNumber(text: string): { value: number; numFmt: string } | null {
  const t = text
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
  const m = /^(\(?)(-?)([\d,]*\d)(?:\.(\d+))?(\)?)(%?)$/.exec(t);
  if (!m) return null;
  const [, open, minus, int, dec = "", close, pct] = m;
  if (Boolean(open) !== Boolean(close)) return null;
  if (int!.includes(",") && !/^\d{1,3}(,\d{3})+$/.test(int!)) return null; // "1,2" isn't a number
  if (/^0\d/.test(int!) && !dec) return null; // leading zeros: an ID or code, keep as text
  let value = Number(`${int!.replace(/,/g, "")}.${dec || 0}`);
  if (minus || open) value = -value;
  const decimals = dec.length ? `.${"0".repeat(dec.length)}` : "";
  const base = `${int!.includes(",") ? "#,##0" : "0"}${decimals}`;
  if (pct) return { value: value / 100, numFmt: `${base}%` };
  return { value, numFmt: open ? `${base};(${base})` : base };
}
