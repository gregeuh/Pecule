import { getSessionUser } from "../../../session-user";
import { ensureDatabase } from "../../../../lib/auth";
import { getPool, tablePrefix } from "../../../../lib/postgres";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

// Personal backup: the signed-in user downloads their own budget as JSON.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Connectez-vous pour exporter votre budget." }, { status: 401, headers });
    await ensureDatabase();
    const { rows } = await getPool().query(`SELECT payload FROM ${tablePrefix}budgets WHERE user_id = $1`, [
      user.userId,
    ]);
    if (!rows[0]) return Response.json({ error: "Aucun budget à exporter." }, { status: 404, headers });
    const day = new Date().toISOString().slice(0, 10);
    const body = JSON.stringify(JSON.parse(rows[0].payload), null, 2);
    return new Response(body, {
      headers: {
        ...headers,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pecule-budget-${day}.json"`,
      },
    });
  } catch {
    return Response.json(
      { error: "L’export est temporairement indisponible. Réessayez dans un instant." },
      { status: 503, headers },
    );
  }
}
