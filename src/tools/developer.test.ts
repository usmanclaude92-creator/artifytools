import { describe, expect, it } from "vitest";
import { processJson, findJsonError } from "./json-formatter/logic";
import { transformUrl } from "./url-encoder-decoder/logic";
import { decodeBase64, encodeBase64 } from "./base64-encoder-decoder/logic";
import { generateUuids, uuidV4, uuidV7Batch } from "./uuid-generator/logic";
import { parseColor, rgbToHex, rgbToHsl, hslToRgb, contrastRatio } from "./color-converter/logic";

const opts = { indent: 2 as const, sortKeys: false };

describe("JSON formatter", () => {
  it("formats, minifies, validates", () => {
    const f = processJson('{"b":1,"a":[1,2,{"c":null}]}', "format", opts);
    expect(f.ok && f.output).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2,\n    {\n      "c": null\n    }\n  ]\n}');
    const m = processJson('{\n "a": 1,\n "b": [1, 2]\n}', "minify", opts);
    expect(m.ok && m.output).toBe('{"a":1,"b":[1,2]}');
    const v = processJson("[1,2,3]", "validate", opts);
    expect(v.ok && v.output).toBe("");
  });
  it("supports tab indent and key sorting", () => {
    const r = processJson('{"b":1,"a":{"z":1,"y":2}}', "format", { indent: "tab", sortKeys: true });
    expect(r.ok && r.output).toBe('{\n\t"a": {\n\t\t"y": 2,\n\t\t"z": 1\n\t},\n\t"b": 1\n}');
  });
  it("reports stats", () => {
    const r = processJson('{"a":{"b":1},"c":[1]}', "validate", opts);
    expect(r.ok && r.stats).toMatchObject({ keys: 3, depth: 3 });
  });
  it("explains errors with line and column", () => {
    const cases: [string, RegExp, number, number][] = [
      ['{"a": 1,}', /Trailing comma/, 1, 9],
      ["{'a': 1}", /double quotes/, 1, 2],
      ['{"a" 1}', /":"/, 1, 6],
      ['{\n  "a": 1\n  "b": 2\n}', /"," or "}"/, 3, 3],
      ['{"a": tru}', /expected a value/, 1, 7],
      ['["a', /Unterminated string/, 1, 2],
      ['{"a": 1} x', /after the end/, 1, 10],
      ["[1,]", /Trailing comma/, 1, 4],
      ["01", /leading zeros|after the end/, 1, 1],
      ['"a\nb"', /control character/, 1, 3],
    ];
    for (const [text, re, line, column] of cases) {
      const r = processJson(text, "format", opts);
      expect(r.ok, text).toBe(false);
      if (!r.ok) {
        expect(r.error.message, text).toMatch(re);
        expect([r.error.line, r.error.column], text).toEqual([line, column]);
      }
    }
  });
  it("handles empty input and oversize input", () => {
    expect(processJson("   ", "format", opts).ok).toBe(false);
    expect(processJson("x".repeat(5_000_001), "format", opts).ok).toBe(false);
  });
  it("agrees with JSON.parse on valid documents", () => {
    for (const s of ['"x"', "1.5e3", "true", "null", "[]", "{}", '{"a":"\\u00e9\\n"}', "-0"]) {
      expect(findJsonError(s), s).toBeNull();
    }
  });
});

describe("URL encoder/decoder", () => {
  it("encodes components and full URLs differently", () => {
    expect(transformUrl("a b&c=d/é", "encode", "component")).toEqual({ ok: true, output: "a%20b%26c%3Dd%2F%C3%A9" });
    expect(transformUrl("https://x.com/a b?q=é", "encode", "full")).toEqual({ ok: true, output: "https://x.com/a%20b?q=%C3%A9" });
  });
  it("decodes and round-trips", () => {
    const text = "100% 日本語 & more";
    const enc = transformUrl(text, "encode", "component");
    expect(enc.ok && transformUrl(enc.output, "decode", "component")).toEqual({ ok: true, output: text });
    expect(transformUrl("a+b%20c", "decode", "component", true)).toEqual({ ok: true, output: "a b c" });
    expect(transformUrl("a+b", "decode", "component", false)).toEqual({ ok: true, output: "a+b" });
  });
  it("reports malformed input", () => {
    expect(transformUrl("%E0%A4%A", "decode", "component").ok).toBe(false);
    expect(transformUrl("100%", "decode", "component").ok).toBe(false);
    expect(transformUrl("\uD800", "encode", "component").ok).toBe(false);
    expect(transformUrl("", "encode", "component")).toEqual({ ok: true, output: "" });
  });
});

describe("Base64", () => {
  const std = { urlSafe: false, padding: true };
  it("encodes UTF-8", () => {
    expect(encodeBase64("Hello, World!", std)).toBe("SGVsbG8sIFdvcmxkIQ==");
    expect(encodeBase64("héllo ✓", std)).toBe("aMOpbGxvIOKckw==");
    expect(encodeBase64("", std)).toBe("");
  });
  it("supports URL-safe and unpadded variants", () => {
    expect(encodeBase64("??>>", std)).toBe("Pz8+Pg==");
    expect(encodeBase64("??>>", { urlSafe: true, padding: false })).toBe("Pz8-Pg");
  });
  it("decodes, tolerating whitespace, URL-safe alphabet and missing padding", () => {
    expect(decodeBase64("SGVs\nbG8=")).toEqual({ ok: true, output: "Hello" });
    expect(decodeBase64("Pz8-Pg")).toEqual({ ok: true, output: "??>>" });
    expect(decodeBase64("aMOpbGxvIOKckw==")).toEqual({ ok: true, output: "héllo ✓" });
  });
  it("rejects invalid input", () => {
    expect(decodeBase64("SGVs*bG8=").ok).toBe(false);
    expect(decodeBase64("SGV=sbG8").ok).toBe(false);
    expect(decodeBase64("A").ok).toBe(false);
    expect(decodeBase64("/w==").ok).toBe(false); // 0xFF is not valid UTF-8
  });
});

describe("UUID generator", () => {
  const re4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const re7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  it("v4 has correct version and variant bits and is unique", () => {
    const set = new Set(Array.from({ length: 500 }, () => uuidV4()));
    expect(set.size).toBe(500);
    for (const u of set) expect(u).toMatch(re4);
  });
  it("v7 embeds the timestamp and sorts in generation order", () => {
    const now = 1_700_000_000_000;
    const batch = uuidV7Batch(50, now);
    for (const u of batch) expect(u).toMatch(re7);
    expect(parseInt(batch[0]!.replace("-", "").slice(0, 12), 16)).toBe(now);
    expect([...batch].sort()).toEqual(batch);
  });
  it("applies formatting options and clamps count", () => {
    const [u] = generateUuids({ version: "v4", count: 1, uppercase: true, hyphens: false });
    expect(u).toMatch(/^[0-9A-F]{32}$/);
    expect(generateUuids({ version: "v4", count: 1000, uppercase: false, hyphens: true })).toHaveLength(100);
    expect(generateUuids({ version: "v4", count: 0, uppercase: false, hyphens: true })).toHaveLength(1);
  });
});

describe("Color converter", () => {
  it("parses every supported format", () => {
    const expected = { r: 255, g: 136, b: 0 };
    for (const s of ["#ff8800", "FF8800", "#f80", "rgb(255, 136, 0)", "rgb(255 136 0)", "255, 136, 0", "hsl(32, 100%, 50%)", "hsl(32deg 100% 50%)"]) {
      const r = parseColor(s);
      expect(r.ok, s).toBe(true);
      if (r.ok) expect(Math.abs(r.rgb.g - expected.g) <= 2 && r.rgb.r === 255 && r.rgb.b === 0, s).toBe(true);
    }
  });
  it("converts consistently", () => {
    expect(rgbToHex({ r: 91, g: 61, b: 245 })).toBe("#5B3DF5");
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    // HSL is stored as whole numbers, so a round trip may drift by a couple of units.
    const back = hslToRgb(rgbToHsl({ r: 18, g: 52, b: 86 }));
    expect(Math.abs(back.r - 18) + Math.abs(back.g - 52) + Math.abs(back.b - 86)).toBeLessThanOrEqual(6);
  });
  it("rejects invalid colours and alpha", () => {
    for (const s of ["", "#12", "#GGGGGG", "rgb(300, 0, 0)", "rgb(1,2)", "hsl(10, 120%, 50%)", "blue"]) {
      expect(parseColor(s).ok, s).toBe(false);
    }
    expect(parseColor("#ff880080")).toMatchObject({ ok: false });
  });
  it("computes WCAG contrast", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 1);
    expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});
