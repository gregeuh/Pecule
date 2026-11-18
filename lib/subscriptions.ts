import {dateISO,parseDate,shiftDate,futureTransactions,type Budget} from './budget.ts';
import {categoryIdentity} from './category-rules.ts';
export function subscriptionOverview(b:Budget,today:string){
 const d=parseDate(today),end=dateISO(new Date(d.getFullYear()+1,d.getMonth(),Math.min(d.getDate(),new Date(d.getFullYear()+1,d.getMonth()+1,0).getDate()),12));
 const from=dateISO(new Date(d.getFullYear()-1,d.getMonth(),Math.min(d.getDate(),new Date(d.getFullYear()-1,d.getMonth()+1,0).getDate()),12));
 const rules=b.rules.filter(r=>r.category==='Abonnements'&&r.amount<0&&b.accounts.some(a=>a.id===r.accountId));
 const ids=new Set(rules.map(r=>r.id));
 const paid=b.transactions.filter(t=>t.category==='Abonnements'&&t.amount<0&&!t.transferId&&t.date>from&&t.date<=today&&b.accounts.some(a=>a.id===t.accountId));
 const future=futureTransactions(b,shiftDate(today,1),end).filter(t=>t.ruleId&&ids.has(t.ruleId)&&t.amount<0&&!t.transferId&&!t.balanceIncluded&&b.accounts.some(a=>a.id===t.accountId&&t.date>=a.openingDate));
 const items=rules.map(rule=>{const history=paid.filter(t=>t.ruleId===rule.id).sort((a,b)=>b.date.localeCompare(a.date));const distinct=[...new Map(history.map(t=>[t.date,t])).values()],last=distinct[0],previous=distinct[1],next=future.filter(t=>t.ruleId===rule.id);
  const increase=last&&previous&&Math.abs(last.amount)>Math.abs(previous.amount)?{before:Math.abs(previous.amount),after:Math.abs(last.amount),planned:false}:last&&next[0]&&Math.abs(next[0].amount)>Math.abs(last.amount)?{before:Math.abs(last.amount),after:Math.abs(next[0].amount),planned:true}:null;
  return {rule,next:next[0],annual:next.reduce((s,t)=>s-t.amount,0),paid:history.reduce((s,t)=>s-t.amount,0),increase};});
 const groups=new Map<string,typeof paid>();for(const t of paid.filter(t=>!t.ruleId)){const key=JSON.stringify([t.accountId,categoryIdentity(t.label,t.merchantId).key]);const group=groups.get(key)??[];group.push(t);groups.set(key,group);}
 const manual=[...groups.values()].map(rows=>{rows.sort((a,b)=>b.date.localeCompare(a.date));const last=rows[0],previous=rows.find(t=>t.date!==last.date);return {last,count:rows.length,paid:rows.reduce((s,t)=>s-t.amount,0),increase:previous&&Math.abs(last.amount)>Math.abs(previous.amount)?{before:Math.abs(previous.amount),after:Math.abs(last.amount),planned:false}:null};});
 return {items,manual,annual:items.reduce((s,i)=>s+i.annual,0),paid:paid.reduce((s,t)=>s-t.amount,0),from,end};
}
