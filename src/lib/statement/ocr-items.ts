/** Turns OCR words into the positioned text the statement reader works with (pure, unit-tested). */
import type { OcrWord } from "@/lib/ocr/ocr";
import type { TextItem } from "@/lib/pdf/text-layout";

const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/**
 * `pxPerPt` is how many image pixels make one PDF point; `origin` is where the image's top-left corner
 * sits on the page, in points. Words on one line share that line's baseline so they group into one row.
 */
export function wordsToItems(words: OcrWord[], pxPerPt: number, origin: { x: number; y: number } = { x: 0, y: 0 }, minConfidence = 25): TextItem[] {
  return words
    .filter((w) => w.text.trim() && w.confidence >= minConfidence)
    .map((w) => {
      const height = Math.max(1, w.lineBottom - w.lineTop) / pxPerPt;
      return {
        str: w.text,
        x: origin.x + w.x0 / pxPerPt,
        // Baseline: a little above the bottom of the line box, where descenders end.
        y: origin.y + w.lineBottom / pxPerPt - height * 0.2,
        width: (w.x1 - w.x0) / pxPerPt,
        size: Math.max(4, height * 0.8),
        rtl: RTL.test(w.text),
        bold: false,
        italic: false,
      };
    });
}
