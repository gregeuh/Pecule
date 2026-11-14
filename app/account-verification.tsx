"use client";
import {useEffect,useState} from 'react';
import {ShieldCheck,Clock3,CircleAlert,ArrowRight} from 'lucide-react';
import {accountVerification} from '../lib/account-verification';
import {shortDate,type Budget} from '../lib/budget';
export default function AccountVerification({budget,accountId,today,compact=false,saving=false,onVerify}:{budget:Budget;accountId:string;today:string;compact?:boolean;saving?:boolean;onVerify?:()=>void}){
 const [result,setResult]=useState<{budget:Budget;accountId:string;today:string;value:Awaited<ReturnType<typeof accountVerification>>|null}>();
 useEffect(()=>{let live=true;void accountVerification(budget,accountId,today).then(value=>{if(live)setResult({budget,accountId,today,value});}).catch(()=>{if(live)setResult({budget,accountId,today,value:null});});return()=>{live=false;};},[budget,accountId,today]);
 const pending=result?.budget!==budget||result?.accountId!==accountId||result?.today!==today;
 const value=pending?undefined:result?.value,state=pending?'checking':value?.state??'unavailable';
 const title=state==='checking'?'Vérification du suivi…':state==='never'?'Pas encore comparé à votre banque':state==='changed'?'Période vérifiée à revoir':state==='current'?'Comparé à votre banque aujourd’hui':state==='older'?`Comparé au ${shortDate(value!.date!)}`:'Vérification du suivi indisponible';
 const detail=state==='never'?'Comparez les soldes à la même date pour repérer un oubli.':state==='changed'?'Des montants, des dates ou la référence ont changé depuis le rapprochement.':state==='older'?value!.since?`${value!.since} mouvement${value!.since>1?'s':''} depuis. Leur présence sur votre relevé reste à vérifier.`:'Aucun mouvement enregistré depuis. Les éventuels oublis restent à vérifier.':state==='current'?'Les écritures rapprochées sont inchangées. Les paiements en attente ne sont pas inclus.':state==='unavailable'?'Ouvrez le rapprochement pour comparer votre relevé.':null;
 const Icon=state==='current'?ShieldCheck:state==='changed'?CircleAlert:Clock3;
 return <section className={`account-verification ${compact?'verification-compact':''}`} data-verification={state} aria-label="Vérification du compte"><div className="verification-summary" role="status"><Icon size={compact?15:18} aria-hidden="true"/><div><strong>{title}</strong>{!compact&&detail&&<p>{detail}</p>}</div></div>{!compact&&onVerify&&<button type="button" className="text-button" disabled={saving} onClick={onVerify}>Vérifier avec ma banque<ArrowRight size={15}/></button>}</section>;
}
