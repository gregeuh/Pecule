import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {chromiumOptions,waitForWallet} from './ui-helpers.mjs';
const origin=new URL(process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001').origin,output=process.env.PECULE_E2E_OUTPUT||'outputs/desktop-reflow';
await mkdir(output,{recursive:true});
const browser=await chromium.launch(chromiumOptions),checks=[];
const widths=process.env.PECULE_E2E_QUICK==='1'?[780,1024,1440]:[390,760,761,780,820,900,1023,1024,1025,1100,1280,1440,1920];
const scenarios=[...widths.flatMap(width=>['light','dark'].map(theme=>({width,theme,zoom:1}))),...[1.5,1.75,2].map(zoom=>({width:1440,theme:'light',zoom}))];
try{for(const {width,theme,zoom} of scenarios){
 const context=await browser.newContext({viewport:{width,height:1000},locale:'fr-FR',reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('pecule-theme',theme),theme);
 if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});});
 const page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});await page.goto(origin);await waitForWallet(page);await page.evaluate(()=>document.fonts.ready);
 if(zoom!==1)await page.evaluate(value=>{document.documentElement.style.zoom=String(value);},zoom);
 const data=await page.evaluate(()=>{
  const box=e=>e.getBoundingClientRect(),root=document.querySelector('.wallet-dashboard'),grid=document.querySelector('.wallet-home-grid'),left=document.querySelector('.wallet-home-accounts'),right=document.querySelector('.wallet-home-content');
  const lines=e=>{const range=document.createRange();range.selectNodeContents(e);return new Set([...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>Math.round(r.top))).size;};
  // Compact screens get the home in tiles: no columns or tabs, the same rules for amounts and labels.
  if(!grid){const tiles=document.querySelector('.home-tiles');return{tiles:true,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,available:root.clientWidth,rightWidth:tiles.clientWidth,stacked:true,
   money:[...document.querySelectorAll('.home-tile-figure b,.home-tile-account b,.clarte-transaction>b')].filter(e=>e.checkVisibility()).map(e=>({text:e.textContent,lines:lines(e),overflow:e.scrollWidth>e.clientWidth+1})),
   labels:[...document.querySelectorAll('.clarte-transaction>span:has(>strong)')].filter(e=>e.checkVisibility()).map(e=>({text:e.querySelector('strong').textContent,width:box(e).width})),tabs:[],contentRight:box(tiles).right};}
  const money=[...document.querySelectorAll('.wallet-month-summary strong,.wallet-card-balance,.clarte-transaction>b')].filter(e=>e.checkVisibility()).map(e=>({text:e.textContent,lines:lines(e),overflow:e.scrollWidth>e.clientWidth+1}));
  const labels=[...document.querySelectorAll('.clarte-transaction>span:has(>strong)')].filter(e=>e.checkVisibility()).map(e=>({text:e.querySelector('strong').textContent,width:box(e).width}));
  const tabs=[...document.querySelectorAll('.wallet-tabs>button')].map(e=>({text:e.textContent,right:box(e).right}));
  return{viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,available:root.clientWidth,columns:getComputedStyle(grid).gridTemplateColumns,rightWidth:right.clientWidth,stacked:box(right).top>=box(left).bottom-1,money,labels,tabs,contentRight:box(right).right};
 });
 const name=`${width}-${theme}-zoom-${zoom}`;checks.push({name,...data});
 assert(data.scrollWidth<=data.viewport+1,`${name}: horizontal page overflow`);
 assert(data.rightWidth>=280,`${name}: reading column must remain usable`);
 assert(data.money.length>=3,`${name}: inspect actual monetary values`);
 assert(data.money.every(v=>v.lines===1&&!v.overflow),`${name}: broken or clipped amounts ${JSON.stringify(data.money)}`);
 assert(data.labels.length>0&&data.labels.every(v=>v.width>=70),`${name}: labels compressed into letters ${JSON.stringify(data.labels)}`);
 assert(data.tabs.every(t=>t.right<=data.contentRight+1),`${name}: tab leaves its panel`);
 if(width>760&&zoom===1&&data.available<670)assert(data.stacked,`${name}: panels must stack when two reading columns cannot fit`);
 if(width>760&&zoom===1&&data.available>=800)assert(!data.stacked,`${name}: retain the wide desktop layout`);
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 if((width===780||width===1440)&&zoom===1)await page.screenshot({path:`${output}/${name}.png`,fullPage:true});
 console.log(`PASS ${name}: no overflow, readable labels, intact amounts and tabs`);await context.close();
}}finally{await writeFile(`${output}/report.json`,JSON.stringify({checks,personalBudgets:false,zoomNote:'CSS zoom and effective viewport widths; not physical Safari browser-zoom verification'},null,2));await browser.close();}
