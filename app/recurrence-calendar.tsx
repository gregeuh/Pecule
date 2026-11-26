"use client";
import { useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseDate, shiftDate, shortDate, type Budget, type Transaction } from "../lib/budget";
import { monthGrid, recurrencesBetween, shiftMonth } from "../lib/recurrence-calendar";
import { dayName, rhythm } from "./recurrence-week";

type Props = {
  budget: Budget;
  today: string;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  onOpen: (t: Transaction) => void;
};

const weekdays = ["L", "M", "M", "J", "V", "S", "D"];
const weekdayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** Récurrences: the month as a grid, a dot per charge or income; a day shows what falls on it. */
export default function RecurrenceCalendar({ budget, today, m, onOpen }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const titleId = useId();
  const grid = monthGrid(month);
  const items = recurrencesBetween(budget, `${month}-01`, shiftDate(`${shiftMonth(month, 1)}-01`, -1));
  const dayItems = items.filter((t) => t.date === selected);
  const title = parseDate(`${month}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const go = (by: number) => {
    const next = shiftMonth(month, by);
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
  };
  return (
    <section className="card recurrence-calendar" aria-labelledby={titleId}>
      <div className="recurrence-calendar-head">
        <button type="button" className="icon-button" aria-label="Mois précédent" onClick={() => go(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2 id={titleId}>{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
        <button type="button" className="icon-button" aria-label="Mois suivant" onClick={() => go(1)}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="recurrence-calendar-grid" role="group" aria-labelledby={titleId}>
        {weekdays.map((d, i) => (
          <span className="recurrence-calendar-weekday" aria-hidden="true" key={`w${i}`}>
            {d}
          </span>
        ))}
        {grid.map((date, i) => {
          if (!date) return <span key={`b${i}`} aria-hidden="true" />;
          const own = items.filter((t) => t.date === date);
          const charge = own.some((t) => t.amount < 0),
            income = own.some((t) => t.amount > 0);
          return (
            <button
              type="button"
              key={date}
              aria-pressed={selected === date}
              aria-label={`${weekdayNames[i % 7]} ${parseDate(date).getDate()}${
                own.length ? `, ${own.length} récurrence${own.length > 1 ? "s" : ""}` : ""
              }${date === today ? ", aujourd’hui" : ""}`}
              data-today={date === today || undefined}
              data-past={date < today || undefined}
              onClick={() => setSelected(date)}
            >
              <strong>{parseDate(date).getDate()}</strong>
              <span className="recurrence-dots" aria-hidden="true">
                {charge && <i data-kind="charge" />}
                {income && <i data-kind="income" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="recurrence-calendar-legend" aria-hidden="true">
        <span>
          <i data-kind="charge" />
          Charge
        </span>
        <span>
          <i data-kind="income" />
          Revenu
        </span>
      </div>
      <div className="recurrence-calendar-day" aria-live="polite">
        <h3>
          {dayName(selected, today)} {shortDate(selected)}
        </h3>
        {dayItems.length ? (
          dayItems.map((t) => (
            <button type="button" className="recurrence-row" key={t.id} onClick={() => onOpen(t)}>
              <i aria-hidden="true" data-kind={t.amount > 0 ? "income" : "charge"} />
              <span>
                <strong>{t.label}</strong>
                <small>
                  {t.date <= today ? "Passée · " : ""}
                  {rhythm(budget, t)}
                </small>
              </span>
              <b className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true, true)}</b>
            </button>
          ))
        ) : (
          <p className="recurrence-week-none">Aucune récurrence ce jour-là.</p>
        )}
      </div>
    </section>
  );
}
