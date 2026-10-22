import { Decimal } from "@/lib/decimal";

export interface DiscountResult {
  original: string;
  saved: string;
  final: string;
  effectivePercent: string;
}

export type DiscountOutcome = { ok: true; result: DiscountResult } | { ok: false; error: string };

const HUNDRED = Decimal.fromInt(100);

function pct(raw: string, label: string): Decimal | string {
  const d = Decimal.parse(raw);
  if (!d) return `${label} isn't a valid number.`;
  if (d.isNegative()) return `${label} can't be negative.`;
  if (d.cmp(HUNDRED) > 0) return `${label} can't exceed 100%.`;
  return d;
}

function trimPct(d: Decimal): string {
  const s = d.toFixed(2);
  return `${s.replace(/\.?0+$/, "")}%`;
}

/** Final price after a discount, with an optional second discount applied to the reduced price. */
export function priceAfterDiscount(originalRaw: string, discountRaw: string, extraRaw = ""): DiscountOutcome {
  if (!originalRaw.trim()) return { ok: false, error: "Enter the original price." };
  if (!discountRaw.trim()) return { ok: false, error: "Enter a discount percentage." };
  const original = Decimal.parse(originalRaw);
  if (!original) return { ok: false, error: "The original price isn't a valid number." };
  if (original.isNegative()) return { ok: false, error: "The original price can't be negative." };
  const first = pct(discountRaw, "The discount");
  if (typeof first === "string") return { ok: false, error: first };
  let second: Decimal | null = null;
  if (extraRaw.trim()) {
    const s = pct(extraRaw, "The extra discount");
    if (typeof s === "string") return { ok: false, error: s };
    second = s;
  }
  const base = original.round(2);
  let price = base.sub(base.mul(first).div(HUNDRED, 12).round(2));
  if (second) price = price.sub(price.mul(second).div(HUNDRED, 12).round(2));
  const saved = base.sub(price);
  const effective = base.isZero() ? Decimal.fromInt(0) : saved.mul(HUNDRED).div(base, 6);
  return {
    ok: true,
    result: {
      original: base.toFixed(2, { group: true }),
      saved: saved.toFixed(2, { group: true }),
      final: price.toFixed(2, { group: true }),
      effectivePercent: trimPct(effective),
    },
  };
}

/** Discount percentage given an original and a sale price. */
export function discountFromPrices(originalRaw: string, saleRaw: string): DiscountOutcome {
  if (!originalRaw.trim() || !saleRaw.trim()) return { ok: false, error: "Enter both the original and the sale price." };
  const original = Decimal.parse(originalRaw);
  const sale = Decimal.parse(saleRaw);
  if (!original) return { ok: false, error: "The original price isn't a valid number." };
  if (!sale) return { ok: false, error: "The sale price isn't a valid number." };
  if (original.isNegative() || sale.isNegative()) return { ok: false, error: "Prices can't be negative." };
  if (original.isZero()) return { ok: false, error: "The original price can't be zero." };
  const saved = original.sub(sale);
  const percent = saved.mul(HUNDRED).div(original, 6);
  return {
    ok: true,
    result: {
      original: original.round(2).toFixed(2, { group: true }),
      saved: saved.round(2).toFixed(2, { group: true }),
      final: sale.round(2).toFixed(2, { group: true }),
      effectivePercent: trimPct(percent),
    },
  };
}
