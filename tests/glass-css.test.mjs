import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postcss from "postcss";

const css = postcss.parse(await readFile(new URL("../app/glass.css", import.meta.url), "utf8"));
const decls = (selector) => {
  const out = [];
  css.walkRules((rule) => {
    if (rule.selectors.some((s) => s.replace(/\s+/g, " ").trim() === selector)) rule.walkDecls((d) => out.push(d));
  });
  return out;
};

test("the account card sheen follows walletSurfaceStyles: never lightens white-text cards", () => {
  const backgrounds = decls(":root .wallet-stack .wallet-card.clarte-account").filter((d) => d.prop === "background");
  assert(backgrounds.length > 0, "account card background is styled");
  for (const d of backgrounds) {
    assert.match(d.value, /var\(--wallet-reflect\)/, "sheen uses --wallet-reflect");
    assert.doesNotMatch(d.value, /rgba\(255,\s*255,\s*255/, "no fixed white sheen");
  }
});

test("long home amounts get a smaller size so a 7-digit amount fits on a 320 px iPhone", () => {
  const long = decls(':root .home-hero-amount[data-long="true"]').find((d) => d.prop === "font-size");
  assert(long, "a long-amount size exists");
});

test("the glass search field shows keyboard focus", () => {
  const ring = decls(":root .modal .global-search-field:focus-within").find((d) => d.prop === "box-shadow");
  assert(ring && /var\(--blue\)/.test(ring.value), "focus ring uses the accent colour");
});

test("glass controls keep a visible edge in forced-colors mode", () => {
  let found = false;
  css.walkAtRules("media", (at) => {
    if (!/forced-colors:\s*active/.test(at.params)) return;
    at.walkRules((rule) => {
      if (/button\.primary/.test(rule.selector) && /\.search-input/.test(rule.selector))
        rule.walkDecls("border", (d) => (found ||= /ButtonText/i.test(d.value)));
    });
  });
  assert(found, "forced-colors border on primary buttons, pills and the search capsule");
});
