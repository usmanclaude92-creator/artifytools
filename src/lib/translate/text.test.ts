import { describe, expect, it } from "vitest";
import { toPieces, translateParagraphs } from "./text";

describe("translate pieces", () => {
  it("splits a paragraph into sentences in English and Arabic", () => {
    expect(toPieces("Hello there. How are you? Fine!")).toEqual(["Hello there.", "How are you?", "Fine!"]);
    expect(toPieces("مرحبا بك. كيف حالك؟ بخير")).toEqual(["مرحبا بك.", "كيف حالك؟", "بخير"]);
  });
  it("keeps decimals together", () => {
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

describe("translateParagraphs", () => {
  const upper = { translate: async (s: string) => s.toUpperCase() };
  it("translates sentence by sentence and reports progress", async () => {
    const seen: string[] = [];
    const out = await translateParagraphs(upper, ["a b. c d.", "e f."], (d, n) => seen.push(`${d}/${n}`), () => false);
    expect(out).toEqual(["A B. C D.", "E F."]);
    expect(seen).toEqual(["1/3", "2/3", "3/3"]);
  });
  it("returns null when stopped", async () => {
    let calls = 0;
    const out = await translateParagraphs({ translate: async (s) => (calls++, s) }, ["a. b. c."], () => {}, () => calls >= 1);
    expect(out).toBeNull();
    expect(calls).toBe(1);
  });
});
