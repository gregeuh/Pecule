import type { Transaction } from "./budget";
export function parseCSV(text: string, separator?: string): string[][] {
  let input=text.replace(/^\uFEFF/,"");
  const directive=input.match(/^sep=([;,\t])\s*(?:\r\n|\r|\n)/i);
  if(directive)input=input.slice(directive[0].length);
  const delimiter=separator??directive?.[1]??detectDelimiter(input);
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false,closed=false;
  for(let i=0;i<input.length;i++) {const ch=input[i];if(ch==='"') {if(quoted && input[i+1]==='"'){cell+='"';i++;}else if(quoted){quoted=false;closed=true;}else if(cell===""&&!closed)quoted=true;else throw new Error("Guillemet inattendu dans le CSV. Exportez à nouveau le fichier depuis votre banque.");} else if(ch===delimiter && !quoted){row.push(cell);cell="";closed=false;}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(c=>c.trim()))rows.push(row);row=[];cell="";closed=false;}else if(closed){if(!/[ \t]/.test(ch))throw new Error("Texte inattendu après une cellule entre guillemets.");}else cell+=ch;}
  if(quoted) throw new Error("Une cellule CSV contient des guillemets non fermés.");
  row.push(cell);if(row.some(c=>c.trim()))rows.push(row);
  return rows;
}
function detectDelimiter(input:string):string {
  // Count separators outside quoted cells, including metadata before the header.
  const counts=new Map([[';',0],[',',0],['\t',0]]);let quoted=false,lines=0;
  for(let i=0;i<input.length&&lines<30;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted){if(c==='\n')lines++;if(counts.has(c))counts.set(c,counts.get(c)!+1);}}
  return [...counts].sort((a,b)=>b[1]-a[1])[0][0];
}
export function parseAmount(value:string):number|null {
  let s=value.trim().replace(/[\s€\u00a0\u202f]/g,"");
  if(s.includes(",") && s.includes(".")) s=s.lastIndexOf(",")>s.lastIndexOf(".") ? s.replace(/\./g,"").replace(",",".") : s.replace(/,/g,"");
  else s=s.replace(",",".");
  if(!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const n=Math.round(Number(s)*100);return Number.isSafeInteger(n)&&Math.abs(n)<=1e11 ? n : null;
}
export function parseCSVDate(s:string):string|null {
  s=s.trim();const m=s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  const d=m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:s;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d<"2000-01-01"||d>"2100-12-31")return null;
  const date=new Date(d+"T12:00:00Z");return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===d?d:null;
}
export const transactionKey=(t:Pick<Transaction,"date"|"amount"|"label"|"accountId">)=>[t.date,t.amount,t.label.trim().toLocaleLowerCase("fr"),t.accountId].join("|");
export function csvCell(value:string):string { const safe=/^[=+@\-\t\r]/.test(value)?"'"+value:value;return '"'+safe.replace(/"/g,'""')+'"'; }
