import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBudget, accountBalance } from '../lib/budget.ts';
import { mergeBudgets } from '../lib/budget-merge.ts';
import { importBatches, removeImportBatch } from '../lib/import-batches.ts';
import { budgetSchema } from '../lib/validation.ts';
const account={id:'a',name:'Compte QA',bank:'',type:'current',openingBalance:100000,openingDate:'2026-10-01',color:'#335cff'};
const transaction=(id,patch={})=>({id,label:`Opération ${id}`,amount:-500,date:'2026-10-10',accountId:'a',category:'Autres',note:'',...patch});
const fixture=()=>({...emptyBudget('QA'),accounts:[{...account}],transactions:[transaction('one'),transaction('two')]});
test('independent financial edits from two devices survive reconciliation',()=>{
 const base=fixture(),local=structuredClone(base),remote=structuredClone(base);
 local.transactions[0].amount=-800;remote.transactions[1].amount=-1200;remote.name='À jour';
 const result=mergeBudgets(base,local,remote);
 assert.deepEqual(result.conflicts,[]);assert.deepEqual(result.budget.transactions.map(t=>t.amount),[-800,-1200]);assert.equal(result.budget.name,'À jour');assert(budgetSchema.safeParse(result.budget).success);
});
test('same entity stays atomic and requires explicit choice, including delete versus edit',()=>{
 const base=fixture(),local=structuredClone(base),remote=structuredClone(base);local.transactions[0].amount=-700;remote.transactions[0].note='Autre appareil';
 const initial=mergeBudgets(base,local,remote);assert.equal(initial.conflicts.length,1);
 assert.deepEqual(mergeBudgets(base,local,remote,{'transactions:one':'local'}).budget.transactions[0],local.transactions[0]);
 local.transactions.shift();const deleted=mergeBudgets(base,local,remote);assert.equal(deleted.conflicts.length,1);assert.equal(mergeBudgets(base,local,remote,{'transactions:one':'local'}).budget.transactions.length,1);
 assert.equal(mergeBudgets(base,local,remote,{'transactions:one':'remote'}).budget.transactions.length,2);
});
test('same change, independent insertion, and repeated reconciliation never duplicate an operation',()=>{
 const base=fixture(),local=structuredClone(base),remote=structuredClone(base);local.transactions.push(transaction('new'));remote.transactions.push(transaction('other'));remote.transactions[0].note='Même note';local.transactions[0].note='Même note';
 const first=mergeBudgets(base,local,remote);assert.equal(first.conflicts.length,0);assert.equal(first.budget.transactions.length,4);
 assert.deepEqual(mergeBudgets(remote,first.budget,first.budget).budget,first.budget);
});
test('cross-entity invalid choices are caught by canonical validation',()=>{
 const base=fixture(),local=structuredClone(base),remote=structuredClone(base);local.accounts=[];local.transactions=[];remote.transactions.push(transaction('new'));
 assert.equal(budgetSchema.safeParse(mergeBudgets(base,local,remote).budget).success,false);
});
test('undo batch removes its edited rows, preserves unrelated rows and opening balances, and supports history',()=>{
 const b=fixture();b.transactions[0].importBatch='batch';b.transactions[0].note='Modifiée depuis';b.transactions.push(transaction('history',{importBatch:'batch',date:'2026-09-10',balanceIncluded:true}));
 assert.deepEqual(importBatches(b).map(x=>({count:x.count,impact:x.impact})),[{count:2,impact:-500}]);
 const undone=removeImportBatch(b,'batch');assert.equal(undone.transactions.length,1);assert.equal(undone.transactions[0].id,'two');assert.deepEqual(undone.accounts,b.accounts);assert.equal(accountBalance(undone,'a','2026-10-27')-accountBalance(b,'a','2026-10-27'),500);assert(budgetSchema.safeParse(undone).success);
 assert.deepEqual(removeImportBatch(undone,'batch'),undone);
});
test('linked financial operations prevent partial batch deletion',()=>{
 for(const field of ['transferId','goalId','ruleId']){const b=fixture();b.transactions[0].importBatch='batch';b.transactions[0][field]='linked';assert.throws(()=>removeImportBatch(b,'batch'),/liées/);assert.equal(b.transactions.length,2);}
});
