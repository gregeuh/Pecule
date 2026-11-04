import type { Account } from './budget';
/** Upgrade legacy presentation swatches without rewriting a saved account or goal. */
const swatches:Record<string,string>={'#335cff':'#245af3','#a48bdb':'#f4ac36','#edac69':'#8248f4','#5b9b86':'#16765a','#d77992':'#b84866','#5b99c1':'#246f9b'};
export function walletColor(color:string){return swatches[color.toLowerCase()]??(/^#[0-9a-f]{6}$/i.test(color)?color:'#245af3');}
export function walletInk(color:string){const channels=walletColor(color).slice(1).match(/../g)!.map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);const l=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;return (l+.05)/.05>=1.05/(l+.05)?'#000000':'#ffffff';}
export const accountKind=(account:Account)=>account.type==='savings'?'Compte d’épargne':account.type==='cash'?'Espèces':'Compte courant';
