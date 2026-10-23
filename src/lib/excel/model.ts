/**
 * Spreadsheet → printable HTML. `readWorkbook` turns an ExcelJS workbook into a plain model;
 * `sheetHtml` turns the model into tables (pure, unit-tested).
 */
import type { Workbook, Worksheet, Cell, Border } from "exceljs";
import SSF from "ssf";

export interface CellOut {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bg?: string;
  size?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  wrap?: boolean;
  colspan?: number;
  rowspan?: number;
  borders?: { t?: string; r?: string; b?: string; l?: string };
  rtl?: boolean;
}

export interface SheetOut {
  name: string;
  /** Column widths in CSS px. */
  cols: number[];
  rows: { height: number; cells: (CellOut | null)[] }[];
  rtl: boolean;
  truncated: boolean;
}

export const MAX_ROWS = 5000;
export const MAX_COLS = 100;

const argb = (c?: { argb?: string }): string | undefined => {
  const v = c?.argb;
  if (!v || !/^[0-9A-Fa-f]{8}$/.test(v)) return undefined;
  return `#${v.slice(2)}`;
};

const BORDER: Record<string, string> = { thin: "1px solid", hair: "1px solid", dotted: "1px dotted", dashed: "1px dashed", medium: "2px solid", mediumDashed: "2px dashed", thick: "3px solid", double: "3px double" };
const border = (b?: Partial<Border>): string | undefined => (b?.style ? `${BORDER[b.style] ?? "1px solid"} ${argb(b.color) ?? "#000"}` : undefined);

/** Excel stores dates as days since 1899-12-30. */
function toSerial(d: Date): number {
  return (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()) - Date.UTC(1899, 11, 30)) / 86_400_000;
}

/** The text Excel shows for a cell, using its number format. */
export function displayText(cell: Pick<Cell, "value" | "numFmt">): { text: string; numeric: boolean } {
  let v: unknown = cell.value;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = v as Record<string, unknown>;
    if ("result" in o) v = o.result;
    else if ("richText" in o) return { text: (o.richText as { text: string }[]).map((r) => r.text).join(""), numeric: false };
    else if ("text" in o) return { text: String(o.text), numeric: false };
    else if ("error" in o) return { text: String(o.error), numeric: false };
    else if ("formula" in o || "sharedFormula" in o) return { text: "", numeric: false };
  }
  if (v === null || v === undefined) return { text: "", numeric: false };
  const fmt = cell.numFmt || "General";
  if (v instanceof Date) {
    try {
      return { text: SSF.format(fmt === "General" ? "yyyy-mm-dd" : fmt, toSerial(v)), numeric: true };
    } catch {
      return { text: v.toISOString().slice(0, 10), numeric: true };
    }
  }
  if (typeof v === "number") {
    try {
      return { text: SSF.format(fmt, v), numeric: true };
    } catch {
      return { text: String(v), numeric: true };
    }
  }
  if (typeof v === "boolean") return { text: v ? "TRUE" : "FALSE", numeric: false };
  return { text: String(v), numeric: false };
}

function readSheet(ws: Worksheet): SheetOut {
  let maxRow = 0, maxCol = 0;
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    row.eachCell({ includeEmpty: false }, (cell, c) => {
      if (displayText(cell).text !== "" || cell.fill?.type === "pattern") {
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      }
    });
  });
  const merges: string[] = ((ws as unknown as { model: { merges?: string[] } }).model.merges ?? []);
  for (const m of merges) {
    const [, , , c2, r2] = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(m) ?? [];
    if (c2 && r2) {
      maxRow = Math.max(maxRow, Number(r2));
      maxCol = Math.max(maxCol, colNumber(c2));
    }
  }
  const truncated = maxRow > MAX_ROWS || maxCol > MAX_COLS;
  maxRow = Math.min(maxRow, MAX_ROWS);
  maxCol = Math.min(maxCol, MAX_COLS);

  const cols = Array.from({ length: maxCol }, (_, i) => {
    const col = ws.getColumn(i + 1);
    if (col.hidden) return 0;
    return Math.round((col.width ?? 8.43) * 7 + 5);
  });

  // Merged areas: the top-left cell spans, the others are skipped.
  const covered = new Set<string>();
  const spans = new Map<string, { colspan: number; rowspan: number }>();
  for (const m of merges) {
    const p = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(m);
    if (!p) continue;
    const c1 = colNumber(p[1]!), r1 = Number(p[2]), c2 = colNumber(p[3]!), r2 = Number(p[4]);
    spans.set(`${r1}:${c1}`, { colspan: c2 - c1 + 1, rowspan: r2 - r1 + 1 });
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) covered.add(`${r}:${c}`);
  }

  const rows: SheetOut["rows"] = [];
  for (let r = 1; r <= maxRow; r++) {
    const row = ws.getRow(r);
    if (row.hidden) continue;
    const cells: (CellOut | null)[] = [];
    for (let c = 1; c <= maxCol; c++) {
      if (covered.has(`${r}:${c}`) || cols[c - 1] === 0) {
        cells.push(null);
        continue;
      }
      const cell = row.getCell(c);
      const { text, numeric } = displayText(cell);
      const f = cell.font ?? {};
      const a = cell.alignment ?? {};
      const fill = cell.fill?.type === "pattern" && cell.fill.pattern === "solid" ? argb(cell.fill.fgColor) : undefined;
      const b = cell.border ?? {};
      const span = spans.get(`${r}:${c}`);
      const h = a.horizontal;
      cells.push({
        text,
        bold: f.bold || undefined,
        italic: f.italic || undefined,
        underline: f.underline ? true : undefined,
        strike: f.strike || undefined,
        color: argb(f.color),
        bg: fill && fill !== "#FFFFFF" ? fill : undefined,
        size: f.size && f.size !== 11 ? f.size : undefined,
        align: h === "center" || h === "centerContinuous" ? "center" : h === "right" ? "right" : h === "left" ? "left" : numeric ? "right" : undefined,
        valign: a.vertical === "top" ? "top" : a.vertical === "middle" ? "middle" : undefined,
        wrap: a.wrapText || undefined,
        colspan: span?.colspan,
        rowspan: span?.rowspan,
        borders: b.top || b.right || b.bottom || b.left ? { t: border(b.top), r: border(b.right), b: border(b.bottom), l: border(b.left) } : undefined,
        rtl: /[֐-ࣿ]/.test(text) || undefined,
      });
    }
    rows.push({ height: Math.round(((row.height as number | undefined) ?? 15) * (4 / 3)), cells });
  }
  const rtl = Boolean((ws.views?.[0] as { rightToLeft?: boolean } | undefined)?.rightToLeft);
  return { name: ws.name, cols, rows, rtl, truncated };
}

function colNumber(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
}

export function readWorkbook(wb: Workbook): SheetOut[] {
  return wb.worksheets.filter((ws) => ws.state !== "hidden" && ws.state !== "veryHidden").map(readSheet);
}

/** Parses simple CSV (quotes, commas or semicolons, CRLF) into one sheet. */
export function csvSheet(text: string, name = "Sheet1"): SheetOut {
  const sep = (text.split("\n")[0]?.split(";").length ?? 0) > (text.split("\n")[0]?.split(",").length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const width = Math.min(MAX_COLS, Math.max(0, ...rows.map((r) => r.length)));
  const body = rows.slice(0, MAX_ROWS);
  return {
    name,
    cols: Array.from({ length: width }, (_, c) => Math.min(320, Math.max(64, ...body.slice(0, 200).map((r) => (r[c] ?? "").length * 7 + 16)))),
    rows: body.map((r, i) => ({
      height: 20,
      cells: Array.from({ length: width }, (_, c) => {
        const t = r[c] ?? "";
        return { text: t, bold: i === 0 || undefined, align: /^-?[\d,.]+%?$/.test(t.trim()) && t.trim() ? "right" : undefined, rtl: /[֐-ࣿ]/.test(t) || undefined };
      }),
    })),
    rtl: false,
    truncated: rows.length > MAX_ROWS,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One sheet as an HTML table. `gridlines` draws light cell borders like Excel's view. */
export function sheetHtml(sheet: SheetOut, opts: { gridlines: boolean; title: boolean }): string {
  const width = sheet.cols.reduce((a, b) => a + b, 0);
  const colgroup = sheet.cols.map((w) => `<col style="width:${w}px">`).join("");
  const body = sheet.rows
    .map((row) => {
      const tds = row.cells
        .map((c, i) => {
          if (!c) return "";
          const st: string[] = [];
          // Like Excel, unwrapped text runs on into empty cells to its right.
          const next = row.cells[i + 1];
          if (c.text && !c.wrap && (!c.align || c.align === "left") && !c.rtl && (i === row.cells.length - 1 || (next && !next.text && !next.bg))) st.push("overflow:visible");
          if (c.bold) st.push("font-weight:700");
          if (c.italic) st.push("font-style:italic");
          if (c.underline || c.strike) st.push(`text-decoration:${[c.underline && "underline", c.strike && "line-through"].filter(Boolean).join(" ")}`);
          if (c.color) st.push(`color:${c.color}`);
          if (c.bg) st.push(`background:${c.bg}`);
          if (c.size) st.push(`font-size:${c.size}pt`);
          if (c.align) st.push(`text-align:${c.align}`);
          if (c.valign) st.push(`vertical-align:${c.valign}`);
          if (c.wrap) st.push("white-space:pre-wrap");
          if (c.borders) for (const [k, side] of [["t", "top"], ["r", "right"], ["b", "bottom"], ["l", "left"]] as const) if (c.borders[k]) st.push(`border-${side}:${c.borders[k]}`);
          const attrs = [c.colspan && c.colspan > 1 ? ` colspan="${c.colspan}"` : "", c.rowspan && c.rowspan > 1 ? ` rowspan="${c.rowspan}"` : "", c.rtl ? ' dir="rtl"' : "", st.length ? ` style="${st.join(";")}"` : ""].join("");
          return `<td${attrs}>${esc(c.text)}</td>`;
        })
        .join("");
      return `<tr style="height:${row.height}px">${tds}</tr>`;
    })
    .join("");
  return `<section class="sheet${opts.gridlines ? " grid" : ""}" data-width="${width}"${sheet.rtl ? ' dir="rtl"' : ""}>${opts.title ? `<h2>${esc(sheet.name)}</h2>` : ""}<table style="width:${width}px"><colgroup>${colgroup}</colgroup><tbody>${body}</tbody></table></section>`;
}

export const SHEET_CSS = `
  .sheet { margin: 0 0 24px; }
  .sheet h2 { font: 600 14px/1.4 Calibri, Arial, sans-serif; margin: 0 0 8px; color: #333; }
  .sheet table { border-collapse: collapse; table-layout: fixed; font: 11pt/1.25 Calibri, Carlito, Arial, sans-serif; color: #000; }
  .sheet td { padding: 1px 4px; white-space: nowrap; overflow: hidden; vertical-align: bottom; }
  .sheet.grid td { outline: 1px solid #d4d4d4; outline-offset: -1px; }
`;
