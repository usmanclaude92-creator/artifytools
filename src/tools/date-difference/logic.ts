/**
 * Calendar-date arithmetic on plain YYYY-MM-DD dates (no clock times, no time
 * zones, no DST), implemented with the proleptic Gregorian calendar so results
 * are identical everywhere.
 */
export interface Ymd {
  y: number;
  m: number; // 1–12
  d: number; // 1–31
}

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!;
}

/** Strict YYYY-MM-DD parser; rejects impossible dates such as 2023-02-29. */
export function parseIsoDate(s: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1 || mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

/** Days since 1970-01-01 (Howard Hinnant's civil-from-days algorithm). */
export function toDayNumber({ y, m, d }: Ymd): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromDayNumber(dayNumber: number): Ymd {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

export function addMonths(date: Ymd, months: number): Ymd {
  const total = date.y * 12 + (date.m - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { y, m, d: Math.min(date.d, daysInMonth(y, m)) };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdayName = (date: Ymd) => WEEKDAYS[(((toDayNumber(date) + 4) % 7) + 7) % 7]!;

export interface DateDifference {
  swapped: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  weeks: number;
  remainderDays: number;
  businessDays: number;
  totalHours: number;
  startWeekday: string;
  endWeekday: string;
}

export type DateOutcome = { ok: true; result: DateDifference } | { ok: false; error: string };

function countBusinessDays(startDay: number, dayCount: number): number {
  const full = Math.floor(dayCount / 7);
  let count = full * 5;
  for (let i = 0; i < dayCount % 7; i++) {
    const dow = (((startDay + full * 7 + i + 4) % 7) + 7) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function dateDifference(startRaw: string, endRaw: string, includeEndDay = false): DateOutcome {
  if (!startRaw.trim() || !endRaw.trim()) return { ok: false, error: "Choose both a start date and an end date." };
  const a = parseIsoDate(startRaw);
  const b = parseIsoDate(endRaw);
  if (!a) return { ok: false, error: "The start date isn't a valid date (use YYYY-MM-DD)." };
  if (!b) return { ok: false, error: "The end date isn't a valid date (use YYYY-MM-DD)." };

  const swapped = toDayNumber(a) > toDayNumber(b);
  const [start, end] = swapped ? [b, a] : [a, b];
  const startDay = toDayNumber(start);
  // Counting the end date itself is the same as measuring up to the following day.
  const endDay = toDayNumber(end) + (includeEndDay ? 1 : 0);
  const effectiveEnd = includeEndDay ? fromDayNumber(endDay) : end;

  let months = (effectiveEnd.y - start.y) * 12 + (effectiveEnd.m - start.m);
  let anchor = addMonths(start, months);
  if (toDayNumber(anchor) > endDay) {
    months -= 1;
    anchor = addMonths(start, months);
  }
  const days = endDay - toDayNumber(anchor);

  const totalDays = endDay - startDay;
  return {
    ok: true,
    result: {
      swapped,
      years: Math.floor(months / 12),
      months: months % 12,
      days,
      totalDays,
      weeks: Math.floor(totalDays / 7),
      remainderDays: totalDays % 7,
      businessDays: countBusinessDays(startDay, totalDays),
      totalHours: totalDays * 24,
      startWeekday: weekdayName(start),
      endWeekday: weekdayName(end),
    },
  };
}

export type Direction = "add" | "subtract";

export interface ShiftedDate {
  date: Ymd;
  iso: string;
  weekday: string;
  /** Calendar days from the start date to the result (negative when going back). */
  totalDays: number;
}

export type ShiftOutcome = { ok: true; result: ShiftedDate } | { ok: false; error: string };

const MAX_AMOUNT = 1_000_000;

/** An empty box counts as 0. Only whole, non-negative numbers are accepted. */
export function parseAmount(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return 0;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n <= MAX_AMOUNT ? n : null;
}

export const formatIso = ({ y, m, d }: Ymd) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * Adds or subtracts years, months and days. Years and months move first, keeping the day of the month
 * (clamped to the last day of a shorter month: 31 Jan + 1 month = 28/29 Feb), then days are counted.
 */
export function shiftDate(startRaw: string, direction: Direction, yearsRaw: string, monthsRaw: string, daysRaw: string): ShiftOutcome {
  if (!startRaw.trim()) return { ok: false, error: "Choose a start date." };
  const start = parseIsoDate(startRaw);
  if (!start) return { ok: false, error: "The start date isn't a valid date (use YYYY-MM-DD)." };
  const years = parseAmount(yearsRaw);
  const months = parseAmount(monthsRaw);
  const days = parseAmount(daysRaw);
  if (years === null || months === null || days === null) return { ok: false, error: "Enter whole numbers of years, months and days (0 to 1,000,000)." };

  const sign = direction === "add" ? 1 : -1;
  const moved = addMonths(start, sign * (years * 12 + months));
  const date = fromDayNumber(toDayNumber(moved) + sign * days);
  if (date.y < 1 || date.y > 9999) return { ok: false, error: "The result is outside the supported years (1 to 9999)." };
  return { ok: true, result: { date, iso: formatIso(date), weekday: weekdayName(date), totalDays: toDayNumber(date) - toDayNumber(start) } };
}
