"use client";
import { useRef, useState } from "react";
import AnimatedDetails from "./animated-details";
import { Check, LoaderCircle, Search, Plus, ChevronDown } from "lucide-react";
import { accountBalance, money, type Budget } from "../lib/budget";
import { adjustAccountBalance } from "../lib/account-balance";
import { parseBankAmount } from "../lib/bank-import";
import { FormField, ValidatedForm } from "./validated-form";
import { ErrorMessage } from "./interface-feedback";

type Props={budget:Budget;accountId:string;today:string;hidden:boolean;saving:boolean;serverError:string;draftKey:string;initialValue:string;save:(budget:Budget,message:string)=>Promise<boolean>;onDone:()=>void;onCancel:()=>void;onCompare:(value:string)=>void;onMissing:(difference:number,value:string)=>void};
export default function AccountBalanceAdjustment({budget,accountId,today,hidden,saving,serverError,draftKey,initialValue,save,onDone,onCancel,onCompare,onMissing}:Props){
 const account=budget.accounts.find(a=>a.id===accountId)!;
 const [value,setValue]=useState(initialValue),[acknowledged,setAcknowledged]=useState(false);
 const [error,setError]=useState(''),[working,setWorking]=useState(false),lock=useRef(false);
 const field=useRef<HTMLInputElement>(null);
 const fail=(message:string)=>{setError(message);requestAnimationFrame(()=>field.current?.focus());};
 const current=accountBalance(budget,accountId,today),target=parseBankAmount(value);
 const hasDifference=target!==null&&target!==current;
 const m=(amount:number)=>hidden?'•••• €':money(amount);
 return <ValidatedForm draftKey={draftKey} aria-busy={saving||working} onReset={()=>{setValue('');setError('');}} onSubmit={async event=>{
  event.preventDefault();if(lock.current)return;
  if(target===null){fail('Indiquez un solde valide, par exemple 1 250,00 ou −50,00.');return;}
  if(hasDifference&&!acknowledged){fail('Vérifiez les opérations avant de confirmer la correction de référence.');return;}
  lock.current=true;setWorking(true);setError('');
  try{const next=adjustAccountBalance(budget,accountId,target,today);if(await save(next,`Solde de ${account.name} ajusté.`))onDone();}
  catch(cause){fail(cause instanceof Error?cause.message:'Impossible d’ajuster ce solde.');}
  finally{lock.current=false;setWorking(false);}
 }}><p className="balance-adjust-account">{account.name}</p><dl className="balance-adjust-current"><dt>Solde actuel dans Pécule</dt><dd>{m(current)}</dd></dl><div className="operation-amount-field"><FormField label="Nouveau solde" error={error} hint="Indiquez le solde total du compte, pas le montant à ajouter."><span className="amount-input"><input ref={field} name="balance" type="text" inputMode="decimal" autoComplete="off" maxLength={24} required placeholder="Ex. 1250,00" value={value} disabled={saving||working} onChange={e=>{setValue(e.target.value);setError('');setAcknowledged(false);}}/><span>€</span></span></FormField></div>{target!==null&&<p className="field-hint balance-adjust-difference">Écart avec le solde actuel : {hidden?'•••• €':`${target-current>0?'+':''}${money(target-current)}`}</p>}{hasDifference&&<div className="balance-find-missing"><h3>Une opération oubliée ?</h3><p>Comparez le solde comptabilisé, hors paiements en attente. Vérifiez aussi les virements entre comptes avant d’ajouter une écriture.</p><button type="button" className="secondary full-width" disabled={saving||working} onClick={()=>onCompare(value)}><Search size={16}/>Vérifier les opérations du compte</button><button type="button" className="text-button" disabled={saving||working} onClick={()=>onMissing(target!-current,value)}><Plus size={16}/>Ajouter l’opération manquante</button></div>}{hasDifference?<AnimatedDetails className="form-options balance-correction"><summary>Corriger tout de même la référence<ChevronDown size={17}/></summary><p className="balance-adjust-note">La référence du compte sera corrigée. Vos opérations restent dans l’historique ; aucun revenu ni dépense n’est ajouté. Les anciens soldes calculés à partir de cette référence seront aussi corrigés.</p><label className="bank-import-confirm"><input type="checkbox" checked={acknowledged} disabled={saving||working} onChange={e=>setAcknowledged(e.target.checked)}/><span>J’ai vérifié les opérations et je souhaite corriger la référence du compte.</span></label><button type="submit" className="primary full-width" disabled={saving||working||!acknowledged}>{saving||working?<LoaderCircle size={17} className="spin"/>:<Check size={17}/>}Enregistrer le solde</button></AnimatedDetails>:<button type="submit" className="primary full-width" disabled={saving||working}>{saving||working?<LoaderCircle size={17} className="spin"/>:<Check size={17}/>}Enregistrer le solde</button>}{(error||serverError)&&<ErrorMessage>{error||serverError}</ErrorMessage>}<button type="button" className="text-button modal-form-cancel" disabled={saving||working} onClick={onCancel}>Annuler</button></ValidatedForm>;
}
