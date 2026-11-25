import test from "node:test";
import assert from "node:assert/strict";
import { demoBudget, overview } from "../lib/budget.ts";
import { reserveLines, roundedAxis } from "../lib/budget-presentation.ts";
test("explanatory reserves sum to the existing canonical total and never modify the budget", () => {
  const today = "2026-10-31",
    b = demoBudget(today);
  b.settings.reserve = 5000;
  b.transactions.push({
    id: "contribution",
    label: "Projet",
    amount: 10000,
    date: "2026-10-05",
    accountId: "demo-s",
    category: "Virement",
    note: "",
    goalId: "demo-g1",
  });
  const snapshot = structuredClone(b),
    rows = reserveLines(b, today);
  assert.equal(
    rows.reduce((n, r) => n + r.amount, 0),
    overview(b, today).reserve,
  );
  assert.equal(rows.find((r) => r.id === "demo-g1").amount, 5000);
  assert.deepEqual(b, snapshot);
});
test("axis labels are rounded, ordered and bound positive, negative and mixed projections", () => {
  for (const [a, b] of [
    [0, 457400],
    [-100400, 457400],
    [-900000, 0],
    [0, 11500],
    [-1e12, 1e12],
  ]) {
    const axis = roundedAxis(a, b);
    assert(axis.min <= a && axis.max >= b);
    assert(axis.step >= 100);
    assert.equal(axis.ticks[0], axis.max);
    assert.equal(axis.ticks.at(-1), axis.min);
    assert(axis.ticks.length <= 8);
    assert(axis.ticks.every((n, i) => !i || axis.ticks[i - 1] - n === axis.step));
  }
});

test("goal progress shows the same whole percent everywhere, rounded down", async () => {
  const { goalProgress } = await import("../lib/budget-presentation.ts");
  assert.deepEqual(goalProgress(125000, 200000), { share: 62.5, percent: 62 });
  assert.equal(goalProgress(199999, 200000).percent, 99);
  assert.equal(goalProgress(200000, 200000).percent, 100);
  assert.equal(goalProgress(250000, 200000).share, 100);
  assert.equal(goalProgress(-10, 200000).share, 0);
  assert.equal(goalProgress(100, 0).share, 0);
});
