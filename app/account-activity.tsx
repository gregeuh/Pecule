"use client";
import { ChevronDown, ArrowRight } from "lucide-react";
import AnimatedDetails from "./animated-details";
import CategoryIcon from "./category-icon";
import { MerchantIcon } from "./merchant-fields";
import { futureTransactions, money, shiftDate, shortDate, type Budget, type Transaction } from "../lib/budget";
export default function AccountActivity({budget,accountId,today,hidden,onTransaction,onUpcoming,onAll}:{budget:Budget;accountId:string;today:string;hidden:boolean;onTransaction:(t:Transaction)=>void;onUpcoming:(t:Transaction)=>void;onAll:()=>void}){
  const recent=budget.transactions.filter(t=>t.accountId===accountId&&t.date<=today).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const upcoming=futureTransactions(budget,shiftDate(today,1),shiftDate(today,30)).filter(t=>t.accountId===accountId).slice(0,3);
  const row=(t:Transaction,planned=false)=><button type="button" className="account-activity-row" key={t.id} onClick={()=>planned?onUpcoming(t):onTransaction(t)}><MerchantIcon label={t.label} merchantId={t.merchantId} customIconUrl={t.customIconUrl} fallback={<CategoryIcon category={t.category}/>}/><span><strong>{t.label}</strong><small>{shortDate(t.date)} · {t.category}</small></span><b>{hidden?"•••• €":`${t.amount>0?"+":"−"}${money(Math.abs(t.amount))}`}</b></button>;
  return <AnimatedDetails className="account-activity"><summary>Activité du compte<ChevronDown size={17} aria-hidden="true"/></summary><div><h4>Dernières opérations</h4>{recent.length?recent.map(t=>row(t)):<p className="field-hint">Aucune opération enregistrée sur ce compte.</p>}<h4>Prévu dans les 30 jours</h4>{upcoming.length?upcoming.map(t=>row(t,true)):<p className="field-hint">Aucune opération prévue dans les 30 prochains jours.</p>}<button type="button" className="text-button" onClick={onAll}>Voir les opérations <ArrowRight size={14}/></button></div></AnimatedDetails>;
}
