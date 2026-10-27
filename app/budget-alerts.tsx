import { spendingAlerts } from "../lib/spending-insights";
import type { Budget } from "../lib/budget";
export default function BudgetAlerts({budget,today,hidden,onOperations}:{budget:Budget;today:string;hidden:boolean;onOperations:()=>void}){
 if(hidden)return null;
 const alerts=spendingAlerts(budget,today.slice(0,7),today);
 if(!alerts.length)return null;
 return <div className="budget-alerts"><p role="status">{alerts.length} seuil{alerts.length>1?'s':''} de catégorie atteint{alerts.length>1?'s':''} ce mois-ci : {alerts.slice(0,3).map(a=>a.category).join(', ')}{alerts.length>3?'…':''}.</p><button type="button" className="text-button" onClick={onOperations}>Voir mes dépenses</button></div>;
}
