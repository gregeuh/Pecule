import type { Transaction } from "./budget";
export function parseCSV(text: string): string[][] {
  const first=text.replace(/^\uFEFF/,"").split(/\r?\n/)[0] ?? "";
  const delimiter=[";",",","\t"].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
  const input=text.replace(/^\uFEFF/,"");
  for(let i=0;i<input.length;i++) {const ch=input[i];if(ch==='"') {if(quoted && input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;} else if(ch===delimiter && !quoted){row.push(cell);cell="";}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(c=>c.trim()))rows.push(row);row=[];cell="";}else cell+=ch;}
  if(quoted) throw new Error("Une cellule CSV contient des guillemets non fermés.");
  row.push(cell);if(row.some(c=>c.trim()))rows.push(row);
  return rows;
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
