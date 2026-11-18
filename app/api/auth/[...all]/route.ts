import { getAuth, ensureDatabase } from "../../../../lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    await ensureDatabase();
    return await getAuth().handler(request);
  } catch {
    return Response.json({ message: "La connexion est temporairement indisponible. Réessayez dans un instant." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export { handle as GET, handle as POST };
