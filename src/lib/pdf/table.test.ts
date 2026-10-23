import { describe, expect, it } from "vitest";
import { columnBreaks, lineCells, pageTable, parseNumber } from "./table";
import type { TextItem } from "./text-layout";

const it_ = (str: string, x: number, y: number, extra: Partial<TextItem> = {}): TextItem => ({ str, x, y, width: str.length * 5, size: 10, rtl: false, bold: false, italic: false, ...extra });

describe("PDF tables", () => {
  it("joins close words into one cell and splits at wide gaps", () => {
    const cells = lineCells([it_("Design", 50, 100), it_("service", 85, 100), it_("1,200.500", 200, 100)], false);
    expect(cells.map((c) => c.text)).toEqual(["Design service", "1,200.500"]);
  });

  it("finds columns from whitespace that runs through the rows", () => {
    expect(columnBreaks([[{ x0: 0, x1: 40, text: "a", bold: false }, { x0: 100, x1: 130, text: "b", bold: false }], [{ x0: 0, x1: 60, text: "c", bold: false }, { x0: 110, x1: 140, text: "d", bold: false }]])).toEqual([80]);
  });

  it("builds a grid with headers, a title row and empty cells", () => {
    const items = [
      it_("Price list", 50, 60, { bold: true }),
      it_("Item", 50, 100, { bold: true }), it_("Q1", 200, 100, { bold: true }), it_("Q2", 300, 100, { bold: true }),
      it_("Design service", 50, 115), it_("1,200.500", 200, 115), it_("980", 300, 115),
      it_("Printing", 50, 130), it_("300", 300, 130),
    ];
    const t = pageTable(items);
    expect(t.columns).toBe(3);
    expect(t.rows.map((r) => r.map((c) => c?.text ?? ""))).toEqual([
      ["Price list", "", ""],
      ["Item", "Q1", "Q2"],
      ["Design service", "1,200.500", "980"],
      ["Printing", "", "300"],
    ]);
    expect(t.rows[1]![0]!.bold).toBe(true);
  });

  it("puts right-to-left tables in Excel order (rightmost column first)", () => {
    const items = [it_("البند", 300, 100, { rtl: true }), it_("المبلغ", 100, 100, { rtl: true }), it_("تصميم", 300, 115, { rtl: true }), it_("250", 100, 115)];
    const t = pageTable(items);
    expect(t.rtl).toBe(true);
    expect(t.rows[0]!.map((c) => c?.text)).toEqual(["البند", "المبلغ"]);
    expect(t.rows[1]!.map((c) => c?.text)).toEqual(["تصميم", "250"]);
  });

  it("reads numbers, percentages and accounting negatives, and leaves codes as text", () => {
    expect(parseNumber("1,250.500")).toEqual({ value: 1250.5, numFmt: "#,##0.000" });
    expect(parseNumber("15%")).toEqual({ value: 0.15, numFmt: "0%" });
    expect(parseNumber("(300.00)")).toEqual({ value: -300, numFmt: "0.00;(0.00)" });
    expect(parseNumber("١٢٣")).toEqual({ value: 123, numFmt: "0" });
    expect(parseNumber("00457")).toBeNull();
    expect(parseNumber("1,2")).toBeNull();
    expect(parseNumber("OMR 5")).toBeNull();
  });
});

describe("PDF tables from spreadsheets", () => {
  it("merges a left-aligned header with right-aligned numbers, and keeps debit/credit apart", () => {
    const items = [
      it_("Item", 50, 100), it_("Debit", 200, 100), it_("Credit", 300, 100),
      it_("Fees", 50, 115), it_("1,250.500", 235, 115),
      it_("Refund", 50, 130), it_("80.000", 345, 130),
    ];
    const t = pageTable(items);
    expect(t.columns).toBe(3);
    expect(t.rows.map((r) => r.map((c) => c?.text ?? ""))).toEqual([["Item", "Debit", "Credit"], ["Fees", "1,250.500", ""], ["Refund", "", "80.000"]]);
  });
  it("joins Arabic glyph pieces stored in visual order", () => {
    // "دعم فني" stored glyph by glyph, left to right on the page.
    const glyphs = ["ي", "ن", "ف", " ", "م", "ع", "د"].map((ch, i) => it_(ch, 100 + i * 5, 100, { rtl: true }));
    expect(lineCells(glyphs).map((c) => c.text)).toEqual(["دعم فني"]);
  });
});

describe("mixed-direction cells", () => {
  it("reads Arabic and English in one cell in logical order", () => {
    // Visual: "ةمئاق — Price" glyphs; logically "قائمة — Price".
    const items = [...["ة", "م", "ئ", "ا", "ق"].map((ch, i) => it_(ch, 100 + i * 5, 100, { rtl: true })), it_("—", 130, 100), it_("Price", 140, 100)];
    expect(lineCells(items).map((c) => c.text)).toEqual(["قائمة — Price"]);
  });
});
