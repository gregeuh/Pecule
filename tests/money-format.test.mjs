import test from 'node:test';
import assert from 'node:assert/strict';
import {money} from '../lib/budget.ts';
test('French euro formatting shares grouping, decimal separator and mathematical minus',()=>{assert.equal(money(253706),'2\u202f537,06\u00a0€');assert.equal(money(-188201),'−1\u202f882,01\u00a0€');assert.equal(money(188201,true,true),'+1\u202f882,01\u00a0€');assert.equal(money(-188201,true,true),'−1\u202f882,01\u00a0€');assert.equal(money(0,true,true),'0,00\u00a0€');assert.equal(money(-0),'0,00\u00a0€');assert.equal(money(250000,false),'2\u202f500\u00a0€');});
