import { describe, expect, it } from "vitest";
import type { OcrWord } from "@/lib/ocr/ocr";
import { parseStatement } from "./parse";
import { wordsToItems } from "./ocr-items";

// A scanned statement at 200 dpi (2.78 px per point): words with boxes, as Tesseract reports them.
const px = 200 / 72;
const word = (text: string, xPt: number, line: number, wPt = 40, confidence = 90): OcrWord => ({
  text,
  x0: Math.round(xPt * px),
  x1: Math.round((xPt + wPt) * px),
  y0: Math.round((line * 18 + 100) * px),
  y1: Math.round((line * 18 + 112) * px),
  lineTop: Math.round((line * 18 + 99) * px),
  lineBottom: Math.round((line * 18 + 113) * px),
  confidence,
});

describe("wordsToItems", () => {
  it("converts pixels to points and shares one baseline per line", () => {
    const items = wordsToItems([word("Salary", 50, 0), word("gap", 100, 0)], px, { x: 0, y: 0 });
    expect(items).toHaveLength(2);
    expect(items[0]!.x).toBeCloseTo(50, 0);
    expect(items[0]!.width).toBeCloseTo(40, 0);
    expect(items[0]!.y).toBe(items[1]!.y);
  });

  it("drops low-confidence noise and marks Arabic as right-to-left", () => {
    const items = wordsToItems([word("x", 10, 0, 10, 5), word("راتب", 60, 0)], px);
    expect(items.map((i) => i.str)).toEqual(["راتب"]);
    expect(items[0]!.rtl).toBe(true);
  });

  it("moves words by the origin of a cropped region", () => {
    const [a] = wordsToItems([word("A", 10, 0)], px, { x: 100, y: 200 });
    expect(a!.x).toBeCloseTo(110, 0);
    expect(a!.y).toBeGreaterThan(200);
  });

  it("feeds the statement reader like text from a PDF would", () => {
    const rows: [string, string, string, string, string][] = [
      ["Date", "Description", "Debit", "Credit", "Balance"],
      ["01/10/2026", "Salary", "", "1,000.00", "1,500.00"],
      ["02/10/2026", "Rent", "400.00", "", "1,100.00"],
      ["03/10/2026", "Groceries", "100.00", "", "1,000.00"],
    ];
    const xs = [40, 130, 300, 400, 500];
    const words: OcrWord[] = [];
    rows.forEach((r, line) => r.forEach((text, c) => text && words.push(word(text, xs[c]!, line, 70))));
    const out = parseStatement([wordsToItems(words, px)]);
    expect(out.transactions).toHaveLength(3);
    expect(out.transactions[1]).toMatchObject({ description: "Rent", debit: 400, balance: 1100 });
    expect(out.totalCredit).toBe(1000);
  });
});
