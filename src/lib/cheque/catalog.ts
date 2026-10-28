import type { Locale } from "@/lib/i18n";
import { LAYOUTS, FIELD_IDS, type ChequeLayout, type FieldBox, type FieldId } from "./templates";

export const GENERIC_BANK = { id: "generic", name: { en: "Standard / any bank", ar: "قياسي / أي بنك" } };

export interface BankEntry { id: string; name: { en: string; ar: string }; layouts: ChequeLayout[] }
export interface CountryEntry { code: string; banks: BankEntry[] }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const area = (l: ChequeLayout) => l.width * l.height;

/** Countries → banks → cheque sizes (smallest first). Layouts without a bank are the country's standard sizes. */
export function buildCatalog(layouts: readonly ChequeLayout[] = LAYOUTS): CountryEntry[] {
  const countries = new Map<string, Map<string, BankEntry>>();
  for (const l of layouts) {
    const banks = countries.get(l.country) ?? countries.set(l.country, new Map()).get(l.country)!;
    const id = l.bank ? slug(l.bank.en) : GENERIC_BANK.id;
    const bank = banks.get(id) ?? banks.set(id, { id, name: l.bank ?? GENERIC_BANK.name, layouts: [] }).get(id)!;
    bank.layouts.push(l);
  }
  return [...countries].map(([code, banks]) => ({
    code,
    banks: [...banks.values()]
      .map((b) => ({ ...b, layouts: [...b.layouts].sort((a, c) => area(a) - area(c)) }))
      .sort((a, b) => (a.id === GENERIC_BANK.id ? -1 : b.id === GENERIC_BANK.id ? 1 : a.name.en.localeCompare(b.name.en))),
  }));
}

export const CATALOG = buildCatalog();

export function locate(id: string): { country: string; bank: string } | null {
  const l = LAYOUTS.find((x) => x.id === id);
  return l ? { country: l.country, bank: l.bank ? slug(l.bank.en) : GENERIC_BANK.id } : null;
}

/** "203 × 89 mm" */
export function sizeLabel(l: Pick<ChequeLayout, "width" | "height">): string {
  const n = (v: number) => String(+v.toFixed(1));
  return `${n(l.width)} × ${n(l.height)} mm`;
}

/** Moves the field boxes along when the cheque is resized, so a custom size starts with sensible positions. */
export function scaleFields(fields: Record<FieldId, FieldBox>, from: { width: number; height: number }, to: { width: number; height: number }): Record<FieldId, FieldBox> {
  const sx = to.width / from.width, sy = to.height / from.height;
  const r = (v: number) => +v.toFixed(1);
  return Object.fromEntries(FIELD_IDS.map((f) => [f, { x: r(fields[f].x * sx), y: r(fields[f].y * sy), w: r(fields[f].w * sx), h: r(fields[f].h * sy) }])) as Record<FieldId, FieldBox>;
}

export function countryName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
