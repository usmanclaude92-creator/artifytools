/**
 * Currencies for amount-in-words. Arabic noun forms follow the counting rules:
 * [1, 2 (dual), 3–10 (plural), 11–99 (accusative singular), 100s/1000s (genitive singular)].
 */
export type Gender = "m" | "f";

export interface ArabicNoun {
  forms: [one: string, two: string, few: string, many: string, hundreds: string];
  gender: Gender;
}

export interface Currency {
  code: string;
  /** Subunits per unit (100 or 1000); 0 for none. */
  minor: number;
  en: { one: string; many: string; minorOne: string; minorMany: string };
  ar: { unit: ArabicNoun; sub: ArabicNoun };
  /** Group digits in lakhs and crores in English (India, Pakistan). */
  indian?: boolean;
}

const m = (one: string, two: string, few: string, many: string, hundreds = one): ArabicNoun => ({ forms: [one, two, few, many, hundreds], gender: "m" });
const f = (one: string, two: string, few: string, many: string, hundreds = one): ArabicNoun => ({ forms: [one, two, few, many, hundreds], gender: "f" });

const baisa = f("بيسة", "بيستان", "بيسات", "بيسة");
const fils = m("فلس", "فلسان", "فلوس", "فلسًا");
const halala = f("هللة", "هللتان", "هللات", "هللة");
const dirham = m("درهم", "درهمان", "دراهم", "درهمًا");
const cent = m("سنت", "سنتان", "سنتات", "سنتًا");
const qirsh = m("قرش", "قرشان", "قروش", "قرشًا");
const penny = m("بنس", "بنسان", "بنسات", "بنسًا");
const paisa = f("بيسة", "بيستان", "بيسات", "بيسة");

export const currencies: Currency[] = [
  { code: "OMR", minor: 1000, en: { one: "Omani Rial", many: "Omani Rials", minorOne: "Baisa", minorMany: "Baisa" }, ar: { unit: m("ريال عماني", "ريالان عمانيان", "ريالات عمانية", "ريالًا عمانيًا"), sub: baisa } },
  { code: "AED", minor: 100, en: { one: "UAE Dirham", many: "UAE Dirhams", minorOne: "Fil", minorMany: "Fils" }, ar: { unit: m("درهم إماراتي", "درهمان إماراتيان", "دراهم إماراتية", "درهمًا إماراتيًا"), sub: fils } },
  { code: "SAR", minor: 100, en: { one: "Saudi Riyal", many: "Saudi Riyals", minorOne: "Halala", minorMany: "Halalas" }, ar: { unit: m("ريال سعودي", "ريالان سعوديان", "ريالات سعودية", "ريالًا سعوديًا"), sub: halala } },
  { code: "KWD", minor: 1000, en: { one: "Kuwaiti Dinar", many: "Kuwaiti Dinars", minorOne: "Fil", minorMany: "Fils" }, ar: { unit: m("دينار كويتي", "ديناران كويتيان", "دنانير كويتية", "دينارًا كويتيًا"), sub: fils } },
  { code: "BHD", minor: 1000, en: { one: "Bahraini Dinar", many: "Bahraini Dinars", minorOne: "Fil", minorMany: "Fils" }, ar: { unit: m("دينار بحريني", "ديناران بحرينيان", "دنانير بحرينية", "دينارًا بحرينيًا"), sub: fils } },
  { code: "QAR", minor: 100, en: { one: "Qatari Riyal", many: "Qatari Riyals", minorOne: "Dirham", minorMany: "Dirhams" }, ar: { unit: m("ريال قطري", "ريالان قطريان", "ريالات قطرية", "ريالًا قطريًا"), sub: dirham } },
  { code: "JOD", minor: 1000, en: { one: "Jordanian Dinar", many: "Jordanian Dinars", minorOne: "Fil", minorMany: "Fils" }, ar: { unit: m("دينار أردني", "ديناران أردنيان", "دنانير أردنية", "دينارًا أردنيًا"), sub: fils } },
  { code: "EGP", minor: 100, en: { one: "Egyptian Pound", many: "Egyptian Pounds", minorOne: "Piastre", minorMany: "Piastres" }, ar: { unit: m("جنيه مصري", "جنيهان مصريان", "جنيهات مصرية", "جنيهًا مصريًا"), sub: qirsh } },
  { code: "USD", minor: 100, en: { one: "US Dollar", many: "US Dollars", minorOne: "Cent", minorMany: "Cents" }, ar: { unit: m("دولار أمريكي", "دولاران أمريكيان", "دولارات أمريكية", "دولارًا أمريكيًا"), sub: cent } },
  { code: "CAD", minor: 100, en: { one: "Canadian Dollar", many: "Canadian Dollars", minorOne: "Cent", minorMany: "Cents" }, ar: { unit: m("دولار كندي", "دولاران كنديان", "دولارات كندية", "دولارًا كنديًا"), sub: cent } },
  { code: "EUR", minor: 100, en: { one: "Euro", many: "Euros", minorOne: "Cent", minorMany: "Cents" }, ar: { unit: m("يورو", "يورو", "يورو", "يورو"), sub: cent } },
  { code: "GBP", minor: 100, en: { one: "Pound Sterling", many: "Pounds Sterling", minorOne: "Penny", minorMany: "Pence" }, ar: { unit: m("جنيه إسترليني", "جنيهان إسترلينيان", "جنيهات إسترلينية", "جنيهًا إسترلينيًا"), sub: penny } },
  { code: "INR", minor: 100, indian: true, en: { one: "Indian Rupee", many: "Indian Rupees", minorOne: "Paisa", minorMany: "Paise" }, ar: { unit: f("روبية هندية", "روبيتان هنديتان", "روبيات هندية", "روبية هندية"), sub: paisa } },
  { code: "PKR", minor: 100, indian: true, en: { one: "Pakistani Rupee", many: "Pakistani Rupees", minorOne: "Paisa", minorMany: "Paisa" }, ar: { unit: f("روبية باكستانية", "روبيتان باكستانيتان", "روبيات باكستانية", "روبية باكستانية"), sub: paisa } },
];

export function getCurrency(code: string): Currency | undefined {
  return currencies.find((c) => c.code === code);
}

/** Splits "1,234.5" (any digits, Arabic separators) into whole and minor units. Null when invalid. */
export function parseAmount(input: string, minor: number): { whole: number; fraction: number } | null {
  const s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/[,٬\s']/g, "");
  const m = /^(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m) return null;
  const whole = Number(m[1]);
  if (!Number.isSafeInteger(whole) || whole > 999_999_999_999) return null;
  const decimals = minor === 1000 ? 3 : minor === 100 ? 2 : 0;
  const frac = (m[2] ?? "").replace(/0+$/, "");
  if (frac.length > decimals) return null;
  const fraction = decimals ? Number((m[2] ?? "").padEnd(decimals, "0").slice(0, decimals) || "0") : 0;
  return { whole, fraction };
}
