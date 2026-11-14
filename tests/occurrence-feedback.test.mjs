import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBudget } from '../lib/budget.ts';
import { occurrenceFeedback } from '../lib/occurrence-feedback.ts';
function fixture(){const budget=emptyBudget();budget.accounts=[{id:'account',name:'QA',bank:'',type:'current',openingBalance:0,openingDate:'2026-10-01',color:'#235746'}];budget.rules=[{id:'rule',label:'QA recurrence',amount:-1000,accountId:'account',category:'Logement',startDate:'2026-10-01',endDate:'',frequency:'monthly',timing:'date',day:15,active:true,holidays:'none',excludedDates:[]}];return budget;}
test('a receipt selects the next actual future date rather than the next old occurrence',()=>{
 const budget=fixture(),before=structuredClone(budget);
 assert.deepEqual(occurrenceFeedback(budget,'rule','2026-10-15','2026-10-28'),{date:'2026-10-15',nextDate:'2026-11-15'});
 assert.deepEqual(budget,before);
});
test('excluded dates are respected by the calendar receipt',()=>{
 const budget=fixture();budget.rules[0].excludedDates=['2026-11-15'];
 assert.equal(occurrenceFeedback(budget,'rule','2026-10-15','2026-10-28').nextDate,'2026-12-15');
});
test('ended and paused schedules never invent a future date',()=>{
 const budget=fixture();budget.rules[0].active=false;
 assert.deepEqual(occurrenceFeedback(budget,'rule','2026-10-15','2026-10-28'),{date:'2026-10-15'});
 budget.rules[0].active=true;budget.rules[0].endDate='2026-10-15';
 assert.equal(occurrenceFeedback(budget,'rule','2026-10-15','2026-10-28').nextDate,undefined);
});
test('a future occurrence receipt advances after the saved date',()=>{
 assert.equal(occurrenceFeedback(fixture(),'rule','2026-11-15','2026-10-28').nextDate,'2026-12-15');
});
