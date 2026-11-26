import test from "node:test";
import assert from "node:assert/strict";
import { piggyMood, shouldCelebrate } from "../lib/piggy.ts";

test("the piggy worries only when the period is tight or negative", () => {
  assert.equal(piggyMood("comfort"), "calm");
  assert.equal(piggyMood("attention"), "worried");
  assert.equal(piggyMood("negative"), "worried");
  assert.equal(piggyMood(null), "calm");
});

test("the piggy celebrates a saving in the same budget, never a budget switch", () => {
  assert.equal(shouldCelebrate(1000, 1500, "a", "a"), true);
  assert.equal(shouldCelebrate(1500, 1500, "a", "a"), false);
  assert.equal(shouldCelebrate(1500, 1000, "a", "a"), false);
  assert.equal(shouldCelebrate(1000, 1500, "b", "a"), false);
  assert.equal(shouldCelebrate(null, 1500, "a", null), false);
});
