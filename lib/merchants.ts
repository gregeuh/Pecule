import catalogue from "./brand-catalogue.json" with { type: "json" };
import rules from "./brand-rules.json" with { type: "json" };
export const brands = catalogue;
export const normalize = (text:string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const byNormalizedName = new Map<string, (typeof brands)[number]>();
for(const brand of brands)if(!byNormalizedName.has(normalize(brand.name)))byNormalizedName.set(normalize(brand.name),brand);
const byId = new Map(brands.map(b=>[b.id,b]));
const aliases = rules.flatMap(rule=>rule.aliases.map(alias=>({rule,alias:normalize(alias)}))).sort((a,b)=>b.alias.length-a.alias.length);
export const brandById = (id:string) => byId.get(id);
export function recognizeBrand(label:string) {
  const text = ` ${normalize(label)} `;
  const matches=aliases.filter(a=>text.includes(` ${a.alias} `));
  const first=matches.find(a=>a.rule.id!=="paypal")??matches[0];
  if(first){const conflict=matches.some(a=>a.rule.id!==first.rule.id&&a.rule.id!=="paypal"&&!first.alias.includes(a.alias)&&!a.alias.includes(first.alias));return conflict?undefined:byId.get(first.rule.id);}
  return byNormalizedName.get(normalize(label));
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
  return rule&&rule.category!=="Autres"?rule.category:categoryRules.find(([pattern])=>pattern.test(text))?.[1];
}
