"use client";
import type { RefObject } from "react";
import { ArrowDownLeft, CalendarDays, ChevronDown, Plus, Repeat2 } from "lucide-react";
import { futureTransactions, shiftDate, type Budget, type Rule } from "../lib/budget";
import { transactionRecurrence } from "../lib/transaction-recurrence";
import AnimatedDetails from "./animated-details";
import Empty from "./budget-empty";
import type { Modal } from "./budget-modal";
import RecurrenceCalendar from "./recurrence-calendar";
import RecurringItem from "./recurring-item";
import RecurringSuggestions from "./recurring-suggestions";
import SubscriptionOverview from "./subscription-overview";

export type RecurringPageProps = {
  budget: Budget;
  today: string;
  hidden: boolean;
  busy: boolean;
  /** Amount formatter that honours the privacy mode. */
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  open: (modal: Modal) => void;
  save: (next: Budget, message?: string) => Promise<boolean>;
  setToast: (message: string) => void;
  ruleFilter: string;
  setRuleFilter: (value: string) => void;
  recurrenceMotion: RefObject<HTMLDivElement | null>;
  onRemoveRule: (ruleId: string) => void;
};

/** Récurrences: subscriptions, suggestions and scheduled income and expenses. */
export default function RecurringPage({
  budget: b,
  today,
  hidden,
  busy,
  m,
  open,
  save,
  setToast,
  ruleFilter,
  setRuleFilter,
  recurrenceMotion,
  onRemoveRule,
}: RecurringPageProps) {
  const ruleState = (r: Rule) => (r.endDate && r.endDate < today ? "ended" : r.active ? "active" : "paused");
  return (
    <>
      <RecurrenceCalendar
        budget={b}
        today={today}
        m={m}
        onOpen={(t) => {
          const rule = b.rules.find((r) => r.id === t.ruleId);
          if (rule) open({ type: "rule", item: rule });
        }}
      />
      <SubscriptionOverview
        budget={b}
        today={today}
        hidden={hidden}
        onEdit={(item) => open({ type: "rule", item })}
        onCreate={(item) => {
          const proposal = transactionRecurrence(item, b, today);
          if (proposal) open({ type: "rule", proposal, sourceTransactionId: item.id });
          else setToast("Ouvrez cette opération pour vérifier ses données avant de prévoir la suite.");
        }}
      />
      <div className="recurrence-filters" role="group" aria-label="État des récurrences">
        {[
          { id: "all", label: "Toutes" },
          { id: "active", label: "Actives" },
          { id: "paused", label: "En pause" },
          { id: "ended", label: "Terminées" },
        ].map((f) => (
          <button type="button" key={f.id} aria-pressed={ruleFilter === f.id} onClick={() => setRuleFilter(f.id)}>
            {f.label}
            <span>{b.rules.filter((r) => f.id === "all" || ruleState(r) === f.id).length}</span>
          </button>
        ))}
      </div>
      <RecurringSuggestions
        budget={b}
        today={today}
        hidden={hidden}
        onReview={(suggestion) => open({ type: "rule", proposal: suggestion.rule })}
      />
      <AnimatedDetails className="recurrence-help">
        <summary>
          <CalendarDays size={18} />
          Dates et jours ouvrés
          <ChevronDown size={17} />
        </summary>
        <p>
          Choisissez une date fixe ou le dernier jour du mois hors week-end et jours fériés. Les opérations sont
          ajoutées à leur échéance, à partir de la date choisie.
        </p>
      </AnimatedDetails>
      {[true, false].map((income) => {
        const allRules = b.rules.filter((r) => r.amount > 0 === income),
          rules = allRules.filter((r) => ruleFilter === "all" || ruleState(r) === ruleFilter);
        return (
          <section className="recurring-section" key={String(income)}>
            <div className="section-heading">
              <h2>{income ? "Les rentrées d’argent" : "Les dépenses récurrentes"}</h2>
              <span>
                {rules.length} récurrence{rules.length > 1 ? "s" : ""}
              </span>
            </div>
            {rules.length ? (
              <div ref={recurrenceMotion} className="rule-grid">
                {rules.map((r) => {
                  const next = futureTransactions(
                    { ...b, rules: [r], transactions: [] },
                    shiftDate(today, 1),
                    shiftDate(today, 370),
                  )[0];
                  return (
                    <RecurringItem
                      key={r.id}
                      rule={r}
                      state={ruleState(r)}
                      accountName={b.accounts.find((a) => a.id === r.accountId)?.name}
                      next={next}
                      saving={busy}
                      formatMoney={(n) => m(n, true, true)}
                      onEdit={() => open({ type: "rule", item: r })}
                      onToggle={() => {
                        void save(
                          {
                            ...b,
                            rules: b.rules.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)),
                          },
                          r.active ? "Récurrence mise en pause." : "Récurrence réactivée.",
                        );
                      }}
                      onDelete={() => onRemoveRule(r.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <Empty
                  icon={income ? ArrowDownLeft : Repeat2}
                  title={
                    allRules.length
                      ? "Aucune récurrence dans cet état"
                      : income
                        ? "Prévoyez votre prochain revenu"
                        : "Anticipez les sorties d’argent"
                  }
                  description={
                    allRules.length
                      ? "Choisissez Toutes pour retrouver vos récurrences."
                      : income
                        ? "Salaire, allocation, revenu complémentaire : chacun a son rythme."
                        : "Loyer, abonnement, assurance… gardez une longueur d’avance."
                  }
                  action={
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => (b.accounts.length ? open({ type: "rule" }) : open({ type: "account" }))}
                    >
                      Ajouter une récurrence <Plus size={14} />
                    </button>
                  }
                />
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
