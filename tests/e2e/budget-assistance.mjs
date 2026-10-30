import { revealLedgerTools } from './ui-helpers.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { todayISO, parseDate, dateISO, overview, demoBudget } from '../../lib/budget.ts';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin;
const output='outputs/budget-assistance';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PECULE_E2E_CHROMIUM||'/usr/bin/chromium',args:process.env.PECULE_E2E_NO_SANDBOX==='1'?['--no-sandbox']:[]});
const report={origin,checks:[],personalAccounts:false};
try{
 for(const mobile of [false,true])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(theme=>localStorage.setItem('pecule-theme',theme),theme);
  if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const req=route.request(),res=await fetch(req.url(),{method:req.method(),headers:req.headers(),body:req.postDataBuffer()||undefined,redirect:'manual'});const headers=Object.fromEntries(res.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];const cookies=res.headers.getSetCookie();if(cookies.length)headers['set-cookie']=cookies.join('\n');await route.fulfill({status:res.status,headers,body:Buffer.from(await res.arrayBuffer())});});
  const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT'&&r.url().endsWith('/api/budget'))writes.push('unexpected write');});
  await page.goto(origin);await page.locator('.clarte-budget').waitFor();
  const nav=page.getByRole('navigation',{name:mobile?'Navigation mobile':'Navigation principale'});
  async function go(name){if(mobile&&name==='Récurrences'){await nav.getByRole('button',{name:'Plus',exact:true}).click();await page.getByRole('navigation',{name:'Navigation complémentaire'}).getByRole('button',{name:/^Récurrences/}).click();}else await nav.getByRole('button',{name,exact:true}).click();}
  async function add(){await go('Opérations');await page.getByRole('button',{name:'Nouvelle opération',exact:true}).click();}
  await add();await page.locator('input[name="label"]').fill('QA marchand mémorisé');await page.locator('input[name="amount"]').fill('12.34');await page.locator('select[name="category"]').selectOption('Loisirs');await page.locator('input[name="rememberCategory"]').check();await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  await add();await page.locator('input[name="label"]').fill('QA marchand mémorisé');assert.equal(await page.locator('select[name="category"]').inputValue(),'Loisirs');await page.getByRole('button',{name:'Fermer',exact:true}).click();
  await revealLedgerTools(page);await page.getByRole('button',{name:'Importer',exact:true}).click();
  const today=todayISO(),date=parseDate(today);const prior=Array.from({length:3},(_,i)=>dateISO(new Date(date.getFullYear(),date.getMonth()-3+i,15,12)));
  await page.locator('input[type=file]').setInputFiles({name:'qa-recurrence.csv',mimeType:'text/csv',buffer:Buffer.from('Date;Libellé;Montant\n'+prior.map(d=>`${d};QA abonnement stable;-9,99`).join('\n')+'\n')});
  await page.locator('select[name="bank-balance-mode"]').selectOption('history');await page.getByRole('button',{name:'Vérifier 3 opérations',exact:false}).click();await page.locator('.bank-import-confirm input').check();await page.getByRole('button',{name:'Importer 3 opérations',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  await go('Récurrences');const suggestions=page.locator('.recurring-suggestions');await suggestions.getByText('QA abonnement stable',{exact:true}).waitFor();await suggestions.getByRole('button',{name:'Vérifier',exact:true}).click();assert.equal(await page.locator('input[name="label"]').inputValue(),'QA abonnement stable');assert.equal(await page.locator('select[name="frequency"]').inputValue(),'monthly');assert((await page.locator('input[name="date"]').inputValue())>today);
  await page.getByRole('button',{name:'Enregistrer la récurrence',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await page.locator('.recurring-suggestions').count(),0);assert.equal(await page.locator('.rule-card').filter({hasText:'QA abonnement stable'}).count(),1);
  if(mobile)await page.getByRole('button',{name:'Réglages',exact:true}).click();else await page.locator('.sidebar').getByRole('button',{name:'Réglages',exact:true}).click();
  await page.locator('input[name="dailyComfort"]').fill(String(Math.ceil(Math.max(0,overview(demoBudget(todayISO()),todayISO()).available)/100)+1));await page.getByRole('button',{name:'Enregistrer mon seuil quotidien',exact:true}).click();
  await page.locator('select[name="limitCategory"]').selectOption('Restaurants');await page.locator('input[name="limitAmount"]').fill('1');await page.getByRole('button',{name:'Enregistrer le seuil de catégorie',exact:true}).click();
  assert.match(await page.locator('.settings-card').filter({has:page.getByRole('heading',{name:'Mes règles de catégories',exact:true})}).textContent(),/QA marchand mémorisé/);
  await go(mobile?'Accueil':'Vue d’ensemble');assert.equal(await page.locator('.clarte-budget').getAttribute('data-budget-tone'),'attention');await page.locator('.budget-alerts').getByText(/1 seuil de catégorie atteint/).waitFor();
  await page.locator('.clarte-header-actions').getByRole('button',{name:'Masquer les montants'}).click();assert.equal(await page.locator('.budget-alerts').count(),0);assert.equal(await page.locator('.budget-signal').count(),0);
  await go('Opérations');await page.locator('.spending-insights > summary').click();assert.equal(await page.locator('.insight-totals dd').first().innerText(),'•••• €');assert(await page.locator('.insight-track > span').evaluateAll(nodes=>nodes.every(n=>n.style.width==='0%')));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-${theme}-masked.png`});
  await go(mobile?'Accueil':'Vue d’ensemble');await page.locator('.clarte-header-actions').getByRole('button',{name:'Afficher les montants'}).click();await page.locator('.budget-alerts').getByRole('button',{name:'Voir mes dépenses'}).click();await page.locator('.spending-insights > summary').click();assert.equal(await page.locator('.insight-list').last().locator('li').count(),6);assert(await page.locator('.spending-insights').evaluate(element=>parseFloat(getComputedStyle(element).paddingLeft)>=20));await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-${theme}-analysis.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);report.checks.push({mobile,theme,rememberCategory:'passed',recurrenceProposal:'passed',customThresholds:'passed',analysis:'passed',privacy:'passed',serverWrites:0});await context.close();console.log(`PASS: ${mobile?'mobile':'desktop'} ${theme}, saved category, recurrence review, analysis and private alerts`);
 }
 report.status='passed';
}finally{await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));await browser.close();}
