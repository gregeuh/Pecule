export function parisClock(now:Date){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour)};}
export function reminderHours(now:Date){const p=parisClock(now),before=parisClock(new Date(now.getTime()-3600000));return p.hour===3&&before.hour===1?[2,3]:[p.hour];}
export function safePushEndpoint(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&u.pathname!=='/'&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}}
/** Walk every device deterministically; reviewed/invalid rows must not starve later pages. */
export async function walkReminderDevices<T extends {id:string}>(load:(after:string)=>Promise<T[]>,visit:(row:T)=>Promise<void>,beforeBatch:()=>void=()=>{}){
 let cursor='';
 for(;;){const rows=await load(cursor);if(!rows.length)return;for(let start=0;start<rows.length;start+=10){beforeBatch();await Promise.all(rows.slice(start,start+10).map(visit));}const last=rows.at(-1)!.id;if(last<=cursor)throw new Error('Reminder cursor did not advance.');cursor=last;}
}
