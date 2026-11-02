/** English amount in words. Cheque style: "Five Hundred Twenty-Three Omani Rials and Fifty Baisa Only"; Arab bank style (currencyFirst): "Omani Rials Five Hundred Twenty Three and Baisa Fifty Only". */
import type { Currency } from "./currencies";

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n: number, hyphen = true): string {
  if (n < 20) return ONES[n]!;
  const t = TENS[Math.floor(n / 10)]!;
  return n % 10 ? `${t}${hyphen ? "-" : " "}${ONES[n % 10]}` : t;
}

function below1000(n: number, hyphen = true): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? below100(r, hyphen) : ""].filter(Boolean).join(" ");
}

/** International grouping: thousand, million, billion. Indian: thousand, lakh, crore. */
export function englishNumber(n: number, indian = false, hyphen = true): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (indian) {
    const crore = Math.floor(n / 10_000_000);
    const lakh = Math.floor((n % 10_000_000) / 100_000);
    const thousand = Math.floor((n % 100_000) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${englishNumber(crore, true, hyphen)} Crore`);
    if (lakh) parts.push(`${below100(lakh, hyphen)} Lakh`);
    if (thousand) parts.push(`${below100(thousand, hyphen)} Thousand`);
    if (rest) parts.push(below1000(rest, hyphen));
    return parts.join(" ");
  }
  const scales = ["", "Thousand", "Million", "Billion"];
  let i = 0;
  let rest = n;
  while (rest > 0) {
    const g = rest % 1000;
    if (g) parts.unshift(`${below1000(g, hyphen)}${scales[i] ? ` ${scales[i]}` : ""}`);
    rest = Math.floor(rest / 1000);
    i++;
  }
  return parts.join(" ");
}

export interface EnglishOptions {
  only?: boolean;
  fractionAsNumber?: boolean;
  uppercase?: boolean;
  /** Use Indian grouping (lakh, crore); defaults to the currency's convention. */
  indian?: boolean;
  /**
   * Arab bank style: the currency name comes first, then the number, with no hyphens:
   * "Omani Rials One Thousand Two Hundred Fifty and Baisa Seven Hundred Fifty One Only".
   */
  currencyFirst?: boolean;
}

/** Currencies whose banks write amounts with the currency name first. */
const CURRENCY_FIRST = new Set(["OMR", "AED", "SAR", "KWD", "BHD", "QAR", "JOD", "EGP"]);
export const prefersCurrencyFirst = (code: string) => CURRENCY_FIRST.has(code);

export function amountInEnglish(whole: number, fraction: number, currency: Currency, o: EnglishOptions = {}): string {
  const indian = o.indian ?? Boolean(currency.indian);
  const { one, many, minorOne, minorMany } = currency.en;
  const parts: string[] = [];
  if (o.currencyFirst) {
    if (whole > 0 || fraction === 0) parts.push(`${whole === 1 ? one : many} ${englishNumber(whole, indian, false)}`);
    if (fraction > 0) {
      if (o.fractionAsNumber) parts.push(`${fraction === 1 ? minorOne : minorMany} ${String(fraction).padStart(String(currency.minor).length - 1, "0")}/${currency.minor}`);
      else parts.push(`${fraction === 1 ? minorOne : minorMany} ${englishNumber(fraction, false, false)}`);
    }
  } else {
    if (whole > 0 || fraction === 0) parts.push(`${englishNumber(whole, indian)} ${whole === 1 ? one : many}`);
    if (fraction > 0) {
      if (o.fractionAsNumber) parts.push(`${String(fraction).padStart(String(currency.minor).length - 1, "0")}/${currency.minor}`);
      else parts.push(`${englishNumber(fraction)} ${fraction === 1 ? minorOne : minorMany}`);
    }
  }
  let text = parts.join(" and ");
  if (o.only) text += " Only";
  return o.uppercase ? text.toUpperCase() : text;
}
