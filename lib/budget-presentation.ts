import type {Budget} from './budget';
/** Explanatory rows only; the canonical overview remains the owner of the total. */
export function reserveLines(budget:Budget,today:string){
 const rows=budget.goals.filter(goal=>goal.monthly>0).map(goal=>({id:goal.id,label:goal.name,amount:Math.max(0,goal.monthly-budget.transactions.filter(t=>t.goalId===goal.id&&t.amount>0&&t.date>=today.slice(0,7)+'-01'&&t.date<=today).reduce((sum,t)=>sum+t.amount,0))}));
 return budget.settings.reserve?[{id:'reserve-setting',label:'Réserve libre',amount:budget.settings.reserve},...rows]:rows;
}
/** Nice display bounds, independent from the projected money values. */
export function roundedAxis(rawMin:number,rawMax:number){
 const target=Math.max(100,(rawMax-rawMin)/3),power=10**Math.floor(Math.log10(target)),factor=target/power;
 const unit=[1,2,2.5,5,10].reduce((best,next)=>Math.abs(next-factor)<Math.abs(best-factor)?next:best,1);
 const step=Math.max(100,unit*power),min=Math.floor(rawMin/step)*step,max=Math.max(min+step,Math.ceil(rawMax/step)*step);
 const ticks=Array.from({length:Math.round((max-min)/step)+1},(_,i)=>max-i*step);
 return {min,max,step,ticks};
}
