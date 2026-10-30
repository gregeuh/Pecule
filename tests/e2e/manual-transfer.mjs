import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001',engine=process.env.PECULE_E2E_ENGINE||'chromium',output=process.env.PECULE_E2E_OUTPUT||'outputs/manual-transfer';
await mkdir(output,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const checks=[];
try{for(const width of [390,1440])for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width,height:900},locale:'fr-FR',reducedMotion:'reduce'});
 await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
 if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});
 const page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});
 await page.goto(origin);await page.locator('.clarte-dashboard').waitFor();
 const nav=page.getByRole('navigation',{name:width<760?'Navigation mobile':'Navigation principale'}),dialog=page.getByRole('dialog');
 const accounts=()=>nav.getByRole('button',{name:width<760?'Comptes':'Mes comptes',exact:true}).click();
 const balances=async()=>page.locator('.account-card .account-balance').allTextContents();
 const cents=t=>Math.round(Number(t.replace(/[^\d,−-]/g,'').replace('−','-').replace(',','.'))*100);
 await accounts();const before=(await balances()).map(cents);
 await page.getByRole('button',{name:'Ouvrir les actions',exact:true}).filter({visible:true}).click();
 await dialog.getByRole('button',{name:/Virement entre comptes/}).click();
 const from=page.locator('select[name=from]'),to=page.locator('select[name=to]');assert.notEqual(await from.inputValue(),await to.inputValue());
 const fromId=await from.inputValue(),toId=await to.inputValue(),ids=await from.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
 await page.locator('input[name=amount]').fill('12.34');await to.selectOption(fromId);await dialog.getByRole('button',{name:'Enregistrer le virement',exact:true}).click();await dialog.getByText('Choisissez deux comptes différents.',{exact:true}).waitFor();assert.equal(await page.locator('input[name=amount]').inputValue(),'12.34');
 await to.selectOption(toId);await page.screenshot({path:`${output}/${engine}-${width}-${theme}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await dialog.getByRole('button',{name:'Enregistrer le virement',exact:true}).click();await dialog.waitFor({state:'hidden'});
 const after=(await balances()).map(cents);assert.equal(after[ids.indexOf(fromId)],before[ids.indexOf(fromId)]-1234);assert.equal(after[ids.indexOf(toId)],before[ids.indexOf(toId)]+1234);assert.equal(after.reduce((a,b)=>a+b),before.reduce((a,b)=>a+b));
 await nav.getByRole('button',{name:width<760?'Accueil':'Vue d’ensemble',exact:true}).click();await page.getByRole('button',{name:'Noter une opération',exact:true}).click();await page.locator('input[name=label]').fill('Brouillon conservé');await dialog.getByRole('button',{name:'Virement entre comptes',exact:true}).click();await dialog.getByRole('button',{name:'Annuler',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.getByRole('button',{name:'Noter une opération',exact:true}).click();assert.equal(await page.locator('input[name=label]').inputValue(),'Brouillon conservé');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);checks.push({width,theme,status:'passed',personalBudgets:false});console.log(`PASS ${engine} ${width} ${theme}`);await context.close();
}}finally{await writeFile(`${output}/${engine}-report.json`,JSON.stringify(checks,null,2));await browser.close();}
