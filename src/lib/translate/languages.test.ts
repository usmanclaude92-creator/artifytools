import { describe, expect, it } from "vitest";
import { isRtl, LANGUAGES, routeBytes, routeFor, sourceLanguages, targetLanguages } from "./languages";
import { MODELS } from "./models";

describe("routes", () => {
  it("uses a direct model when there is one", () => {
    expect(routeFor("en", "fr")).toEqual(["en-fr"]);
    expect(routeFor("ar", "en")).toEqual(["ar-en"]);
  });
  it("goes through English between two other languages", () => {
    expect(routeFor("ar", "fr")).toEqual(["ar-en", "en-fr"]);
    expect(routeFor("de", "zh")).toEqual(["de-en", "en-zh"]);
  });
  it("has no route to the same language, or to a language without a model", () => {
    expect(routeFor("en", "en")).toBeNull();
    expect(routeFor("en", "ja")).toBeNull(); // Japanese can be read but not written
    expect(routeFor("ja", "ko")).toBeNull();
  });
  it("adds up what the first use downloads", () => {
    expect(routeBytes(["ar-en", "en-fr"])).toBe(MODELS["ar-en"]!.bytes + MODELS["en-fr"]!.bytes);
  });
});

describe("language lists", () => {
  it("lists English and everything with a model in that direction", () => {
    expect(sourceLanguages().map((l) => l.code)).toContain("ja");
    expect(targetLanguages().map((l) => l.code)).not.toContain("ja");
    expect(sourceLanguages().map((l) => l.code)).toContain("en");
    expect(targetLanguages().map((l) => l.code)).toContain("ar");
  });
  it("knows which languages run right to left", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
  it("has an Arabic and an English name for every language", () => {
    for (const l of LANGUAGES) {
      expect(l.en.length).toBeGreaterThan(0);
      expect(l.ar.length).toBeGreaterThan(0);
    }
  });
  it("pins every model to a revision", () => {
    for (const [k, m] of Object.entries(MODELS)) {
      expect(m.revision, k).toMatch(/^[0-9a-f]{40}$/);
      expect(m.bytes, k).toBeGreaterThan(10_000_000);
    }
  });
});
