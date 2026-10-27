import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = new URL(process.env.PECULE_E2E_BASE_URL || 'http://127.0.0.1:3001').origin;
const output = 'outputs/mobile-navigation';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PECULE_E2E_CHROMIUM || '/usr/bin/chromium', args: process.env.PECULE_E2E_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] });
const report = { origin, personalAccounts: false, checks: [] };
try {
  for (const width of [320, 390, 600, 1440]) for (const theme of ['light', 'dark']) {
    const mobile = width <= 760;
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: 'fr-FR' });
    await context.addInitScript(value => localStorage.setItem('pecule-theme', value), theme);
    if (process.env.PECULE_E2E_NODE_TRANSPORT === '1') await context.route(`${origin}/**`, async route => {
      const request = route.request();
      const response = await fetch(request.url(), { method: request.method(), headers: request.headers(), body: request.postDataBuffer() || undefined, redirect: 'manual' });
      const headers = Object.fromEntries(response.headers);
      for (const name of ['content-encoding', 'content-length', 'transfer-encoding']) delete headers[name];
      const cookies = response.headers.getSetCookie();
      if (cookies.length) headers['set-cookie'] = cookies.join('\n');
      await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
    });
    const page = await context.newPage(), errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() === 'PUT' && request.url().endsWith('/api/budget')) writes.push(request.url()); });
    await page.goto(origin);
    await page.locator('.clarte-budget').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const prefix = `${width}-${theme}`;
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (mobile) {
      const nav = page.getByRole('navigation', { name: 'Navigation mobile' });
      assert.deepEqual(await nav.getByRole('button').allTextContents(), ['Accueil', 'Opérations', 'Comptes', 'Plus']);
      const boxes = await nav.getByRole('button').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width, height: r.height }; }));
      assert(boxes.every(box => Math.abs(box.top - boxes[0].top) < 1 && box.width >= 44 && box.height >= 44), 'Four usable targets must fit on one row.');
      const dock = await page.locator('.mobile-dock').boundingBox(), add = await page.locator('.mobile-add').boundingBox(), group = await nav.boundingBox();
      assert(group.x + group.width < add.x && dock.y + dock.height <= 900 - 10);
      assert.equal(await page.locator('.clarte-formula').isVisible(), false);
      const recent = await page.locator('.clarte-recent').boundingBox(), accounts = await page.locator('.clarte-accounts').boundingBox(), goal = await page.locator('.clarte-goal').boundingBox();
      assert(recent.y < accounts.y && accounts.y < goal.y);
      assert.equal(await page.locator('.clarte-recent > .clarte-transaction:visible').count(), 3);
      const amount = await page.locator('.clarte-amount').innerText();
      await page.getByRole('button', { name: 'Comprendre mon disponible', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      assert((await page.getByRole('dialog').innerText()).includes(amount));
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Comprendre mon disponible', exact: true }).waitFor();
      assert(await page.getByRole('button', { name: 'Comprendre mon disponible', exact: true }).evaluate(node => node === document.activeElement));
      await page.locator('.clarte-header-actions').getByRole('button', { name: 'Masquer les montants' }).click();
      await page.getByRole('button', { name: 'Comprendre mon disponible', exact: true }).click();
      assert((await page.getByRole('dialog').innerText()).includes('•••• €'));
      assert(!(await page.getByRole('dialog').innerText()).includes(amount));
      await page.keyboard.press('Escape');
      await page.locator('.clarte-header-actions').getByRole('button', { name: 'Afficher les montants' }).click();
      await page.screenshot({ path: `${output}/${prefix}-home.png`, fullPage: true });
      const plus = nav.getByRole('button', { name: 'Plus', exact: true });
      await plus.click();
      assert(await page.locator('.main-wrap').getAttribute('inert') !== null);
      await page.keyboard.press('Shift+Tab');
      assert(await page.getByRole('navigation', { name: 'Navigation complémentaire' }).getByRole('button', { name: /^Réglages/ }).evaluate(node => node === document.activeElement));
      await page.keyboard.press('Tab');
      assert(await page.getByRole('button', { name: 'Fermer', exact: true }).evaluate(node => node === document.activeElement));
      await page.screenshot({ path: `${output}/${prefix}-more.png` });
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      assert(await plus.evaluate(node => node === document.activeElement));
      for (const name of ['Récurrences', 'Mon épargne', 'Mon équilibre 50/30/20', 'Réglages']) {
        await plus.click();
        await page.getByRole('navigation', { name: 'Navigation complémentaire' }).getByRole('button', { name: new RegExp('^' + name) }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert(await plus.evaluate(node => node.classList.contains('active')));
        assert(await page.locator('#main-content h1').evaluate(node => node === document.activeElement));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      for (const name of ['Comptes', 'Opérations', 'Accueil']) {
        await nav.getByRole('button', { name, exact: true }).click();
        assert.equal(await nav.getByRole('button', { name, exact: true }).getAttribute('aria-current'), 'page');
      }
      await page.locator('.mobile-add').click();
      await page.getByRole('dialog').getByRole('button', { name: /Un import CSV/ }).waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      assert(await page.locator('.mobile-add').evaluate(node => node === document.activeElement));
    } else {
      assert.equal(await page.locator('.mobile-dock').isVisible(), false);
      assert.equal(await page.locator('.clarte-formula').isVisible(), true);
      assert.equal(await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button').count(), 6);
      assert.equal(await page.getByRole('button', { name: 'Comprendre mon disponible', exact: true }).isVisible(), false);
      await page.screenshot({ path: `${output}/${prefix}-home.png`, fullPage: true });
    }
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
    report.checks.push({ width, theme, status: 'passed', serverWrites: 0 });
    await context.close();
    console.log(`PASS ${prefix}: ${mobile ? 'four destinations, separate add, More, focus, compact home and privacy' : 'desktop layout preserved'}`);
  }
  report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = error.message; throw error; }
finally { await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
