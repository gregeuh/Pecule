"use client";
import type {BudgetEditorProps} from "./budget-editor";
import type { ComponentProps, ReactNode } from "react";
import { Check, Wallet, Trash2, Info, Repeat2 } from "lucide-react";
import { shortDate } from "../lib/budget";
import { captureAccount } from "../lib/capture";
import { transactionRecurrence } from "../lib/transaction-recurrence";
import type { Modal } from "./budget-modal";
import QuickOperationForm from "./quick-operation-form";
import BankLinkDetails from "./bank-link-details";
import AmountInput from "./amount-input";
import Empty from "./budget-empty";
import CategoryIcon from "./category-icon";
import MerchantFields from "./merchant-fields";
import FormSection from "./form-section";
import FormOptions from "./form-options";
import { ValidatedForm, FormField } from "./validated-form";
import { ErrorMessage } from "./interface-feedback";
import SubmitButton from "./submit-button";

type Props = BudgetEditorProps & {
    modal: Extract<Modal, {
        type: "transaction";
    }>;
    hidden: boolean;
    notice: ReactNode;
    offlineCapture: boolean;
    captureSaving: boolean;
    merchantDirection: string;
    setMerchantDirection: (value: string) => void;
    noteDraftOpen: boolean;
    openFavorite: ComponentProps<typeof QuickOperationForm>["onFavorite"];
    m: (n: number, decimals?: boolean, signed?: boolean) => string;
};
/** Presentation only: the app retains financial writes and conflict recovery. */
export default function OperationEditor({ modal, b, today, draftKey, busy, error, onReset, onClose, submit, open, remove, hidden, notice, offlineCapture, captureSaving, merchantDirection, setMerchantDirection, noteDraftOpen, openFavorite, m }: Props) {
    const accountOptions = b.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>);
    return (<>{!b.accounts.length ? <Empty icon={Wallet} title="Il vous faut d’abord un compte" description="Vos opérations seront rattachées au compte de votre choix." action={<button type="button" className="primary" onClick={() => open({ type: "account" })}>Ajouter un compte</button>}/> : modal.item?.transferId ? <div className="transfer-detail"><CategoryIcon category="Virement"/><h3>{modal.item.label}</h3><strong className="detail-amount">{m(Math.abs(modal.item.amount))}</strong><p>{shortDate(modal.item.date)} · {b.accounts.find(a => a.id === modal.item?.accountId)?.name}</p><div className="info-callout"><Info size={18}/><p>Ce mouvement relie deux comptes. Ses deux écritures sont liées. Une association issue d’un import peut être dissociée en conservant les écritures. La suppression retire les deux côtés du virement.</p></div>{modal.item.transferOriginalCategory && <button type="button" className="secondary full-width" onClick={() => open({ type: "match-transfers", returnAccountId: modal.returnAccountId })}>Gérer les associations</button>}<BankLinkDetails transaction={modal.item}/><button type="button" className="danger full-width" onClick={() => remove("transaction", modal.item!.id)}><Trash2 size={16}/>Supprimer ce virement</button></div> : !modal.item ? <QuickOperationForm notice={notice} key={draftKey} draftKey={draftKey} budget={b} today={today} offline={offlineCapture} direction={merchantDirection} accountId={captureAccount(b, modal.accountId)} date={modal.initialDate ?? today} amount={modal.initialAmount} note={modal.initialNote} label={modal.initialLabel} category={modal.initialCategory} merchantId={modal.initialMerchantId} customIconUrl={modal.initialCustomIconUrl} hidden={hidden} saving={captureSaving} error={error} onDirection={setMerchantDirection} onReset={onReset} onSubmit={submit} onCancel={onClose} onTransfer={() => open({ type: "transfer" })} onFavorite={openFavorite} onFavorites={() => open({ type: "favorites" })}/> : <ValidatedForm key={draftKey} draftKey={draftKey} onReset={onReset} busy={busy} actions={<><SubmitButton busy={busy} icon={<Check size={16}/>}>Enregistrer l’opération</SubmitButton><button type="button" className="text-button panel-cancel" disabled={busy} onClick={onClose}>Annuler</button></>} onSubmit={submit}><FormSection title="L’opération"><div className="operation-value-grid"><div className="operation-amount-field"><FormField label="Montant"><AmountInput name="amount" defaultValue={modal.item ? Math.abs(modal.item.amount) : modal.initialAmount}/></FormField></div><div className="operation-type-field"><FormField label="Type"><select name="direction" onChange={e => setMerchantDirection(e.target.value)} defaultValue={modal.item ? modal.item.amount > 0 ? "income" : "expense" : modal.direction ?? "expense"}><option value="expense">Dépense</option><option value="income">Revenu</option></select></FormField></div></div><MerchantFields compact optionsTitle="Options · catégorie et logo" categoryRules={b.settings.categoryRules} remember initialLabel={modal.item?.label ?? modal.initialLabel} initialCategory={modal.item?.category ?? modal.initialCategory} initialMerchantId={modal.item?.merchantId ?? modal.initialMerchantId} initialCustomIconUrl={modal.item?.customIconUrl ?? modal.initialCustomIconUrl} direction={merchantDirection}/></FormSection><FormSection title="Date et compte"><div className="form-grid"><FormField label="Date"><input name="date" type="date" min="2000-01-01" max="2100-12-31" defaultValue={modal.item?.date ?? modal.initialDate ?? today} required/></FormField><FormField label="Compte"><select name="account" defaultValue={modal.item?.accountId ?? captureAccount(b, modal.accountId)}>{accountOptions}</select></FormField></div></FormSection><FormOptions title={modal.item?.note ? "Note de l’opération" : "Ajouter une note"} initialOpen={!!modal.item?.note || noteDraftOpen}><FormField label="Une note ? (facultatif)"><textarea className="resize-none" style={{ resize: "none", minHeight: 120 }} name="note" rows={2} maxLength={1000} defaultValue={modal.item?.note} placeholder="Un détail à garder en tête"/></FormField></FormOptions>{modal.item && (() => { const linked = b.rules.find(r => r.id === modal.item?.ruleId); const proposal = transactionRecurrence(modal.item, b, today); return linked ? <button type="button" className="secondary full-width" disabled={busy} onClick={() => open({ type: "rule", item: linked })}><Repeat2 size={17}/>Modifier la récurrence associée</button> : proposal ? <button type="button" className="secondary full-width" disabled={busy} onClick={() => open({ type: "rule", proposal, sourceTransactionId: modal.item!.id })}><Repeat2 size={17}/>Créer une récurrence</button> : null; })()}{modal.item?.ruleId && <p className="field-hint">Cette modification concerne uniquement cette échéance. La récurrence reste inchangée.</p>}{error && <ErrorMessage>{error}</ErrorMessage>}<BankLinkDetails transaction={modal.item}/><div className="form-danger-zone">{modal.item && <button type="button" className="destructive-action" aria-label="Supprimer cette opération" onClick={() => remove("transaction", modal.item!.id)}><Trash2 size={18}/>Supprimer cette opération</button>}</div></ValidatedForm>}</>);
}
