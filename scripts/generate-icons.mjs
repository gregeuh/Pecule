/** App icons rendered from the shared mark (public/favicon.svg): 192, 512, maskable 512 and Apple touch 180. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
const root = resolve(import.meta.dirname, "..");
const svg = await readFile(resolve(root, "public/favicon.svg"), "utf8");
const browser = await chromium.launch({
  executablePath: process.env.PECULE_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const [file, size, maskable] of [
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["maskable-512.png", 512, true],
    ["apple-touch-icon.png", 180, true],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    // Maskable and Apple icons fill the whole square: the mark sits in the safe zone on the coral ground.
    const body = maskable
      ? `<div style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(#ef8a66,#c4532d)"><div style="width:76%;height:76%">${svg.replace(/<rect[^>]*\/>/, "")}</div></div>`
      : svg;
    await page.setContent(
      `<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${body}`,
    );
    await page.screenshot({ path: resolve(root, "public/icons", file), omitBackground: !maskable });
    await page.close();
  }
  console.log("4 app icons generated from public/favicon.svg.");
} finally {
  await browser.close();
}
