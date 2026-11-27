import { shiftDate, statementCoverage, STATEMENT_DELAY, type Budget, type Rule, type Transaction } from "./budget.ts";
import { sameOperation } from "./budget-checks.ts";

/** An operation Pécule recorded by itself from a recurrence (a past date, or the arrival of a monthly transfer). */
export const addedByPecule = (t: Pick<Transaction, "id">) => t.id.startsWith("r:");

/** The recurrence an operation added by Pécule comes from (« r:rule:date » or « r:rule:date:to »). */
const ruleOf = (b: Budget, t: Transaction) => b.rules.find((r) => t.id.startsWith(`r:${r.id}:`));

export type NotOnStatement = { key: string; transaction: Transaction; rule: Rule; from: string; to: string };

/**
 * Operations Pécule added from a recurrence on a day the bank statement covers, while the statement shows nothing
 * like them: probably never debited. The last days of a statement are left out (a debit can still be on its way), as
 * are the operations the person said did happen and those that look like an imported one (« compté deux fois ? »).
 */
export function notOnStatement(b: Budget): NotOnStatement[] {
  const dismissed = new Set(b.settings.dismissedChecks ?? []);
  const covers = new Map(b.accounts.map((a) => [a.id, statementCoverage(b, a.id)]));
  const found: NotOnStatement[] = [];
  for (const t of b.transactions) {
    if (!addedByPecule(t) || t.id.endsWith(":to") || t.bankLinks?.length) continue;
    const cover = covers.get(t.accountId),
      rule = ruleOf(b, t);
    if (!cover || !rule || t.date < cover.from || t.date > shiftDate(cover.to, -STATEMENT_DELAY)) continue;
    const key = `statement:${t.id}`;
    if (dismissed.has(key)) continue;
    const twin = b.transactions.some(
      (x) => x.id !== t.id && !addedByPecule(x) && (x.importBatch || x.ruleId === rule.id) && sameOperation(rule, t, x),
    );
    if (!twin) found.push({ key, transaction: t, rule, ...cover });
  }
  return found.sort((x, y) => y.transaction.date.localeCompare(x.transaction.date));
}

/**
 * « Retirer »: the operation leaves the budget, with the arrival of a monthly transfer, and that date of the
 * recurrence is skipped so Pécule does not add it again. The recurrence and its next dates stay as they are.
 */
export function removeNotOnStatement(b: Budget, items: NotOnStatement[]): Budget {
  const ids = new Set(items.flatMap((i) => [i.transaction.id, `${i.transaction.id}:to`]));
  const skipped = new Map<string, string[]>();
  for (const i of items) skipped.set(i.rule.id, [...(skipped.get(i.rule.id) ?? []), i.transaction.date]);
  return {
    ...b,
    rules: b.rules.map((r) => {
      const dates = (skipped.get(r.id) ?? []).filter((d) => !r.excludedDates.includes(d));
      return dates.length ? { ...r, excludedDates: [...r.excludedDates, ...dates].sort() } : r;
    }),
    transactions: b.transactions.filter((t) => !ids.has(t.id)),
  };
}

/** « Elle a bien eu lieu »: kept, and never asked again. */
export function keepNotOnStatement(b: Budget, item: NotOnStatement): Budget {
  const list = [...(b.settings.dismissedChecks ?? []).filter((k) => k !== item.key), item.key].slice(-200);
  return { ...b, settings: { ...b.settings, dismissedChecks: list } };
}

/** How the « Quand compter une récurrence ? » choice would change the past dates that are now counted. */
export function statementModeEffect(b: Budget) {
  const items = notOnStatement(b);
  return { count: items.length, total: items.reduce((s, i) => s + i.transaction.amount, 0) };
}
