import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin;
const engine=process.env.PECULE_E2E_ENGINE==='webkit'?'webkit':'chromium',output='outputs/mobile-sheet';await mkdir(output,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const report={origin,engine,checks:[],personalAccounts:false};
async function routeOrigin(context){if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];const c=r.headers.getSetCookie();if(c.length)headers['set-cookie']=c.join('\n');await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});}
try{
 const scenarios=process.env.PECULE_E2E_QUICK==='1'?[{width:440,theme:'light',reduced:false},{width:440,theme:'dark',reduced:true}]:[{width:440,theme:'light',reduced:false},{width:440,theme:'dark',reduced:false},{width:390,theme:'dark',reduced:false},{width:440,theme:'light',reduced:true},{width:1440,theme:'dark',reduced:false}];
 for(const {width,theme,reduced} of scenarios){
  const mobile=width<=760,context=await browser.newContext({viewport:{width,height:956},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});await routeOrigin(context);await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
  const page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});await page.goto(origin);await page.locator('.clarte-budget').waitFor();
  await page.evaluate(()=>{window.__sheetFrames=[];window.__sheetCycle=0;window.__sheetWatch=true;function sample(){const root=document.querySelector('.modal-motion'),panel=root?.querySelector('.modal'),shade=root?.querySelector('.modal-shade');if(panel&&shade){const p=getComputedStyle(panel),r=getComputedStyle(root),s=getComputedStyle(shade),box=panel.getBoundingClientRect();window.__sheetFrames.push({cycle:window.__sheetCycle,phase:panel.dataset.motion,panelOpacity:Number(p.opacity),rootOpacity:Number(r.opacity),rootFilter:r.backdropFilter||r.webkitBackdropFilter||'none',shadeFilter:s.backdropFilter||s.webkitBackdropFilter||'none',color:p.backgroundColor,top:box.top,left:box.left,right:box.right});}if(window.__sheetWatch)requestAnimationFrame(sample);}requestAnimationFrame(sample);});
  for(let cycle=0;cycle<4;cycle++){
   await page.evaluate(id=>{window.__sheetCycle=id;},cycle);
   if(mobile&&cycle%2===0)await page.getByRole('navigation',{name:'Navigation mobile'}).getByRole('button',{name:'Plus',exact:true}).click();else await page.locator(mobile?'.mobile-add':'.floating-action-trigger').click();
   await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.getAttribute('data-motion')==='idle');
   assert.equal(await page.locator('.modal-shade').count(),1);
   if(cycle===1)await page.screenshot({path:`${output}/${engine}-${width}-${theme}-${reduced?'reduced':'motion'}.png`});
   await page.getByRole('button',{name:'Fermer',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  }
  const frames=await page.evaluate(()=>{window.__sheetWatch=false;return window.__sheetFrames;});assert(frames.length>0);report.lastFrames=frames;
  assert(frames.every(f=>f.rootOpacity===1),'The dialog parent must never fade or expose its whole composite layer');
  if(mobile){assert(frames.every(f=>f.panelOpacity===1),'A phone sheet must stay opaque throughout entry and exit');assert(frames.every(f=>f.rootFilter==='none'&&f.shadeFilter==='none'),'Avoid mobile Safari backdrop-filter compositing during motion');assert(frames.every(f=>f.left>=-1&&f.right<=width+1),'No sideways movement');}
  if(mobile&&!reduced){let moving=0;for(let cycle=0;cycle<4;cycle++){const closing=frames.filter(f=>f.cycle===cycle&&f.phase==='closing');if(closing.length>=2){assert(closing.at(-1).top>closing[0].top,'The opaque sheet exits downward');moving++;}}assert(moving>0,'Capture actual closing animation frames');}
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push({width,theme,reduced,frames:frames.length,opaqueSheet:mobile?'passed':'desktop fade retained',stableParent:'passed',serverWrites:0});await context.close();console.log(`PASS ${engine} ${width} ${theme} reduced=${reduced}: repeated menus, opaque mobile exit, separate scrim, frame bounds`);
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=e.message;throw e;}finally{await writeFile(`${output}/${engine}-report.json`,JSON.stringify(report,null,2));await browser.close();}
