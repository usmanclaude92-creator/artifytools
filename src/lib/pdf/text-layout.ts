/**
 * Rebuilds lines, paragraphs and headings from positioned PDF text (pure, unit-tested).
 * Coordinates are PDF points with y measured from the TOP of the page.
 */

export interface TextItem {
  str: string;
  x: number;
  /** Baseline, from the top of the page. */
  y: number;
  width: number;
  size: number;
  rtl: boolean;
  bold: boolean;
  italic: boolean;
}

export interface Run {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface Block {
  kind: "heading" | "paragraph";
  level: 1 | 2 | 3;
  runs: Run[];
  align: "start" | "center";
  rtl: boolean;
  size: number;
}

interface Line {
  items: TextItem[];
  y: number;
  left: number;
  right: number;
  size: number;
  rtl: boolean;
}

/** Arabic presentation forms (shaped glyph codes some PDFs use) back to normal letters, so the text is editable and searchable. */
export function normalizeArabic(text: string): string {
  return text.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]+/g, (m) => m.normalize("NFKC"));
}

const RTL_CHARS = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

export function groupLines(items: TextItem[]): Line[] {
  const sorted = items.filter((i) => i.str.trim() || i.str === " ").sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];
  for (const it of sorted) {
    if (!it.str.trim()) continue;
    const line = lines.find((l) => Math.abs(l.y - it.y) <= Math.max(2, Math.min(l.size, it.size) * 0.45));
    if (line) line.items.push(it);
    else lines.push({ items: [it], y: it.y, left: 0, right: 0, size: 0, rtl: false });
  }
  for (const l of lines) {
    const chars = l.items.reduce((s, i) => s + i.str.length, 0);
    const rtlChars = l.items.reduce((s, i) => s + [...i.str].filter((c) => RTL_CHARS.test(c)).length, 0);
    l.rtl = rtlChars > chars * 0.3;
    l.items.sort((a, b) => (l.rtl ? b.x - a.x : a.x - b.x));
    l.left = Math.min(...l.items.map((i) => i.x));
    l.right = Math.max(...l.items.map((i) => i.x + i.width));
    // Size weighted by text length, so one big drop cap doesn't make the line a heading.
    const weights = l.items.map((i) => i.str.length);
    l.size = l.items.reduce((s, i, k) => s + i.size * weights[k]!, 0) / Math.max(1, weights.reduce((a, b) => a + b, 0));
  }
  return lines.sort((a, b) => a.y - b.y);
}

/** Joins a line's items into runs, adding spaces where the gap between items suggests one. */
export function lineRuns(line: Line): Run[] {
  const runs: Run[] = [];
  let prev: TextItem | null = null;
  for (const it of line.items) {
    let text = it.str;
    if (prev) {
      const gap = line.rtl ? prev.x - (it.x + it.width) : it.x - (prev.x + prev.width);
      const needsSpace = gap > it.size * 0.2 && !/\s$/.test(prev.str) && !/^\s/.test(text);
      if (needsSpace) text = " " + text;
    }
    const last = runs[runs.length - 1];
    if (last && last.bold === it.bold && last.italic === it.italic) last.text += text;
    else runs.push({ text, bold: it.bold, italic: it.italic });
    prev = it;
  }
  return runs;
}

/** The most common font size by amount of text: the document's body size. */
export function bodySize(items: TextItem[]): number {
  const counts = new Map<number, number>();
  for (const i of items) {
    const k = Math.round(i.size * 2) / 2;
    counts.set(k, (counts.get(k) ?? 0) + i.str.length);
  }
  let best = 11, n = -1;
  for (const [k, v] of counts) {
    if (v > n) {
      best = k;
      n = v;
    }
  }
  return best;
}

function appendRuns(target: Run[], add: Run[], joinWithSpace: boolean) {
  const out = add.map((r) => ({ ...r }));
  const last = target[target.length - 1];
  if (last) {
    if (/-$/.test(last.text) && !joinWithSpace) last.text = last.text.slice(0, -1);
    else if (!/\s$/.test(last.text)) out[0]!.text = " " + out[0]!.text;
  }
  for (const r of out) {
    const l = target[target.length - 1];
    if (l && l.bold === r.bold && l.italic === r.italic) l.text += r.text;
    else target.push(r);
  }
}

/** Turns one page's text into blocks. `body` is the document-wide body size. */
export function pageBlocks(items: TextItem[], pageWidth: number, body: number): Block[] {
  const lines = groupLines(items);
  if (!lines.length) return [];
  const textLeft = Math.min(...lines.map((l) => l.left));
  const textRight = Math.max(...lines.map((l) => l.right));
  const textWidth = Math.max(1, textRight - textLeft);
  const blocks: (Block & { lastLine: Line })[] = [];
  let current: (Block & { lastLine: Line }) | null = null;

  for (const line of lines) {
    const ratio = line.size / body;
    const kind: Block["kind"] = ratio >= 1.15 && line.items.reduce((s, i) => s + i.str.length, 0) < 140 ? "heading" : "paragraph";
    const level: Block["level"] = ratio >= 1.6 ? 1 : ratio >= 1.3 ? 2 : 3;
    const mid = (line.left + line.right) / 2;
    const centered = Math.abs(mid - pageWidth / 2) < pageWidth * 0.04 && line.right - line.left < textWidth * 0.8 && line.left - textLeft > textWidth * 0.08;
    const runs = lineRuns(line);

    if (current) {
      const prev = current.lastLine;
      const gap = line.y - prev.y;
      const sameStyle = current.kind === kind && Math.abs(prev.size - line.size) < 0.6 && current.rtl === line.rtl;
      // The previous line stopped well short of the margin: it ended its paragraph.
      const prevShort = prev.rtl ? prev.left - textLeft > textWidth * 0.15 : textRight - prev.right > textWidth * 0.15;
      const normalGap = gap <= Math.max(prev.size, line.size) * 1.75;
      const indented = !line.rtl && line.left - textLeft > body * 1.2 && line.left - prev.left > body * 1.2;
      if (sameStyle && normalGap && !prevShort && !indented && !centered && current.align === "start") {
        appendRuns(current.runs, runs, false);
        current.lastLine = line;
        continue;
      }
      if (sameStyle && kind === "heading" && normalGap) {
        appendRuns(current.runs, runs, true);
        current.lastLine = line;
        continue;
      }
    }
    current = { kind, level, runs, align: centered ? "center" : "start", rtl: line.rtl, size: line.size, lastLine: line };
    blocks.push(current);
  }
  return blocks.map(({ lastLine: _ignored, ...b }) => {
    void _ignored;
    return b;
  });
}
