import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { accountBalance } from '../../lib/budget.ts';
import { buildBulkEdit } from '../../lib/bulk-transactions.ts';
import { ledgerFingerprint, latestReconciliation } from '../../lib/bank-reconciliation.ts';
import { linkTransfer, unlinkTransfer } from '../../lib/transfer-matching.ts';

// Explicit opt-in: this test creates real accounts and writes only their test budgets.
assert.equal(process.env.PECULE_E2E_ALLOW_ACCOUNT_CREATION, '1', 'Set PECULE_E2E_ALLOW_ACCOUNT_CREATION=1 to authorize dedicated test accounts.');
assert(process.env.PECULE_E2E_BASE_URL, 'Set PECULE_E2E_BASE_URL to the deployment under test.');
const target = new URL(process.env.PECULE_E2E_BASE_URL);
assert(!target.username && !target.password && (target.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(target.hostname)), 'Use HTTPS, or a loopback development server.');
const origin = target.origin;
const runtime = path.resolve('.sites-runtime/bank-tools', target.hostname);
const output = path.resolve('outputs/bank-tools-connected');
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

try{
 const {page}=await newContext();const account=credentials.accounts[0];await authenticate(page,account,!account.created);
 let current=await api(page,'/api/budget');assert(!current.data.budget||current.data.budget.name.startsWith('QA P1'),'Only dedicated QA budgets may be replaced');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const makeAccount=(id,type='current')=>({id,name:`QA compte ${id}`,bank:'QA',type,openingBalance:100000,openingDate:'2026-09-01',color:'#335cff'});
 const makeRow=(id,amount,accountId='a',date='2026-10-10')=>({id,label:`QA opération ${id}`,amount,accountId,date,category:amount>0?'Autres revenus':'Autres',note:'Donnée QA conservée',importRef:`QA-REF-${id}`,importBatch:`QA-IMPORT-${id}`});
 const fixture={version:1,name:'QA P1 outils bancaires',accounts:[makeAccount('a'),makeAccount('b'),makeAccount('s','savings')],transactions:[makeRow('out',-10000),makeRow('in',10000,'s','2026-10-12'),makeRow('expense',-1234)],rules:[],goals:[],settings:{horizon:'month',reserve:0,holidayCalendar:'FR'}};
 assert.equal((await api(page,'/api/budget','PUT',{budget:fixture,revision:current.data.revision})).status,200);
 await page.goto(origin);await page.locator('.clarte-dashboard').waitFor();await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('button',{name:'Mes comptes',exact:true}).click();
 await page.locator('.account-card').filter({has:page.getByRole('heading',{name:'QA compte a',exact:true})}).getByRole('button',{name:'Rapprocher le solde',exact:true}).click();await page.locator('input[name="reconcile-balance"]').fill((accountBalance(fixture,'a',today)/100).toFixed(2));await page.getByRole('button',{name:/^Pointer les \d+ lignes affichées$/}).click();await page.getByRole('checkbox',{name:/J’ai vérifié le solde de référence/}).check();await page.getByRole('button',{name:'Confirmer le rapprochement',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 current=await api(page,'/api/budget');let last=latestReconciliation(current.data.budget.accounts[0]);assert(last);assert.equal(last.fingerprint,await ledgerFingerprint(current.data.budget,'a',today));
 await record('A real browser reconciliation is persisted with its ledger fingerprint and history');
 const beforeBalances=current.data.budget.accounts.map(a=>accountBalance(current.data.budget,a.id,today));
 const linked=linkTransfer(current.data.budget,'out','in','qa-linked-pair');assert.equal((await api(page,'/api/budget','PUT',{budget:linked,revision:current.data.revision})).status,200);current=await api(page,'/api/budget');assert.equal(current.data.budget.transactions[0].transferOriginalCategory,'Autres');assert.equal(current.data.budget.transactions[1].date,'2026-10-12');assert.deepEqual(current.data.budget.accounts.map(a=>accountBalance(current.data.budget,a.id,today)),beforeBalances);assert.equal(await ledgerFingerprint(current.data.budget,'a',today),last.fingerprint);
 const invalid={...current.data.budget,transactions:current.data.budget.transactions.filter(t=>t.id!=='in')};assert.equal((await api(page,'/api/budget','PUT',{budget:invalid,revision:current.data.revision})).status,400);assert.equal((await api(page,'/api/budget')).data.revision,current.data.revision);
 await record('Matched transfers and original import metadata survive PostgreSQL; the API rejects a partial transfer');
 const bulk=buildBulkEdit(current.data.budget,new Set(['expense']),{accountId:'b',category:'Restaurants'},today);assert.equal((await api(page,'/api/budget','PUT',{budget:bulk.budget,revision:current.data.revision})).status,200);
 assert.equal((await api(page,'/api/budget','PUT',{budget:linked,revision:current.data.revision})).status,409);
 current=await api(page,'/api/budget');assert.equal(current.data.budget.transactions.find(t=>t.id==='expense').importRef,'QA-REF-expense');assert.notEqual(await ledgerFingerprint(current.data.budget,'a',today),last.fingerprint);
 await record('Bulk account moves preserve references and invalidate the earlier ledger check; stale writes are refused');
 const unlinked=unlinkTransfer(current.data.budget,'qa-linked-pair');assert.equal((await api(page,'/api/budget','PUT',{budget:unlinked,revision:current.data.revision})).status,200);await page.reload();current=await api(page,'/api/budget');assert.equal(current.data.budget.transactions.some(t=>t.transferId),false);assert.equal(current.data.budget.transactions.find(t=>t.id==='in').category,'Autres revenus');assert.equal(current.data.budget.accounts[0].reconciliations.length,1);
 await api(page,'/api/auth/sign-out','POST',{});await record('Unlinking is persisted without deleting operations; reconciliation history survives reload; QA account signed out');report.status='passed';
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
