"use client";
import {useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {parseQuickCapture} from '../lib/capture-suggestions';
import {money,type Budget} from '../lib/budget';
import type {Favorite} from '../lib/capture';
import AnimatedDetails from './animated-details';
import {useFormDraftValue} from './form-drafts';
import {FormField} from './validated-form';
export default function QuickPhrase({budget,direction,hidden,saving,onUse}:{budget:Budget;direction:string;hidden:boolean;saving:boolean;onUse:(f:Favorite,context:{accountId:string;date:string})=>void}){
 const [text,setText]=useState(useFormDraftValue('quickPhrase','')),[error,setError]=useState('');
 const result=text.trim()?parseQuickCapture(text,budget,direction==='income'?'income':'expense'):null;
 const apply=(form:HTMLFormElement|null)=>{if(!form)return;const parsed=parseQuickCapture(text,budget,direction==='income'?'income':'expense');if(parsed.error){setError(parsed.error);form.querySelector<HTMLInputElement>('[name=quickPhrase]')?.focus();return;}setError('');const values=new FormData(form);onUse(parsed.favorite!,{accountId:String(values.get('account')??''),date:String(values.get('date')??'')});};
 return <AnimatedDetails className="quick-phrase"><summary>Saisir en une phrase<ChevronDown size={16} aria-hidden="true"/></summary><div><FormField label="Montant et libellé" hint="Exemple : 12,50 déjeuner. Ajoutez « sur » puis le nom exact du compte pour le choisir." error={error||undefined}><input name="quickPhrase" value={text} maxLength={260} autoComplete="off" placeholder="12,50 déjeuner" disabled={saving} onChange={e=>{setText(e.target.value);setError('');}} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();apply(e.currentTarget.form);}}}/></FormField>{result?.favorite&&<p className="phrase-preview">{hidden?'•••• €':money(result.favorite.amount!)} · {result.favorite.label}{result.favorite.accountId&&<> · {budget.accounts.find(a=>a.id===result.favorite?.accountId)?.name}</>}</p>}<button type="button" className="secondary full-width" disabled={saving||!text.trim()} onClick={e=>apply(e.currentTarget.form)}>Préremplir l’opération</button><p className="field-hint">Vous pourrez tout corriger avant d’enregistrer. Aucun envoi à un service d’IA.</p></div></AnimatedDetails>;
}
