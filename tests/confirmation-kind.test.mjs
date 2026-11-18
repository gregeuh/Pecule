import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationKind } from '../lib/confirmation-kind.ts';
const before={goals:[{id:'project',saved:500,target:1000}]};
const reached={goals:[{id:'project',saved:1000,target:1000}]};
test('only an explicit project action celebrates a newly reached goal',()=>{
  for(const context of ['goal','contribution','transfer'])assert.equal(confirmationKind(context,before,reached),'goal');
  assert.equal(confirmationKind('goal',reached,reached),'savings');
  assert.equal(confirmationKind('goal',{goals:[]},reached),'savings');
});
test('restoration and delete confirmations never announce a goal milestone',()=>{
  assert.equal(confirmationKind('confirm',before,reached),'confirmation');
});
test('transfers distinguish an ordinary operation from an explicit project update',()=>{
  assert.equal(confirmationKind('transfer',before,before),'operation');
  assert.equal(confirmationKind('transfer',before,{goals:[{id:'project',saved:700,target:1000}]}),'savings');
});
test('the illustration follows the submitted workflow rather than changing budget values',()=>{
  assert.equal(confirmationKind('transaction',before,reached),'operation');
  assert.equal(confirmationKind('rule',before,reached),'recurrence');
  assert.equal(confirmationKind('import',before,reached),'import');
  assert.equal(confirmationKind(undefined,before,before),'settings');
});

test('inline recurrence and operation actions retain their own illustration without a dialog',()=>{
  assert.equal(confirmationKind(undefined,{...before,rules:[{enabled:true}]},{...before,rules:[{enabled:false}]}),'recurrence');
  assert.equal(confirmationKind(undefined,{...before,transactions:[]},{...before,transactions:[{id:'recorded'}]}),'operation');
  assert.equal(confirmationKind(undefined,before,reached),'savings');
});
