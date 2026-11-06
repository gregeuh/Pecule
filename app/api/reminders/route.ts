import {z} from "zod";
import {getChatGPTUser} from "../../chatgpt-auth";
import {getPool} from "../../../lib/postgres";
import {ensurePush,pushAvailable,pushId,pushTable,sendReminder} from "../../../lib/push-server";
import {safePushEndpoint} from "../../../lib/reminders";
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const endpoint=z.string().max(2048).refine(safePushEndpoint,'Service de notifications non reconnu.');
const subscription=z.object({endpoint,expirationTime:z.number().nullable().optional(),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87,88}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22,24}$/)})});
const body=z.discriminatedUnion('action',[z.object({action:z.literal('subscribe'),subscription,hour:z.number().int().min(0).max(23)}),z.object({action:z.literal('remove'),id:z.string().regex(/^[a-f0-9]{64}$/)}),z.object({action:z.literal('disable'),endpoint}),z.object({action:z.literal('test'),endpoint})]);
export async function GET(){try{const user=await getChatGPTUser();if(!user)return reply({error:'Connectez-vous pour gérer vos rappels.'},401);if(!pushAvailable())return reply({available:false,devices:[]});await ensurePush();const {rows}=await getPool().query(`SELECT id,hour,enabled,last_sent_date,last_status FROM ${pushTable} WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 20`,[user.userId]);return reply({available:true,publicKey:process.env.VAPID_PUBLIC_KEY,devices:rows});}catch{return reply({error:'Impossible de charger vos rappels. Réessayez.'},503);}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Origine refusée.'},403);
 try{const user=await getChatGPTUser();if(!user)return reply({error:'Votre session a expiré.'},401);if(!pushAvailable())return reply({error:'Les notifications sont temporairement indisponibles.'},503);if(Number(request.headers.get('content-length'))>10000)return reply({error:'Demande trop volumineuse.'},413);const raw=await request.text();if(raw.length>10000)return reply({error:'Demande trop volumineuse.'},413);let input:unknown;try{input=JSON.parse(raw);}catch{return reply({error:"Données JSON invalides."},400);}const parsed=body.safeParse(input);if(!parsed.success)return reply({error:'Vérifiez le rappel et son abonnement.'},400);const data=parsed.data;await ensurePush();
 if(data.action==='subscribe'){const id=pushId(data.subscription.endpoint);const count=await getPool().query(`SELECT count(*)::int AS count FROM ${pushTable} WHERE user_id=$1 AND id<>$2`,[user.userId,id]);if(count.rows[0].count>=20)return reply({error:'La limite de vingt appareils est atteinte. Désactivez un ancien appareil.'},400);const r=await getPool().query(`INSERT INTO ${pushTable}(id,user_id,subscription,hour) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET subscription=$3,hour=$4,enabled=true,last_status=NULL,updated_at=now() WHERE ${pushTable}.user_id=$2 RETURNING id`,[id,user.userId,JSON.stringify(data.subscription),data.hour]);if(!r.rowCount)return reply({error:'Cet appareil est associé à un autre compte. Désactivez son ancien rappel.'},409);return reply({ok:true,id});}
 if(data.action==='remove'){await getPool().query(`DELETE FROM ${pushTable} WHERE id=$1 AND user_id=$2`,[data.id,user.userId]);return reply({ok:true});}
 const id=pushId(data.endpoint);const r=await getPool().query(`SELECT subscription,updated_at FROM ${pushTable} WHERE id=$1 AND user_id=$2 AND enabled=true`,[id,user.userId]);
 if(data.action==='disable'){await getPool().query(`DELETE FROM ${pushTable} WHERE id=$1 AND user_id=$2`,[id,user.userId]);return reply({ok:true});}
 if(!r.rowCount)return reply({error:'Activez d’abord le rappel sur cet appareil.'},404);
 // A database throttle also protects repeated clicks and multiple tabs.
 const claim=await getPool().query(`UPDATE ${pushTable} SET last_status='test',updated_at=now() WHERE id=$1 AND user_id=$2 AND (last_status IS DISTINCT FROM 'test' OR updated_at<now()-interval '30 seconds') RETURNING id`,[id,user.userId]);if(!claim.rowCount)return reply({error:'Patientez trente secondes avant un nouveau test.'},429);
 try{await sendReminder(JSON.parse(r.rows[0].subscription),true);return reply({ok:true});}catch(cause){const status=(cause as {statusCode?:number}).statusCode;if(status===404||status===410){await getPool().query(`DELETE FROM ${pushTable} WHERE id=$1 AND user_id=$2`,[id,user.userId]);return reply({error:'Cet abonnement a expiré. Réactivez le rappel.'},410);}return reply({error:'Le service de notifications ne répond pas. Réessayez plus tard.'},503);}
 }catch{return reply({error:'Impossible de modifier ce rappel. Réessayez.'},503);}
}
