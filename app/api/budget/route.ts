import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDatabase } from "../../../lib/auth";
import { getPool, tablePrefix } from "../../../lib/postgres";
import { budgetSaveStatement } from "../../../lib/budget-storage";
import { saveSchema } from "../../../lib/validation";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return response({ error: "Connectez-vous pour accéder à votre budget." }, 401);
    await ensureDatabase();
    const { rows } = await getPool().query(`SELECT payload, revision, updated_at FROM ${tablePrefix}budgets WHERE user_id = $1`, [user.userId]);
    const row = rows[0];
    return response({ budget: row ? JSON.parse(row.payload) : null, revision: row?.revision ?? 0, updatedAt: row?.updated_at ?? null });
  } catch { return response({ error: "Votre budget est temporairement indisponible. Réessayez dans un instant." }, 503); }
}
export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return response({ error: "Origine de la requête refusée." }, 403);
  try {
    const user = await getChatGPTUser();
    if (!user) return response({ error: "Votre session a expiré. Reconnectez-vous." }, 401);
    if (Number(request.headers.get("content-length")) > 4000000) return response({ error: "Le budget est trop volumineux." }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 4000000) return response({ error: "Le budget est trop volumineux." }, 413);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return response({ error: "Données JSON invalides." }, 400); }
    const result = saveSchema.safeParse(parsed);
    if (!result.success) return response({ error: result.error.issues[0]?.message ?? "Données invalides." }, 400);
    const { budget, revision } = result.data;
    const updatedAt = new Date().toISOString();
    await ensureDatabase();
    const pool = getPool();
    const saved = await pool.query(budgetSaveStatement(`${tablePrefix}budgets`, revision === 0),
      revision === 0 ? [user.userId, JSON.stringify(budget), updatedAt] : [user.userId, JSON.stringify(budget), updatedAt, revision]);
    if (!saved.rowCount) return response({ error: "Votre budget a été modifié sur un autre appareil. Rechargez les données avant de réessayer." }, 409);
    return response({ revision: revision + 1, updatedAt });
  } catch { return response({ error: "L’enregistrement a échoué. Réessayez dans un instant." }, 503); }
}
