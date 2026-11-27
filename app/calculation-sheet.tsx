"use client";
import type { ReactNode } from "react";
import { CalendarDays, Scale } from "lucide-react";
import { futureTransactions, parseDate, shiftDate, shortDate, type Budget } from "../lib/budget";
import { duplicateRules } from "../lib/budget-checks";
import { latestReconciliation } from "../lib/bank-reconciliation";

type Overview = {
  total: number;
  expenses: number;
  reserve: number;
  available: number;
  end: string;
  salary?: { date: string; ruleId?: string };
};

/** « Pourquoi ce montant ? »: the real balance, every charge until payday, the reserve, and the payday taken. */
export default function CalculationSheet({
  budget: b,
  today,
  o,
  m,
  checks,
  onPayday,
  onCompare,
}: {
  budget: Budget;
  today: string;
  o: Overview;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  checks: ReactNode;
  onPayday: () => void;
  onCompare: (accountId: string) => void;
}) {
  const current = b.accounts.filter((a) => a.type !== "savings");
  const ids = new Set(current.map((a) => a.id));
  const charges = futureTransactions(b, shiftDate(today, 1), o.end)
    .filter((t) => ids.has(t.accountId) && t.amount < 0)
    .sort((x, y) => x.amount - y.amount);
  const doubled = new Set(duplicateRules(b).flatMap((d) => d.rules.map((r) => r.id)));
  const shown = charges.slice(0, 5),
    rest = charges.slice(5);
  const payday = b.settings.horizon === "salary" && o.salary;
  const main = current[0];
  const checked = main ? latestReconciliation(main)?.date : undefined;
  /** « 30 nov. » already ends a sentence; « 2 mai » needs its full stop. */
  const dot = (text: string) => (text.endsWith(".") ? text : `${text}.`);
  const weekday = (date: string) => parseDate(date).toLocaleDateString("fr-FR", { weekday: "long" });
  return (
    <div className="calculation-sheet">
      <div className="calculation-payday">
        <CalendarDays size={20} aria-hidden="true" />
        <p>
          {payday ? (
            <>
              Prochaine paie attendue le{" "}
              <strong>{dot(`${weekday(o.salary!.date)} ${shortDate(o.salary!.date)}`)}</strong> Le calcul va jusqu’au{" "}
              {dot(shortDate(o.end))}
            </>
          ) : (
            <>
              Le calcul va jusqu’à la fin du mois, le <strong>{dot(shortDate(o.end))}</strong>
            </>
          )}
        </p>
        <button type="button" className="text-button" onClick={onPayday}>
          Changer
        </button>
      </div>

      <div className="calculation-line">
        <span>
          <strong>Sur vos comptes courants</strong>
          <small>
            {current.map((a) => a.name).join(", ") || "Aucun compte courant"}
            {main
              ? checked
                ? ` · comparé à la banque le ${shortDate(checked)}`
                : " · jamais comparé à la banque"
              : ""}
          </small>
        </span>
        <b>{m(o.total)}</b>
      </div>

      <div className="calculation-charges">
        <h3>Charges prévues d’ici le {shortDate(o.end)}</h3>
        {shown.length ? (
          <ul>
            {shown.map((t) => (
              <li key={t.id} data-doubled={(t.ruleId && doubled.has(t.ruleId)) || undefined}>
                <span>
                  <strong>{t.label}</strong>
                  <small>
                    {shortDate(t.date)}
                    {t.ruleId && doubled.has(t.ruleId) ? " · même nom qu’une autre récurrence" : ""}
                  </small>
                </span>
                <b>{m(t.amount, true, true)}</b>
              </li>
            ))}
            {rest.length > 0 && (
              <li>
                <span>
                  <strong>
                    {rest.length} autre{rest.length > 1 ? "s" : ""} charge{rest.length > 1 ? "s" : ""}
                  </strong>
                  <small>
                    {rest
                      .map((t) => t.label)
                      .slice(0, 3)
                      .join(", ")}
                    …
                  </small>
                </span>
                <b>
                  {m(
                    rest.reduce((s, t) => s + t.amount, 0),
                    true,
                    true,
                  )}
                </b>
              </li>
            )}
          </ul>
        ) : (
          <p className="field-hint">Aucune charge prévue sur cette période.</p>
        )}
      </div>

      {o.reserve > 0 && (
        <div className="calculation-line">
          <span>
            <strong>Réserve d’épargne restante</strong>
            <small>Montants mensuels de vos objectifs, moins les versements du mois</small>
          </span>
          <b>{m(-o.reserve, true, true)}</b>
        </div>
      )}

      <div className="calculation-total">
        <span>Ce qu’il vous reste</span>
        <strong>{m(o.available)}</strong>
      </div>

      {checks}

      {main && (
        <button type="button" className="secondary full-width" onClick={() => onCompare(main.id)}>
          <Scale size={16} aria-hidden="true" />
          Comparer avec le solde de ma banque
        </button>
      )}
    </div>
  );
}
