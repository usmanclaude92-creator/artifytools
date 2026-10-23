import { describe, expect, it } from "vitest";
import { bodySize, groupLines, lineRuns, normalizeArabic, pageBlocks, type TextItem } from "./text-layout";

const item = (str: string, x: number, y: number, size = 11, extra: Partial<TextItem> = {}): TextItem => ({ str, x, y, width: str.length * size * 0.5, size, rtl: false, bold: false, italic: false, ...extra });

describe("text layout", () => {
  it("groups items into lines and adds spaces at gaps", () => {
    const lines = groupLines([item("world", 120, 100.5), item("Hello", 72, 100), item("Next", 72, 115)]);
    expect(lines).toHaveLength(2);
    expect(lineRuns(lines[0]!).map((r) => r.text).join("")).toBe("Hello world");
  });

  it("orders right-to-left lines from the right", () => {
    const [line] = groupLines([item("عالم", 100, 100, 11, { rtl: true }), item("مرحبا", 200, 100, 11, { rtl: true })]);
    expect(line!.rtl).toBe(true);
    expect(lineRuns(line!).map((r) => r.text).join("")).toBe("مرحبا عالم");
  });

  it("finds the body size by amount of text", () => {
    expect(bodySize([item("Title", 0, 0, 24), item("a long paragraph of body text", 0, 30, 11)])).toBe(11);
  });

  it("builds headings and wrapped paragraphs, and splits at short lines", () => {
    const W = 500; // text from 72 to ~522
    const full = "x".repeat(82); // 82 * 5.5 = 451 wide
    const items = [
      item("Annual Report", 72, 60, 22, { bold: true }),
      item(full, 72, 100),
      item("contin-", 72, 114),
      item("ued end.", 72, 128),
      item(full, 72, 160),
      item(full, 72, 174),
    ];
    // "contin-" is short, so it ends that paragraph in this simple model; make it long instead:
    items[2] = item(full.slice(0, 81) + "-", 72, 114);
    const blocks = pageBlocks(items, W + 100, 11);
    expect(blocks[0]).toMatchObject({ kind: "heading", level: 1 });
    expect(blocks[0]!.runs[0]).toMatchObject({ text: "Annual Report", bold: true });
    expect(blocks[1]!.kind).toBe("paragraph");
    expect(blocks[1]!.runs.map((r) => r.text).join("")).toContain("xued end.");
    expect(blocks).toHaveLength(3);
  });

  it("detects centred lines", () => {
    const blocks = pageBlocks([item("Centred title text", 250, 100, 11), item("x".repeat(90), 50, 140), item("x".repeat(90), 50, 154)], 595, 11);
    expect(blocks[0]!.align).toBe("center");
  });

  it("turns Arabic presentation forms back into normal letters", () => {
    expect(normalizeArabic("ﻣﻠﺨﺺ ﺑﺎﻟﻠﻐﺔ اﻟﻌﺮﺑﻴﺔ ﻻ")).toBe("ملخص باللغة العربية لا");
    expect(normalizeArabic("office ﬁle")).toBe("office ﬁle");
  });
});
