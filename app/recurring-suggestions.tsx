"use client";
import { useState } from "react";
import { recurringSuggestions, type RecurringSuggestion } from "../lib/recurring-suggestions";
import { money, shortDate, type Budget } from "../lib/budget";
export default function RecurringSuggestions({budget,today,hidden,onReview}:{budget:Budget;today:string;hidden:boolean;onReview:(suggestion:RecurringSuggestion)=>void}){
 const [shown,setShown]=useState(3),items=recurringSuggestions(budget,today);
 if(!items.length)return null;
 return <section className="card recurring-suggestions"><h2>Des habitudes à prévoir ?</h2><p>Au moins trois dépenses de même montant semblent se répéter. Vérifiez-les avant de créer une récurrence ; rien n’est ajouté automatiquement.</p><ul className="preference-list">{items.slice(0,shown).map(item=><li key={item.key}><span><strong>{item.rule.label}</strong><small>{item.count} paiements · {item.rule.frequency==='weekly'?'Chaque semaine':item.rule.frequency==='monthly'?'Chaque mois':'Chaque année'} · {hidden?'•••• €':money(-item.rule.amount)} · {budget.accounts.find(a=>a.id===item.rule.accountId)?.name}</small><small>Prochaine date proposée : {shortDate(item.rule.startDate)}</small></span><button type="button" className="secondary compact" onClick={()=>onReview(item)}>Vérifier</button></li>)}</ul>{items.length>shown&&<button type="button" className="text-button" onClick={()=>setShown(shown+3)}>Afficher plus de propositions</button>}</section>;
}
