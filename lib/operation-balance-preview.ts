import {accountBalance,type Budget} from './budget.ts';
import {parseAmount,parseCSVDate} from './csv.ts';

export type OperationBalanceDraft={accountId:string;amount:string;date:string;direction:string};
/** Read-only, isolated impact on today's canonical balance; never a forecast or a write. */
export function operationBalancePreview(budget:Budget,draft:OperationBalanceDraft,today:string){
 const account=budget.accounts.find(a=>a.id===draft.accountId);
 if(!account)return {account:undefined,current:null,after:null,future:false,problem:'account' as const};
 const current=accountBalance(budget,account.id,today);
 if(parseCSVDate(draft.date)!==draft.date)return {account,current,after:null,future:false,problem:'date' as const};
 const future=draft.date>today;
 if(draft.date<account.openingDate)return {account,current,after:null,future,problem:'reference' as const};
 if(account.openingDate>today)return {account,current,after:null,future,problem:'future-reference' as const};
 const amount=parseAmount(draft.amount);
 if(amount===null||amount<=0||!['expense','income'].includes(draft.direction))return {account,current,after:null,future,problem:'amount' as const};
 const after=current+(draft.direction==='income'?amount:-amount);
 if(!Number.isSafeInteger(current)||!Number.isSafeInteger(after))return {account,current,after:null,future,problem:'range' as const};
 return {account,current,after,future,problem:null};
}
