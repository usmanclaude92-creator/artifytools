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
  const crdr = /\b(cr|dr)\.?$|^(cr|dr)\.?\b|(دائن|مدين)$/i.exec(t);
  if (crdr) {
    const w = (crdr[1] ?? crdr[2] ?? crdr[3])!.toLowerCase();
    mark = w === "cr" || w === "دائن" ? "cr" : "dr";
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
  return cols.sort((a, b) => a.x0 - b.x0);
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
}

export interface ParseOptions {
  dateOrder?: DateOrder | "auto";
  /**
   * Fixed columns per page (used when the user marks tables by hand): `columns[i]` applies to `pages[i]`.
   * A page with `null` is read the usual way. When this option is given, columns never carry over between pages.
   */
  columns?: (Column[] | null)[];
}

/** The column layout of the first header row found in `items`, if any (for pre-filling manual columns). */
export function detectColumns(items: TextItem[]): Column[] | null {
  for (const line of cellsOf(items)) {
    const cols = headerColumns(line.cells);
    if (cols) return cols;
  }
  return null;
}

export function parseStatement(pages: TextItem[][], opts: ParseOptions = {}): Statement {
  const emptyPages: number[] = [];
  let cols: Column[] | null = null;
  let headerFound = false;
  let opening: number | null = null;
  let closing: number | null = null;
  let decimals = 0;
  const rows: RawRow[] = [];
  let rtlLines = 0, allLines = 0;
  const years: number[] = [];

  pages.forEach((items, pi) => {
    if (!items.some((i) => i.str.trim())) { emptyPages.push(pi + 1); return; }
    const fixed = opts.columns?.[pi] ?? null;
    if (opts.columns) { cols = fixed; headerFound = headerFound || Boolean(fixed); }
    const lines = cellsOf(items);
    let inTable = Boolean(fixed);
    let last: RawRow | null = null;
    for (const line of lines) {
      allLines++;
      if (line.cells.some((c) => /[؀-ۿ]/.test(c.text))) rtlLines++;
      for (const c of line.cells) for (const y of DIGITS(c.text).match(/\b(19|20)\d{2}\b/g) ?? []) years.push(+y);
      const header = fixed ? null : headerColumns(line.cells);
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
      } else {
        for (const c of line.cells) {
          const col = columnFor(c, cols!, false);
          const role = col?.role ?? "description";
          const amt = readAmount(c.text);
          if (role === "date" && readDate(c.text)) row.dateText = c.text;
          else if (role === "debit" && amt) row.debit = amt;
          else if (role === "credit" && amt) row.credit = amt;
          else if (role === "amount" && amt) row.amount = amt;
          else if (role === "balance" && amt) row.balance = amt;
          else if (role === "description" || (role !== "other" && !amt)) row.desc.push(c.text);
        }
      }
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
      } else if (last && row.desc.length && !money && !row.balance && line.y - last.y < Math.max(line.size, last.size) * 3.2) {
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
  };
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
