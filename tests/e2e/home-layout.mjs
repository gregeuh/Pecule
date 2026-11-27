import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { chromiumOptions, waitForWallet } from "./ui-helpers.mjs";

/** iPhone home: blocks moved, removed and put back, default home again; a big card folded and remembered. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const output = process.env.PECULE_E2E_OUTPUT || "outputs/home-layout";
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
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "fr-FR",
      reducedMotion: "reduce",
    });
    await context.addInitScript((t) => localStorage.setItem("pecule-theme", t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin);
    await waitForWallet(page);
    const order = () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".home-tiles-layout > .home-block")]
          .filter((b) => b.childElementCount)
          .map((b) =>
            b.querySelector(".home-tiles")
              ? "tuiles"
              : b.querySelector(".clarte-recent")
                ? "operations"
                : b.querySelector(".home-forecast")
                  ? "previsions"
                  : b.querySelector(".wallet-capture")
                    ? "saisie"
                    : "autre",
          ),
      );
    assert.deepEqual((await order()).filter((x) => x !== "autre"), ["tuiles", "operations", "previsions", "saisie"]);

    // « Mon accueil »: operations up, forecasts removed, then saved.
    await page.getByRole("button", { name: "Modifier l’accueil" }).click();
    const editor = page.locator(".home-layout-editor");
    await editor.waitFor();
    assert.deepEqual(await axe(page), [], `${theme} editor: accessibility`);
    await editor.getByRole("button", { name: "Monter « Dernières opérations »" }).click();
    await editor.getByRole("button", { name: "Retirer « Prévisions et calcul »" }).click();
    await editor.locator(".home-layout-hidden").getByRole("button", { name: "Prévisions et calcul" }).waitFor();
    await page.screenshot({ path: `${output}/${theme}-editeur.png` });
    await editor.getByRole("button", { name: "Terminé" }).click();
    await editor.waitFor({ state: "detached" });
    assert.deepEqual((await order()).filter((x) => x !== "autre"), ["operations", "tuiles", "saisie"]);

    // Back to the default home.
    await page.getByRole("button", { name: "Modifier l’accueil" }).click();
    await editor.getByRole("button", { name: "Revenir à l’accueil par défaut" }).click();
    await editor.getByRole("button", { name: "Terminé" }).click();
    await editor.waitFor({ state: "detached" });
    assert.deepEqual((await order()).filter((x) => x !== "autre"), ["tuiles", "operations", "previsions", "saisie"]);

    // A big card folds to one line and stays folded.
    await page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("button", { name: "Budget" }).click();
    await page.getByRole("navigation", { name: "Budget" }).getByRole("button", { name: "Récurrences" }).click();
    await page.locator(".page-heading button.primary").click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="label"]').fill("Loyer");
    await dialog.locator('input[name="amount"]').fill("770");
    await dialog.getByRole("button", { name: "Enregistrer la récurrence", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("button", { name: "Accueil" }).click();
    const check = page.locator(".home-tiles-layout .budget-check").first();
    await check.waitFor();
    await check.getByRole("button", { name: /^Réduire/ }).click();
    assert.equal(await check.getAttribute("data-collapsed"), "true");
    assert(await check.locator(".budget-check-summary").isVisible());
    assert(!(await check.locator(".budget-check-body").isVisible()));
    await page.screenshot({ path: `${output}/${theme}-replie.png` });
    assert.deepEqual(await axe(page), [], `${theme} folded card: accessibility`);
    await check.getByRole("button", { name: /^Déplier/ }).click();
    assert(await check.locator(".budget-check-body").isVisible());
    await check.getByRole("button", { name: /^Réduire/ }).click();
    const stored = await page.evaluate(() => localStorage.getItem("pecule-collapsed"));
    assert.match(stored ?? "", /check:rules:/);

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS 390 ${theme}: move, remove, put back, default home, folded card remembered, axe`);
  }
} finally {
  await browser.close();
}
