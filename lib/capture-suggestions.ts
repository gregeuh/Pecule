import {shiftDate,type Budget} from './budget.ts';
import {favoriteFromTransaction,type Favorite} from './capture.ts';
import {normalize,suggestCategory} from './merchants.ts';
import {parseAmount} from './csv.ts';
export function captureSuggestions(b:Budget,today:string,{query='',accountId,direction}:{query?:string;accountId?:string;direction?:string}={}){
 const q=normalize(query),start=shiftDate(today,-120),accounts=new Set(b.accounts.map(a=>a.id));
 const groups=new Map<string,{favorite:Favorite;count:number;latest:string}>();
 const rows=b.transactions.map((t,index)=>({...t,index})).filter(t=>accounts.has(t.accountId)&&!t.ruleId&&!t.transferId&&!t.balanceIncluded&&t.amount!==0&&t.date<=today&&t.date>=start&&(!direction||(t.amount>0?'income':'expense')===direction)).sort((a,b)=>b.date.localeCompare(a.date)||b.index-a.index);
 for(const t of rows){if(q&&!normalize(t.label).includes(q))continue;const key=JSON.stringify([normalize(t.label),t.accountId,t.amount>0]);const previous=groups.get(key);if(previous)previous.count++;else groups.set(key,{favorite:favoriteFromTransaction(t,`suggestion-${t.id}`),count:1,latest:t.date});}
 return [...groups.values()].filter(g=>q||g.count>=2).sort((a,b)=>Number(b.favorite.accountId===accountId)-Number(a.favorite.accountId===accountId)||b.count-a.count||b.latest.localeCompare(a.latest)||a.favorite.id.localeCompare(b.favorite.id)).slice(0,3);
}
/** Deliberately bounded syntax: amount + label [+ 'sur' + exact account name/bank]. */
export function parseQuickCapture(text:string,b:Budget,direction:'expense'|'income'):
 {error:string;favorite?:never}|{favorite:Favorite;error?:never}{
 const match=text.trim().match(/^(\d[\d\s\u00a0\u202f]*(?:[,.]\d{1,2})?)\s*(?:€|euros?)?\s+(.+)$/i);
 if(!match)return {error:'Commencez par le montant, puis le libellé : « 12,50 déjeuner ».'};
 const amount=parseAmount(match[1]);if(amount===null||amount<=0)return {error:'Indiquez un montant supérieur à zéro, dans la limite autorisée.'};
 let label=match[2].trim(),accountId:string|undefined;
 const suffix=label.match(/^(.*?)\s+sur\s+(.+)$/i);
 if(suffix){const name=normalize(suffix[2]);const accounts=b.accounts.filter(a=>normalize(a.name)===name||a.bank&&normalize(a.bank)===name);if(accounts.length!==1)return {error:accounts.length?'Plusieurs comptes correspondent. Utilisez le nom complet du compte.':'Compte non reconnu. Utilisez son nom exact, ou retirez « sur … ».'};accountId=accounts[0].id;label=suffix[1].trim();}
 if(!label||label.length>120)return {error:'Indiquez un libellé de 1 à 120 caractères.'};
 return {favorite:{id:`phrase-${JSON.stringify([label,amount,accountId??"",direction])}`,label,amount,direction,category:suggestCategory(label,direction==='income')??(direction==='income'?'Autres revenus':'Autres'),...(accountId?{accountId}:{})}};
}
