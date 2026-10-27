import { money, type Budget } from "../lib/budget";
const labels:Record<string,string>={name:"Nom",label:"Libellé",bank:"Banque",type:"Type",openingBalance:"Solde de référence",openingDate:"Date de référence",amount:"Montant",date:"Date",accountId:"Compte",category:"Catégorie",note:"Note",startDate:"Début",endDate:"Fin",frequency:"Fréquence",timing:"Règle de date",day:"Jour",active:"Active",holidays:"Jours fériés",excludedDates:"Dates exclues",target:"Objectif",saved:"Déjà épargné",monthly:"Réserve mensuelle",deadline:"Échéance",horizon:"Horizon",reserve:"Réserve",holidayCalendar:"Calendrier",balanceIncluded:"Compris dans le solde",importRef:"Référence bancaire",merchantId:"Enseigne",ruleId:"Récurrence",goalId:"Objectif associé",transferId:"Virement associé",color:"Couleur",icon:"Icône",spendingPlan:"Répartition 50/30/20"};
const amounts=new Set(["openingBalance","amount","target","saved","monthly","reserve"]);
const words:Record<string,string>={current:"Compte courant",savings:"Épargne",cash:"Espèces",weekly:"Hebdomadaire",monthly:"Mensuelle",yearly:"Annuelle",salary:"Prochaine paie",month:"Fin du mois",FR:"France",none:"Aucun",date:"Jour fixe","last-business-day":"Dernier jour ouvré"};
export default function ConflictValue({value,budget}:{value:unknown;budget:Budget}){
 if(value===undefined)return <p>Élément supprimé</p>;
 if(typeof value!=="object"||value===null)return <p>{String(value)}</p>;
 return <dl className="conflict-values">{Object.entries(value).filter(([key])=>key!=="id"&&key!=="importBatch").map(([key,item])=>{
 let text=typeof item==="boolean"?item?"Oui":"Non":Array.isArray(item)?item.join(", "):String(item??"");
 if(amounts.has(key)&&typeof item==="number")text=money(item);
 else if(key==="accountId")text=budget.accounts.find(a=>a.id===item)?.name??"Compte supprimé";
 else if(key==="ruleId")text=budget.rules.find(r=>r.id===item)?.label??"Récurrence supprimée";
 else if(key==="goalId")text=budget.goals.find(g=>g.id===item)?.name??"Objectif supprimé";
 else if(key==="transferId")text="Virement entre comptes";
 else if(key==="spendingPlan"&&item&&typeof item==="object"){
 const plan=item as {monthlyIncome:number|null;groups:Record<string,string>};
 const groups:Record<string,string>={needs:"Besoins",wants:"Envies",savings:"Épargne",unassigned:"Non classé"};
 text=`Revenu : ${plan.monthlyIncome===null?"Calcul automatique":money(plan.monthlyIncome)}. `+Object.entries(plan.groups).map(([category,group])=>`${category} : ${groups[group]??group}`).join(" ; ");
 }
 else text=words[text]??text;
 return <div key={key}><dt>{labels[key]??key}</dt><dd>{text||"Aucun"}</dd></div>;
 })}</dl>;
}
