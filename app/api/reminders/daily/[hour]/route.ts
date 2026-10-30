import {timingSafeEqual} from 'node:crypto';
import {getPool,tablePrefix} from '../../../../../lib/postgres';
import {ensurePush,pushAvailable,pushTable,sendReminder} from '../../../../../lib/push-server';
import {parisClock,reminderHours,walkReminderDevices} from '../../../../../lib/reminders';
import {reviewState} from '../../../../../lib/capture';
import {budgetSchema} from '../../../../../lib/validation';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=300;
export async function GET(request:Request,{params}:{params:Promise<{hour:string}>}){
 const expected=`Bearer ${process.env.CRON_SECRET??''}`,actual=request.headers.get('authorization')??'';
 if(!process.env.CRON_SECRET||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return Response.json({error:'Non autorisé.'},{status:401});
 const {hour}=await params;if(!/^([0-9]|1[0-9]|2[0-3])$/.test(hour))return Response.json({error:'Cohorte inconnue.'},{status:404});
 if(!pushAvailable())return Response.json({error:'Notifications non configurées.'},{status:503});
 const now=new Date();if(now.getUTCHours()!==Number(hour))return Response.json({skipped:'outside-cohort'});
 try{await ensurePush();const clock=parisClock(now),hours=reminderHours(now);let sent=0,failed=0,skipped=0;const started=Date.now();
 await walkReminderDevices(async(after)=>{if(Date.now()-started>270000)throw new Error('Reminder time budget exhausted; retry the cohort.');const {rows}=await getPool().query(`SELECT d.id,d.subscription,b.payload FROM ${pushTable} d JOIN ${tablePrefix}budgets b ON b.user_id=d.user_id WHERE d.enabled=true AND d.hour=ANY($1::int[]) AND d.last_sent_date IS DISTINCT FROM $2 AND d.id>$3 ORDER BY d.id LIMIT 100`,[hours,clock.date,after]);return rows as {id:string;subscription:string;payload:string}[];},async row=>{
 let data:unknown;try{data=JSON.parse(row.payload);}catch{skipped++;return;}const budget=budgetSchema.safeParse(data);if(!budget.success||reviewState(budget.data,clock.date)==='checked'){skipped++;return;}
 const claim=await getPool().query(`UPDATE ${pushTable} SET last_sent_date=$2,last_status='sending' WHERE id=$1 AND last_sent_date IS DISTINCT FROM $2 RETURNING id`,[row.id,clock.date]);if(!claim.rowCount)return;
 try{await sendReminder(JSON.parse(row.subscription));await getPool().query(`UPDATE ${pushTable} SET last_status='sent' WHERE id=$1`,[row.id]);sent++;}catch(cause){const status=(cause as {statusCode?:number}).statusCode;if(status===404||status===410)await getPool().query(`DELETE FROM ${pushTable} WHERE id=$1`,[row.id]);else await getPool().query(`UPDATE ${pushTable} SET last_status='failed' WHERE id=$1`,[row.id]);failed++;}},()=>{if(Date.now()-started>270000)throw new Error('Reminder time budget exhausted; retry the cohort.');});
 return Response.json({sent,failed,skipped},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Envoi temporairement indisponible. Les appareils déjà traités ne seront pas notifiés deux fois lors d’une reprise.'},{status:503});}
}
