import {accountBalance,materialize,type Budget} from './budget.ts';
import {latestReconciliation,ledgerFingerprint} from './bank-reconciliation.ts';
/** A verified period is never a promise that later movements match the bank. */
export async function accountVerification(budget:Budget,accountId:string,today:string){
 const account=budget.accounts.find(a=>a.id===accountId);
 if(!account)throw new Error('Compte introuvable.');
 const last=latestReconciliation(account);
 if(!last)return {state:'never' as const,date:null,since:0};
 const valid=last.date<=today&&last.date>=account.openingDate&&
  accountBalance(budget,accountId,last.date)===last.bankBalance&&
  await ledgerFingerprint(budget,accountId,last.date)===last.fingerprint;
 if(!valid)return {state:'changed' as const,date:last.date,since:0};
 const since=materialize(budget,today).transactions.filter(t=>t.accountId===accountId&&!t.balanceIncluded&&t.date>last.date&&t.date<=today).length;
 return {state:last.date===today?'current' as const:'older' as const,date:last.date,since};
}
