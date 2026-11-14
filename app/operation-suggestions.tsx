"use client";
import {useContext,useLayoutEffect,useRef,useState} from 'react';
import {captureSuggestions} from '../lib/capture-suggestions';
import {money,type Budget} from '../lib/budget';
import type {Favorite} from '../lib/capture';
import {FormDraftValues} from './form-drafts';
import {MerchantIcon} from './merchant-fields';
import CategoryIcon from './category-icon';
export default function OperationSuggestions({budget,today,hidden,saving,accountId,direction,inForm=false,onUse}:{budget:Budget;today:string;hidden:boolean;saving:boolean;accountId?:string;direction?:string;inForm?:boolean;onUse:(favorite:Favorite,context?:{accountId:string;date:string})=>void}){
 const root=useRef<HTMLElement>(null),saved=useContext(FormDraftValues);
 const [fields,setFields]=useState({query:inForm?saved?.label?.[0]??'':'',accountId:saved?.account?.[0]??accountId,direction:saved?.direction?.[0]??direction});
 useLayoutEffect(()=>{if(!inForm)return;const form=root.current?.closest('form');if(!form)return;let live=true;
  const sync=(event?:Event)=>{if(!live||event instanceof InputEvent&&event.isComposing)return;const value=(name:string)=>(form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement|null)?.value??'';const next={query:value('label'),accountId:value('account'),direction:value('direction')};setFields(previous=>previous.query===next.query&&previous.accountId===next.accountId&&previous.direction===next.direction?previous:next);};
  const reset=()=>queueMicrotask(()=>sync());reset();for(const event of ['input','change','compositionend'])form.addEventListener(event,sync);form.addEventListener('reset',reset);
  return()=>{live=false;for(const event of ['input','change','compositionend'])form.removeEventListener(event,sync);form.removeEventListener('reset',reset);};
 },[inForm]);
 const suggestions=captureSuggestions(budget,today,inForm?fields:{accountId,direction});
 return <section ref={root} className="operation-suggestions" aria-label="Suggestions d’opérations" hidden={!suggestions.length}><div className="suggestion-heading"><h3>{inForm&&fields.query?'Déjà saisi chez vous':'Vos habitudes'}</h3><span>À vérifier avant d’enregistrer</span></div><div className="suggestion-list">{suggestions.map(({favorite:f,count})=><button type="button" key={f.id} disabled={saving} onClick={event=>{const form=event.currentTarget.form,values=form?new FormData(form):null;onUse(f,values?{accountId:String(values.get('account')??accountId??''),date:String(values.get('date')??today)}:undefined);}}><MerchantIcon label={f.label} merchantId={f.merchantId} customIconUrl={f.customIconUrl} fallback={<CategoryIcon category={f.category} size={16}/>}/><span><strong>{f.label}</strong><small>{budget.accounts.find(a=>a.id===f.accountId)?.name} · {count} saisie{count>1?'s':''}</small></span><b>{hidden?'•••• €':money(f.amount!)}</b></button>)}</div></section>;
}
