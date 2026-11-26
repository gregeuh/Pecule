import { futureTransactions, parseDate, shiftDate, type Budget, type Transaction } from "./budget.ts";

/** Scheduled operations of the recurrences between two dates (included), recorded ones first-class. */
export function recurrencesBetween(budget: Budget, from: string, to: string): Transaction[] {
  return futureTransactions(budget, from, to).filter((t) => !!t.ruleId);
}

export type RecurrenceDay = { date: string; items: Transaction[] };

/** `count` consecutive days from `from`, each with its recurrences. */
export function recurrenceDays(budget: Budget, from: string, count: number): RecurrenceDay[] {
  const items = recurrencesBetween(budget, from, shiftDate(from, count - 1));
  return Array.from({ length: count }, (_, i) => {
    const date = shiftDate(from, i);
    return { date, items: items.filter((t) => t.date === date) };
  });
}

/** The days of a month ("YYYY-MM") in weeks starting on Monday; `null` pads the first and last weeks. */
export function monthGrid(month: string): (string | null)[] {
  const first = parseDate(`${month}-01`),
    lead = (first.getDay() + 6) % 7,
    length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= length; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** "YYYY-MM" shifted by whole months. */
export function shiftMonth(month: string, by: number): string {
  const d = parseDate(`${month}-01`);
  const next = new Date(d.getFullYear(), d.getMonth() + by, 1, 12);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export type RecurrenceMonthSummary = {
  /** Total of this month's recurring charges, as a positive number of cents. */
  charges: number;
  income: number;
  chargesCount: number;
  chargesPassed: number;
  /** Positive cents of recurring charges after today and up to `end`. */
  remaining: number;
};

/** This month's recurring charges and income, how many charges have passed, and what is left until `end`. */
export function recurrenceMonthSummary(budget: Budget, today: string, end: string): RecurrenceMonthSummary {
  const month = today.slice(0, 7),
    monthItems = recurrencesBetween(budget, `${month}-01`, `${shiftMonth(month, 1)}-01`).filter((t) =>
      t.date.startsWith(month),
    ),
    charges = monthItems.filter((t) => t.amount < 0);
  const remaining = end > today ? recurrencesBetween(budget, shiftDate(today, 1), end) : [];
  return {
    charges: charges.reduce((s, t) => s - t.amount, 0),
    income: monthItems.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    chargesCount: charges.length,
    chargesPassed: charges.filter((t) => t.date <= today).length,
    remaining: remaining.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0),
  };
}
