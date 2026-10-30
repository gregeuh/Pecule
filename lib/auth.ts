import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getMigrations } from "better-auth/db/migration";
import { getPool, tablePrefix } from "./postgres";

import { passwordResetEnabled, sendPasswordResetEmail } from "./reset-email";

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }
function createAuth() {
  return betterAuth({
    database: getPool(),
    baseURL: process.env.VERCEL_ENV === "preview" ? undefined : process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 1800, revokeSessionsOnPasswordReset: true,
      ...(passwordResetEnabled() ? { sendResetPassword: async ({user,url}: {user:{email:string};url:string}) => { try { await sendPasswordResetEmail(user.email,url); } catch { console.error("Password reset email could not be delivered"); } } } : {}),
    },
    socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
    } : {},
    user: { modelName: `${tablePrefix}user` },
    session: { modelName: `${tablePrefix}session` },
    account: { modelName: `${tablePrefix}account` },
    verification: { modelName: `${tablePrefix}verification` },
    rateLimit: { enabled: true, storage: "database", modelName: `${tablePrefix}rate_limit` },
    advanced: { cookiePrefix: tablePrefix },
    plugins: [nextCookies()],
  });
}
let ready: Promise<void> | undefined;
export function ensureDatabase() {
  return ready ??= initialize().catch(error => { ready = undefined; throw error; });
}
async function initialize() {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${tablePrefix}initialize`]);
    const { runMigrations } = await getMigrations(getAuth().options);
    await runMigrations();
    await client.query(`CREATE TABLE IF NOT EXISTS ${tablePrefix}budgets (
      user_id text PRIMARY KEY, payload text NOT NULL,
      revision integer NOT NULL, updated_at text NOT NULL
    )`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK"); throw error;
  } finally { client.release(); }
}
