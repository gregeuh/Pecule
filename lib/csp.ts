/**
 * Content Security Policy with a per-request nonce (issue #11). Served as Report-Only first: nothing is blocked,
 * violations are reported to /api/csp-report, then the same policy is enforced once the reports stay empty.
 */
export function buildCsp(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    // Lottie animations need WebAssembly; React needs eval only in development.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
    "report-to csp",
  ].join("; ");
}

const place = (value: unknown, keepPath: boolean) => {
  if (typeof value !== "string" || !value) return "";
  if (!/^[a-z]+:\/\//i.test(value)) return value.slice(0, 40); // "inline", "eval", "self"…
  try {
    const url = new URL(value);
    return keepPath ? url.pathname : url.origin;
  } catch {
    return "";
  }
};

/** Compact, privacy-safe view of CSP reports (both the legacy and the Reporting API formats). */
export function cspReportSummary(payload: unknown): { page: string; directive: string; blocked: string }[] {
  const reports = Array.isArray(payload)
    ? payload.map((r) => (r && typeof r === "object" ? (r as { body?: unknown }).body : undefined))
    : payload && typeof payload === "object" && "csp-report" in payload
      ? [(payload as Record<string, unknown>)["csp-report"]]
      : [];
  return reports.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    return [
      {
        page: place(o["document-uri"] ?? o.documentURL, true),
        directive: String(o["violated-directive"] ?? o.effectiveDirective ?? "").slice(0, 40),
        blocked: place(o["blocked-uri"] ?? o.blockedURL, false),
      },
    ];
  });
}
