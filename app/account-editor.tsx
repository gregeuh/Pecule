"use client";
import type {BudgetEditorProps} from "./budget-editor";

import { Check, Trash2 } from "lucide-react";
import { colors } from "../lib/budget";
import { walletColor } from "../lib/wallet-presentation";
import type { Modal } from "./budget-modal";
import AmountInput from "./amount-input";
import FormSection from "./form-section";
import FormOptions from "./form-options";
import { ValidatedForm, FormField } from "./validated-form";
import { ErrorMessage } from "./interface-feedback";
import SubmitButton from "./submit-button";

type Props = BudgetEditorProps & {
    modal: Extract<Modal, {
        type: "account";
    }>;
};
/** Presentation only: the app retains financial writes and conflict recovery. */
export default function AccountEditor({ modal, b, today, draftKey, busy, error, onReset, onClose, submit, remove }: Props) {
    return (<ValidatedForm key={draftKey} draftKey={draftKey} onReset={onReset} busy={busy} actions={<><SubmitButton busy={busy} icon={<Check size={16}/>}>Enregistrer le compte</SubmitButton><button type="button" className="text-button panel-cancel" disabled={busy} onClick={onClose}>Annuler</button></>} onSubmit={submit}><FormSection title="Le compte"><FormField label="Nom du compte"><input name="name" maxLength={120} required defaultValue={modal.item?.name} placeholder="Mon compte du quotidien"/></FormField><div className="form-grid"><FormField label="Type de compte"><select name="type" defaultValue={modal.item?.type ?? "current"}><option value="current">Compte courant</option><option value="savings">Compte d’épargne</option><option value="cash">Espèces</option></select></FormField></div></FormSection><FormSection title="Le solde de départ"><div className="form-grid"><FormField label="Solde de référence"><AmountInput name="balance" defaultValue={modal.item?.openingBalance} positive={false}/></FormField><FormField label="Date de référence"><input name="date" type="date" required min="2000-01-01" max={today} defaultValue={modal.item?.openingDate ?? today}/></FormField></div><p className="field-hint">Ce solde sert de point de départ. Les opérations ajoutées depuis cette date s’y ajoutent. Les récurrences automatiques commencent après cette date pour éviter de recompter ce qui est déjà inclus.</p><FormOptions title="Banque et apparence"><FormField label="Banque ou précision (facultatif)"><input name="bank" maxLength={120} defaultValue={modal.item?.bank} placeholder="Pour vous y retrouver"/></FormField><div className="field"><span>Votre couleur</span><div className="color-choices">{colors.map((c, i) => <label key={c} style={{ background: walletColor(c) }} title={`Couleur ${i + 1}`}><input type="radio" name="color" value={c} defaultChecked={modal.item ? modal.item.color === c : i === b.accounts.length % colors.length} required/><Check size={17}/><span className="sr-only">Couleur {i + 1}</span></label>)}</div></div></FormOptions></FormSection>{error && <ErrorMessage>{error}</ErrorMessage>}{modal.item && <div className="form-danger-zone"><button type="button" className="destructive-action" disabled={busy} aria-label="Supprimer ce compte" onClick={() => remove("account", modal.item!.id)}><Trash2 size={18}/>Supprimer ce compte</button></div>}</ValidatedForm>);
}
