import { money, type Account, type Budget, type Goal, type Rule, type Transaction } from "./budget.ts";

/** Lower case, no accents, no thousands separators: "Épargne" and "epargne" match. */
export const searchKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[\s  ]+/g, " ")
    .trim();

/** "4,80", "4.80", "4,8" and "1 250" all match the amount the user sees. */
const amountKeys = (cents: number) => {
  const plain = money(Math.abs(cents)).replace(/\s?€/, "");
  const compact = plain.replace(/[\s  ]/g, "");
  return [plain, compact, compact.replace(",", "."), compact.replace(/,00$/, ""), compact.replace(/0$/, "")].map(
    searchKey,
  );
};

const matches = (query: string, texts: string[], cents?: number) => {
  const key = searchKey(query);
  const numeric = /^[-−+]?[\d .,]+(?: ?€)?$/.test(key);
  const words = numeric ? [key.replace(/[ €]/g, "")] : key.split(" ").filter(Boolean);
  if (!words.length) return false;
  const text = searchKey(texts.join(" "));
  const amounts = cents === undefined ? [] : amountKeys(cents);
  return words.every((word) => text.includes(word) || amounts.some((a) => a.startsWith(word.replace(/^[-−+]/, ""))));
};

export type GlobalSearchResults = {
  transactions: Transaction[];
  moreTransactions: number;
  rules: Rule[];
  goals: Goal[];
  accounts: Account[];
};

/** Searches recorded operations (newest first), recurrences, goals and accounts. Read only. */
export function globalSearch(budget: Budget, query: string, today: string, limit = 25): GlobalSearchResults {
  const empty = { transactions: [], moreTransactions: 0, rules: [], goals: [], accounts: [] };
  if (searchKey(query).length < 2) return empty;
  const accountName = (id: string) => budget.accounts.find((a) => a.id === id)?.name ?? "";
  const transactions = budget.transactions
    .filter((t) => t.date <= today && matches(query, [t.label, t.category, t.note, accountName(t.accountId)], t.amount))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return {
    transactions: transactions.slice(0, limit),
    moreTransactions: Math.max(0, transactions.length - limit),
    rules: budget.rules.filter((r) => matches(query, [r.label, r.category, accountName(r.accountId)], r.amount)),
    goals: budget.goals.filter((g) => matches(query, [g.name], g.target)),
    accounts: budget.accounts.filter((a) => matches(query, [a.name, a.bank])),
  };
}
