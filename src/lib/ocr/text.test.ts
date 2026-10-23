import { describe, expect, it } from "vitest";
import { isRtl, joinPages, toParagraphs } from "./text";

describe("OCR text", () => {
  it("joins lines into paragraphs and fixes hyphenation", () => {
    expect(toParagraphs("Hello wor-\nld and more\ntext\n\nSecond para\n")).toEqual([
      { text: "Hello world and more text", rtl: false },
      { text: "Second para", rtl: false },
    ]);
  });
  it("marks Arabic paragraphs as right-to-left", () => {
    expect(isRtl("فاتورة رقم 123")).toBe(true);
    expect(isRtl("Invoice 123 فاتورة")).toBe(false);
    expect(toParagraphs("مرحبا\nبالعالم")[0]).toEqual({ text: "مرحبا بالعالم", rtl: true });
  });
  it("labels pages only when there are several", () => {
    expect(joinPages([" one "], (n) => `Page ${n}`)).toBe("one");
    expect(joinPages(["a", "b"], (n) => `— Page ${n} —`)).toBe("— Page 1 —\n\na\n\n— Page 2 —\n\nb");
  });
});
