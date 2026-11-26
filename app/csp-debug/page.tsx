import { headers } from "next/headers";
/** TEMPORARY (preview only): which CSP request headers reach the render on Vercel. Never merged. */
export default async function Page() {
  const h = await headers();
  return (
    <pre>
      {JSON.stringify({
        nonce: !!h.get("x-nonce"),
        csp: (h.get("content-security-policy") ?? "").slice(0, 60),
        cspReportOnly: (h.get("content-security-policy-report-only") ?? "").slice(0, 60),
        override: h.get("x-middleware-override-headers")?.slice(0, 200) ?? null,
      })}
    </pre>
  );
}
