import type { Budget, Transaction } from "./budget.ts";
import { nameFor, readableLabel, rememberLabelName } from "./readable-label.ts";

export type NameProposal = { raw: string; name: string; count: number };

/** Bank labels that would read better, with the proposed name and how many operations and recurrences carry them. */
export function nameProposals(
  budget: Budget,
  labels: string[] = [
    ...budget.transactions.filter((t) => !t.transferId && !t.bankLabel).map((t) => t.label),
    ...budget.rules.filter((r) => !r.bankLabel).map((r) => r.label),
  ],
): NameProposal[] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts]
    .map(([raw, count]) => ({ raw, name: nameFor(budget.settings.labelNames, raw), count }))
    .filter((p) => p.name !== p.raw)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

/**
 * Gives readable names to operations (and recurrences) still carrying their bank label.
 * `only` limits the operations touched (an import batch); recurrences are renamed only without it.
 */
export function applyNames(budget: Budget, names: Map<string, string>, only?: (t: Transaction) => boolean): Budget {
  const rename = <T extends { label: string; bankLabel?: string }>(item: T): T => {
    const name = names.get(item.label)?.trim();
    if (item.bankLabel || !name || name === item.label) return item;
    return { ...item, label: name.slice(0, 120), bankLabel: item.label };
  };
  return {
    ...budget,
    transactions: budget.transactions.map((t) => (t.transferId || (only && !only(t)) ? t : rename(t))),
    rules: only ? budget.rules : budget.rules.map(rename),
  };
}

/** Puts the bank labels back on everything renamed. */
export function restoreBankLabels(budget: Budget): Budget {
  const restore = <T extends { label: string; bankLabel?: string }>(item: T): T => {
    if (!item.bankLabel) return item;
    const { bankLabel, ...rest } = item;
    return { ...rest, label: bankLabel } as T;
  };
  return { ...budget, transactions: budget.transactions.map(restore), rules: budget.rules.map(restore) };
}

/**
 * After editing an operation or a recurrence: keeps its bank label while its name differs, drops it once the
 * bank label is back, and remembers a hand-chosen name for the next imports when asked.
 */
export function keepBankLabel(
  item: { label: string; bankLabel?: string },
  origin: string,
  remember: boolean,
  budget: Budget,
) {
  if (!origin || item.label === origin) {
    delete item.bankLabel;
    return;
  }
  item.bankLabel = origin;
  if (remember && item.label !== readableLabel(origin))
    budget.settings.labelNames = rememberLabelName(budget.settings.labelNames, origin, item.label);
}
