import test from "node:test";
import assert from "node:assert/strict";
import { demoBudget } from "../lib/budget.ts";
import { globalSearch, searchKey } from "../lib/global-search.ts";

const today = "2026-11-25";
const budget = () => {
  const b = demoBudget(today);
  b.transactions.push(
    {
      id: "a",
      label: "Café de la gare",
      amount: -480,
      date: "2026-11-20",
      accountId: b.accounts[0].id,
      category: "Restaurants",
      note: "",
    },
    {
      id: "b",
      label: "Café de la gare",
      amount: -480,
      date: "2025-03-02",
      accountId: b.accounts[0].id,
      category: "Restaurants",
      note: "",
    },
    {
      id: "c",
      label: "Billet futur",
      amount: -125000,
      date: "2026-12-20",
      accountId: b.accounts[0].id,
      category: "Loisirs",
      note: "",
    },
    {
      id: "d",
      label: "Prime",
      amount: 125000,
      date: "2026-10-01",
      accountId: b.accounts[0].id,
      category: "Autres revenus",
      note: "",
    },
  );
  return b;
};

test("search ignores accents and case and spans every month, newest first", () => {
  assert.equal(searchKey("ÉPARGNE"), "epargne");
  const r = globalSearch(budget(), "cafe gare", today);
  assert.deepEqual(r.transactions.map((t) => t.id).slice(0, 2), ["a", "b"]);
});

test("amounts match as written in France, without the future", () => {
  const b = budget();
  assert(globalSearch(b, "4,80", today).transactions.some((t) => t.id === "a"));
  assert(globalSearch(b, "4.8", today).transactions.some((t) => t.id === "a"));
  const big = globalSearch(b, "1 250", today).transactions.map((t) => t.id);
  assert(big.includes("d"));
  assert(!big.includes("c"), "an operation after today is not listed");
});

test("recurrences, goals and accounts are found; short or empty queries return nothing", () => {
  const b = budget();
  const rule = b.rules[0],
    goal = b.goals[0],
    account = b.accounts[0];
  assert(globalSearch(b, rule.label, today).rules.some((r) => r.id === rule.id));
  assert(globalSearch(b, goal.name, today).goals.some((g) => g.id === goal.id));
  assert(globalSearch(b, account.name, today).accounts.some((a) => a.id === account.id));
  assert.equal(globalSearch(b, "c", today).transactions.length, 0);
  assert.equal(globalSearch(b, "   ", today).rules.length, 0);
});

test("results are capped and the rest is counted", () => {
  const b = budget();
  for (let i = 0; i < 40; i++)
    b.transactions.push({
      id: "x" + i,
      label: "Boulangerie",
      amount: -120,
      date: "2026-09-01",
      accountId: b.accounts[0].id,
      category: "Alimentation",
      note: "",
    });
  const r = globalSearch(b, "boulangerie", today, 25);
  assert.equal(r.transactions.length, 25);
  assert(r.moreTransactions >= 15);
});
