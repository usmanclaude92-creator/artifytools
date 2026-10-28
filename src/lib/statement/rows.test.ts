import { describe, expect, it } from "vitest";
import type { TextItem } from "@/lib/pdf/text-layout";
import { autoRowLines, mergeRows } from "./rows";

const t = (str: string, x: number, y: number): TextItem => ({ str, x, y, width: str.length * 5, size: 10, rtl: false, bold: false, italic: false });

describe("mergeRows", () => {
  it("joins a multi-line cell into one item per row and column", () => {
    const items = [t("01/01", 10, 20), t("Rent for", 80, 20), t("January", 80, 32), t("500.00", 200, 20), t("02/01", 10, 50), t("Shop", 80, 50), t("20.00", 200, 50)];
    const out = mergeRows(items, [40], [70, 190]);
    expect(out.filter((i) => i.y === 20).map((i) => i.str)).toEqual(["01/01", "Rent for January", "500.00"]);
    expect(out.filter((i) => i.y === 50).map((i) => i.str)).toEqual(["02/01", "Shop", "20.00"]);
  });
  it("leaves items alone without row lines", () => {
    const items = [t("a", 1, 1)];
    expect(mergeRows(items, [], [])).toBe(items);
  });
});

describe("autoRowLines", () => {
  it("puts a line between text lines", () => {
    const items = [t("a", 1, 20), t("b", 30, 20), t("c", 1, 40), t("d", 1, 60)];
    const lines = autoRowLines(items, 0, 100);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBeGreaterThan(17);
    expect(lines[0]).toBeLessThan(37);
  });
});
