/** PDF → Excel (.xlsx) in the browser: pdf.js text positions → table grid → ExcelJS workbook. */
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { pageTable, parseNumber, type PageTable } from "./table";
import { readPageText } from "./to-word";

export type SheetLayout = "per-page" | "single";

export interface ExcelSummary {
  pages: number;
  rows: number;
  /** Pages with no text (usually scans). */
  emptyPages: number[];
}

export async function pdfToXlsx(doc: PDFDocumentProxy, opts: { layout: SheetLayout; onProgress?: (done: number, total: number) => void }): Promise<{ blob: Blob; summary: ExcelSummary; preview: PageTable | null }> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Artify Tools";
  const summary: ExcelSummary = { pages: doc.numPages, rows: 0, emptyPages: [] };
  let preview: PageTable | null = null;
  let single: import("exceljs").Worksheet | null = null;
  const widths = new Map<import("exceljs").Worksheet, number[]>();

  for (let p = 1; p <= doc.numPages; p++) {
    const { items } = await readPageText(doc, p);
    const table = pageTable(items);
    opts.onProgress?.(p, doc.numPages);
    if (!table.rows.length) {
      summary.emptyPages.push(p);
      continue;
    }
    preview ??= table;
    let ws: import("exceljs").Worksheet;
    if (opts.layout === "single") {
      single ??= wb.addWorksheet("Sheet1", { views: [{ rightToLeft: table.rtl }] });
      ws = single;
      if (ws.rowCount > 0) ws.addRow([]);
    } else {
      ws = wb.addWorksheet(`Page ${p}`, { views: [{ rightToLeft: table.rtl }] });
    }
    const w = widths.get(ws) ?? [];
    for (const cells of table.rows) {
      const row = ws.addRow(cells.map(() => null));
      cells.forEach((c, i) => {
        if (!c) return;
        const cell = row.getCell(i + 1);
        const n = parseNumber(c.text);
        if (n) {
          cell.value = n.value;
          cell.numFmt = n.numFmt;
        } else cell.value = c.text;
        if (c.bold) cell.font = { bold: true };
        w[i] = Math.max(w[i] ?? 8, Math.min(60, c.text.length * 1.1 + 2));
      });
      summary.rows++;
    }
    widths.set(ws, w);
  }
  for (const [ws, w] of widths) w.forEach((width, i) => (ws.getColumn(i + 1).width = width));
  if (!wb.worksheets.length) wb.addWorksheet("Sheet1");
  const buffer = await wb.xlsx.writeBuffer();
  return { blob: new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), summary, preview };
}
