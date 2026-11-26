"use client";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import { parseDate, shiftDate, shortDate, type Budget, type Transaction } from "../lib/budget";
import { recurrenceDays, recurrenceMonthSummary } from "../lib/recurrence-calendar";
import CategoryIcon from "./category-icon";
import { MerchantIcon } from "./merchant-fields";

type Props = {
  budget: Budget;
  today: string;
  /** Last day of the period (the day before payday, or the end of the month). */
  end: string;
  untilPayday: boolean;
  hidden: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  onOpen: (t: Transaction) => void;
  onMonth: () => void;
};

const weekday = (date: string, style: "short" | "long") =>
  parseDate(date).toLocaleDateString("fr-FR", { weekday: style });

/** "Tous les mois", "Chaque semaine" or "Chaque année", from the recurrence behind an occurrence. */
export function rhythm(budget: Budget, t: Transaction) {
  const f = budget.rules.find((r) => r.id === t.ruleId)?.frequency;
  return f === "weekly" ? "Chaque semaine" : f === "yearly" ? "Chaque année" : "Tous les mois";
}

export function dayName(date: string, today: string) {
  if (date === today) return "Aujourd’hui";
  if (date === shiftDate(today, 1)) return "Demain";
  const name = weekday(date, "long");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Home: this month's recurrences at a glance, then the next seven days as pills; a day shows only its own. */
export default function RecurrenceWeek({ budget, today, end, untilPayday, hidden, m, onOpen, onMonth }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const choose = (date: string | null) => {
    setSelected(date);
    setExpanded(false);
  };
  const titleId = useId();
  const days = recurrenceDays(budget, today, 7);
  const summary = recurrenceMonthSummary(budget, today, end);
  const pick = days.find((d) => d.date === selected);
  const rows = (pick ? [pick] : days).flatMap((d) => d.items);
  const shown = expanded ? rows : rows.slice(0, 3);
  const paidShare = summary.charges ? Math.round(((summary.charges - summary.remaining) / summary.charges) * 100) : 0;
  const hasRules = budget.rules.some((r) => r.active);
  return (
    <section className="clarte-card recurrence-week" aria-labelledby={titleId}>
      <div className="clarte-section-title">
        <h2 id={titleId}>Récurrences</h2>
        <button type="button" className="text-button" onClick={onMonth}>
          Le mois <ArrowRight size={15} />
        </button>
      </div>
      {!hasRules ? (
        <div className="recurrence-week-empty">
          <p>Loyer, salaire, abonnements : ajoutez-les pour voir ici ce qui arrive.</p>
          <button type="button" className="text-button" onClick={onMonth}>
            Ajouter une récurrence <Plus size={15} />
          </button>
        </div>
      ) : (
        <>
          {summary.chargesCount > 0 && (
            <div className="recurrence-week-progress">
              <p>
                {summary.remaining > 0 ? (
                  <>
                    Encore <strong>{m(summary.remaining)}</strong> à payer{" "}
                    {untilPayday ? "avant la paie" : `d’ici le ${shortDate(end)}`}
                  </>
                ) : (
                  <>Plus aucune charge {untilPayday ? "avant la paie" : `d’ici le ${shortDate(end)}`}</>
                )}{" "}
                {summary.chargesPassed > 0 &&
                  ` · ${summary.chargesPassed} sur ${summary.chargesCount} déjà passée${summary.chargesPassed > 1 ? "s" : ""}`}
              </p>
              <span className="recurrence-week-track" aria-hidden="true">
                <i style={{ width: hidden ? "0%" : `${Math.min(100, Math.max(0, paidShare))}%` }} />
              </span>
            </div>
          )}
          <div className="recurrence-week-days" role="group" aria-label="Les 7 prochains jours">
            {days.map((d) => {
              const charge = d.items.some((t) => t.amount < 0),
                income = d.items.some((t) => t.amount > 0);
              const count = d.items.length;
              return (
                <button
                  type="button"
                  key={d.date}
                  aria-pressed={selected === d.date}
                  aria-label={`${dayName(d.date, today)} ${shortDate(d.date)}, ${
                    count ? `${count} récurrence${count > 1 ? "s" : ""}` : "rien de prévu"
                  }`}
                  data-today={d.date === today || undefined}
                  onClick={() => choose(selected === d.date ? null : d.date)}
                >
                  <small>{weekday(d.date, "short")}</small>
                  <strong>{parseDate(d.date).getDate()}</strong>
                  <span className="recurrence-dots" aria-hidden="true">
                    {charge && <i data-kind="charge" />}
                    {income && <i data-kind="income" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="recurrence-week-list" aria-live="polite">
            <div className="recurrence-week-list-title">
              <span>{pick ? `${dayName(pick.date, today)} ${shortDate(pick.date)}` : "Les 7 prochains jours"}</span>
              {pick && (
                <button type="button" className="text-button" onClick={() => choose(null)}>
                  Toute la semaine
                </button>
              )}
            </div>
            {shown.length ? (
              shown.map((t) => (
                <button type="button" className="recurrence-row" key={t.id} onClick={() => onOpen(t)}>
                  <MerchantIcon
                    label={t.label}
                    merchantId={t.merchantId}
                    customIconUrl={t.customIconUrl}
                    fallback={<CategoryIcon category={t.category} size={19} />}
                  />
                  <span>
                    <strong>{t.label}</strong>
                    <small>{pick ? rhythm(budget, t) : `${dayName(t.date, today)} · ${shortDate(t.date)}`}</small>
                  </span>
                  <b className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true, true)}</b>
                </button>
              ))
            ) : (
              <p className="recurrence-week-none">
                {pick ? "Rien ce jour-là." : "Rien de prévu ces 7 prochains jours."}
              </p>
            )}
            {rows.length > shown.length && (
              <button
                type="button"
                className="text-button recurrence-week-more"
                aria-expanded={false}
                onClick={() => setExpanded(true)}
              >
                Voir {rows.length - shown.length === 1 ? "l’autre" : `les ${rows.length - shown.length} autres`}{" "}
                <ChevronDown size={15} />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
