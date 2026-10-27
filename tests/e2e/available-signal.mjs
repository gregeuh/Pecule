import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = new URL(process.env.PECULE_E2E_BASE_URL || 'http://127.0.0.1:3001').origin;
const output = 'outputs/available-signal';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PECULE_E2E_CHROMIUM ? { executablePath: process.env.PECULE_E2E_CHROMIUM } : {}), args: process.env.PECULE_E2E_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] });
const report = { origin, checks: [], usesPersonalAccounts: false };
const cents = text => Math.round(Number(text.replace(/[^\d,−-]/g, '').replace('−', '-').replace(',', '.')) * 100);
const luminance = rgb => {
  const values = rgb.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
};

try {
  for (const mobile of [false, true]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
    await context.addInitScript(value => localStorage.setItem('pecule-theme', value), theme);
    if (process.env.PECULE_E2E_NODE_TRANSPORT === '1') await context.route(`${origin}/**`, async route => {
      const request = route.request();
      const response = await fetch(request.url(), { method: request.method(), headers: request.headers(), body: request.postDataBuffer() || undefined, redirect: 'manual' });
      const headers = Object.fromEntries(response.headers);
      delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
      const cookies = response.headers.getSetCookie();
      if (cookies.length) headers['set-cookie'] = cookies.join('\n');
      await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    const writes = [], errors = [];
    page.on('request', request => { if (request.method() === 'PUT' && new URL(request.url()).pathname === '/api/budget') writes.push('unexpected server write'); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.locator('.budget-signal').waitFor();
    assert.match(await page.locator('.demo-banner').textContent(), /fictives/);
    await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
    const days = Number((await page.locator('.clarte-daily-desktop span').textContent()).match(/\d+/)[0]);
    const initialAvailable = cents(await page.locator('.clarte-amount').innerText());
    await page.locator('.clarte-header-actions').getByRole('button', { name: 'Réglages', exact: true }).click();
    const initialReserve = Math.round(Number(await page.locator('input[name="reserve"]').inputValue()) * 100);
    const maximumAvailable = initialAvailable + initialReserve;
    assert(maximumAvailable >= days * 1000, 'The synthetic demo must support every tested allowance.');
    async function home() {
      await page.getByRole('navigation', { name: mobile ? 'Navigation mobile' : 'Navigation principale' }).getByRole('button', { name: mobile ? 'Accueil' : 'Vue d’ensemble', exact: true }).click();
    }
    const colors = [];
    for (const [tone, label, amount] of [['negative', 'Négatif', -1], ['attention', 'Attention', days * 1000 - 1], ['comfort', 'Confort', days * 1000]]) {
      if (await page.locator('input[name="reserve"]').count() === 0) await page.locator('.clarte-header-actions').getByRole('button', { name: 'Réglages', exact: true }).click();
      await page.locator('input[name="reserve"]').fill(((maximumAvailable - amount) / 100).toFixed(2));
      await page.getByRole('button', { name: 'Enregistrer mes préférences', exact: true }).click();
      await home();
      assert.equal(await page.locator('.clarte-budget').getAttribute('data-budget-tone'), tone);
      assert.equal((await page.locator('.budget-signal').innerText()).trim(), label);
      assert.equal(cents(await page.locator('.clarte-amount').innerText()), amount);
      const style = await page.locator('.clarte-available').evaluate(element => { const css = getComputedStyle(element); return { color: css.color, background: css.backgroundColor }; });
      const values = [luminance(style.color), luminance(style.background)].sort((a, b) => b - a);
      const contrast = (values[0] + .05) / (values[1] + .05);
      assert(contrast >= 4.5, `${label} must have accessible contrast.`);
      colors.push(style.background);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'The page must not overflow horizontally.');
      await page.locator('.clarte-budget').screenshot({ path: `${output}/${mobile ? 'mobile' : 'desktop'}-${theme}-${tone}.png` });
      report.checks.push({ mobile, theme, tone, label, contrast: Number(contrast.toFixed(2)) });
    }
    assert.equal(new Set(colors).size, 3, 'Each status must have a distinct rendered color.');
    await page.locator('.clarte-header-actions').getByRole('button', { name: 'Masquer les montants' }).click();
    assert.equal(await page.locator('.clarte-budget').getAttribute('data-budget-tone'), null);
    assert.equal(await page.locator('.budget-signal').count(), 0);
    assert.equal(await page.locator('.budget-signal-description').count(), 0);
    assert.match(await page.locator('.clarte-amount').innerText(), /••••/);
    await page.locator('.clarte-header-actions').getByRole('button', { name: 'Afficher les montants' }).click();
    assert.equal(await page.locator('.clarte-budget').getAttribute('data-budget-tone'), 'comfort');
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal((await page.locator('.budget-signal').innerText()).trim(), 'Confort');
    assert.deepEqual(writes, [], 'Demo testing must not write a real budget.');
    assert.deepEqual(errors, []);
    report.checks.push({ mobile, theme, privacy: 'passed', forcedColorsLabel: 'passed', serverWrites: 0 });
    await context.close();
    console.log(`PASS: ${mobile ? 'mobile' : 'desktop'} ${theme}, three statuses, contrast, privacy and high contrast`);
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
