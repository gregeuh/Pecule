import { revealHomeDetails } from './ui-helpers.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin;
const engine=process.env.PECULE_E2E_ENGINE==='webkit'?'webkit':'chromium',output='outputs/menu-motion';await mkdir(output,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const report={origin,engine,checks:[],personalAccounts:false};
async function routeOrigin(context){if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];const c=r.headers.getSetCookie();if(c.length)headers['set-cookie']=c.join('\n');await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});}
try{
 const scenarios=process.env.PECULE_E2E_QUICK==='1'?[{width:390,theme:'dark',reduced:false},{width:390,theme:'dark',reduced:true}]:[...[390,1440].flatMap(width=>['light','dark'].map(theme=>({width,theme,reduced:false}))),{width:390,theme:'dark',reduced:true}];
 for(const {width,theme,reduced} of scenarios){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,reducedMotion:reduced?'reduce':'no-preference'});await routeOrigin(context);await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
  const page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});await page.goto(origin);await page.locator('.clarte-budget').waitFor();
  const add=page.locator(width===390?'.mobile-add':'.floating-action-trigger'),dialog=page.getByRole('dialog');
  await add.click();await dialog.waitFor();const panel=await dialog.elementHandle(),shade=await page.locator('.modal-backdrop').elementHandle();
  await page.getByRole('button',{name:/Une dépense/}).dispatchEvent('click');await page.getByRole('heading',{name:'Ajouter une opération',exact:true}).waitFor();
  assert(await panel.evaluate(e=>e===document.querySelector('[role=dialog]')),'Keep the same surface between menu and form');assert(await shade.evaluate(e=>e===document.querySelector('.modal-backdrop')),'Keep one backdrop');
  if(!reduced&&width===390){await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.getAttribute('data-motion')==='idle');await page.emulateMedia({reducedMotion:'no-preference'});}
  await page.locator('input[name=label]').fill('QA transition sans enregistrement');await page.locator('input[name=amount]').fill('12.34');
  await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.getAttribute('data-motion')==='idle');
  assert.equal(await page.locator('input[name=label]').inputValue(),'QA transition sans enregistrement');
  const details=page.locator('.brand-picker');await details.locator(':scope > summary').click();await page.waitForFunction(()=>document.querySelector('.brand-picker')?.open);await details.locator(':scope > summary').dispatchEvent('click');await details.locator(':scope > summary').dispatchEvent('click');await details.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));assert(await details.evaluate(e=>e.open));
  await page.screenshot({path:`${output}/${engine}-${width}-${theme}-${reduced?'reduced':'motion'}.png`});
  await page.getByRole('button',{name:'Fermer',exact:true}).dispatchEvent('click');
  if(!reduced){await dialog.locator('form').evaluate(e=>e.requestSubmit());}
  await dialog.waitFor({state:'hidden'});assert.equal(await page.locator('.toast[data-success=true]').count(),0);await page.waitForFunction(selector=>document.querySelector(selector)===document.activeElement,width===390?'.mobile-add':'.floating-action-trigger');
  await revealHomeDetails(page);const chart=page.locator('.clarte-chart');await chart.locator(':scope > summary').click();await chart.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));assert(await chart.evaluate(e=>e.open));await chart.locator(':scope > summary').click();await page.waitForFunction(()=>!document.querySelector('.clarte-chart').open);
  if(width===390){const nav=page.getByRole('navigation',{name:'Navigation mobile'});await nav.getByRole('button',{name:'Plus',exact:true}).click();await page.getByRole('navigation',{name:'Navigation complémentaire'}).getByRole('button',{name:/Réglages/}).click();await dialog.waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('#main-content h1')===document.activeElement,null,{timeout:5000}).catch(async error=>{console.log(await page.evaluate(()=>({heading:document.querySelector('#main-content h1')?.textContent,active:document.activeElement?.outerHTML.slice(0,250),inert:document.querySelector('.main-wrap')?.inert})));throw error;});}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);report.checks.push({width,theme,reduced,continuity:'passed',reverse:'passed',draft:'passed',closeGuard:'passed',focus:'passed',disclosures:'passed',serverWrites:0});await context.close();console.log(`PASS ${engine} ${width} ${theme} reduced=${reduced}: menu continuity, exit, interrupted disclosures, draft and focus`);
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=e.message;throw e;}finally{await writeFile(`${output}/${engine}-report.json`,JSON.stringify(report,null,2));await browser.close();}
