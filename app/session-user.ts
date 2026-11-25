import { headers } from "next/headers";
import { getAuth, ensureDatabase } from "../lib/auth";

// Only a verified Better Auth session is trusted, never identity headers.
export async function getSessionUser() {
  const requestHeaders = await headers();
  if (!requestHeaders.get("cookie")?.includes("pecule_")) return null;
  await ensureDatabase();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session
    ? {
        userId: session.user.id,
        email: session.user.email,
        fullName: session.user.name,
        displayName: session.user.name || session.user.email,
      }
    : null;
}
