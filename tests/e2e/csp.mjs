import assert from "node:assert/strict";
import { chromium } from "playwright";
import { chromiumOptions, openOperationComposer, waitForWallet } from "./ui-helpers.mjs";

/** Content Security Policy (Report-Only, issue #11): no page or interaction may raise a violation. */
const origin = process.env.PECULE_E2E_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch(chromiumOptions);
const violations = [];
try {
  for (const width of [390, 1440]) {
    const mobile = width <= 760;
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, locale: "fr-FR" });
    const page = await context.newPage();
    page.on("console", (m) => {
      if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) violations.push(`${width} console: ${m.text().slice(0, 220)}`);
    });
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/api/csp-report") violations.push(`${width} report: ${r.postData()?.slice(0, 220)}`);
    });
    const response = await page.goto(origin);
    const policy = response.headers()["content-security-policy-report-only"] ?? "";
    assert.match(policy, /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/, "nonce policy on pages");
    await waitForWallet(page);
    await openOperationComposer(page);
    await page.locator("input[name=label]").fill("Contrôle CSP");
    await page.locator("input[name=amount]").fill("3.20");
    await page.getByRole("button", { name: "Enregistrer l’opération", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Rechercher dans Pécule" }).first().click();
    await page.getByRole("searchbox").fill("café");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Réglages" }).first().click();
    await page.getByRole("radio", { name: "Lavande" }).check();
    await page.reload();
    await waitForWallet(page);
    for (const path of ["/sign-in", "/forgot-password"]) {
      await page.goto(origin + path);
      await page.waitForLoadState("networkidle");
    }
    await page.waitForTimeout(1500);
    await context.close();
  }
  assert.deepEqual(violations, [], "no CSP violation");
  console.log("PASS no CSP violation on home, capture, search, settings, reload, sign-in, forgot password (390, 1440)");
} finally {
  await browser.close();
}
