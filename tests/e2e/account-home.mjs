import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {revealHomeDetails} from './ui-helpers.mjs';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin;
const engine=process.env.PECULE_E2E_ENGINE==='webkit'?'webkit':'chromium';
const output=process.env.PECULE_E2E_OUTPUT||'outputs/account-home';await mkdir(output,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const report={origin,engine,checks:[],personalAccounts:false};
try{
 for(const width of(process.env.PECULE_E2E_QUICK==='1'?[390,1440]:[320,390,1440]))for(const theme of['light','dark']){
  const mobile=width<=760,c=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile,locale:'fr-FR',reducedMotion:'reduce'});
  if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await c.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];const cookies=r.headers.getSetCookie();if(cookies.length)headers['set-cookie']=cookies.join('\n');await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});
  await c.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
  const p=await c.newPage(),errors=[],writes=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});await p.goto(origin);await p.locator('.clarte-accounts-primary').waitFor();await p.evaluate(()=>document.fonts.ready);
  const section=p.getByRole('region',{name:'Soldes de vos comptes'});
  const balances=()=>section.locator('.clarte-account').evaluateAll(ns=>ns.map(n=>({name:n.querySelector('strong').textContent,amount:n.querySelector('b').textContent})));
  const nav=p.getByRole('navigation',{name:mobile?'Navigation mobile':'Navigation principale'});
  async function home(){await nav.getByRole('button',{name:mobile?'Accueil':'Vue d’ensemble',exact:true}).click();await section.waitFor();}
  async function accounts(){await nav.getByRole('button',{name:mobile?'Comptes':'Mes comptes',exact:true}).click();await p.locator('.account-card').first().waitFor();}
  async function close(){await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});}
  async function bounds(){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await section.locator('.clarte-account').evaluateAll(ns=>ns.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.height>=44;})));}
  assert.equal(await section.count(),1);assert.equal(await p.locator('.clarte-accounts').count(),1);assert.equal(await p.locator(mobile?'.clarte-mobile-primary > :first-child':'.clarte-main > :first-child').getAttribute('aria-label'),'Soldes de vos comptes');
  const initial=await balances();assert.equal(initial.length,2);assert(await section.getByText('Épargne',{exact:true}).isVisible());assert.equal(await p.locator('.clarte-budget').isVisible(),!mobile);await bounds();await p.screenshot({path:`${output}/${engine}-${width}-${theme}-home.png`});
  await p.getByRole('button',{name:'Masquer les montants',exact:true}).click();assert(await section.locator('.clarte-account > b').evaluateAll(ns=>ns.every(n=>n.textContent==='•••• €')));assert.equal(await section.locator('.clarte-accounts-total > strong').innerText(),'•••• €');await p.getByRole('button',{name:'Afficher les montants',exact:true}).click();assert.deepEqual(await balances(),initial);
  await section.locator('.clarte-account').first().click();assert.equal(await p.locator('input[name=name]').inputValue(),initial[0].name);await close();assert(await section.locator('.clarte-account').first().evaluate(n=>n===document.activeElement));
  await accounts();const detailed=await p.locator('.account-card').evaluateAll(ns=>ns.map(n=>({name:n.querySelector('h3').textContent,amount:n.querySelector('.account-balance').textContent})));assert.deepEqual(initial,detailed,'Home and account page must show the same current balances');await home();await revealHomeDetails(p);assert(await p.getByRole('button',{name:mobile?'Comprendre mon disponible':'Comprendre le calcul du disponible',exact:true}).isVisible());
  // A new cash account exercises a zero balance and a long label in the real form.
  await section.getByRole('button',{name:'Ajouter un compte',exact:true}).click();const longName='Espèces personnelles avec un nom volontairement long pour vérifier le retour à la ligne';await p.locator('input[name=name]').fill(longName);await p.locator('select[name=type]').selectOption('cash');await p.locator('input[name=balance]').fill('0');await p.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});assert.equal((await balances()).length,3);assert.match((await balances()).find(a=>a.name===longName).amount,/0,00/);await bounds();
  // Future entries must not change the balance leading the home screen.
  const before=await balances();await p.locator(mobile?'.mobile-add':'.floating-action-trigger').click();await p.getByRole('button',{name:/Une dépense/}).click();await p.locator('input[name=label]').fill('QA échéance future');await p.locator('input[name=amount]').fill('33.50');const date=p.locator('input[name=date]');const next=new Date((await date.inputValue())+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);await date.fill(next.toISOString().slice(0,10));await p.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});assert.deepEqual(await balances(),before);
  await section.locator('.clarte-account').filter({hasText:longName}).click();await p.locator('input[name=balance]').fill('-999999999.99');await p.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});await bounds();await p.screenshot({path:`${output}/${engine}-${width}-${theme}-long-negative.png`});
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const a11y=await p.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(a11y.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);report.checks.push({width,theme,status:'passed',serverWrites:0});await c.close();console.log(`PASS ${engine} ${width} ${theme}: account-first, matching balances, privacy, cash/zero, future exclusion, negative long amounts, focus, accessibility`);
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=e.message;throw e;}finally{await writeFile(`${output}/${engine}-report.json`,JSON.stringify(report,null,2));await browser.close();}
