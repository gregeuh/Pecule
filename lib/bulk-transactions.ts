import { accountBalance, type Budget, type Transaction } from "./budget.ts";
import { latestReconciliation } from "./bank-reconciliation.ts";
import { budgetSchema } from "./validation.ts";
export type BulkPatch={category?:string;accountId?:string};
export function bulkEditable(t:Transaction){return !t.transferId&&!t.goalId;}
export function buildBulkEdit(budget:Budget,ids:ReadonlySet<string>,patch:BulkPatch,today:string){
 if(!ids.size)throw new Error("Sélectionnez au moins une opération.");
 if(!patch.category&&!patch.accountId)throw new Error("Choisissez une catégorie ou un compte à modifier.");
 const selected=budget.transactions.filter(t=>ids.has(t.id));
 if(selected.length!==ids.size)throw new Error("Une opération sélectionnée n’existe plus. Vérifiez la sélection.");
 if(selected.some(t=>!bulkEditable(t)))throw new Error("Les virements et versements liés à un objectif se modifient séparément.");
 const target=patch.accountId?budget.accounts.find(a=>a.id===patch.accountId):null;
 if(patch.accountId&&!target)throw new Error("Le compte de destination n’existe plus.");
 if(target)for(const t of selected){if(t.balanceIncluded?t.date>target.openingDate:t.date<target.openingDate)throw new Error(`La date de « ${t.label} » est incompatible avec la référence de ${target.name}. Corrigez cette opération séparément.`);}
 const next={...budget,transactions:budget.transactions.map(t=>ids.has(t.id)?{...t,...patch}:t)};
 const validated=budgetSchema.safeParse(next);if(!validated.success)throw new Error(validated.error.issues[0].message);
 const changed=selected.filter(t=>(patch.category&&patch.category!==t.category)||(patch.accountId&&patch.accountId!==t.accountId));
 if(!changed.length)throw new Error("Ces opérations possèdent déjà les valeurs choisies.");
 const affectedIds=new Set(changed.flatMap(t=>[t.accountId,patch.accountId??t.accountId]));
 const impacts=budget.accounts.filter(a=>affectedIds.has(a.id)).map(a=>({account:a,before:accountBalance(budget,a.id,today),after:accountBalance(next,a.id,today)}));
 return {budget:validated.data,changed,impacts,recurringCount:changed.filter(t=>t.ruleId).length,reconciledAccounts:impacts.filter(x=>patch.accountId&&latestReconciliation(x.account)&&changed.some(t=>t.accountId!==patch.accountId&&t.date<=latestReconciliation(x.account)!.date&&(t.accountId===x.account.id||patch.accountId===x.account.id))).map(x=>x.account.name)};
}
