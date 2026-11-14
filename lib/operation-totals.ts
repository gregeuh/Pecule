import type { Transaction } from "./budget.ts";
/** Totals for an already-filtered list; future entries and paired transfers are not income/spending. */
export function recordedOperationTotals(items:Transaction[],today:string){
  let income=0,spent=0;
  for(const item of items){if(item.date>today||item.transferId)continue;if(item.amount>0)income+=item.amount;else spent-=item.amount;}
  return {income,spent};
}
