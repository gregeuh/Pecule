import test from "node:test";
import assert from "node:assert/strict";
import { emptyBudget } from "../lib/budget.ts";
import {
  monthGrid,
  recurrenceDays,
  recurrenceMonthSummary,
  recurrencesBetween,
  shiftMonth,
} from "../lib/recurrence-calendar.ts";

const rule = (id, label, amount, day, extra = {}) => ({
  id,
  label,
  amount,
  accountId: "c",
  category: amount > 0 ? "Salaire" : "Logement",
  startDate: "2026-01-01",
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
      openingBalance: 100000,
      openingDate: "2026-11-01",
      color: "#000",
    },
  ];
  b.rules = [
    rule("assu", "Assurance auto", -4210, 3),
    rule("spot", "Spotify", -1199, 10),
    rule("loyer", "Loyer", -78000, 27),
    rule("tel", "Forfait mobile", -1999, 28),
    rule("paie", "Mon salaire", 245000, 30),
    rule("pause", "En pause", -5000, 27, { active: false }),
  ];
  return b;
};

test("a month grid starts on Monday and pads full weeks", () => {
  const grid = monthGrid("2026-11");
  assert.equal(grid.length, 42);
  assert.deepEqual(grid.slice(0, 7), [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(grid[35], "2026-11-30");
  assert.equal(grid[36], null);
  assert.equal(monthGrid("2027-02").length, 28);
});

test("months shift across years", () => {
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
});

test("only active recurrences show, by day", () => {
  const days = recurrenceDays(budget(), "2026-11-26", 7);
  assert.equal(days.length, 7);
  assert.equal(days[0].date, "2026-11-26");
  assert.deepEqual(
    days.map((d) => d.items.map((t) => t.label)),
    [[], ["Loyer"], ["Forfait mobile"], [], ["Mon salaire"], [], []],
  );
  assert(recurrencesBetween(budget(), "2026-11-01", "2026-11-30").every((t) => t.ruleId));
});

test("recorded one-off future operations are not recurrences", () => {
  const b = budget();
  b.transactions = [
    { id: "x", label: "Achat prévu", amount: -1000, date: "2026-11-27", accountId: "c", category: "Divers" },
  ];
  assert.deepEqual(
    recurrencesBetween(b, "2026-11-27", "2026-11-27").map((t) => t.label),
    ["Loyer"],
  );
});

test("the month summary counts passed charges and what is left before payday", () => {
  assert.deepEqual(recurrenceMonthSummary(budget(), "2026-11-26", "2026-11-29"), {
    charges: 4210 + 1199 + 78000 + 1999,
    income: 245000,
    chargesCount: 4,
    chargesPassed: 2,
    remaining: 78000 + 1999,
  });
  assert.equal(recurrenceMonthSummary(budget(), "2026-11-26", "2026-11-26").remaining, 0);
});
