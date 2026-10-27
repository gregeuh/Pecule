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
const runtime = path.resolve('.sites-runtime/p1-connected', target.hostname);
const output = path.resolve('outputs/p1-connected');
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
  const first = await newContext();
  await first.page.goto(origin);
  assert.equal((await api(first.page, '/api/budget')).status, 401);
  await record('Anonymous budget access is denied');
  const primary = credentials.accounts[0];
  const signup = !primary.created;
  await authenticate(first.page, primary, signup);
  await record(signup ? 'Account created through the real sign-up form' : 'Dedicated account signed in again');
  const cookies = (await first.context.cookies()).filter(cookie => cookie.name.includes('session_token'));
  assert(cookies.length && cookies.every(cookie => cookie.httpOnly && (target.protocol !== 'https:' || cookie.secure)), 'Session cookies must be HttpOnly and Secure over HTTPS.');
  await record('Secure authenticated browser session');
  let current = await api(first.page, '/api/budget');
  if (!current.data.budget) {
    await first.page.getByRole('button', { name: 'Créer mon budget', exact: true }).click();
    const dialog = first.page.getByRole('dialog');
    await dialog.getByLabel('Votre prénom').fill('QA P1 persistance');
    await dialog.getByLabel('Nom du compte').fill('Compte bancaire fictif P1');
    await dialog.getByLabel('Solde aujourd’hui (€)').fill('1000');
    await dialog.getByRole('button', { name: 'Continuer', exact: true }).click();
    for (let index = 0; index < 3; index++) await dialog.getByRole('button', { name: 'Passer cette étape', exact: true }).click();
    const saved = first.page.waitForResponse(response => new URL(response.url()).pathname === '/api/budget' && response.request().method() === 'PUT');
    await dialog.getByRole('button', { name: 'Créer mon espace personnel' }).click();
    assert.equal((await saved).status(), 200);
    await dialog.waitFor({ state: 'hidden' });
    await record('Onboarding creates an empty personal budget without demo data');
    current = await api(first.page, '/api/budget');
  }
  assert.equal(current.data.budget.name, 'QA P1 persistance', 'Refuse to alter any budget outside the dedicated fixture.');
  assert.equal(current.data.budget.accounts.length, 1);
  assert.equal(current.data.budget.rules.length, 0);
  assert.equal(current.data.budget.goals.length, 0);
  // Only reset a known dedicated test budget, allowing this suite to be rerun.
  const initial = structuredClone(current.data.budget);
  initial.transactions = [];
  initial.accounts[0].openingDate = '2026-10-01';
  initial.accounts[0].openingBalance = 100000;
  const reset = await api(first.page, '/api/budget', 'PUT', { budget: initial, revision: current.data.revision });
  assert.equal(reset.status, 200);
  await first.page.reload();
  await first.page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: 'Opérations', exact: true }).click();
  await first.page.getByRole('button', { name: 'Importer', exact: true }).click();
  const csv = 'Date;Libellé;Débit;Crédit;Catégorie;Note;Référence;Date de valeur;Bénéficiaire;Devise\n23/10/2026;Courses fictives P1;42,50;;Alimentation;Ticket de test;QA-P1-001;24/10/2026;Commerce fictif;EUR\n24/10/2026;Revenu fictif P1;;200,00;Autres revenus;Test;QA-P1-002;24/10/2026;Employeur fictif;EUR';
  await first.page.locator('.bank-import input[type=file]').setInputFiles({ name: 'releve-fictif-p1.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await first.page.getByText('Données reprises', { exact: true }).first().click();
  assert.match(await first.page.locator('.bank-import-source').first().innerText(), /Bénéficiaire : Commerce fictif/);
  await first.page.getByRole('button', { name: 'Vérifier 2 opérations', exact: true }).click();
  await first.page.getByRole('checkbox', { name: 'Je confirme le compte' }).check();
  const imported = first.page.waitForResponse(response => new URL(response.url()).pathname === '/api/budget' && response.request().method() === 'PUT');
  await first.page.getByRole('button', { name: 'Importer 2 opérations', exact: true }).click();
  assert.equal((await imported).status(), 200);
  await first.page.getByRole('dialog').waitFor({ state: 'hidden' });
  const stored = await api(first.page, '/api/budget');
  assert.equal(stored.status, 200);
  assert.equal(stored.data.budget.transactions.length, 2);
  assert.deepEqual(stored.data.budget.transactions.map(t => t.amount), [-4250, 20000]);
  assert.match(stored.data.budget.transactions[0].note, /Date de valeur : 24\/10\/2026/);
  assert.equal(stored.data.budget.transactions[0].importRef, 'QA-P1-001');
  assert.equal(accountBalance(stored.data.budget, initial.accounts[0].id, '2026-10-27'), 115750);
  await record('CSV import persisted by the production API', { operationCount: 2, netCents: 15750, expectedBalanceCents: 115750 });
  await first.page.reload();
  assert.deepEqual((await api(first.page, '/api/budget')).data, stored.data);
  await record('Stored budget survives a complete page reload');
  await first.page.goto(`${origin}/sign-out`);
  await first.page.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
  await first.page.waitForURL(`${origin}/`);
  assert.equal((await api(first.page, '/api/budget')).status, 401);
  await record('Sign-out invalidates the session');
  const second = await newContext(true);
  await second.page.goto(`${origin}/sign-in`);
  await second.page.getByLabel('Adresse e-mail').fill(primary.email);
  await second.page.locator('input[name="password"]').fill('wrong-password-for-negative-test');
  await second.page.getByRole('button', { name: 'Me connecter', exact: true }).click();
  await second.page.getByRole('alert').filter({ hasText: 'Vérifiez votre adresse e-mail' }).waitFor();
  await record('An incorrect password is rejected');
  await authenticate(second.page, primary);
  assert.deepEqual((await api(second.page, '/api/budget')).data, stored.data);
  await record('A second independent mobile browser reads the same budget after sign-in');
  const isolated = await newContext();
  const other = credentials.accounts[1];
  await authenticate(isolated.page, other, !other.created);
  const isolatedBudget = await api(isolated.page, '/api/budget');
  assert.equal(isolatedBudget.status, 200);
  assert.equal(isolatedBudget.data.budget, null);
  assert.equal(isolatedBudget.data.revision, 0);
  await record('A second user cannot see the first user’s budget');
  const google = await newContext();
  await google.page.goto(`${origin}/sign-in`);
  const options = await api(google.page, '/api/auth-options');
  assert.equal(options.status, 200);
  assert.equal(options.data.google, true, 'Google must be configured on this deployment.');
  const destination = new Promise(resolve => {
    void google.context.route('https://accounts.google.com/**', async route => {
      resolve(new URL(route.request().url()));
      await route.abort('aborted'); // Stop before login/consent: no personal Google session is accessed.
    });
  });
  await google.page.getByRole('button', { name: 'Continuer avec Google' }).click();
  let timer;
  const oauth = await Promise.race([destination, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Google OAuth did not open the provider within 30 seconds.')), 30_000); })]).finally(() => clearTimeout(timer));
  assert.equal(oauth.hostname, 'accounts.google.com');
  assert.equal(oauth.searchParams.get('redirect_uri'), `${origin}/api/auth/callback/google`);
  assert(oauth.searchParams.get('client_id') && oauth.searchParams.get('state'));
  assert(oauth.searchParams.get('scope').includes('openid'));
  await record('Google button opens the expected provider with the production callback');
  // Close every real session; retain only synthetic account/budget fixtures.
  for (const { page } of [second, isolated]) assert.equal((await api(page, '/api/auth/sign-out', 'POST', {})).status, 200);
  await record('All test sessions signed out');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  // Do not serialize request payloads, cookies, tokens or credentials.
  report.failure = { name: error.name, message: String(error.message).slice(0, 1000) };
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await Promise.allSettled(contexts.map(context => context.close()));
  await browser.close();
}
