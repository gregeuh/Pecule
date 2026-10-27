import { accountBalance, materialize, todayISO, type Budget, type Account } from "./budget.ts";
export type Reconciliation = { date:string; bankBalance:number; fingerprint:string; confirmedAt:string };
export function latestReconciliation(account:Account){return [...(account.reconciliations??[])].reverse().sort((a,b)=>b.date.localeCompare(a.date)||Date.parse(b.confirmedAt)-Date.parse(a.confirmedAt))[0];}
export function reconciliationRows(budget:Budget,accountId:string,date:string){
 const account=budget.accounts.find(a=>a.id===accountId);
 if(!account)throw new Error("Compte introuvable.");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date<account.openingDate||date>todayISO())throw new Error("Choisissez une date entre la référence du compte et aujourd’hui.");
 return materialize(budget,date).transactions.filter(t=>t.accountId===accountId&&!t.balanceIncluded&&t.date>=account.openingDate&&t.date<=date).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
export async function ledgerFingerprint(budget:Budget,accountId:string,date:string){
 const account=budget.accounts.find(a=>a.id===accountId);if(!account)throw new Error("Compte introuvable.");
 const rows=reconciliationRows(budget,accountId,date).map(t=>[t.id,t.date,t.amount]).sort((a,b)=>String(a[0])<String(b[0])?-1:String(a[0])>String(b[0])?1:0);
 const data=JSON.stringify([accountId,account.openingDate,account.openingBalance,date,rows]);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
 return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function confirmReconciliation(budget:Budget,accountId:string,date:string,bankBalance:number,checked:ReadonlySet<string>):Promise<Budget>{
 const rows=reconciliationRows(budget,accountId,date);
 if(!Number.isSafeInteger(bankBalance)||Math.abs(bankBalance)>1e11)throw new Error("Indiquez un solde bancaire valide.");
 if(accountBalance(budget,accountId,date)!==bankBalance)throw new Error("L’écart doit être nul avant de confirmer le rapprochement.");
 if(rows.some(t=>!checked.has(t.id)))throw new Error("Pointez toutes les opérations de cette période après les avoir vérifiées sur votre relevé.");
 const reconciliation={date,bankBalance,fingerprint:await ledgerFingerprint(budget,accountId,date),confirmedAt:new Date().toISOString()};
 return {...budget,accounts:budget.accounts.map(a=>a.id===accountId?{...a,reconciliations:[...(a.reconciliations??[]),reconciliation].slice(-50)}:a)};
}
export function reconciliationHints(rows:Budget['transactions'],difference:number){
 const keys=new Map<string,number>();for(const t of rows){const key=JSON.stringify([t.date,t.amount,t.label.toLocaleLowerCase('fr').trim()]);keys.set(key,(keys.get(key)??0)+1);}
 return new Map(rows.map(t=>{const duplicate=(keys.get(JSON.stringify([t.date,t.amount,t.label.toLocaleLowerCase('fr').trim()]))??0)>1;return [t.id,[...(duplicate?["Même date, libellé et montant qu’une autre opération : vérifiez un éventuel doublon."]:[]),...(difference!==0&&-t.amount===difference?["Son retrait expliquerait exactement l’écart. Vérifiez avant de modifier."]:[])]];}));
}
