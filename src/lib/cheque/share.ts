import { getCurrency } from "@/lib/words";
import { FIELD_IDS, fieldsWithinBounds, type ChequeLayout, type DateFormat, type FieldBox, type FieldId } from "./templates";

const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY", "DDMMYYYY-boxes", "YYYYMMDD-boxes"];

/** What a user may choose to share about a custom cheque size: the measurements, never a scan or any cheque details. */
export interface SharedSize {
  name: string;
  country: string;
  bank: string;
  width: number;
  height: number;
  fields: Record<FieldId, FieldBox>;
  dateFormat: DateFormat;
  currency: string;
  wordsLanguage: "en" | "ar";
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f`<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

export function parseSharedSize(body: unknown): SharedSize | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = text(b.name, 60);
  const bank = text(b.bank, 60);
  const country = typeof b.country === "string" && /^[A-Z]{2}$/.test(b.country) ? b.country : "";
  const width = num(b.width), height = num(b.height);
  if (!name || !country || width === null || height === null || width < 60 || width > 320 || height < 30 || height > 320) return null;
  const f = b.fields as Record<string, Record<string, unknown>> | undefined;
  if (!f || typeof f !== "object") return null;
  const fields = {} as Record<FieldId, FieldBox>;
  for (const id of FIELD_IDS) {
    const box = f[id];
    const x = num(box?.x), y = num(box?.y), w = num(box?.w), h = num(box?.h);
    if (x === null || y === null || w === null || h === null) return null;
    fields[id] = { x, y, w, h };
  }
  if (!fieldsWithinBounds({ width, height, fields })) return null;
  const dateFormat = DATE_FORMATS.find((d) => d === b.dateFormat);
  const currency = typeof b.currency === "string" && getCurrency(b.currency) ? b.currency : "";
  if (!dateFormat || !currency || (b.wordsLanguage !== "en" && b.wordsLanguage !== "ar")) return null;
  return { name, country, bank, width, height, fields, dateFormat, currency, wordsLanguage: b.wordsLanguage };
}

export function sharedSizeFrom(l: Pick<ChequeLayout, "country" | "width" | "height" | "fields" | "dateFormat" | "currency" | "wordsLanguage">, name: string, bank: string): SharedSize {
  return { name, bank, country: l.country, width: l.width, height: l.height, fields: l.fields, dateFormat: l.dateFormat, currency: l.currency, wordsLanguage: l.wordsLanguage };
}

export function issueTitle(s: SharedSize): string {
  return `Custom cheque size: ${s.width} × ${s.height} mm (${s.country})`;
}

export function issueBody(s: SharedSize): string {
  return [
    "A visitor chose to share a custom cheque size they created in the Cheque Printer. Review it, then add it to `src/lib/cheque/templates.ts` if it is a real, reusable size.",
    "",
    `- **Name:** ${s.name}`,
    `- **Country:** ${s.country}`,
    `- **Bank:** ${s.bank || "(not given)"}`,
    `- **Size:** ${s.width} × ${s.height} mm`,
    "",
    "```json",
    JSON.stringify(s, null, 2),
    "```",
    "",
    "_Only measurements were shared; no scan, name or amount from any cheque._",
  ].join("\n");
}
