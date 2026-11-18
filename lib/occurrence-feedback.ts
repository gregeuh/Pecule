import { futureTransactions, shiftDate, type Budget } from "./budget.ts";

/** Read-only receipt: dates come from the saved occurrence and its actual schedule. */
export function occurrenceFeedback(budget: Budget, ruleId: string, date: string, today: string) {
  const from = date > today ? date : today;
  const next = futureTransactions(budget, shiftDate(from,1), shiftDate(from,400)).find(item=>item.ruleId===ruleId);
  return { date, ...(next ? { nextDate: next.date } : {}) };
}
