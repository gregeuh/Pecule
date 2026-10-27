import type { Budget } from "./budget";

export type MergeConflict = { key: string; label: string; local: unknown; remote: unknown };
export type MergeResult = { budget: Budget; conflicts: MergeConflict[] };
// Entity-level decisions keep related financial fields together; deletions count as changes.
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function mergeBudgets(base: Budget, local: Budget, remote: Budget, choices: Record<string, "local" | "remote"> = {}): MergeResult {
  const conflicts: MergeConflict[] = [];
  function pick(key: string, label: string, before: unknown, mine: unknown, theirs: unknown): unknown {
    if (equal(mine, before) || equal(mine, theirs)) return theirs;
    if (equal(theirs, before)) return mine;
    if (choices[key]) return choices[key] === "local" ? mine : theirs;
    conflicts.push({ key, label, local: mine, remote: theirs });
    return theirs;
  }
  const budget = structuredClone(remote);
  budget.name = pick("name", "Nom du budget", base.name, local.name, remote.name) as string;
  budget.settings = pick("settings", "Préférences du budget", base.settings, local.settings, remote.settings) as Budget["settings"];
  for (const key of ["accounts", "transactions", "rules", "goals"] as const) {
    const before = new Map(base[key].map(x => [x.id, x] as const));
    const mine = new Map(local[key].map(x => [x.id, x] as const));
    const theirs = new Map(remote[key].map(x => [x.id, x] as const));
    const rows = [...new Set([...theirs.keys(), ...mine.keys(), ...before.keys()])].flatMap(id => {
      const item = mine.get(id) ?? theirs.get(id) ?? before.get(id)!;
      const label = "label" in item ? item.label : item.name;
      const value = pick(`${key}:${id}`, label, before.get(id), mine.get(id), theirs.get(id));
      return value === undefined ? [] : [value];
    });
    Object.assign(budget, { [key]: rows });
  }
  return { budget, conflicts };
}
