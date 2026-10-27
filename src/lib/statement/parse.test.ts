import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { TextItem } from "@/lib/pdf/text-layout";
import { parseStatement, readAmount, readDate, roleOf } from "./parse";

const items = (name: string) => JSON.parse(readFileSync(path.join(__dirname, "../../../tests/fixtures", name), "utf8")) as TextItem[][];

describe("readAmount", () => {
  it.each([
    ["1,234.56", 1234.56, null],
    ["1.234,56", 1234.56, null],
    ["(1,234.56)", -1234.56, null],
    ["-1,234.56", -1234.56, null],
    ["1,234.56-", -1234.56, null],
    ["1,234.56 CR", 1234.56, "cr"],
    ["DR 50.00", 50, "dr"],
    ["AED 2,000.00", 2000, null],
    ["١٬٢٣٤٫٥٠", 1234.5, null],
    ["12.345", 12.345, null],
  ])("%s", (t, v, mark) => {
    const a = readAmount(t)!;
    expect(a.value).toBeCloseTo(v as number, 6);
    expect(a.mark).toBe(mark);
  });
  it("rejects words and long references", () => {
    expect(readAmount("ATM")).toBeNull();
    expect(readAmount("20261005123")).toBeNull();
  });
});

describe("readDate and roleOf", () => {
  it("reads common formats", () => {
    expect(readDate("31/10/2026")).toMatchObject({ a: 31, b: 10, y: 2026 });
    expect(readDate("2026-10-31")).toMatchObject({ a: 31, b: 10, iso: true });
    expect(readDate("09/28")).toMatchObject({ a: 9, b: 28, y: null });
    expect(readDate("05 Oct 2026")).toMatchObject({ a: 5, b: 10, named: true });
    expect(readDate("Oct 5, 2026")).toMatchObject({ a: 5, b: 10 });
    expect(readDate("٠١/٠٩/٢٠٢٦")).toMatchObject({ a: 1, b: 9, y: 2026 });
    expect(readDate("Salary")).toBeNull();
  });
  it("recognises column headers", () => {
    expect(roleOf("Withdrawals")).toBe("debit");
    expect(roleOf("Deposits")).toBe("credit");
    expect(roleOf("Running Balance")).toBe("balance");
    expect(roleOf("Narration")).toBe("description");
    expect(roleOf("Value Date")).toBe("other");
    expect(roleOf("البيان")).toBe("description");
    expect(roleOf("مدين")).toBe("debit");
    expect(roleOf("الرصيد")).toBe("balance");
  });
});

describe("parseStatement", () => {
  it("English, debit/credit columns over two pages", () => {
    const s = parseStatement(items("statement-en.items.json"));
    expect(s.headerFound).toBe(true);
    expect(s.transactions).toHaveLength(19);
    expect(s.opening).toBe(3250);
    expect(s.mismatches).toBe(0);
    expect(s.checked).toBe(19);
    expect(s.closing).toBe(s.transactions[18]!.balance);
    const t2 = s.transactions[1]!;
    expect(t2.date).toBe("2026-10-02");
    expect(t2.debit).toBe(412.75);
    expect(t2.credit).toBeNull();
    expect(t2.description).toContain("CARREFOUR");
    expect(t2.description).toContain("4421"); // wrapped line joined
    expect(s.transactions[0]!.credit).toBe(18500);
    expect(s.totalCredit).toBeCloseTo(28341.84, 2);
  });

  it("US statement: month-first dates, signed amount column, newest first", () => {
    const s = parseStatement(items("statement-us.items.json"));
    expect(s.transactions).toHaveLength(8);
    expect(s.dateOrder).toBe("mdy");
    expect(s.newestFirst).toBe(true);
    expect(s.mismatches).toBe(0);
    expect(s.checked).toBe(7);
    const first = s.transactions[0]!;
    expect(first.date).toBe("2026-09-28");
    expect(first.credit).toBe(260.55);
    expect(s.transactions.find((t) => /MORTGAGE/.test(t.description))!.debit).toBe(1845.2);
  });

  it("Arabic right-to-left statement", () => {
    const s = parseStatement(items("statement-ar.items.json"));
    expect(s.rtl).toBe(true);
    expect(s.transactions).toHaveLength(6);
    expect(s.opening).toBe(5400);
    expect(s.mismatches).toBe(0);
    expect(s.transactions[0]!.date).toBe("2026-09-01");
    expect(s.transactions[0]!.credit).toBe(12000);
    expect(s.transactions[0]!.description).toBe("راتب شهر سبتمبر");
    expect(s.transactions[1]!.debit).toBe(356.5);
  });

  it("forced date order and empty pages", () => {
    const s = parseStatement([[], ...items("statement-en.items.json")], { dateOrder: "mdy" });
    expect(s.emptyPages).toEqual([1]);
    expect(s.transactions[1]!.date).toBe("2026-02-10"); // 02/10 read month first
    expect(s.transactions[7]!.date).toBeNull(); // 13/10 can't be month first
  });
});

/** Builds a page from lines of [x, text] cells. */
const page = (lines: [number, string][][]): TextItem[] =>
  lines.flatMap((cells, i) => cells.map(([x, str]) => ({ str, x, y: 100 + i * 14, width: str.length * 5, size: 10, rtl: false, bold: false, italic: false })));

describe("parseStatement edge cases", () => {
  it("no header: date first, last number is the balance, unsigned amounts follow the balance", () => {
    const s = parseStatement([page([
      [[40, "Statement of account"]],
      [[40, "05 Oct 2026"], [120, "Salary"], [400, "5,000.00"], [480, "6,000.00"]],
      [[40, "06 Oct 2026"], [120, "Groceries"], [400, "250.00"], [480, "5,750.00"]],
      [[40, "07 Oct 2026"], [120, "Rent"], [400, "3,000.00"], [480, "2,750.00"]],
    ])]);
    expect(s.headerFound).toBe(false);
    expect(s.transactions.map((t) => [t.debit, t.credit])).toEqual([[null, 5000], [250, null], [3000, null]]);
    expect(s.mismatches).toBe(0);
    expect(s.checked).toBe(2);
    expect(s.transactions[0]!.date).toBe("2026-10-05");
  });

  it("CR/DR balances, totals and a transaction whose amounts sit on the line after its date", () => {
    const s = parseStatement([page([
      [[40, "Date"], [120, "Particulars"], [300, "Withdrawals"], [380, "Deposits"], [470, "Balance"]],
      [[40, "01-10-26"], [120, "Balance brought forward"], [470, "100.00 CR"]],
      [[40, "02-10-26"], [120, "Card payment"], [300, "150.00"], [470, "50.00 DR"]],
      [[40, "03-10-26"], [120, "Transfer in from"]],
      [[120, "Savings"], [380, "500.00"], [470, "450.00 CR"]],
      [[120, "Total"], [300, "150.00"], [380, "500.00"]],
    ])]);
    expect(s.opening).toBe(100);
    expect(s.transactions).toHaveLength(2);
    expect(s.transactions[0]!.balance).toBe(-50);
    expect(s.transactions[1]!.description).toBe("Transfer in from Savings");
    expect(s.transactions[1]!.credit).toBe(500);
    expect(s.mismatches).toBe(0);
  });

  it("flags a row whose balance doesn't follow", () => {
    const s = parseStatement([page([
      [[40, "Date"], [120, "Description"], [300, "Debit"], [380, "Credit"], [470, "Balance"]],
      [[40, "01/10/2026"], [120, "A"], [380, "100.00"], [470, "100.00"]],
      [[40, "02/10/2026"], [120, "B"], [300, "30.00"], [470, "60.00"]],
    ])]);
    expect(s.transactions[1]!.check).toBe("mismatch");
    expect(s.transactions[1]!.expected).toBe(70);
    expect(s.mismatches).toBe(1);
  });
});

describe("fixed columns (manual selection)", () => {
  it("reads a marked table with the user's columns", async () => {
    const { detectColumns } = await import("./parse");
    const pages = items("statement-en.items.json");
    const auto = parseStatement(pages);
    const cols = pages.map((p) => detectColumns(p));
    expect(cols[0]).not.toBeNull();
    const manual = parseStatement(pages, { columns: cols });
    expect(manual.transactions.length).toBe(auto.transactions.length);
    expect(manual.totalCredit).toBe(auto.totalCredit);
    expect(manual.mismatches).toBe(0);
  });

  it("follows the roles the user chose", async () => {
    const { detectColumns } = await import("./parse");
    const pages = items("statement-en.items.json");
    const auto = parseStatement(pages);
    const swapped = pages.map((p) => detectColumns(p)!.map((c) => ({ ...c, role: c.role === "debit" ? ("credit" as const) : c.role === "credit" ? ("debit" as const) : c.role })));
    const out = parseStatement(pages, { columns: swapped });
    expect(out.totalDebit).toBe(auto.totalCredit);
    expect(out.totalCredit).toBe(auto.totalDebit);
  });

  it("only reads what is inside the marked table", async () => {
    const { detectColumns } = await import("./parse");
    const page = items("statement-en.items.json")[0]!;
    const cols = detectColumns(page)!;
    // Keep only the lines of the first six transactions plus the header.
    const lines = [...new Set(page.map((i) => Math.round(i.y)))].sort((a, b) => a - b);
    const header = page.find((i) => /date/i.test(i.str))!;
    const keepY = lines.filter((y) => y >= Math.round(header.y)).slice(0, 7);
    const part = page.filter((i) => keepY.includes(Math.round(i.y)));
    const out = parseStatement([part], { columns: [cols] });
    expect(out.transactions.length).toBeGreaterThan(0);
    expect(out.transactions.length).toBeLessThanOrEqual(6);
  });
});

describe("card statement with two-line headings and a D/C letter", () => {
  const s = parseStatement(items("statement-card.items.json"));

  it("finds every row with its description", () => {
    expect(s.transactions).toHaveLength(9);
    expect(s.transactions[0]).toMatchObject({ date: "2026-04-20", description: "SERVICE FEE/MARKUP RETAIL" });
    expect(s.transactions[2]!.description).toBe("BLUE ORCHARD STORE CITYVILLE PK");
  });

  it("uses the D and C letters, not the sign, for the direction", () => {
    expect(s.transactions[0]).toMatchObject({ debit: 446.13, credit: null });
    expect(s.transactions[1]).toMatchObject({ debit: null, credit: 7000 });
    expect(s.totalDebit).toBe(30149.19);
    expect(s.totalCredit).toBe(27200);
  });

  it("does not glue a footer note onto the last transaction", () => {
    const last = s.transactions.filter((t) => t.page === 1).at(-1)!;
    expect(last.description).not.toMatch(/MISSED/);
  });

  it("reads a D or C after the amount in the same cell", () => {
    expect(readAmount("-7000.00 C")).toMatchObject({ value: -7000, mark: "cr" });
    expect(readAmount("446.13 D")).toMatchObject({ value: 446.13, mark: "dr" });
  });
});

describe("suggestTable", () => {
  it("finds the transactions table from its heading down to the last row", async () => {
    const { suggestTable } = await import("./parse");
    const page = items("statement-card.items.json")[0]!;
    const r = suggestTable(page)!;
    expect(r).not.toBeNull();
    // The heading is at y≈210 and the last row at y≈313 in this layout; the account summary further down is left out.
    expect(r.y0).toBeGreaterThan(190);
    expect(r.y0).toBeLessThan(215);
    expect(r.y1).toBeGreaterThan(312);
    expect(r.y1).toBeLessThan(330);
    expect(r.x0).toBeLessThan(10);
    expect(r.x1).toBeGreaterThan(535);
  });

  it("works without a heading row, and gives up on pages with no transactions", async () => {
    const { suggestTable } = await import("./parse");
    expect(suggestTable([])).toBeNull();
    expect(suggestTable(items("statement-en.items.json")[0]!)).not.toBeNull();
  });
});

describe("detectSplits and the table boundary", () => {
  it("stops the suggested table before the account summary below it", async () => {
    const { suggestTable } = await import("./parse");
    const page = items("statement-card.items.json")[0]!;
    const r = suggestTable(page)!;
    // The summary row ("1000.00 … 3949.19") sits at y≈726: far below the last transaction row.
    expect(r.y1).toBeLessThan(340);
  });

  it("puts column lines in the empty spaces so left-aligned descriptions stay together", async () => {
    const { detectSplits } = await import("./parse");
    const page = items("statement-card.items.json")[0]!;
    const found = detectSplits(page)!;
    expect(found.roles).toEqual(["date", "other", "description", "amount"]);
    // Description text runs from x≈168 to ≈336 here, so the lines must fall left of 168 and right of that.
    expect(found.splits[1]!).toBeGreaterThan(125);
    expect(found.splits[1]!).toBeLessThan(168);
    expect(found.splits[2]!).toBeGreaterThan(336);
    expect(found.splits[2]!).toBeLessThan(490);
  });

  it("reading with those columns gives the same rows as automatic reading", async () => {
    const { detectSplits } = await import("./parse");
    const page = items("statement-card.items.json")[0]!;
    const found = detectSplits(page)!;
    const edges = [0, ...found.splits, 600];
    const columns = found.roles.map((role, i) => ({ role, x0: edges[i]!, x1: edges[i + 1]! }));
    const manual = parseStatement([page], { columns: [columns] });
    const auto = parseStatement([page]);
    expect(manual.transactions.map((t) => [t.description, t.debit, t.credit])).toEqual(auto.transactions.map((t) => [t.description, t.debit, t.credit]));
  });
});
