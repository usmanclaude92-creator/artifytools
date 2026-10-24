import { describe, expect, it } from "vitest";
import { detectScript, detectSource, joinLines, splitLines, toPieces } from "./logic";

describe("text translator lines", () => {
  it("keeps blank lines and line order", () => {
    const parts = splitLines("Hello\r\n\r\n  World  \n");
    expect(parts.segments).toEqual(["Hello", "World"]);
    expect(joinLines(parts, ["مرحبا", "عالم"])).toBe("مرحبا\n\nعالم\n");
  });
  it("handles empty input", () => {
    const parts = splitLines("  \n ");
    expect(parts.segments).toEqual([]);
    expect(joinLines(parts, [])).toBe("\n");
  });
});

describe("text translator pieces", () => {
  it("splits a line into sentences in English and Arabic", () => {
    expect(toPieces("Hello there. How are you? Fine!")).toEqual(["Hello there.", "How are you?", "Fine!"]);
    expect(toPieces("مرحبا بك. كيف حالك؟ بخير")).toEqual(["مرحبا بك.", "كيف حالك؟", "بخير"]);
  });
  it("keeps decimals and abbreviations-with-no-space together", () => {
    expect(toPieces("The price is 3.5 rials.")).toEqual(["The price is 3.5 rials."]);
  });
  it("cuts a sentence that is too long", () => {
    const long = Array.from({ length: 120 }, () => "word").join(" ");
    const pieces = toPieces(long);
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((p) => p.length <= 350)).toBe(true);
    expect(pieces.join(" ")).toBe(long);
  });
});

describe("text translator language detection", () => {
  it("detects the script", () => {
    expect(detectScript("مرحبا بالعالم")).toBe("arabic");
    expect(detectScript("Hello world")).toBe("latin");
    expect(detectScript("12345 !?")).toBe("other");
    expect(detectScript("مرحبا hello hi")).toBe("latin");
  });
  it("picks the language to translate from", () => {
    expect(detectSource("مرحبا", "en")).toBe("ar");
    expect(detectSource("Good morning", "ar")).toBe("en");
    expect(detectSource("123", "ar")).toBe("ar");
  });
});
