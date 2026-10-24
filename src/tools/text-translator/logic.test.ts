import { describe, expect, it } from "vitest";
import { defaultTarget, detectScript, joinLines, looksLikeTarget, splitLines } from "./logic";

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

describe("text translator language hints", () => {
  it("detects the script", () => {
    expect(detectScript("مرحبا بالعالم")).toBe("arabic");
    expect(detectScript("Hello world")).toBe("latin");
    expect(detectScript("12345 !?")).toBe("other");
    expect(detectScript("مرحبا hello hi")).toBe("latin");
  });
  it("picks a sensible default target", () => {
    expect(defaultTarget("مرحبا", "ar")).toBe("en");
    expect(defaultTarget("Good morning", "en")).toBe("ar");
    expect(defaultTarget("123", "fr")).toBe("fr");
  });
  it("spots text already in the target language", () => {
    expect(looksLikeTarget("مرحبا بك", "ar")).toBe(true);
    expect(looksLikeTarget("Hello there", "en")).toBe(true);
    expect(looksLikeTarget("Hello there", "ar")).toBe(false);
    expect(looksLikeTarget("Bonjour à tous", "en")).toBe(false);
    expect(looksLikeTarget("Hola", "fr")).toBe(false);
  });
});
