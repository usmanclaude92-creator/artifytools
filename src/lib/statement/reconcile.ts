/**
 * Running balance for statements that print none (card statements, or tables without a balance column),
 * and a check of the result against the closing balance printed on the statement (pure, unit-tested).
 */
import type { Statement, Transaction } from "./parse";

export interface Reconciliation {
  /** "bank": credits raise the balance. "card": debits (purchases) raise the amount owed. */
  convention: "bank" | "card";
  opening: number;
  /** The closing balance printed on the statement, if known. */
  closing: number | null;
  /** Opening balance plus every transaction. */
  calculatedClosing: number;
  /** calculatedClosing − closing, when both are known. */
  difference: number | null;
  /** Whether the calculated closing balance equals the printed one (null when none is printed). */
  matches: boolean | null;
  /** Balance after each transaction, in the order the transactions are listed. */
  balances: number[];
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const net = (t: Transaction, sign: 1 | -1) => sign * ((t.credit ?? 0) - (t.debit ?? 0));

export function reconcile(s: Statement, opening: number | null, closing: number | null): Reconciliation | null {
  if (opening === null || s.transactions.length === 0) return null;
  const d = Math.max(s.decimals, 2);
  const chronological = s.newestFirst ? [...s.transactions].reverse() : s.transactions;
  const total = (sign: 1 | -1) => round(opening + chronological.reduce((sum, t) => sum + net(t, sign), 0), d);
  const bank = total(1);
  const card = total(-1);
  const tolerance = 0.5 / 10 ** d + 1e-9;
  // With a printed closing balance, the convention that comes closest to it is the right one, even when a
  // missed transaction means it does not match exactly.
  let convention: "bank" | "card" = "bank";
  if (closing !== null && Math.abs(card - closing) < Math.abs(bank - closing)) convention = "card";
  const sign = convention === "card" ? -1 : 1;
  const calculatedClosing = convention === "card" ? card : bank;

  let run = opening;
  const byChronology = chronological.map((t) => (run = round(run + net(t, sign), d)));
  const balances = s.newestFirst ? [...byChronology].reverse() : byChronology;
  const difference = closing === null ? null : round(calculatedClosing - closing, d);
  return { convention, opening, closing, calculatedClosing, difference, matches: difference === null ? null : Math.abs(difference) < tolerance, balances };
}

/** A copy of the statement with the calculated balances filled in, for the table and the exports. */
export function withCalculatedBalances(s: Statement, r: Reconciliation): Statement {
  return {
    ...s,
    opening: r.opening,
    closing: r.closing ?? r.calculatedClosing,
    transactions: s.transactions.map((t, i) => (t.balance === null ? { ...t, balance: r.balances[i]! } : t)),
  };
}
