import { Decimal } from "@/lib/decimal";

export type VatMode = "add" | "remove";

export interface VatResult {
  net: string;
  vat: string;
  gross: string;
  rate: string;
}

export type VatOutcome = { ok: true; result: VatResult } | { ok: false; error: string };

const HUNDRED = Decimal.fromInt(100);

const trimZeros = (s: string) => (s.includes(".") ? s.replace(/\.?0+$/, "") : s);

/**
 * "add": the amount is net (excl. VAT); "remove": the amount is gross (incl. VAT).
 * VAT is rounded to 2 decimals (half away from zero); the other figure is derived
 * so that net + VAT always equals gross exactly.
 */
export function calculateVat(mode: VatMode, amountRaw: string, rateRaw: string): VatOutcome {
  if (!amountRaw.trim()) return { ok: false, error: "Enter an amount." };
  if (!rateRaw.trim()) return { ok: false, error: "Enter a VAT rate." };
  const amount = Decimal.parse(amountRaw);
  const rate = Decimal.parse(rateRaw);
  if (!amount) return { ok: false, error: "The amount isn't a valid number." };
  if (!rate) return { ok: false, error: "The VAT rate isn't a valid number." };
  if (rate.isNegative()) return { ok: false, error: "The VAT rate can't be negative." };
  if (rate.cmp(Decimal.fromInt(100)) > 0) return { ok: false, error: "The VAT rate can't exceed 100%." };

  let net: Decimal;
  let vat: Decimal;
  let gross: Decimal;
  if (mode === "add") {
    net = amount.round(2);
    vat = net.mul(rate).div(HUNDRED, 12).round(2);
    gross = net.add(vat);
  } else {
    gross = amount.round(2);
    // net = gross / (1 + rate/100); VAT = gross - net
    const factor = HUNDRED.add(rate);
    net = gross.mul(HUNDRED).div(factor, 12).round(2);
    vat = gross.sub(net);
  }
  const group = { group: true };
  return {
    ok: true,
    result: {
      net: net.toFixed(2, group),
      vat: vat.toFixed(2, group),
      gross: gross.toFixed(2, group),
      rate: `${trimZeros(rate.toFixed(Math.min(rate.scale, 4)))}%`,
    },
  };
}
