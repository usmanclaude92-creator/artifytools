import { describe, expect, it } from "vitest";
import { activeSets, estimateEntropy, generatePassword, secureRandomInt, strengthLabel } from "./password-generator/logic";
import { dateDifference, parseIsoDate, fromDayNumber, toDayNumber, weekdayName } from "./date-difference/logic";
import { qrContrastWarning, validateQrInput } from "./qr-code-generator/logic";

const base = { length: 16, lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: false };

describe("password generator", () => {
  it("honours length and includes every selected type", () => {
    for (let i = 0; i < 200; i++) {
      const r = generatePassword({ ...base, length: 8 });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.password).toHaveLength(8);
        expect(r.password).toMatch(/[a-z]/);
        expect(r.password).toMatch(/[A-Z]/);
        expect(r.password).toMatch(/\d/);
        expect(r.password).toMatch(/[^a-zA-Z0-9]/);
      }
    }
  });
  it("excludes ambiguous characters and unselected sets", () => {
    for (let i = 0; i < 100; i++) {
      const r = generatePassword({ ...base, symbols: false, excludeAmbiguous: true, length: 64 });
      if (r.ok) expect(r.password).not.toMatch(/[Il1O0o]|[^a-zA-Z0-9]/);
    }
  });
  it("validates options", () => {
    expect(generatePassword({ ...base, lowercase: false, uppercase: false, digits: false, symbols: false }).ok).toBe(false);
    expect(generatePassword({ ...base, length: 7 }).ok).toBe(false);
    expect(generatePassword({ ...base, length: 129 }).ok).toBe(false);
    expect(generatePassword({ ...base, length: 12.5 }).ok).toBe(false);
  });
  it("secureRandomInt is in range and roughly uniform", () => {
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 12000; i++) counts[secureRandomInt(6)]++;
    for (const c of counts) expect(c).toBeGreaterThan(1700);
    expect(() => secureRandomInt(0)).toThrow();
  });
  it("estimates entropy and strength", () => {
    expect(estimateEntropy(16, 94)).toBe(105);
    expect(activeSets({ ...base, symbols: false })).toHaveLength(3);
    expect(strengthLabel(30).label).toBe("Weak");
    expect(strengthLabel(128).label).toBe("Very strong");
  });
});

describe("date difference", () => {
  const ok = (a: string, b: string, inc = false) => {
    const r = dateDifference(a, b, inc);
    if (!r.ok) throw new Error(r.error);
    return r.result;
  };
  it("validates dates strictly", () => {
    expect(parseIsoDate("2024-02-29")).not.toBeNull();
    expect(parseIsoDate("2023-02-29")).toBeNull();
    expect(parseIsoDate("2023-13-01")).toBeNull();
    expect(parseIsoDate("2023-1-1")).toBeNull();
    expect(dateDifference("", "2024-01-01").ok).toBe(false);
    expect(dateDifference("2023-02-30", "2024-01-01").ok).toBe(false);
  });
  it("computes totals across leap years", () => {
    expect(ok("2024-02-28", "2024-03-01").totalDays).toBe(2);
    expect(ok("2023-02-28", "2023-03-01").totalDays).toBe(1);
    expect(ok("2000-01-01", "2024-01-01").totalDays).toBe(8766);
    expect(ok("2024-01-01", "2024-01-01").totalDays).toBe(0);
  });
  it("breaks differences into years, months and days", () => {
    const r = ok("2020-01-15", "2024-03-20");
    expect([r.years, r.months, r.days]).toEqual([4, 2, 5]);
    const clamp = ok("2024-01-31", "2024-03-01");
    expect([clamp.years, clamp.months, clamp.days]).toEqual([0, 1, 1]);
    const exact = ok("2024-02-29", "2025-02-28");
    // Feb 29 + 12 months clamps to Feb 28, so this is exactly one year.
    expect([exact.years, exact.months, exact.days]).toEqual([1, 0, 0]);
  });
  it("swaps reversed dates, supports end-day inclusion and weeks", () => {
    const r = ok("2024-03-10", "2024-03-01");
    expect(r.swapped).toBe(true);
    expect(r.totalDays).toBe(9);
    expect(ok("2024-03-01", "2024-03-10", true).totalDays).toBe(10);
    const w = ok("2024-03-01", "2024-03-23");
    expect([w.weeks, w.remainderDays]).toEqual([3, 1]);
  });
  it("counts business days", () => {
    expect(ok("2024-03-04", "2024-03-11").businessDays).toBe(5); // Mon → next Mon (exclusive)
    expect(ok("2024-03-04", "2024-03-08", true).businessDays).toBe(5); // Mon–Fri inclusive
    expect(ok("2024-03-09", "2024-03-10", true).businessDays).toBe(0); // Sat–Sun
  });
  it("converts day numbers both ways and finds weekdays", () => {
    for (const s of ["1970-01-01", "2000-02-29", "1900-03-01", "2100-12-31", "0001-01-01"]) {
      const p = parseIsoDate(s)!;
      expect(fromDayNumber(toDayNumber(p))).toEqual(p);
    }
    expect(weekdayName({ y: 1970, m: 1, d: 1 })).toBe("Thursday");
    expect(weekdayName({ y: 2024, m: 2, d: 29 })).toBe("Thursday");
    expect(weekdayName({ y: 1969, m: 12, d: 31 })).toBe("Wednesday");
  });
});

describe("QR helpers", () => {
  const o = { text: "hi", errorCorrection: "M" as const, size: 256, margin: 2, foreground: "#000000", background: "#ffffff" };
  it("validates input", () => {
    expect(validateQrInput(o)).toBeNull();
    expect(validateQrInput({ ...o, text: "x".repeat(2001) })).toMatch(/too long/);
    expect(validateQrInput({ ...o, foreground: "nope" })).toMatch(/valid colours/);
  });
  it("warns about unreadable colour combinations", () => {
    expect(qrContrastWarning("#000000", "#ffffff")).toBeNull();
    expect(qrContrastWarning("#cccccc", "#ffffff")).toMatch(/Low contrast/);
    expect(qrContrastWarning("#ffffff", "#000000")).toMatch(/inverted/);
  });
});
