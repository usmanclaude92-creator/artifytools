import type { Locale } from "@/lib/i18n";

const units: Record<Locale, string[]> = {
  en: ["B", "KB", "MB", "GB"],
  ar: ["بايت", "ك.ب", "م.ب", "غ.ب"],
};

/** Decimal units (1 KB = 1,000 bytes), as file managers on macOS and most phones show them. */
export function formatBytes(bytes: number, locale: Locale = "en"): string {
  const u = units[locale];
  if (!Number.isFinite(bytes) || bytes < 0) return `0 ${u[0]}`;
  let value = bytes;
  let i = 0;
  while (value >= 1000 && i < u.length - 1) {
    value /= 1000;
    i++;
  }
  const digits = i === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;
  const text = Number(value.toFixed(digits)).toLocaleString("en-US", { maximumFractionDigits: digits });
  return `${text} ${u[i]}`;
}

/** Percentage saved going from `before` to `after` bytes (negative when the file grew). */
export function savingsPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 1000) / 10;
}
