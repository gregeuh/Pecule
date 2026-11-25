"use client";
import { useState, useSyncExternalStore } from "react";
import { CalendarClock, PiggyBank } from "lucide-react";
import { money, shortDate, type Budget, type Transaction } from "../lib/budget";
import { paydaySavings, tightPeriod, type PaydayPlan } from "../lib/month-assist";

const LATER_KEY = "pecule-payday-later";
const readLater = () => {
  try {
    return localStorage.getItem(LATER_KEY) ?? "";
  } catch {
    return "";
  }
};

const subscribeNothing = () => () => {};

/** Home helpers: savings on payday, and the planned expenses that can wait when the end of the period is tight. */
export default function MonthAssist({
  budget,
  today,
  hidden,
  busy,
  onPaydaySavings,
  onPostpone,
}: {
  budget: Budget;
  today: string;
  hidden: boolean;
  busy: boolean;
  onPaydaySavings: (plan: PaydayPlan) => void;
  onPostpone: (item: Transaction, date: string) => void;
}) {
  const stored = useSyncExternalStore(subscribeNothing, readLater, () => "");
  const [dismissed, setLater] = useState("");
  const later = dismissed || stored;
  if (hidden) return null;
  const plan = paydaySavings(budget, today);
  const tight = tightPeriod(budget, today);
  const showPayday = plan && later !== plan.salary.id;
  if (!showPayday && !tight) return null;
  return (
    <div className="month-assist">
      {showPayday && (
        <section className="month-assist-card" aria-labelledby="payday-title">
          <div className="month-assist-heading">
            <span className="month-assist-icon" aria-hidden="true">
              <PiggyBank size={19} />
            </span>
            <div>
              <h2 id="payday-title">Votre paie est arrivée</h2>
              <p>Mettre de côté ce que vous aviez prévu pour vos objectifs ?</p>
            </div>
          </div>
          <ul>
            {plan.items.map(({ goal, amount }) => (
              <li key={goal.id}>
                <span>{goal.name}</span>
                <b>{money(amount)}</b>
              </li>
            ))}
          </ul>
          <p className="month-assist-note">
            De {plan.from.name} vers {plan.to.name}. Pécule l’enregistre ; le virement reste à faire à votre banque.
          </p>
          <div className="month-assist-actions">
            <button type="button" className="primary" disabled={busy} onClick={() => onPaydaySavings(plan)}>
              Mettre {money(plan.total)} de côté
            </button>
            <button
              type="button"
              className="month-assist-later"
              onClick={() => {
                setLater(plan.salary.id);
                try {
                  localStorage.setItem(LATER_KEY, plan.salary.id);
                } catch {}
              }}
            >
              Plus tard
            </button>
          </div>
        </section>
      )}
      {tight && (
        <section className="month-assist-card" data-tone={tight.tone} aria-labelledby="tight-title">
          <div className="month-assist-heading">
            <span className="month-assist-icon" aria-hidden="true">
              <CalendarClock size={19} />
            </span>
            <div>
              <h2 id="tight-title">
                {tight.tone === "negative" ? "Le disponible passe sous zéro" : "Fin de période serrée"}
              </h2>
              <p>
                {tight.tone === "negative"
                  ? `Il manque ${money(tight.gap)} d’ici le ${shortDate(tight.until)} pour garder ${money(tight.threshold, false)} par jour.`
                  : `${money(Math.floor(tight.daily / 100) * 100, false)} par jour d’ici le ${shortDate(tight.until)}, sous votre repère de ${money(tight.threshold, false)}.`}{" "}
                Une de ces dépenses peut-elle attendre ?
              </p>
            </div>
          </div>
          <ul>
            {tight.items.map((t) => (
              <li key={t.id}>
                <span>
                  {t.label}
                  <small>{shortDate(t.date)}</small>
                </span>
                <b>{money(t.amount, true, true)}</b>
                <button
                  type="button"
                  className="month-assist-move"
                  disabled={busy}
                  aria-label={`Décaler ${t.label} au ${shortDate(tight.moveTo)}`}
                  onClick={() => onPostpone(t, tight.moveTo)}
                >
                  Au {shortDate(tight.moveTo)}
                </button>
              </li>
            ))}
          </ul>
          <p className="month-assist-note">
            Décaler ne change que la prévision dans Pécule. Si un prélèvement doit vraiment attendre, voyez-le avec
            l’organisme concerné.
          </p>
        </section>
      )}
    </div>
  );
}
