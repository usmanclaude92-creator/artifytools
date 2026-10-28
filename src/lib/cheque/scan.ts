/** Measuring a cheque from a copy printed on A4: where the cheque is on the sheet, and where its printed labels are. */
import type { OcrWord } from "@/lib/ocr/ocr";
import { FIELD_IDS, typical, type FieldBox, type FieldId } from "./templates";

export interface PxRect { x0: number; y0: number; x1: number; y1: number }

const A4_LONG = 297;
const A4_RATIO = 297 / 210;

/** An A4 sheet has its long side 297 mm; the scan only gives a scale if its shape is really A4. */
export function pageScale(width: number, height: number): { mmPerPx: number; ok: boolean } {
  const long = Math.max(width, height), short = Math.min(width, height);
  return { mmPerPx: A4_LONG / long, ok: short > 0 && Math.abs(long / short - A4_RATIO) / A4_RATIO <= 0.06 };
}

/**
 * The outline of the cheque: the span of the page that has ink on it. `gray` is one byte per pixel (0 = black).
 * A thin margin is ignored (scanner shadows) and tiny specks don't count.
 */
export function findChequeRect(gray: Uint8Array, w: number, h: number, threshold = 180): PxRect | null {
  const inset = Math.round(Math.min(w, h) * 0.012);
  const cols = new Uint32Array(w), rows = new Uint32Array(h);
  for (let y = inset; y < h - inset; y++) {
    for (let x = inset; x < w - inset; x++) {
      if (gray[y * w + x]! < threshold) { cols[x]!++; rows[y]!++; }
    }
  }
  const min = Math.max(4, Math.round(Math.min(w, h) * 0.005));
  const span = (counts: Uint32Array) => {
    let a = -1, b = -1;
    for (let i = 0; i < counts.length; i++) if (counts[i]! >= min) { if (a < 0) a = i; b = i; }
    return a < 0 ? null : ([a, b] as const);
  };
  const sx = span(cols), sy = span(rows);
  if (!sx || !sy || sx[1] - sx[0] < w * 0.1 || sy[1] - sy[0] < h * 0.04) return null;
  return { x0: sx[0], y0: sy[0], x1: sx[1] + 1, y1: sy[1] + 1 };
}

const clean = (s: string) => s.toLowerCase().replace(/[.:,;·()*_\-–—|]/g, "").trim();
const DATE = /^(date|dated|dt|التاريخ|تاريخ)$/;
const PAYEE = /^(pay|payee|ادفعوا|ادفع|اصرفوا|إدفعوا|المستفيد)$/;
const WORDS = /^(rupees|rupee|dollars|dollar|riyals|riyal|dirhams|dirham|dinars|dinar|euro|euros|pounds|sum|مبلغ|المبلغ|ريال|درهم|دينار)$/;
const MONEY = /^(rs|₹|\$|aed|omr|sar|kwd|bhd|qar|pkr|inr|usd|cad|€|£|رع|رس|د\.إ)$/;

export type FoundFields = Record<FieldId, boolean>;

/**
 * Field boxes from where the printed labels sit. `words` are in pixels of the cropped cheque image, `pxPerMm` its scale.
 * A field with no label found keeps the typical position for that cheque size, and is reported as not found.
 */
export function layoutFromWords(words: OcrWord[], size: { width: number; height: number }, pxPerMm: number): { fields: Record<FieldId, FieldBox>; found: FoundFields } {
  const fields = typical(size.width, size.height);
  const found = Object.fromEntries(FIELD_IDS.map((f) => [f, false])) as FoundFields;
  const mm = (v: number) => v / pxPerMm;
  const sorted = [...words].filter((w) => w.confidence >= 20).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const find = (re: RegExp, pred: (w: OcrWord) => boolean = () => true) => sorted.find((w) => re.test(clean(w.text)) && pred(w));
  const lineH = (w: OcrWord) => Math.max(4.5, mm(w.lineBottom - w.lineTop) * 1.25);
  const clamp = (b: FieldBox): FieldBox => {
    const x = Math.min(Math.max(0, b.x), size.width - 5), y = Math.min(Math.max(0, b.y), size.height - 3);
    return { x: +x.toFixed(1), y: +y.toFixed(1), w: +Math.max(5, Math.min(b.w, size.width - x)).toFixed(1), h: +Math.max(3, Math.min(b.h, size.height - y)).toFixed(1) };
  };
  // The field continues after its label: to the right, or to the left of an Arabic label.
  const after = (w: OcrWord, maxW: number): FieldBox => {
    if (/[\u0600-\u06FF]/.test(w.text)) {
      const wd = Math.min(maxW, mm(w.x0) - 2 - 4);
      return { x: mm(w.x0) - 2 - wd, y: mm(w.y0) - 0.5, w: wd, h: lineH(w) };
    }
    const x = mm(w.x1) + 2;
    return { x, y: mm(w.y0) - 0.5, w: Math.min(maxW, size.width - x - 4), h: lineH(w) };
  };

  const money = find(MONEY, (w) => mm(w.x0) > size.width * 0.5);
  if (money) {
    const x = mm(money.x1) + 1;
    fields.figures = clamp({ x, y: mm(money.y0) - 1, w: Math.min(46, size.width - x - 3), h: Math.max(7, lineH(money)) });
    found.figures = true;
  }
  const rightHalf = (w: OcrWord) => mm(w.x0) > size.width * 0.5;
  const date = find(DATE, rightHalf) ?? find(DATE);
  if (date) { fields.date = clamp(after(date, 48)); found.date = true; }
  const payee = find(PAYEE);
  if (payee) { fields.payee = clamp(after(payee, 150)); found.payee = true; }
  const words1 = find(WORDS, (w) => !money || w !== money);
  if (words1) {
    const right = found.figures ? fields.figures.x - 2 : size.width * 0.78;
    const box = after(words1, right - (mm(words1.x1) + 2));
    fields.words1 = clamp(box);
    // The second line sits one line below, starting near the left edge of the printed text.
    const left = Math.min(...sorted.map((w) => mm(w.x0)).filter((x) => x > 2), fields.words1.x);
    const y = fields.words1.y + fields.words1.h * 1.3;
    fields.words2 = clamp({ x: left, y, w: fields.words1.x + fields.words1.w - left, h: fields.words1.h });
    found.words1 = true;
    found.words2 = true;
  }
  return { fields, found };
}
