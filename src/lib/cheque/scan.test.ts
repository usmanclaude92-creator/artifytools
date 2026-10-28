import { describe, expect, test } from "vitest";
import type { OcrWord } from "@/lib/ocr/ocr";
import { fieldsWithinBounds } from "./templates";
import { findChequeRect, layoutFromWords, pageScale } from "./scan";

const word = (text: string, x0: number, y0: number, x1: number, y1: number): OcrWord => ({ text, x0, y0, x1, y1, lineTop: y0, lineBottom: y1, confidence: 90 });

describe("pageScale", () => {
  test("takes the long side as 297 mm and checks the shape", () => {
    const a = pageScale(1240, 1754);
    expect(a.ok).toBe(true);
    expect(a.mmPerPx).toBeCloseTo(297 / 1754, 6);
    expect(pageScale(1754, 1240).ok).toBe(true);
    expect(pageScale(1000, 1000).ok).toBe(false);
    expect(pageScale(1200, 1800).ok).toBe(false);
  });
});

describe("findChequeRect", () => {
  test("finds the outline of the cheque on a white page", () => {
    const w = 800, h = 1100;
    const g = new Uint8Array(w * h).fill(255);
    const box = { x0: 100, y0: 200, x1: 700, y1: 460 };
    for (let x = box.x0; x < box.x1; x++) { g[box.y0 * w + x] = 0; g[(box.y1 - 1) * w + x] = 0; }
    for (let y = box.y0; y < box.y1; y++) { g[y * w + box.x0] = 0; g[y * w + box.x1 - 1] = 0; }
    g[50 * w + 50] = 0; // a speck is not the cheque
    expect(findChequeRect(g, w, h)).toEqual(box);
  });
  test("returns null for a blank page", () => {
    expect(findChequeRect(new Uint8Array(400 * 500).fill(255), 400, 500)).toBeNull();
  });
});

describe("layoutFromWords", () => {
  const size = { width: 200, height: 90 };
  const pxPerMm = 10;
  test("places fields after their printed labels", () => {
    const words = [
      word("Date", 1500, 80, 1580, 130),
      word("Pay", 150, 230, 240, 280),
      word("Rupees", 100, 330, 260, 380),
      word("Rs.", 1450, 410, 1520, 460),
    ];
    const { fields, found } = layoutFromWords(words, size, pxPerMm);
    expect(found).toMatchObject({ date: true, payee: true, words1: true, words2: true, figures: true, crossing: false });
    expect(fields.date.x).toBeCloseTo(160, 0);
    expect(fields.date.y).toBeCloseTo(7.5, 0);
    expect(fields.payee.x).toBeCloseTo(26, 0);
    expect(fields.words1.x).toBeCloseTo(28, 0);
    expect(fields.words2.y).toBeGreaterThan(fields.words1.y);
    expect(fields.figures.x).toBeCloseTo(153, 0);
    expect(fieldsWithinBounds({ ...size, fields })).toBe(true);
  });
  test("keeps typical positions when nothing is recognised", () => {
    const { found, fields } = layoutFromWords([word("hello", 10, 10, 90, 50)], size, pxPerMm);
    expect(Object.values(found).some(Boolean)).toBe(false);
    expect(fieldsWithinBounds({ ...size, fields })).toBe(true);
  });
  test("understands Arabic labels", () => {
    const { found, fields } = layoutFromWords([word("التاريخ", 1500, 80, 1620, 130), word("ادفعوا", 1700, 230, 1820, 280)], size, pxPerMm);
    expect(found.date).toBe(true);
    expect(found.payee).toBe(true);
    // The payee line runs left from its label.
    expect(fields.payee.x + fields.payee.w).toBeLessThan(170);
  });
});
