"use client";
import { useState, type CSSProperties } from "react";
import { ArrowRight, Plus, Repeat2 } from "lucide-react";
import { parseDate, shiftDate, shortDate, type Budget } from "../lib/budget";
import {
  averageMonthlyGrowth,
  averageMonthlySpending,
  balanceHistory,
  cushionMonths,
  envelopes,
  looseGoals,
  monthChange,
  recentMoves,
  savingsAccounts,
  transfersTo,
} from "../lib/savings";
import { walletColor, walletSurfaceStyles } from "../lib/wallet-presentation";
import type { Modal } from "./budget-modal";

type Props = {
  budget: Budget;
  today: string;
  hidden: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  open: (modal: Modal) => void;
};

const monthName = (month: string) =>
  parseDate(`${month}-01`).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

/** Mon épargne, from the real balance of the savings account: history, cushion, envelopes, monthly transfer. */
export default function SavingsOverview({ budget: b, today, hidden, m, open }: Props) {
  const accounts = savingsAccounts(b);
  const [chosen, setChosen] = useState(accounts[0]?.id);
  const account = accounts.find((a) => a.id === chosen) ?? accounts[0];
  if (!account) return null;
  const history = balanceHistory(b, account.id, today);
  const change = monthChange(b, account.id, today);
  const growth = averageMonthlyGrowth(history);
  const spending = averageMonthlySpending(b, today);
  const { list, balance, free } = envelopes(b, account, today);
  const cushion = cushionMonths(balance, spending);
  const target = spending * 3;
  const transfers = transfersTo(b, account.id);
  const moves = recentMoves(b, account.id, today);
  const loose = looseGoals(b);
  const highest = Math.max(...history.map((h) => h.balance), 1);
  const lowest = Math.min(...history.map((h) => h.balance));
  const floor = Math.max(0, lowest - (highest - lowest) * 0.6);
  const month = parseDate(today).toLocaleDateString("fr-FR", { month: "long" });
  const current = b.accounts.find((a) => a.type === "current") ?? b.accounts.find((a) => a.type !== "savings");
  const shares = [
    ...list.map((g) => ({ id: g.id, value: g.saved, color: walletColor(g.color) })),
    ...(free > 0 ? [{ id: "free", value: free, color: "" }] : []),
  ];
  return (
    <div className="savings-overview">
      {accounts.length > 1 && (
        <div className="recurrence-filters savings-accounts-switch" role="group" aria-label="Compte d’épargne">
          {accounts.map((a) => (
            <button key={a.id} type="button" aria-pressed={a.id === account.id} onClick={() => setChosen(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
      )}

      <section
        className="savings-hero"
        aria-label={`${account.name} : ${hidden ? "solde masqué" : m(balance)}`}
        style={walletSurfaceStyles(account.color) as CSSProperties}
      >
        <span>{account.name} · solde aujourd’hui</span>
        <strong>{m(balance)}</strong>
        {change !== 0 && (
          <small>
            {change > 0
              ? `${m(change, false, true)} mis de côté en ${month}`
              : `${m(-change, false)} sortis en ${month}`}
          </small>
        )}
      </section>

      <section className="card savings-history">
        <div className="savings-section-title">
          <h2>{history.length > 1 ? `Les ${history.length} derniers mois` : "Mois après mois"}</h2>
          {growth > 0 && <span>≈ {m(growth, false)} par mois</span>}
        </div>
        {history.length < 2 ? (
          <p className="savings-empty">
            Pécule suit ce livret depuis le {shortDate(account.openingDate)}. La courbe apparaîtra à la fin du mois.
          </p>
        ) : (
          <div
            className="savings-bars"
            role="img"
            aria-label={
              hidden
                ? "Évolution du solde masquée"
                : `Solde de ${account.name} de ${monthName(history[0].month)} à ${monthName(history.at(-1)!.month)} : de ${m(history[0].balance, false)} à ${m(history.at(-1)!.balance, false)}`
            }
          >
            {history.map((h, i) => (
              <span key={h.month} data-current={i === history.length - 1 || undefined}>
                <i
                  style={{
                    height: hidden ? "12%" : `${Math.max(6, ((h.balance - floor) / (highest - floor || 1)) * 100)}%`,
                  }}
                />
                <small>{monthName(h.month)}</small>
              </span>
            ))}
          </div>
        )}
      </section>

      {cushion !== null && (
        <section className="card savings-cushion">
          <span
            className="savings-ring"
            aria-hidden="true"
            style={{ "--share": `${hidden ? 0 : Math.min(100, (cushion / 3) * 100)}%` } as CSSProperties}
          >
            <span>
              <b>{hidden ? "•" : cushion.toLocaleString("fr-FR")}</b>
              <small>mois</small>
            </span>
          </span>
          <span>
            <h2>Votre coussin de sécurité</h2>
            <p>
              {hidden
                ? "Montants masqués."
                : `Le livret couvre ${cushion.toLocaleString("fr-FR")} mois de vos dépenses. ${
                    balance >= target
                      ? "Vous dépassez les 3 mois conseillés."
                      : `Objectif conseillé : 3 mois, soit encore ${m(target - balance, false)}.`
                  }`}
            </p>
          </span>
        </section>
      )}

      <section className="card savings-envelopes" aria-labelledby="envelopes-title">
        <div className="savings-section-title">
          <h2 id="envelopes-title">Mes enveloppes</h2>
          <span>À quoi sert chaque part</span>
        </div>
        {list.length > 0 && !hidden && (
          <span className="savings-share-bar" aria-hidden="true">
            {shares.map((s) => (
              <i
                key={s.id}
                style={{ flexGrow: s.value, background: s.color || undefined }}
                data-free={!s.color || undefined}
              />
            ))}
          </span>
        )}
        <ul className="savings-envelope-list">
          {list.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => open({ type: "goal", item: g })}>
                <i aria-hidden="true" style={{ background: walletColor(g.color) }} />
                <span>
                  <strong>{g.name}</strong>
                  <small>
                    {g.target > 0
                      ? `${m(g.saved, false)} sur ${m(g.target, false)}${g.deadline ? ` · ${shortDate(g.deadline)} ${g.deadline.slice(0, 4)}` : ""}`
                      : "Sans montant visé"}
                  </small>
                </span>
                <b>{m(g.saved, false)}</b>
              </button>
            </li>
          ))}
          <li data-free>
            <span className="savings-envelope-free">
              <i aria-hidden="true" />
              <span>
                <strong>Libre</strong>
                <small>{list.length ? "Pas encore réparti" : "Tout le livret, pour l’instant"}</small>
              </span>
              <b>{m(free, false)}</b>
            </span>
          </li>
        </ul>
        {free < 0 && !hidden && (
          <p className="savings-warning" role="status">
            Vos enveloppes dépassent le solde du livret de {m(-free, false)}. Touchez une enveloppe pour l’ajuster.
          </p>
        )}
        <button type="button" className="savings-add" onClick={() => open({ type: "goal", accountId: account.id })}>
          <Plus size={16} aria-hidden="true" />
          Nouvelle enveloppe
        </button>
        {loose.length > 0 && (
          <div className="savings-migrate">
            <p>
              {loose.length > 1 ? `Vos ${loose.length} objectifs sont suivis` : "Votre objectif est suivi"} à part du
              livret. Rangez-{loose.length > 1 ? "les" : "le"} dans {account.name} : {loose.length > 1 ? "ils" : "il"}{" "}
              deviendr{loose.length > 1 ? "ont des enveloppes" : "a une enveloppe"}, sans rien perdre.
            </p>
            <button
              type="button"
              className="secondary full-width"
              onClick={() => open({ type: "savings-setup", accountId: account.id })}
            >
              Ranger dans {account.name} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      <section className="card savings-moves" aria-labelledby="moves-title">
        <div className="savings-section-title">
          <h2 id="moves-title">Mouvements du livret</h2>
        </div>
        {transfers.map((r) => (
          <button key={r.id} type="button" className="savings-transfer" onClick={() => open({ type: "rule", item: r })}>
            <Repeat2 size={18} aria-hidden="true" />
            <span>
              <strong>{m(-r.amount, false)} chaque mois</strong>
              <small>
                le {r.day} depuis {b.accounts.find((a) => a.id === r.accountId)?.name ?? "un compte"}
              </small>
            </span>
          </button>
        ))}
        {moves.length ? (
          moves.map((t) => (
            <div className="savings-move" key={t.id}>
              <span>
                <strong>{t.label}</strong>
                <small>{shortDate(t.date)}</small>
              </span>
              <b className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true, true)}</b>
            </div>
          ))
        ) : (
          <p className="savings-empty">Aucun mouvement pour l’instant.</p>
        )}
        {!transfers.length && current && (
          <button
            type="button"
            className="primary full-width"
            onClick={() =>
              open({
                type: "rule",
                proposal: {
                  label: `Virement vers ${account.name}`,
                  amount: -Math.max(1000, Math.round(Math.max(growth, 0) / 1000) * 1000 || 10000),
                  accountId: current.id,
                  toAccountId: account.id,
                  category: "Épargne",
                  startDate: shiftDate(today, 1),
                  endDate: "",
                  frequency: "monthly",
                  timing: "date",
                  day: parseDate(shiftDate(today, 1)).getDate(),
                  active: true,
                  holidays: b.settings.holidayCalendar,
                  excludedDates: [],
                },
              })
            }
          >
            Prévoir un virement mensuel vers {account.name}
          </button>
        )}
      </section>
    </div>
  );
}
