import {dateISO,parseDate,type Budget} from './budget.ts';
import {categoryGroup} from "./spending-plan.ts";
import {monthlySpending} from './spending-insights.ts';
export function monthlyBrief(b:Budget,month:string,today:string){
 const current=monthlySpending(b,month,today),date=parseDate(month+'-01');
 const previousMonth=dateISO(new Date(date.getFullYear(),date.getMonth()-1,1,12)).slice(0,7);
 const partial=month===today.slice(0,7),previousEnd=dateISO(new Date(date.getFullYear(),date.getMonth(),0,12));
 const comparisonEnd=partial?`${previousMonth}-${String(Math.min(Number(today.slice(8)),Number(previousEnd.slice(8)))).padStart(2,'0')}`:previousEnd;
 const previous=monthlySpending(b,previousMonth,comparisonEnd);
 const changes=[...new Set([...current.categories.map(c=>c.category),...previous.categories.map(c=>c.category)])].map(category=>({category,amount:current.categories.find(c=>c.category===category)?.amount??0,previous:previous.categories.find(c=>c.category===category)?.amount??0})).map(r=>({...r,difference:r.amount-r.previous})).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference)).slice(0,3);
 const recurring=b.transactions.filter(t=>t.date.startsWith(month)&&t.date<=today&&t.amount<0&&!t.transferId&&categoryGroup(t.category,b)!=='savings'&&!['Salaire','Autres revenus'].includes(t.category)&&b.accounts.some(a=>a.id===t.accountId&&a.type!=='savings')&&(t.ruleId||t.category==='Abonnements'));
 const subscriptions=recurring.reduce((sum,t)=>sum-t.amount,0);
 const recurringLabels=[...new Set(recurring.map(t=>t.label))].slice(0,3);
 return {current,previous,partial,comparisonEnd,comparable:current.count>0&&previous.count>0,changes,subscriptions,recurringLabels,goals:b.goals.map(g=>({id:g.id,name:g.name,saved:g.saved,target:g.target,percent:Math.min(100,Math.max(0,Math.floor(g.saved/g.target*100)))}))};
}
