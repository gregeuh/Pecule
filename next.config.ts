import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers(){
    return [{source:"/(.*)",headers:[
      {key:"X-Frame-Options",value:"DENY"},
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
      {key:"Content-Security-Policy",value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"},
      // The nonce-based script policy (Report-Only for now) is set per request by proxy.ts.
    ]}];
  },
};
export default nextConfig;
