import test from "node:test";
import assert from "node:assert/strict";
import { COUNT_UP_MS, countUpValue } from "../lib/count-up.ts";

test("amounts roll from the shown value to the new one, ease out, in whole cents", () => {
  assert.equal(countUpValue(0, 10000, 0), 0);
  assert.equal(countUpValue(0, 10000, 1), 10000);
  assert.equal(countUpValue(0, 10000, 0.5), 8750);
  assert.equal(countUpValue(-500, 500, 2), 500);
  assert.equal(countUpValue(500, -500, -1), 500);
  assert(Number.isInteger(countUpValue(3, 117742, 0.37)));
  assert.equal(COUNT_UP_MS, 700);
});
