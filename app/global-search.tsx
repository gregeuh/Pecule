"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { money, shortDate, type Account, type Budget, type Goal, type Rule, type Transaction } from "../lib/budget";
import { globalSearch } from "../lib/global-search";

/** One search for the whole budget: operations of every month, recurrences, goals and accounts. */
export default function GlobalSearch({
  budget,
  today,
  hidden,
  onTransaction,
  onRule,
  onGoal,
  onAccount,
}: {
  budget: Budget;
  today: string;
  hidden: boolean;
  onTransaction: (item: Transaction) => void;
  onRule: (item: Rule) => void;
  onGoal: (item: Goal) => void;
  onAccount: (item: Account) => void;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const results = useMemo(() => globalSearch(budget, deferred, today), [budget, deferred, today]);
  const m = (cents: number, signed = false) => (hidden ? "•••• €" : money(cents, true, signed));
  const accountName = (id: string) => budget.accounts.find((a) => a.id === id)?.name ?? "";
  const count =
    results.transactions.length +
    results.moreTransactions +
    results.rules.length +
    results.goals.length +
    results.accounts.length;
  const ready = deferred.trim().length >= 2;
  return (
    <div className="global-search">
      <label className="global-search-field">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          autoFocus
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Rechercher dans Pécule"
          aria-describedby="global-search-status"
          placeholder="Opération, montant, récurrence, objectif…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="global-search-clear"
            aria-label="Effacer la recherche"
            onClick={() => setQuery("")}
          >
            <X size={16} />
          </button>
        )}
      </label>
      <p id="global-search-status" className="global-search-status" role="status">
        {!ready
          ? "Tous les mois, toutes les récurrences et tous vos objectifs."
          : count
            ? `${count} résultat${count > 1 ? "s" : ""}`
            : `Rien trouvé pour « ${deferred.trim()} ».`}
      </p>
      {results.accounts.length > 0 && (
        <section aria-label="Comptes">
          <h3>Comptes</h3>
          <ul>
            {results.accounts.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onAccount(a)}>
                  <span>
                    <strong>{a.name}</strong>
                    <small>{a.bank || "Compte"}</small>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {results.goals.length > 0 && (
        <section aria-label="Objectifs">
          <h3>Objectifs</h3>
          <ul>
            {results.goals.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => onGoal(g)}>
                  <span>
                    <strong>{g.name}</strong>
                    <small>
                      {m(g.saved)} sur {m(g.target)}
                    </small>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {results.rules.length > 0 && (
        <section aria-label="Récurrences">
          <h3>Récurrences</h3>
          <ul>
            {results.rules.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => onRule(r)}>
                  <span>
                    <strong>{r.label}</strong>
                    <small>
                      {r.frequency === "weekly"
                        ? "Chaque semaine"
                        : r.frequency === "yearly"
                          ? "Chaque année"
                          : "Chaque mois"}
                      {r.active ? "" : " · en pause"} · {accountName(r.accountId)}
                    </small>
                  </span>
                  <b className={r.amount > 0 ? "positive" : ""}>{m(r.amount, true)}</b>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {results.transactions.length > 0 && (
        <section aria-label="Opérations">
          <h3>Opérations</h3>
          <ul>
            {results.transactions.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => onTransaction(t)}>
                  <span>
                    <strong>{t.label}</strong>
                    <small>
                      {shortDate(t.date)}
                      {t.date.slice(0, 4) !== today.slice(0, 4) ? ` ${t.date.slice(0, 4)}` : ""} · {t.category}
                    </small>
                  </span>
                  <b className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true)}</b>
                </button>
              </li>
            ))}
          </ul>
          {results.moreTransactions > 0 && (
            <p className="global-search-more">
              Et {results.moreTransactions} opération{results.moreTransactions > 1 ? "s" : ""} plus ancienne
              {results.moreTransactions > 1 ? "s" : ""} : précisez la recherche.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
