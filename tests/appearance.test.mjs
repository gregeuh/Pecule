import test from "node:test";
import assert from "node:assert/strict";
import {
  appearanceChoices,
  choiceToStorage,
  paletteBootstrap,
  readPalette,
  storageToChoice,
} from "../lib/appearance.ts";

test("legacy light and dark map to Pêche and Nuit", () => {
  assert.equal(storageToChoice("light", null), "peche");
  assert.equal(storageToChoice("dark", null), "nuit");
  assert.equal(storageToChoice("light", "menthe"), "menthe");
  assert.equal(storageToChoice("system", "menthe"), "auto");
  assert.equal(storageToChoice(null, null), "auto");
});

test("a light palette sets light mode, Nuit sets dark, auto keeps the palette", () => {
  assert.deepEqual(choiceToStorage("lavande", "peche"), { mode: "light", palette: "lavande" });
  assert.deepEqual(choiceToStorage("nuit", "ocean"), { mode: "dark", palette: "ocean" });
  assert.deepEqual(choiceToStorage("auto", "menthe"), { mode: "system", palette: "menthe" });
});

test("unknown palettes fall back to Pêche; choices are listed in order", () => {
  assert.equal(readPalette("rose"), "peche");
  assert.equal(readPalette(null), "peche");
  assert.equal(readPalette("ocean"), "ocean");
  assert.deepEqual(
    appearanceChoices.map((c) => c.label),
    ["Pêche", "Lavande", "Menthe", "Océan", "Nuit", "Automatique"],
  );
});

test("the bootstrap sets the palette and never throws without storage", () => {
  const doc = { documentElement: { dataset: {} } };
  assert.doesNotThrow(() => new Function("document", "localStorage", paletteBootstrap)(doc, undefined));
  assert.equal(doc.documentElement.dataset.palette, "peche");
  const doc2 = { documentElement: { dataset: {} } };
  new Function("document", "localStorage", paletteBootstrap)(doc2, { getItem: () => "lavande" });
  assert.equal(doc2.documentElement.dataset.palette, "lavande");
});

test("each light palette has its status bar colour; the bootstrap applies it", async () => {
  const { paletteThemeColor } = await import("../lib/appearance.ts");
  assert.equal(paletteThemeColor("lavande"), "#efeaff");
  assert.equal(paletteThemeColor("ocean"), "#dbe7f3");
  assert.equal(paletteThemeColor("rose"), "#fbeee3");
  const meta = { content: "#fbeee3" };
  const doc = {
    documentElement: { dataset: {} },
    querySelector: (s) => (/theme-color/.test(s) && /light/.test(s) ? meta : null),
  };
  new Function("document", "localStorage", paletteBootstrap)(doc, { getItem: () => "menthe" });
  assert.equal(meta.content, "#e8f5ef");
});

test("reduced transparency is remembered per device and applied before the first paint", async () => {
  const { TRANSPARENCY_KEY } = await import("../lib/appearance.ts");
  assert.equal(TRANSPARENCY_KEY, "pecule-transparency");
  const doc = { documentElement: { dataset: {} }, querySelector: () => null };
  new Function("document", "localStorage", paletteBootstrap)(doc, {
    getItem: (k) => (k === TRANSPARENCY_KEY ? "reduced" : null),
  });
  assert.equal(doc.documentElement.dataset.transparency, "reduced");
  const plain = { documentElement: { dataset: {} }, querySelector: () => null };
  new Function("document", "localStorage", paletteBootstrap)(plain, { getItem: () => null });
  assert.equal(plain.documentElement.dataset.transparency, undefined);
});
