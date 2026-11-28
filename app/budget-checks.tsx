"use client";
import { useId, useState, type ReactNode } from "react";
import FoldButton from "./fold-button";
import { useCollapsed } from "./use-collapsed";
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
import { notOnStatement } from "../lib/statement-check";

type Props = {
  budget: Budget;
  today: string;
  busy: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  save: (next: Budget, message?: string) => Promise<boolean>;
  /** How many findings to show at most (the rest stays for later). */
  limit?: number;
  /** Opens « Pas sur votre relevé ». */
  onStatement?: () => void;
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
export default function BudgetChecks({ budget: b, today, busy, m, save, limit = 3, onStatement }: Props) {
  const [done, setDone] = useState("");
  const duplicates = duplicateRules(b);
  const twice = doubleCounts(b, today);
  const missing = onStatement ? notOnStatement(b) : [];
  const findings: (
    | { kind: "rules"; item: DuplicateRules }
    | { kind: "twice"; item: DoubleCount }
    | { kind: "statement"; item: { key: string } }
  )[] = [
    ...duplicates.map((item) => ({ kind: "rules" as const, item })),
    ...twice.map((item) => ({ kind: "twice" as const, item })),
    ...(missing.length ? [{ kind: "statement" as const, item: { key: `statement:${missing.length}` } }] : []),
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
        f.kind === "statement" ? (
          <CheckCard
            key="statement"
            id="statement"
            title={`${missing.length} opération${missing.length > 1 ? "s" : ""} pas sur votre relevé`}
            summary={m(
              missing.reduce((s, i) => s + i.transaction.amount, 0),
              true,
              true,
            )}
          >
            <p>
              {missing.length > 1
                ? "Pécule les a ajoutées à partir de vos récurrences, mais votre banque ne les montre pas : "
                : "Pécule l’a ajoutée à partir d’une récurrence, mais votre banque ne la montre pas : "}
              {missing
                .slice(0, 3)
                .map((i) => i.transaction.label)
                .join(", ")}
              {missing.length > 3 ? "…" : "."}
            </p>
            <button type="button" className="primary full-width" disabled={busy} onClick={onStatement}>
              {missing.length > 1 ? "Les vérifier" : "La vérifier"}
            </button>
          </CheckCard>
        ) : f.kind === "rules" ? (
          <CheckCard
            key={f.item.key}
            id={f.item.key}
            title={`Deux récurrences « ${f.item.rules[0].label} » ?`}
            summary={f.item.rules.map((r) => m(r.amount, true, true)).join(" et ")}
          >
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
          </CheckCard>
        ) : (
          <CheckCard
            key={f.item.key}
            id={f.item.key}
            title={`« ${f.item.rule.label} » compté deux fois ?`}
            summary={`${m(f.item.planned.amount, true, true)} prévu le ${shortDate(f.item.planned.date)} et enregistré le ${shortDate(f.item.recorded.date)}`}
          >
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
          </CheckCard>
        ),
      )}
    </section>
  );
}

/** One finding, folded to its title and a short summary when the person wants the home lighter. */
function CheckCard({
  id,
  title,
  summary,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  const body = useId();
  const [collapsed, toggle] = useCollapsed(`check:${id}`, id);
  return (
    <article className="budget-check" data-collapsed={collapsed || undefined}>
      <div className="budget-check-heading">
        <h3>{title}</h3>
        <FoldButton collapsed={collapsed} title={title} controls={body} onToggle={toggle} />
      </div>
      {collapsed && <p className="budget-check-summary">{summary}</p>}
      <div id={body} hidden={collapsed} className="budget-check-body">
        {children}
      </div>
    </article>
  );
}
