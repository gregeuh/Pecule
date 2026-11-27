import assert from "node:assert/strict";
import { chromium } from "playwright";
import { chromiumOptions, waitForWallet } from "./ui-helpers.mjs";

/** Mon épargne from the livret: balance, envelopes from the former goals, monthly transfer, home tile, axe. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
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
    [390, "dark"],
    [1440, "light"],
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
    await nav.getByRole("button", { name: mobile ? "Épargne" : /^Mon épargne/ }).click();
    const hero = page.locator(".savings-hero");
    await hero.waitFor();
    assert.match(await hero.innerText(), /Livret d’épargne/);
    assert.match(await hero.innerText(), /4\s250,00\s€/);
    assert.deepEqual(await axe(page), [], `${width} savings: accessibility`);

    // The demo goals are followed apart; they become envelopes, their reserves one monthly transfer.
    await page.getByRole("button", { name: /^Ranger dans Livret d’épargne/ }).first().click();
    const setup = page.locator(".savings-setup");
    await setup.waitFor();
    assert.equal(await setup.getByRole("checkbox").count(), 3);
    assert.match(await setup.innerText(), /350\s€ par mois/);
    assert.deepEqual(await axe(page), [], `${width} savings setup: accessibility`);
    await setup.getByRole("button", { name: /^Ranger dans/ }).click();
    await setup.waitFor({ state: "detached" });
    const list = page.locator(".savings-envelope-list");
    assert.equal(await list.locator("li").count(), 3, "two envelopes and Libre");
    assert.match(await list.innerText(), /Une escapade au soleil[\s\S]*Le coussin de sécurité[\s\S]*Libre/);
    assert.match(await page.locator(".savings-transfer").innerText(), /350\s€ chaque mois/);
    assert.equal(await page.locator(".savings-loose-title").count(), 0, "nothing left apart");
    assert.deepEqual(await axe(page), [], `${width} envelopes: accessibility`);

    // The monthly transfer is a recurrence of the everyday account.
    await nav.getByRole("button", { name: mobile ? "Budget" : /^Récurrences/ }).click();
    if (mobile) await page.getByRole("navigation", { name: "Budget" }).getByRole("button", { name: "Récurrences" }).click();
    await page.getByText("Virement vers Livret d’épargne").first().waitFor();

    if (mobile) {
      await nav.getByRole("button", { name: "Accueil" }).click();
      const tile = page.locator(".home-tile-savings");
      await tile.waitFor();
      assert.match(await tile.innerText(), /Épargne · Livret d’épargne[\s\S]*4\s250,00\s€/);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width} ${theme}: livret, envelopes from goals, monthly transfer, home tile, axe`);
  }
} finally {
  await browser.close();
}
