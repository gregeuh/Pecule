import type { Reconciliation } from "./bank-reconciliation";
export type CategoryRule = { key:string;title:string;direction:"income"|"expense";category:string };
export type Account = { reconciliations?:Reconciliation[]; id: string; name: string; bank: string; type: "current" | "savings" | "cash"; openingBalance: number; openingDate: string; color: string };
export type Transaction = { id: string; label: string; amount: number; date: string; accountId: string; category: string; note: string; merchantId?: string; ruleId?: string; transferId?: string; transferOriginalCategory?:string; goalId?: string; importRef?: string; importBatch?: string; balanceIncluded?: boolean };
export type Rule = { merchantId?: string; id: string; label: string; amount: number; accountId: string; category: string; startDate: string; endDate: string; frequency: "monthly" | "weekly" | "yearly"; timing: "date" | "last-business-day"; day: number; active: boolean; holidays: "FR" | "none"; excludedDates: string[] };
export type Goal = { id: string; name: string; target: number; saved: number; monthly: number; color: string; icon: string; deadline: string };
export type Budget = { version: 1; name: string; accounts: Account[]; transactions: Transaction[]; rules: Rule[]; goals: Goal[]; settings: { categoryRules?:CategoryRule[]; dailyComfortCents?:number; categoryLimits?:Record<string,number>; horizon: "salary" | "month"; reserve: number; holidayCalendar: "FR" | "none"; spendingPlan?: { monthlyIncome: number | null; groups: Record<string, "needs" | "wants" | "savings" | "unassigned"> } } };
export const categories = ["Alimentation", "Restaurants", "Transport", "Logement", "Abonnements", "Télécommunications", "Énergie", "Assurances", "Impôts", "Éducation", "Épargne", "Dettes", "Shopping", "Loisirs", "Santé", "Salaire", "Autres revenus", "Autres", "Virement"];
export const colors = ["#335cff", "#a48bdb", "#edac69", "#5b9b86", "#d77992", "#5b99c1"];
export const money = (cents: number, decimals = true) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: decimals ? 2 : 0 }).format(cents / 100);
export const dateISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const todayISO = () => new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export const parseDate = (s: string) => new Date(s+"T12:00:00");
export const shiftDate = (s: string, days: number) => { const d=parseDate(s); d.setDate(d.getDate()+days); return dateISO(d); };
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000);
export const shortDate = (s: string) => parseDate(s).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
export function emptyBudget(name = ""): Budget { return {version:1,name,accounts:[],transactions:[],rules:[],goals:[],settings:{horizon:"salary",reserve:0,holidayCalendar:"FR"}}; }
export function holidaysFR(year: number): Set<string> {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
  const easter=dateISO(new Date(year,month-1,day,12));
  return new Set(["01-01","05-01","05-08","07-14","08-15","11-01","11-11","12-25"].map(s=>`${year}-${s}`).concat([1,39,50].map(n=>shiftDate(easter,n))));
}
export function lastBusinessDay(year: number, month: number, calendar: "FR" | "none" = "FR") {
  const d=new Date(year,month+1,0,12), holidays=calendar==="FR" ? holidaysFR(year) : new Set<string>();
  while(d.getDay()===0 || d.getDay()===6 || holidays.has(dateISO(d))) d.setDate(d.getDate()-1);
  return dateISO(d);
}
export function occurrences(rule: Rule, from: string, to: string): Transaction[] {
  if(!rule.active || from>to) return [];
  const start = from>rule.startDate ? from : rule.startDate, end = rule.endDate && rule.endDate<to ? rule.endDate : to;
  if(start>end) return [];
  const dates: string[]=[];
  if(rule.frequency==="weekly") {
    const offset=Math.max(0,Math.ceil(daysBetween(rule.startDate,start)/7));
    for(let s=shiftDate(rule.startDate,offset*7);s<=end;s=shiftDate(s,7)) dates.push(s);
  } else {
    const sd=parseDate(rule.startDate), ed=parseDate(end), fd=parseDate(start);
    for(let y=fd.getFullYear();y<=ed.getFullYear();y++) for(let mo=0;mo<12;mo++) {
      if(rule.frequency==="yearly" && mo!==sd.getMonth()) continue;
      const s=rule.timing==="last-business-day" ? lastBusinessDay(y,mo,rule.holidays) : dateISO(new Date(y,mo,Math.min(rule.day,new Date(y,mo+1,0).getDate()),12));
      if(s>=start && s<=end) dates.push(s);
    }
  }
  return dates.filter(s=>!rule.excludedDates.includes(s)).map(s=>({id:`r:${rule.id}:${s}`,label:rule.label,amount:rule.amount,date:s,accountId:rule.accountId,category:rule.category,note:"Opération récurrente",ruleId:rule.id,...(rule.merchantId?{merchantId:rule.merchantId}:{})}));
}
export function materialize(budget: Budget, today = todayISO()): Budget {
  const ids=new Set(budget.transactions.map(t=>t.id));
  const transactions=[...budget.transactions];
  for(const rule of budget.rules) {
    const acc=budget.accounts.find(a=>a.id===rule.accountId); if(!acc) continue;
    // The starting balance already includes all operations on its reference date.
    const from=rule.startDate>acc.openingDate ? rule.startDate : shiftDate(acc.openingDate,1);
    for(const t of occurrences(rule,from,today)) if(!ids.has(t.id)) {transactions.push(t);ids.add(t.id);}
  }
  return {...budget,transactions};
}
export function futureTransactions(budget: Budget, from: string, to: string): Transaction[] {
  const existing=budget.transactions.filter(t=>t.date>=from && t.date<=to), ids=new Set(budget.transactions.map(t=>t.id));
  return [...existing,...budget.rules.flatMap(r=>occurrences(r,from,to)).filter(t=>!ids.has(t.id))].sort((a,b)=>a.date.localeCompare(b.date)||a.label.localeCompare(b.label));
}
export function accountBalance(budget: Budget, id: string, at = todayISO()): number {
  const b=materialize(budget,at), acc=b.accounts.find(a=>a.id===id); if(!acc || at<acc.openingDate) return 0;
  return acc.openingBalance+b.transactions.filter(t=>t.accountId===id && !t.balanceIncluded && t.date>=acc.openingDate && t.date<=at).reduce((s,t)=>s+t.amount,0);
}
export function overview(budget: Budget, today = todayISO()) {
  const b=materialize(budget,today), current=b.accounts.filter(a=>a.type!=="savings"), ids=new Set(current.map(a=>a.id));
  const total=current.reduce((s,a)=>s+accountBalance(b,a.id,today),0), saved=b.accounts.filter(a=>a.type==="savings").reduce((s,a)=>s+accountBalance(b,a.id,today),0);
  const salary=futureTransactions(b,shiftDate(today,1),shiftDate(today,370)).find(t=>t.amount>0 && t.category==="Salaire" && ids.has(t.accountId));
  const monthEnd=dateISO(new Date(parseDate(today).getFullYear(),parseDate(today).getMonth()+1,0,12));
  const end=b.settings.horizon==="salary" && salary ? shiftDate(salary.date,-1) : monthEnd;
  const future=futureTransactions(b,shiftDate(today,1),end).filter(t=>ids.has(t.accountId));
  const expenses=Math.max(0,-future.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));
  const monthStart=today.slice(0,7)+"-01";
  const reserve=b.settings.reserve+b.goals.reduce((s,g)=>s+Math.max(0,g.monthly-b.transactions.filter(t=>t.goalId===g.id && t.amount>0 && t.date>=monthStart && t.date<=today).reduce((sum,t)=>sum+t.amount,0)),0);
  const available=total-expenses-reserve, days=Math.max(1,daysBetween(today,end)+1);
  const monthly=b.transactions.filter(t=>t.date>=monthStart && t.date<=today && !t.transferId);
  return {total,saved,salary,end,expenses,reserve,available,days,daily:Math.floor(Math.max(0,available)/days),income:monthly.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),spent:Math.max(0,-monthly.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))};
}
export function demoBudget(today=todayISO()): Budget {
  const d=parseDate(today), month=today.slice(0,7), b=emptyBudget("Alex");
  b.accounts=[{id:"demo-c",name:"Compte du quotidien",bank:"Mon compte principal",type:"current",openingBalance:248640,openingDate:month+"-01",color:colors[0]},{id:"demo-s",name:"Livret d’épargne",bank:"Pour demain",type:"savings",openingBalance:425000,openingDate:month+"-01",color:colors[1]}];
  const samples:[string,number,string,number][]=[["Le café du coin",-480,"Restaurants",0],["Courses du quotidien",-6245,"Alimentation",1],["Spotify",-1214,"Abonnements",2],["Un trajet en ville",-260,"Transport",2],["Librairie du quartier",-2450,"Shopping",3],["Dîner entre amis",-3850,"Restaurants",4],["Cinéma",-1400,"Loisirs",6]];
  b.transactions=samples.map(([label,amount,category,ago],i)=>({id:`demo-t${i}`,label,amount,category,date:shiftDate(today,-ago),accountId:"demo-c",note:""})).filter(t=>t.date>=month+"-01");
  const next=shiftDate(today,1);
  b.rules=[{id:"demo-salary",label:"Mon salaire",amount:245000,accountId:"demo-c",category:"Salaire",startDate:next,endDate:"",frequency:"monthly",timing:"last-business-day",day:28,active:true,holidays:"FR",excludedDates:[]},{id:"demo-rent",label:"Loyer",amount:-78000,accountId:"demo-c",category:"Logement",startDate:next,endDate:"",frequency:"monthly",timing:"date",day:Math.min(d.getDate()+2,28),active:true,holidays:"FR",excludedDates:[]},{id:"demo-phone",label:"Forfait mobile",amount:-1999,accountId:"demo-c",category:"Abonnements",startDate:next,endDate:"",frequency:"monthly",timing:"date",day:Math.min(d.getDate()+3,28),active:true,holidays:"FR",excludedDates:[]}];
  b.goals=[{id:"demo-g1",name:"Une escapade au soleil",target:200000,saved:125000,monthly:15000,color:colors[2],icon:"sun",deadline:dateISO(new Date(d.getFullYear()+1,5,1,12))},{id:"demo-g2",name:"Le coussin de sécurité",target:600000,saved:300000,monthly:20000,color:colors[1],icon:"shield",deadline:""}];
  return b;
}
