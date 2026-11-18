import { accountBalance, type Budget } from "./budget.ts";

/** Correct the existing reference; never invent a payment or discard ledger rows. */
export function adjustAccountBalance(budget:Budget,accountId:string,target:number,today:string):Budget {
  const account=budget.accounts.find(a=>a.id===accountId);
  if(!account)throw new Error("Ce compte n’existe plus.");
  if(!Number.isSafeInteger(target)||Math.abs(target)>100_000_000_000)throw new Error("Indiquez un solde valide, dans la limite d’un milliard d’euros.");
  if(account.openingDate>today)throw new Error("La date de référence de ce compte est future. Modifiez-la dans les paramètres du compte avant d’ajuster son solde.");
  const reference=account.openingBalance+target-accountBalance(budget,accountId,today);
  if(!Number.isSafeInteger(reference)||Math.abs(reference)>100_000_000_000)throw new Error("Cette correction dépasse la limite du solde de référence. Vérifiez le montant et les opérations du compte.");
  const next=structuredClone(budget);
  next.accounts.find(a=>a.id===accountId)!.openingBalance=reference;
  return next;
}
