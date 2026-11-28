"use client";
import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { shortDate, type Budget, type Rule } from "../lib/budget";
import { keepNotOnStatement, notOnStatement, removeNotOnStatement } from "../lib/statement-check";

/** « 27 nov. » already ends a sentence; « 2 mai » needs its full stop. */
const dot = (text: string) => (text.endsWith(".") ? text : `${text}.`);
const rhythm = (r: Rule) =>
  r.frequency === "weekly" ? "hebdomadaire" : r.frequency === "yearly" ? "annuelle" : "mensuelle";

/**
 * « Pas sur votre relevé »: operations Pécule added from a recurrence on days the statement covers, that the bank
 * does not show. « Retirer » gives the money back to the balance (the recurrence goes on), « Elle a bien eu lieu »
 * keeps it for good.
 */
export default function NotOnStatementSheet({
  budget: b,
  saving,
  m,
  save,
  onDone,
  onSettings,
}: {
  budget: Budget;
  saving: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  save: (next: Budget, message?: string) => Promise<boolean>;
  onDone: () => void;
  onSettings: () => void;
}) {
  const items = notOnStatement(b);
  const [done, setDone] = useState("");
  const from = items.reduce((s, i) => (!s || i.from < s ? i.from : s), ""),
    to = items.reduce((s, i) => (i.to > s ? i.to : s), "");
  const total = items.reduce((s, i) => s + i.transaction.amount, 0);
  const statementMode = b.settings.pastRecurrences === "statement";
  return (
    <div className="not-on-statement">
      {items.length ? (
        <>
          <p className="form-intro">
            Votre relevé va du {shortDate(from)} au {dot(shortDate(to))}{" "}
            {items.length > 1
              ? "Pécule avait ajouté ces opérations à partir de vos récurrences, mais votre banque ne les montre pas."
              : "Pécule avait ajouté cette opération à partir d’une récurrence, mais votre banque ne la montre pas."}
          </p>
          <ul className="not-on-statement-list">
            {items.map((i) => (
              <li key={i.key}>
                <div className="not-on-statement-row">
                  <span>
                    <strong>{i.transaction.label}</strong>
                    <small>
                      {shortDate(i.transaction.date)} · récurrence {rhythm(i.rule)}
                    </small>
                  </span>
                  <b>{m(i.transaction.amount, true, true)}</b>
                </div>
                <div className="not-on-statement-actions">
                  <button
                    type="button"
                    className="danger-soft"
                    disabled={saving}
                    onClick={async () => {
                      if (await save(removeNotOnStatement(b, [i]), "Opération retirée."))
                        setDone(`Retirée : ${m(Math.abs(i.transaction.amount))} rendus au solde.`);
                    }}
                  >
                    Retirer
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={saving}
                    onClick={async () => {
                      if (await save(keepNotOnStatement(b, i), "C’est noté, elle reste.")) setDone("Gardée.");
                    }}
                  >
                    Elle a bien eu lieu
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {done && (
            <p className="budget-checks-done" role="status">
              <Check size={16} aria-hidden="true" /> {done}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="primary"
              disabled={saving}
              onClick={async () => {
                if (
                  await save(
                    removeNotOnStatement(b, items),
                    `${items.length} opération${items.length > 1 ? "s" : ""} retirée${items.length > 1 ? "s" : ""}.`,
                  )
                )
                  setDone(`${m(Math.abs(total))} rendus au solde.`);
              }}
            >
              {saving ? <LoaderCircle size={16} className="spin" /> : null}
              Retirer {items.length > 1 ? `les ${items.length}` : "l’opération"} ({m(Math.abs(total))})
            </button>
          </div>
          <p className="field-hint">
            Retirer n’arrête pas la récurrence : les prochaines échéances restent prévues. Pour l’arrêter, ouvrez-la
            dans Récurrences.
          </p>
        </>
      ) : (
        <p className="budget-checks-done" role="status">
          <Check size={16} aria-hidden="true" /> {done || "Tout ce que Pécule a ajouté est sur votre relevé."}
        </p>
      )}
      {!statementMode && (
        <button type="button" className="text-button" onClick={onSettings}>
          Ne plus ajouter une récurrence avant de la voir sur le relevé
        </button>
      )}
      {!items.length && (
        <div className="form-actions">
          <button type="button" className="primary" onClick={onDone}>
            Terminé
          </button>
        </div>
      )}
    </div>
  );
}
