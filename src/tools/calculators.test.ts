import { describe, expect, it } from "vitest";
import { calculatePercentage } from "./percentage-calculator/logic";
import { calculateVat } from "./vat-calculator/logic";
import { discountFromPrices, priceAfterDiscount } from "./discount-calculator/logic";

const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error("expected ok: " + JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
};

describe("percentage calculator", () => {
  it("X% of Y", () => {
    expect(ok(calculatePercentage("of", "15", "200")).result.value).toBe("30");
    expect(ok(calculatePercentage("of", "12.5", "80")).result.value).toBe("10");
    expect(ok(calculatePercentage("of", "0.1", "0.2")).result.value).toBe("0");
    expect(ok(calculatePercentage("of", "7", "1,250.50")).result.value).toBe("87.54");
  });
  it("X is what % of Y", () => {
    expect(ok(calculatePercentage("is-what", "25", "200")).result.value).toBe("12.5%");
    expect(ok(calculatePercentage("is-what", "1", "3")).result.value).toBe("33.33%");
    expect(calculatePercentage("is-what", "1", "0").ok).toBe(false);
  });
  it("percentage change", () => {
    expect(ok(calculatePercentage("change", "50", "75")).result.value).toBe("+50%");
    expect(ok(calculatePercentage("change", "80", "60")).result.value).toBe("-25%");
    expect(ok(calculatePercentage("change", "10", "10")).result.value).toBe("0%");
    expect(ok(calculatePercentage("change", "-50", "-25")).result.value).toBe("+50%");
    expect(calculatePercentage("change", "0", "5").ok).toBe(false);
  });
  it("validates input", () => {
    expect(calculatePercentage("of", "", "5").ok).toBe(false);
    expect(calculatePercentage("of", "abc", "5").ok).toBe(false);
    expect(calculatePercentage("of", "5", "1e3").ok).toBe(false);
  });
});

describe("VAT calculator", () => {
  it("adds VAT to a net amount", () => {
    const r = ok(calculateVat("add", "100", "20")).result;
    expect([r.net, r.vat, r.gross]).toEqual(["100.00", "20.00", "120.00"]);
  });
  it("removes VAT from a gross amount", () => {
    const r = ok(calculateVat("remove", "120", "20")).result;
    expect([r.net, r.vat, r.gross]).toEqual(["100.00", "20.00", "120.00"]);
  });
  it("keeps net + VAT = gross after rounding", () => {
    const r = ok(calculateVat("remove", "99.99", "19")).result;
    expect(r.net).toBe("84.03");
    expect(r.vat).toBe("15.96");
    expect(r.gross).toBe("99.99");
    const a = ok(calculateVat("add", "19.99", "7.5")).result;
    expect([a.vat, a.gross]).toEqual(["1.50", "21.49"]);
  });
  it("handles zero rate, large values and bad input", () => {
    expect(ok(calculateVat("add", "50", "0")).result.gross).toBe("50.00");
    expect(ok(calculateVat("add", "1234567.89", "20")).result.gross).toBe("1,481,481.47");
    expect(calculateVat("add", "100", "-5").ok).toBe(false);
    expect(calculateVat("add", "100", "101").ok).toBe(false);
    expect(calculateVat("add", "", "20").ok).toBe(false);
    expect(ok(calculateVat("add", "100", "20")).result.rate).toBe("20%");
  });
});

describe("discount calculator", () => {
  it("applies a discount", () => {
    const r = ok(priceAfterDiscount("80", "25")).result;
    expect([r.saved, r.final, r.effectivePercent]).toEqual(["20.00", "60.00", "25%"]);
  });
  it("stacks a second discount sequentially", () => {
    const r = ok(priceAfterDiscount("100", "20", "10")).result;
    expect([r.final, r.saved, r.effectivePercent]).toEqual(["72.00", "28.00", "28%"]);
  });
  it("rounds to cents", () => {
    expect(ok(priceAfterDiscount("19.99", "15")).result.final).toBe("16.99");
  });
  it("finds the discount percentage from two prices", () => {
    expect(ok(discountFromPrices("200", "150")).result.effectivePercent).toBe("25%");
    expect(ok(discountFromPrices("100", "120")).result.effectivePercent).toBe("-20%");
    expect(discountFromPrices("0", "5").ok).toBe(false);
  });
  it("validates", () => {
    expect(priceAfterDiscount("100", "101").ok).toBe(false);
    expect(priceAfterDiscount("-5", "10").ok).toBe(false);
    expect(priceAfterDiscount("x", "10").ok).toBe(false);
    expect(priceAfterDiscount("100", "10", "200").ok).toBe(false);
  });
});
