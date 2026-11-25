"use client";
import type { RefObject } from "react";
import { ChevronRight, Download, Funnel, Plus, Repeat2, Search, Upload, X } from "lucide-react";
import { accountBalance, parseDate, shiftDate, shortDate, type Budget, type Transaction } from "../lib/budget";
import { recordedOperationTotals } from "../lib/operation-totals";
import Empty from "./budget-empty";
import CategoryIcon from "./category-icon";
import { MerchantIcon } from "./merchant-fields";
import OperationGesture from "./operation-gesture";
import SpendingInsights from "./spending-insights";
import TransactionSelection from "./transaction-selection";
import type { Modal } from "./budget-modal";
import type { ImportDraft } from "./bank-import";
import { LedgerTools, OperationFilterControls, type OperationFilterValues } from "./operation-filters";

function dateLabel(date: string, today: string) {
  return date === today
    ? "Aujourd’hui"
    : date === shiftDate(today, -1)
      ? "Hier"
      : parseDate(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export type TransactionsPageProps = {
  budget: Budget;
  o: { total: number };
  today: string;
  hidden: boolean;
  compact: boolean;
  /** Amount formatter that honours the privacy mode. */
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  open: (modal: Modal) => void;
  query: string;
  setQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  accountFilter: string;
  setAccountFilter: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  filterValues: OperationFilterValues;
  updateFilters: (value: OperationFilterValues) => void;
  transactionEpoch: number;
  operationMotion: RefObject<HTMLElement | null>;
  importDraft: ImportDraft | null;
  exportCSV: () => void;
};

/** Opérations: month ledger with filters, search, totals and spending insights. */
export default function TransactionsPage({
  budget: b,
  o,
  today,
  hidden,
  compact,
  m,
  open,
  query,
  setQuery,
  typeFilter,
  setTypeFilter,
  accountFilter,
  setAccountFilter,
  month,
  setMonth,
  filterValues,
  updateFilters,
  transactionEpoch,
  operationMotion,
  importDraft,
  exportCSV,
}: TransactionsPageProps) {
  const filterCount =
    Number(typeFilter !== "all") + Number(accountFilter !== "all") + Number(month !== today.slice(0, 7));
  const transactionRows = (items: Transaction[], full = false) =>
    items.map((t) => (
      <OperationGesture
        id={t.id}
        label={t.label}
        className={`transaction-row ${full ? "full" : ""}`}
        key={t.id}
        onClick={() => open({ type: "transaction", item: t })}
      >
        <MerchantIcon
          label={t.label}
          merchantId={t.merchantId}
          customIconUrl={t.customIconUrl}
          fallback={<CategoryIcon category={t.category} />}
        />
        <span className="transaction-title">
          <strong>{t.label}</strong>
          <small>
            {full ? (
              <>
                {b.accounts.find((a) => a.id === t.accountId)?.name}
                <span className="transaction-mobile-category"> · {t.category}</span>
              </>
            ) : (
              t.category
            )}
            {t.ruleId && <Repeat2 size={11} />}
          </small>
        </span>
        {full && <span className="category-label">{t.category}</span>}
        <span className="transaction-amount">
          <strong className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true, true)}</strong>
          <small>{shortDate(t.date)}</small>
        </span>
        <ChevronRight className="row-chevron" size={15} />
      </OperationGesture>
    ));
  const visibleMonthRows = b.transactions.filter(
    (t) =>
      t.date.startsWith(month) &&
      t.date <= today &&
      (accountFilter === "all" || t.accountId === accountFilter) &&
      (typeFilter === "all" || (typeFilter === "expense" ? t.amount < 0 : t.amount > 0)) &&
      (t.label + " " + t.category + " " + t.note).toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")),
  );
  const { income: monthIncome, spent: monthSpent } = recordedOperationTotals(visibleMonthRows, today);
  const monthName = parseDate(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return (
    <>
      {accountFilter !== "all" && b.accounts.some((a) => a.id === accountFilter) && (
        <section className="account-ledger-context" aria-label="Compte sélectionné">
          <div>
            <span>{b.accounts.find((a) => a.id === accountFilter)?.name}</span>
            <strong>{m(accountBalance(b, accountFilter, today))}</strong>
            <small>Solde actuel</small>
          </div>
          <button type="button" className="text-button" onClick={() => setAccountFilter("all")}>
            Tous les comptes
          </button>
        </section>
      )}
      <section className="metric-strip">
        <div>
          <span>Revenus reçus · {monthName}</span>
          <strong className="positive">{m(monthIncome, true, true)}</strong>
        </div>
        <div>
          <span>Dépenses enregistrées · {monthName}</span>
          <strong>{m(monthSpent)}</strong>
        </div>
        <div>
          <span>Solde actuel des comptes courants</span>
          <strong>{m(o.total)}</strong>
        </div>
      </section>
      <section ref={operationMotion} className="card transactions-card">
        <div className="toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Rechercher une opération"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label="Effacer la recherche"
                onClick={(e) => {
                  setQuery("");
                  e.currentTarget.parentElement?.querySelector("input")?.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {compact && (
            <button
              type="button"
              className="secondary operation-filter-trigger"
              aria-label={`Filtrer les opérations, ${filterCount} filtre${filterCount > 1 ? "s" : ""} actif${filterCount > 1 ? "s" : ""}`}
              aria-haspopup="dialog"
              onClick={() => open({ type: "filters" })}
            >
              <Funnel size={17} />
              Filtrer{filterCount > 0 && <span className="filter-count">{filterCount}</span>}
            </button>
          )}
        </div>
        <LedgerTools compact={compact}>
          <div className="toolbar-actions">
            <button type="button" className="secondary compact" onClick={() => open({ type: "import" })}>
              <Upload size={15} />
              {importDraft ? "Reprendre l’import" : "Importer"}
            </button>
            <button type="button" className="secondary compact" onClick={() => open({ type: "imports" })}>
              Mes imports
            </button>
            <button type="button" className="secondary compact" onClick={() => open({ type: "match-transfers" })}>
              Associer des virements
            </button>
            <button
              type="button"
              className="secondary compact"
              title="Exporter toutes les opérations en CSV"
              aria-label="Exporter en CSV"
              onClick={exportCSV}
            >
              <Download size={18} />
              <span>Exporter CSV</span>
            </button>
          </div>
        </LedgerTools>
        {!compact && <OperationFilterControls values={filterValues} accounts={b.accounts} onChange={updateFilters} />}
        {(query || typeFilter !== "all" || accountFilter !== "all" || month !== today.slice(0, 7)) && (
          <div className="active-filters" aria-label="Filtres actifs">
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Retirer le filtre de recherche">
                Recherche : {query}
                <X size={14} />
              </button>
            )}
            {typeFilter !== "all" && (
              <button type="button" onClick={() => setTypeFilter("all")} aria-label="Retirer le filtre de type">
                {typeFilter === "expense" ? "Dépenses" : "Revenus"}
                <X size={14} />
              </button>
            )}
            {accountFilter !== "all" && (
              <button type="button" onClick={() => setAccountFilter("all")} aria-label="Retirer le filtre de compte">
                {b.accounts.find((a) => a.id === accountFilter)?.name}
                <X size={14} />
              </button>
            )}
            {month !== today.slice(0, 7) && (
              <button type="button" onClick={() => setMonth(today.slice(0, 7))} aria-label="Revenir au mois actuel">
                {parseDate(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
                setAccountFilter("all");
                setMonth(today.slice(0, 7));
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
        {(() => {
          const items = [...b.transactions]
            .filter(
              (t) =>
                t.date.startsWith(month) &&
                (accountFilter === "all" || t.accountId === accountFilter) &&
                (typeFilter === "all" || (typeFilter === "expense" ? t.amount < 0 : t.amount > 0)) &&
                (t.label + " " + t.category + " " + t.note)
                  .toLocaleLowerCase("fr")
                  .includes(query.toLocaleLowerCase("fr")),
            )
            .sort((a, b) => b.date.localeCompare(a.date));
          return items.length ? (
            <TransactionSelection
              key={JSON.stringify([query, typeFilter, accountFilter, month, transactionEpoch])}
              items={items}
              renderRow={(t) => transactionRows([t], true)}
              formatAmount={(n) => m(n, true, true)}
              dateLabel={(date) => dateLabel(date, today) + (date > today ? " · À venir" : "")}
              onBulk={(ids) => open({ type: "bulk", ids })}
            />
          ) : (
            <Empty
              icon={Search}
              title="Rien pour le moment"
              description="Aucune opération ne correspond à cette période ou à vos filtres."
              action={
                <button
                  type="button"
                  className="text-button"
                  onClick={() => (b.accounts.length ? open({ type: "transaction" }) : open({ type: "account" }))}
                >
                  Ajouter une opération <Plus size={14} />
                </button>
              }
            />
          );
        })()}
      </section>
      <p className="metric-note">
        Totaux des opérations enregistrées pour la période et les filtres choisis, hors virements et opérations futures.
      </p>
      <SpendingInsights key={month} budget={b} month={month} today={today} hidden={hidden} />
    </>
  );
}
