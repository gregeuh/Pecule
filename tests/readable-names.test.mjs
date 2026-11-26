import test from "node:test";
import assert from "node:assert/strict";
import { emptyBudget } from "../lib/budget.ts";
import { budgetSchema } from "../lib/validation.ts";
import { transactionKey } from "../lib/csv.ts";
import { applyNames, nameProposals, restoreBankLabels } from "../lib/readable-names.ts";

const op = (id, label, extra = {}) => ({
  id,
  label,
  amount: -1000,
  date: "2026-11-20",
  accountId: "c",
  category: "Autres",
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
      openingBalance: 0,
      openingDate: "2026-11-01",
      color: "#123456",
    },
  ];
  b.transactions = [
    op("a", "PRLV SEPA ASSURANCE LCL"),
    op("b", "PRLV SEPA ASSURANCE LCL", { date: "2026-10-20", importBatch: "x" }),
    op("c", "Café du coin"),
    op("d", "VIR SEPA LIVRET A", { transferId: "t1" }),
  ];
  b.rules = [
    {
      id: "r",
      label: "ECHEANCE PRET PERSONNEL 271026",
      amount: -7137,
      accountId: "c",
      category: "Dettes",
      startDate: "2026-11-30",
      endDate: "",
      frequency: "monthly",
      timing: "date",
      day: 30,
      active: true,
      holidays: "FR",
      excludedDates: [],
    },
  ];
  return b;
};

test("proposals list bank labels once, with how often they appear; transfers and hand-written labels are left out", () => {
  assert.deepEqual(nameProposals(budget()), [
    { raw: "PRLV SEPA ASSURANCE LCL", name: "Assurance LCL", count: 2 },
    { raw: "ECHEANCE PRET PERSONNEL 271026", name: "Échéance prêt personnel", count: 1 },
  ]);
});

test("names are applied, the bank label is kept, and the budget stays valid", () => {
  const names = new Map([
    ["PRLV SEPA ASSURANCE LCL", "Assurance LCL"],
    ["ECHEANCE PRET PERSONNEL 271026", "Prêt perso"],
  ]);
  const next = applyNames(budget(), names);
  assert.equal(next.transactions[0].label, "Assurance LCL");
  assert.equal(next.transactions[0].bankLabel, "PRLV SEPA ASSURANCE LCL");
  assert.equal(next.rules[0].label, "Prêt perso");
  assert.equal(next.rules[0].bankLabel, "ECHEANCE PRET PERSONNEL 271026");
  assert.equal(next.transactions[2].label, "Café du coin");
  assert.equal(next.transactions[3].label, "VIR SEPA LIVRET A");
  assert(budgetSchema.safeParse({ ...next, transactions: next.transactions.filter((t) => !t.transferId) }).success);
  // A renamed operation still matches the same bank line on the next import.
  assert.equal(transactionKey(next.transactions[0]), transactionKey(budget().transactions[0]));
  assert.deepEqual(nameProposals(next), []);
  assert.deepEqual(restoreBankLabels(next).transactions, budget().transactions);
});

test("an import renames only its own batch and never the recurrences", () => {
  const names = new Map([
    ["PRLV SEPA ASSURANCE LCL", "Assurance LCL"],
    ["ECHEANCE PRET PERSONNEL 271026", "Prêt perso"],
  ]);
  const next = applyNames(budget(), names, (t) => t.importBatch === "x");
  assert.deepEqual(
    next.transactions.map((t) => t.label),
    ["PRLV SEPA ASSURANCE LCL", "Assurance LCL", "Café du coin", "VIR SEPA LIVRET A"],
  );
  assert.equal(next.rules[0].label, "ECHEANCE PRET PERSONNEL 271026");
});
