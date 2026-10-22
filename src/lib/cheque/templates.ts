/**
 * Cheque layouts. Positions are in millimetres from the cheque's top-left corner; each text
 * field is a box (x, y = top, w = width, h = line height). Only values taken from a published
 * standard are marked verified — everything else is a starting point the user calibrates
 * with a test print. We never draw bank logos, MICR lines or anything that imitates a cheque.
 */

export type FieldId = "date" | "payee" | "words1" | "words2" | "figures" | "crossing";
export type DateFormat = "DD/MM/YYYY" | "DD-MM-YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY" | "DDMMYYYY-boxes" | "YYYYMMDD-boxes";

export interface FieldBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChequeLayout {
  id: string;
  /** English and Arabic display names. */
  name: { en: string; ar: string };
  country: string;
  width: number;
  height: number;
  fields: Record<FieldId, FieldBox>;
  dateFormat: DateFormat;
  currency: string;
  wordsLanguage: "en" | "ar";
  /** Which parts come from a published standard, with the source. Empty = all estimated. */
  verified: { fields: FieldId[] | "size-only"; source: string } | null;
}

/** Field positions for a typical wide cheque, scaled to the given size. */
function typical(width: number, height: number): Record<FieldId, FieldBox> {
  const sx = width / 203;
  const sy = height / 89;
  const box = (x: number, y: number, w: number, h: number): FieldBox => ({ x: +(x * sx).toFixed(1), y: +(y * sy).toFixed(1), w: +(w * sx).toFixed(1), h: +(h * sy).toFixed(1) });
  return {
    date: box(148, 7, 48, 7),
    payee: box(20, 24, 150, 7),
    words1: box(30, 34, 140, 7),
    words2: box(8, 42, 128, 7),
    figures: box(150, 41, 46, 8),
    crossing: box(6, 3, 34, 10),
  };
}

const GCC = (id: string, en: string, ar: string, country: string, currency: string): ChequeLayout => ({
  id,
  name: { en, ar },
  country,
  width: 203,
  height: 89,
  fields: typical(203, 89),
  dateFormat: "DD/MM/YYYY",
  currency,
  wordsLanguage: "ar",
  verified: null,
});

const caWidth = 158.8;
const caHeight = 69.9;
const canada: ChequeLayout = {
  id: "ca-personal",
  name: { en: "Canada · personal cheque (CPA 006)", ar: "كندا · شيك شخصي (CPA 006)" },
  country: "CA",
  width: caWidth,
  height: caHeight,
  fields: {
    ...typical(caWidth, caHeight),
    // Standard 006 §5.4.3: amount area 67.3 mm long, from the right edge; 30.4–54.6 mm above the bottom edge.
    figures: { x: +(caWidth - 67.3 + 6).toFixed(1), y: +(caHeight - 54.6 + 8).toFixed(1), w: 58, h: 8 },
  },
  dateFormat: "YYYYMMDD-boxes",
  currency: "CAD",
  wordsLanguage: "en",
  verified: { fields: ["figures"], source: "Payments Canada Standard 006, §3.3 and §5.4.3" },
};

export const LAYOUTS: ChequeLayout[] = [
  GCC("om", "Oman · typical cheque", "عُمان · شيك نموذجي", "OM", "OMR"),
  GCC("ae", "UAE · typical cheque", "الإمارات · شيك نموذجي", "AE", "AED"),
  GCC("sa", "Saudi Arabia · typical cheque", "السعودية · شيك نموذجي", "SA", "SAR"),
  GCC("kw", "Kuwait · typical cheque", "الكويت · شيك نموذجي", "KW", "KWD"),
  GCC("bh", "Bahrain · typical cheque", "البحرين · شيك نموذجي", "BH", "BHD"),
  GCC("qa", "Qatar · typical cheque", "قطر · شيك نموذجي", "QA", "QAR"),
  { ...GCC("eg", "Egypt · typical cheque", "مصر · شيك نموذجي", "EG", "EGP") },
  { ...GCC("jo", "Jordan · typical cheque", "الأردن · شيك نموذجي", "JO", "JOD") },
  {
    id: "in-cts",
    name: { en: "India · CTS-2010 cheque", ar: "الهند · شيك CTS-2010" },
    country: "IN",
    width: 202,
    height: 92,
    fields: typical(202, 92),
    dateFormat: "DDMMYYYY-boxes",
    currency: "INR",
    wordsLanguage: "en",
    verified: { fields: "size-only", source: "CTS-2010 standard leaf size (202 × 92 mm)" },
  },
  { ...GCC("pk", "Pakistan · typical cheque", "باكستان · شيك نموذجي", "PK", "PKR"), wordsLanguage: "en" },
  { ...GCC("gb", "United Kingdom · typical cheque", "المملكة المتحدة · شيك نموذجي", "GB", "GBP"), width: 178, height: 85, fields: typical(178, 85), wordsLanguage: "en" },
  { id: "us-personal", name: { en: "United States · personal check (6 × 2¾ in)", ar: "الولايات المتحدة · شيك شخصي" }, country: "US", width: 152.4, height: 69.9, fields: typical(152.4, 69.9), dateFormat: "MM/DD/YYYY", currency: "USD", wordsLanguage: "en", verified: null },
  { id: "us-business", name: { en: "United States · business check (8½ × 3½ in)", ar: "الولايات المتحدة · شيك تجاري" }, country: "US", width: 215.9, height: 88.9, fields: typical(215.9, 88.9), dateFormat: "MM/DD/YYYY", currency: "USD", wordsLanguage: "en", verified: null },
  canada,
  { ...GCC("eu", "Europe · typical cheque", "أوروبا · شيك نموذجي", "EU", "EUR"), width: 175, height: 80, fields: typical(175, 80), wordsLanguage: "en" },
];

export const FIELD_IDS: FieldId[] = ["date", "payee", "words1", "words2", "figures", "crossing"];

export function getLayout(id: string): ChequeLayout | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

/** True when every field box sits fully on the cheque. */
export function fieldsWithinBounds(l: Pick<ChequeLayout, "width" | "height" | "fields">): boolean {
  return FIELD_IDS.every((f) => {
    const b = l.fields[f];
    return b.x >= 0 && b.y >= 0 && b.x + b.w <= l.width + 0.01 && b.y + b.h <= l.height + 0.01;
  });
}
