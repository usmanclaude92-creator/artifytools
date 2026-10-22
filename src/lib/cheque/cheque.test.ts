import { describe, expect, test } from "vitest";
import { fitTwoLines, formatChequeDate, formatFigures, parseBatch, toIsoDate } from "./format";
import { fieldsWithinBounds, LAYOUTS } from "./templates";
import { getCurrency } from "@/lib/words";

describe("layouts", () => {
  test("every layout keeps its fields on the cheque, has a known currency, and unique ids", () => {
    expect(new Set(LAYOUTS.map((l) => l.id)).size).toBe(LAYOUTS.length);
    for (const l of LAYOUTS) {
      expect(fieldsWithinBounds(l), l.id).toBe(true);
      expect(getCurrency(l.currency), l.id).toBeDefined();
    }
  });
  test("Canada's amount box sits where Standard 006 puts it (right part, 30–55 mm above the bottom)", () => {
    const ca = LAYOUTS.find((l) => l.id === "ca-personal")!;
    const f = ca.fields.figures;
    expect(f.x).toBeGreaterThanOrEqual(ca.width - 67.3);
    expect(ca.height - (f.y + f.h)).toBeGreaterThanOrEqual(30.4);
    expect(ca.height - f.y).toBeLessThanOrEqual(54.6);
  });
});

describe("formatting", () => {
  test("dates", () => {
    expect(formatChequeDate("2026-11-05", "DD/MM/YYYY")).toBe("05/11/2026");
    expect(formatChequeDate("2026-11-05", "MM/DD/YYYY")).toBe("11/05/2026");
    expect(formatChequeDate("2026-11-05", "DDMMYYYY-boxes")).toBe("05112026");
    expect(formatChequeDate("2026-11-05", "YYYYMMDD-boxes")).toBe("20261105");
    expect(formatChequeDate("bad", "DD/MM/YYYY")).toBe("");
  });
  test("figures", () => {
    expect(formatFigures(1250, 500, 3, true)).toBe("**1,250.500**");
    expect(formatFigures(99, 5, 2, false)).toBe("99.05");
    expect(formatFigures(1000, 0, 0, false)).toBe("1,000");
  });
  test("two-line fit with shrinking", () => {
    const measure = (t: string, size: number) => t.length * size * 0.5;
    const r = fitTwoLines("one two three four five six", 70, 70, measure, 10, 6);
    expect(r.size).toBe(10);
    expect(r.line1).toBe("one two three");
    expect(r.line2).toBe("four five six");
    const shrunk = fitTwoLines("aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd", 80, 80, measure, 10, 6);
    expect(shrunk.size).toBe(7.5);
    expect(shrunk.line1).toBe("aaaaaaaaaa bbbbbbbbbb");
    expect(measure(shrunk.line2, shrunk.size)).toBeLessThanOrEqual(80);
  });
});

describe("batch", () => {
  test("tabs from Excel, commas in names, header row, Arabic digits and errors", () => {
    const { rows, errors } = parseBatch(
      "Payee\tAmount\tDate\nAl Noor Trading LLC\t1250.500\t05/11/2026\nأحمد سالم, 300, 2026-12-01\nBad row\nDate wrong;10;31/02/2026\nSmith, John, 50, ٠١/٠١/٢٠٢٧",
    );
    expect(rows).toEqual([
      { payee: "Al Noor Trading LLC", amount: "1250.500", date: "2026-11-05" },
      { payee: "أحمد سالم", amount: "300", date: "2026-12-01" },
      { payee: "Smith, John", amount: "50", date: "2027-01-01" },
    ]);
    expect(errors).toEqual([{ line: 4, problem: "columns" }, { line: 5, problem: "date" }]);
  });
  test("dates", () => {
    expect(toIsoDate("2026-2-3")).toBe("2026-02-03");
    expect(toIsoDate("29/02/2027")).toBeNull();
  });
});
