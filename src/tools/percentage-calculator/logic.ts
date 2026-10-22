import { Decimal } from "@/lib/decimal";

export type PercentageMode = "of" | "is-what" | "change";

export interface PercentageResult {
  /** Headline value, formatted. */
  value: string;
  /** Human-readable sentence describing the result. */
  sentence: string;
  /** Short note on how the answer was computed. */
  formula: string;
}

export type PercentageOutcome = { ok: true; result: PercentageResult } | { ok: false; error: string };

const HUNDRED = Decimal.fromInt(100);
const PRECISION = 10;

function fmt(d: Decimal, places: number): string {
  // Trim trailing zeros after the point for a natural-looking answer.
  const s = d.toFixed(places, { group: true });
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function calculatePercentage(
  mode: PercentageMode,
  aRaw: string,
  bRaw: string,
  places = 2,
): PercentageOutcome {
  if (!aRaw.trim() || !bRaw.trim()) return { ok: false, error: "Enter both numbers to calculate." };
  const a = Decimal.parse(aRaw);
  const b = Decimal.parse(bRaw);
  if (!a) return { ok: false, error: "The first value isn't a valid number." };
  if (!b) return { ok: false, error: "The second value isn't a valid number." };

  switch (mode) {
    case "of": {
      // a% of b
      const r = a.mul(b).div(HUNDRED, PRECISION);
      return {
        ok: true,
        result: {
          value: fmt(r, places),
          sentence: `${fmt(a, 6)}% of ${fmt(b, 6)} is ${fmt(r, places)}`,
          formula: `${fmt(b, 6)} × ${fmt(a, 6)} ÷ 100`,
        },
      };
    }
    case "is-what": {
      // a is what % of b
      if (b.isZero()) return { ok: false, error: "The second value can't be zero when finding a percentage of it." };
      const r = a.mul(HUNDRED).div(b, PRECISION);
      return {
        ok: true,
        result: {
          value: `${fmt(r, places)}%`,
          sentence: `${fmt(a, 6)} is ${fmt(r, places)}% of ${fmt(b, 6)}`,
          formula: `${fmt(a, 6)} ÷ ${fmt(b, 6)} × 100`,
        },
      };
    }
    case "change": {
      // change from a to b
      if (a.isZero()) return { ok: false, error: "Percentage change from zero is undefined. Use a non-zero starting value." };
      const r = b.sub(a).mul(HUNDRED).div(a.abs(), PRECISION);
      const rounded = r.round(places);
      const dir = rounded.isZero() ? "no change" : rounded.isNegative() ? "a decrease" : "an increase";
      return {
        ok: true,
        result: {
          value: `${rounded.isNegative() || rounded.isZero() ? "" : "+"}${fmt(r, places)}%`,
          sentence: `From ${fmt(a, 6)} to ${fmt(b, 6)} is ${dir}${rounded.isZero() ? "" : ` of ${fmt(r.abs(), places)}%`}`,
          formula: `(${fmt(b, 6)} − ${fmt(a, 6)}) ÷ |${fmt(a, 6)}| × 100`,
        },
      };
    }
  }
}
