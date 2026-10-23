/** Turning OCR text into paragraphs (pure, unit-tested). */

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/g;
const LETTER = /\p{L}/gu;

export function isRtl(text: string): boolean {
  const letters = text.match(LETTER)?.length ?? 0;
  return letters > 0 && (text.match(RTL)?.length ?? 0) / letters > 0.5;
}

export interface OcrParagraph {
  text: string;
  rtl: boolean;
}

/** Tesseract separates paragraphs with blank lines; lines inside a paragraph are joined (hyphenated words re-joined). */
export function toParagraphs(text: string): OcrParagraph[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .reduce((acc, line) => (!acc ? line : /[A-Za-z]-$/.test(acc) ? acc.slice(0, -1) + line : `${acc} ${line}`), ""),
    )
    .filter(Boolean)
    .map((t) => ({ text: t, rtl: isRtl(t) }));
}

/** Plain text for copying: paragraphs separated by blank lines, pages by a marker line. */
export function joinPages(pages: string[], pageLabel: (n: number) => string): string {
  if (pages.length === 1) return pages[0]!.trim();
  return pages.map((p, i) => `${pageLabel(i + 1)}\n\n${p.trim()}`).join("\n\n");
}
