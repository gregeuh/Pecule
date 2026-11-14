import { todayISO, type Budget } from "./budget.ts";
export function importBatches(budget: Budget, at = todayISO()) {
  const batches = new Map<string, Budget["transactions"]>();
  for (const t of budget.transactions) {if (t.importBatch) batches.set(t.importBatch, [...(batches.get(t.importBatch) ?? []), t]);for(const link of t.bankLinks??[])if(!batches.has(link.batchId))batches.set(link.batchId,[]);}
  return [...batches].map(([id, rows]) => ({ id, count: rows.length, matchedCount:budget.transactions.filter(t=>t.bankLinks?.some(l=>l.batchId===id)).length, from: [...rows.map(t=>t.date),...budget.transactions.flatMap(t=>(t.bankLinks??[]).filter(l=>l.batchId===id).map(l=>l.date))].sort()[0], to: [...rows.map(t=>t.date),...budget.transactions.flatMap(t=>(t.bankLinks??[]).filter(l=>l.batchId===id).map(l=>l.date))].sort().at(-1)!, accounts: [...new Set([...rows.map(t=>t.accountId),...budget.transactions.filter(t=>t.bankLinks?.some(l=>l.batchId===id)).map(t=>t.accountId)])], impact: rows.filter(t=>!t.balanceIncluded && t.date<=at && t.date>=(budget.accounts.find(a=>a.id===t.accountId)?.openingDate??"9999")).reduce((sum,t)=>sum+t.amount,0) }));
}
export function removeImportBatch(budget: Budget, id: string): Budget {
  const rows = budget.transactions.filter(t=>t.importBatch===id);
  // Imported operations may have since been linked to other domain objects.
  if(rows.some(t=>t.bankLinks?.some(l=>l.batchId!==id)))throw new Error("Ce lot contient une opération associée à un autre import. Annulez d’abord cet autre import pour conserver ses données.");
  if (rows.some(t=>t.transferId || t.ruleId || t.goalId)) throw new Error("Ce lot contient des opérations liées à un virement, une récurrence ou un objectif. Corrigez ces liens avant de l’annuler.");
  return { ...budget, transactions: budget.transactions.filter(t=>t.importBatch!==id).map(t=>{if(!t.bankLinks?.some(l=>l.batchId===id))return t;const {bankLinks,...rest}=t;const remaining=bankLinks.filter(l=>l.batchId!==id);return remaining.length?{...rest,bankLinks:remaining}:rest;}) };
}
