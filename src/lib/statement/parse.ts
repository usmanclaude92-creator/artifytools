/**
 * Bank statement PDF → transactions (pure, unit-tested).
 *
 * Works from positioned text (pdf.js items): finds the column header (Date, Description,
 * Debit, Credit, Amount, Balance, in English or Arabic), assigns every cell to the nearest
 * header column, starts a transaction at each line with a date (or new amounts), joins
 * description lines that wrap, skips repeated headers, page footers and totals, and checks
 * every running balance against the one before it.
 */
import { groupLines, type TextItem } from "@/lib/pdf/text-layout";
import { lineCells } from "@/lib/pdf/table";

export type Role = "date" | "description" | "debit" | "credit" | "amount" | "balance" | "other";
export type DateOrder = "dmy" | "mdy";

export interface Transaction {
  /** The date as printed. */
  dateText: string;
  /** ISO yyyy-mm-dd when the date could be read. */
  date: string | null;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  /** Running-balance check against the previous row. */
  check: "ok" | "mismatch" | "unchecked";
  /** Expected balance when the check failed. */
  expected?: number;
  page: number;
}

export interface Statement {
  transactions: Transaction[];
  opening: number | null;
  closing: number | null;
  totalDebit: number;
  totalCredit: number;
  decimals: number;
  dateOrder: DateOrder;
  /** Transactions listed newest first (the balance check runs bottom-up). */
  newestFirst: boolean;
  /** Whether a column header row was found (otherwise columns were inferred). */
  headerFound: boolean;
  rtl: boolean;
  checked: number;
  mismatches: number;
  /** Pages that had no text at all (usually scans). */
  emptyPages: number[];
  /** The opening/closing balances came from the account summary box rather than a table row. */
  fromSummary?: boolean;
}

interface Cell {
  x0: number;
  x1: number;
  text: string;
}

export interface Column {
  role: Role;
  x0: number;
  x1: number;
}

const DIGITS = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

const ROLE_WORDS: [Role, RegExp][] = [
  ["balance", /^(running |available |ledger |closing )?balance( \(.*\))?$|^bal\.?$|الرصيد|رصيد/i],
  ["debit", /^(debit|debits|withdrawals?|paid out|money out|dr\.?|outflow|charges?|مدين|سحب|مسحوبات|السحب|المدين|خصم|سحوبات)( amount)?( \(.*\))?$/i],
  ["credit", /^(credit|credits|deposits?|paid in|money in|cr\.?|inflow|دائن|إيداع|ايداع|إيداعات|ايداعات|الإيداع|الدائن|إضافة)( amount)?( \(.*\))?$/i],
  ["amount", /^(amount|transaction amount|amt|المبلغ|مبلغ)( \(.*\))?$/i],
  ["date", /^((txn|tran|trans|transaction|posting|post|book|booking|entry)\.? )?date$|^date$|^التاريخ$|^تاريخ( العملية| الحركة)?$/i],
  ["other", /^value date$|^تاريخ (القيد|الاستحقاق)$|^(ref|reference|cheque|chq|check|doc)\.?( no\.?| number)?$|^المرجع$|^رقم (الشيك|المرجع)$/i],
  ["description", /^(description|details|transaction details|narration|narrative|particulars|remarks|memo|transaction|البيان|الوصف|التفاصيل|تفاصيل( العملية)?|البيانات|الشرح)$/i],
];

export function roleOf(header: string): Role | null {
  const t = header.trim().replace(/\s+/g, " ").replace(/:$/, "");
  for (const [role, re] of ROLE_WORDS) if (re.test(t)) return role;
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  يناير: 1, فبراير: 2, مارس: 3, أبريل: 4, ابريل: 4, مايو: 5, يونيو: 6, يوليو: 7, أغسطس: 8, اغسطس: 8, سبتمبر: 9, أكتوبر: 10, اكتوبر: 10, نوفمبر: 11, ديسمبر: 12,
};

/** A date at the start of a cell: numbers in either order, or with a month name. `a`/`b` are the first two numbers for d/m vs m/d. */
interface RawDate {
  a: number;
  b: number;
  y: number | null;
  named: boolean;
  /** Year written first (yyyy-mm-dd). */
  iso: boolean;
}

export function readDate(text: string): RawDate | null {
  // Right-to-left PDFs often give "2026 / 09 / 01" for 01/09/2026: drop the spaces; year-first then reads correctly.
  const t = DIGITS(text).trim().replace(/(\d)\s*([-/.])\s*(?=\d)/g, "$1$2");
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/.exec(t);
  if (m) return { a: +m[3]!, b: +m[2]!, y: +m[1]!, named: false, iso: true };
  m = /^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2}|\d{4}))?(?!\d)/.exec(t);
  if (m) {
    const a = +m[1]!, b = +m[2]!;
    if (a < 1 || b < 1 || a > 31 || b > 31 || (a > 12 && b > 12)) return null;
    return { a, b, y: m[3] ? year(+m[3]) : null, named: false, iso: false };
  }
  m = /^(\d{1,2})[\s-]?([A-Za-z؀-ۿ]{3,9})\.?[\s-,]*(\d{2}|\d{4})?(?!\d)/.exec(t);
  if (m && month(m[2]!)) return { a: +m[1]!, b: month(m[2]!)!, y: m[3] ? year(+m[3]) : null, named: true, iso: false };
  m = /^([A-Za-z]{3,9})\.?\s(\d{1,2}),?\s?(\d{4})?(?!\d)/.exec(t);
  if (m && month(m[1]!)) return { a: +m[2]!, b: month(m[1]!)!, y: m[3] ? +m[3] : null, named: true, iso: false };
  return null;
}
/** A cell that is only a date with a year or a month name: what a line must start with when there are no column headings. */
function strongDate(text: string): boolean {
  const t = DIGITS(text).trim().replace(/(\d)\s*([-/.])\s*(?=\d)/g, "$1$2");
  const d = readDate(t);
  if (!d || !(d.y !== null || d.named)) return false;
  return /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[\s-]?[A-Za-z\u0600-\u06FF]{3,9}\.?[\s-,]*\d{2,4}|[A-Za-z]{3,9}\.?\s\d{1,2},?\s?\d{4})$/.test(t);
}
const year = (y: number) => (y < 100 ? 2000 + y : y);
const month = (s: string) => MONTHS[s.toLowerCase().slice(0, s.length > 4 && /^[a-z]/i.test(s) ? (s.toLowerCase().startsWith("sept") ? 4 : 3) : s.length)] ?? MONTHS[s.toLowerCase().slice(0, 3)];

function isoOf(d: RawDate, order: DateOrder, fallbackYear: number): string | null {
  const [day, mon] = d.named || d.iso || order === "dmy" ? [d.a, d.b] : [d.b, d.a];
  const y = d.y ?? fallbackYear;
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(y, mon - 1, day));
  if (dt.getUTCMonth() !== mon - 1) return null;
  return `${String(y).padStart(4, "0")}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** An amount as printed on statements: 1,234.56 · 1.234,56 · (1,234.56) · -1,234.56 · 1,234.56- · 1,234.56 CR/DR · with currency. */
export function readAmount(text: string): { value: number; decimals: number; mark: "cr" | "dr" | null } | null {
  let t = DIGITS(text).replace(/[٫]/g, ".").replace(/[٬]/g, ",").replace(/ /g, " ").trim();
  let mark: "cr" | "dr" | null = null;
  const crdr = /\b(cr|dr)\.?$|^(cr|dr)\.?\b|(دائن|مدين)$|(?<=\d)\s+([cd])$/i.exec(t);
  if (crdr) {
    const w = (crdr[1] ?? crdr[2] ?? crdr[3] ?? crdr[4])!.toLowerCase();
    mark = w === "cr" || w === "دائن" || w === "c" ? "cr" : "dr";
    t = t.replace(crdr[0], "").trim();
  }
  t = t.replace(/^(?:[A-Z]{3}|[$€£¥₹]|ر\.?س\.?|د\.?إ\.?|ر\.?ع\.?|د\.?ك\.?|ر\.?ق\.?)\s*/i, "").replace(/\s*(?:[A-Z]{3}|[$€£¥₹]|ر\.?س\.?|د\.?إ\.?|ر\.?ع\.?)$/i, "").trim();
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1).trim(); }
  if (/^[-−–]/.test(t)) { neg = true; t = t.slice(1).trim(); }
  if (/[-−–]$/.test(t)) { neg = true; t = t.slice(0, -1).trim(); }
  if (/^\+/.test(t)) t = t.slice(1).trim();
  let int: string, dec = "";
  let m = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,3}))?$/.exec(t);
  if (m) { int = m[1]!.replace(/,/g, ""); dec = m[2] ?? ""; }
  else {
    m = /^(\d{1,3}(?:[.\s ]\d{3})+|\d+),(\d{1,3})$/.exec(t);
    if (!m) return null;
    int = m[1]!.replace(/[.\s ]/g, ""); dec = m[2]!;
  }
  // A bare whole number with no decimals and no separators is more likely a reference than an amount.
  if (!dec && !/,/.test(t) && int.length > 7) return null;
  const value = Number(`${int}.${dec || "0"}`) * (neg ? -1 : 1);
  return { value, decimals: dec.length, mark };
}

const isAmount = (t: string) => readAmount(t) !== null && /\d/.test(t);

const OPENING = /opening balance|balance (brought )?forward|brought forward|b\/f|previous balance|balance at (start|beginning)|start(ing)? balance|الرصيد الافتتاحي|رصيد افتتاحي|الرصيد السابق|رصيد سابق|رصيد مرحل/i;
const CLOSING = /closing balance|balance carried forward|carried forward|c\/f|balance at (end|close)|ending balance|end(ing)? balance|الرصيد الختامي|رصيد ختامي|الرصيد النهائي|الرصيد الحالي/i;
const SKIP = /^(total|totals|sub ?total|grand total|page \d|continued|إجمالي|الإجمالي|المجموع|صفحة)\b/i;

function cellsOf(items: TextItem[]): { y: number; size: number; cells: Cell[] }[] {
  return groupLines(items).map((l) => ({ y: l.y, size: l.size, cells: lineCells(l.items, l.rtl).map((c) => ({ x0: c.x0, x1: c.x1, text: c.text })) }));
}

/**
 * Headings printed over two lines ("Transaction" above "Date", "Amount" above "(PKR)") become one heading each:
 * a cell on the lower line joins the cell above it when they share horizontal space.
 */
function mergeHeaderLines(upper: Cell[], lower: Cell[]): Cell[] {
  const used = new Set<Cell>();
  const merged: Cell[] = [];
  for (const l of lower) {
    const u = upper.find((c) => !used.has(c) && Math.min(c.x1, l.x1) - Math.max(c.x0, l.x0) > 0);
    if (u) {
      used.add(u);
      merged.push({ x0: Math.min(u.x0, l.x0), x1: Math.max(u.x1, l.x1), text: `${u.text} ${l.text}` });
    } else merged.push(l);
  }
  for (const u of upper) if (!used.has(u)) merged.push(u);
  return merged.sort((a, b) => a.x0 - b.x0);
}

/** Header row: a line where 3+ cells name statement columns (including a balance or money column). */
function headerColumns(cells: Cell[]): Column[] | null {
  const cols: Column[] = [];
  for (const c of cells) {
    const r = roleOf(c.text);
    if (r) cols.push({ role: r, x0: c.x0, x1: c.x1 });
  }
  const roles = new Set(cols.map((c) => c.role));
  const money = roles.has("debit") || roles.has("credit") || roles.has("amount") || roles.has("balance");
  if (cols.length < 3 || !money || cols.length < cells.length * 0.6) return null;
  // Only the first date column is the transaction date; a second becomes "other" (value date).
  let seenDate = false;
  for (const c of cols) {
    if (c.role !== "date") continue;
    if (seenDate) c.role = "other";
    seenDate = true;
  }
  cols.sort((a, b) => a.x0 - b.x0);
  return cols;
}

/** Nearest header column: numbers line up on an edge, text on the start; the cell must at least come close. */
function columnFor(cell: Cell, cols: Column[], rtl: boolean): Column | null {
  const numeric = isAmount(cell.text);
  let best: Column | null = null;
  let bestD = Infinity;
  for (const c of cols) {
    const overlap = Math.min(cell.x1, c.x1) - Math.max(cell.x0, c.x0);
    const d = overlap > 0 ? -overlap : Math.min(Math.abs(cell.x1 - c.x1), Math.abs(cell.x0 - c.x0), Math.abs((cell.x0 + cell.x1) / 2 - (c.x0 + c.x1) / 2));
    // Prefer money columns for numbers and text columns for words when distances tie.
    const bias = numeric === ["debit", "credit", "amount", "balance"].includes(c.role) ? 0 : 6;
    if (d + bias < bestD) { bestD = d + bias; best = c; }
  }
  void rtl;
  return best;
}

interface RawRow {
  page: number;
  y: number;
  size: number;
  dateText: string | null;
  desc: string[];
  debit: ReturnType<typeof readAmount>;
  credit: ReturnType<typeof readAmount>;
  amount: ReturnType<typeof readAmount>;
  balance: ReturnType<typeof readAmount>;
  /** A lone D/C (or Dr/Cr) cell beside the amount says which way the money moved. */
  mark?: "cr" | "dr";
  /** Horizontal extent of the description text, to tell a wrapped line from a footer note. */
  dx0?: number;
  dx1?: number;
}

/** A cell that is just a debit/credit letter. */
const MARKER = /^(dr|cr|d|c)\.?$/i;
const MONEY_ROLES: Role[] = ["amount", "debit", "credit", "balance"];

export interface ParseOptions {
  dateOrder?: DateOrder | "auto";
  /**
   * Fixed columns per page (used when the user marks tables by hand): `columns[i]` applies to `pages[i]`.
   * A page with `null` is read the usual way. When this option is given, columns never carry over between pages.
   */
  columns?: (Column[] | null)[];
}

type CellLine = { y: number; size: number; cells: Cell[] };

/** The heading row at line `i`, joined with the line above when the headings are split over two lines. */
function headerAt(lines: CellLine[], i: number): { cols: Column[]; from: number } | null {
  const line = lines[i]!;
  const own = headerColumns(line.cells);
  const up = lines[i - 1];
  const textOnly = (cells: Cell[]) => cells.every((c) => !isAmount(c.text) && !readDate(c.text));
  const joined = up && line.y - up.y < Math.max(up.size, line.size) * 2.4 && textOnly(up.cells) && textOnly(line.cells) ? headerColumns(mergeHeaderLines(up.cells, line.cells)) : null;
  if (joined && (!own || joined.length > own.length)) return { cols: joined, from: i - 1 };
  return own ? { cols: own, from: i } : null;
}

/** First heading row of a page, if any. */
function findHeader(lines: CellLine[]): { cols: Column[]; from: number; at: number } | null {
  for (let i = 0; i < lines.length; i++) {
    const h = headerAt(lines, i);
    if (h) return { ...h, at: i };
  }
  return null;
}

/** Rows of the table: lines with a date and an amount, stopping where a long gap says the table has ended. */
function tableRows(lines: CellLine[], from: number): CellLine[] {
  const isRow = (cells: Cell[]) => cells.some((c) => readDate(c.text)) && cells.some((c) => isAmount(c.text));
  const rows: CellLine[] = [];
  for (let i = from; i < lines.length; i++) {
    const l = lines[i]!;
    const prev = rows[rows.length - 1];
    if (prev && l.y - prev.y > Math.max(prev.size * 4.5, 36)) break;
    if (isRow(l.cells)) rows.push(l);
  }
  return rows;
}

/**
 * Where the transactions table sits on a page (PDF points, from the top-left): from the heading row down to the
 * last row of the table. Used to place a table box in one tap on a phone.
 */
export function suggestTable(items: TextItem[]): { x0: number; y0: number; x1: number; y1: number } | null {
  const lines = cellsOf(items);
  const header = findHeader(lines);
  const rows = tableRows(lines, header ? header.at + 1 : 0);
  if (rows.length === 0) return null;
  const top = header ? lines[header.from]! : rows[0]!;
  const used = [top, ...rows];
  const x0 = Math.min(...used.flatMap((l) => l.cells.map((c) => c.x0)));
  const x1 = Math.max(...used.flatMap((l) => l.cells.map((c) => c.x1)));
  const last = rows[rows.length - 1]!;
  const pad = 4;
  return { x0: x0 - pad, x1: x1 + pad, y0: top.y - top.size * 1.4, y1: last.y + last.size * 0.7 };
}

/**
 * Column lines for a table, from its headings. Each line goes in the widest empty space between the text of two
 * neighbouring columns, so wide descriptions and left-aligned text stay in their own column.
 * `yRange` limits which rows are looked at (the box the user drew); the headings may sit above it.
 */
export function detectSplits(items: TextItem[], yRange?: [number, number]): { splits: number[]; roles: Role[] } | null {
  const lines = cellsOf(items);
  const header = findHeader(lines);
  if (!header || header.cols.length < 2) return null;
  const cols = [...header.cols].sort((a, b) => a.x0 - b.x0);
  const rows = tableRows(lines, header.at + 1).filter((l) => !yRange || (l.y >= yRange[0] && l.y <= yRange[1]));
  const cover = rows.flatMap((l) => l.cells.map((c) => [c.x0, c.x1] as const));
  const centre = (c: Column) => (c.x0 + c.x1) / 2;
  const splits = cols.slice(0, -1).map((a, i) => {
    const b = cols[i + 1]!;
    const lo = Math.min(centre(a), a.x1), hi = Math.max(centre(b), b.x0);
    // Widest gap, inside [lo, hi], that no row's text crosses.
    const taken = cover.filter(([x0, x1]) => x1 > lo && x0 < hi).sort((p, q) => p[0] - q[0]);
    let best: [number, number] | null = null;
    let edge = lo;
    for (const [x0, x1] of taken) {
      if (x0 - edge > (best ? best[1] - best[0] : 0)) best = [edge, x0];
      edge = Math.max(edge, x1);
    }
    if (hi - edge > (best ? best[1] - best[0] : 0)) best = [edge, hi];
    return best && best[1] - best[0] > 1 ? (best[0] + best[1]) / 2 : (a.x1 + b.x0) / 2;
  });
  return { splits, roles: cols.map((c) => c.role) };
}

/** The column layout of the first header row found in `items`, if any (for pre-filling manual columns). */
export function detectColumns(items: TextItem[]): Column[] | null {
  return findHeader(cellsOf(items))?.cols ?? null;
}

export function parseStatement(pages: TextItem[][], opts: ParseOptions = {}): Statement {
  const emptyPages: number[] = [];
  let cols: Column[] | null = null;
  let headerFound = false;
  let opening: number | null = null;
  let closing: number | null = null;
  let decimals = 0;
  const rows: RawRow[] = [];
  const summaryLines: { y: number; cells: Cell[] }[][] = [];
  let rtlLines = 0, allLines = 0;
  const years: number[] = [];

  pages.forEach((items, pi) => {
    if (!items.some((i) => i.str.trim())) { emptyPages.push(pi + 1); return; }
    const fixed = opts.columns?.[pi] ?? null;
    if (opts.columns) { cols = fixed; headerFound = headerFound || Boolean(fixed); }
    const lines = cellsOf(items);
    summaryLines.push(lines);
    let inTable = Boolean(fixed);
    let last: RawRow | null = null;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!;
      allLines++;
      if (line.cells.some((c) => /[؀-ۿ]/.test(c.text))) rtlLines++;
      for (const c of line.cells) for (const y of DIGITS(c.text).match(/\b(19|20)\d{2}\b/g) ?? []) years.push(+y);
      let header = fixed ? null : headerColumns(line.cells);
      if (!fixed && li > 0) {
        // Headings split over two lines ("Transaction" / "Date"): use the joined heading when it names more columns.
        const up = lines[li - 1]!;
        const textOnly = (cells: Cell[]) => cells.every((c) => !isAmount(c.text) && !readDate(c.text));
        if (line.y - up.y < Math.max(up.size, line.size) * 2.4 && textOnly(up.cells) && textOnly(line.cells)) {
          const joined = headerColumns(mergeHeaderLines(up.cells, line.cells));
          if (joined && (!header || joined.length > header.length)) header = joined;
        }
      }
      if (header) { cols = header; headerFound = true; inTable = true; last = null; continue; }
      const text = line.cells.map((c) => c.text).join(" ");
      // Without any header yet, fall back to lines that start with a date and end with numbers.
      const fallback = !cols;
      if (!cols && !((strongDate(line.cells[0]?.text ?? "") || strongDate(line.cells[line.cells.length - 1]?.text ?? "")) && line.cells.some((c) => isAmount(c.text)))) continue;
      if (cols && !inTable && pi > 0 && !readDate(line.cells[0]?.text ?? "") && !readDate(line.cells[line.cells.length - 1]?.text ?? "")) continue;
      inTable = true;

      const row: RawRow = { page: pi + 1, y: line.y, size: line.size, dateText: null, desc: [], debit: null, credit: null, amount: null, balance: null };
      if (fallback) {
        // Infer: the date is at either end, the last number is the balance, a number before it is the amount.
        const cells = [...line.cells];
        const dateCell = strongDate(cells[0]!.text) ? cells.shift()! : cells.pop()!;
        row.dateText = dateCell.text;
        const nums = cells.filter((c) => isAmount(c.text));
        const words = cells.filter((c) => !isAmount(c.text));
        if (nums.length >= 2) { row.balance = readAmount(nums[nums.length - 1]!.text); row.amount = readAmount(nums[nums.length - 2]!.text); }
        else if (nums.length === 1) row.amount = readAmount(nums[0]!.text);
        row.desc = words.map((w) => w.text);
        if (words.length) { row.dx0 = Math.min(...words.map((w) => w.x0)); row.dx1 = Math.max(...words.map((w) => w.x1)); }
      } else {
        for (const c of line.cells) {
          const col = columnFor(c, cols!, false);
          let role = col?.role ?? "description";
          const amt = readAmount(c.text);
          // A heading such as "Description" is often centred over text that is left-aligned and much wider, so
          // words sitting between the columns on either side of it belong to the description.
          if (!amt && !readDate(c.text) && !MARKER.test(c.text.trim()) && role !== "description" && within(c, cols!)) role = "description";
          if (!amt && MARKER.test(c.text.trim()) && MONEY_ROLES.includes(role)) { row.mark = /^d/i.test(c.text.trim()) ? "dr" : "cr"; continue; }
          const isDesc = role === "description" || (role !== "other" && !amt);
          if (isDesc && !(role === "date" && readDate(c.text)) && !amt) { row.dx0 = Math.min(row.dx0 ?? Infinity, c.x0); row.dx1 = Math.max(row.dx1 ?? -Infinity, c.x1); }
          if (role === "date" && readDate(c.text)) row.dateText = c.text;
          else if (role === "debit" && amt) row.debit = amt;
          else if (role === "credit" && amt) row.credit = amt;
          else if (role === "amount" && amt) row.amount = amt;
          else if (role === "balance" && amt) row.balance = amt;
          else if (role === "description" || (role !== "other" && !amt)) row.desc.push(c.text);
        }
      }
      if (row.mark && row.amount) row.amount = { ...row.amount, mark: row.amount.mark ?? row.mark };
      for (const a of [row.debit, row.credit, row.amount, row.balance]) if (a) decimals = Math.max(decimals, a.decimals);
      const money = row.debit || row.credit || row.amount;

      if (OPENING.test(text)) { if (row.balance ?? row.amount) opening ??= signed(row.balance ?? row.amount!); last = null; continue; }
      if (CLOSING.test(text)) { if (row.balance ?? row.amount) closing = signed(row.balance ?? row.amount!); last = null; inTable = false; continue; }
      if (SKIP.test(text.trim())) { last = null; continue; }

      if (row.dateText || (money && last)) {
        if (!row.dateText && last) row.dateText = null;
        if (!money && !row.balance) {
          // A date with no amounts: either a day header or a wrapped first line; keep it as a row only if amounts follow.
          rows.push(row);
          last = row;
          continue;
        }
        rows.push(row);
        last = row;
      } else if (last && row.desc.length && !money && !row.balance && line.y - last.y < Math.max(line.size, last.size) * 3.2 && aligned(last, row)) {
        // A wrapped description line belongs to the transaction above it.
        last.desc.push(...row.desc);
        last.y = line.y;
      } else if (last && !money && row.balance && !last.balance) {
        last.balance = row.balance;
      } else {
        last = null;
      }
    }
  });

  // A dated line with no amounts followed by an undated line with amounts is one transaction split over two lines.
  const merged: RawRow[] = [];
  for (const r of rows) {
    const prev = merged[merged.length - 1];
    const hasMoney = (x: RawRow) => Boolean(x.debit || x.credit || x.amount || x.balance);
    if (prev && !hasMoney(prev) && !r.dateText && hasMoney(r)) {
      prev.desc.push(...r.desc);
      Object.assign(prev, { debit: r.debit, credit: r.credit, amount: r.amount, balance: r.balance });
    } else if (r.dateText || hasMoney(r)) merged.push(r);
  }
  const txRows = merged.filter((r) => r.debit || r.credit || r.amount || r.balance);

  // Date order: a first number above 12 means day first; a second above 12 means month first.
  const raws = txRows.map((r) => (r.dateText ? readDate(r.dateText) : null));
  let order: DateOrder = "dmy";
  if (opts.dateOrder && opts.dateOrder !== "auto") order = opts.dateOrder;
  else {
    const plain = raws.filter((d): d is RawDate => Boolean(d && !d.named && !d.iso));
    if (plain.some((d) => d.b > 12) && !plain.some((d) => d.a > 12)) order = "mdy";
  }
  const fallbackYear = years.length ? mode(years) : new Date().getFullYear();

  // Amounts → debit/credit.
  const tx: Transaction[] = [];
  let lastDate: { text: string; iso: string | null } | null = null;
  txRows.forEach((r, i) => {
    let debit = r.debit ? Math.abs(r.debit.value) : null;
    let credit = r.credit ? Math.abs(r.credit.value) : null;
    if (r.debit && r.debit.value < 0 && !r.credit) { credit = null; debit = Math.abs(r.debit.value); }
    if (r.amount) {
      const v = r.amount.value;
      if (r.amount.mark === "cr") credit = Math.abs(v);
      else if (r.amount.mark === "dr") debit = Math.abs(v);
      else if (v < 0) debit = -v;
      else credit = v;
    }
    const balance = r.balance ? signed(r.balance) : null;
    const raw = raws[i];
    const date = r.dateText ? { text: r.dateText, iso: raw ? isoOf(raw, order, fallbackYear) : null } : lastDate;
    lastDate = date;
    tx.push({ dateText: date?.text ?? "", date: date?.iso ?? null, description: r.desc.join(" ").replace(/\s+/g, " ").trim(), debit, credit, balance, check: "unchecked", page: r.page });
  });

  // An amount column with no signs: let the balance decide which way the money moved.
  const unsigned = txRows.some((r) => r.amount) && !txRows.some((r) => r.amount && (r.amount.value < 0 || r.amount.mark));
  const newestFirst = detectNewestFirst(tx, opening);
  if (unsigned) resolveBySign(tx, opening, newestFirst);

  // Card statements print the balances in an account summary box instead of a table row.
  let fromSummary = false;
  if (opening === null || closing === null) {
    const sum = readSummary(summaryLines);
    if (sum) {
      if (opening === null && sum.opening !== null) { opening = sum.opening; fromSummary = true; }
      if (closing === null && sum.closing !== null) { closing = sum.closing; fromSummary = true; }
      decimals = Math.max(decimals, sum.decimals);
    }
  }

  const { checked, mismatches } = checkBalances(tx, opening, newestFirst, decimals);
  const round = (n: number) => Math.round(n * 10 ** Math.max(decimals, 2)) / 10 ** Math.max(decimals, 2);
  return {
    transactions: tx,
    opening,
    closing,
    totalDebit: round(tx.reduce((s, t) => s + (t.debit ?? 0), 0)),
    totalCredit: round(tx.reduce((s, t) => s + (t.credit ?? 0), 0)),
    decimals: Math.max(decimals, 2),
    dateOrder: order,
    newestFirst,
    headerFound,
    rtl: allLines > 0 && rtlLines > allLines / 2,
    checked,
    mismatches,
    emptyPages,
    fromSummary,
  };
}

/** The opening and closing balances from an account summary box anywhere in the pages, for checking a manual selection. */
export function readSummaryBalances(pages: TextItem[][]): { opening: number | null; closing: number | null } | null {
  const sum = readSummary(pages.map((items) => cellsOf(items)));
  return sum ? { opening: sum.opening, closing: sum.closing } : null;
}

const SUMMARY_OPENING = /^[+\-=]?\s*(previous|opening|prior|last statement|balance (brought )?forward|balance b\/f)\b.*|^[+\-=]?\s*الرصيد (السابق|الافتتاحي)/i;
const SUMMARY_CLOSING = /^[+\-=]?\s*(current|new|closing|total|statement|ending|outstanding)\s+(balance|outstanding)|^[+\-=]?\s*outstanding (balance|amount)|^[+\-=]?\s*الرصيد (الحالي|الختامي|المستحق)/i;

/**
 * An account summary: one row of headings ("Previous Balance", "+ Total Activity", "= Current Outstanding")
 * with the amounts printed on the row below, each under its heading.
 */
function readSummary(pages: { y: number; cells: Cell[] }[][]): { opening: number | null; closing: number | null; decimals: number } | null {
  for (const lines of pages) {
    for (let i = 0; i < lines.length - 1; i++) {
      const heads = lines[i]!.cells;
      const open = heads.find((c) => SUMMARY_OPENING.test(c.text.trim()));
      const close = heads.find((c) => SUMMARY_CLOSING.test(c.text.trim()));
      if (!open || !close || open === close) continue;
      // The amounts sit on one of the next couple of lines.
      for (const below of lines.slice(i + 1, i + 3)) {
        if (below.y - lines[i]!.y > 40) break;
        const amounts = below.cells.filter((c) => isAmount(c.text));
        if (amounts.length < 2) continue;
        const under = (h: Cell) => {
          const centre = (h.x0 + h.x1) / 2;
          let best: Cell | null = null;
          let d = Infinity;
          for (const a of amounts) {
            const gap = Math.abs((a.x0 + a.x1) / 2 - centre);
            if (gap < d) { d = gap; best = a; }
          }
          return best && d < Math.max(60, (h.x1 - h.x0) * 0.9) ? readAmount(best.text) : null;
        };
        const o = under(open), c = under(close);
        if (o && c) return { opening: signed(o), closing: signed(c), decimals: Math.max(o.decimals, c.decimals) };
      }
    }
  }
  return null;
}

/** Whether a cell lies between the columns that flank the description column. */
function within(c: Cell, cols: Column[]): boolean {
  const d = cols.find((x) => x.role === "description");
  if (!d) return false;
  const left = Math.max(-Infinity, ...cols.filter((x) => x !== d && x.x1 <= d.x0 + 1).map((x) => x.x1));
  const right = Math.min(Infinity, ...cols.filter((x) => x !== d && x.x0 >= d.x1 - 1).map((x) => x.x0));
  return c.x0 >= left - 2 && c.x1 <= right + 2;
}

/** Whether a line sits under the description text of the row above (a wrapped line) instead of being a note or footer. */
function aligned(a: RawRow, b: RawRow): boolean {
  if (a.dx0 === undefined || b.dx0 === undefined) return true;
  return Math.abs(a.dx0 - b.dx0) < 8 || Math.abs((a.dx1 ?? 0) - (b.dx1 ?? 0)) < 8;
}

const signed = (a: NonNullable<ReturnType<typeof readAmount>>) => (a.mark === "dr" ? -Math.abs(a.value) : a.value);

function mode(xs: number[]): number {
  const counts = new Map<number, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

const near = (a: number, b: number, decimals: number) => Math.abs(a - b) < 0.5 / 10 ** Math.max(decimals, 2) + 1e-9;
const move = (t: Transaction) => (t.credit ?? 0) - (t.debit ?? 0);

/** Which reading order makes more balances agree. */
function detectNewestFirst(tx: Transaction[], opening: number | null): boolean {
  let forward = 0, backward = 0;
  for (let i = 1; i < tx.length; i++) {
    const a = tx[i - 1]!, b = tx[i]!;
    if (a.balance === null || b.balance === null) continue;
    if (near(a.balance + move(b), b.balance, 2) || near(a.balance - move(b), b.balance, 2)) forward++;
    if (near(b.balance + move(a), a.balance, 2) || near(b.balance - move(a), a.balance, 2)) backward++;
  }
  void opening;
  // With unsigned amounts both directions can fit; dates decide then.
  if (forward === backward) {
    const dated = tx.filter((t) => t.date);
    return dated.length > 1 && dated[0]!.date! > dated[dated.length - 1]!.date!;
  }
  return backward > forward;
}

/** For unsigned amounts: credit if the balance went up, debit if it went down. */
function resolveBySign(tx: Transaction[], opening: number | null, newestFirst: boolean) {
  const order = newestFirst ? [...tx].reverse() : tx;
  let prev = opening;
  for (const t of order) {
    const amt = t.credit ?? t.debit;
    if (amt !== null && prev !== null && t.balance !== null) {
      if (t.balance < prev) { t.debit = amt; t.credit = null; }
      else { t.credit = amt; t.debit = null; }
    }
    prev = t.balance ?? prev;
  }
}

function checkBalances(tx: Transaction[], opening: number | null, newestFirst: boolean, decimals: number) {
  const order = newestFirst ? [...tx].reverse() : tx;
  let prev = opening;
  let checked = 0, mismatches = 0;
  for (const t of order) {
    if (t.balance === null) { t.check = "unchecked"; if (prev !== null) prev = prev + move(t); continue; }
    if (prev === null) { t.check = "unchecked"; prev = t.balance; continue; }
    const expected = Math.round((prev + move(t)) * 1e6) / 1e6;
    checked++;
    if (near(expected, t.balance, decimals)) t.check = "ok";
    else { t.check = "mismatch"; t.expected = expected; mismatches++; }
    prev = t.balance;
  }
  return { checked, mismatches };
}
