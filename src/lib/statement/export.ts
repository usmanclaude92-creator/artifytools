/** Statement → Excel (.xlsx) and CSV. */
import type { Statement } from "./parse";

export interface ExportLabels {
  sheet: string;
  summarySheet: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  check: string;
  ok: string;
  mismatch: (expected: string) => string;
  unchecked: string;
  total: string;
  summary: { label: string; value: (s: Statement) => string | number | null }[];
}

const numFmt = (d: number) => `#,##0.${"0".repeat(d)}`;

export async function statementToXlsx(s: Statement, l: ExportLabels): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Artify Tools";
  const ws = wb.addWorksheet(l.sheet, { views: [{ state: "frozen", ySplit: 1, rightToLeft: s.rtl }] });
  const fmt = numFmt(s.decimals);
  ws.columns = [
    { header: l.date, key: "date", width: 13 },
    { header: l.description, key: "description", width: 60 },
    { header: l.debit, key: "debit", width: 15, style: { numFmt: fmt } },
    { header: l.credit, key: "credit", width: 15, style: { numFmt: fmt } },
    { header: l.balance, key: "balance", width: 16, style: { numFmt: fmt } },
    { header: l.check, key: "check", width: 22 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEAFB" } };
  const dateFmt = s.dateOrder === "mdy" ? "mm/dd/yyyy" : "dd/mm/yyyy";
  for (const t of s.transactions) {
    const row = ws.addRow({
      date: t.date ? new Date(`${t.date}T00:00:00Z`) : t.dateText,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      balance: t.balance,
      check: t.check === "ok" ? l.ok : t.check === "mismatch" ? l.mismatch(t.expected!.toFixed(s.decimals)) : l.unchecked,
    });
    if (t.date) row.getCell("date").numFmt = dateFmt;
    if (t.check === "mismatch") row.getCell("check").font = { color: { argb: "FFC2410C" }, bold: true };
  }
  const total = ws.addRow({ description: l.total, debit: s.totalDebit, credit: s.totalCredit });
  total.font = { bold: true };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: s.transactions.length + 1, column: 6 } };

  const sum = wb.addWorksheet(l.summarySheet, { views: [{ rightToLeft: s.rtl }] });
  sum.columns = [{ width: 28 }, { width: 22 }];
  for (const item of l.summary) {
    const r = sum.addRow([item.label, item.value(s)]);
    r.getCell(1).font = { bold: true };
    if (typeof item.value(s) === "number") r.getCell(2).numFmt = fmt;
  }
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const csvField = (v: string | number | null) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with ISO dates and plain numbers (UTF-8 with BOM so Excel reads Arabic correctly). */
export function statementToCsv(s: Statement, l: Pick<ExportLabels, "date" | "description" | "debit" | "credit" | "balance">): Blob {
  const n = (x: number | null) => (x === null ? null : x.toFixed(s.decimals));
  const lines = [
    [l.date, l.description, l.debit, l.credit, l.balance].map(csvField).join(","),
    ...s.transactions.map((t) => [t.date ?? t.dateText, t.description, n(t.debit), n(t.credit), n(t.balance)].map(csvField).join(",")),
  ];
  return new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
}
