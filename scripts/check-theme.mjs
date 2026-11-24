/** Guard the canonical palette against reintroduced global overrides and doc drift. */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import postcss from "postcss";
const theme = postcss.parse(await readFile("app/theme.css", "utf8"));
const root = theme.nodes.find((n) => n.type === "rule" && n.selector === ":root");
const values = new Map(root.nodes.filter((n) => n.type === "decl").map((n) => [n.prop, n.value]));
const owned = new Set();
theme.walkDecls((d) => owned.add(d.prop));
for (const file of await readdir("app"))
  if (file.endsWith(".css") && file !== "theme.css") {
    const css = postcss.parse(await readFile("app/" + file, "utf8"));
    for (const rule of css.nodes) {
      if (rule.type !== "rule" || !/^:root(?:\[data-theme=["']?dark["']?\])?$/.test(rule.selector)) continue;
      rule.walkDecls((d) => assert(!owned.has(d.prop), `${file}: global ${d.prop} belongs to theme.css`));
    }
  }
const design = await readFile("DESIGN.md", "utf8");
const colors = design.match(/\ncolors:\n([\s\S]*?)\ntypography:/)?.[1];
assert(colors, "DESIGN color map missing");
for (const [name, property] of Object.entries({
  background: "--bg",
  surface: "--card",
  ink: "--ink",
  muted: "--muted",
  primary: "--action-bg",
  "text-accent": "--blue",
})) {
  const documented = colors.match(new RegExp(`^  ${name}: "([^"]+)"`, "m"))?.[1];
  assert.equal(documented, values.get(property), `DESIGN ${name} must mirror ${property}`);
}
console.log("PASS canonical theme ownership and DESIGN color mapping");
