import { getSessionUser } from "../../../../session-user";
import { ensureDatabase } from "../../../../../lib/auth";
import { getPool, tablePrefix } from "../../../../../lib/postgres";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

// One earlier version of the signed-in user's own budget. Restoring goes through the normal save.
export async function GET(_request: Request, { params }: { params: Promise<{ revision: string }> }) {
  const { revision } = await params;
  if (!/^[1-9][0-9]{0,8}$/.test(revision))
    return Response.json({ error: "Version inconnue." }, { status: 404, headers });
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Connectez-vous pour voir vos versions." }, { status: 401, headers });
    await ensureDatabase();
    const { rows } = await getPool().query(
      `SELECT payload, saved_at FROM ${tablePrefix}budget_versions WHERE user_id=$1 AND revision=$2`,
      [user.userId, Number(revision)],
    );
    if (!rows[0]) return Response.json({ error: "Cette version n’est plus disponible." }, { status: 404, headers });
    return Response.json(
      {
        revision: Number(revision),
        savedAt: new Date(rows[0].saved_at).toISOString(),
        budget: JSON.parse(rows[0].payload),
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "Cette version est temporairement indisponible. Réessayez dans un instant." },
      { status: 503, headers },
    );
  }
}
