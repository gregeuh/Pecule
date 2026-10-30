import test from 'node:test';import assert from 'node:assert/strict';
import {recordedOperationTotals} from '../lib/operation-totals.ts';
const tx=(amount,date='2026-10-10',extra={})=>({id:crypto.randomUUID(),label:'QA',amount,date,accountId:'a',category:'Autres',note:'',...extra});
test('filtered totals exclude future payments and both sides of a transfer',()=>{
 const rows=[tx(200000),tx(-3456),tx(-90000,'2026-10-11'),tx(50000,'2026-10-10',{transferId:'t'}),tx(-50000,'2026-10-10',{transferId:'t'})];
 assert.deepEqual(recordedOperationTotals(rows,'2026-10-10'),{income:200000,spent:3456});
});
test('empty results and a selected sub-list have independent totals without changing the ledger',()=>{
 const rows=[tx(-400),tx(-600),tx(1000)];const before=structuredClone(rows);
 assert.deepEqual(recordedOperationTotals([],'2026-10-10'),{income:0,spent:0});
 assert.deepEqual(recordedOperationTotals(rows.slice(0,1),'2026-10-10'),{income:0,spent:400});assert.deepEqual(rows,before);
});
