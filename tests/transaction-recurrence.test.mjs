import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBudget,accountBalance,materialize,futureTransactions} from '../lib/budget.ts';
import {transactionRecurrence,convertTransactionToRecurring} from '../lib/transaction-recurrence.ts';
import {budgetSchema} from '../lib/validation.ts';
function fixture(){const b=emptyBudget();b.accounts=[{id:'a',name:'Compte',bank:'',type:'current',color:'#235746',openingDate:'2026-01-01',openingBalance:100000}];b.transactions=[{id:'t',label:'Abonnement',amount:-1299,date:'2026-10-31',accountId:'a',category:'Abonnements',note:'Note conservée',merchantId:'netflix',customIconUrl:'https://example.com/icon.png',importRef:'bank-ref',importBatch:'batch'}];return b;}
test('conversion preserves ledger, import metadata, current balance and is materialized once',()=>{
 const b=fixture(),before=structuredClone(b),proposal=transactionRecurrence(b.transactions[0],b,'2026-10-31');assert.equal(proposal.startDate,'2026-11-30');assert.equal(proposal.day,31);assert.equal(proposal.amount,-1299);assert.equal(proposal.merchantId,'netflix');assert.equal(proposal.customIconUrl,b.transactions[0].customIconUrl);
 const next=convertTransactionToRecurring(b,'t',{id:'new-rule',...proposal},'2026-10-31');assert.deepEqual(b,before);assert.deepEqual(next.transactions,[{...before.transactions[0],ruleId:'new-rule'}]);assert.equal(accountBalance(next,'a','2026-10-31'),accountBalance(b,'a','2026-10-31'));assert.equal(materialize(next,'2026-11-30').transactions.length,2);assert.equal(materialize(materialize(next,'2026-11-30'),'2026-11-30').transactions.length,2);assert.equal(futureTransactions(next,'2026-11-01','2026-12-31').length,2);assert(budgetSchema.safeParse(next).success);assert.equal(transactionRecurrence(next.transactions[0],next,'2026-10-31'),null);assert.throws(()=>convertTransactionToRecurring(next,'t',{...proposal,id:'second'},'2026-10-31'),/déjà/);
});
test('old, future, leap year and end-of-calendar operations get a safe future proposal',()=>{
 const b=fixture(),t=b.transactions[0];for(const [date,today,expected] of [['2020-01-31','2026-10-31','2026-11-30'],['2026-12-05','2026-10-31','2027-01-05'],['2028-01-31','2028-01-31','2028-02-29'],['2026-10-05','2026-10-31','2026-11-05']])assert.equal(transactionRecurrence({...t,date},b,today).startDate,expected);assert.equal(transactionRecurrence({...t,date:'2100-12-31'},b,'2100-12-31'),null);
});
test('income sign, historical flag and weekly choice survive conversion',()=>{
 const b=fixture();b.transactions[0]={...b.transactions[0],amount:300000,category:'Salaire',balanceIncluded:true};const proposal=transactionRecurrence(b.transactions[0],b,'2026-10-31');const next=convertTransactionToRecurring(b,'t',{...proposal,id:'income',frequency:'weekly',startDate:'2026-11-07'},'2026-10-31');assert.equal(next.rules[0].amount,300000);assert(next.transactions[0].balanceIncluded);assert.equal(accountBalance(next,'a','2026-10-31'),100000);assert.equal(futureTransactions(next,'2026-11-01','2026-11-30').length,4);
});
test('reject retroactive starts, transfers, missing sources and existing links without mutation',()=>{
 const b=fixture(),proposal={id:'r',...transactionRecurrence(b.transactions[0],b,'2026-10-31')};for(const date of ['2026-10-31','2026-10-01'])assert.throws(()=>convertTransactionToRecurring(b,'t',{...proposal,startDate:date},'2026-10-31'),/échéance/);assert.throws(()=>convertTransactionToRecurring(b,'missing',proposal,'2026-10-31'));
 for(const patch of [{transferId:'pair'},{goalId:'goal'},{amount:0}]){const next=structuredClone(b);Object.assign(next.transactions[0],patch);assert.equal(transactionRecurrence(next.transactions[0],next,'2026-10-31'),null);assert.throws(()=>convertTransactionToRecurring(next,'t',proposal,'2026-10-31'));}
});
