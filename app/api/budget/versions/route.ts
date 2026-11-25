import { getSessionUser } from "../../../session-user";
import { ensureDatabase } from "../../../../lib/auth";
import { getPool, tablePrefix } from "../../../../lib/postgres";
import { budgetVersionsListStatement } from "../../../../lib/budget-storage";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

// Earlier server versions of the signed-in user's budget, newest first.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Connectez-vous pour voir vos versions." }, { status: 401, headers });
    await ensureDatabase();
    const { rows } = await getPool().query(budgetVersionsListStatement(`${tablePrefix}budget_versions`), [user.userId]);
    return Response.json(
      {
        versions: rows.map((row: { revision: number; saved_at: Date; transactions: number; size: number }) => ({
          revision: row.revision,
          savedAt: new Date(row.saved_at).toISOString(),
          transactions: Number(row.transactions),
          size: Number(row.size),
        })),
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "Les versions sont temporairement indisponibles. Réessayez dans un instant." },
      { status: 503, headers },
    );
  }
}
