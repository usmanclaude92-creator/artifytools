import { describe, expect, it } from "vitest";
import { calculateGratuity, type GratuityInput } from "./logic";

const run = (i: Partial<GratuityInput> & Pick<GratuityInput, "country">) => {
  const r = calculateGratuity({ start: "", end: "", basic: "", ...i });
  if (!r.ok) throw new Error(r.error);
  return r.result;
};

describe("Saudi Arabia", () => {
  it("employer ends contract after 7 years on full wage (basic + allowances)", () => {
    const r = run({ country: "sa", start: "2018-01-01", end: "2024-12-31", basic: "6,000", allowances: "2000", reason: "employer" });
    expect(r.serviceYears).toBe(7);
    expect(r.wage).toBe(8000);
    expect(r.total).toBe(36000); // 5 × 4,000 + 2 × 8,000
  });
  it("6.5 years, wage 9,000", () => {
    const r = run({ country: "sa", start: "2018-01-01", end: "2024-06-30", basic: "9000", reason: "employer" });
    expect(r.serviceYears).toBe(6.5);
    expect(r.total).toBe(36000);
  });
  it("resignation shares: 1/3 at 2–5 years, 2/3 under 10, full from 10", () => {
    const base = { country: "sa" as const, basic: "10000", reason: "resigned" as const, start: "2010-01-01" };
    expect(run({ ...base, end: "2011-12-30" }).total).toBe(0);
    expect(run({ ...base, end: "2011-12-30" }).nil).toBe("sa-resigned-under-2");
    expect(run({ ...base, end: "2011-12-31" }).total).toBe(3333.33); // 2 y × 5,000 ÷ 3
    expect(run({ ...base, end: "2014-12-31" }).share).toBeCloseTo(1 / 3); // exactly 5 years
    expect(run({ ...base, end: "2017-12-31" }).total).toBe(36666.67); // 8 y: 55,000 × 2/3
    expect(run({ ...base, end: "2021-12-31" }).total).toBe(95000); // 12 y, full
  });
  it("full award for force majeure / marriage / childbirth even under 2 years", () => {
    expect(run({ country: "sa", start: "2024-01-01", end: "2024-12-31", basic: "8000", reason: "full" }).total).toBe(4000);
  });
});

describe("UAE", () => {
  it("21 days per year for 5 years, then 30 days", () => {
    const r = run({ country: "ae", start: "2016-01-01", end: "2023-12-31", basic: "10,000" });
    expect(r.serviceYears).toBe(8);
    // 10,000/30 × 21 × 5 = 35,000; + 3 × 10,000 = 30,000
    expect(r.total).toBe(65000);
  });
  it("nothing under one year; pro rata after", () => {
    expect(run({ country: "ae", start: "2024-01-01", end: "2024-12-30", basic: "9000" }).nil).toBe("ae-under-1");
    expect(run({ country: "ae", start: "2024-01-01", end: "2025-06-30", basic: "9000" }).total).toBe(9450); // 1.5 × 6,300
  });
  it("unpaid leave is deducted", () => {
    const r = run({ country: "ae", start: "2020-01-01", end: "2022-12-31", basic: "6000", unpaidDays: "31" });
    expect(r.serviceDays).toBe(1096 - 31);
    expect(r.serviceYears).toBeCloseTo(2 + 11 / 12, 5);
  });
  it("capped at two years' wage", () => {
    const r = run({ country: "ae", start: "1990-01-01", end: "2023-12-31", basic: "1000" });
    expect(r.capped).toBe(true);
    expect(r.total).toBe(24000);
  });
  it("ignores allowances", () => {
    expect(run({ country: "ae", start: "2020-01-01", end: "2020-12-31", basic: "3000", allowances: "5000" }).wage).toBe(3000);
  });
});

describe("Oman", () => {
  it("splits service after 31 July 2023 (Ministry example: OMR 500, Aug 2021 – Jul 2025)", () => {
    const r = run({ country: "om", start: "2021-08-01", end: "2025-07-31", basic: "500" });
    expect(r.lines.map((l) => [l.kind, l.years, l.amount])).toEqual([
      ["om-old-first3", 2, 500],
      ["om-new", 2, 1000],
    ]);
    expect(r.total).toBe(1500);
    expect(r.currency).toBe("OMR");
  });
  it("old-law service beyond three years is paid at one month", () => {
    const r = run({ country: "om", start: "2015-08-01", end: "2023-07-31", basic: "1000" });
    expect(r.serviceYears).toBe(8);
    expect(r.total).toBe(6500); // 3 × 500 + 5 × 1,000
  });
  it("new-law only service: one month per year, no minimum", () => {
    expect(run({ country: "om", start: "2024-01-01", end: "2024-06-30", basic: "600" }).total).toBe(300);
  });
  it("flags end dates after the savings system starts", () => {
    expect(run({ country: "om", start: "2024-01-01", end: "2027-07-19", basic: "600" }).omSavings).toBe(true);
    expect(run({ country: "om", start: "2024-01-01", end: "2027-07-18", basic: "600" }).omSavings).toBe(false);
  });
});

describe("validation", () => {
  it("rejects bad input", () => {
    const e = (i: Partial<GratuityInput>) => {
      const r = calculateGratuity({ country: "sa", start: "2020-01-01", end: "2021-01-01", basic: "1000", ...i });
      return r.ok ? null : r.error;
    };
    expect(e({ end: "2019-01-01" })).toMatch(/on or after/);
    expect(e({ basic: "" })).toMatch(/Enter the monthly salary/);
    expect(e({ basic: "abc" })).toMatch(/valid amount/);
    expect(e({ unpaidDays: "1.5" })).toMatch(/whole number/);
    expect(e({ unpaidDays: "9999" })).toMatch(/longer than/);
    expect(e({ basic: "١٬٢٠٠" })).toBeNull();
  });
});
