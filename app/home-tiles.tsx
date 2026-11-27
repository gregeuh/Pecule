"use client";
import type { CSSProperties } from "react";
import { Plus } from "lucide-react";
import { accountBalance, parseDate, shiftDate, type Budget } from "../lib/budget";
import { goalProgress } from "../lib/budget-presentation";
import { recurrenceMonthSummary, recurrencesBetween } from "../lib/recurrence-calendar";
import { walletSurfaceStyles } from "../lib/wallet-presentation";
import { balanceHistory, monthChange, savingsAccounts } from "../lib/savings";

type Props = {
  budget: Budget;
  today: string;
  /** Last day of the period (the day before payday, or the end of the month). */
  end: string;
  untilPayday: boolean;
  spent: number;
  income: number;
  hidden: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  onAccounts: () => void;
  onRecurring: () => void;
  onTransactions: () => void;
  onGoals: () => void;
};

/** iPhone home: the desktop dashboard as four square tiles, everything at a glance. Each tile opens its page. */
export default function HomeTiles(p: Props) {
  const b = p.budget;
  const month = parseDate(p.today).toLocaleDateString("fr-FR", { month: "long" });
  const Month = month.charAt(0).toUpperCase() + month.slice(1);
  const accounts = [...b.accounts].sort((a, c) => Number(a.type === "savings") - Number(c.type === "savings"));
  const total = b.accounts.reduce((sum, a) => sum + accountBalance(b, a.id, p.today), 0);
  const summary = recurrenceMonthSummary(b, p.today, p.end);
  const next = recurrencesBetween(b, shiftDate(p.today, 1), shiftDate(p.today, 45)).slice(0, 3);
  const goal = b.goals[0];
  const livret = savingsAccounts(b)[0];
  const history = livret ? balanceHistory(b, livret.id, p.today) : [];
  const change = livret ? monthChange(b, livret.id, p.today) : 0;
  const top = Math.max(...history.map((h) => h.balance), 1),
    bottom = Math.min(...history.map((h) => h.balance), 0);
  const points = history
    .map(
      (h, i) =>
        `${(i / Math.max(1, history.length - 1)) * 136 + 2},${32 - ((h.balance - bottom) / (top - bottom || 1)) * 28}`,
    )
    .join(" ");
  const { share, percent } = goal ? goalProgress(goal.saved, goal.target) : { share: 0, percent: 0 };
  const spentShare = p.spent + p.income > 0 ? Math.min(100, (p.spent / Math.max(p.income, p.spent)) * 100) : 0;
  const until = p.untilPayday ? "avant la paie" : "d’ici la fin du mois";
  return (
    <div className="home-tiles">
      <button
        type="button"
        className="home-tile home-tile-accounts"
        aria-label={`Mes comptes : ${p.hidden ? "soldes masqués" : p.m(total)} sur ${b.accounts.length} compte${b.accounts.length > 1 ? "s" : ""}`}
        onClick={p.onAccounts}
      >
        <span className="home-tile-title">Comptes</span>
        {accounts.slice(0, 2).map((a) => (
          <span key={a.id} className="home-tile-account" style={walletSurfaceStyles(a.color) as CSSProperties}>
            <small>{a.name}</small>
            <b>{p.m(accountBalance(b, a.id, p.today))}</b>
          </span>
        ))}
        {!accounts.length && <span className="home-tile-sub">Ajoutez votre premier compte</span>}
        {accounts.length > 2 && (
          <span className="home-tile-sub">
            et {accounts.length - 2} autre{accounts.length > 3 ? "s" : ""}
          </span>
        )}
      </button>

      <button type="button" className="home-tile home-tile-recurring" onClick={p.onRecurring}>
        <span className="home-tile-title">Récurrences</span>
        {summary.chargesCount > 0 && (
          <span className="home-tile-sub">
            {summary.remaining > 0 ? (
              <>
                Encore <b>{p.m(summary.remaining)}</b> {until}
              </>
            ) : (
              <>Plus aucune charge {until}</>
            )}
          </span>
        )}
        {next.length ? (
          <span className="home-tile-list">
            {next.map((t) => (
              <span key={t.id}>
                <span className="home-tile-name">{t.label}</span>
                <b className={t.amount > 0 ? "positive" : ""}>{p.m(t.amount, false, true)}</b>
                <small>{parseDate(t.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</small>
              </span>
            ))}
          </span>
        ) : (
          <span className="home-tile-sub">Loyer, salaire, abonnements : prévoyez-les ici.</span>
        )}
      </button>

      <button type="button" className="home-tile home-tile-month" onClick={p.onTransactions}>
        <span className="home-tile-title">{Month}</span>
        <span className="home-tile-figure">
          <small>Dépenses</small>
          <b>{p.m(p.spent)}</b>
        </span>
        <span className="home-tile-track" aria-hidden="true">
          <i style={{ width: p.hidden ? "0%" : `${spentShare}%` }} />
        </span>
        <span className="home-tile-figure">
          <small>Revenus</small>
          <b className="positive">{p.m(p.income)}</b>
        </span>
      </button>

      {livret ? (
        <button
          type="button"
          className="home-tile home-tile-savings"
          aria-label={`Épargne, ${livret.name} : ${p.hidden ? "solde masqué" : p.m(accountBalance(b, livret.id, p.today))}`}
          onClick={p.onGoals}
        >
          <span className="home-tile-title">Épargne · {livret.name}</span>
          <span className="home-tile-figure">
            <b>{p.m(accountBalance(b, livret.id, p.today))}</b>
          </span>
          {change !== 0 && !p.hidden && (
            <span className="home-tile-pill" data-tone={change > 0 ? "up" : "down"}>
              {change > 0 ? `${p.m(change, false, true)} en ${month}` : `${p.m(change, false, true)} en ${month}`}
            </span>
          )}
          {!p.hidden && history.length > 1 && (
            <svg className="home-tile-spark" viewBox="0 0 140 34" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={points} />
            </svg>
          )}
        </button>
      ) : goal ? (
        <button type="button" className="home-tile home-tile-goal" onClick={p.onGoals}>
          <span className="home-tile-title">Objectif</span>
          <span className="home-tile-goal-body">
            <span
              className="home-tile-ring"
              aria-hidden="true"
              style={{ "--share": `${p.hidden ? 0 : share}%` } as CSSProperties}
            >
              <span>{p.hidden ? "•" : `${percent} %`}</span>
            </span>
            <span className="home-tile-goal-text">
              <b>{goal.name}</b>
              <small>
                {p.m(goal.saved, false)} sur {p.m(goal.target, false)}
              </small>
            </span>
          </span>
        </button>
      ) : (
        <button type="button" className="home-tile home-tile-add" onClick={p.onGoals}>
          <Plus size={20} aria-hidden="true" />
          Créer un objectif d’épargne
        </button>
      )}
    </div>
  );
}
