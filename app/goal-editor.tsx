"use client";
import { useState, type FormEvent } from "react";
import { Check, Sparkles } from "lucide-react";
import { colors, type Account, type Goal } from "../lib/budget";
import { walletColor } from "../lib/wallet-presentation";
import AmountInput from "./amount-input";
import { inputAmount } from "./download-file";
import FormOptions from "./form-options";
import FormSection from "./form-section";
import { ErrorMessage } from "./interface-feedback";
import SubmitButton from "./submit-button";
import { FormField, ValidatedForm } from "./validated-form";

export type GoalEditorProps = {
  modal: { type: "goal"; item?: Goal; accountId?: string };
  /** Savings accounts a goal can live in, as an envelope. */
  savings: Account[];
  /** Identifies the form and its saved draft. */
  formKey: string;
  busy: boolean;
  error: string;
  /** Shared BudgetApp submit handler (validation and save). */
  submit: (e: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onCancel: () => void;
};

/** Create or edit a savings goal. */
export default function GoalEditor({
  modal,
  savings,
  formKey,
  busy,
  error,
  submit,
  onReset,
  onCancel,
}: GoalEditorProps) {
  const [place, setPlace] = useState(modal.item ? (modal.item.accountId ?? "") : (modal.accountId ?? ""));
  const envelope = !!place;
  return (
    <ValidatedForm
      key={formKey}
      draftKey={formKey}
      onReset={onReset}
      busy={busy}
      actions={
        <>
          <SubmitButton busy={busy} icon={<Sparkles size={16} />}>
            {envelope ? "Enregistrer l’enveloppe" : "Enregistrer mon objectif"}
          </SubmitButton>
          <button type="button" className="text-button panel-cancel" disabled={busy} onClick={onCancel}>
            Annuler
          </button>
        </>
      }
      onSubmit={submit}
    >
      <FormSection title="Votre projet">
        <FormField label="Quel projet avez-vous en tête ?">
          <input
            name="name"
            maxLength={120}
            required
            placeholder="Un voyage, une sécurité, une envie…"
            defaultValue={modal.item?.name}
          />
        </FormField>
        {savings.length > 0 && (
          <FormField
            label="Où est cet argent ?"
            hint={
              envelope
                ? "Une enveloppe est une part de votre livret : son montant compte dans le solde du livret."
                : "Suivi à part : le montant est noté pour ce projet, sans lien avec un compte."
            }
          >
            <select name="goalAccount" value={place} onChange={(e) => setPlace(e.target.value)}>
              {savings.map((a) => (
                <option key={a.id} value={a.id}>
                  Dans mon {a.name} (une enveloppe)
                </option>
              ))}
              <option value="">Suivi à part, sans compte</option>
            </select>
          </FormField>
        )}
        <div className="form-grid">
          <FormField label={envelope ? "Montant visé (facultatif)" : "Objectif à atteindre"}>
            <AmountInput
              name="target"
              required={!envelope}
              defaultValue={modal.item?.target ? modal.item.target : undefined}
            />
          </FormField>
          <FormField label={envelope ? "Dans l’enveloppe aujourd’hui" : "Déjà mis de côté"}>
            <span className="amount-input">
              <input
                name="saved"
                type="number"
                step="0.01"
                min="0"
                max="1000000000"
                required
                defaultValue={inputAmount(modal.item?.saved ?? 0)}
              />
              <span>€</span>
            </span>
          </FormField>
        </div>
      </FormSection>
      <FormSection title="Votre rythme">
        <FormField
          label="À réserver chaque mois"
          hint="Facultatif : mettez 0 pour avancer librement. La réserve restante est retirée du disponible, sans effectuer de virement bancaire."
        >
          <span className="amount-input">
            <input
              name="monthly"
              type="number"
              step="0.01"
              min="0"
              max="1000000000"
              required
              defaultValue={inputAmount(modal.item?.monthly ?? 0)}
            />
            <span>€</span>
          </span>
        </FormField>
        <FormOptions title="Date et personnalisation">
          <FormField label="Une date en tête ? (facultatif)">
            <input name="deadline" type="date" min="2000-01-01" max="2100-12-31" defaultValue={modal.item?.deadline} />
          </FormField>
          <div className="form-grid">
            <FormField label="Une petite touche personnelle">
              <select name="icon" defaultValue={modal.item?.icon ?? "sun"}>
                <option value="sun">Un rayon de soleil</option>
                <option value="shield">La tranquillité</option>
                <option value="home">Un chez-soi</option>
                <option value="plane">Une aventure</option>
                <option value="sparkles">Une envie</option>
              </select>
            </FormField>
            <div className="field">
              <span>Couleur</span>
              <div className="color-choices">
                {colors.map((c, i) => (
                  <label key={c} style={{ background: walletColor(c) }} title={`Couleur ${i + 1}`}>
                    <input
                      type="radio"
                      name="color"
                      value={c}
                      defaultChecked={modal.item ? modal.item.color === c : i === 2}
                      required
                    />
                    <Check size={17} />
                    <span className="sr-only">Couleur {i + 1}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FormOptions>
        <p className="field-hint">
          {envelope
            ? "Changer le montant d’une enveloppe ne déplace pas d’argent : il dit seulement à quoi sert cette part du livret."
            : "Le montant déjà mis de côté sert au suivi de cet objectif. Il ne modifie pas le solde de vos comptes."}
        </p>
      </FormSection>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </ValidatedForm>
  );
}
