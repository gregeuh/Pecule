import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIconUrl } from '../lib/icon-url.ts';
import { demoBudget, materialize } from '../lib/budget.ts';
import { budgetSchema } from '../lib/validation.ts';
import { buildBulkEdit } from '../lib/bulk-transactions.ts';
const today='2026-10-27',url='https://images.example.org/logo.svg';
test('custom icons accept normalized HTTPS image URLs and reject executable, insecure or credential URLs',()=>{
 assert.equal(normalizeIconUrl('  https://IMAGES.example.org/logo.svg  '),url);
 for(const value of ['', '/logo.png','http://example.org/logo.png','javascript:alert(1)','data:image/svg+xml,<svg/>','file:///logo.png','https://user:secret@example.org/a.png','https://example.org/a\nb.png','https://example.org/'+ 'x'.repeat(2048)])assert.equal(normalizeIconUrl(value),null,value);
});
test('canonical budget persistence retains both manual and recurring icon URLs, while rejecting unsafe URLs',()=>{
 const b=demoBudget(today);b.transactions[0].customIconUrl=url;b.rules[0].customIconUrl=url;
 const saved=budgetSchema.parse(JSON.parse(JSON.stringify(b)));assert.equal(saved.transactions[0].customIconUrl,url);assert.equal(saved.rules[0].customIconUrl,url);
 for(const value of ['http://example.org/logo.png','javascript:alert(1)','https://user:secret@example.org/logo.png']){
  const invalid=structuredClone(b);invalid.transactions[0].customIconUrl=value;assert.equal(budgetSchema.safeParse(invalid).success,false);
  invalid.transactions[0].customIconUrl=url;invalid.rules[0].customIconUrl=value;assert.equal(budgetSchema.safeParse(invalid).success,false);
 }
});
test('recurring materialization carries a manual icon to its booked operation without changing money',()=>{
 const b=demoBudget(today);const r=b.rules[0];r.startDate=today;r.timing='date';r.day=27;r.customIconUrl=url;r.active=true;r.excludedDates=[];b.accounts.find(a=>a.id===r.accountId).openingDate='2026-10-01';
 const row=materialize(b,today).transactions.find(t=>t.ruleId===r.id&&t.date===today);assert(row);assert.equal(row.customIconUrl,url);assert.equal(row.amount,r.amount);
});
test('bulk correction preserves a manually chosen image alongside bank metadata',()=>{
 const b=demoBudget(today),t=b.transactions[0];t.customIconUrl=url;t.importRef='QA-ICON';t.importBatch='qa';const result=buildBulkEdit(b,new Set([t.id]),{category:'Shopping'},today);const row=result.budget.transactions.find(x=>x.id===t.id);assert.equal(row.customIconUrl,url);assert.equal(row.importRef,'QA-ICON');assert.equal(row.amount,t.amount);
});
