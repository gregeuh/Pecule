"use client";
import {useContext,useLayoutEffect,useRef,useState} from 'react';
import {ArrowRight,Wallet,CircleAlert} from 'lucide-react';
import {money,shortDate,type Budget} from '../lib/budget';
import {operationBalancePreview,type OperationBalanceDraft} from '../lib/operation-balance-preview';
import {FormDraftValues} from './form-drafts';

export default function OperationBalancePreview({budget,today,hidden,accountId,amount,date,direction}:{budget:Budget;today:string;hidden:boolean;accountId:string;amount?:number;date:string;direction:string}){
 const saved=useContext(FormDraftValues),surface=useRef<HTMLElement>(null);
 const [draft,setDraft]=useState<OperationBalanceDraft>(()=>({accountId:saved?.account?.[0]??accountId,amount:saved?.amount?.[0]??(amount===undefined?'':String(amount/100)),date:saved?.date?.[0]??date,direction:saved?.direction?.[0]??direction}));
 useLayoutEffect(()=>{
  const form=surface.current?.closest('form');if(!form)return;let alive=true;
  const sync=()=>{if(!alive)return;const value=(name:string)=>(form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement|null)?.value??'';const next={accountId:value('account'),amount:value('amount'),date:value('date'),direction:form.querySelector<HTMLInputElement>('input[name="direction"]:checked')?.value??''};setDraft(previous=>Object.keys(next).every(key=>previous[key as keyof OperationBalanceDraft]===next[key as keyof OperationBalanceDraft])?previous:next);};
  // The parent restores native controls in its layout effect; read after that commit.
  const reset=()=>queueMicrotask(sync);reset();form.addEventListener('input',sync);form.addEventListener('change',sync);form.addEventListener('reset',reset);
  return()=>{alive=false;form.removeEventListener('input',sync);form.removeEventListener('change',sync);form.removeEventListener('reset',reset);};
 },[]);
 const preview=operationBalancePreview(budget,draft,today),negative=!hidden&&preview.after!==null&&preview.after<0;
 const format=(value:number)=>hidden?'•••• €':money(value);
 const hint=preview.problem==='date'?'Choisissez une date valide pour voir l’effet de cette opération.':preview.problem==='reference'?'Cette date précède le solde de référence du compte. Choisissez une autre date.':preview.problem==='future-reference'?`La référence de ce compte est future (${shortDate(preview.account!.openingDate)}). Son solde actuel ne permet pas encore cet aperçu.`:preview.problem==='range'?'Le solde estimé dépasse les limites de calcul de cet aperçu.':preview.future?'Opération prévue : simulation de cette opération seule, hors autres mouvements futurs. Le solde actuel ne changera qu’à sa date.':null;
 return <section className="operation-balance-preview" ref={surface} aria-label="Aperçu du solde du compte" aria-live="polite" aria-atomic="true" data-negative={negative} data-future={preview.future}>
  {preview.account?<><div className="balance-preview-account"><Wallet size={14} aria-hidden="true"/><strong>{preview.account.name}</strong></div><div className="balance-preview-values"><div><span>Solde actuel</span><strong data-balance-current data-long={preview.current!==null&&format(preview.current).length>16}>{format(preview.current!)}</strong></div><ArrowRight size={16} aria-hidden="true"/><div><span>{draft.direction==='income'?'Après ce revenu':'Après cette dépense'}</span><strong data-balance-after data-empty={preview.after===null} data-long={preview.after!==null&&format(preview.after).length>16}>{hidden?'•••• €':preview.after===null?'À préciser':money(preview.after)}</strong></div></div>{negative&&<p className="balance-preview-warning"><CircleAlert size={14} aria-hidden="true"/>Solde estimé négatif après cette opération.</p>}{hint&&<p className="balance-preview-hint">{hint}</p>}</>:<p className="balance-preview-hint">Sélectionnez un compte pour voir son solde.</p>}
 </section>;
}
