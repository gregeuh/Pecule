import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_BLOCKS,
  hideBlock,
  isDefaultLayout,
  moveBlock,
  normalizeLayout,
  showBlock,
  visibleBlocks,
} from "../lib/home-layout.ts";

test("the default home shows every block in the usual order", () => {
  assert.deepEqual(visibleBlocks(undefined, false), [...HOME_BLOCKS]);
  assert(isDefaultLayout(undefined));
});

test("blocks move, hide and come back", () => {
  let l = moveBlock(DEFAULT_HOME_LAYOUT, "tuiles", -1);
  assert.deepEqual(visibleBlocks(l, false).slice(0, 4), ["conseils", "alertes", "tuiles", "verifications"]);
  l = hideBlock(l, "alertes");
  assert(!visibleBlocks(l, false).includes("alertes"));
  // Moving skips hidden blocks: « tuiles » goes above « conseils » directly.
  l = moveBlock(l, "tuiles", -1);
  assert.deepEqual(visibleBlocks(l, false).slice(0, 2), ["tuiles", "conseils"]);
  l = showBlock(l, "alertes");
  assert.equal(visibleBlocks(l, false).at(-1), "alertes");
  assert(!isDefaultLayout(l));
  assert(isDefaultLayout(DEFAULT_HOME_LAYOUT));
});

test("a warning that money runs out shows even when the advice block was removed", () => {
  const l = hideBlock(DEFAULT_HOME_LAYOUT, "conseils");
  assert(!visibleBlocks(l, false).includes("conseils"));
  assert(visibleBlocks(l, true).includes("conseils"));
});

test("a stored layout from another version is repaired", () => {
  const l = normalizeLayout({ order: ["operations", "inconnu", "tuiles", "tuiles"], hidden: ["saisie", "x"] });
  assert.deepEqual(l.hidden, ["saisie"]);
  assert.equal(l.order.length, HOME_BLOCKS.length);
  assert.deepEqual(l.order.slice(0, 2), ["conseils", "alertes"]);
  assert(l.order.indexOf("operations") < l.order.indexOf("tuiles"));
});
