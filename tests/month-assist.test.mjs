import test from "node:test";
import assert from "node:assert/strict";
import { demoBudget, futureTransactions, overview, accountBalance } from "../lib/budget.ts";
import { paydaySavings, recordPaydaySavings, tightPeriod, postponeExpense } from "../lib/month-assist.ts";

test("no payday proposal before the salary arrives", () => {
  assert.equal(paydaySavings(demoBudget("2026-11-25"), "2026-11-25"), null);
});

test("on payday, the monthly savings of each goal are proposed and recorded as transfers", () => {
  const today = "2026-11-30",
    b = demoBudget("2026-11-25");
  const plan = paydaySavings(b, today);
  assert(plan);
  assert.equal(plan.salary.date, today);
  assert.equal(plan.from.id, "demo-c");
  assert.equal(plan.to.id, "demo-s");
  assert.deepEqual(
    plan.items.map((i) => [i.goal.id, i.amount]),
    [
      ["demo-g1", 15000],
      ["demo-g2", 20000],
    ],
  );
  let n = 0;
  const next = recordPaydaySavings(b, plan, today, () => "id" + n++);
  assert.equal(next.transactions.length, b.transactions.length + 4);
  assert.equal(next.goals.find((g) => g.id === "demo-g1").saved, 125000 + 15000);
  assert.equal(accountBalance(next, "demo-s", today), accountBalance(b, "demo-s", today) + 35000);
  assert.equal(accountBalance(next, "demo-c", today), accountBalance(b, "demo-c", today) - 35000);
  assert.equal(paydaySavings(next, today), null, "nothing left to propose once recorded");
  assert.equal(b.goals[0].saved, 125000, "the original budget is untouched");
});

test("a partial contribution is deducted and a goal never goes past its target", () => {
  const today = "2026-11-30",
    b = demoBudget("2026-11-25");
  b.transactions.push({
    id: "c1",
    label: "Épargne",
    amount: 5000,
    date: "2026-11-10",
    accountId: "demo-s",
    category: "Virement",
    note: "",
    transferId: "t",
    goalId: "demo-g1",
  });
  b.goals[1].saved = b.goals[1].target - 3000;
  const plan = paydaySavings(b, today);
  assert.deepEqual(
    plan.items.map((i) => i.amount),
    [10000, 3000],
  );
});

test("no payday proposal without a savings account", () => {
  const b = demoBudget("2026-11-25");
  b.accounts = b.accounts.filter((a) => a.type !== "savings");
  assert.equal(paydaySavings(b, "2026-11-30"), null);
});

test("tight period: nothing while comfortable, largest expenses first otherwise", () => {
  const today = "2026-11-25",
    b = demoBudget(today);
  assert.equal(tightPeriod(b, today), null);
  b.settings.dailyComfortCents = 50000;
  const tight = tightPeriod(b, today);
  assert(tight);
  assert.equal(tight.tone, "attention");
  assert.deepEqual(
    tight.items.map((t) => t.label),
    ["Loyer", "Forfait mobile"],
  );
  assert.equal(tight.moveTo, "2026-11-30");
  assert.equal(tight.gap, 50000 * 5 - 117742);
});

test("postponing a recurrence moves only that date and frees the period", () => {
  const today = "2026-11-25",
    b = demoBudget(today);
  b.settings.dailyComfortCents = 50000;
  const tight = tightPeriod(b, today);
  const rent = tight.items[0];
  const next = postponeExpense(b, rent, tight.moveTo);
  assert.equal(overview(next, today).available, overview(b, today).available + 78000);
  const dates = futureTransactions(next, "2026-11-26", "2027-01-31")
    .filter((t) => t.ruleId === "demo-rent")
    .map((t) => t.date);
  assert.deepEqual(dates, ["2026-11-30", "2026-12-27", "2027-01-27"]);
  assert.equal(b.rules.find((r) => r.id === "demo-rent").excludedDates.length, 0, "the original budget is untouched");
});
