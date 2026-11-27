import { materialize, shiftDate, type Budget, type Rule, type Transaction } from "./budget.ts";
import { normalize } from "./merchants.ts";
import { readableLabel } from "./readable-label.ts";

/** Words of a label that can tell two operations apart (dates, numbers and short words aside). */
const words = (label: string) =>
  new Set(
    normalize(readableLabel(label))
      .split(" ")
      .filter((w) => w.length >= 4 && !/\d/.test(w)),
  );
const shareWord = (a: string, b: string) => {
  const left = words(a);
  return [...words(b)].some((w) => left.has(w));
};
const close = (a: number, b: number, share: number) => Math.abs(a - b) <= Math.abs(a) * share;

/**
 * Could this recorded operation be that date of the recurrence? Same account and direction, within 10 days, amounts
 * within 3 % in the same category, or within 15 % with a word of the name in common.
 */
export function sameOperation(rule: Rule, planned: Transaction, t: Transaction) {
  const gap = Math.abs(Date.parse(t.date) - Date.parse(planned.date)) / 864e5;
  return (
    !t.transferId &&
    t.accountId === rule.accountId &&
    t.amount > 0 === rule.amount > 0 &&
    gap <= 10 &&
    ((close(planned.amount, t.amount, 0.03) && t.category === rule.category) ||
      (close(planned.amount, t.amount, 0.15) &&
        (shareWord(rule.bankLabel ?? rule.label, t.bankLabel ?? t.label) || shareWord(rule.label, t.label))))
  );
}

export type DuplicateRules = { key: string; rules: [Rule, Rule] };
export type DoubleCount = { key: string; rule: Rule; date: string; planned: Transaction; recorded: Transaction };

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

/**
 * Two active recurrences that probably describe the same payment: same account, same direction and rhythm,
 * a name in common and amounts within 10 %. A pair the person kept on purpose is never shown again.
 */
export function duplicateRules(b: Budget): DuplicateRules[] {
  const dismissed = new Set(b.settings.dismissedChecks ?? []);
  const active = b.rules.filter((r) => r.active);
  const found: DuplicateRules[] = [];
  active.forEach((a, i) =>
    active.slice(i + 1).forEach((c) => {
      const key = `rules:${pairKey(a.id, c.id)}`;
      if (
        !dismissed.has(key) &&
        a.accountId === c.accountId &&
        (a.toAccountId ?? "") === (c.toAccountId ?? "") &&
        a.amount > 0 === c.amount > 0 &&
        a.frequency === c.frequency &&
        close(a.amount, c.amount, 0.1) &&
        shareWord(a.bankLabel ?? a.label, c.bankLabel ?? c.label) &&
        shareWord(a.label, c.label)
      )
        found.push({ key, rules: [a, c] });
    }),
  );
  return found;
}

/**
 * A past date where Pécule counted a recurrence by itself while the real operation was also recorded (often by an
 * import): same account and direction, within 10 days, amounts within 3 % in the same category, or within 15 %
 * with a word of the name in common. Small everyday purchases of a similar amount are never taken for it.
 */
export function doubleCounts(b: Budget, today: string, days = 62): DoubleCount[] {
  const dismissed = new Set(b.settings.dismissedChecks ?? []);
  // Past dates of a recurrence are recorded by Pécule itself (ids « r:rule:date »), with the others or not yet.
  const all = materialize(b, today).transactions;
  const from = shiftDate(today, -days);
  const candidates: (DoubleCount & { score: number })[] = [];
  for (const rule of b.rules) {
    const own = all.filter((t) => t.id === `r:${rule.id}:${t.date}` && t.date >= from && t.date <= today);
    for (const planned of own) {
      const key = `twice:${rule.id}:${planned.date}`;
      if (dismissed.has(key)) continue;
      for (const t of b.transactions) {
        const gap = Math.abs(Date.parse(t.date) - Date.parse(planned.date)) / 864e5;
        if (t.ruleId || !sameOperation(rule, planned, t)) continue;
        candidates.push({
          key,
          rule,
          date: planned.date,
          planned,
          recorded: t,
          score: Math.abs(t.amount - planned.amount) / Math.abs(planned.amount) + gap / 1000,
        });
      }
    }
  }
  // Best matches first: each recorded operation and each planned date is used once.
  const usedRecorded = new Set<string>(),
    usedPlanned = new Set<string>();
  const found: DoubleCount[] = [];
  for (const c of candidates.sort((x, y) => x.score - y.score)) {
    if (usedRecorded.has(c.recorded.id) || usedPlanned.has(c.key)) continue;
    usedRecorded.add(c.recorded.id);
    usedPlanned.add(c.key);
    found.push({ key: c.key, rule: c.rule, date: c.date, planned: c.planned, recorded: c.recorded });
  }
  return found.sort((x, y) => y.date.localeCompare(x.date));
}

/**
 * Keeps one recurrence of a pair. The other is removed with the past dates Pécule had counted for it by itself (they
 * were the double); operations entered or imported by the person stay as they are.
 */
export function keepRule(b: Budget, pair: DuplicateRules, keepId: string): Budget {
  const drop = pair.rules.find((r) => r.id !== keepId);
  if (!drop || !pair.rules.some((r) => r.id === keepId)) throw new Error("Cette récurrence a changé.");
  return {
    ...b,
    rules: b.rules.filter((r) => r.id !== drop.id),
    transactions: b.transactions.filter((t) => !t.id.startsWith(`r:${drop.id}:`)),
  };
}

/** The recorded operation becomes that date's payment of the recurrence: the planned one is no longer counted. */
export function mergeDoubleCount(b: Budget, item: DoubleCount): Budget {
  return {
    ...b,
    rules: b.rules.map((r) =>
      r.id === item.rule.id && !r.excludedDates.includes(item.date)
        ? { ...r, excludedDates: [...r.excludedDates, item.date] }
        : r,
    ),
    transactions: b.transactions
      .filter((t) => t.id !== item.planned.id)
      .map((t) => (t.id === item.recorded.id ? { ...t, ruleId: item.rule.id } : t)),
  };
}

/** « Ce ne sont pas des doublons » / « Ce sont deux paiements »: never shown again. */
export function dismissCheck(b: Budget, key: string): Budget {
  const list = [...(b.settings.dismissedChecks ?? []).filter((k) => k !== key), key].slice(-200);
  return { ...b, settings: { ...b.settings, dismissedChecks: list } };
}
