import webpush from "web-push";
import {createHash} from "node:crypto";
import {ensureDatabase} from "./auth";
import {getPool,tablePrefix} from "./postgres";
export const pushTable=`${tablePrefix}reminder_devices`;
export const pushId=(endpoint:string)=>createHash('sha256').update(endpoint).digest('hex');
export const pushAvailable=()=>!!(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.CRON_SECRET);
let ready:Promise<void>|undefined;
export function ensurePush(){return ready??=ensureDatabase().then(async()=>{await getPool().query(`CREATE TABLE IF NOT EXISTS ${pushTable}(id text PRIMARY KEY,user_id text NOT NULL REFERENCES ${tablePrefix}user(id) ON DELETE CASCADE,subscription text NOT NULL,hour integer NOT NULL CHECK(hour>=0 AND hour<=23),enabled boolean NOT NULL DEFAULT true,last_sent_date text,last_status text,updated_at timestamptz NOT NULL DEFAULT now())`);await getPool().query(`CREATE INDEX IF NOT EXISTS ${pushTable}_user ON ${pushTable}(user_id)`);}).catch(e=>{ready=undefined;throw e;});}
export async function sendReminder(subscription:webpush.PushSubscription,test=false){
 if(!pushAvailable())throw new Error('Notifications non configurées.');
 return webpush.sendNotification(subscription,JSON.stringify({title:'Pécule',body:test?'Le rappel fonctionne sur cet appareil.':'Un petit moment pour faire le point sur votre journée ?',url:'/?daily-review=1',tag:test?'pecule-reminder-test':'pecule-daily-review'}),{vapidDetails:{subject:'https://pecule-budget.vercel.app',publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!},TTL:3600,urgency:'normal',timeout:6000});
}
