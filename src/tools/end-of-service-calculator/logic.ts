import { addMonths, fromDayNumber, parseIsoDate, toDayNumber, type Ymd } from "@/tools/date-difference/logic";

/**
 * End-of-service gratuity estimates for private-sector employees in Saudi
 * Arabia, the UAE and Oman, following each country's labour law:
 *
 * - Saudi Arabia (Labour Law arts. 84–85, 87): half a month's wage for each of
 *   the first five years, one month for each later year, on the last full wage
 *   (basic plus regular allowances). Resignation pays nothing under 2 years,
 *   1/3 for 2–5 years, 2/3 for more than 5 and under 10, the full award from 10.
 * - UAE (Federal Decree-Law 33/2021, art. 51): 21 days' basic wage for each of
 *   the first five years, 30 days for each later year, from one year of
 *   service; daily wage = basic ÷ 30; capped at two years' wage. Resignation
 *   does not reduce it.
 * - Oman (Royal Decree 53/2023, art. 61, for non-Omanis): one month's basic
 *   wage per year for service after 31 July 2023; service up to then follows
 *   the repealed law (15 days per year for the first three years, then one
 *   month), both on the last basic wage.
 *
 * Service is counted in calendar years and months, with leftover days as
 * days ÷ 365, so 1 Jan 2018 – 31 Dec 2024 is exactly 7 years. Unpaid leave is
 * deducted from the service period.
 */

export type Country = "sa" | "ae" | "om";
export type SaReason = "employer" | "resigned" | "full";

export interface GratuityInput {
  country: Country;
  start: string;
  end: string;
  basic: string;
  allowances?: string;
  unpaidDays?: string;
  reason?: SaReason;
}

export type LineKind = "sa-first5" | "sa-after5" | "ae-first5" | "ae-after5" | "om-old-first3" | "om-old-after3" | "om-new";

export interface GratuityLine {
  kind: LineKind;
  years: number;
  /** Months of wage paid per year of service in this band. */
  monthsPerYear: number;
  amount: number;
}

export interface GratuityResult {
  country: Country;
  currency: "SAR" | "AED" | "OMR";
  decimals: number;
  wage: number;
  serviceDays: number;
  serviceYears: number;
  span: { years: number; months: number; days: number };
  lines: GratuityLine[];
  /** Full award before any resignation reduction or cap. */
  gross: number;
  /** Saudi resignation share (1, 2/3, 1/3 or 0); 1 elsewhere. */
  share: number;
  capped: boolean;
  total: number;
  /** Why the total is zero, when it is. */
  nil?: "sa-resigned-under-2" | "ae-under-1";
  /** Oman: the end date falls after the savings system replaces gratuity. */
  omSavings?: boolean;
}

export type GratuityOutcome = { ok: true; result: GratuityResult } | { ok: false; error: string };

export const CURRENCY: Record<Country, { code: GratuityResult["currency"]; decimals: number }> = {
  sa: { code: "SAR", decimals: 2 },
  ae: { code: "AED", decimals: 2 },
  om: { code: "OMR", decimals: 3 },
};

/**
 * First day counted under the Omani Labour Law (RD 53/2023). The Ministry of
 * Labour's worked example treats service up to 31 July 2023 under the old law.
 */
export const OM_NEW_LAW = "2023-08-01";
/** Savings system replaces gratuity for non-Omanis (RD 60/2025). */
export const OM_SAVINGS = "2027-07-19";


function parseAmount(raw: string | undefined): number | null {
  const s = (raw ?? "").replace(/[,\s٬]/g, "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace("٫", ".");
  if (s === "") return 0;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Whole years, months and days from start to the day after end (inclusive span). */
function spanOf(start: Ymd, endExclusive: number): GratuityResult["span"] {
  let years = 0;
  while (toDayNumber(addMonths(start, (years + 1) * 12)) <= endExclusive) years++;
  let months = 0;
  while (toDayNumber(addMonths(start, years * 12 + months + 1)) <= endExclusive) months++;
  const days = endExclusive - toDayNumber(addMonths(start, years * 12 + months));
  return { years, months, days };
}

/** Service years between two day numbers (end exclusive): whole years + months/12 + days/365. */
function yearsBetween(startN: number, endExclusive: number): number {
  if (endExclusive <= startN) return 0;
  const { years, months, days } = spanOf(fromDayNumber(startN), endExclusive);
  return years + months / 12 + days / 365;
}

/** Splits `years` into the first `limit` years and the rest. */
const bands = (years: number, limit: number): [number, number] => [Math.min(years, limit), Math.max(years - limit, 0)];

export function calculateGratuity(input: GratuityInput): GratuityOutcome {
  if (!input.start || !input.end) return { ok: false, error: "Choose the start date and the last working day." };
  const start = parseIsoDate(input.start);
  const end = parseIsoDate(input.end);
  if (!start) return { ok: false, error: "The start date isn't a valid date." };
  if (!end) return { ok: false, error: "The last working day isn't a valid date." };
  const startN = toDayNumber(start);
  const endN = toDayNumber(end) + 1; // the last working day counts
  if (endN <= startN) return { ok: false, error: "The last working day must be on or after the start date." };

  const basic = parseAmount(input.basic);
  if (input.basic.trim() === "") return { ok: false, error: "Enter the monthly salary." };
  if (basic === null) return { ok: false, error: "The salary isn't a valid amount." };
  const allowances = input.country === "sa" ? parseAmount(input.allowances) : 0;
  if (allowances === null) return { ok: false, error: "The allowances aren't a valid amount." };
  const unpaid = parseAmount(input.unpaidDays);
  if (unpaid === null || !Number.isInteger(unpaid)) return { ok: false, error: "Unpaid leave must be a whole number of days." };

  const totalDays = endN - startN;
  if (unpaid >= totalDays) return { ok: false, error: "Unpaid leave can't be longer than the service period." };
  const serviceDays = totalDays - unpaid;
  const serviceYears = yearsBetween(startN, endN - unpaid);
  const { code: currency, decimals } = CURRENCY[input.country];
  const wage = basic + allowances;
  const lines: GratuityLine[] = [];
  let share = 1;
  let capped = false;
  let nil: GratuityResult["nil"];
  let omSavings: boolean | undefined;

  const line = (kind: LineKind, years: number, monthsPerYear: number) => {
    if (years > 0) lines.push({ kind, years, monthsPerYear, amount: round(years * monthsPerYear * wage, decimals) });
  };

  if (input.country === "sa") {
    const [first, rest] = bands(serviceYears, 5);
    line("sa-first5", first, 0.5);
    line("sa-after5", rest, 1);
    if (input.reason === "resigned") {
      if (serviceYears < 2) { share = 0; nil = "sa-resigned-under-2"; }
      else if (serviceYears <= 5) share = 1 / 3;
      else if (serviceYears < 10) share = 2 / 3;
    }
  } else if (input.country === "ae") {
    const [first, rest] = bands(serviceYears, 5);
    line("ae-first5", first, 21 / 30);
    line("ae-after5", rest, 1);
    if (serviceYears < 1) { share = 0; nil = "ae-under-1"; }
  } else {
    // Unpaid leave is taken off the most recent (new-law) period first.
    const split = toDayNumber(parseIsoDate(OM_NEW_LAW)!);
    const oldDays = Math.max(0, Math.min(endN, split) - startN);
    const newDays = Math.max(0, endN - Math.max(startN, split));
    const newAfterLeave = Math.max(0, newDays - unpaid);
    const oldAfterLeave = oldDays - Math.max(0, unpaid - newDays);
    const oldYears = yearsBetween(startN, startN + oldAfterLeave);
    const newFrom = Math.max(startN, split);
    const [first3, rest] = bands(oldYears, 3);
    line("om-old-first3", first3, 0.5);
    line("om-old-after3", rest, 1);
    line("om-new", yearsBetween(newFrom, newFrom + newAfterLeave), 1);
    omSavings = endN - 1 >= toDayNumber(parseIsoDate(OM_SAVINGS)!);
  }

  const gross = round(lines.reduce((s, l) => s + l.amount, 0), decimals);
  let total = round(gross * share, decimals);
  if (input.country === "ae" && total > 24 * wage) { total = round(24 * wage, decimals); capped = true; }

  return {
    ok: true,
    result: {
      country: input.country, currency, decimals, wage, serviceDays, serviceYears,
      span: spanOf(start, endN), lines, gross, share, capped, total, nil, omSavings,
    },
  };
}
