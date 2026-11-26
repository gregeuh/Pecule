import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { chromiumOptions, waitForWallet } from "./ui-helpers.mjs";

/** Noms lisibles: names proposed at import, the bank label kept on the operation, re-import still recognised. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const output = process.env.PECULE_E2E_OUTPUT || "outputs/readable-names";
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
    // History rows dated on the demo account's reference day: always valid, whatever today is.
    const day = await page.evaluate(() => {
      const d = new Date();
      return `01/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    });
    const csv = `${output}/releve-${width}.csv`;
    await writeFile(
      csv,
      `Date;Libellé;Montant\n${day};PRLV SEPA ASSURANCE LCL;-16,96\n${day};CB EUROPCAR INTERNATIO 16/11;-49,50\n${day};VIR SEPA M DUPONT PAPA;100,00\n${day};Café du coin;-3,20\n`,
    );
    const add = page.locator(mobile ? ".mobile-add" : ".floating-action-trigger");
    const openImport = async () => {
      await add.click();
      if (mobile)
        await page.getByRole("navigation", { name: "Ajouter autre chose" }).getByRole("button", { name: "Import CSV" }).click();
      else await page.getByRole("button", { name: /Un import CSV/ }).click();
      await page.getByRole("dialog").locator("input[type=file]").setInputFiles(csv);
      await page.locator("select[name=bank-balance-mode]").selectOption("history");
    };
    await openImport();
    await page.getByRole("button", { name: /Vérifier 4 opérations/ }).click();
    const names = page.locator(".import-names");
    await names.waitFor();
    // Three bank labels get a name; the hand-written one is left alone.
    assert.equal(await names.locator("li").count(), 3);
    assert.equal(await names.getByRole("textbox", { name: "Nom pour « PRLV SEPA ASSURANCE LCL »" }).inputValue(), "Assurance LCL");
    assert.equal(await names.getByRole("textbox", { name: "Nom pour « CB EUROPCAR INTERNATIO 16/11 »" }).inputValue(), "Europcar");
    await names.getByRole("textbox", { name: "Nom pour « VIR SEPA M DUPONT PAPA »" }).fill("Virement de Papa");
    await names.getByRole("checkbox", { name: "Renommer « CB EUROPCAR INTERNATIO 16/11 »" }).uncheck();
    assert.deepEqual(await axe(page), [], `${width} import names: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-import.png`, fullPage: false });
    await page.getByRole("checkbox", { name: /Je confirme le compte/ }).check();
    await page.getByRole("button", { name: /Importer 4 opérations/ }).click();
    await page.getByRole("button", { name: "Fermer le bilan", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });

    const nav = page.getByRole("navigation", { name: mobile ? "Navigation mobile" : "Navigation principale" });
    await nav.getByRole("button", { name: /^Opérations/ }).click();
    await page.locator(".date-block").first().waitFor();
    const list = await page.locator(".transactions-card").innerText();
    for (const label of ["Assurance LCL", "Virement de Papa", "CB EUROPCAR INTERNATIO 16/11", "Café du coin"])
      assert.match(list, new RegExp(label.replace(/[/]/g, "\\/")), `${label} listed`);
    assert.doesNotMatch(list, /PRLV SEPA/);

    // The operation keeps its bank label, and can go back to it.
    await page.locator(".transactions-card").getByText("Assurance LCL", { exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator(".bank-label-origin").waitFor();
    assert.match(await dialog.locator(".bank-label-origin").innerText(), /PRLV SEPA ASSURANCE LCL/);
    assert.deepEqual(await axe(page), [], `${width} operation bank label: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-operation.png` });
    await dialog.getByRole("button", { name: /Revenir au libellé d’origine/ }).click();
    assert.equal(await dialog.locator('input[name="label"]').inputValue(), "PRLV SEPA ASSURANCE LCL");
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });

    // Réglages: the label left as is at import can be renamed later.
    await page.getByRole("button", { name: "Réglages" }).first().click();
    const offer = page.getByRole("button", { name: "Rendre lisible 1 libellé" });
    await offer.scrollIntoViewIfNeeded();
    await offer.click();
    const sheet = page.locator(".readable-names-sheet");
    await sheet.waitFor();
    assert.equal(
      await sheet.getByRole("textbox", { name: "Nom pour « CB EUROPCAR INTERNATIO 16/11 »" }).inputValue(),
      "Europcar",
    );
    assert.deepEqual(await axe(page), [], `${width} settings names: accessibility`);
    await page.screenshot({ path: `${output}/${width}-${theme}-settings.png` });
    await sheet.getByRole("button", { name: "Renommer 1 libellé" }).click();
    await sheet.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Tous vos libellés sont lisibles" }).waitFor();

    // The same statement again: every line is recognised as already there, renamed or not.
    await openImport();
    assert.equal(await page.locator(".import-row input:disabled").count(), 4);
    await page.getByRole("button", { name: "Fermer", exact: true }).click();

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width} ${theme}: names at import, bank label kept and restorable, re-import recognised, axe`);
  }
} finally {
  await browser.close();
}
