import test from 'node:test';
import assert from 'node:assert/strict';
import {demoBudget,overview} from '../lib/budget.ts';
import {reserveLines,roundedAxis} from '../lib/budget-presentation.ts';
test('explanatory reserves sum to the existing canonical total and never modify the budget',()=>{const today='2026-10-31',b=demoBudget(today);b.settings.reserve=5000;b.transactions.push({id:'contribution',label:'Projet',amount:10000,date:'2026-10-05',accountId:'demo-s',category:'Virement',note:'',goalId:'demo-g1'});const snapshot=structuredClone(b),rows=reserveLines(b,today);assert.equal(rows.reduce((n,r)=>n+r.amount,0),overview(b,today).reserve);assert.equal(rows.find(r=>r.id==='demo-g1').amount,5000);assert.deepEqual(b,snapshot);});
test('axis labels are rounded, ordered and bound positive, negative and mixed projections',()=>{for(const [a,b] of [[0,457400],[-100400,457400],[-900000,0],[0,11500],[-1e12,1e12]]){const axis=roundedAxis(a,b);assert(axis.min<=a&&axis.max>=b);assert(axis.step>=100);assert.equal(axis.ticks[0],axis.max);assert.equal(axis.ticks.at(-1),axis.min);assert(axis.ticks.length<=8);assert(axis.ticks.every((n,i)=>!i||axis.ticks[i-1]-n===axis.step));}});
