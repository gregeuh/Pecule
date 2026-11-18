import {accountBalance,materialize,shiftDate,type Budget} from './budget.ts';
/** Canonical recorded balances, extended only by known movements and references. */
export function balanceOutlook(b:Budget,today:string,days=30,accountId?:string){
 if(!Number.isInteger(days)||days<0||days>90)throw new Error('Horizon invalide.');
 const accounts=b.accounts.filter(a=>accountId?a.id===accountId:a.type!=='savings');
 const ids=new Set(accounts.map(a=>a.id)),end=shiftDate(today,days),full=materialize(b,end);
 const events=new Map<string,number>();
 const add=(date:string,value:number)=>events.set(date,(events.get(date)??0)+value);
 for(const a of accounts)if(a.openingDate>today&&a.openingDate<=end)add(a.openingDate,a.openingBalance);
 const movements=full.transactions.filter(t=>{const a=accounts.find(a=>a.id===t.accountId);return ids.has(t.accountId)&&a&&!t.balanceIncluded&&t.date>today&&t.date<=end&&t.date>=a.openingDate;}).sort((a,b)=>a.date.localeCompare(b.date)||a.label.localeCompare(b.label));
 for(const t of movements)add(t.date,t.amount);
 let value=accounts.reduce((s,a)=>s+accountBalance(b,a.id,today),0);
 const points=Array.from({length:days+1},(_,i)=>{const date=shiftDate(today,i);if(i)value+=events.get(date)??0;return {date,value};});
 const low=points.reduce((a,p)=>p.value<a.value?p:a,points[0]);
 return {points,low,movements,accounts,current:points[0].value,end:points.at(-1)!,firstNegative:points.find(p=>p.value<0)};
}
