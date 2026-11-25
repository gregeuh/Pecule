import { getAvailableSignal, DAILY_COMFORT_CENTS } from "./available-signal.ts";
import {
  futureTransactions,
  materialize,
  overview,
  shiftDate,
  type Account,
  type Budget,
  type Goal,
  type Transaction,
} from "./budget.ts";

const contributedThisMonth = (budget: Budget, goal: Goal, today: string) => {
  const monthStart = today.slice(0, 7) + "-01";
  return budget.transactions
    .filter((t) => t.goalId === goal.id && t.amount > 0 && t.date >= monthStart && t.date <= today)
    .reduce((sum, t) => sum + t.amount, 0);
};

export type PaydayPlan = {
  salary: Transaction;
  from: Account;
  to: Account;
  items: { goal: Goal; amount: number }[];
  total: number;
};

/**
 * Once this month's salary is in, the monthly savings planned for each goal and not yet recorded.
 * Null when there is no salary this month, no savings account, or nothing left to put aside.
 */
export function paydaySavings(budget: Budget, today: string): PaydayPlan | null {
  const monthStart = today.slice(0, 7) + "-01";
  const current = new Set(budget.accounts.filter((a) => a.type !== "savings").map((a) => a.id));
  const salary = materialize(budget, today)
    .transactions.filter(
      (t) =>
        t.amount > 0 && t.category === "Salaire" && current.has(t.accountId) && t.date >= monthStart && t.date <= today,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const from = salary && budget.accounts.find((a) => a.id === salary.accountId);
  const to = budget.accounts.find((a) => a.type === "savings");
  if (!salary || !from || !to || today < from.openingDate || today < to.openingDate) return null;
  const items = budget.goals
    .map((goal) => ({
      goal,
      amount: Math.min(
        Math.max(0, goal.monthly - contributedThisMonth(budget, goal, today)),
        Math.max(0, goal.target - goal.saved),
      ),
    }))
    .filter((item) => item.amount > 0);
  if (!items.length) return null;
  return { salary, from, to, items, total: items.reduce((sum, item) => sum + item.amount, 0) };
}

/** Records each planned saving as a transfer to the savings account, like "Enregistrer un versement". */
export function recordPaydaySavings(budget: Budget, plan: PaydayPlan, today: string, makeId: () => string): Budget {
  const next = structuredClone(budget);
  for (const { goal, amount } of plan.items) {
    const transferId = makeId();
    const base = {
      label: `Épargne · ${goal.name}`,
      date: today,
      category: "Virement",
      note: "Le jour de la paie",
      transferId,
    };
    next.transactions.push(
      { ...base, id: makeId(), amount: -amount, accountId: plan.from.id },
      { ...base, id: makeId(), amount, accountId: plan.to.id, goalId: goal.id },
    );
    next.goals = next.goals.map((g) => (g.id === goal.id ? { ...g, saved: g.saved + amount } : g));
  }
  return next;
}

export type TightPeriod = {
  tone: "attention" | "negative";
  daily: number;
  threshold: number;
  /** What is missing to get back to the daily comfort threshold over the period. */
  gap: number;
  end: string;
  /** The date the home shows in « Disponible d’ici le … ». */
  until: string;
  moveTo: string;
  items: Transaction[];
};

/**
 * When the daily "disponible" is under the comfort threshold: the largest expenses still planned
 * before the end of the period, each of which can be moved to the first day after it.
 */
export function tightPeriod(budget: Budget, today: string, limit = 4): TightPeriod | null {
  const current = new Set(budget.accounts.filter((a) => a.type !== "savings").map((a) => a.id));
  if (!current.size) return null;
  const o = overview(budget, today);
  const threshold =
    Number.isSafeInteger(budget.settings.dailyComfortCents) && budget.settings.dailyComfortCents! > 0
      ? budget.settings.dailyComfortCents!
      : DAILY_COMFORT_CENTS;
  const signal = getAvailableSignal(o.available, o.days, threshold);
  if (signal.tone === "comfort") return null;
  const items = futureTransactions(materialize(budget, today), shiftDate(today, 1), o.end)
    .filter((t) => t.amount < 0 && current.has(t.accountId) && !t.transferId && !t.goalId)
    .sort((a, b) => a.amount - b.amount || a.date.localeCompare(b.date))
    .slice(0, limit);
  if (!items.length) return null;
  const moveTo = o.salary && budget.settings.horizon === "salary" ? o.salary.date : shiftDate(o.end, 1);
  return {
    tone: signal.tone,
    daily: o.daily,
    threshold,
    gap: Math.max(0, threshold * o.days - o.available),
    end: o.end,
    until: o.salary && budget.settings.horizon === "salary" ? o.salary.date : o.end,
    moveTo,
    items,
  };
}

/** Moves one planned expense to another date. A recurrence keeps its other dates. */
export function postponeExpense(budget: Budget, item: Transaction, date: string): Budget {
  const next = structuredClone(budget);
  const stored = next.transactions.find((t) => t.id === item.id);
  if (stored) stored.date = date;
  else next.transactions.push({ ...item, date });
  const rule = item.ruleId ? next.rules.find((r) => r.id === item.ruleId) : undefined;
  if (rule && !rule.excludedDates.includes(item.date)) rule.excludedDates.push(item.date);
  return next;
}
