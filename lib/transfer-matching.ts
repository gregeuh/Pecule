import { daysBetween, shiftDate, type Budget, type Transaction } from "./budget.ts";
import { budgetSchema } from "./validation.ts";
export function matchable(t:Transaction){return t.amount!==0&&!t.transferId&&!t.ruleId&&!t.goalId;}
export function transferCandidates(budget:Budget,debitId:string,maxDays:number|null=3){
 const debit=budget.transactions.find(t=>t.id===debitId);if(!debit||debit.amount>=0||!matchable(debit))return [];
 return budget.transactions.filter(t=>matchable(t)&&t.amount===-debit.amount&&t.accountId!==debit.accountId&&(maxDays===null||Math.abs(daysBetween(debit.date,t.date))<=maxDays)).sort((a,b)=>Math.abs(daysBetween(debit.date,a.date))-Math.abs(daysBetween(debit.date,b.date))||a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function transferSuggestions(budget:Budget,maxDays=3){
 const credits=new Map<number,{all:Transaction[];accounts:Map<string,Transaction[]>}>();
 for(const t of budget.transactions)if(t.amount>0&&matchable(t)&&t.importBatch){let bucket=credits.get(t.amount);if(!bucket){bucket={all:[],accounts:new Map()};credits.set(t.amount,bucket);}bucket.all.push(t);const rows=bucket.accounts.get(t.accountId);if(rows)rows.push(t);else bucket.accounts.set(t.accountId,[t]);}
 for(const bucket of credits.values()){bucket.all.sort((a,b)=>a.date.localeCompare(b.date));for(const rows of bucket.accounts.values())rows.sort((a,b)=>a.date.localeCompare(b.date));}
 const boundary=(rows:Transaction[],date:string,inclusive:boolean)=>{let low=0,high=rows.length;while(low<high){const mid=(low+high)>>>1;if(rows[mid].date<date||(inclusive&&rows[mid].date===date))low=mid+1;else high=mid;}return low;};
 const count=(rows:Transaction[],from:string,to:string)=>boundary(rows,to,true)-boundary(rows,from,false);
 return budget.transactions.filter(t=>t.amount<0&&matchable(t)&&t.importBatch).flatMap(debit=>{const bucket=credits.get(-debit.amount);if(!bucket)return [];const from=shiftDate(debit.date,-maxDays),to=shiftDate(debit.date,maxDays),candidateCount=count(bucket.all,from,to)-count(bucket.accounts.get(debit.accountId)??[],from,to);return candidateCount?[{debit,candidateCount}]:[];}).sort((a,b)=>b.debit.date.localeCompare(a.debit.date));
}
export function linkTransfer(budget:Budget,debitId:string,creditId:string,transferId:string):Budget{
 const debit=budget.transactions.find(t=>t.id===debitId),credit=budget.transactions.find(t=>t.id===creditId);
 if(!debit||!credit||debit.amount>=0||credit.amount!==-debit.amount||debit.accountId===credit.accountId||!matchable(debit)||!matchable(credit))throw new Error("Choisissez un débit et un crédit de même montant sur deux comptes différents, sans lien existant.");
 if(budget.transactions.some(t=>t.transferId===transferId))throw new Error("Ce virement existe déjà.");
 const next={...budget,transactions:budget.transactions.map(t=>t.id===debitId||t.id===creditId?{...t,transferId,transferOriginalCategory:t.category,category:'Virement'}:t)};
 const validated=budgetSchema.safeParse(next);if(!validated.success)throw new Error(validated.error.issues[0].message);return validated.data;
}
export function unlinkTransfer(budget:Budget,transferId:string):Budget{
 const rows=budget.transactions.filter(t=>t.transferId===transferId);
 if(rows.length!==2||rows.some(t=>!t.transferOriginalCategory||t.goalId))throw new Error("Ce virement ne provient pas d’une association d’opérations. Modifiez-le depuis son détail.");
 return {...budget,transactions:budget.transactions.map(t=>{if(t.transferId!==transferId)return t;const {transferId:removed,transferOriginalCategory,...rest}=t;void removed;return {...rest,category:transferOriginalCategory!};})};
}
