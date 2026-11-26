import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postcss from "postcss";

const css = postcss.parse(await readFile(new URL("../app/theme.css", import.meta.url), "utf8"));
const block = (selector) => {
  const out = {};
  css.walkRules((rule) => {
    if (rule.selector.replace(/\s+/g, "") === selector) rule.walkDecls((d) => (out[d.prop] = d.value.trim()));
  });
  return out;
};
const root = block(":root");
const tokens = (palette) =>
  palette === "nuit"
    ? { ...root, ...block(':root[data-theme="dark"]') }
    : { ...root, ...block(`:root[data-palette="${palette}"]:not([data-theme="dark"])`) };

const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (hex) => {
  const [r, g, b] = rgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const mix = (a, b, share) =>
  "#" +
  rgb(a)
    .map((v, i) =>
      Math.round(v * (1 - share) + rgb(b)[i] * share)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const darkest = (t) => ["--wash-1", "--wash-2", "--wash-3"].map((k) => t[k]).sort((a, b) => lum(a) - lum(b))[0];
const lightest = (t) => ["--wash-1", "--wash-2", "--wash-3"].map((k) => t[k]).sort((a, b) => lum(b) - lum(a))[0];

for (const p of ["peche", "lavande", "menthe", "ocean", "nuit"]) {
  test(`${p}: text stays readable on the ground, cards, glass and actions`, () => {
    const t = tokens(p);
    for (const k of [
      "--bg",
      "--card",
      "--ink",
      "--muted",
      "--wash-1",
      "--wash-2",
      "--wash-3",
      "--glass-solid",
      "--glass-base",
      "--action-bg",
      "--on-action",
      "--blue",
    ])
      assert.match(t[k] ?? "", /^#[0-9a-f]{6}$/i, `${p} ${k} is a 6-digit hex`);
    const alpha = Number(t["--glass-b"]); // the thinner end of the glass gradient
    // Glass is --glass-base over the colour wash: dark text fears the darkest wash, light text the lightest.
    const glassWorst = mix(p === "nuit" ? lightest(t) : darkest(t), t["--glass-base"], alpha);
    for (const surface of [t["--bg"], t["--card"], t["--glass-solid"], glassWorst]) {
      assert(
        contrast(t["--ink"], surface) >= 4.5,
        `${p} ink on ${surface}: ${contrast(t["--ink"], surface).toFixed(2)}`,
      );
      assert(
        contrast(t["--muted"], surface) >= 4.5,
        `${p} muted on ${surface}: ${contrast(t["--muted"], surface).toFixed(2)}`,
      );
    }
    // Text also sits straight on the wash (headings, totals): each blob is drawn at --wash-opacity over --bg.
    const o = Number(t["--wash-opacity"]);
    const single = ["--wash-1", "--wash-2", "--wash-3"].map((k) => [k, mix(t["--bg"], t[k], o)]);
    // Blobs overlap where they meet: two stacked blobs, in either order.
    const pairs = [
      ["--wash-1", "--wash-2"],
      ["--wash-2", "--wash-3"],
      ["--wash-1", "--wash-3"],
    ].flatMap(([a, b]) => [
      [`${a}+${b}`, mix(mix(t["--bg"], t[a], o), t[b], o)],
      [`${b}+${a}`, mix(mix(t["--bg"], t[b], o), t[a], o)],
    ]);
    for (const [k, onWash] of [...single, ...pairs]) {
      for (const ink of ["--ink", "--muted", "--blue"])
        assert(contrast(t[ink], onWash) >= 4.5, `${p} ${ink} on ${k}: ${contrast(t[ink], onWash).toFixed(2)}`);
    }
    assert(contrast(t["--on-action"], t["--action-bg"]) >= 4.5, `${p} action text`);
    assert(contrast(t["--blue"], t["--bg"]) >= 4.5, `${p} text accent`);
    assert(contrast(t["--blue"], t["--card"]) >= 4.5, `${p} text accent on cards`);
  });
}
