"use client";
import { inputAmount } from "./download-file";
import { useEffect, useRef, useState } from "react";
import AnimatedDetails from "./animated-details";
import { Check, LoaderCircle, Search, Plus, ChevronDown } from "lucide-react";
import { accountVerification } from "../lib/account-verification";
import { accountBalance, money, shortDate, type Budget, type Transaction } from "../lib/budget";
import { adjustAccountBalance } from "../lib/account-balance";
import { parseBankAmount } from "../lib/bank-import";
import { FormField, ValidatedForm } from "./validated-form";
import { ErrorMessage } from "./interface-feedback";

type Props = {
  budget: Budget;
  accountId: string;
  today: string;
  hidden: boolean;
  saving: boolean;
  serverError: string;
  draftKey: string;
  initialValue: string;
  save: (budget: Budget, message: string) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
  onCompare: (value: string) => void;
  onInspect: (item: Transaction) => void;
  onImport: () => void;
  onMissing: (difference: number) => void;
};
export default function AccountBalanceAdjustment({
  budget,
  accountId,
  today,
  hidden,
  saving,
  serverError,
  draftKey,
  initialValue,
  save,
  onDone,
  onCancel,
  onCompare,
  onInspect,
  onImport,
  onMissing,
}: Props) {
  const account = budget.accounts.find((a) => a.id === accountId)!;
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(""),
    [working, setWorking] = useState(false),
    lock = useRef(false);
  const field = useRef<HTMLInputElement>(null);
  const fail = (message: string) => {
    setError(message);
    requestAnimationFrame(() => field.current?.focus());
  };
  const current = accountBalance(budget, accountId, today),
    target = parseBankAmount(value);
  const hasDifference = target !== null && target !== current;
  const [verified, setVerified] = useState<{ budget: Budget; today: string; through: string | null }>();
  useEffect(() => {
    if (!hasDifference) return;
    let active = true;
    void accountVerification(budget, accountId, today)
      .then((result) => {
        if (active)
          setVerified({
            budget,
            today,
            through: result.state === "older" || result.state === "current" ? result.date : null,
          });
      })
      .catch(() => {
        if (active) setVerified({ budget, today, through: null });
      });
    return () => {
      active = false;
    };
  }, [budget, accountId, today, hasDifference]);
  const checked = verified?.budget === budget && verified.today === today;
  const through = checked ? verified.through : null;
  const recent = hasDifference
    ? budget.transactions
        .filter(
          (t) =>
            t.accountId === accountId &&
            !t.balanceIncluded &&
            t.date >= account.openingDate &&
            t.date <= today &&
            (!through || t.date > through),
        )
        .reverse()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
    : [];
  const m = (amount: number) => (hidden ? "•••• €" : money(amount));
  return (
    <ValidatedForm
      draftKey={draftKey}
      aria-busy={saving || working}
      onReset={() => {
        setValue("");
        setError("");
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current) return;
        if (target === null) {
          fail("Indiquez un solde valide, par exemple 1 250,00 ou −50,00.");
          return;
        }
        lock.current = true;
        setWorking(true);
        setError("");
        try {
          const next = adjustAccountBalance(budget, accountId, target, today);
          if (await save(next, `Solde de ${account.name} ajusté.`)) onDone();
        } catch (cause) {
          fail(cause instanceof Error ? cause.message : "Impossible d’ajuster ce solde.");
        } finally {
          lock.current = false;
          setWorking(false);
        }
      }}
    >
      <p className="balance-adjust-account">{account.name}</p>
      <dl className="balance-adjust-current">
        <dt>Solde actuel dans Pécule</dt>
        <dd>{m(current)}</dd>
      </dl>
      <div className="operation-amount-field">
        <FormField
          label="Nouveau solde"
          error={error}
          hint="Indiquez le solde total du compte, pas le montant à ajouter."
        >
          <span className="amount-input">
            <input
              ref={field}
              name="balance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              maxLength={24}
              required
              placeholder="Ex. 1250,00"
              value={value}
              disabled={saving || working}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
            />
            <span>€</span>
          </span>
        </FormField>
        <button
          type="button"
          className="secondary compact"
          aria-label="Solde négatif"
          aria-pressed={value.trim().startsWith("-") || (target !== null && target < 0)}
          disabled={saving || working}
          onClick={() => {
            const raw = value.trim();
            const negative = raw.startsWith("-") || raw.startsWith("−") || (target !== null && target < 0);
            setValue(
              negative
                ? target === null
                  ? raw.slice(1)
                  : inputAmount(Math.abs(target))
                : "-" + raw.replace(/^\+/, ""),
            );
            setError("");
            field.current?.focus();
          }}
        >
          − Solde négatif
        </button>
      </div>
      {target !== null && (
        <p className="field-hint balance-adjust-difference">
          Écart avec le solde actuel : {hidden ? "•••• €" : money(target - current, true, true)}
        </p>
      )}
      <p className="balance-adjust-note">
        L’ajustement corrige le solde de référence et les soldes calculés à partir de celui-ci. Il ne crée aucune
        opération.
      </p>
      {hasDifference && (
        <section className="balance-find-missing" aria-label="Examiner l’écart">
          <h3>{checked ? "Dernières opérations à vérifier" : "Dernières opérations"}</h3>
          {recent.length ? (
            <ul className="bank-tools-list balance-recent">
              {recent.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="account-activity-row"
                    disabled={saving || working}
                    onClick={() => onInspect(t)}
                  >
                    <span>
                      <strong>{t.label}</strong>
                      <small>{shortDate(t.date)}</small>
                    </span>
                    <b>{hidden ? "•••• €" : money(t.amount, true, true)}</b>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="field-hint">Aucune opération récente à vérifier sur ce compte.</p>
          )}
          <div className="bank-tools-actions">
            <button
              type="button"
              className="secondary compact"
              disabled={saving || working}
              onClick={() => onMissing(target - current)}
            >
              <Plus size={16} />
              Ajouter l’opération manquante
            </button>
            <button type="button" className="secondary compact" disabled={saving || working} onClick={onImport}>
              Importer un CSV
            </button>
          </div>
        </section>
      )}
      <button type="submit" className="primary full-width" disabled={saving || working}>
        {saving || working ? <LoaderCircle size={17} className="spin" /> : <Check size={17} />}Enregistrer le solde
      </button>
      {target !== null && (
        <AnimatedDetails className="form-options balance-correction">
          <summary>
            Rapprochement complet
            <ChevronDown size={17} />
          </summary>
          <div className="balance-find-missing">
            <button
              type="button"
              className="secondary full-width"
              disabled={saving || working}
              onClick={() => onCompare(value)}
            >
              <Search size={16} />
              Vérifier les opérations du compte
            </button>
          </div>
        </AnimatedDetails>
      )}
      {(error || serverError) && <ErrorMessage>{error || serverError}</ErrorMessage>}
      <button type="button" className="text-button modal-form-cancel" disabled={saving || working} onClick={onCancel}>
        Annuler
      </button>
    </ValidatedForm>
  );
}
