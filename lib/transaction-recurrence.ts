import { dateISO, parseDate, type Budget, type Rule, type Transaction } from './budget.ts';

/** Build the next monthly payment from the recorded operation, never backfill it. */
export function transactionRecurrence(transaction:Transaction,budget:Budget,today:string):Omit<Rule,'id'>|null {
 if(transaction.transferId||transaction.goalId||transaction.amount===0||budget.rules.some(rule=>rule.id===transaction.ruleId))return null;
 const anchor=parseDate(transaction.date),day=anchor.getDate(),after=transaction.date>today?transaction.date:today;
 const afterDate=parseDate(after);
 let month=Math.max(anchor.getFullYear()*12+anchor.getMonth()+1,afterDate.getFullYear()*12+afterDate.getMonth());
 let startDate='';
 for(let i=0;i<2;i++,month++){
  const year=Math.floor(month/12),mo=month%12;
  startDate=dateISO(new Date(year,mo,Math.min(day,new Date(year,mo+1,0).getDate()),12));
  if(startDate>after)break;
 }
 if(startDate>'2100-12-31')return null;
 return {label:transaction.label,amount:transaction.amount,accountId:transaction.accountId,category:transaction.category,startDate,endDate:'',frequency:'monthly',timing:'date',day,active:true,holidays:budget.settings.holidayCalendar,excludedDates:[],...(transaction.merchantId?{merchantId:transaction.merchantId}:{}),...(transaction.customIconUrl?{customIconUrl:transaction.customIconUrl}:{})};
}

export function convertTransactionToRecurring(budget:Budget,transactionId:string,rule:Rule,today:string):Budget {
 const source=budget.transactions.find(transaction=>transaction.id===transactionId);
 if(!source||source.transferId||source.goalId||source.amount===0)throw new Error('Cette opération ne peut pas être transformée en récurrence.');
 if(budget.rules.some(existing=>existing.id===source.ruleId||existing.id===rule.id))throw new Error('Cette opération est déjà associée à une récurrence.');
 if(rule.startDate<=today||rule.startDate<=source.date)throw new Error('La première échéance doit être après aujourd’hui et après l’opération d’origine.');
 return {...budget,rules:[...budget.rules,rule],transactions:budget.transactions.map(transaction=>transaction.id===source.id?{...transaction,ruleId:rule.id}:transaction)};
}
