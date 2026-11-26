import assert from "node:assert/strict";
import { chromium } from "playwright";
import { chromiumOptions, waitForWallet } from "./ui-helpers.mjs";

/** Liquid Glass themes: five palettes and Automatique, chosen in Réglages, kept per device, no flash, readable. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch(chromiumOptions);
const checks = [];
const html = (page, name) => page.evaluate((n) => document.documentElement.getAttribute(n), name);
const axe = async (page) => {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
    return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
};
try {
  for (const width of [390, 1440]) {
    const mobile = width <= 760;
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, locale: "fr-FR", reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const settings = async () => {
      await page.getByRole("button", { name: "Réglages" }).first().click();
      await page.getByRole("radiogroup", { name: "Thème" }).waitFor();
    };
    await page.goto(origin);
    await waitForWallet(page);
    assert.equal(await html(page, "data-palette"), "peche", "Pêche by default");
    await settings();
    for (const [name, palette] of [["Lavande", "lavande"], ["Menthe", "menthe"], ["Océan", "ocean"], ["Pêche", "peche"]]) {
      await page.getByRole("radio", { name }).check();
      assert.equal(await html(page, "data-palette"), palette, `${name} applied at once`);
      assert.equal(await html(page, "data-theme"), "light");
      assert.deepEqual(await axe(page), [], `${name} settings: accessibility`);
      await page.getByRole("button", { name: mobile ? "Accueil" : /^Vue d’ensemble/ }).first().click();
      await page.locator(".home-hero").waitFor();
      await page.waitForTimeout(900);
      assert.deepEqual(await axe(page), [], `${name} home: accessibility`);
      await settings();
    }
    await page.getByRole("radio", { name: "Lavande" }).check();
    await page.reload();
    await waitForWallet(page);
    assert.equal(await html(page, "data-palette"), "lavande", "kept after reload");
    await settings();
    assert.equal(await page.getByRole("radio", { name: "Lavande" }).isChecked(), true);
    await page.getByRole("radio", { name: "Nuit" }).check();
    assert.equal(await html(page, "data-theme"), "dark", "Nuit is the dark theme");
    assert.deepEqual(await axe(page), [], "Nuit settings: accessibility");
    await page.getByRole("button", { name: mobile ? "Accueil" : /^Vue d’ensemble/ }).first().click();
    await page.locator(".home-hero").waitFor();
    await page.waitForTimeout(900);
    assert.deepEqual(await axe(page), [], "Nuit home: accessibility");
    await settings();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("radio", { name: "Automatique" }).check();
    assert.equal(await html(page, "data-theme"), "dark", "Automatique follows a dark device");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    assert.equal(await html(page, "data-palette"), "lavande", "Automatique keeps the last light palette by day");
    assert.deepEqual(errors, []);
    await context.close();

    // A person who chose « Sombre » before the redesign finds Nuit, without a flash of another palette.
    const legacy = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, locale: "fr-FR", reducedMotion: "reduce" });
    await legacy.addInitScript(() => { try { localStorage.setItem("pecule-theme", "dark"); } catch {} });
    const old = await legacy.newPage();
    await old.goto(origin);
    assert.equal(await html(old, "data-theme"), "dark");
    assert.equal(await html(old, "data-palette"), "peche");
    await waitForWallet(old);
    await old.getByRole("button", { name: "Réglages" }).first().click();
    assert.equal(await old.getByRole("radio", { name: "Nuit" }).isChecked(), true, "legacy dark shows as Nuit");
    await legacy.close();
    checks.push(`PASS ${width}: palettes, Nuit, Automatique, reload, legacy dark, axe`);
  }
  console.log(checks.join("\n"));
} finally {
  await browser.close();
}
