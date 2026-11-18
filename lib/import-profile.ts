import {columnErrors,type Columns,type ImportPlan} from './bank-import.ts';
import type {Budget} from './budget.ts';
export type ImportProfile={accountId:string;header:string[];columns:Columns;mode:ImportPlan['mode'];dateOrder:ImportPlan['dateOrder'];keepExtra:boolean};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function rememberedImportPlan(b:Budget,plan:ImportPlan){
 const saved=b.settings.importProfiles?.find(p=>p.accountId===plan.accountId);
 if(!saved)return {plan,reused:false};
 const headers=plan.rows.slice(0,30).flatMap((row,index)=>row.length===saved.header.length&&saved.header.every((v,i)=>normalize(v)===normalize(row[i]))?[index]:[]);
 if(headers.length!==1)return {plan,reused:false};
 const next={...plan,header:headers[0],columns:{...saved.columns},mode:saved.mode,dateOrder:saved.dateOrder,keepExtra:saved.keepExtra};
 return columnErrors(next).length?{plan,reused:false}:{plan:next,reused:true};
}
export function rememberImportPlan(b:Budget,plan:ImportPlan):Budget{
 if(columnErrors(plan).length)throw new Error('Le format contient des colonnes invalides.');
 const header=plan.rows[plan.header]??[];
 if(header.some(s=>s.length>160))throw new Error('Les noms de colonnes sont trop longs pour mémoriser ce format.');
 const profile:ImportProfile={accountId:plan.accountId,header:[...header],columns:{...plan.columns},mode:plan.mode,dateOrder:plan.dateOrder,keepExtra:plan.keepExtra!==false};
 return {...b,settings:{...b.settings,importProfiles:[...(b.settings.importProfiles??[]).filter(p=>p.accountId!==plan.accountId),profile].slice(-50)}};
}
export function forgetImportPlan(b:Budget,accountId:string):Budget{
 return {...b,settings:{...b.settings,importProfiles:(b.settings.importProfiles??[]).filter(p=>p.accountId!==accountId)}};
}
