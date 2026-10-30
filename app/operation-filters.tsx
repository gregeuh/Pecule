"use client";
import type { ReactNode } from "react";
import AnimatedDetails from "./animated-details";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Upload, Check } from "lucide-react";
import { dateISO, parseDate, type Account } from "../lib/budget";
import { FormField, ValidatedForm } from "./validated-form";
export type OperationFilterValues={type:string;account:string;month:string};
type ControlsProps={values:OperationFilterValues;accounts:Account[];onChange:(values:OperationFilterValues)=>void;dialog?:boolean};
/** Same committed fields on desktop and draft fields in the mobile sheet. */
export function OperationFilterControls({values,accounts,onChange,dialog=false}:ControlsProps){
 const changeMonth=(offset:number)=>onChange({...values,month:dateISO(new Date(Number(values.month.slice(0,4)),Number(values.month.slice(5,7))-1+offset,1,12)).slice(0,7)});
 return <div className={dialog?'operation-filter-fields':'filter-bar'}><div className="filter-type"><span className={dialog?'filter-field-title':'sr-only'}>Type d’opération</span><div className="segmented" role="group" aria-label="Type d’opération">{[{id:'all',label:'Toutes'},{id:'expense',label:'Dépenses'},{id:'income',label:'Revenus'}].map(item=><button type="button" key={item.id} className={values.type===item.id?'selected':''} aria-pressed={values.type===item.id} onClick={()=>onChange({...values,type:item.id})}>{item.label}</button>)}</div></div>{dialog?<FormField label="Compte"><select name="filterAccount" value={values.account} onChange={e=>onChange({...values,account:e.target.value})}><option value="all">Tous les comptes</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></FormField>:<select className="filter-select" aria-label="Filtrer par compte" value={values.account} onChange={e=>onChange({...values,account:e.target.value})}><option value="all">Tous les comptes</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>}<div className="filter-period"><span className={dialog?'filter-field-title':'sr-only'}>Période</span><div className="month-control"><button type="button" className="icon-button small" aria-label="Mois précédent" onClick={()=>changeMonth(-1)}><ChevronLeft size={17}/></button><strong>{parseDate(values.month+'-01').toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</strong><button type="button" className="icon-button small" aria-label="Mois suivant" onClick={()=>changeMonth(1)}><ChevronRight size={17}/></button></div></div></div>;
}
export default function TransactionFilters({initial,accounts,today,onApply,onCancel}:{initial:OperationFilterValues;accounts:Account[];today:string;onApply:(values:OperationFilterValues)=>void;onCancel:()=>void}){
 const [draft,setDraft]=useState(initial);
 return <ValidatedForm onSubmit={e=>{e.preventDefault();onApply(draft);}}><p className="filter-intro">Choisissez ce que vous souhaitez voir. La recherche reste conservée.</p><OperationFilterControls values={draft} accounts={accounts} onChange={setDraft} dialog/><button type="button" className="text-button filter-reset" onClick={()=>setDraft({type:'all',account:'all',month:today.slice(0,7)})}>Réinitialiser les filtres</button><div className="filter-sheet-actions"><button type="button" className="secondary" onClick={onCancel}>Annuler</button><button type="submit" className="primary"><Check size={17}/>Appliquer les filtres</button></div></ValidatedForm>;
}

export function LedgerTools({compact,children}:{compact:boolean;children:ReactNode}){return compact?<AnimatedDetails className="ledger-tools"><summary><Upload size={16}/>Importer et gérer les données<ChevronDown size={17}/></summary>{children}</AnimatedDetails>:<div className="ledger-tools-desktop">{children}</div>;}
