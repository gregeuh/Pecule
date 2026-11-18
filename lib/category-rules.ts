import { normalize, recognizeBrand, brandById } from "./merchants.ts";
import type { CategoryRule } from "./budget";
export function categoryIdentity(label:string, merchantId?:string) {
  const brand=merchantId==="none"?undefined:merchantId?brandById(merchantId):recognizeBrand(label);
  return brand?{key:`brand:${brand.id}`,title:brand.name}:{key:`label:${normalize(label)}`,title:label.trim()};
}
export function preferredCategory(rules:CategoryRule[]|undefined,label:string,merchantId:string|undefined,income:boolean){
  if(!rules?.length)return undefined;
  const {key}=categoryIdentity(label,merchantId);
  return rules?.find(rule=>rule.key===key&&rule.direction===(income?"income":"expense"))?.category;
}
export function rememberCategory(rules:CategoryRule[]|undefined,label:string,merchantId:string|undefined,income:boolean,category:string):CategoryRule[]{
 const identity=categoryIdentity(label,merchantId);
 if(!identity.title||identity.key==='label:')throw new Error("Indiquez un libellé pour mémoriser sa catégorie.");
 const direction=income?"income":"expense";
 const next=(rules??[]).filter(r=>r.key!==identity.key||r.direction!==direction);
 if(next.length>=100)throw new Error("Vous pouvez mémoriser jusqu’à 100 règles de catégorie.");
 return [...next,{...identity,direction,category}];
}
