import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBudget } from '../lib/budget.ts';
import { rememberCategory, preferredCategory } from '../lib/category-rules.ts';
import { recurringSuggestions } from '../lib/recurring-suggestions.ts';
import { spendingInsights, spendingAlerts } from '../lib/spending-insights.ts';
import { budgetSchema } from '../lib/validation.ts';
import { getAvailableSignal } from '../lib/available-signal.ts';
import { detectColumns, previewBankImport } from '../lib/bank-import.ts';
const account={id:'a',name:'Compte QA',bank:'',type:'current',openingBalance:100000,openingDate:'2026-10-01',color:'#335cff'};
const t=(id,date,amount=-999,extra={})=>({id,date,amount,label:'QA service régulier',accountId:'a',category:'Abonnements',note:'',...extra});
const fixture=()=>({...emptyBudget('QA'),accounts:[account],transactions:[]});
test('remembered categories recognize brands, respect direction and replace an existing rule without touching history',()=>{
 let rules=rememberCategory([], 'SPOTIFY FR',undefined,false,'Loisirs');assert.equal(preferredCategory(rules,'Spotify',undefined,false),'Loisirs');assert.equal(preferredCategory(rules,'Spotify',undefined,true),undefined);
 rules=rememberCategory(rules,'Spotify',undefined,false,'Abonnements');assert.equal(rules.length,1);assert.equal(rules[0].category,'Abonnements');assert.equal(preferredCategory(rules,'Autre service',undefined,false),undefined);
 const b=fixture();b.settings.categoryRules=rules;b.transactions=[t('old','2026-10-02',-999,{category:'Loisirs'})];assert.equal(budgetSchema.parse(b).transactions[0].category,'Loisirs');
 const labelRules=rememberCategory([],'  Café QA  ', 'none',false,'Restaurants');assert.equal(preferredCategory(labelRules,'cafe qa','none',false),'Restaurants');assert.equal(preferredCategory(labelRules,'cafe qa different','none',false),undefined);
});
test('CSV bank categories take priority; saved rules apply only to missing categories',()=>{
 const b=fixture();b.settings.categoryRules=rememberCategory([],'Spotify',undefined,false,'Loisirs');
 for(const [source,expected] of [['','Loisirs'],['Abonnements','Abonnements']]){const rows=[['Date','Libellé','Montant','Catégorie'],['2026-10-03','Spotify','-9,99',source]];const plan={rows,header:0,columns:detectColumns(rows[0]),mode:'signed',dateOrder:'dmy',balanceMode:'new',accountId:'a',today:'2026-10-27'};assert.equal(previewBankImport(b,plan)[0].transaction.category,expected);}
});
test('recurrence proposals need three distinct dates, matching amounts and an actual cadence; nothing is created automatically',()=>{
 const b=fixture();b.transactions=[t('j','2026-07-27'),t('a','2026-08-27'),t('s','2026-09-27')];
 const [proposal]=recurringSuggestions(b,'2026-10-27');assert.equal(proposal.rule.frequency,'monthly');assert.equal(proposal.rule.startDate,'2026-11-27');assert.equal(b.rules.length,0);
 assert.equal(recurringSuggestions({...b,transactions:b.transactions.slice(1)},'2026-10-27').length,0);
 assert.equal(recurringSuggestions({...b,transactions:[...b.transactions.slice(0,2),t('bad','2026-09-27',-1199)]},'2026-10-27').length,0);
 assert.equal(recurringSuggestions({...b,rules:[{id:'existing',...proposal.rule,active:false}]},'2026-10-27').length,0);
 assert.equal(recurringSuggestions({...b,transactions:b.transactions.map(x=>({...x,transferId:'linked'}))},'2026-10-27').length,0);
 assert.equal(recurringSuggestions({...b,transactions:b.transactions.map(x=>({...x,date:'2026-09-27'}))},'2026-10-27').length,0);
 assert.equal(recurringSuggestions(b,'2027-01-01').length,0);
});
test('weekly proposals keep future dates and never combine accounts',()=>{
 const b=fixture();b.transactions=['2026-10-05','2026-10-12','2026-10-19'].map((d,i)=>t(String(i),d));
 assert.equal(recurringSuggestions(b,'2026-10-20')[0].rule.startDate,'2026-10-26');
 b.transactions[0].accountId='b';assert.equal(recurringSuggestions(b,'2026-10-20').length,0);
});
test('spending analysis nets refunds, excludes income, savings, transfers and future operations, and crosses a year boundary',()=>{
 const b=fixture();b.transactions=[t('expense','2026-01-10',-5000,{category:'Restaurants'}),t('refund','2026-01-11',1000,{category:'Restaurants'}),t('income','2026-01-12',250000,{category:'Autres'}),t('salary','2026-01-12',250000,{category:'Salaire'}),t('transfer','2026-01-12',-50000,{transferId:'pair'}),t('savings','2026-01-12',-10000,{category:'Épargne'}),t('future','2026-01-30',-999),t('previous','2025-12-10',-2000,{category:'Restaurants'})];
 const result=spendingInsights(b,'2026-01','2026-01-27');assert.equal(result.current.total,4000);assert.equal(result.previous.total,2000);assert.equal(result.difference,2000);assert.equal(result.history.length,6);assert.equal(result.history[0].month,'2025-08');
 b.settings.categoryLimits={Restaurants:4000,Abonnements:100};assert.deepEqual(spendingAlerts(b,'2026-01','2026-01-27'),[{category:'Restaurants',limit:4000,spent:4000}]);
 b.settings.categoryLimits.Restaurants=4001;assert.equal(spendingAlerts(b,'2026-01','2026-01-27').length,0);
});
test('personalized daily thresholds preserve negative priority and exact cents; preference validation rejects invalid settings',()=>{
 assert.equal(getAvailableSignal(1999,2,1000).tone,'attention');assert.equal(getAvailableSignal(2000,2,1000).tone,'comfort');assert.equal(getAvailableSignal(2000,2,1001).tone,'attention');assert.equal(getAvailableSignal(-1,2,1).tone,'negative');
 const b=fixture();b.settings={...b.settings,dailyComfortCents:1234,categoryLimits:{Restaurants:10000},categoryRules:rememberCategory([],'Spotify',undefined,false,'Abonnements')};assert.deepEqual(budgetSchema.parse(b).settings,b.settings);
 for(const patch of [{dailyComfortCents:0},{dailyComfortCents:1.5},{categoryLimits:{Restaurants:-1}},{categoryRules:[...b.settings.categoryRules,...b.settings.categoryRules]}])assert.equal(budgetSchema.safeParse({...b,settings:{...b.settings,...patch}}).success,false);
});
