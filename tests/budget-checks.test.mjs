import test from "node:test";
import assert from "node:assert/strict";
import { accountBalance, emptyBudget, materialize, overview } from "../lib/budget.ts";
import { budgetSchema } from "../lib/validation.ts";
import { dismissCheck, doubleCounts, duplicateRules, keepRule, mergeDoubleCount } from "../lib/budget-checks.ts";

const rule = (id, label, amount, day, extra = {}) => ({
  id,
  label,
  amount,
  accountId: "c",
  category: "Logement",
  startDate: "2026-09-01",
  endDate: "",
  frequency: "monthly",
  timing: "date",
  day,
  active: true,
  holidays: "FR",
  excludedDates: [],
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
      openingBalance: 300000,
      openingDate: "2026-09-01",
      color: "#245af3",
    },
  ];
  b.rules = [
    rule("manual", "Loyer", -68700, 12),
    rule("imported", "Loyer", -69672, 10, { bankLabel: "PRLV SEPA LOYER AGENCE DUPONT" }),
    rule("phone", "Forfait mobile", -1999, 28),
    rule("salary", "Salaire", 181961, 30, { category: "Salaire" }),
  ];
  b.transactions = [
    {
      id: "bank-nov",
      label: "Loyer",
      bankLabel: "PRLV SEPA LOYER AGENCE DUPONT",
      amount: -69672,
      date: "2026-11-10",
      accountId: "c",
      category: "Logement",
      note: "",
      importBatch: "batch",
    },
  ];
  return b;
};

test("two rents with the same name and close amounts are a likely duplicate; other rules are not", () => {
  const found = duplicateRules(budget());
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].rules.map((r) => r.id).sort(), ["imported", "manual"]);
  const next = keepRule(budget(), found[0], "imported");
  assert.deepEqual(
    next.rules.map((r) => r.id),
    ["imported", "phone", "salary"],
  );
  // Removing the duplicate gives back the rent counted twice in the past months.
  assert.equal(accountBalance(next, "c", "2026-11-26") - accountBalance(budget(), "c", "2026-11-26"), 68700 * 3);
  assert.deepEqual(duplicateRules(dismissCheck(budget(), found[0].key)), []);
});

test("a planned rent and the imported one on the same month are counted twice until they are merged", () => {
  const b = budget();
  const found = doubleCounts(b, "2026-11-26").filter((d) => d.rule.id === "imported");
  assert.equal(found.length, 1);
  assert.equal(found[0].date, "2026-11-10");
  assert.equal(found[0].recorded.id, "bank-nov");
  const next = mergeDoubleCount(b, found[0]);
  assert.equal(accountBalance(next, "c", "2026-11-26") - accountBalance(b, "c", "2026-11-26"), 69672);
  assert.equal(next.transactions[0].ruleId, "imported");
  assert(budgetSchema.safeParse(next).success);
  assert.deepEqual(
    doubleCounts(next, "2026-11-26").filter((d) => d.rule.id === "imported"),
    [],
  );
  assert.deepEqual(
    doubleCounts(dismissCheck(b, found[0].key), "2026-11-26").filter((d) => d.rule.id === "imported"),
    [],
  );
});

test("an unrelated payment of another amount is never taken for the recurrence", () => {
  const b = budget();
  b.transactions[0] = { ...b.transactions[0], amount: -4500, label: "Courses", bankLabel: undefined };
  delete b.transactions[0].bankLabel;
  assert.equal(doubleCounts(b, "2026-11-26").length, 0);
  assert.equal(overview(b, "2026-11-26").salary?.date, "2026-11-30");
});

test("once Pécule has recorded the past dates (as the app does), fixes still give the money back", () => {
  const b = materialize(budget(), "2026-11-26");
  assert(b.transactions.some((t) => t.id === "r:manual:2026-11-12"));
  const [pair] = duplicateRules(b);
  const kept = keepRule(b, pair, "imported");
  assert(!kept.transactions.some((t) => t.id.startsWith("r:manual:")));
  assert.equal(accountBalance(kept, "c", "2026-11-26") - accountBalance(b, "c", "2026-11-26"), 68700 * 3);
  const [twice] = doubleCounts(kept, "2026-11-26");
  assert.equal(twice.planned.id, "r:imported:2026-11-10");
  const merged = mergeDoubleCount(kept, twice);
  assert(!merged.transactions.some((t) => t.id === "r:imported:2026-11-10"));
  assert.equal(accountBalance(merged, "c", "2026-11-26") - accountBalance(kept, "c", "2026-11-26"), 69672);
  assert(budgetSchema.safeParse(merged).success);
  assert.equal(doubleCounts(merged, "2026-11-26").length, 0);
});
