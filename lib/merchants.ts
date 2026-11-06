import catalogue from "./brand-catalogue.json" with { type: "json" };
import referenceRules from "./brand-rules.json" with { type: "json" };
import expansion from "./brand-expansion.json" with { type: "json" };
type Brand={id:string;name:string;file:string;darkTile?:boolean;lightTile?:boolean};
const catalogueIds=new Set(catalogue.map(brand=>brand.id));
const curatedIds=new Set(expansion.map(brand=>brand.id));
const rules=[...referenceRules.map(rule=>({...rule,aliases:[...new Set([...rule.aliases.filter(alias=>!expansion.some(brand=>brand.id!==rule.id&&brand.aliases.some(candidate=>candidate===alias))),...(expansion.find(brand=>brand.id===rule.id)?.aliases??[])])]})),...expansion.filter(brand=>!referenceRules.some(rule=>rule.id===brand.id))];
export const brands:Brand[] = [...catalogue,...expansion.filter(brand=>!catalogueIds.has(brand.id)).map(brand=>({id:brand.id,name:brand.name,file:brand.file,...("lightTile" in brand?{lightTile:brand.lightTile}:{})}))];
export const normalize = (text:string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const brandText=(text:string)=>normalize(text.replace(/\+/g," plus "));
const byNormalizedName = new Map<string, (typeof brands)[number]>();
for(const brand of brands)if(!byNormalizedName.has(brandText(brand.name)))byNormalizedName.set(brandText(brand.name),brand);
const byId = new Map(brands.map(b=>[b.id,b]));
const aliases = rules.flatMap(rule=>rule.aliases.map(alias=>({rule,alias:brandText(alias)}))).sort((a,b)=>b.alias.length-a.alias.length);
export const brandById = (id:string) => byId.get(id);
const searchIndex=brands.map(brand=>({brand,name:normalize(brand.name),terms:[normalize(brand.name),normalize(brand.id),...rules.filter(rule=>rule.id===brand.id).flatMap(rule=>rule.aliases.map(normalize))]}));
export function searchBrands(query:string):Brand[]{
 const normalized=normalize(query);if(!normalized)return [];
 const tokens=normalized.split(' ');
 const shortQuery=tokens.length>1&&tokens.every(token=>token.length===1);
 return searchIndex.filter(entry=>entry.terms.some(term=>shortQuery?(` ${term} `).includes(` ${normalized} `):tokens.every(token=>term.includes(token))))
  .map(entry=>({...entry,rank:entry.terms.some(term=>term===normalized)?0:entry.name.startsWith(normalized)?1:2}))
  .sort((a,b)=>a.rank-b.rank||Number(curatedIds.has(b.brand.id))-Number(curatedIds.has(a.brand.id))||a.brand.name.localeCompare(b.brand.name,'fr'))
  .map(entry=>entry.brand).filter((brand,index,all)=>all.findIndex(other=>normalize(other.name)===normalize(brand.name))===index);
}
export const featuredBrands=['carrefour','edotleclerc','intermarche','aldi','action','amazon','netflix','edf','doctolib','sncf','leboncoin','free'].map(id=>byId.get(id)).filter((brand):brand is Brand=>!!brand);
const paymentProviders=new Set(['paypal','sumup','stripe','square','paylib','wero']);
const brandParents:Record<string,string[]>={ouigo:["sncf"],amazonmusic:["amazon"],amazonwebservices:["amazon"],playstationplus:["playstation"],icloud:["apple"],microsoft365:["microsoft"],lapostemobile:["laposte"]};
export function recognizeBrand(label:string) {
  const text = ` ${brandText(label)} `;
  const matches=aliases.filter(a=>text.includes(` ${a.alias} `));
  const first=matches.find(a=>!paymentProviders.has(a.rule.id))??matches[0];
  if(first){const conflict=matches.some(a=>a.rule.id!==first.rule.id&&!(brandParents[first.rule.id]??[]).includes(a.rule.id)&&!paymentProviders.has(a.rule.id)&&!first.alias.includes(a.alias)&&!a.alias.includes(first.alias));return conflict?undefined:byId.get(first.rule.id);}
  return byNormalizedName.get(brandText(label));
}
const categoryRules: [RegExp,string][] = [
  [/\b(salaire|paie|payroll|traitement)\b/,"Salaire"], [/\b(loyer|bail|quittance|credit immobilier|pret immobilier)\b/,"Logement"],
  [/\b(pharmacie|medecin|dentiste|kine|hopital|clinique|mutuelle)\b/,"Santé"], [/\b(assurance|assurances|assur)\b/,"Assurances"],
  [/\b(electricite|gaz|energie|eau|veolia|suez)\b/,"Énergie"], [/\b(telephone|forfait mobile|internet|fibre)\b/,"Télécommunications"],
  [/\b(impot|impots|dgfip|tresor public|taxe)\b/,"Impôts"], [/\b(ecole|creche|scolarite|cantine|universite)\b/,"Éducation"],
  [/\b(courses|supermarche|boucherie|boulangerie|epicerie)\b/,"Alimentation"], [/\b(restaurant|resto|cafe|pizzeria|pizza|brasserie|sushi|kebab)\b/,"Restaurants"],
  [/\b(parking|peage|essence|carburant|train|metro|bus|taxi)\b/,"Transport"], [/\b(livret|epargne|placement retraite)\b/,"Épargne"],
  [/\b(remboursement pret|remboursement credit|mensualite credit|dette)\b/,"Dettes"], [/\b(cinema|concert|theatre|musee|vacances|hotel|voyage|sport)\b/,"Loisirs"],
  [/\b(abonnement)\b/,"Abonnements"], [/\b(vetement|chaussure|librairie|achat|boutique)\b/,"Shopping"]
];
export function suggestCategory(label:string, income=false) {
  const text=normalize(label);
  if(income&&!/remboursement|rembours|refund|avoir/.test(text))return /\b(salaire|paie|payroll|traitement)\b/.test(text)?"Salaire":undefined;
  const brand=recognizeBrand(label),rule=rules.find(r=>r.id===brand?.id);
  if(brand?.id==="totalenergies"&&/electricite|direct energie/.test(text))return "Énergie";
  return rule&&rule.category!=="Autres"?rule.category:categoryRules.find(([pattern])=>pattern.test(text))?.[1];
}
