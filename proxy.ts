import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "./lib/csp";

/**
 * A fresh nonce for every page request. Next.js reads it from the request's CSP header and puts it on its own
 * scripts; app/layout.tsx puts it on the inline bootstrap scripts. Report-Only until the reports stay empty.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = buildCsp(nonce, process.env.NODE_ENV === "development");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy-Report-Only", policy);
  // Next.js takes the nonce for its own scripts from the request's CSP header. On Vercel the Report-Only request
  // header does not reach the page render, so the policy is also passed under the enforced name — on the request
  // only: the browser still receives Report-Only.
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy-Report-Only", policy);
  response.headers.set("Reporting-Endpoints", 'csp="/api/csp-report"');
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: no API routes, build assets or public files (fonts, icons, launch images, offline page, worker).
      source:
        "/((?!api|_next/static|_next/image|favicon|fonts|icons|launch|brands|animations|sw\\.js|offline|manifest\\.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
