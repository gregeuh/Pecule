import test from "node:test";
import assert from "node:assert/strict";
import { accountBalance, emptyBudget, futureTransactions, overview } from "../lib/budget.ts";
import { budgetSchema } from "../lib/validation.ts";
import {
  averageMonthlyGrowth,
  averageMonthlySpending,
  balanceHistory,
  cushionMonths,
  envelopes,
  monthChange,
  moveGoalsToSavings,
} from "../lib/savings.ts";

const op = (id, accountId, amount, date, extra = {}) => ({
  id,
  label: id,
  amount,
  date,
  accountId,
  category: amount > 0 ? "Salaire" : "Alimentation",
  note: "",
  ...extra,
});
const budget = () => {
  const b = emptyBudget("Test");
  b.accounts = [
    {
      id: "c",
      name: "Courant",
      bank: "",
      type: "current",
      openingBalance: 200000,
      openingDate: "2026-06-30",
      color: "#245af3",
    },
    {
      id: "l",
      name: "Livret A",
      bank: "",
      type: "savings",
      openingBalance: 365000,
      openingDate: "2026-06-30",
      color: "#f0b43c",
    },
  ];
  b.transactions = [
    // Money put aside each month, as transfer pairs.
    ...[
      ["2026-07-05", 15000],
      ["2026-08-05", 8000],
      ["2026-09-05", 12000],
      ["2026-10-03", 10000],
      ["2026-11-02", 15000],
    ].flatMap(([date, n], i) => [
      op(`out${i}`, "c", -n, date, { transferId: `t${i}`, category: "Virement" }),
      op(`in${i}`, "l", n, date, { transferId: `t${i}`, category: "Virement" }),
    ]),
    op("food-aug", "c", -90000, "2026-08-12"),
    op("food-sep", "c", -120000, "2026-09-12"),
    op("food-oct", "c", -150000, "2026-10-12"),
    op("aside", "c", -5000, "2026-10-20", { category: "Épargne" }),
  ];
  b.goals = [
    {
      id: "g1",
      name: "Vacances",
      target: 120000,
      saved: 50000,
      monthly: 10000,
      color: "#7141c6",
      icon: "sun",
      deadline: "",
    },
    {
      id: "g2",
      name: "Voiture",
      target: 300000,
      saved: 30000,
      monthly: 5000,
      color: "#08734e",
      icon: "home",
      deadline: "",
    },
  ];
  return b;
};

test("history, month change and average growth of the livret", () => {
  const b = budget();
  const history = balanceHistory(b, "l", "2026-11-26");
  assert.deepEqual(
    history.map((h) => h.month),
    ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"],
  );
  assert.equal(history[0].balance, 365000);
  assert.equal(history.at(-1).balance, 365000 + 60000);
  assert.equal(monthChange(b, "l", "2026-11-26"), 15000);
  assert.equal(averageMonthlyGrowth(history), 12000);
});

test("the cushion counts everyday spending of the last three complete months, never transfers nor savings", () => {
  const b = budget();
  assert.equal(averageMonthlySpending(b, "2026-11-26"), 120000);
  assert.equal(cushionMonths(425000, 120000), 3.5);
  assert.equal(cushionMonths(425000, 0), null);
});

test("goals become envelopes; their reserves become one monthly transfer to the livret", () => {
  const b = budget();
  const next = moveGoalsToSavings(b, "l", {
    goalIds: ["g1", "g2"],
    transfer: { fromAccountId: "c", day: 5, id: "rule-livret", today: "2026-11-26" },
  });
  assert(next.goals.every((g) => g.accountId === "l" && g.monthly === 0));
  const rule = next.rules[0];
  assert.equal(rule.amount, -15000);
  assert.equal(rule.toAccountId, "l");
  assert.equal(rule.startDate, "2026-12-05");
  assert(budgetSchema.safeParse(next).success, JSON.stringify(budgetSchema.safeParse(next).error?.issues));
  const e = envelopes(next, next.accounts[1], "2026-11-26");
  assert.equal(e.allocated, 80000);
  assert.equal(e.free, 425000 - 80000);
  // The reserve no longer lowers what is left to spend; the planned transfer does, once it falls in the period.
  assert.equal(overview(next, "2026-11-26").reserve, 0);
  assert.equal(overview(b, "2026-11-26").reserve, 15000);
  // The transfer reaches the livret: one departure, one arrival, on the same day.
  const december = futureTransactions(next, "2026-12-01", "2026-12-31");
  assert.deepEqual(
    december.map((t) => [t.accountId, t.amount]),
    [
      ["c", -15000],
      ["l", 15000],
    ],
  );
  assert.equal(accountBalance(next, "l", "2027-01-10") - accountBalance(next, "l", "2026-11-26"), 30000);
});

test("an envelope needs no target, a loose goal does; a transfer goes to a savings account", () => {
  const b = budget();
  b.goals[1] = { ...b.goals[1], target: 0, accountId: "l" };
  assert(budgetSchema.safeParse(b).success);
  b.goals[1] = { ...b.goals[1], accountId: undefined };
  delete b.goals[1].accountId;
  assert(!budgetSchema.safeParse(b).success);
  assert.throws(() => moveGoalsToSavings(budget(), "c", { goalIds: ["g1"] }), /compte d’épargne/);
});
