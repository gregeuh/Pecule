import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('outputs/motion-proposals',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of [390,1440])for(const reduced of [false,true]){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:reduced?'reduce':'no-preference'}),p=await context.newPage();
 await context.addInitScript(theme=>localStorage.setItem('pecule-theme',theme),width===390?'light':'dark');
 const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/budget',r=>{assert.notEqual(r.request().method(),'PUT');return r.continue();});
 await p.goto(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001');await p.locator('.clarte-dashboard').waitFor();await p.waitForTimeout(800);
 await p.getByRole('navigation',{name:width===390?'Navigation mobile':'Navigation principale'}).getByRole('button',{name:'Opérations',exact:true}).click();
 await p.getByRole('textbox',{name:'Rechercher une opération'}).fill('QA continuité');await p.locator('.transactions-card').scrollIntoViewIfNeeded();
 await p.locator(width===390?'.mobile-add':'.floating-action-trigger').click();await p.getByRole('button',{name:/Une dépense/}).click();await p.locator('input[name=amount]').fill('12.34');await p.locator('input[name=label]').fill('QA continuité');
 await p.evaluate(()=>{window.__flights=0;new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n instanceof Element&&n.matches('.operation-flight'))window.__flights++;}).observe(document.body,{childList:true});});
 await p.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await p.locator('[data-operation-id]').filter({hasText:'QA continuité'}).count(),1);
 await p.waitForTimeout(500);console.log(width,reduced,await p.evaluate(()=>window.__flights));
 await p.locator(width===390?'.mobile-add':'.floating-action-trigger').click();await p.getByRole('button',{name:/Une dépense/}).click();await p.getByRole('button',{name:'Virement entre comptes',exact:true}).click();await p.locator('.transfer-account').first().waitFor();
 assert.equal(await p.locator('.transfer-account').count(),2);await p.getByRole('button',{name:'Fermer la notification',exact:true}).click();await p.locator('input[name=amount]').fill('10');
 await p.screenshot({path:`outputs/motion-proposals/implementation-${width}-${reduced}.png`});
 await p.getByRole('button',{name:'Enregistrer le virement',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});await p.waitForTimeout(550);assert.equal(await p.evaluate(()=>window.__flights),reduced?0:1);assert.equal(await p.locator('.operation-flight').count(),0);assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close();
}
await browser.close();console.log('Operation, transfer, reduced motion, cleanup, mobile overflow: passed');
