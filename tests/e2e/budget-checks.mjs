import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { chromiumOptions, openOperationComposer, waitForWallet } from "./ui-helpers.mjs";

/** « Pourquoi ce montant ? », a recurrence in double and a payment counted twice: found, shown, fixed. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const output = process.env.PECULE_E2E_OUTPUT || "outputs/budget-checks";
await mkdir(output, { recursive: true });
const browser = await chromium.launch(chromiumOptions);
const axe = async (page) => {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
    return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
};
try {
  for (const [width, theme] of [
    [390, "light"],
    [1440, "dark"],
  ]) {
    const mobile = width <= 760;
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      locale: "fr-FR",
      reducedMotion: "reduce",
    });
    await context.addInitScript((t) => localStorage.setItem("pecule-theme", t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin);
    await waitForWallet(page);
    const nav = page.getByRole("navigation", { name: mobile ? "Navigation mobile" : "Navigation principale" });
    const recurring = async () => {
      await nav.getByRole("button", { name: mobile ? "Budget" : /^Récurrences/ }).click();
      if (mobile)
        await page.getByRole("navigation", { name: "Budget" }).getByRole("button", { name: "Récurrences" }).click();
      await page.locator(".rule-card").first().waitFor();
    };
    const addRule = async (label, amount) => {
      await page.locator(".page-heading button.primary").click();
      const dialog = page.getByRole("dialog");
      await dialog.locator('input[name="label"]').fill(label);
      await dialog.locator('input[name="amount"]').fill(amount);
      await dialog.getByRole("button", { name: "Enregistrer la récurrence", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
    };

    // A second « Loyer » close to the demo one is a likely duplicate.
    await recurring();
    assert.equal(await page.locator(".budget-check").count(), 0, "no finding on the demo");
    await addRule("Loyer", "770");
    const check = page.locator(".budget-check").filter({ hasText: "Deux récurrences « Loyer » ?" });
    await check.waitFor();
    assert.deepEqual(await axe(page), [], `${width} duplicate check: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-doublon.png` });

    // « Pourquoi ce montant ? » lists both and flags them.
    await nav.getByRole("button", { name: mobile ? "Accueil" : /^Vue d’ensemble/ }).click();
    await page.locator(".home-hero").click();
    const sheet = page.locator(".calculation-sheet");
    await sheet.waitFor();
    assert(
      (await sheet.locator("li[data-doubled]").count()) >= 1,
      "the duplicate is flagged",
    );
    assert.match(await sheet.locator(".calculation-payday").innerText(), /Prochaine paie attendue le/);
    assert.deepEqual(await axe(page), [], `${width} calculation: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-pourquoi.png` });
    await sheet.locator(".budget-check").getByRole("button", { name: "Garder celle-ci" }).first().click();
    await sheet.locator(".budget-checks-done").waitFor();
    assert.equal(await sheet.locator("li[data-doubled]").count(), 0);
    await page.getByRole("button", { name: "Fermer", exact: true }).click();

    // A planned payment of today and the same payment entered by hand are counted twice.
    await recurring();
    await page.locator(".page-heading button.primary").click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="label"]').fill("Assurance habitation");
    await dialog.locator('input[name="amount"]').fill("24");
    const today = await page.evaluate(() => {
      const d = new Date();
      return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    });
    if (!today.endsWith("-01")) {
      await dialog.locator('input[name="day"]').fill(String(Number(today.slice(8))));
      await dialog.locator('input[name="date"]').fill(today);
      await dialog.getByRole("button", { name: "Enregistrer la récurrence", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await page.locator(".budget-check").count(), 0);
      await page.evaluate(() => scrollTo(0, 0));
      await nav.getByRole("button", { name: mobile ? "Accueil" : /^Vue d’ensemble/ }).click();
      await openOperationComposer(page);
      await dialog.locator('input[name="amount"]').fill("24");
      await dialog.locator('input[name="label"]').fill("Assurance habitation");
      await dialog.getByRole("button", { name: "Enregistrer l’opération", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await recurring();
      const twice = page.locator(".budget-check").filter({ hasText: "compté deux fois" });
      await twice.waitFor();
      assert.deepEqual(await axe(page), [], `${width} double count: accessibility`);
      await page.screenshot({ path: `${output}/${width}-${theme}-deux-fois.png` });
      await twice.getByRole("button", { name: /n’en garder qu’un/ }).click();
      await page.locator(".budget-checks-done").waitFor();
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width} ${theme}: duplicate recurrence, why this amount, counted twice, axe`);
  }
} finally {
  await browser.close();
}
