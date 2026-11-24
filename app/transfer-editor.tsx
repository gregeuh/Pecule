"use client";
import type { BudgetEditorProps } from "./budget-editor";

import { Check, Wallet, Info, Sparkles } from "lucide-react";

import type { Modal } from "./budget-modal";
import TransferPreview from "./transfer-preview";
import AmountInput from "./amount-input";
import Empty from "./budget-empty";
import { ValidatedForm, FormField } from "./validated-form";
import { ErrorMessage } from "./interface-feedback";
import SubmitButton from "./submit-button";

type Props = BudgetEditorProps & {
  modal: Extract<
    Modal,
    {
      type: "transfer" | "contribution";
    }
  >;
  hidden: boolean;
  transferSource?: string;
  transferTarget?: string;
};
/** Presentation only: the app retains financial writes and conflict recovery. */
export default function TransferEditor({
  modal,
  b,
  today,
  draftKey,
  busy,
  error,
  onReset,
  onClose,
  submit,
  open,
  hidden,
  transferSource,
  transferTarget,
}: Props) {
  return (
    <>
      {b.accounts.length < 2 ||
      (modal.type === "contribution" &&
        (!b.accounts.some((a) => a.type === "savings") || !b.accounts.some((a) => a.type !== "savings"))) ? (
        <Empty
          icon={Wallet}
          title={modal.type === "contribution" ? "Deux comptes, un projet." : "Deux comptes pour un virement"}
          description={
            modal.type === "contribution"
              ? "Ajoutez un compte courant et un compte d’épargne pour enregistrer un versement. Vous pouvez aussi modifier le montant déjà mis de côté dans votre objectif."
              : "Ajoutez au moins deux comptes pour déplacer un montant entre eux : comptes courants, épargne ou espèces."
          }
          action={
            <button type="button" className="primary" onClick={() => open({ type: "account" })}>
              Ajouter un compte
            </button>
          }
        />
      ) : (
        <ValidatedForm
          key={draftKey}
          draftKey={draftKey}
          onReset={onReset}
          busy={busy}
          actions={
            <>
              <SubmitButton busy={busy} icon={<Check size={16} />}>
                Enregistrer le virement
              </SubmitButton>
              <button type="button" className="text-button panel-cancel" disabled={busy} onClick={onClose}>
                Annuler
              </button>
            </>
          }
          onSubmit={submit}
        >
          {modal.type === "contribution" && (
            <div className="mini-project">
              <Sparkles size={19} />
              <strong>{modal.goal.name}</strong>
            </div>
          )}
          <TransferPreview budget={b} today={today} hidden={hidden} from={transferSource} to={transferTarget} />
          <FormField label="Montant">
            <AmountInput name="amount" />
          </FormField>
          <FormField label="Depuis le compte">
            <select name="from" defaultValue={transferSource}>
              {b.accounts
                .filter((a) => modal.type !== "contribution" || a.type !== "savings")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Vers le compte">
            <select name="to" defaultValue={transferTarget}>
              {b.accounts
                .filter((a) => modal.type !== "contribution" || a.type === "savings")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Date du virement">
            <input
              type="date"
              name="date"
              required
              min="2000-01-01"
              max={modal.type === "contribution" ? today : "2100-12-31"}
              defaultValue={today}
            />
          </FormField>
          <FormField label="Note (facultatif)">
            <input name="note" maxLength={1000} />
          </FormField>
          <div className="info-callout">
            <Info size={17} />
            <p>
              Pécule enregistre le mouvement dans votre budget. Aucun virement bancaire n’est effectué : réalisez-le
              depuis votre banque.
            </p>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ValidatedForm>
      )}
    </>
  );
}
