import { preferredCategory } from "./category-rules.ts";
import { suggestCategory } from "./merchants.ts";
import { parseCSV, parseCSVDate, transactionKey } from "./csv.ts";
import type { Budget, Transaction } from "./budget";

export const MAX_IMPORT_BYTES=2_000_000, MAX_IMPORT_ROWS=5000;
export type Columns={date:number;label:number;amount:number;debit:number;credit:number;category:number;note:number;reference:number;currency:number};
export type ImportPlan={rows:string[][];header:number;columns:Columns;mode:"signed"|"split";dateOrder:"dmy"|"mdy";balanceMode:"new"|"history";accountId:string;today:string;keepExtra?:boolean};
export type ImportRow={index:number;transaction:Transaction;errors:string[];warnings:string[];duplicate:boolean;defaultSelected:boolean};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

export function decodeBankFile(bytes:Uint8Array):{text:string;encoding:string} {
  if(bytes.length>MAX_IMPORT_BYTES)throw new Error("Le fichier dépasse 2 Mo.");
  if(bytes[0]===0xff&&bytes[1]===0xfe)return {text:new TextDecoder("utf-16le",{fatal:true}).decode(bytes),encoding:"UTF-16"};
  if(bytes[0]===0xfe&&bytes[1]===0xff)return {text:new TextDecoder("utf-16be",{fatal:true}).decode(bytes),encoding:"UTF-16"};
  try{return {text:new TextDecoder("utf-8",{fatal:true}).decode(bytes),encoding:"UTF-8"};}
  catch{return {text:new TextDecoder("windows-1252").decode(bytes),encoding:"Windows-1252"};}
}
export function readBankCSV(text:string,separator?:string):string[][] {
  if(text.includes("\0")||/^\s*(%PDF|PK\x03\x04|<html|<!doctype)/i.test(text))throw new Error("Choisissez un export CSV de votre banque, pas un PDF ou un fichier Excel.");
  const rows=parseCSV(text,separator);
  if(rows.length<2)throw new Error("Le fichier doit contenir un en-tête et au moins une opération.");
  if(rows.length>MAX_IMPORT_ROWS+31)throw new Error("Importez au maximum 5 000 opérations par fichier.");
  if(rows.some(r=>r.length>100))throw new Error("Le fichier contient trop de colonnes (100 maximum).");
  if(rows.some(r=>r.some(c=>c.length>10000)))throw new Error("Une cellule dépasse la taille autorisée.");
  return rows;
}
export function detectColumns(header:string[]):Columns {
  const h=header.map(normalize),find=(re:RegExp)=>h.findIndex(s=>re.test(s));
  return {date:find(/^(date( d['’ ]?operation| operation| comptable| de l['’]operation| de transaction)?|dateop|booking date|started date|transaction date|date de comptabilisation)$/),label:find(/^(libelle.*|label|description|intitule.*|details|operation)$/),amount:find(/^(montant( \(?eur\)?)?|amount|net amount)$/),debit:find(/^(debit.*|montant debit.*|withdrawal.*|depense.*)$/),credit:find(/^(credit.*|montant credit.*|deposit.*|recette.*)$/),category:find(/^(categorie.*|category)$/),note:find(/^(note.*|memo|comment.*)$/),reference:find(/^(reference.*|identifiant.*|transaction id|id operation|id)$/),currency:find(/^(devise|currency|monnaie)$/)};
}
export function detectHeader(rows:string[][]):number {
  let best=0,score=0;
  rows.slice(0,30).forEach((row,i)=>{const c=detectColumns(row);const n=Number(c.date>=0)*3+Number(c.label>=0)*3+Number(c.amount>=0||c.debit>=0&&c.credit>=0)*3;if(n>score){score=n;best=i;}});
  return best;
}
export function parseBankAmount(raw:string):number|null {
  let s=raw.trim().replace(/\u2212/g,"-").replace(/\s*(?:EUR|€)\s*$/i,"").trim();
  let negative=false;
  if(/^\(.*\)$/.test(s)){negative=true;s=s.slice(1,-1);}
  s=s.replace(/\s*(?:EUR|€)\s*$/i,"").trim();
  if(/-$/.test(s)){if(negative)return null;negative=true;s=s.slice(0,-1);}
  if(/^[+-]/.test(s)){if(negative)return null;negative=s[0]==="-";s=s.slice(1);}
  // Only conventional groups of three are accepted; malformed grouping is never repaired.
  const spaced=/[ \u00a0\u202f]/.test(s);
  if(spaced&&!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?$/.test(s))return null;
  s=s.replace(/[ \u00a0\u202f]/g,"");
  let digits:string,fraction="";
  const comma=s.lastIndexOf(","),dot=s.lastIndexOf(".");
  if(comma>=0&&dot>=0){const decimal=comma>dot?",":".",group=decimal===","?".":",";const parts=s.split(decimal);if(parts.length!==2||!/^\d{1,2}$/.test(parts[1]))return null;const escaped=group==="."?"\\.":",";if(!new RegExp(`^\\d{1,3}(?:${escaped}\\d{3})+$`).test(parts[0]))return null;digits=parts[0].split(group).join("");fraction=parts[1];}
  else if(comma>=0||dot>=0){const parts=s.split(comma>=0?",":".");if(parts.length!==2||!/^\d+$/.test(parts[0])||!/^\d{1,2}$/.test(parts[1]))return null;[digits,fraction]=parts;}
  else {if(!/^\d+$/.test(s))return null;digits=s;}
  const n=Number(digits)*100+Number(fraction.padEnd(2,"0"));
  return Number.isSafeInteger(n)&&n<=1e11?(negative?-n:n):null;
}
function dateValue(raw:string,order:"dmy"|"mdy") {
  if(order==="mdy"&&/^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(raw.trim())){const [m,d,y]=raw.trim().split(/[/.-]/);return parseCSVDate(`${d}/${m}/${y}`);}
  return parseCSVDate(raw);
}
export function columnErrors(plan:ImportPlan):string[] {
  if(plan.rows.length-plan.header-1>MAX_IMPORT_ROWS)return ["Importez au maximum 5 000 opérations par fichier."];
  const sourceAccount=plan.rows[plan.header]?.findIndex(h=>/^(compte|account|iban|numero de compte|account number)$/i.test(normalize(h)))??-1;
  if(sourceAccount>=0&&new Set(plan.rows.slice(plan.header+1).map(r=>r[sourceAccount]?.trim()).filter(Boolean)).size>1)return ["Ce fichier contient plusieurs comptes. Exportez chaque compte séparément pour éviter de mélanger leurs opérations."];
  const c=plan.columns,required=plan.mode==="signed"?[c.date,c.label,c.amount]:[c.date,c.label,c.debit,c.credit];
  if(required.some(i=>i<0||i>=plan.rows[plan.header]?.length))return ["Choisissez les colonnes de date, libellé et montant (ou débit et crédit)."];
  const mapped=Object.values(c).filter(i=>i>=0);
  // Unused amount columns do not participate in validation.
  const active=Object.entries(c).filter(([k,v])=>v>=0&&(plan.mode==="signed"?!["debit","credit"].includes(k):k!=="amount")).map(([,v])=>v);
  return new Set(active).size!==active.length?["Une même colonne ne peut pas servir à deux champs."]:mapped.some(i=>i>=plan.rows[plan.header]?.length)?["Une colonne sélectionnée est introuvable."]:[];
}
export function previewBankImport(budget:Budget,plan:ImportPlan):ImportRow[] {
  const mappingErrors=columnErrors(plan),account=budget.accounts.find(a=>a.id===plan.accountId);
  const existing=budget.transactions.filter(t=>t.accountId===plan.accountId),keys=new Map<string,number>(),references=new Set<string>(),similar=new Set<string>();
  for(const t of existing){const key=transactionKey(t);keys.set(key,(keys.get(key)??0)+1);if(t.importRef)references.add(t.importRef);similar.add(`${t.date}|${t.amount}`);}
  const seen=new Map<string,number>(),seenRefs=new Set<string>();
  return plan.rows.slice(plan.header+1).map((row,index)=>{
    const c=plan.columns,get=(i:number)=>i>=0?(row[i]??"").trim():"",errors=[...mappingErrors],warnings:string[]=[];
    const date=dateValue(get(c.date),plan.dateOrder),label=get(c.label).replace(/\s+/g," "),sourceCategory=get(c.category);
    const notes=[get(c.note)];
    if(plan.keepExtra!==false){
      const used=new Set(Object.entries(c).filter(([key,value])=>value>=0&&(plan.mode==="signed"?!["debit","credit"].includes(key):key!=="amount")).map(([,value])=>value));
      row.forEach((value,column)=>{if(!used.has(column)&&value.trim())notes.push(`${plan.rows[plan.header][column]?.trim()||`Colonne ${column+1}`} : ${value.trim()}`);});
    }
    const note=notes.filter(Boolean).join("\n");
    let amount:number|null=null;
    if(plan.mode==="signed")amount=parseBankAmount(get(c.amount));
    else {const debit=get(c.debit)?parseBankAmount(get(c.debit)):0,credit=get(c.credit)?parseBankAmount(get(c.credit)):0;if(debit!==null&&credit!==null&&credit>=0&&!(debit!==0&&credit!==0))amount=credit-Math.abs(debit);}
    const category=sourceCategory||preferredCategory(budget.settings.categoryRules,label,undefined,(amount??0)>0)||suggestCategory(label,(amount??0)>0)||"Autres";
    if(row.length!==plan.rows[plan.header].length)errors.push("Nombre de colonnes différent de l’en-tête.");
    if(!account)errors.push("Choisissez un compte de destination.");
    if(!date)errors.push("Date invalide : vérifiez le format choisi.");
    if(date&&date>plan.today)errors.push("Opération future : importez uniquement les opérations comptabilisées.");
    if(!label||label.length>120)errors.push("Le libellé doit contenir de 1 à 120 caractères.");
    if(amount===null||amount===0)errors.push("Montant invalide ou nul ; vérifiez les signes et les colonnes débit/crédit.");
    if(category.length>120)errors.push("La catégorie dépasse 120 caractères.");
    if(note.length>1000)errors.push("Les notes dépassent 1 000 caractères. Corrigez le fichier ou désactivez les colonnes supplémentaires. Aucune donnée n’est tronquée.");
    if(c.currency>=0&&!/^(EUR|€)$/i.test(get(c.currency)))errors.push("Seuls les montants en euros sont acceptés, sans conversion.");
    if(date&&account){if(plan.balanceMode==="new"&&date<=account.openingDate)errors.push("Déjà compris dans le solde de référence : choisissez le mode historique, ou corrigez la référence du compte.");if(plan.balanceMode==="history"&&date>account.openingDate)errors.push("Cette opération suit la date de référence : utilisez le mode nouvelles opérations.");}
    const reference=get(c.reference);if(reference.length>120)errors.push("La référence bancaire dépasse 120 caractères.");
    const transaction:Transaction={id:`preview-${index}`,date:date??"",label,amount:amount??0,accountId:plan.accountId,category,note,...(reference?{importRef:reference}:{}),...(plan.balanceMode==="history"?{balanceIncluded:true}:{})};
    let duplicate=false;
    if(!errors.length){const key=transactionKey(transaction),occurrence=(seen.get(key)??0)+1;seen.set(key,occurrence);
      duplicate=reference?references.has(reference)||seenRefs.has(reference):occurrence<=(keys.get(key)??0);
      if(reference)seenRefs.add(reference);
      if(duplicate)warnings.push("Déjà présente : exclue de l’import.");
      else if(!reference&&occurrence>1)warnings.push("Ligne identique dans ce fichier : vérifiez avant de la sélectionner.");
      else if(!reference&&similar.has(`${date}|${amount}`)&&!keys.has(key))warnings.push("Même date et montant qu’une opération existante : vérifiez le libellé, notamment une récurrence.");
      else if(reference&&keys.has(key))warnings.push("Une opération identique existe avec une autre référence ou sans référence : vérifiez avant de l’ajouter.");
    }
    return {index,transaction,errors,warnings,duplicate,defaultSelected:!errors.length&&!warnings.length};
  });
}
export function buildImportedBudget(budget:Budget,rows:ImportRow[],selected:Set<number>,batchId:string,makeId:()=>string):Budget {
  const chosen=rows.filter(r=>selected.has(r.index));
  if(!chosen.length)throw new Error("Sélectionnez au moins une opération valide.");
  if(chosen.some(r=>r.errors.length||r.duplicate))throw new Error("La sélection contient une ligne invalide ou déjà présente.");
  if(budget.transactions.length+chosen.length>20000)throw new Error("Le budget dépasserait la limite de 20 000 opérations.");
  return {...budget,transactions:[...budget.transactions,...chosen.map(r=>({...r.transaction,id:makeId(),importBatch:batchId}))]};
}
