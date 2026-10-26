import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { budgets } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { saveSchema } from "../../../lib/validation";
export const dynamic = "force-dynamic";
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function GET() {
  const user=await getChatGPTUser();
  if(!user) return response({error:"Connectez-vous pour accéder à votre budget."},401);
  try {
    const [row]=await getDb().select().from(budgets).where(eq(budgets.userId,user.userId)).limit(1);
    return response({budget:row ? JSON.parse(row.payload) : null,revision:row?.revision ?? 0,updatedAt:row?.updatedAt ?? null});
  } catch { return response({error:"Votre budget est temporairement indisponible. Réessayez dans un instant."},503); }
}
export async function PUT(request:Request) {
  const user=await getChatGPTUser();
  if(!user) return response({error:"Votre session a expiré. Reconnectez-vous."},401);
  const origin=request.headers.get("origin");
  if(!origin || origin!==new URL(request.url).origin) return response({error:"Origine de la requête refusée."},403);
  try {
    if(Number(request.headers.get("content-length"))>4000000) return response({error:"Le fichier est trop volumineux."},413);
    const raw=await request.text(); if(raw.length>4000000) return response({error:"Le budget est trop volumineux."},413);
    const result=saveSchema.safeParse(JSON.parse(raw));
    if(!result.success) return response({error:result.error.issues[0]?.message ?? "Données invalides."},400);
    const {budget,revision}=result.data, db=getDb(), updatedAt=new Date().toISOString();
    const values={payload:JSON.stringify(budget),revision:revision+1,updatedAt};
    const rows=revision===0 ? await db.insert(budgets).values({userId:user.userId,...values}).onConflictDoNothing().returning() : await db.update(budgets).set(values).where(and(eq(budgets.userId,user.userId),eq(budgets.revision,revision))).returning();
    if(!rows.length) return response({error:"Votre budget a été modifié sur un autre appareil. Rechargez les données avant de réessayer."},409);
    return response({revision:revision+1,updatedAt});
  } catch { return response({error:"L’enregistrement a échoué. Vos modifications n’ont pas été envoyées. Réessayez."},503); }
}
