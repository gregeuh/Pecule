"use client";
import type { FormEvent } from "react";
import { LoaderCircle, Repeat2, Wallet } from "lucide-react";
import { parseDate, shiftDate, type Budget, type Rule } from "../lib/budget";
import AmountInput from "./amount-input";
import Empty from "./budget-empty";
import type { Modal } from "./budget-modal";
import FormOptions from "./form-options";
import FormSection from "./form-section";
import { ErrorMessage } from "./interface-feedback";
import MerchantFields from "./merchant-fields";
import { FormField, ValidatedForm } from "./validated-form";

export type RuleEditorProps = {
  modal: { type: "rule"; item?: Rule; proposal?: Omit<Rule, "id">; sourceTransactionId?: string };
  budget: Budget;
  today: string;
  /** Identifies the form and its saved draft. */
  formKey: string;
  busy: boolean;
  saving: boolean;
  error: string;
  merchantDirection: string;
  setMerchantDirection: (value: string) => void;
  open: (modal: Modal) => void;
  /** Shared BudgetApp submit handler (validation and save). */
  submit: (e: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onCancel: () => void;
};

/** Create, edit or propose a recurring income or expense. */
export default function RuleEditor({
  modal,
  budget: b,
  today,
  formKey,
  busy,
  saving,
  error,
  merchantDirection,
  setMerchantDirection,
  open,
  submit,
  onReset,
  onCancel,
}: RuleEditorProps) {
  const ruleDraft = modal.item ?? modal.proposal;
  const recurrenceSource = modal.sourceTransactionId
    ? b.transactions.find((t) => t.id === modal.sourceTransactionId)
    : undefined;
  const recurrenceMin = recurrenceSource
    ? shiftDate(recurrenceSource.date > today ? recurrenceSource.date : today, 1)
    : "2000-01-01";
  const accountOptions = b.accounts.map((a) => (
    <option key={a.id} value={a.id}>
      {a.name}
    </option>
  ));
  return (
    <>
      {!b.accounts.length ? (
        <Empty
          icon={Wallet}
          title="Commençons par un compte"
          description="Les récurrences seront rattachées à ce compte."
          action={
            <button type="button" className="primary" onClick={() => open({ type: "account" })}>
              Ajouter un compte
            </button>
          }
        />
      ) : (
        <ValidatedForm
          key={formKey}
          draftKey={formKey}
          onReset={onReset}
          busy={busy}
          actions={
            <>
              <button type="submit" className="primary full-width" disabled={busy}>
                {saving ? <LoaderCircle size={16} className="spin" /> : <Repeat2 size={16} />}Enregistrer la récurrence
              </button>
              <button
                type="button"
                className="text-button panel-cancel"
                disabled={busy}
                onClick={() => (recurrenceSource ? open({ type: "transaction", item: recurrenceSource }) : onCancel())}
              >
                Annuler
              </button>
            </>
          }
          onSubmit={submit}
        >
          {recurrenceSource && (
            <div className="info-callout">
              <Repeat2 size={18} />
              <p>
                L’opération enregistrée est conservée. Choisissez la fréquence et la prochaine échéance : seules les
                échéances futures seront ajoutées, sans doublon de l’opération d’origine.
              </p>
            </div>
          )}
          <FormSection title="La récurrence">
            <MerchantFields
              categoryRules={b.settings.categoryRules}
              initialLabel={ruleDraft?.label}
              initialCategory={ruleDraft?.category}
              initialMerchantId={ruleDraft?.merchantId}
              initialCustomIconUrl={ruleDraft?.customIconUrl}
              direction={merchantDirection}
            />
            <div className="form-grid">
              <FormField label="Type">
                <select
                  name="direction"
                  onChange={(e) => setMerchantDirection(e.target.value)}
                  defaultValue={ruleDraft && ruleDraft.amount > 0 ? "income" : "expense"}
                >
                  <option value="expense">Dépense récurrente</option>
                  <option value="income">Entrée d’argent récurrente</option>
                </select>
              </FormField>
              <FormField label="Montant">
                <AmountInput name="amount" defaultValue={ruleDraft ? Math.abs(ruleDraft.amount) : undefined} />
              </FormField>
            </div>
            <div className="form-grid">
              <FormField label="Compte">
                <select name="account" defaultValue={ruleDraft?.accountId ?? b.accounts[0]?.id}>
                  {accountOptions}
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Le rythme">
            <div className="form-grid">
              <FormField label="Fréquence">
                <select name="frequency" defaultValue={ruleDraft?.frequency ?? "monthly"}>
                  <option value="monthly">Chaque mois</option>
                  <option value="weekly">Chaque semaine</option>
                  <option value="yearly">Chaque année</option>
                </select>
              </FormField>
              <FormField label="Règle de date">
                <select name="timing" defaultValue={ruleDraft?.timing ?? "date"}>
                  <option value="date">Jour fixe</option>
                  <option value="last-business-day">Dernier jour ouvré du mois</option>
                </select>
              </FormField>
            </div>
            <div className="form-grid">
              <FormField
                label="Jour du mois (pour une date fixe)"
                hint="Un jour absent du mois est ramené au dernier jour."
              >
                <input
                  name="day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  defaultValue={ruleDraft?.day ?? parseDate(today).getDate()}
                />
              </FormField>
            </div>
            <div className="form-grid">
              <FormField label="À partir du">
                <input
                  name="date"
                  type="date"
                  min={recurrenceMin}
                  max="2100-12-31"
                  required
                  defaultValue={ruleDraft?.startDate ?? shiftDate(today, 1)}
                />
              </FormField>
            </div>
            <FormOptions
              title="Jours fériés et fin de série"
              initialOpen={!!ruleDraft?.endDate || (!!ruleDraft && ruleDraft.holidays !== b.settings.holidayCalendar)}
            >
              <FormField label="Jours fériés à exclure">
                <select name="holidays" defaultValue={ruleDraft?.holidays ?? b.settings.holidayCalendar}>
                  <option value="FR">France · calendrier national</option>
                  <option value="none">Aucun · week-ends uniquement</option>
                </select>
              </FormField>
              <FormField label="Jusqu’au (facultatif)">
                <input name="end" type="date" min="2000-01-01" max="2100-12-31" defaultValue={ruleDraft?.endDate} />
              </FormField>
              <p className="field-hint">
                Chaque semaine : le jour de la date de début est utilisé. Chaque année : le mois de début est utilisé.
                Les autres règles de date concernent les fréquences mensuelles et annuelles. Les opérations passées
                restent conservées après une modification.
              </p>
            </FormOptions>
          </FormSection>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ValidatedForm>
      )}
    </>
  );
}
