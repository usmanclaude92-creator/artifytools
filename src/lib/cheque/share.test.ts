import { describe, expect, test } from "vitest";
import { buildCatalog, GENERIC_BANK, scaleFields, sizeLabel } from "./catalog";
import { issueBody, issueTitle, parseSharedSize, sharedSizeFrom } from "./share";
import { LAYOUTS, typical } from "./templates";

const ok = () => sharedSizeFrom({ ...LAYOUTS.find((l) => l.id === "gb")! }, "My `bank` <b>x</b>", "Some Bank");

describe("shared sizes", () => {
  test("accepts a real layout and cleans the text", () => {
    const s = parseSharedSize(JSON.parse(JSON.stringify(ok())))!;
    expect(s).not.toBeNull();
    expect(s.name).toBe("My bank b x /b");
    expect(issueTitle(s)).toBe("Custom cheque size: 178 × 85 mm (GB)");
    expect(issueBody(s)).toContain("```json");
  });
  test("rejects nonsense", () => {
    const base = JSON.parse(JSON.stringify(ok()));
    expect(parseSharedSize(null)).toBeNull();
    expect(parseSharedSize({ ...base, width: 5 })).toBeNull();
    expect(parseSharedSize({ ...base, country: "gb" })).toBeNull();
    expect(parseSharedSize({ ...base, currency: "XXX" })).toBeNull();
    expect(parseSharedSize({ ...base, fields: { ...base.fields, date: { x: 500, y: 0, w: 10, h: 5 } } })).toBeNull();
    expect(parseSharedSize({ ...base, name: "  " })).toBeNull();
  });
});

describe("catalog", () => {
  test("groups countries, banks and sizes, smallest first", () => {
    const cat = buildCatalog();
    const pk = cat.find((c) => c.code === "PK")!;
    expect(pk.banks[0]!.id).toBe(GENERIC_BANK.id);
    expect(pk.banks.map((b) => b.id)).toContain("ubl");
    const sizes = pk.banks[0]!.layouts.map((l) => l.width * l.height);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(cat.flatMap((c) => c.banks.flatMap((b) => b.layouts)).length).toBe(LAYOUTS.length);
  });
  test("labels sizes and rescales field positions", () => {
    expect(sizeLabel({ width: 177.8, height: 88.9 })).toBe("177.8 × 88.9 mm");
    const f = scaleFields(typical(200, 100), { width: 200, height: 100 }, { width: 100, height: 100 });
    expect(f.date.x).toBeCloseTo(typical(200, 100).date.x / 2, 0);
    expect(f.date.y).toBe(typical(200, 100).date.y);
  });
});
