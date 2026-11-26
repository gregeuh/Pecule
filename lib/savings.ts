import {
  accountBalance,
  materialize,
  parseDate,
  shiftDate,
  type Account,
  type Budget,
  type Goal,
  type Rule,
  type Transaction,
} from "./budget.ts";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Last day of the month `offset` months from the month of `date` (0: this month). */
export function monthEnd(date: string, offset = 0) {
  const d = parseDate(date);
  return iso(new Date(d.getFullYear(), d.getMonth() + offset + 1, 0, 12));
}

export const savingsAccounts = (b: Budget) => b.accounts.filter((a) => a.type === "savings");

/** The balance at the end of each of the last `months` months, the current one counted up to today. */
export function balanceHistory(b: Budget, accountId: string, today: string, months = 6) {
  const opened = b.accounts.find((a) => a.id === accountId)?.openingDate ?? today;
  return Array.from({ length: months }, (_, i) => {
    const end = monthEnd(today, i - months + 1);
    const at = end > today ? today : end;
    return { month: at.slice(0, 7), balance: accountBalance(b, accountId, at) };
  }).filter((h) => h.month >= opened.slice(0, 7)); // Months before Pécule knew the account say nothing.
}

/** What came in minus what went out of the account since the start of this month. */
export function monthChange(b: Budget, accountId: string, today: string) {
  const opened = b.accounts.find((a) => a.id === accountId)?.openingDate ?? today;
  const before = monthEnd(today, -1);
  return accountBalance(b, accountId, today) - accountBalance(b, accountId, opened > before ? opened : before);
}

/** The average saved per month over the history (balance growth between its first and last point). */
export function averageMonthlyGrowth(history: { balance: number }[]) {
  if (history.length < 2) return 0;
  return Math.round((history.at(-1)!.balance - history[0].balance) / (history.length - 1));
}

/**
 * Average monthly spending on the everyday accounts over the last `months` complete months: what a safety cushion
 * is counted in. Transfers and money put aside (category « Épargne ») are not spending.
 */
export function averageMonthlySpending(b: Budget, today: string, months = 3) {
  const all = materialize(b, today);
  const everyday = new Set(all.accounts.filter((a) => a.type !== "savings").map((a) => a.id));
  const from = shiftDate(monthEnd(today, -months - 1), 1),
    to = monthEnd(today, -1);
  const opening = all.accounts
    .filter((a) => everyday.has(a.id))
    .reduce((min, a) => (a.openingDate < min ? a.openingDate : min), to);
  const start = opening > from ? opening : from;
  if (start > to) return 0;
  const spent = all.transactions
    .filter(
      (t) =>
        everyday.has(t.accountId) &&
        !t.transferId &&
        t.amount < 0 &&
        t.category !== "Épargne" &&
        t.date >= start &&
        t.date <= to,
    )
    .reduce((s, t) => s - t.amount, 0);
  const covered = Math.max(1, Math.round((parseDate(to).getTime() - parseDate(start).getTime()) / (30.44 * 864e5)));
  return Math.round(spent / Math.min(months, covered));
}

/** How many months of spending a balance covers (one decimal), or null when spending is unknown. */
export function cushionMonths(balance: number, monthlySpending: number) {
  return monthlySpending > 0 ? Math.floor((Math.max(0, balance) / monthlySpending) * 10) / 10 : null;
}

/** Envelopes of a savings account and what is not shared out yet. */
export function envelopes(b: Budget, account: Account, today: string) {
  const list = b.goals.filter((g) => g.accountId === account.id);
  const balance = accountBalance(b, account.id, today);
  const allocated = list.reduce((s, g) => s + g.saved, 0);
  return { list, balance, allocated, free: balance - allocated };
}

/** Goals followed apart from any account (the former way): candidates to become envelopes. */
export const looseGoals = (b: Budget): Goal[] => b.goals.filter((g) => !g.accountId);

/** Monthly transfers arriving on this account. */
export const transfersTo = (b: Budget, accountId: string): Rule[] =>
  b.rules.filter((r) => r.toAccountId === accountId && r.active);

/** The last operations of the account, newest first. */
export function recentMoves(b: Budget, accountId: string, today: string, count = 3): Transaction[] {
  return materialize(b, today)
    .transactions.filter((t) => t.accountId === accountId && t.date <= today)
    .sort((x, y) => y.date.localeCompare(x.date))
    .slice(0, count);
}

/**
 * Moves loose goals into a savings account as envelopes and, when asked, replaces their monthly reserves by one
 * monthly transfer of the same total, from `fromAccountId`, on day `day`, starting next month.
 */
export function moveGoalsToSavings(
  b: Budget,
  accountId: string,
  options: { goalIds: string[]; transfer?: { fromAccountId: string; day: number; id: string; today: string } },
): Budget {
  const moving = new Set(options.goalIds);
  const monthly = b.goals.filter((g) => moving.has(g.id)).reduce((s, g) => s + g.monthly, 0);
  const account = b.accounts.find((a) => a.id === accountId);
  if (account?.type !== "savings") throw new Error("Choisissez un compte d’épargne.");
  const goals = b.goals.map((g) =>
    moving.has(g.id) ? { ...g, accountId, ...(options.transfer ? { monthly: 0 } : {}) } : g,
  );
  if (!options.transfer || monthly <= 0) return { ...b, goals };
  const { fromAccountId, day, id, today } = options.transfer;
  const start = parseDate(today);
  const first = iso(new Date(start.getFullYear(), start.getMonth() + (start.getDate() < day ? 0 : 1), day, 12));
  const rule: Rule = {
    id,
    label: `Virement vers ${account.name}`,
    amount: -monthly,
    accountId: fromAccountId,
    toAccountId: accountId,
    category: "Épargne",
    startDate: first,
    endDate: "",
    frequency: "monthly",
    timing: "date",
    day,
    active: true,
    holidays: b.settings.holidayCalendar,
    excludedDates: [],
  };
  return { ...b, goals, rules: [...b.rules, rule] };
}
