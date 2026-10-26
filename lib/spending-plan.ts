import { dateISO, parseDate, shiftDate, materialize, futureTransactions, type Budget, type Transaction } from "./budget.ts";
export type PlanGroup = "needs" | "wants" | "savings" | "unassigned";
export const groupNames = { needs: "Besoins", wants: "Envies", savings: "Épargne et dettes", unassigned: "À classer" };
export const defaultGroups: Record<string, PlanGroup> = { Alimentation: "needs", Transport: "needs", Logement: "needs", Santé: "needs", Télécommunications: "needs", Énergie: "needs", Assurances: "needs", Impôts: "needs", Éducation: "needs", Restaurants: "wants", Abonnements: "wants", Shopping: "wants", Loisirs: "wants", Épargne: "savings", Dettes: "savings" };
export function categoryGroup(category: string, budget: Budget): PlanGroup {
  return budget.settings.spendingPlan?.groups?.[category] ?? (Object.hasOwn(defaultGroups, category) ? defaultGroups[category] : "unassigned");
}
export function spendingPlan(budget: Budget, month: string, today: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Mois invalide.");
  const start = month + "-01", date = parseDate(start), end = dateISO(new Date(date.getFullYear(), date.getMonth()+1, 0, 12));
  const b = materialize(budget, today), actual = b.transactions.filter(t => t.date >= start && t.date <= end && t.date <= today);
  const from = start > today ? start : shiftDate(today, 1), planned = from <= end ? futureTransactions(b, from, end) : [];
  const accounts = new Map(b.accounts.map(a => [a.id, a]));
  function tally(rows: Transaction[]) {
    const amounts: Record<PlanGroup, number> = { needs: 0, wants: 0, savings: 0, unassigned: 0 };
    let unassignedCount = 0;
    const transfers = new Map<string, Transaction[]>();
    for (const t of rows) if (t.transferId) transfers.set(t.transferId, [...(transfers.get(t.transferId) ?? []), t]);
    for (const t of rows) {
      const account = accounts.get(t.accountId); if (!account) continue;
      if (t.transferId) {
        if (account.type !== "savings") continue;
        const pair = transfers.get(t.transferId) ?? [];
        if (pair.length === 2 && pair.reduce((n,t)=>n+t.amount,0) === 0 && pair.every(p => p.date === t.date && accounts.has(p.accountId)) && pair.some(p=>accounts.get(p.accountId)?.type !== "savings")) amounts.savings += t.amount;
        continue;
      }
      const group = categoryGroup(t.category, b);
      if (t.amount > 0 && (["Salaire", "Autres revenus", "Virement"].includes(t.category) || group === "unassigned")) continue;
      amounts[group] -= t.amount;
      if (group === "unassigned" && t.amount < 0) unassignedCount++;
    }
    return { amounts, unassignedCount };
  }
  const income = (rows: Transaction[]) => rows.filter(t => !t.transferId && t.amount > 0 && accounts.has(t.accountId) && accounts.get(t.accountId)?.type !== "savings" && (["Salaire", "Autres revenus"].includes(t.category) || t.category === "Autres" && categoryGroup(t.category,b) === "unassigned") && !/rembours|refund|avoir/i.test(t.label)).reduce((sum,t)=>sum+t.amount,0);
  const actualIncome = income(actual), plannedIncome = income(planned), manual = budget.settings.spendingPlan?.monthlyIncome;
  const reference = manual ?? actualIncome + plannedIncome;
  const percent = (p:number) => Math.floor(reference / 100) * p + Math.floor(reference % 100 * p / 100);
  const needs = percent(50), wants = percent(30);
  return { start, end, reference, manual: manual != null, actualIncome, plannedIncome, actual: tally(actual), planned: tally(planned), targets: { needs, wants, savings: reference-needs-wants }, categories: [...new Set([...Object.keys(defaultGroups), "Autres", ...[...actual,...planned].filter(t=>t.amount<0&&!t.transferId).map(t=>t.category)])] };
}
