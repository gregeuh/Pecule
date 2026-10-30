import { daysBetween, parseDate, shiftDate, dateISO, type Budget, type Rule, type Transaction } from "./budget.ts";
import { categoryIdentity } from "./category-rules.ts";
export type RecurringSuggestion={key:string;rule:Omit<Rule,"id">;count:number;lastDate:string};
export function recurringSuggestions(budget:Budget,today:string):RecurringSuggestion[]{
 const identities=new Map<string,string>();
 const identityFor=(label:string,merchantId?:string)=>{const key=JSON.stringify([label,merchantId]);let identity=identities.get(key);if(!identity){identity=categoryIdentity(label,merchantId).key;identities.set(key,identity);}return identity;};
 const groups=new Map<string,Transaction[]>();
 for(const t of budget.transactions){
  if(t.amount>=0||t.transferId||t.ruleId||t.goalId||t.date>today||budget.accounts.find(a=>a.id===t.accountId)?.type==='savings')continue;
  const key=JSON.stringify([t.accountId,identityFor(t.label,t.merchantId),t.amount]);
  const rows=groups.get(key);if(rows)rows.push(t);else groups.set(key,[t]);
 }
 const suggestions:RecurringSuggestion[]=[];
 for(const [key,values] of groups){
  // One payment per date; repeated rows on the same day never prove recurrence.
  const rows=[...new Map(values.sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[t.date,t])).values()].slice(-4);
  if(rows.length<3)continue;
  const last=rows.at(-1)!,intervals=rows.slice(1).map((t,i)=>daysBetween(rows[i].date,t.date));
  let frequency:Rule['frequency']|undefined;
  if(intervals.every(n=>n>=6&&n<=8))frequency='weekly';
  else if(intervals.every(n=>n>=25&&n<=35)&&rows.every((t,i)=>i===0||((parseDate(t.date).getFullYear()*12+parseDate(t.date).getMonth())-(parseDate(rows[i-1].date).getFullYear()*12+parseDate(rows[i-1].date).getMonth())===1)))frequency='monthly';
  else if(intervals.every(n=>n>=360&&n<=370))frequency='yearly';
  if(!frequency||daysBetween(last.date,today)>(frequency==='weekly'?14:frequency==='monthly'?45:400))continue;
  const identity=identityFor(last.label,last.merchantId);
  if(budget.rules.some(r=>r.accountId===last.accountId&&identityFor(r.label,r.merchantId)===identity))continue;
  const date=parseDate(last.date),day=date.getDate();let next=last.date;
  for(let step=1;next<=today&&step<100;step++){
   if(frequency==='weekly')next=shiftDate(last.date,step*7);
   else {const year=date.getFullYear()+(frequency==='yearly'?step:0),month=date.getMonth()+(frequency==='monthly'?step:0);next=dateISO(new Date(year,month,Math.min(day,new Date(year,month+1,0).getDate()),12));}
  }
  if(next<=today||next>'2100-12-31')continue;
  suggestions.push({key,count:rows.length,lastDate:last.date,rule:{label:last.label,amount:last.amount,accountId:last.accountId,category:last.category,startDate:next,endDate:'',frequency,timing:'date',day,active:true,holidays:budget.settings.holidayCalendar,excludedDates:[],...(last.merchantId?{merchantId:last.merchantId}:{}),...(last.customIconUrl?{customIconUrl:last.customIconUrl}:{})}});
 }
 return suggestions.sort((a,b)=>a.rule.startDate.localeCompare(b.rule.startDate));
}
