import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { TextItem } from "@/lib/pdf/text-layout";
import { parseStatement, type Statement, type Transaction } from "./parse";
import { reconcile, withCalculatedBalances } from "./reconcile";

const items = (name: string) => JSON.parse(readFileSync(path.join(__dirname, "../../../tests/fixtures", name), "utf8")) as TextItem[][];

const tx = (debit: number | null, credit: number | null): Transaction => ({ dateText: "", date: null, description: "", debit, credit, balance: null, check: "unchecked", page: 1 });
const statement = (list: Transaction[], newestFirst = false): Statement => ({
  transactions: list, opening: null, closing: null, totalDebit: 0, totalCredit: 0, decimals: 2, dateOrder: "dmy", newestFirst, headerFound: true, rtl: false, checked: 0, mismatches: 0, emptyPages: [],
});

describe("reconcile", () => {
  it("bank statements: credits raise the balance", () => {
    const r = reconcile(statement([tx(null, 500), tx(200, null)]), 1000, 1300)!;
    expect(r.convention).toBe("bank");
    expect(r.balances).toEqual([1500, 1300]);
    expect(r.calculatedClosing).toBe(1300);
    expect(r.matches).toBe(true);
  });

  it("card statements: debits raise the amount owed, and the closing balance decides", () => {
    const r = reconcile(statement([tx(200, null), tx(null, 500)]), 1000, 700)!;
    expect(r.convention).toBe("card");
    expect(r.balances).toEqual([1200, 700]);
    expect(r.matches).toBe(true);
  });

  it("reports the difference when the closing balance does not match", () => {
    const r = reconcile(statement([tx(null, 500)]), 1000, 1499)!;
    expect(r.matches).toBe(false);
    expect(r.difference).toBe(1);
  });

  it("keeps the card reading when the closing balance is slightly off", () => {
    const r = reconcile(statement([tx(200, null), tx(null, 500)]), 1000, 750)!;
    expect(r.convention).toBe("card");
    expect(r.calculatedClosing).toBe(700);
    expect(r.difference).toBe(-50);
    expect(r.matches).toBe(false);
  });

  it("newest-first lists get balances in listed order, calculated from the oldest", () => {
    // Listed newest first: the 200 debit is the latest, the 500 credit the earliest.
    const r = reconcile(statement([tx(200, null), tx(null, 500)], true), 1000, null)!;
    expect(r.balances).toEqual([1300, 1500]);
    expect(r.calculatedClosing).toBe(1300);
    expect(r.matches).toBeNull();
  });

  it("needs an opening balance", () => {
    expect(reconcile(statement([tx(1, null)]), null, 5)).toBeNull();
  });

  it("fills only the balances the statement did not print", () => {
    const s = statement([{ ...tx(null, 5), balance: 99 }, tx(1, null)]);
    const out = withCalculatedBalances(s, reconcile(s, 10, null)!);
    expect(out.transactions[0]!.balance).toBe(99);
    expect(out.transactions[1]!.balance).toBe(14);
  });
});

describe("card statement summary", () => {
  it("reads the previous and current balances from the summary and the check matches", () => {
    const s = parseStatement(items("statement-card.items.json"));
    expect(s.opening).toBe(1000);
    expect(s.closing).toBe(3949.19);
    expect(s.fromSummary).toBe(true);
    const r = reconcile(s, s.opening, s.closing)!;
    expect(r.convention).toBe("card");
    expect(r.calculatedClosing).toBe(3949.19);
    expect(r.matches).toBe(true);
  });
});
