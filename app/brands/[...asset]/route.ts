import { gunzipSync } from "node:zlib";
import assets from "../../../lib/brand-assets.json";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{asset:string[]}>}){
  const key=(await params).asset.join("/");
  if(!Object.hasOwn(assets,key))return new Response("Logo introuvable",{status:404});
  const packed=(assets as Record<string,string>)[key];
  return new Response(new Uint8Array(gunzipSync(Buffer.from(packed,"base64"))),{headers:{"Content-Type":key.endsWith(".svg")?"image/svg+xml":key.endsWith(".png")?"image/png":"image/webp","Cache-Control":"public, max-age=86400, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
}
