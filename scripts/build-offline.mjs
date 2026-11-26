import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await build({
  entryPoints: ["lib/offline-page.ts"],
  outfile: "public/offline-capture.js",
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["safari16.4"],
});
const hash = createHash("sha256");
for (const file of [
  "public/offline-capture.js",
  "public/offline.html",
  "public/offline.css",
  "public/fonts/inter-latin.woff2",
  "public/fonts/nunito-latin.woff2",
  "public/favicon.svg",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/fonts/dm-sans-latin.woff2",
  "public/fonts/manrope-latin.woff2",
])
  hash.update(await readFile(file));
await writeFile(
  "public/offline-version.js",
  `self.PECULE_OFFLINE_VERSION=${JSON.stringify(hash.digest("hex").slice(0, 16))};\n`,
);
