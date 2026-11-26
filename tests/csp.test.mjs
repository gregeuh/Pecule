import test from "node:test";
import assert from "node:assert/strict";
import { buildCsp, cspReportSummary } from "../lib/csp.ts";

test("the script policy allows only nonce-carrying scripts (strict-dynamic), never unsafe-inline", () => {
  const csp = buildCsp("abc123", false);
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /'unsafe-inline'|'unsafe-eval'/);
  for (const d of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ])
    assert(csp.includes(d), d);
  assert.match(buildCsp("n", true), /'unsafe-eval'/, "development needs eval for React debugging");
});

test("reports are summarised without query strings or fragments (reset tokens never reach the logs)", () => {
  const legacy = {
    "csp-report": {
      "document-uri": "https://p.app/reset-password?token=SECRET#x",
      "violated-directive": "script-src-elem",
      "blocked-uri": "https://evil.example/x.js?k=1",
    },
  };
  assert.deepEqual(cspReportSummary(legacy), [
    { page: "/reset-password", directive: "script-src-elem", blocked: "https://evil.example" },
  ]);
  const modern = [
    {
      type: "csp-violation",
      body: { documentURL: "https://p.app/?raccourci=x", effectiveDirective: "script-src", blockedURL: "inline" },
    },
  ];
  assert.deepEqual(cspReportSummary(modern), [{ page: "/", directive: "script-src", blocked: "inline" }]);
  assert.deepEqual(cspReportSummary("nonsense"), []);
});
