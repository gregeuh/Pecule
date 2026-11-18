import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { accountBalance } from '../../lib/budget.ts';

// Explicit opt-in: this test creates real accounts and writes only their test budgets.
assert.equal(process.env.PECULE_E2E_ALLOW_ACCOUNT_CREATION, '1', 'Set PECULE_E2E_ALLOW_ACCOUNT_CREATION=1 to authorize dedicated test accounts.');
assert(process.env.PECULE_E2E_BASE_URL, 'Set PECULE_E2E_BASE_URL to the deployment under test.');
const target = new URL(process.env.PECULE_E2E_BASE_URL);
assert(!target.username && !target.password && (target.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(target.hostname)), 'Use HTTPS, or a loopback development server.');
const origin = target.origin;
const runtime = path.resolve('.sites-runtime/p1-recovery', target.hostname);
const output = path.resolve('outputs/p1-recovery');
await mkdir(runtime, { recursive: true });
await mkdir(output, { recursive: true });
const credentialsPath = path.join(runtime, 'accounts.json');
let credentials;
try { credentials = JSON.parse(await readFile(credentialsPath, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  credentials = { origin, accounts: [0, 1].map(index => ({ name: index ? 'QA P1 isolation' : 'QA P1 persistance', email: `qa-p1-${randomUUID()}@pecule.example.invalid`, password: randomBytes(32).toString('base64url'), created: false })) };
  await writeFile(credentialsPath, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
}
assert.equal(credentials.origin, origin, 'Credentials belong to another deployment.');
const report = { origin, startedAt: new Date().toISOString(), checks: [], google: 'requires_real_user_consent', accountCleanup: 'Dedicated accounts retained for reproducible testing; no personal account used.' };
async function record(name, details = {}) {
  report.checks.push({ name, status: 'passed', ...details });
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`PASS: ${name}`);
}
const browser = await chromium.launch({ headless: true, ...(process.env.PECULE_E2E_CHROMIUM ? { executablePath: process.env.PECULE_E2E_CHROMIUM } : {}), args: process.env.PECULE_E2E_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] });
const contexts = [];
async function newContext(mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
  // Optional transport for cloud TLS proxies: Node still verifies the supplied CA.
  // Never set ignoreHTTPSErrors or disable TLS verification.
  if (process.env.PECULE_E2E_NODE_TRANSPORT === '1') {
    await context.route(`${origin}/**`, async route => {
      const request = route.request();
      const response = await fetch(request.url(), { method: request.method(), headers: request.headers(), body: request.postDataBuffer() || undefined, redirect: 'manual' });
      const headers = Object.fromEntries(response.headers);
      delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
      const cookies = response.headers.getSetCookie();
      if (cookies.length) headers['set-cookie'] = cookies.join('\n');
      await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
    });
  }
  if(process.env.PECULE_E2E_BYPASS_COOKIE_FILE){
    const jar=await readFile(process.env.PECULE_E2E_BYPASS_COOKIE_FILE,'utf8');
    const cookies=jar.split('\n').filter(line=>line&&(line.startsWith('#HttpOnly_')||!line.startsWith('#'))).map(line=>{const [domain,,cookiePath,secure,expires,name,value]=line.replace(/^#HttpOnly_/,'').split('\t');return {domain,path:cookiePath,secure:secure==='TRUE',expires:Number(expires)||-1,name,value,httpOnly:line.startsWith('#HttpOnly_')};});
    await context.addCookies(cookies);
  }
  contexts.push(context);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  return { context, page };
}
async function api(page, pathname, method = 'GET', body) {
  return page.evaluate(async ({ pathname, method, body }) => {
    const response = await fetch(pathname, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    return { status: response.status, data: await response.json() };
  }, { pathname, method, body });
}
async function authenticate(page, account, signup = false) {
  await page.goto(`${origin}/sign-in`);
  if (signup) {
    await page.getByRole('button', { name: 'Créer un compte', exact: true }).click();
    await page.getByLabel('Votre prénom').fill(account.name);
    await page.getByLabel('Confirmer le mot de passe').fill(account.password);
  }
  await page.getByLabel('Adresse e-mail').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === `/api/auth/${signup ? 'sign-up' : 'sign-in'}/email`);
    await page.getByRole('button', { name: signup ? 'Créer mon compte' : 'Me connecter', exact: true }).click();
    response = await responsePromise;
    if (response.status() !== 429 || attempt > 0) break;
    const headers = response.headers();
    const seconds = Number(headers['retry-after'] ?? headers['x-retry-after'] ?? 11);
    assert(Number.isFinite(seconds) && seconds >= 0 && seconds <= 60, 'Unexpected rate-limit delay; stop instead of retrying unboundedly.');
    console.log('WAIT: respecting the authentication rate limit before one retry');
    await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000));
  }
  assert.equal(response.status(), 200, `${signup ? 'Sign-up' : 'Sign-in'} must succeed (response body intentionally omitted).`);
  if (signup) { account.created = true; await writeFile(credentialsPath, JSON.stringify(credentials), { mode: 0o600 }); }
  await page.waitForURL(`${origin}/`);
  assert.equal((await api(page, '/api/budget')).status, 200, 'The browser must have a real authenticated session.');
}

try {
 const {page}=await newContext();
 const account=credentials.accounts[0];
 await authenticate(page,account,!account.created);
 let current=await api(page,'/api/budget');
 assert(!current.data.budget||current.data.budget.name.startsWith('QA P1'),'Only dedicated test budgets may be replaced');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const fixture={version:1,name:'QA P1 récupération',accounts:[{id:'qa-recovery-account',name:'Compte QA récupération',bank:'',type:'current',openingBalance:100000,openingDate:today.slice(0,7)+'-01',color:'#335cff'}],transactions:[],rules:[],goals:[],settings:{horizon:'month',reserve:0,holidayCalendar:'FR',dailyComfortCents:1500,categoryLimits:{Restaurants:1000},categoryRules:[{key:'label:qa service',title:'QA service',direction:'expense',category:'Abonnements'}]}};
 assert.equal((await api(page,'/api/budget','PUT',{budget:fixture,revision:current.data.revision})).status,200);
 await page.goto(origin);await page.locator('.clarte-dashboard').waitFor();
 await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('button',{name:'Mes comptes',exact:true}).click();
 await page.getByRole('button',{name:/Modifier Compte QA récupération/}).click();
 await page.locator('input[name="name"]').fill('Compte QA mon choix');
 current=await api(page,'/api/budget');
 const remote=structuredClone(current.data.budget);remote.accounts[0].name='Compte QA autre appareil';remote.transactions.push({id:'qa-remote-operation',label:'QA dépense autre appareil',amount:-750,date:today,accountId:fixture.accounts[0].id,category:'Autres',note:''});
 assert.equal((await api(page,'/api/budget','PUT',{budget:remote,revision:current.data.revision})).status,200);
 await page.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();
 const panel=page.getByRole('region',{name:'Résoudre les modifications concurrentes'});await panel.waitFor();
 assert.equal(await page.locator('input[name="name"]').inputValue(),'Compte QA mon choix');assert(await panel.evaluate(element=>parseFloat(getComputedStyle(element).paddingLeft)>=20));await panel.screenshot({path:path.join(output,'conflict-choices.png')});
 await panel.getByRole('radio',{name:'Ma modification'}).check();
 // A temporary error must leave the explicit choice and draft intact.
 await page.route('**/api/budget',async route=>{if(route.request().method()==='PUT'){await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'QA service temporairement indisponible'})});await page.unroute('**/api/budget');}else await route.fallback();});
 await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();
 await panel.getByRole('alert').filter({hasText:'QA service'}).waitFor();assert(await panel.getByRole('radio',{name:'Ma modification'}).isChecked());
 await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();
 await page.getByRole('dialog').waitFor({state:'hidden'});
 current=await api(page,'/api/budget');assert.equal(current.data.budget.accounts[0].name,'Compte QA mon choix');assert.equal(current.data.budget.transactions.length,1);
 await record('Concurrent account changes require a choice; independent remote transaction survives; failed resolution retains draft');
 // Independent mutations merge without a forced choice, and a new revision is checked again.
 await page.getByRole('button',{name:/Modifier Compte QA mon choix/}).click();
 await page.locator('input[name="bank"]').fill('QA banque locale');
 const remote2=structuredClone(current.data.budget);remote2.transactions[0].note='QA changement indépendant';
 assert.equal((await api(page,'/api/budget','PUT',{budget:remote2,revision:current.data.revision})).status,200);
 await page.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();await panel.waitFor();assert.equal(await panel.getByRole('radio').count(),0);
 const newer=await api(page,'/api/budget');newer.data.budget.transactions[0].note='QA troisième modification';assert.equal((await api(page,'/api/budget','PUT',{budget:newer.data.budget,revision:newer.data.revision})).status,200);
 await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();
 // The competing write must leave the panel present, then an explicit retry completes.
 await page.waitForTimeout(800);await panel.waitFor();
 await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 current=await api(page,'/api/budget');assert.equal(current.data.budget.accounts[0].bank,'QA banque locale');assert.equal(current.data.budget.transactions[0].note,'QA troisième modification');
 await record('Independent edits and a second revision conflict preserve all three devices’ changes');
 assert.equal(accountBalance(current.data.budget,fixture.accounts[0].id,today),99250);assert.deepEqual(current.data.budget.settings,fixture.settings);
 // Simulate a committed transaction whose response is lost. Retry must reuse its exact IDs.
 await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('button',{name:'Opérations',exact:true}).click();
 await page.getByRole('button',{name:'Nouvelle opération',exact:true}).click();
 await page.locator('input[name="label"]').fill('QA réponse perdue');await page.locator('input[name="amount"]').fill('1.23');
 await page.route('**/api/budget',async route=>{
   if(route.request().method()!=='PUT')return route.fallback();
   const request=route.request();const committed=await fetch(request.url(),{method:'PUT',headers:request.headers(),body:request.postDataBuffer()});
   assert.equal(committed.status,200,'Synthetic transaction must commit before simulating the lost response');
   await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'QA réponse perdue après sauvegarde'})});await page.unroute('**/api/budget');
 });
 await page.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await panel.waitFor();
 await panel.getByText('La sauvegarde n’a pas pu être confirmée.',{exact:false}).waitFor();
 await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();
 await page.waitForTimeout(800);await panel.getByRole('button',{name:'Enregistrer les versions choisies'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 current=await api(page,'/api/budget');assert.equal(current.data.budget.transactions.filter(t=>t.label==='QA réponse perdue').length,1);assert.equal(accountBalance(current.data.budget,fixture.accounts[0].id,today),99127);
 await record('A committed transaction with a lost response is recovered without a duplicate');
 await page.screenshot({path:path.join(output,'connected-recovery.png')});
 await api(page,'/api/auth/sign-out','POST',{});
 await record('Recovery result persisted in PostgreSQL; dedicated account signed out');
 report.status='passed';
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
