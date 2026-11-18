import { dateISO, parseDate, type Budget } from "./budget.ts";
import { categoryGroup } from "./spending-plan.ts";
export function monthlySpending(budget:Budget,month:string,today:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Mois invalide');
 const amounts=new Map<string,number>();let count=0;
 for(const t of budget.transactions){
  if(!t.date.startsWith(month)||t.date>today||t.transferId||t.category==='Virement'||!budget.accounts.some(a=>a.id===t.accountId&&a.type!=="savings"))continue;
  // Refunds reduce spending in their original category; income categories are excluded.
  if(['Salaire','Autres revenus'].includes(t.category)||categoryGroup(t.category,budget)==='savings'||(t.amount>0&&categoryGroup(t.category,budget)==='unassigned'))continue;
  amounts.set(t.category,(amounts.get(t.category)??0)-t.amount);count++;
 }
 const categories=[...amounts].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount||a.category.localeCompare(b.category,'fr'));
 return {month,total:categories.reduce((s,c)=>s+c.amount,0),categories,count};
}
export function spendingInsights(budget:Budget,month:string,today:string){
 const date=parseDate(month+'-01');
 const months=Array.from({length:6},(_,i)=>dateISO(new Date(date.getFullYear(),date.getMonth()-5+i,1,12)).slice(0,7));
 const current=monthlySpending(budget,month,today),previous=monthlySpending(budget,months.at(-2)!,today);
 return {current,previous,history:months.map(m=>monthlySpending(budget,m,today)),difference:current.total-previous.total};
}
export function spendingAlerts(budget:Budget,month:string,today:string){
 const summary=monthlySpending(budget,month,today);
 return Object.entries(budget.settings.categoryLimits??{}).flatMap(([category,limit])=>{
  const spent=summary.categories.find(c=>c.category===category)?.amount??0;
  return spent>=limit?[{category,limit,spent}]:[];
 });
}
