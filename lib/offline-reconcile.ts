import {budgetSchema} from './validation.ts';
import type {Budget} from './budget.ts';
import type {PendingOperation} from './offline-store.ts';
/** Append only, with stable IDs. Never overwrite or recreate a server operation. */
export function reconcilePending(budget:Budget,entries:PendingOperation[],userId:string){
 let next=structuredClone(budget);const acknowledged:string[]=[],errors:Record<string,string>={};
 for(const entry of entries){if(entry.userId!==userId)continue;const t=entry.transaction;
  if(!t||!Number.isSafeInteger(t.amount)||t.amount===0||entry.id!==t.id||t.ruleId||t.transferId||t.goalId||t.importBatch||t.importRef||t.bankLinks?.length||t.balanceIncluded){errors[entry.id]='Cette saisie locale ne correspond pas à une opération simple.';continue;}
  const existing=next.transactions.find(row=>row.id===entry.id);
  if(existing&&!Object.entries(t).every(([key,value])=>JSON.stringify(existing[key as keyof typeof existing])===JSON.stringify(value))){errors[entry.id]='Une opération différente porte déjà cet identifiant. Examinez-la avant de retirer cette saisie locale.';continue;}
  if(existing&&!entry.preferences){acknowledged.push(entry.id);continue;}
  const account=next.accounts.find(a=>a.id===t.accountId);
  if(!existing&&!account){errors[entry.id]='Le compte a été supprimé. Choisissez un autre compte.';continue;}
  if(!existing&&account&&t.date<account.openingDate){errors[entry.id]='La référence du compte a changé. Corrigez la date ou le compte.';continue;}
  let candidate={...next,transactions:existing?next.transactions:[...next.transactions,t]};
  const favorite=entry.preferences?.favorite;
  if(favorite){const favorites=candidate.settings.capture?.favorites??[],found=favorites.find(f=>f.id===favorite.id);if(found&&JSON.stringify(found)!==JSON.stringify(favorite)){errors[entry.id]='Ce favori a changé sur un autre appareil. Désactivez la préférence associée pour envoyer seulement l’opération.';continue;}if(!found){if(favorites.length>=20){errors[entry.id]='La limite de vingt favoris est atteinte. Désactivez la préférence associée pour envoyer seulement l’opération.';continue;}candidate={...candidate,settings:{...candidate.settings,capture:{...candidate.settings.capture,favorites:[...favorites,favorite]}}};}}
  const change=entry.preferences?.categoryRule;
  if(change){const rules=candidate.settings.categoryRules??[],index=rules.findIndex(r=>r.key===change.after.key&&r.direction===change.after.direction),current=rules[index];if(JSON.stringify(current)!==JSON.stringify(change.after)){if(JSON.stringify(current)!==JSON.stringify(change.before)||index<0&&rules.length>=100){errors[entry.id]='La règle de catégorie a changé. Désactivez la préférence associée pour envoyer seulement l’opération.';continue;}candidate={...candidate,settings:{...candidate.settings,categoryRules:index<0?[...rules,change.after]:rules.map((r,i)=>i===index?change.after:r)}};}}
  const parsed=budgetSchema.safeParse(candidate);
  if(!parsed.success){errors[entry.id]=parsed.error.issues[0]?.message??'Corrigez cette saisie avant de la synchroniser.';continue;}
  next=parsed.data;if(existing)acknowledged.push(entry.id);
 }
 return {budget:next,acknowledged,errors,added:next.transactions.length-budget.transactions.length,changed:JSON.stringify(next)!==JSON.stringify(budget)};
}
/** Small capture intent, not a copy of the personal budget or its history. */
export function pendingCaptureIntent(before:Budget,after:Budget,userId:string):PendingOperation|null{
 const rows=after.transactions.filter(t=>!before.transactions.some(old=>old.id===t.id)&&!t.ruleId&&!t.transferId);
 if(rows.length!==1||!budgetSchema.safeParse(after).success)return null;
 const transaction=rows[0],favorite=after.settings.capture?.favorites?.find(f=>!before.settings.capture?.favorites?.some(old=>old.id===f.id));
 const changed=after.settings.categoryRules?.find(r=>JSON.stringify(r)!==JSON.stringify(before.settings.categoryRules?.find(old=>old.key===r.key&&old.direction===r.direction)));
 const preferences={...(favorite?{favorite}:{}),...(changed?{categoryRule:{before:before.settings.categoryRules?.find(r=>r.key===changed.key&&r.direction===changed.direction),after:changed}}:{})};
 return {id:transaction.id,userId,transaction,createdAt:new Date().toISOString(),...(favorite||changed?{preferences}:{})};
}
