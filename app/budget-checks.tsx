"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { futureTransactions, shiftDate, shortDate, type Budget, type Rule } from "../lib/budget";
import {
  dismissCheck,
  doubleCounts,
  duplicateRules,
  keepRule,
  mergeDoubleCount,
  type DoubleCount,
  type DuplicateRules,
} from "../lib/budget-checks";

type Props = {
  budget: Budget;
  today: string;
  busy: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  save: (next: Budget, message?: string) => Promise<boolean>;
  /** How many findings to show at most (the rest stays for later). */
  limit?: number;
};

const rhythm = (r: Rule) =>
  r.frequency === "weekly"
    ? "Chaque semaine"
    : r.frequency === "yearly"
      ? "Chaque année"
      : r.timing === "last-business-day"
        ? "Le dernier jour ouvré du mois"
        : `Le ${r.day} de chaque mois`;

/**
 * Things that make « ce qu’il vous reste » wrong: two recurrences for one payment, or a planned payment counted
 * next to the real one. Each finding is fixed or dismissed in one tap; nothing changes without it.
 */
export default function BudgetChecks({ budget: b, today, busy, m, save, limit = 3 }: Props) {
  const [done, setDone] = useState("");
  const duplicates = duplicateRules(b);
  const twice = doubleCounts(b, today);
  const findings: ({ kind: "rules"; item: DuplicateRules } | { kind: "twice"; item: DoubleCount })[] = [
    ...duplicates.map((item) => ({ kind: "rules" as const, item })),
    ...twice.map((item) => ({ kind: "twice" as const, item })),
  ].slice(0, limit);
  if (!findings.length)
    return done ? (
      <p className="budget-checks-done" role="status">
        <Check size={16} aria-hidden="true" /> {done}
      </p>
    ) : null;
  const next = (r: Rule) =>
    futureTransactions({ ...b, rules: [r], transactions: [] }, shiftDate(today, 1), shiftDate(today, 400))[0];
  return (
    <section className="budget-checks" aria-label="Vérifications du budget">
      {findings.map((f) =>
        f.kind === "rules" ? (
          <article key={f.item.key} className="budget-check">
            <h3>Deux récurrences « {f.item.rules[0].label} » ?</h3>
            <p>
              Même nom, montants proches : si c’est le même paiement, il est compté deux fois. Gardez la bonne : l’autre
              est supprimée, avec les échéances que Pécule avait comptées pour elle. Vos opérations importées ou saisies
              restent.
            </p>
            <div className="budget-check-pair">
              {f.item.rules.map((r) => (
                <div key={r.id}>
                  <strong>{m(r.amount, true, true)}</strong>
                  <small>{rhythm(r)}</small>
                  {next(r) && <small>Prochaine : {shortDate(next(r)!.date)}</small>}
                  {r.bankLabel && <small className="budget-check-bank">{r.bankLabel}</small>}
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={async () => {
                      const drop = f.item.rules.find((x) => x.id !== r.id)!;
                      if (await save(keepRule(b, f.item, r.id), "Récurrence en double supprimée."))
                        setDone(`Doublon retiré : ${m(Math.abs(drop.amount))} ne sont plus comptés deux fois.`);
                    }}
                  >
                    Garder celle-ci
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => void save(dismissCheck(b, f.item.key), "C’est noté, ces deux récurrences restent.")}
            >
              Ce ne sont pas des doublons
            </button>
          </article>
        ) : (
          <article key={f.item.key} className="budget-check">
            <h3>« {f.item.rule.label} » compté deux fois ?</h3>
            <p>L’échéance prévue et une opération enregistrée se ressemblent. Pécule compte les deux.</p>
            <div className="budget-check-pair">
              <div>
                <small>Prévu par la récurrence</small>
                <strong>{m(f.item.planned.amount, true, true)}</strong>
                <small>{shortDate(f.item.planned.date)}</small>
              </div>
              <div>
                <small>{f.item.recorded.importBatch ? "Importé du relevé" : "Enregistré"}</small>
                <strong>{m(f.item.recorded.amount, true, true)}</strong>
                <small>
                  {shortDate(f.item.recorded.date)} · {f.item.recorded.label}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="primary full-width"
              disabled={busy}
              onClick={async () => {
                if (await save(mergeDoubleCount(b, f.item), "Opérations réunies."))
                  setDone(`Réunies : ${m(-f.item.planned.amount, true)} ne sont plus comptés deux fois.`);
              }}
            >
              C’est le même : n’en garder qu’un
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => void save(dismissCheck(b, f.item.key), "C’est noté, ce sont deux paiements.")}
            >
              Ce sont deux paiements
            </button>
          </article>
        ),
      )}
    </section>
  );
}
