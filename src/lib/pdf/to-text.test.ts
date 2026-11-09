import { describe, expect, it } from "vitest";
import { joinText, pageToText } from "./to-text";
import type { TextItem } from "./text-layout";

const item = (str: string, x: number, y: number, size = 11): TextItem => ({ str, x, y, width: str.length * size * 0.5, size, rtl: false, bold: false, italic: false });

describe("pageToText", () => {
  const items = [item("Annual report", 72, 80, 20), item("The year went well and", 72, 120), item("sales grew steadily.", 72, 134), item("Second paragraph here.", 72, 190)];
  it("keeps one line per PDF line in lines mode", () => {
    expect(pageToText(items, 600, 11, "lines")).toBe("Annual report\nThe year went well and\nsales grew steadily.\nSecond paragraph here.");
  });
  it("joins wrapped lines into paragraphs in paragraphs mode", () => {
    const text = pageToText(items, 600, 11, "paragraphs");
    expect(text).toContain("The year went well and sales grew steadily.");
    expect(text.split("\n\n").length).toBeGreaterThanOrEqual(2);
  });
  it("returns an empty string for a page without text", () => {
    expect(pageToText([], 600, 11, "lines")).toBe("");
    expect(pageToText([], 600, 11, "paragraphs")).toBe("");
  });
});

describe("joinText", () => {
  const pages = [{ n: 1, text: "One" }, { n: 2, text: "" }, { n: 3, text: "Three" }];
  it("joins pages with blank lines and skips empty ones", () => {
    expect(joinText(pages, false, (n) => `Page ${n}`)).toBe("One\n\nThree");
  });
  it("adds a label before each page when asked", () => {
    expect(joinText(pages, true, (n) => `-- ${n} --`)).toBe("-- 1 --\n\nOne\n\n\n-- 2 --\n\n\n-- 3 --\n\nThree");
  });
});
