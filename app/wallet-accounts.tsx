"use client";
import type { CSSProperties } from 'react';
import { Plus, Wallet, ArrowRight, ChevronDown } from 'lucide-react';
import {accountBalance,money,type Budget,type Account} from '../lib/budget';
import {walletColor,walletInk,accountKind} from '../lib/wallet-presentation';
import EmptyState from './empty-state';
export default function WalletAccounts({budget,today,hidden,onAccount,onAll,onAdd}:{budget:Budget;today:string;hidden:boolean;onAccount:(account:Account)=>void;onAll:()=>void;onAdd:()=>void}){
 const first=budget.accounts.find(a=>a.type==='current')??budget.accounts[0];
 const cards=first?[...budget.accounts.filter(a=>a.id!==first.id).slice(0,2).reverse(),first]:[];
 const m=(amount:number)=>hidden?'•••• €':money(amount);
 const total=budget.accounts.reduce((sum,a)=>sum+accountBalance(budget,a.id,today),0);
 return <section className="wallet-accounts" aria-label="Soldes de vos comptes"><div className="wallet-accounts-heading"><h2><button type="button" className="wallet-manage-title" aria-label={budget.accounts.length>3?`Voir les ${budget.accounts.length} comptes`:"Gérer mes comptes"} onClick={onAll}>Mes comptes<ChevronDown size={16}/></button></h2><div><span>Total des comptes</span><strong>{m(total)}</strong></div></div>{cards.length?<><div className="wallet-stack" style={{'--wallet-depth':cards.length-1} as CSSProperties}>{cards.map((a,index)=><button type="button" key={a.id} className={`wallet-card clarte-account ${index===cards.length-1?'wallet-front':''}`} data-wallet-account={a.id} aria-label={`${a.name}, ${hidden?'solde masqué':money(accountBalance(budget,a.id,today))}, voir le détail`} style={{'--wallet-index':index,'--wallet-color':walletColor(a.color),'--wallet-ink':walletInk(a.color)} as CSSProperties} onClick={e=>{e.currentTarget.focus({preventScroll:true});onAccount(a);}}><span className="wallet-card-top"><strong>{a.name}</strong>{index===cards.length-1?<Wallet size={19} aria-hidden="true"/>:<b>{m(accountBalance(budget,a.id,today))}</b>}</span><span className="wallet-card-balance" data-long={m(accountBalance(budget,a.id,today)).length>15}>{m(accountBalance(budget,a.id,today))}</span><span className="wallet-card-bottom"><span>{accountKind(a)}</span><span>Voir le compte <ArrowRight size={14}/></span></span><span className="wallet-card-mark" aria-hidden="true">P</span></button>)}</div></>:<EmptyState title="Votre premier compte" description="Ajoutez votre solde de référence pour commencer." action={<button type="button" className="primary" onClick={onAdd}><Plus size={17}/>Ajouter un compte</button>}/>}</section>;
}
