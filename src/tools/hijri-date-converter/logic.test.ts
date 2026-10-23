import { describe, expect, it } from "vitest";
import { gregorianToHijri, hijriToGregorian, toIso } from "./logic";

const g2h = (iso: string) => {
  const r = gregorianToHijri(iso);
  if (!r.ok) throw new Error(r.error);
  return r.result;
};
const h2g = (y: number, m: number, d: number) => {
  const r = hijriToGregorian(String(y), m, d);
  if (!r.ok) throw new Error(r.error);
  return toIso(r.result.gregorian);
};

describe("Umm al-Qura conversion", () => {
  it("known dates", () => {
    expect(g2h("2026-10-23").hijri).toEqual({ y: 1448, m: 5, d: 12 });
    expect(g2h("2026-10-23").weekday).toBe(5); // Friday
    expect(h2g(1447, 9, 1)).toBe("2026-02-18"); // Ramadan 1447
    expect(h2g(1445, 1, 1)).toBe("2023-07-19");
    expect(h2g(1446, 10, 1)).toBe("2025-03-30"); // Eid al-Fitr 1446
  });
  it("round-trips every day for 150 years", () => {
    for (let n = 0; n < 365 * 150; n += 17) {
      const d = new Date(Date.UTC(1925, 0, 1) + n * 86_400_000).toISOString().slice(0, 10);
      const h = g2h(d).hijri;
      expect(h2g(h.y, h.m, h.d)).toBe(d);
    }
  });
  it("month starts round-trip for every month 1343–1500", () => {
    for (let y = 1343; y <= 1500; y++) {
      for (let m = 1; m <= 12; m++) {
        const iso = h2g(y, m, 1);
        expect(g2h(iso).hijri).toEqual({ y, m, d: 1 });
      }
    }
  });
  it("rejects day 30 in a 29-day month and out-of-range years", () => {
    const len = g2h(h2g(1447, 9, 1)).hijriMonthLength;
    const r = hijriToGregorian("1447", 9, 30);
    expect(r.ok).toBe(len === 30);
    expect(hijriToGregorian("1200", 1, 1).ok).toBe(false);
    expect(hijriToGregorian("", 1, 1).ok).toBe(false);
    expect(hijriToGregorian("١٤٤٨", 5, 12).ok).toBe(true);
    expect(gregorianToHijri("1900-01-01").ok).toBe(false);
  });
});
