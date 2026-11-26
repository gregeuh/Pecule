import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers(){
    return [{source:"/(.*)",headers:[
      {key:"X-Frame-Options",value:"DENY"},
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
      // Content-Security-Policy is set by proxy.ts on pages: on Vercel a header set here also reaches the request
      // under the name Next.js reads its nonce from, which hid the nonce from Next.js's own scripts.
      // The nonce-based script policy (Report-Only for now) is set per request by proxy.ts.
    ]}];
  },
};
export default nextConfig;
