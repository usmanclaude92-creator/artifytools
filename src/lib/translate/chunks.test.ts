import { describe, expect, it } from "vitest";
import { CHUNK_CHARS, makeChunks, reassemble, splitLong } from "./chunks";
import { parseTranslateRequest, parseTranslations } from "../ai/request";

describe("translate chunks", () => {
  it("splits very long paragraphs at sentence ends", () => {
    const sentence = "This is one sentence of the paragraph. ";
    const long = sentence.repeat(300);
    const parts = splitLong(long);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= CHUNK_CHARS)).toBe(true);
    expect(parts[0]!.endsWith(".")).toBe(true);
    expect(parts.join(" ").replace(/\s+/g, " ")).toBe(long.trim().replace(/\s+/g, " "));
  });

  it("groups paragraphs and reassembles translations in order", () => {
    const segs = ["Title", "a".repeat(3000), "b".repeat(3000), "c".repeat(9000)];
    const chunks = makeChunks(segs);
    expect(chunks.every((c) => c.reduce((n, p) => n + p.text.length, 0) <= CHUNK_CHARS)).toBe(true);
    const translated = chunks.map((c) => c.map((p) => p.text.toUpperCase()));
    const out = reassemble(segs.length, chunks, translated);
    expect(out[0]).toBe("TITLE");
    expect(out[1]).toBe("A".repeat(3000));
    expect(out[3]!.replace(/ /g, "")).toBe("C".repeat(9000));
  });
});

describe("translate request and reply parsing", () => {
  it("validates requests", () => {
    expect(parseTranslateRequest({ segments: ["Hi"], target: "ar" })).toEqual({ ok: true, input: { segments: ["Hi"], target: "ar" } });
    expect(parseTranslateRequest({ segments: [], target: "ar" }).ok).toBe(false);
    expect(parseTranslateRequest({ segments: ["Hi"], target: "xx" }).ok).toBe(false);
    expect(parseTranslateRequest({ segments: ["x".repeat(7000)], target: "ar" })).toMatchObject({ ok: false, status: 413 });
  });
  it("reads a JSON array of the right length, even with extra text around it", () => {
    expect(parseTranslations('Here you go:\n["مرحبا", "عالم"]', 2)).toEqual(["مرحبا", "عالم"]);
    expect(parseTranslations('["only one"]', 2)).toBeNull();
    expect(parseTranslations("not json", 1)).toBeNull();
  });
});
