import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableSignal } from '../lib/available-signal.ts';
import { emptyBudget, overview } from '../lib/budget.ts';

test('a negative available amount takes priority over the daily allowance', () => {
  assert.equal(getAvailableSignal(-1, 1).tone, 'negative');
  assert.equal(getAvailableSignal(-100000, 31).label, 'Négatif');
});
test('zero and a positive allowance below 10 euros per day require attention', () => {
  for (const amount of [0, 1, 999]) assert.equal(getAvailableSignal(amount, 1).tone, 'attention');
  assert.equal(getAvailableSignal(9999, 10).tone, 'attention');
});
test('exactly 10 euros per day is comfortable, without prematurely rounding up', () => {
  assert.equal(getAvailableSignal(1000, 1).tone, 'comfort');
  assert.equal(getAvailableSignal(31000, 31).label, 'Confort');
  assert.equal(getAvailableSignal(30999, 31).tone, 'attention');
});
test('the same balance has a different signal depending on the time remaining', () => {
  assert.equal(getAvailableSignal(10000, 3).tone, 'comfort');
  assert.equal(getAvailableSignal(10000, 20).tone, 'attention');
  assert.equal(getAvailableSignal(999, 0).tone, 'attention');
});
test('classification uses the net available amount after reserves, excluding savings and future income', () => {
  const budget = emptyBudget();
  budget.accounts = [
    { id: 'current', name: 'Courant', bank: '', type: 'current', openingBalance: 6000, openingDate: '2026-10-01', color: '#335cff' },
    { id: 'savings', name: 'Épargne', bank: '', type: 'savings', openingBalance: 1000000, openingDate: '2026-10-01', color: '#335cff' },
  ];
  budget.settings.horizon = 'month';
  budget.settings.reserve = 2000;
  budget.transactions = [{ id: 'future-income', accountId: 'current', date: '2026-10-31', amount: 200000, label: 'Revenu futur', category: 'Salaire', note: '' }];
  const result = overview(budget, '2026-10-27');
  assert.equal(result.days, 5);
  assert.equal(result.available, 4000);
  assert.equal(getAvailableSignal(result.available, result.days).tone, 'attention');
  budget.settings.reserve = 1000;
  const comfortable = overview(budget, '2026-10-27');
  assert.equal(getAvailableSignal(comfortable.available, comfortable.days).tone, 'comfort');
});
test('the next salary horizon and month-end fallback use the existing inclusive day count', () => {
  const budget = emptyBudget();
  budget.accounts = [{ id: 'current', name: 'Courant', bank: '', type: 'current', openingBalance: 3000, openingDate: '2026-10-01', color: '#335cff' }];
  budget.rules = [{ id: 'salary', accountId: 'current', label: 'Salaire', category: 'Salaire', amount: 200000, startDate: '2026-10-01', endDate: '', frequency: 'monthly', timing: 'date', day: 30, active: true, holidays: 'FR', excludedDates: [] }];
  const untilSalary = overview(budget, '2026-10-27');
  assert.equal(untilSalary.days, 3);
  assert.equal(getAvailableSignal(untilSalary.available, untilSalary.days).tone, 'comfort');
  budget.rules = [];
  const untilMonthEnd = overview(budget, '2026-10-27');
  assert.equal(untilMonthEnd.days, 5);
  assert.equal(getAvailableSignal(untilMonthEnd.available, untilMonthEnd.days).tone, 'attention');
});
