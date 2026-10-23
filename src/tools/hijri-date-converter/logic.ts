import { fromDayNumber, parseIsoDate, toDayNumber, type Ymd } from "@/tools/date-difference/logic";

/**
 * Hijri ↔ Gregorian conversion on the Umm al-Qura calendar (the official
 * calendar of Saudi Arabia), using the browser's built-in ICU calendar data.
 * The Umm al-Qura tables cover 1300–1600 AH; this tool accepts 1343–1500 AH
 * (1924–2077), where every engine agrees.
 */

export const MIN_HIJRI_YEAR = 1343;
export const MAX_HIJRI_YEAR = 1500;
export const MIN_GREGORIAN = "1924-08-02"; // 1 Muharram 1343
export const MAX_GREGORIAN = "2077-11-16"; // 30 Dhu al-Hijjah 1500

export interface HijriDate {
  y: number;
  m: number; // 1–12
  d: number; // 1–30
}

export interface Converted {
  gregorian: Ymd;
  hijri: HijriDate;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** Days in this Hijri month (29 or 30). */
  hijriMonthLength: number;
}

export type ConvertOutcome = { ok: true; result: Converted } | { ok: false; error: string };

let formatter: Intl.DateTimeFormat | null = null;

/** True when this browser has the Umm al-Qura calendar. */
export function calendarSupported(): boolean {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura").resolvedOptions().calendar === "islamic-umalqura";
  } catch {
    return false;
  }
}

function hijriOfDay(dayNumber: number): HijriDate {
  formatter ??= new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: "UTC", day: "numeric", month: "numeric", year: "numeric" });
  const parts = formatter.formatToParts(new Date(dayNumber * 86_400_000));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

const cmp = (a: HijriDate, b: HijriDate) => a.y - b.y || a.m - b.m || a.d - b.d;
const weekdayOf = (n: number) => (((n + 4) % 7) + 7) % 7;

/** Day number of 1 <month> <year> AH. */
function monthStart(y: number, m: number): number {
  // Mean-month estimate (1 Muharram 1 AH = 16 July 622), then correct by the remaining offset.
  let n = Math.round((y - 1) * 354.36667 + (m - 1) * 29.530589) + toDayNumber({ y: 622, m: 7, d: 16 });
  for (let i = 0; i < 20; i++) {
    const h = hijriOfDay(n);
    const off = Math.round((h.y - y) * 354.36667 + (h.m - m) * 29.530589) + (h.d - 1);
    if (h.y === y && h.m === m && h.d === 1) break;
    n -= off === 0 ? Math.sign(cmp(h, { y, m, d: 1 })) : off;
  }
  return n;
}

function build(dayNumber: number): Converted {
  const hijri = hijriOfDay(dayNumber);
  const start = dayNumber - (hijri.d - 1);
  const next = hijriOfDay(start + 29);
  return { gregorian: fromDayNumber(dayNumber), hijri, weekday: weekdayOf(dayNumber), hijriMonthLength: next.d === 30 ? 30 : 29 };
}

export function gregorianToHijri(iso: string): ConvertOutcome {
  if (!iso) return { ok: false, error: "Choose a date." };
  const g = parseIsoDate(iso);
  if (!g) return { ok: false, error: "That isn't a valid date." };
  if (iso < MIN_GREGORIAN || iso > MAX_GREGORIAN) return { ok: false, error: "Choose a date between 1924 and 2077." };
  return { ok: true, result: build(toDayNumber(g)) };
}

export function hijriToGregorian(yRaw: string, m: number, d: number): ConvertOutcome {
  const y = Number(yRaw.trim().replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)));
  if (!yRaw.trim()) return { ok: false, error: "Enter the Hijri year." };
  if (!Number.isInteger(y)) return { ok: false, error: "The Hijri year must be a whole number." };
  if (y < MIN_HIJRI_YEAR || y > MAX_HIJRI_YEAR) return { ok: false, error: "Enter a Hijri year between 1343 and 1500." };
  const start = monthStart(y, m);
  const result = build(start);
  if (d > result.hijriMonthLength) return { ok: false, error: "This month has only 29 days in the Umm al-Qura calendar." };
  return { ok: true, result: build(start + d - 1) };
}

export function toIso({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
