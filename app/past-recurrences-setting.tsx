"use client";
import { useId } from "react";
import type { Budget } from "../lib/budget";
import { statementCoverage } from "../lib/budget";
import { statementModeEffect } from "../lib/statement-check";

const CHOICES = [
  {
    id: "date",
    title: "Dès sa date",
    text: "Pécule la compte comme payée le jour prévu, même si votre banque ne l’a pas encore prélevée. Pratique si vous n’importez pas vos relevés.",
  },
  {
    id: "statement",
    title: "Quand elle apparaît sur le relevé",
    text: "Avant sa date, elle reste prévue et compte dans ce qu’il vous reste. Après, elle n’est comptée que si votre banque l’a vraiment prélevée.",
  },
] as const;

/**
 * « Quand compter une récurrence ? »: on its date (an estimate), or only once the bank statement shows it. Saved on
 * the spot; the operations already added and missing from the statement can be reviewed from here.
 */
export default function PastRecurrencesSetting({
  budget: b,
  busy,
  m,
  save,
  onReview,
  card = true,
}: {
  budget: Budget;
  busy: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  save: (next: Budget, message?: string) => Promise<boolean>;
  onReview: () => void;
  /** In Réglages it is a card of its own; in a sheet, the sheet gives the title. */
  card?: boolean;
}) {
  const name = useId();
  const mode = b.settings.pastRecurrences ?? "date";
  const imports = b.accounts.some((a) => statementCoverage(b, a.id));
  const effect = statementModeEffect(b);
  const choose = (next: "date" | "statement") => {
    if (next === mode) return;
    const settings = { ...b.settings };
    if (next === "date") delete settings.pastRecurrences;
    else settings.pastRecurrences = next;
    void save(
      { ...b, settings },
      next === "statement"
        ? "Les récurrences passées attendront votre relevé."
        : "Les récurrences passées sont comptées dès leur date.",
    );
  };
  const body = (
    <>
      <p>
        Une fois sa date passée, Pécule peut compter une récurrence tout de suite, ou attendre de la voir sur votre
        relevé.
      </p>
      <div className="past-recurrences-choices" role="radiogroup" aria-label="Compter une récurrence passée">
        {CHOICES.map((c) => (
          <label key={c.id} className="past-recurrences-choice" data-selected={mode === c.id || undefined}>
            <input
              type="radio"
              name={name}
              value={c.id}
              checked={mode === c.id}
              disabled={busy}
              onChange={() => choose(c.id)}
            />
            <span>
              <strong>{c.title}</strong>
              <small>{c.text}</small>
              {c.id === "statement" && (
                <em className="origin-badge" data-kind="advice">
                  Conseillé si vous importez vos relevés
                </em>
              )}
            </span>
          </label>
        ))}
      </div>
      {mode === "statement" && !imports && (
        <p className="field-hint">
          Vous n’avez encore importé aucun relevé : en attendant, les récurrences restent comptées dès leur date.
        </p>
      )}
      {effect.count > 0 && (
        <button type="button" className="text-button" onClick={onReview}>
          {effect.count} opération{effect.count > 1 ? "s" : ""} déjà ajoutée{effect.count > 1 ? "s" : ""} (
          {m(Math.abs(effect.total))}) {effect.count > 1 ? "ne sont" : "n’est"} pas sur votre relevé · Les revoir
        </button>
      )}
    </>
  );
  return card ? (
    <section className="card settings-card past-recurrences">
      <h3>Quand compter une récurrence ?</h3>
      {body}
    </section>
  ) : (
    <div className="past-recurrences">{body}</div>
  );
}
