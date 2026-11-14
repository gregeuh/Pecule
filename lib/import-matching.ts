import {daysBetween,shiftDate,type Budget} from './budget.ts';
import {transactionKey} from './csv.ts';
import {buildImportedBudget,type ImportRow} from './bank-import.ts';
/** Candidates are suggestions only; never a financial merge or an automatic match. */
export function importMatchCandidates(b:Budget,rows:ImportRow[]){
 const groups=new Map<string,Budget['transactions']>();
 for(const t of b.transactions){if(t.ruleId||t.transferId||t.goalId||t.balanceIncluded||t.importRef||t.importBatch||t.bankLinks?.length)continue;const key=`${t.accountId}|${t.amount}|${t.date}`;const group=groups.get(key)??[];group.push(t);groups.set(key,group);}
 return new Map(rows.map(row=>[row.index,row.errors.length||row.duplicate?[]:Array.from({length:7},(_,i)=>groups.get(`${row.transaction.accountId}|${row.transaction.amount}|${shiftDate(row.transaction.date,i-3)}`)?.slice(0,12)??[]).flat().sort((a,b)=>Math.abs(daysBetween(a.date,row.transaction.date))-Math.abs(daysBetween(b.date,row.transaction.date))||a.id.localeCompare(b.id)).slice(0,12)]));
}
export function buildReviewedImport(b:Budget,rows:ImportRow[],selected:Set<number>,matches:Map<number,string>,batchId:string,makeId:()=>string):Budget{
 if(!selected.size&&!matches.size)throw new Error('Sélectionnez une opération à ajouter ou à associer.');
 const candidates=importMatchCandidates(b,rows),targets=new Set<string>();
 for(const [index,id] of matches){if(selected.has(index)||!candidates.get(index)?.some(t=>t.id===id)||targets.has(id))throw new Error('Une association a changé ou une opération est choisie plusieurs fois. Vérifiez la sélection.');targets.add(id);}
 const links=new Map([...matches].map(([index,id])=>[id,rows.find(r=>r.index===index)!.transaction]));
 const next=selected.size?buildImportedBudget(b,rows,selected,batchId,makeId):{...b,transactions:[...b.transactions]};
 return {...next,transactions:next.transactions.map(t=>{const source=links.get(t.id);if(!source)return t;return {...t,bankLinks:[...(t.bankLinks??[]),{key:transactionKey(source),batchId,label:source.label,date:source.date,note:source.note,...(source.importRef?{reference:source.importRef}:{})}]};})};
}
