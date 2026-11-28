import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { chromiumOptions, waitForWallet } from "./ui-helpers.mjs";

/**
 * Opérations absentes du relevé: a recurrence Pécule counted by itself and that the imported statement does not show
 * is flagged after the import, in Opérations and on the home; « Retirer » gives the money back; the setting makes
 * Pécule wait for the statement.
 */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const output = process.env.PECULE_E2E_OUTPUT || "outputs/statement-check";
await mkdir(output, { recursive: true });
const browser = await chromium.launch(chromiumOptions);
const axe = async (page) => {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
    return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
};
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const day = now.getDate();
if (day < 7) {
  console.log("SKIP statement-check: needs a week of the month behind today");
  process.exit(0);
}
const iso = (d) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
const fr = (d) => `${pad(d)}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
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
    const dialog = page.getByRole("dialog");

    // A gas bill on the 2nd: Pécule records it by itself on its date.
    await nav.getByRole("button", { name: mobile ? "Budget" : /^Récurrences/ }).click();
    if (mobile)
      await page.getByRole("navigation", { name: "Budget" }).getByRole("button", { name: "Récurrences" }).click();
    await page.locator(".rule-card").first().waitFor();
    await page.locator(".page-heading button.primary").click();
    await dialog.locator('input[name="label"]').fill("Gaz de Bordeaux");
    await dialog.locator('input[name="amount"]').fill("66");
    await dialog.locator('input[name="day"]').fill("2");
    await dialog.locator('input[name="date"]').fill(iso(2));
    await dialog.getByRole("button", { name: "Enregistrer la récurrence", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });

    // The statement covers the 2nd to today, without the gas bill.
    const csv = `${output}/releve-${width}.csv`;
    await writeFile(csv, `Date;Libellé;Montant\n${fr(2)};CARREFOUR CITY;-32,40\n${fr(day)};COIFFEUR;-28,00\n`);
    await page.locator(mobile ? ".mobile-add" : ".floating-action-trigger").click();
    if (mobile)
      await page.getByRole("navigation", { name: "Ajouter autre chose" }).getByRole("button", { name: "Import CSV" }).click();
    else await page.getByRole("button", { name: /Un import CSV/ }).click();
    await dialog.locator("input[type=file]").setInputFiles(csv);
    await page.locator("select[name=bank-balance-mode]").selectOption("new");
    await page.getByRole("button", { name: /Vérifier 2 opérations/ }).click();
    await page.getByRole("checkbox", { name: /Je confirme le compte/ }).check();
    await page.getByRole("button", { name: /Importer 2 opérations/ }).click();
    const after = page.locator(".statement-after-import");
    await after.waitFor();
    assert.match(await after.innerText(), /1 opération ajoutée par Pécule n’est pas sur ce relevé/);
    assert.match(await after.innerText(), /Gaz de Bordeaux/);
    await page.screenshot({ path: `${output}/${width}-${theme}-apres-import.png` });
    await after.getByRole("button", { name: "La vérifier" }).click();

    // « Pas sur votre relevé »
    const sheet = page.locator(".not-on-statement");
    await sheet.waitFor();
    assert.equal(await sheet.locator(".not-on-statement-list > li").count(), 1);
    assert.match(await sheet.innerText(), /Gaz de Bordeaux/);
    assert.deepEqual(await axe(page), [], `${width} sheet: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-pas-sur-releve.png` });
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });

    // Opérations: badges, the filter and the banner.
    await nav.getByRole("button", { name: /^Opérations/ }).click();
    const card = page.locator(".transactions-card");
    await card.locator(".statement-banner").waitFor();
    const gas = card.locator(".transaction-row").filter({ hasText: "Gaz de Bordeaux" });
    await gas.locator(".origin-badge[data-kind=missing]").waitFor();
    await card.getByRole("button", { name: /Ajoutées par Pécule · 1/ }).click();
    assert.equal(await card.locator(".transaction-row").count(), 1);
    assert.deepEqual(await axe(page), [], `${width} operations: accessibility`);
    await card.locator(".origin-filter").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${width}-${theme}-operations.png` });
    await gas.screenshot({ path: `${output}/${width}-${theme}-ligne.png` });

    // On the home too; « Retirer » gives the 66 € back.
    await nav.getByRole("button", { name: mobile ? "Accueil" : /^Vue d’ensemble/ }).click();
    const check = page.locator(".budget-check").filter({ hasText: "1 opération pas sur votre relevé" });
    await check.waitFor();
    await check.getByRole("button", { name: "La vérifier" }).click();
    await sheet.getByRole("button", { name: "Retirer", exact: true }).click();
    await sheet.locator(".budget-checks-done").waitFor();
    assert.match(await sheet.innerText(), /66,00\s€ rendus au solde/);

    // The setting: wait for the statement from now on.
    await sheet.getByRole("button", { name: /Ne plus ajouter une récurrence avant de la voir sur le relevé/ }).click();
    const setting = page.locator(".past-recurrences");
    await setting.waitFor();
    await setting.getByRole("radio", { name: /Quand elle apparaît sur le relevé/ }).check();
    await page.locator(".past-recurrences-choice[data-selected]").filter({ hasText: "Quand elle apparaît" }).waitFor();
    assert.deepEqual(await axe(page), [], `${width} setting: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-reglage.png` });
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.locator(".budget-check").filter({ hasText: "pas sur votre relevé" }).count(), 0);

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width} ${theme}: after import, sheet, operations badges, home check, remove, setting, axe`);
  }
} finally {
  await browser.close();
}
