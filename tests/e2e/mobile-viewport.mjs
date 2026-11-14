import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium,webkit } from 'playwright';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin;
const engine=process.env.PECULE_E2E_ENGINE==='webkit'?'webkit':'chromium';
const output='outputs/mobile-viewport';await mkdir(output,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const report={origin,engine,checks:[],personalAccounts:false};
try{
 for(const width of [393,430,844,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:width===844?390:852},isMobile:width!==1440,hasTouch:width!==1440,reducedMotion:'no-preference'});await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
  if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];const c=r.headers.getSetCookie();if(c.length)headers['set-cookie']=c.join('\n');await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});
  const page=await context.newPage(),errors=[],writes=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT'&&r.url().endsWith('/api/budget'))writes.push(r.url());});await page.goto(origin);await page.locator('.clarte-dashboard').waitFor();
  if(width!==1440)assert(await page.evaluate(()=>['html','body'].every(s=>{const style=getComputedStyle(document.querySelector(s));return style.overflowX==='clip'&&style.overscrollBehaviorX==='none';})), 'The phone page must prevent horizontal overflow and bounce, including landscape.');
  const nav=page.getByRole('navigation',{name:width<=760?'Navigation mobile':'Navigation principale'});await nav.getByRole('button',{name:'Opérations',exact:true}).click();await page.getByRole('button',{name:'Nouvelle opération',exact:true}).click();await page.locator('input[name=label]').fill('QA limites de la fenêtre et de son animation');await page.locator('input[name=amount]').fill('12.34');
  if(width!==1440)assert(await page.locator('input[name=amount]').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16),'Amount text must avoid iOS focus zoom');
  await page.evaluate(()=>{window.__viewportSamples=[];window.__viewportDone=false;let started;function watch(now){const toast=document.querySelector('.toast');if(toast){started??=now;const r=toast.getBoundingClientRect();window.__viewportSamples.push({left:r.left,right:r.right,viewport:document.documentElement.clientWidth,offset:scrollX,time:now-started});if(now-started>=350){window.__viewportDone=true;return;}}requestAnimationFrame(watch);}requestAnimationFrame(watch);});
  await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await page.waitForFunction(()=>window.__viewportDone);const samples=await page.evaluate(()=>window.__viewportSamples);assert(samples.length>=3,'Record multiple animation frames');assert(samples.every(r=>r.left>=-1&&r.right<=r.viewport+1&&r.offset===0),`Toast escapes during animation: ${JSON.stringify(samples.filter(r=>r.left< -1||r.right>r.viewport+1))}`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  report.checks.push({width,theme,status:'passed',animationFrames:samples.length,outsideViewport:0,serverWrites:0});await context.close();console.log(`PASS ${engine} ${width} ${theme}: page bounds and toast animation frames`);
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=e.message;throw e;}finally{await writeFile(`${output}/${engine}-report.json`,JSON.stringify(report,null,2));await browser.close();}
