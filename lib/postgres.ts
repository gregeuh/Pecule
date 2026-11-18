import { Pool } from "pg";
export const tablePrefix = process.env.VERCEL_ENV === "preview" ? "pecule_preview_" : "pecule_git_";
let pool: Pool | undefined;
export function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("La base de données n’est pas configurée.");
  return pool ??= new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
}
