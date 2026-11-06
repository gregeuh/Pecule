import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { revealHomeDetails, chooseOperationType } from './ui-helpers.mjs';

const origin = new URL(process.env.PECULE_E2E_BASE_URL || 'http://127.0.0.1:3001').origin;
const output = process.env.PECULE_E2E_OUTPUT || 'outputs/global-motion';
const engine = process.env.PECULE_E2E_ENGINE === 'webkit' ? 'webkit' : 'chromium';
await mkdir(output, { recursive: true });
const browser = await (engine === 'webkit' ? webkit.launch({ headless: true }) : chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] }));
const report = { origin, engine, personalAccounts: false, checks: [] };
const scenarios = [...[390, 1440].flatMap(width => ['light', 'dark'].map(theme => ({ width, theme, reduced: false }))), { width: 390, theme: 'dark', reduced: true }];
try {
 for (const { width, theme, reduced } of scenarios) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript(t => localStorage.setItem('pecule-theme', t), theme);
  if (process.env.PECULE_E2E_NODE_TRANSPORT === '1') await context.route(`${origin}/**`, async route => {
   const q = route.request(), r = await fetch(q.url(), { method: q.method(), headers: q.headers(), body: q.postDataBuffer() || undefined, redirect: 'manual' }), headers = Object.fromEntries(r.headers);
   for (const key of ['content-encoding', 'content-length', 'transfer-encoding']) delete headers[key];
   const cookies = r.headers.getSetCookie(); if (cookies.length) headers['set-cookie'] = cookies.join('\n');
   await route.fulfill({ status: r.status, headers, body: Buffer.from(await r.arrayBuffer()) });
  });
  const page = await context.newPage(), errors = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', r => { if (r.method() === 'PUT') writes.push(r.url()); });
  await page.goto(origin); await page.locator('.clarte-dashboard').waitFor(); await page.bringToFront();
  const add = page.locator(width === 390 ? '.mobile-add' : '.floating-action-trigger');
  await add.click(); await page.getByRole('button', { name: /Une dépense/ }).click();
  const dialog = page.getByRole('dialog'); await page.locator('input[name=amount]').fill('12.34'); await page.locator('input[name=label]').fill('QA fluidité globale');
  await page.waitForFunction(() => document.querySelector('[role=dialog]')?.dataset.motion === 'idle');
  const controlTiming = await dialog.locator('.primary').evaluate(e => ({ duration: getComputedStyle(e).transitionDuration, ease: getComputedStyle(e).transitionTimingFunction }));
  if (!reduced) { assert(controlTiming.duration.includes('0.26s')); assert(controlTiming.ease.includes('0.22, 1, 0.36, 1')); }
  const details = page.locator('.merchant-options');
  if (!reduced) {
   const trace = await details.evaluate(async element => {
    const summary = element.querySelector(':scope > summary'), body = element.querySelector('.form-options-body');
    const extra = document.createElement('div'); extra.textContent = 'QA contenu chargé'; extra.style.height = '80px';
    const values = [], began = performance.now(); let reversed = false, reopened = false, added = false;
    summary.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(resolve => {
     const sample = now => {
      values.push({ t: now - began, height: element.getBoundingClientRect().height, motion: element.dataset.motion });
      if (!added && now - began > 45) { added = true; body.append(extra); }
      if (!reversed && now - began > 110) { reversed = true; summary.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      if (!reopened && now - began > 230) { reopened = true; summary.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      if (reopened && now - began > 900 && element.dataset.motion === 'idle') resolve(); else requestAnimationFrame(sample);
     }; requestAnimationFrame(sample);
    });
    const result = { values, open: element.open, height: element.style.height, overflow: element.style.overflow, target: element.getBoundingClientRect().height };
    extra.remove(); return result;
   });
   assert(trace.open); assert.equal(trace.height, ''); assert.equal(trace.overflow, '');
   assert(trace.values.some(v => v.motion === 'closing')); assert(trace.values.filter(v => v.motion === 'opening').length > 5);
   assert(Math.abs(trace.values.at(-2).height - trace.target) < 1, 'Natural height must not snap at rest after nested content changes');
   await writeFile(`${output}/${engine}-${width}-${theme}-disclosure.json`, JSON.stringify(trace, null, 2));
  } else {
   await details.locator(':scope > summary').click();
   assert(await details.evaluate(e => e.open && e.style.height === ''));
  }
  assert.equal(await page.locator('input[name=label]').inputValue(), 'QA fluidité globale');
  await page.screenshot({ path: `${output}/${engine}-${width}-${theme}-${reduced ? 'reduced' : 'motion'}-form.png` });
  await page.getByRole('button', { name: 'Enregistrer l’opération', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  const notice = page.locator('.toast[data-success=true]'); await notice.waitFor();
  const confirmation = await notice.elementHandle();
  await notice.getByRole('button', { name: 'Fermer la notification', exact: true }).click();
  if (!reduced) assert.equal(await confirmation.getAttribute('data-motion'), 'closing');
  await notice.waitFor({ state: 'hidden' });
  const nav = page.getByRole('navigation', { name: width === 390 ? 'Navigation mobile' : 'Navigation principale' });
  await nav.getByRole('button', { name: 'Opérations', exact: true }).click();
  await chooseOperationType(page, 'Revenus');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.transactions-card')).opacity === '1');
  assert.equal(await page.locator('.transaction-row').filter({ hasText: 'QA fluidité globale' }).count(), 0);
  await nav.getByRole('button', { name: width === 390 ? 'Accueil' : 'Vue d’ensemble', exact: true }).click();
  await revealHomeDetails(page);
  const chart = page.locator('.clarte-chart'); await chart.locator(':scope > summary').click();
  await page.waitForFunction(() => document.querySelector('.clarte-chart')?.dataset.motion === 'idle' || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const range = page.getByRole('slider', { name: 'Jour de la projection' });
  await range.focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('.projection-control input')?.value === '30');
  await page.locator('.projection-cursor').evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
  const x = await page.locator('.projection-cursor').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41);
  assert(Math.abs(x - 632) < .1, 'Cursor reaches the exact last projected day');
  assert.match(await range.getAttribute('aria-valuetext'), /€/);
  await page.screenshot({ path: `${output}/${engine}-${width}-${theme}-${reduced ? 'reduced' : 'motion'}-chart.png` });
  if (!reduced) {
   await chart.locator(':scope > summary').click();
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.waitForFunction(() => !document.querySelector('.clarte-chart').open && document.querySelector('.clarte-chart').style.height === '');
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  report.checks.push({ width, theme, reduced, spring: 'passed', dynamicHeight: 'passed', form: 'passed', noticeExit: 'passed', filter: 'passed', chart: 'passed', serverWrites: 0 });
  await context.close(); console.log(`PASS ${engine} ${width} ${theme} reduced=${reduced}: controls, nested spring, draft, notice, filter, chart`);
 }
 report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = error.message; throw error; }
finally { await writeFile(`${output}/${engine}-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
