import { Pool } from "pg";
export const tablePrefix = process.env.VERCEL_ENV === "preview" ? "pecule_preview_" : "pecule_git_";
let pool: Pool | undefined;
export function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("La base de données n’est pas configurée.");
  if (pool) return pool;
  pool = new Pool({
    connectionString: explicitSslMode(connectionString),
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
  // Without a listener, an error on an idle client (Neon closing a connection) is an uncaught exception.
  pool.on("error", () => {
    console.error("Idle PostgreSQL client error");
  });
  return pool;
}

/**
 * pg currently treats sslmode=prefer/require/verify-ca as verify-full and warns that this will
 * weaken to libpq semantics in pg 9. Pin today's behaviour (certificate and host verified) explicitly.
 */
export function explicitSslMode(connectionString: string) {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  const mode = url.searchParams.get("sslmode");
  if (url.searchParams.has("uselibpqcompat") || !mode || !["prefer", "require", "verify-ca"].includes(mode))
    return connectionString;
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
