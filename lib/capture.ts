import { materialize, shiftDate, type Budget, type Transaction } from "./budget.ts";
export type Favorite={id:string;label:string;amount?:number;direction:'expense'|'income';category:string;accountId?:string;merchantId?:string;customIconUrl?:string};
export type DailyReview={date:string;kind:'checked'|'nothing';signature:string;checkedAt:string};
export type CapturePreferences={lastAccountId?:string;favorites?:Favorite[];reviews?:DailyReview[]};
export function captureAccount(b:Budget,preferred?:string){return b.accounts.find(a=>a.id===preferred)?.id??b.accounts.find(a=>a.id===b.settings.capture?.lastAccountId)?.id??b.accounts.find(a=>a.type!=='savings')?.id??b.accounts[0]?.id;}
/** A change marker, not a security signature or a promise of bank reconciliation. */
export function reviewSignature(budget:Budget,date:string){
 const b=materialize(budget,date),text=JSON.stringify([b.accounts.map(a=>[a.id,a.openingBalance,a.openingDate]).sort(),b.transactions.filter(t=>t.date===date).map(t=>[t.id,t.date,t.amount,t.accountId,t.label,t.category,t.note,t.balanceIncluded??false]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);
 let a=2166136261,c=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);c=Math.imul(c,33)^text.charCodeAt(i);}return `${(a>>>0).toString(16).padStart(8,'0')}${(c>>>0).toString(16).padStart(8,'0')}`;
}
export function reviewState(b:Budget,date:string){const r=b.settings.capture?.reviews?.find(r=>r.date===date);return !r?'unreviewed':r.signature===reviewSignature(b,date)?'checked':'changed';}
export function markDailyReview(b:Budget,date:string,kind:DailyReview['kind'],today:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>today||date<'2000-01-01')throw new Error('Choisissez une journée passée ou aujourd’hui.');
 const next=structuredClone(b),review={date,kind,signature:reviewSignature(b,date),checkedAt:new Date().toISOString()};next.settings.capture={...next.settings.capture,reviews:[...(next.settings.capture?.reviews??[]).filter(r=>r.date!==date),review].slice(-90)};return next;
}
export function lastReview(b:Budget){return [...(b.settings.capture?.reviews??[])].sort((a,b)=>b.date.localeCompare(a.date))[0];}
export function recentReviewDays(b:Budget,today:string){return Array.from({length:7},(_,i)=>{const date=shiftDate(today,i-6);return {date,state:reviewState(b,date)};});}
export function favoriteFromTransaction(t:Transaction,id:string):Favorite{return {id,label:t.label,amount:Math.abs(t.amount),direction:t.amount>0?'income':'expense',category:t.category,accountId:t.accountId,...(t.merchantId?{merchantId:t.merchantId}:{}),...(t.customIconUrl?{customIconUrl:t.customIconUrl}:{})};}
