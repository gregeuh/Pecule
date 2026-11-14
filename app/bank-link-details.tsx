"use client";
import AnimatedDetails from './animated-details';
import {shortDate,type Transaction} from '../lib/budget';
export default function BankLinkDetails({transaction}:{transaction:Transaction}){
 if(!transaction.bankLinks?.length)return null;
 return <AnimatedDetails className="bank-link-details"><summary>Données bancaires associées ({transaction.bankLinks.length})</summary><p className="field-hint">Ces données complètent la saisie d’origine. Elles ne changent pas son solde ni sa date. Pour retirer une association, annulez son lot dans « Mes imports ».</p>{transaction.bankLinks.map(link=><section key={`${link.batchId}:${link.key}`}><h3>{link.label}</h3><p>{shortDate(link.date)}</p>{link.reference&&<p>Référence : {link.reference}</p>}{link.note&&<p className="bank-link-note">{link.note}</p>}</section>)}</AnimatedDetails>;
}
