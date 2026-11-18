import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const origin = new URL(process.env.PECULE_E2E_BASE_URL || 'http://127.0.0.1:3001').origin;
const engine = process.env.PECULE_E2E_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const output = process.env.PECULE_E2E_OUTPUT || 'outputs/smooth-motion';
await mkdir(output, { recursive: true });
const browser = await (engine === 'webkit' ? webkit.launch({ headless: true }) : chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] }));
const report = { origin, engine, checks: [], personalAccounts: false };
try {
  for (const width of [320, 390, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 760, hasTouch: width < 760, reducedMotion: 'no-preference' });
    await context.addInitScript(t => localStorage.setItem('pecule-theme', t), theme);
    if (process.env.PECULE_E2E_NODE_TRANSPORT === '1') await context.route(`${origin}/**`, async route => {
      const q = route.request(), response = await fetch(q.url(), { method: q.method(), headers: q.headers(), body: q.postDataBuffer() || undefined, redirect: 'manual' });
      const headers = Object.fromEntries(response.headers);
      for (const name of ['content-encoding', 'content-length', 'transfer-encoding']) delete headers[name];
      const cookies = response.headers.getSetCookie(); if (cookies.length) headers['set-cookie'] = cookies.join('\n');
      await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
    });
    const page = await context.newPage(), errors = [], writes = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.method() === 'PUT') writes.push(r.url()); });
    await page.goto(origin); await page.locator('.clarte-dashboard').waitFor(); await page.evaluate(() => document.fonts.ready); await page.bringToFront();
    await page.evaluate(async () => { window.scrollTo({ top: 0, behavior: 'instant' }); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
    if (width < 760) {
      const samples = await page.evaluate(async () => {
        const dock = document.querySelector('.mobile-dock');
        const values = [], began = performance.now(); let reversed = false;
        window.scrollTo({ top: 350, behavior: 'instant' });
        await new Promise(resolve => {
          const sample = now => {
            const value = Number(dock.style.getPropertyValue('--dock-collapse'));
            const r = dock.getBoundingClientRect();
            const targets = [...dock.querySelectorAll('button')].map(e => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height); });
            values.push({ t: now - began, value, width: r.width, height: r.height, target: Math.min(...targets) });
            if (!reversed && value > .25 && value < .95) { reversed = true; window.scrollTo({ top: 230, behavior: 'instant' }); }
            if (now - began > 1100 && !dock.hasAttribute('data-moving')) resolve(); else requestAnimationFrame(sample);
          }; requestAnimationFrame(sample);
        });
        return { values, reversed, final: dock.dataset.compact, hidden: document.hidden, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, scrollY, maxScroll: document.documentElement.scrollHeight - innerHeight };
      });
      await writeFile(`${output}/${engine}-${width}-${theme}-frames.json`, JSON.stringify(samples, null, 2));
      assert(samples.reversed, 'Reverse the scroll before contraction finishes');
      assert.equal(samples.final, 'false');
      assert.equal(samples.values.at(-1).value, 0);
      assert(samples.values.filter(s => s.value > 0 && s.value < 1).length >= 6, 'Dock needs intermediate frames');
      assert(samples.values.every(s => s.target >= 43.9), 'Keep every touch target at least 44px');
      assert(samples.values.every(s => s.value >= 0 && s.value <= 1), 'Never overshoot geometry bounds');
      for (let i = 1; i < samples.values.length; i++) {
        const a = samples.values[i - 1], b = samples.values[i];
        if (b.t - a.t < 45) assert(Math.abs(b.value - a.value) < .3, 'No snap on scroll reversal');
      }
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.mobile-dock')?.dataset.compact === 'true');
      await page.waitForFunction(() => !document.querySelector('.mobile-dock')?.hasAttribute('data-moving'));
      assert.equal(await page.locator('.mobile-dock').evaluate(e => Number(e.style.getPropertyValue('--dock-collapse'))), 1);
      const indicatorError = await page.locator('.mobile-nav').evaluate(nav => {
        const marker = nav.querySelector('.navigation-indicator').getBoundingClientRect(), current = nav.querySelector('[aria-current=page]').getBoundingClientRect();
        return Math.max(Math.abs(marker.x - current.x), Math.abs(marker.y - current.y), Math.abs(marker.width - current.width), Math.abs(marker.height - current.height));
      });
      assert(indicatorError < 1.1, 'Active highlight stays aligned with compact navigation');
      await page.screenshot({ path: `${output}/${engine}-${width}-${theme}-compact.png` });
      // Keyboard focus exposes all labels without changing accessible names.
      await page.keyboard.press('Tab');
      await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('button', { name: 'Accueil', exact: true }).focus();
      assert.equal(await page.locator('.mobile-dock').evaluate(e => getComputedStyle(e).getPropertyValue('--dock-layout-collapse').trim()), '0');
      await page.evaluate(() => document.activeElement.blur());
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.mobile-dock')?.dataset.compact === 'false' && !document.querySelector('.mobile-dock')?.hasAttribute('data-moving'));
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.mobile-dock')?.dataset.compact === 'true' && document.querySelector('.mobile-dock')?.hasAttribute('data-moving'));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.mobile-dock')?.hasAttribute('data-moving'));
      assert.equal(await page.locator('.mobile-dock').evaluate(e => Number(e.style.getPropertyValue('--dock-collapse'))), 1);
      await page.evaluate(() => window.scrollTo({ top: 280, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.mobile-dock')?.dataset.compact === 'false');
      await page.waitForFunction(() => document.querySelector('.mobile-dock')?.style.getPropertyValue('--dock-collapse') === '0');
      assert.equal(await page.locator('.mobile-dock').getAttribute('data-moving'), null);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    const nav = page.getByRole('navigation', { name: width < 760 ? 'Navigation mobile' : 'Navigation principale' });
    await nav.getByRole('button', { name: 'Opérations', exact: true }).click();
    await nav.getByRole('button', { name: width < 760 ? 'Comptes' : 'Mes comptes', exact: true }).click();
    await page.evaluate(() => Promise.all(document.querySelector('#main-content').getAnimations().map(a => a.finished.catch(() => {}))));
    assert.equal(await page.locator('#main-content').evaluate(e => getComputedStyle(e).opacity), '1');
    await page.screenshot({ path: `${output}/${engine}-${width}-${theme}-accounts.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    report.checks.push({ width, theme, status: 'passed', spring: width < 760 ? 'reversal, bounds, idle, highlight, keyboard, dynamic reduced motion' : 'not applicable', navigation: 'passed', serverWrites: 0 });
    await context.close(); console.log(`PASS ${engine} ${width} ${theme}: continuous motion and usable navigation`);
  }
  report.status = 'passed';
} catch (e) { report.status = 'failed'; report.error = e.message; throw e; }
finally { await writeFile(`${output}/${engine}-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
