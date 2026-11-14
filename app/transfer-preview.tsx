"use client";
import {useContext,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowDown,Wallet} from 'lucide-react';
import {accountBalance,money,type Budget} from '../lib/budget';
import {parseAmount} from '../lib/csv';
import {walletSurfaceStyles} from '../lib/wallet-presentation';
import {FormDraftValues} from './form-drafts';

/** Read the canonical native controls, including restored drafts; never owns money. */
export default function TransferPreview({budget,today,hidden,from,to}:{budget:Budget;today:string;hidden:boolean;from?:string;to?:string}){
 const saved=useContext(FormDraftValues),root=useRef<HTMLDivElement>(null);
 const [amount,setAmount]=useState('');
 const [pair,setPair]=useState([saved?.from?.[0]??from,saved?.to?.[0]??to]);
 useLayoutEffect(()=>{const form=root.current?.closest('form');if(!form)return;let alive=true;const sync=()=>{if(alive){setPair(['from','to'].map(name=>(form.elements.namedItem(name) as HTMLSelectElement)?.value));setAmount((form.elements.namedItem('amount') as HTMLInputElement)?.value??'');}};const reset=()=>queueMicrotask(sync);reset();form.addEventListener('change',sync);form.addEventListener('input',sync);form.addEventListener('reset',reset);return()=>{alive=false;form.removeEventListener('change',sync);form.removeEventListener('input',sync);form.removeEventListener('reset',reset);};},[]);
 return <div className="transfer-preview" ref={root} aria-label="Comptes du virement">{pair.map((id,index)=>{const account=budget.accounts.find(a=>a.id===id);return <div key={index}>{index===1&&<span className="transfer-connection" aria-hidden="true"><ArrowDown size={20}/><span className="transfer-token">{hidden?'•••• €':money(parseAmount(amount)??0)}</span></span>}{account&&<div className="transfer-account" data-transfer-side={index} style={walletSurfaceStyles(account.color) as CSSProperties}><span>{index===0?'Depuis':'Vers'} <Wallet size={16}/></span><strong>{account.name}</strong><b>{hidden?'•••• €':money(accountBalance(budget,account.id,today))}</b></div>}</div>;})}</div>;
}
