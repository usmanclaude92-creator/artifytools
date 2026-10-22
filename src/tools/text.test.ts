import { describe, expect, it } from "vitest";
import { analyzeText, formatDuration } from "./word-counter/logic";
import { convertCase } from "./case-converter/logic";
import { cleanText, defaultCleanOptions } from "./text-cleaner/logic";
import { removeDuplicateLines } from "./remove-duplicate-lines/logic";

describe("word counter", () => {
  it("handles empty input", () => {
    const s = analyzeText("");
    expect([s.words, s.characters, s.sentences, s.paragraphs, s.lines]).toEqual([0, 0, 0, 0, 0]);
  });
  it("counts words, characters, sentences and paragraphs", () => {
    const s = analyzeText("Hello world. This is a test!\n\nSecond paragraph here.");
    expect(s.words).toBe(9);
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.lines).toBe(3);
    expect(s.charactersNoSpaces).toBeLessThan(s.characters);
  });
  it("treats apostrophes/hyphens as part of a word and counts emoji as one character", () => {
    expect(analyzeText("don't stop well-known — really").words).toBe(4);
    expect(analyzeText("你好世界 hello").words).toBeGreaterThanOrEqual(3);
    expect(analyzeText("a👍🏽b").characters).toBe(3);
  });
  it("lists repeated non-stop words", () => {
    const s = analyzeText("apple banana apple the the apple banana");
    expect(s.topWords[0]).toEqual({ word: "apple", count: 3 });
    expect(s.topWords.some((w) => w.word === "the")).toBe(false);
  });
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0 sec");
    expect(formatDuration(0.5)).toBe("30 sec");
    expect(formatDuration(1.5)).toBe("1 min 30 sec");
    expect(formatDuration(12)).toBe("12 min");
  });
});

describe("case converter", () => {
  it("converts simple cases", () => {
    expect(convertCase("Hello World", "upper")).toBe("HELLO WORLD");
    expect(convertCase("Hello World", "lower")).toBe("hello world");
    expect(convertCase("hello world. new sentence! ok", "sentence")).toBe("Hello world. New sentence! Ok");
  });
  it("title-cases with small words", () => {
    expect(convertCase("the lord of the rings", "title")).toBe("The Lord of the Rings");
    expect(convertCase("what are you up to", "title")).toBe("What Are You Up To");
  });
  it("converts identifiers", () => {
    expect(convertCase("hello big world", "camel")).toBe("helloBigWorld");
    expect(convertCase("hello big world", "pascal")).toBe("HelloBigWorld");
    expect(convertCase("helloBigWorld", "snake")).toBe("hello_big_world");
    expect(convertCase("HTTPServer error", "kebab")).toBe("http-server-error");
    expect(convertCase("max retries", "constant")).toBe("MAX_RETRIES");
  });
  it("handles empty and non-latin text", () => {
    expect(convertCase("", "camel")).toBe("");
    expect(convertCase("straße", "upper")).toBe("STRASSE");
  });
});

describe("text cleaner", () => {
  it("collapses spaces, trims lines, collapses blank lines", () => {
    expect(cleanText("  a   b  \n\n\n\n c ", defaultCleanOptions)).toBe("a b\n\nc");
  });
  it("removes invisible characters and straightens quotes", () => {
    const out = cleanText("“hi”​ it’s", { ...defaultCleanOptions, straightenQuotes: true });
    expect(out).toBe('"hi" it\'s');
  });
  it("joins lines", () => {
    expect(cleanText("a\nb\n\nc", { ...defaultCleanOptions, joinLines: true })).toBe("a b c");
  });
  it("strips tags including nested tricks, as plain text", () => {
    expect(cleanText("<b>bold</b> <scr<script>ipt>x", { ...defaultCleanOptions, stripTags: true })).toBe("bold x");
  });
  it("handles empty input", () => {
    expect(cleanText("", defaultCleanOptions)).toBe("");
  });
});

describe("remove duplicate lines", () => {
  const base = { caseSensitive: true, trimLines: false, keepBlank: false, sort: "none" as const };
  it("removes exact duplicates preserving first-seen order", () => {
    const r = removeDuplicateLines("b\na\nb\nc\na", base);
    expect(r.output).toBe("b\na\nc");
    expect(r.removed).toBe(2);
    expect(r.uniqueLines).toBe(3);
  });
  it("respects case and trim options", () => {
    expect(removeDuplicateLines("A\na", base).output).toBe("A\na");
    expect(removeDuplicateLines("A\na", { ...base, caseSensitive: false }).output).toBe("A");
    expect(removeDuplicateLines("a\n a ", { ...base, trimLines: true }).output).toBe("a");
  });
  it("sorts and handles blanks and CRLF", () => {
    expect(removeDuplicateLines("b\r\na\r\nb", { ...base, sort: "asc" }).output).toBe("a\nb");
    expect(removeDuplicateLines("a\n\n\nb", base).output).toBe("a\nb");
    expect(removeDuplicateLines("a\n\nb", { ...base, keepBlank: true }).output).toBe("a\n\nb");
    expect(removeDuplicateLines("", base).totalLines).toBe(0);
  });
});
