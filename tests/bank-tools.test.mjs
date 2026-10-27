import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBudget, accountBalance, overview } from '../lib/budget.ts';
import { budgetSchema } from '../lib/validation.ts';
import { reconciliationRows, ledgerFingerprint, confirmReconciliation, latestReconciliation, reconciliationHints } from '../lib/bank-reconciliation.ts';
import { bulkEditable, buildBulkEdit } from '../lib/bulk-transactions.ts';
import { linkTransfer, unlinkTransfer, transferCandidates, transferSuggestions } from '../lib/transfer-matching.ts';
import { spendingPlan } from '../lib/spending-plan.ts';
import { spendingInsights } from '../lib/spending-insights.ts';
import { mergeBudgets } from '../lib/budget-merge.ts';
const today='2026-10-27';
const account=(id,type='current',openingDate='2026-09-01')=>({id,name:`Compte ${id}`,type,bank:'QA',openingBalance:100000,openingDate,color:'#335cff'});
const tx=(id,amount=-1000,patch={})=>({id,label:`QA ${id}`,amount,date:'2026-10-10',accountId:'a',category:'Autres',note:'Note conservée',importRef:`REF-${id}`,importBatch:`batch-${id}`,...patch});
const base=()=>({...emptyBudget('QA outils bancaires'),accounts:[account('a'),account('b'),account('s','savings')],transactions:[tx('one'),tx('two',-2000)]});

test('reconciliation compares the booked ledger, excluding future and historical balance-included rows',async()=>{
 const b=base();b.transactions.push(tx('historic',-50000,{date:'2026-08-31',balanceIncluded:true}),tx('future',-9000,{date:'2026-11-01'}));
 const rows=reconciliationRows(b,'a',today);assert.deepEqual(rows.map(t=>t.id).sort(),['one','two']);assert.equal(accountBalance(b,'a',today),97000);
 await assert.rejects(confirmReconciliation(b,'a',today,97001,new Set(['one','two'])),/écart doit être nul/);
 await assert.rejects(confirmReconciliation(b,'a',today,97000,new Set(['one'])),/Pointez toutes/);
 const confirmed=await confirmReconciliation(b,'a',today,97000,new Set(['one','two']));const last=latestReconciliation(confirmed.accounts[0]);assert.equal(last.bankBalance,97000);assert.equal(last.fingerprint.length,64);assert.equal(last.fingerprint,await ledgerFingerprint(b,'a',today));assert.deepEqual(confirmed.transactions,b.transactions);assert.equal(b.accounts[0].reconciliations,undefined);assert.deepEqual(budgetSchema.parse(JSON.parse(JSON.stringify(confirmed))),confirmed);
});
test('a reconciliation fingerprint detects cancelling financial edits but ignores notes/categories and transfer association',async()=>{
 const b=base(),fingerprint=await ledgerFingerprint(b,'a',today),annotated=structuredClone(b);assert.equal(await ledgerFingerprint({...b,transactions:[...b.transactions].reverse()},'a',today),fingerprint);annotated.transactions[0].note='Autre note';annotated.transactions[0].category='Restaurants';assert.equal(await ledgerFingerprint(annotated,'a',today),fingerprint);
 annotated.transactions[0].amount-=100;annotated.transactions[1].amount+=100;assert.equal(accountBalance(annotated,'a',today),accountBalance(b,'a',today));assert.notEqual(await ledgerFingerprint(annotated,'a',today),fingerprint);
 const paired=base();paired.transactions.push(tx('credit',1000,{accountId:'b'}));assert.equal(await ledgerFingerprint(linkTransfer(paired,'one','credit','linked'),'a',today),await ledgerFingerprint(paired,'a',today));
});
test('reconciliation history retains the latest fifty confirmations and rejects out-of-range dates',async()=>{
 let b=base();for(let i=0;i<52;i++)b=await confirmReconciliation(b,'a',today,97000,new Set(['one','two']));assert.equal(b.accounts[0].reconciliations.length,50);
 for(const date of ['2026-08-31','2026-02-30','2099-01-01',''])assert.throws(()=>reconciliationRows(b,'a',date));
 assert.throws(()=>reconciliationRows(b,'missing',today),/introuvable/);
});
test('possible duplicates and exact gap explanations are hints, never automatic mutations',()=>{
 const b=base();b.transactions=[tx('one',-1000,{label:'QA doublon'}),tx('two',-1000,{label:'QA doublon'})];const before=structuredClone(b);const hints=reconciliationHints(b.transactions,1000);assert.equal(hints.get('one').length,2);assert.deepEqual(b,before);
});
test('bulk changes are atomic, keep import metadata and show per-account financial impact',()=>{
 const b=base(),before=structuredClone(b);const result=buildBulkEdit(b,new Set(['one','two']),{category:'Restaurants',accountId:'b'},today);
 assert.deepEqual(b,before);assert.equal(result.changed.length,2);assert.equal(result.budget.transactions[0].importRef,'REF-one');assert.equal(result.budget.transactions[0].importBatch,'batch-one');assert.equal(result.budget.transactions[0].note,'Note conservée');assert.equal(result.budget.transactions[0].date,'2026-10-10');assert.equal(result.budget.transactions[0].amount,-1000);assert.equal(accountBalance(result.budget,'a',today),100000);assert.equal(accountBalance(result.budget,'b',today),97000);assert.equal(result.impacts.length,2);
});
test('bulk account moves reject incompatible reference dates and repeated bank references without partial writes',()=>{
 const b=base();b.accounts[1].openingDate='2026-10-11';assert.throws(()=>buildBulkEdit(b,new Set(['one','two']),{accountId:'b'},today),/incompatible/);assert.equal(b.transactions[0].accountId,'a');
 b.accounts[1].openingDate='2026-09-01';b.transactions.push(tx('collision',-100,{accountId:'b',importRef:'REF-one'}));assert.throws(()=>buildBulkEdit(b,new Set(['one']),{accountId:'b'},today),/Référence bancaire/);
 assert.throws(()=>buildBulkEdit(b,new Set(['missing']),{category:'Shopping'},today),/n’existe plus/);assert.throws(()=>buildBulkEdit(b,new Set(),{category:'Shopping'},today),/Sélectionnez/);
});
test('historical bulk moves preserve balance-included semantics and cannot become new payments',()=>{
 const b=base();b.accounts.forEach(a=>a.openingDate='2026-10-01');b.transactions=[tx('history',-1000,{date:'2026-09-30',balanceIncluded:true})];
 const result=buildBulkEdit(b,new Set(['history']),{accountId:'b'},today);assert.equal(result.budget.transactions[0].balanceIncluded,true);assert(result.impacts.every(x=>x.before===x.after));
 b.accounts[1].openingDate='2026-09-01';assert.throws(()=>buildBulkEdit(b,new Set(['history']),{accountId:'b'},today),/incompatible/);
});
test('bulk excludes linked transfers/goals but can change a recurring instance without rewriting its rule',()=>{
 const b=base();assert.equal(bulkEditable({...b.transactions[0],transferId:'t'}),false);assert.equal(bulkEditable({...b.transactions[0],goalId:'g'}),false);
 b.transactions[0].ruleId='r';const result=buildBulkEdit(b,new Set(['one']),{category:'Shopping'},today);assert.equal(result.recurringCount,1);assert.equal(result.budget.transactions[0].ruleId,'r');assert.deepEqual(result.budget.rules,b.rules);
});
test('moving operations invalidates an earlier reconciliation, including a net zero move',async()=>{
 const b=base();b.transactions=[tx('out',-1000),tx('refund',1000)];const confirmed=await confirmReconciliation(b,'a',today,100000,new Set(['out','refund']));const result=buildBulkEdit(confirmed,new Set(['out','refund']),{accountId:'b'},today);assert.equal(result.reconciledAccounts[0],'Compte a');assert.notEqual(await ledgerFingerprint(result.budget,'a',today),latestReconciliation(confirmed.accounts[0]).fingerprint);
});
test('transfer suggestions require distinct accounts, exact opposite amounts and the requested day window, keeping ambiguity',()=>{
 const b=base();b.transactions=[tx('out',-1000),tx('c1',1000,{accountId:'b',date:'2026-10-11'}),tx('c2',1000,{accountId:'s',date:'2026-10-13'}),tx('same',1000),tx('wrong',1001,{accountId:'b'})];
 assert.equal(transferSuggestions(b,3)[0].candidateCount,2);assert.equal(transferSuggestions(b,0).length,0);assert.deepEqual(transferCandidates(b,'out',1).map(t=>t.id),['c1']);assert.equal(b.transactions.some(t=>t.transferId),false);
 b.transactions[1].importBatch=undefined;assert.equal(transferSuggestions(b,1).length,0);assert.equal(transferCandidates(b,'out',null).length,2);
});
test('link/unlink preserve both account balances, original fields, dates and exact categories',()=>{
 const b=base();b.transactions=[tx('out',-1000,{category:'Shopping'}),tx('credit',1000,{accountId:'b',date:'2026-10-12',category:'Autres revenus'})];const balances=b.accounts.map(a=>accountBalance(b,a.id,today));const linked=linkTransfer(b,'out','credit','pair');assert.deepEqual(linked.accounts.map(a=>accountBalance(linked,a.id,today)),balances);assert.equal(overview(linked,today).spent,0);assert.equal(overview(linked,today).income,0);assert.equal(linked.transactions[1].date,'2026-10-12');assert.equal(linked.transactions[0].importRef,'REF-out');assert.equal(linked.transactions[1].note,'Note conservée');assert.deepEqual(budgetSchema.parse(linked),linked);assert.deepEqual(unlinkTransfer(linked,'pair'),b);
});
test('cross-month current-to-savings transfers count savings once on the savings booking date',()=>{
 const b=base();b.transactions=[tx('out',-10000,{date:'2026-09-30'}),tx('credit',10000,{accountId:'s',date:'2026-10-01'})];const linked=linkTransfer(b,'out','credit','pair');assert.equal(spendingPlan(linked,'2026-09',today).actual.amounts.savings,0);assert.equal(spendingPlan(linked,'2026-10',today).actual.amounts.savings,10000);assert.equal(spendingPlan(linked,'2026-10',today).actualIncome,0);assert.equal(spendingInsights(linked,'2026-10',today).current.total,0);
});
test('wrong amounts, same account, already linked and recurrent transactions cannot be associated',()=>{
 for(const patch of [{amount:999},{accountId:'a'},{ruleId:'r'},{goalId:'g'},{transferId:'existing'}]){const b=base();b.transactions=[tx('out',-1000),tx('credit',1000,{accountId:'b',...patch})];assert.throws(()=>linkTransfer(b,'out','credit','pair'));assert.equal(b.transactions[0].transferId,undefined);}
});
test('server validation rejects partial or unbalanced transfer pairs, including an invalid conflict resolution',()=>{
 const b=base();b.transactions=[tx('out',-1000),tx('credit',1000,{accountId:'b'})];const linked=linkTransfer(b,'out','credit','pair');assert.equal(budgetSchema.safeParse({...linked,transactions:linked.transactions.slice(0,1)}).success,false);
 const remote=structuredClone(b);remote.transactions[1].amount=900;const merged=mergeBudgets(b,linked,remote,{'transactions:credit':'remote'});assert.equal(budgetSchema.safeParse(merged.budget).success,false);
});
test('the latest reconciliation uses actual timestamps and prefers the last appended record on ties',()=>{
 const a=account('a');const record=(confirmedAt,bankBalance)=>({date:'2026-10-20',bankBalance,fingerprint:'a'.repeat(64),confirmedAt});
 a.reconciliations=[record('2026-10-27T10:00:00Z',100),record('2026-10-27T10:00:00.123Z',200)];assert.equal(latestReconciliation(a).bankBalance,200);
 a.reconciliations.push(record('2026-10-27T10:00:00.123Z',300));assert.equal(latestReconciliation(a).bankBalance,300);
});
