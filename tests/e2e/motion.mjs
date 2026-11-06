import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const origin = new URL(process.env.PECULE_E2E_BASE_URL || 'http://127.0.0.1:3001').origin;
const engine = process.env.PECULE_E2E_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const browser = await (engine === 'webkit' ? webkit.launch({headless:true}) : chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}));
const output = 'outputs/motion'; await mkdir(output,{recursive:true});
const report = {origin,engine,checks:[],personalAccounts:false};
async function routeOrigin(context) { if(process.env.PECULE_E2E_NODE_TRANSPORT==='1')await context.route(`${origin}/**`,async route=>{const q=route.request(),r=await fetch(q.url(),{method:q.method(),headers:q.headers(),body:q.postDataBuffer()||undefined,redirect:'manual'}),headers=Object.fromEntries(r.headers);for(const k of ['content-encoding','content-length','transfer-encoding'])delete headers[k];const c=r.headers.getSetCookie();if(c.length)headers['set-cookie']=c.join('\n');await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())});}); }
try {
  for (const width of [390,1440]) for (const theme of ['light','dark']) for (const reduced of [false,true]) {
    const context = await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,reducedMotion:reduced?'reduce':'no-preference'});
    await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
    await routeOrigin(context);
    const page=await context.newPage(),errors=[],writes=[],wasm=[];
    page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());if(r.url().endsWith('.wasm'))wasm.push(r.url());});
    await page.goto(origin); await page.locator('.clarte-dashboard').waitFor();
    const nav=page.getByRole('navigation',{name:width===390?'Navigation mobile':'Navigation principale'});
    await nav.getByRole('button',{name:'Opérations',exact:true}).click();
    await page.getByRole('button',{name:'Nouvelle opération',exact:true}).click();
    if(reduced)assert.equal(await page.getByRole('dialog').evaluate(e=>getComputedStyle(e).animationName),'none');
    await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();
    assert.equal(await page.locator('.toast[data-success=true]').count(),0,'Validation errors must not celebrate');
    await page.locator('input[name=label]').fill('QA animation');await page.locator('input[name=amount]').fill('12.34');
    await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    const notice=page.locator('.toast[data-success=true]');await notice.waitFor();
    assert.match(await notice.innerText(),/Démonstration/);
    assert.equal(await notice.getAttribute("data-kind"),"operation");
    if(!reduced)await notice.locator('.confirmation-art[data-complete=true]').waitFor();
    else {assert.equal(wasm.length,0);assert.equal(await notice.evaluate(e=>getComputedStyle(e).animationName),'none');}
    if(width===390 && theme==='light' && !reduced) {
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.querySelector('.toast .confirmation-art')?.hasAttribute('data-ready'));
      assert(await notice.locator('.confirmation-fallback').isVisible());
      await page.emulateMedia({reducedMotion:'no-preference'});
      await notice.locator('.confirmation-art[data-complete=true]').waitFor();
    }
    await notice.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
    assert(await notice.locator(".notice-copy").evaluate(e=>e.getBoundingClientRect().width>120),"The message must have room to read");
    await page.screenshot({path:`${output}/${engine}-${width}-${theme}-${reduced?'reduced':'motion'}.png`});
    // The same message must produce a fresh instance and accessible confirmation.
    const first=await notice.elementHandle();
    await page.locator('.transaction-row').filter({hasText:'QA animation'}).click();
    await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await notice.waitFor();
    assert.equal(await first.evaluate(e=>e.isConnected),false);
    await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();
    if(width===390){await page.locator('.mobile-add').click();}else{await page.locator('.floating-action-trigger').click();}
    await page.getByRole('button',{name:/Une récurrence/}).click();await page.locator('input[name=label]').fill('QA récurrence animée');await page.locator('input[name=amount]').fill('5');await page.getByRole('button',{name:'Enregistrer la récurrence',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await notice.waitFor();
    assert.equal(await notice.getAttribute('data-kind'),'recurrence');
    if(!reduced)await notice.locator('.confirmation-art[data-complete=true]').waitFor();
    await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();
    if(width===390){await nav.getByRole('button',{name:'Plus',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Réglages/}).click();}
    else await page.getByRole('button',{name:'Réglages',exact:true}).first().click();
    await page.getByRole('button',{name:'Enregistrer mes préférences',exact:true}).click();await notice.waitFor();
    assert.equal(await notice.getAttribute('data-kind'),'settings');
    if(!reduced)await notice.locator('.confirmation-art[data-complete=true]').waitFor();
    await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();
    await page.locator('#theme-preference').selectOption(theme==='light'?'dark':'light');await notice.waitFor();assert.match(await notice.innerText(),/cet appareil/);
    if(width===390 && !reduced) {
      await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();
      await nav.getByRole('button',{name:'Plus',exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:/Mon épargne/}).click();
      const card=page.locator('.goal-card').first();await card.getByRole('button',{name:/Modifier/}).click();
      await page.locator('input[name=target]').fill('1000');await page.locator('input[name=saved]').fill('100');
      await page.getByRole('button',{name:'Enregistrer mon objectif',exact:true}).click();await notice.waitFor();
      assert.equal(await notice.getAttribute('data-kind'),'savings');
      await notice.locator('.confirmation-art[data-complete=true]').waitFor();
      await page.screenshot({path:`${output}/${engine}-${theme}-savings.png`});
      await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();
      await card.getByRole('button',{name:/Modifier/}).click();await page.locator('input[name=saved]').fill('1000');
      await page.getByRole('button',{name:'Enregistrer mon objectif',exact:true}).click();await notice.waitFor();
      assert.equal(await notice.getAttribute('data-kind'),'goal');
      await notice.locator('.confirmation-art[data-complete=true]').waitFor();
      await page.screenshot({path:`${output}/${engine}-${theme}-milestone.png`});
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    report.checks.push({width,theme,reduced,status:'passed',serverWrites:0});
    await context.close();console.log(`PASS ${engine} ${width} ${theme} reduced=${reduced}: validation, Lottie, repeat, settings, theme, bounds`);
  }
  // A failed illustration never suppresses the confirmation or blocks saving.
  const context=await browser.newContext({viewport:{width:390,height:844}});await routeOrigin(context);await context.route('**/*.wasm',r=>r.abort());const page=await context.newPage();await page.goto(origin);await page.locator('.clarte-dashboard').waitFor();await page.getByRole('navigation',{name:'Navigation mobile'}).getByRole('button',{name:'Opérations',exact:true}).click();await page.getByRole('button',{name:'Nouvelle opération',exact:true}).click();await page.locator('input[name=label]').fill('QA fallback');await page.locator('input[name=amount]').fill('1');await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await page.locator('.toast[data-success=true] .confirmation-fallback').waitFor();await context.close();report.fallback='passed';report.status='passed';
} catch(e){report.status='failed';report.error=e.message;throw e;}
finally {await writeFile(`${output}/${engine}-report.json`,JSON.stringify(report,null,2));await browser.close();}
