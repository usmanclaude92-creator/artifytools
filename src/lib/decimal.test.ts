import { describe, expect, it } from "vitest";
import { Decimal } from "./decimal";

const d = (s: string) => Decimal.parse(s)!;

describe("Decimal", () => {
  it("parses valid and rejects invalid input", () => {
    expect(d("12.50").toFixed(2)).toBe("12.50");
    expect(d("1,234.5").toFixed(2)).toBe("1234.50");
    expect(d(".5").toFixed(1)).toBe("0.5");
    expect(d("-3").toFixed(0)).toBe("-3");
    for (const bad of ["", "abc", "1e5", "1,23", "--1", "1.2.3", "Infinity", "."]) {
      expect(Decimal.parse(bad), bad).toBeNull();
    }
  });
  it("is exact where floats are not", () => {
    expect(d("0.1").add(d("0.2")).toFixed(1)).toBe("0.3");
    expect(d("1.1").mul(d("1.1")).toFixed(2)).toBe("1.21");
  });
  it("rounds half away from zero", () => {
    expect(d("1.005").toFixed(2)).toBe("1.01");
    expect(d("-1.005").toFixed(2)).toBe("-1.01");
    expect(d("2.5").toFixed(0)).toBe("3");
    expect(d("-0.004").toFixed(2)).toBe("0.00");
  });
  it("divides with rounding and guards zero", () => {
    expect(d("1").div(d("3"), 4).toFixed(4)).toBe("0.3333");
    expect(d("2").div(d("3"), 4).toFixed(4)).toBe("0.6667");
    expect(() => d("1").div(d("0"), 2)).toThrow(RangeError);
  });
  it("groups thousands", () => {
    expect(d("1234567.891").toFixed(2, { group: true })).toBe("1,234,567.89");
    expect(d("0.5").toFixed(2, { group: true })).toBe("0.50");
    expect(d("999").toFixed(0, { group: true })).toBe("999");
  });
});
