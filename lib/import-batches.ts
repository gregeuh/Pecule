import { todayISO, type Budget } from "./budget.ts";
export function importBatches(budget: Budget, at = todayISO()) {
  const batches = new Map<string, Budget["transactions"]>();
  for (const t of budget.transactions) if (t.importBatch) batches.set(t.importBatch, [...(batches.get(t.importBatch) ?? []), t]);
  return [...batches].map(([id, rows]) => ({ id, count: rows.length, from: rows.map(t=>t.date).sort()[0], to: rows.map(t=>t.date).sort().at(-1)!, accounts: [...new Set(rows.map(t=>t.accountId))], impact: rows.filter(t=>!t.balanceIncluded && t.date<=at && t.date>=(budget.accounts.find(a=>a.id===t.accountId)?.openingDate??"9999")).reduce((sum,t)=>sum+t.amount,0) }));
}
export function removeImportBatch(budget: Budget, id: string): Budget {
  const rows = budget.transactions.filter(t=>t.importBatch===id);
  // Imported operations may have since been linked to other domain objects.
  if (rows.some(t=>t.transferId || t.ruleId || t.goalId)) throw new Error("Ce lot contient des opérations liées à un virement, une récurrence ou un objectif. Corrigez ces liens avant de l’annuler.");
  return { ...budget, transactions: budget.transactions.filter(t=>t.importBatch!==id) };
}
