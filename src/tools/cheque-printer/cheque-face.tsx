"use client";

import type { CSSProperties } from "react";
import { FIELD_IDS, type FieldBox, type FieldId } from "@/lib/cheque/templates";

export const AR_FONT = `var(--font-arabic), "IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`;
export const LATIN_FONT = `Inter, "Segoe UI", Arial, sans-serif`;

export interface ChequeValues {
  date: string;
  dateBoxes: boolean;
  payee: string;
  words1: string;
  words2: string;
  wordsSize: number;
  wordsDir: "ltr" | "rtl";
  figures: string;
  crossing: string;
}

export interface FaceGeometry {
  width: number;
  height: number;
  fields: Record<FieldId, FieldBox>;
  offsetX: number;
  offsetY: number;
  fontSize: number;
}

const LABELS: Record<FieldId, string> = { date: "DATE", payee: "PAY", words1: "AMOUNT (WORDS) 1", words2: "AMOUNT (WORDS) 2", figures: "AMOUNT", crossing: "CROSSING" };

/**
 * One cheque, drawn in real millimetres. "preview" and "test" show the field guides
 * (test prints them on plain paper to line up against a real cheque); "print" draws text only.
 */
export function ChequeFace({ geo, values, mode, highlight, labels = LABELS }: { geo: FaceGeometry; values: ChequeValues; mode: "preview" | "test" | "print"; highlight?: FieldId | null; labels?: Record<FieldId, string> }) {
  const guides = mode !== "print";
  const at = (b: FieldBox, extra?: CSSProperties): CSSProperties => ({
    position: "absolute",
    left: `${b.x + geo.offsetX}mm`,
    top: `${b.y + geo.offsetY}mm`,
    width: `${b.w}mm`,
    height: `${b.h}mm`,
    ...extra,
  });
  const text = (b: FieldBox, size = geo.fontSize): CSSProperties => ({
    fontSize: `${size}pt`,
    lineHeight: `${b.h}mm`,
    whiteSpace: "nowrap",
    color: "#000",
    fontFamily: LATIN_FONT,
  });

  return (
    <div
      dir="ltr"
      data-cheque
      style={{ position: "relative", width: `${geo.width}mm`, height: `${geo.height}mm`, background: mode === "print" ? "transparent" : "#fff", overflow: "hidden" }}
      className={guides ? "outline outline-1 outline-dashed outline-[#9ca3af]" : undefined}
    >
      {guides &&
        FIELD_IDS.map((f) => (
          <div key={f} style={at(geo.fields[f])} className={highlight === f ? "outline outline-2 outline-[#7c3aed]" : "outline outline-1 outline-dotted outline-[#c4b5fd]"}>
            <span style={{ position: "absolute", top: "-2.6mm", left: 0, fontSize: "5pt", color: "#7c3aed", fontFamily: AR_FONT, whiteSpace: "nowrap" }}>{labels[f]}</span>
          </div>
        ))}

      {values.date && (
        <div style={{ ...at(geo.fields.date), ...text(geo.fields.date), display: "flex", justifyContent: values.dateBoxes ? "space-between" : "flex-end" }}>
          {values.dateBoxes ? [...values.date].map((c, i) => <span key={i} style={{ width: `${geo.fields.date.w / values.date.length}mm`, textAlign: "center" }}>{c}</span>) : values.date}
        </div>
      )}
      {values.payee && (
        <div dir="auto" style={{ ...at(geo.fields.payee), ...text(geo.fields.payee), fontFamily: /[؀-ۿ]/.test(values.payee) ? AR_FONT : LATIN_FONT, textAlign: "start" }}>
          {values.payee}
        </div>
      )}
      {values.words1 && (
        <div dir={values.wordsDir} style={{ ...at(geo.fields.words1), ...text(geo.fields.words1, values.wordsSize), fontFamily: values.wordsDir === "rtl" ? AR_FONT : LATIN_FONT, textAlign: "start" }}>
          {values.words1}
        </div>
      )}
      {values.words2 && (
        <div dir={values.wordsDir} style={{ ...at(geo.fields.words2), ...text(geo.fields.words2, values.wordsSize), fontFamily: values.wordsDir === "rtl" ? AR_FONT : LATIN_FONT, textAlign: "start" }}>
          {values.words2}
        </div>
      )}
      {values.figures && (
        <div style={{ ...at(geo.fields.figures), ...text(geo.fields.figures, geo.fontSize + 1), fontWeight: 600, textAlign: "center" }}>{values.figures}</div>
      )}
      {values.crossing && (
        <div style={{ ...at(geo.fields.crossing), display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-14deg)" }}>
          <div style={{ borderTop: "0.4mm solid #000", borderBottom: "0.4mm solid #000", padding: "0.6mm 1.5mm", fontSize: "7pt", fontWeight: 700, whiteSpace: "nowrap", color: "#000", fontFamily: /[؀-ۿ]/.test(values.crossing) ? AR_FONT : LATIN_FONT }} dir="auto">
            {values.crossing}
          </div>
        </div>
      )}
    </div>
  );
}
