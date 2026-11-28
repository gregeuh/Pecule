import test from "node:test";
import assert from "node:assert/strict";
import { accountBalance, emptyBudget, materialize, overview, waitingForStatement } from "../lib/budget.ts";
import { budgetSchema } from "../lib/validation.ts";
import { addedByPecule, keepNotOnStatement, notOnStatement, removeNotOnStatement } from "../lib/statement-check.ts";

const rule = (id, label, amount, day, extra = {}) => ({
  id,
  label,
  amount,
  accountId: "c",
  category: "Énergie",
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
const imported = (id, label, amount, date, extra = {}) => ({
  id,
  label,
  amount,
  date,
  accountId: "c",
  category: "Autres",
  note: "",
  importBatch: "nov",
  ...extra,
});
const TODAY = "2026-11-27";
/** Gaz (5th) never debited in November; Loyer (10th) on the statement; Forfait (28th) not yet due. */
const budget = (mode) => {
  const b = emptyBudget("Test");
  b.accounts = [
    {
      id: "c",
      name: "Courant",
      bank: "",
      type: "current",
      openingBalance: 300000,
      openingDate: "2026-10-31",
      color: "#245af3",
    },
  ];
  b.rules = [
    rule("gaz", "Gaz de Bordeaux", -6600, 5),
    rule("loyer", "Loyer", -69672, 10, { category: "Logement" }),
    rule("mobile", "Forfait mobile", -1999, 26, { category: "Télécommunications" }),
  ];
  b.transactions = [
    imported("i1", "CARREFOUR CITY", -3240, "2026-11-02"),
    imported("i2", "PRLV SEPA LOYER AGENCE", -69672, "2026-11-10"),
    imported("i3", "COIFFEUR", -2800, "2026-11-25"),
  ];
  if (mode) b.settings.pastRecurrences = mode;
  return b;
};

test("by default a past date of a recurrence is recorded on its date, even if the bank never debited it", () => {
  const b = materialize(budget(), TODAY);
  assert.ok(b.transactions.some((t) => t.id === "r:gaz:2026-11-05"));
  assert.ok(b.transactions.some((t) => t.id === "r:mobile:2026-11-26"));
  assert.deepEqual(waitingForStatement(b, TODAY), []);
});

test("once Pécule records a date the statement does not show, it is listed as not on the statement", () => {
  const b = materialize(budget(), TODAY);
  const found = notOnStatement(b);
  // Gaz: covered and missing. Loyer: the imported operation matches. Forfait: the 26th is too close to the 25th.
  assert.deepEqual(
    found.map((f) => f.transaction.id),
    ["r:gaz:2026-11-05"],
  );
  assert.ok(addedByPecule(found[0].transaction));
});

test("removing it gives the money back and Pécule does not add that date again; the next dates stay", () => {
  const b = materialize(budget(), TODAY);
  const before = accountBalance(b, "c", TODAY);
  const next = materialize(removeNotOnStatement(b, notOnStatement(b)), TODAY);
  assert.equal(accountBalance(next, "c", TODAY), before + 6600);
  assert.ok(!next.transactions.some((t) => t.id === "r:gaz:2026-11-05"));
  assert.deepEqual(next.rules.find((r) => r.id === "gaz").excludedDates, ["2026-11-05"]);
  assert.ok(materialize(next, "2026-12-06").transactions.some((t) => t.id === "r:gaz:2026-12-05"));
  assert.equal(budgetSchema.safeParse(next).success, true);
});

test("« elle a bien eu lieu » keeps it and never asks again", () => {
  const b = materialize(budget(), TODAY);
  const kept = keepNotOnStatement(b, notOnStatement(b)[0]);
  assert.deepEqual(notOnStatement(kept), []);
  assert.ok(kept.transactions.some((t) => t.id === "r:gaz:2026-11-05"));
});

test("statement mode: covered dates are counted only through the statement, recent ones wait", () => {
  const b = materialize(budget("statement"), TODAY);
  assert.ok(!b.transactions.some(addedByPecule), "nothing recorded by Pécule on imported days");
  // Balance = opening − imports only.
  assert.equal(accountBalance(b, "c", TODAY), 300000 - 3240 - 69672 - 2800);
  // The 26th is past but the statement may not show it yet: it still counts in what is left.
  assert.deepEqual(
    waitingForStatement(b, TODAY).map((t) => t.id),
    ["r:mobile:2026-11-26"],
  );
  const o = overview(b, TODAY);
  assert.equal(o.waiting.length, 1);
  assert.ok(o.expenses >= 1999);
  assert.equal(budgetSchema.safeParse(b).success, true);
});

test("statement mode: a later statement that shows the operation ends the wait; a manual entry too", () => {
  const b = budget("statement");
  b.transactions.push(imported("i4", "FORFAIT MOBILE", -1999, "2026-11-27", { category: "Télécommunications" }));
  assert.deepEqual(waitingForStatement(b, TODAY), []);
  const manual = budget("statement");
  manual.transactions.push({ ...imported("m", "Forfait", -1999, "2026-11-27"), importBatch: undefined });
  assert.deepEqual(waitingForStatement(manual, TODAY), []);
});

test("statement mode does nothing on an account without imports, and before the first imported day", () => {
  const b = budget("statement");
  b.transactions = [];
  assert.ok(materialize(b, TODAY).transactions.some((t) => t.id === "r:gaz:2026-11-05"));
  const late = budget("statement");
  late.accounts[0].openingDate = "2026-09-30";
  const m = materialize(late, TODAY);
  assert.ok(
    m.transactions.some((t) => t.id === "r:gaz:2026-10-05"),
    "October is before the statement",
  );
  assert.ok(!m.transactions.some((t) => t.id === "r:gaz:2026-11-05"));
});

test("a monthly transfer removed from the statement also leaves the savings account", () => {
  const b = budget();
  b.accounts.push({ ...b.accounts[0], id: "s", name: "Livret", type: "savings" });
  b.rules = [rule("rosy", "Virement Rosy", -35000, 3, { category: "Virement", toAccountId: "s" })];
  const m = materialize(b, TODAY);
  assert.ok(m.transactions.some((t) => t.id === "r:rosy:2026-11-03:to"));
  const next = removeNotOnStatement(m, notOnStatement(m));
  assert.ok(!next.transactions.some((t) => t.id.startsWith("r:rosy:2026-11-03")));
  assert.equal(accountBalance(materialize(next, TODAY), "s", TODAY), 300000);
});
