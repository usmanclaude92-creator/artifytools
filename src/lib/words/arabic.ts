/**
 * Arabic amount in words (تفقيط) in the style used on cheques and invoices:
 * «فقط خمسمائة وثلاثة وعشرون ريالًا عمانيًا وخمسون بيسة لا غير».
 * Numbers agree with the counted noun's gender (3–10 take the opposite form),
 * and the noun takes the form the count requires.
 */
import type { ArabicNoun, Currency, Gender } from "./currencies";

const UNITS: Record<Gender, string[]> = {
  m: ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"],
  f: ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع", "عشر"],
};
const TEENS: Record<Gender, string[]> = {
  m: ["", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"],
  f: ["", "إحدى عشرة", "اثنتا عشرة", "ثلاث عشرة", "أربع عشرة", "خمس عشرة", "ست عشرة", "سبع عشرة", "ثماني عشرة", "تسع عشرة"],
};
const UNIT_IN_COMPOUND: Record<Gender, string[]> = {
  m: ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"],
  f: ["", "إحدى", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع"],
};
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

const SCALES: ArabicNoun[] = [
  { forms: ["ألف", "ألفان", "آلاف", "ألفًا", "ألف"], gender: "m" },
  { forms: ["مليون", "مليونان", "ملايين", "مليونًا", "مليون"], gender: "m" },
  { forms: ["مليار", "ملياران", "مليارات", "مليارًا", "مليار"], gender: "m" },
];

/** 1–999 in words. */
export function below1000(n: number, gender: Gender): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]!);
  if (rest) {
    if (rest <= 10) parts.push(UNITS[gender][rest]!);
    else if (rest < 20) parts.push(TEENS[gender][rest - 10]!);
    else {
      const u = rest % 10;
      const t = TENS[Math.floor(rest / 10)]!;
      parts.push(u ? `${UNIT_IN_COMPOUND[gender][u]} و${t}` : t);
    }
  }
  return parts.join(" و");
}

/** The noun form a count calls for, decided by the last two digits. */
export function nounFor(n: number, noun: ArabicNoun): string {
  const [one, two, few, many, hundreds] = noun.forms;
  if (n === 1) return one;
  if (n === 2) return two;
  const last2 = n % 100;
  if (last2 >= 3 && last2 <= 10) return few;
  if (last2 >= 11) return many;
  return n < 100 ? one : hundreds; // 0, 100, 101, 102, 200…
}

/** A full number with its counted noun, e.g. 1523 + ريال → «ألف وخمسمائة وثلاثة وعشرون ريالًا». */
export function countNoun(n: number, noun: ArabicNoun): string {
  if (n === 0) return `صفر ${noun.forms[4]}`;
  if (n === 1) return `${noun.forms[0]} ${noun.gender === "f" ? "واحدة" : "واحد"}`;
  if (n === 2) return noun.forms[1];
  return `${numberWords(n, noun.gender)} ${nounFor(n, noun)}`;
}

/** Number in words (1 to 999,999,999,999); `gender` is the gender of what is being counted. */
export function numberWords(n: number, gender: Gender = "m"): string {
  if (n === 0) return "صفر";
  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]!;
    if (!g) continue;
    if (i === 0) {
      parts.push(below1000(g, gender));
      continue;
    }
    const scale = SCALES[i - 1]!;
    if (g === 1) parts.push(scale.forms[0]);
    else if (g === 2) parts.push(scale.forms[1]);
    else parts.push(`${below1000(g, scale.gender)} ${nounFor(g, scale)}`);
  }
  return parts.join(" و");
}

export interface ArabicOptions {
  /** Wrap as «فقط … لا غير», the usual cheque form. */
  only?: boolean;
  /** Write the fraction as digits («و 50/1000») instead of words. */
  fractionAsNumber?: boolean;
}

export function amountInArabic(whole: number, fraction: number, currency: Currency, o: ArabicOptions = {}): string {
  const { unit, sub } = currency.ar;
  const parts: string[] = [];
  if (whole > 0 || fraction === 0) parts.push(countNoun(whole, unit));
  if (fraction > 0) {
    if (o.fractionAsNumber) parts.push(`${fraction}/${currency.minor}`);
    else parts.push(countNoun(fraction, sub));
  }
  const text = parts.join(" و");
  return o.only ? `فقط ${text} لا غير` : text;
}
