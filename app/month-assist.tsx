"use client";
import { useId, useState, useSyncExternalStore } from "react";
import FoldButton from "./fold-button";
import { useCollapsed } from "./use-collapsed";
import { CalendarClock, PiggyBank } from "lucide-react";
import { money, shortDate, type Budget, type Transaction } from "../lib/budget";
import { paydaySavings, tightPeriod, type PaydayPlan } from "../lib/month-assist";

type Tight = NonNullable<ReturnType<typeof tightPeriod>>;

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
        <PaydayCard
          plan={plan}
          busy={busy}
          onPaydaySavings={onPaydaySavings}
          onLater={() => {
            setLater(plan.salary.id);
            try {
              localStorage.setItem(LATER_KEY, plan.salary.id);
            } catch {}
          }}
        />
      )}
      {tight && <TightCard tight={tight} busy={busy} onPostpone={onPostpone} />}
    </div>
  );
}

function PaydayCard({
  plan,
  busy,
  onPaydaySavings,
  onLater,
}: {
  plan: PaydayPlan;
  busy: boolean;
  onPaydaySavings: (plan: PaydayPlan) => void;
  onLater: () => void;
}) {
  const body = useId();
  const title = "Votre paie est arrivée";
  const [collapsed, toggle] = useCollapsed("payday", plan.salary.id);
  return (
    <section className="month-assist-card" data-collapsed={collapsed || undefined} aria-labelledby="payday-title">
      <div className="month-assist-heading">
        <span className="month-assist-icon" aria-hidden="true">
          <PiggyBank size={19} />
        </span>
        <div>
          <h2 id="payday-title">{title}</h2>
          <p>
            {collapsed
              ? `Mettre ${money(plan.total)} de côté ?`
              : "Mettre de côté ce que vous aviez prévu pour vos objectifs ?"}
          </p>
        </div>
        <FoldButton collapsed={collapsed} title={title} controls={body} onToggle={toggle} />
      </div>
      <div id={body} hidden={collapsed} className="month-assist-body">
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
          <button type="button" className="month-assist-later" onClick={onLater}>
            Plus tard
          </button>
        </div>
      </div>
    </section>
  );
}

function TightCard({
  tight,
  busy,
  onPostpone,
}: {
  tight: Tight;
  busy: boolean;
  onPostpone: (item: Transaction, date: string) => void;
}) {
  const body = useId();
  const title = tight.tone === "negative" ? "Le disponible passe sous zéro" : "Fin de période serrée";
  const [collapsed, toggle] = useCollapsed(
    "tight",
    `${tight.tone}|${tight.until}|${tight.items.map((t) => t.id).join(",")}`,
  );
  const daily = `${money(Math.floor(tight.daily / 100) * 100, false)} par jour d’ici le ${shortDate(tight.until)}`;
  return (
    <section
      className="month-assist-card"
      data-tone={tight.tone}
      data-collapsed={collapsed || undefined}
      aria-labelledby="tight-title"
    >
      <div className="month-assist-heading">
        <span className="month-assist-icon" aria-hidden="true">
          <CalendarClock size={19} />
        </span>
        <div>
          <h2 id="tight-title">{title}</h2>
          <p>
            {collapsed
              ? `${tight.tone === "negative" ? `Il manque ${money(tight.gap)}` : daily} · ${tight.items.length} dépense${tight.items.length > 1 ? "s" : ""} à décaler`
              : `${
                  tight.tone === "negative"
                    ? `Il manque ${money(tight.gap)} d’ici le ${shortDate(tight.until)} pour garder ${money(tight.threshold, false)} par jour.`
                    : `${daily}, sous votre repère de ${money(tight.threshold, false)}.`
                } Une de ces dépenses peut-elle attendre ?`}
          </p>
        </div>
        <FoldButton collapsed={collapsed} title={title} controls={body} onToggle={toggle} />
      </div>
      <div id={body} hidden={collapsed} className="month-assist-body">
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
      </div>
    </section>
  );
}
