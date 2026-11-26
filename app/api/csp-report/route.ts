import { cspReportSummary } from "../../../lib/csp";

/** Receives CSP violation reports (Report-Only phase) and logs a compact, privacy-safe summary. */
export async function POST(request: Request) {
  const text = (await request.text()).slice(0, 16_000);
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {}
  for (const report of cspReportSummary(payload).slice(0, 5)) console.warn("csp-violation", JSON.stringify(report));
  return new Response(null, { status: 204 });
}
