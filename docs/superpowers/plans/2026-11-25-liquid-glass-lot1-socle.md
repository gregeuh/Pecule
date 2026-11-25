# Liquid Glass — lot 1 (socle) : plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le socle du style « Liquid Glass chaleureux » : cinq palettes + Automatique choisies dans Réglages, fond coloré animé, matière verre, barre du bas en capsule, boutons d’en-tête et feuilles en verre, police Nunito.

**Architecture:** `next-themes` garde le **mode** (`light` / `dark` / `system`, clé `pecule-theme`, attribut `data-theme`), ce qui préserve toutes les règles `[data-theme=dark]` existantes. Une **palette claire** (`peche` | `lavande` | `menthe` | `ocean`) est stockée à part (`pecule-palette`) et posée en `data-palette` sur `<html>` avant le premier rendu ; Nuit = mode sombre. Les jetons vivent dans `app/theme.css` ; la matière verre dans une nouvelle feuille propriétaire `app/glass.css`, importée en dernier.

**Tech Stack:** Next.js 16, React 19, next-themes, CSS, postcss (tests), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-11-25-liquid-glass-design.md` · maquettes : artefact « Pécule Liquid Glass ».

## Global Constraints

- Mêmes écrans, mêmes fonctions, même navigation ; aucun calcul ni donnée modifiés.
- Contraste ≥ 4,5:1 pour tout texte (ink et muted) sur le fond, sur le verre de repli et sur le pire cas « verre au-dessus de la tache la plus sombre » ; texte des boutons d’action ≥ 4,5:1.
- `prefers-reduced-motion: reduce` : aucune dérive du fond, pas de rebond, pas d’écrasement à l’appui (fondus seulement).
- `prefers-reduced-transparency: reduce` et absence de `backdrop-filter` : verre remplacé par `--glass-solid` opaque.
- Pas plus de **2 couches de flou superposées** à l’écran (fond non flouté par `backdrop-filter` : les taches sont floutées par `filter`, une seule fois).
- Textes ≥ 12 px, cibles ≥ 44 px, montants en chiffres tabulaires jamais tronqués ; axe 0 violation.
- `app/theme.css` reste seul propriétaire des variables globales (`scripts/check-theme.mjs`) ; DESIGN.md mis à jour, jamais le contrôle affaibli.
- Les quatre suites e2e de la CI restent vertes : `test:e2e:viewport`, `test:e2e:reflow`, `test:e2e:editors`, `PECULE_DESIGN_LIVE=1 PECULE_E2E_QUICK=1 test:e2e:design`.

## Review Focus

1. Utilisateur actuel en « Sombre » ou « Clair » (`pecule-theme` = `dark` / `light`) : il retrouve Nuit / Pêche sans rien faire, sans flash au chargement.
2. Page hors connexion (`public/offline.html`, `lib/offline-page.ts`) : elle lit `pecule-theme` ; elle doit rester lisible quelle que soit la palette (pas de `data-palette` là-bas → Pêche par défaut).
3. Montants masqués et écrans de saisie au-dessus du verre : le texte reste lisible quand une tache claire passe sous un texte clair en Nuit.
4. iPhone ancien / mode économie : `backdrop-filter` coûteux → repli opaque doit s’appliquer via `prefers-reduced-transparency`, et la dérive du fond se met en pause quand la page est cachée.
5. « Automatique » quand l’iPhone bascule clair ↔ sombre pendant l’utilisation : la palette claire choisie revient le jour.

---

### Task 0: Valider et intégrer le lot de ménage

**Files:** branche `lot-menage` (déjà poussée) ; script local `/tmp/claude-0/e2e/pixels.mjs` (hors dépôt).

- [ ] **Step 1:** Construire `main` (worktree `/var/tmp/pecule-main`, port 3002) et `lot-menage` (port 3001), sans `DATABASE_URL`, horloge figée au 2026-11-25 10:00.
- [ ] **Step 2:** Capturer en PNG les 11 états (accueil ×3 onglets, opérations, comptes, budget, récurrences, épargne, réglages, saisie, recherche) × (390 clair, 390 sombre, 900 clair, 1440 clair, 1440 sombre) sur les deux versions et comparer pixel à pixel.
  Expected: 0 pixel différent sur les 55 paires. Toute différence est expliquée ou corrigée avant de continuer.
- [ ] **Step 3:** Créer la branche `glass-lot1` depuis `lot-menage`.

### Task 1: Modèle d’apparence

**Files:**
- Create: `lib/appearance.ts`
- Test: `tests/appearance.test.mjs`

**Interfaces:**
- Produces:
  - `type LightPalette = "peche" | "lavande" | "menthe" | "ocean"`
  - `type AppearanceChoice = LightPalette | "nuit" | "auto"`
  - `const PALETTE_KEY = "pecule-palette"`, `const MODE_KEY = "pecule-theme"`
  - `const appearanceChoices: { id: AppearanceChoice; label: string; swatch: [string, string, string] }[]` (ordre : Pêche, Lavande, Menthe, Océan, Nuit, Automatique)
  - `choiceToStorage(choice: AppearanceChoice, currentPalette: LightPalette): { mode: "light" | "dark" | "system"; palette: LightPalette }`
  - `storageToChoice(mode: string | null, palette: string | null): AppearanceChoice`
  - `readPalette(value: string | null): LightPalette` (inconnu → `"peche"`)
  - `paletteBootstrap: string` (script en ligne : lit `pecule-palette` dans un try/catch et pose `document.documentElement.dataset.palette`)

- [ ] **Step 1: Write the failing tests**

```js
test("legacy light and dark map to Pêche and Nuit", () => {
  assert.equal(storageToChoice("light", null), "peche");
  assert.equal(storageToChoice("dark", null), "nuit");
  assert.equal(storageToChoice("system", "menthe"), "auto");
  assert.equal(storageToChoice(null, null), "auto");
});
test("a light palette sets light mode, Nuit sets dark, auto keeps the palette", () => {
  assert.deepEqual(choiceToStorage("lavande", "peche"), { mode: "light", palette: "lavande" });
  assert.deepEqual(choiceToStorage("nuit", "ocean"), { mode: "dark", palette: "ocean" });
  assert.deepEqual(choiceToStorage("auto", "menthe"), { mode: "system", palette: "menthe" });
});
test("unknown palettes fall back to Pêche; choices are listed in order", () => {
  assert.equal(readPalette("rose"), "peche");
  assert.deepEqual(appearanceChoices.map((c) => c.label), ["Pêche", "Lavande", "Menthe", "Océan", "Nuit", "Automatique"]);
});
test("the bootstrap never throws without storage", () => {
  assert.doesNotThrow(() => new Function("document", "localStorage", paletteBootstrap)({ documentElement: { dataset: {} } }, undefined));
});
```

- [ ] **Step 2:** `node --test tests/appearance.test.mjs` → FAIL (module absent).
- [ ] **Step 3:** Implémenter `lib/appearance.ts` (imports avec suffixe `.ts` comme les autres modules de `lib`). Les pastilles `swatch` reprennent les trois couleurs de taches de chaque palette (Task 2).
- [ ] **Step 4:** `node --test tests/appearance.test.mjs` → PASS.
- [ ] **Step 5:** Commit `Liquid Glass: appearance model (palettes, Nuit, Automatique)`.

### Task 2: Jetons des palettes et contrastes

**Files:**
- Modify: `app/theme.css`, `DESIGN.md` (bloc `colors:` et section Couleur), `scripts/check-theme.mjs` (si la carte des noms change)
- Test: `tests/theme-contrast.test.mjs`

**Interfaces:**
- Produces (variables CSS, toutes définies sur `:root` = Pêche, puis `:root[data-palette=lavande|menthe|ocean]:not([data-theme=dark])`, puis `:root[data-theme=dark]` = Nuit) :
  `--bg --ink --muted --wash-1 --wash-2 --wash-3 --glass-a --glass-b --glass-edge --glass-spec --glass-shadow --glass-tint --glass-solid --action-bg --action-from --action-to --on-action --blue` (accent de texte), plus les existants inchangés de sens.

Valeurs à poser (décision de ce plan) :

| Palette | --bg | --ink | --muted | wash 1 / 2 / 3 | --action-bg (from → to) | --on-action |
|---|---|---|---|---|---|---|
| Pêche | #fbeee3 | #2b2320 | #6a554b | #ff9d7e / #ffd0a6 / #d6c4ff | #c4532d (#e47a55 → #c4532d) | #ffffff |
| Lavande | #efeaff | #231f33 | #5a5173 | #b8a4ff / #ffc0a4 / #a9d6ff | #c4532d | #ffffff |
| Menthe | #e8f5ef | #17302a | #47635a | #8fdcc0 / #a9d6ff / #ffe1a8 | #c4532d | #ffffff |
| Océan | #dbe7f3 | #0f2131 | #405a73 | #5aa9e6 / #7fe0d6 / #6f8fe0 | #c4532d | #ffffff |
| Nuit | #1a1216 | #f6ece6 | #c3aea4 | #a0412c / #5a3a8e / #c06a2e | #f0936f (#f6a587 → #e9805f) | #2b130b |

Verre clair : `--glass-a: .62; --glass-b: .34; --glass-edge: rgba(255,255,255,.75); --glass-spec: rgba(255,255,255,.7); --glass-tint: rgba(255,255,255,.5)`. Verre Nuit : `.16 / .06 / rgba(255,255,255,.22) / rgba(255,255,255,.22) / rgba(255,255,255,.1)`. `--glass-solid` = mélange opaque de blanc à 55 % avec `--bg` (clair) ou `#2a1f24` (Nuit). `--blue` = `#a8431f` clair, `#ffb08f` Nuit.

- [ ] **Step 1: Write the failing test** — `tests/theme-contrast.test.mjs` lit `app/theme.css` avec postcss, résout les variables de chaque palette, et vérifie :

```js
for (const p of ["peche", "lavande", "menthe", "ocean", "nuit"]) {
  const t = tokens(p);
  const glassWorst = mix(darkest(t), p === "nuit" ? "#000000" : "#ffffff", glassAlpha(p));
  for (const surface of [t["--bg"], t["--glass-solid"], glassWorst]) {
    assert(contrast(t["--ink"], surface) >= 4.5, `${p} ink on ${surface}`);
    assert(contrast(t["--muted"], surface) >= 4.5, `${p} muted on ${surface}`);
  }
  assert(contrast(t["--on-action"], t["--action-bg"]) >= 4.5, `${p} action text`);
  assert(contrast(t["--blue"], t["--bg"]) >= 4.5, `${p} text accent`);
}
```
(`glassAlpha` = moyenne de `--glass-a` et `--glass-b` ; `darkest` = la tache de plus faible luminance ; `contrast` = formule WCAG 2.1.)

- [ ] **Step 2:** `node --test tests/theme-contrast.test.mjs` → FAIL.
- [ ] **Step 3:** Poser les jetons dans `app/theme.css` ; ajuster une valeur de `--muted` seulement si le test l’exige (en assombrissant, jamais en éclaircissant le fond).
- [ ] **Step 4:** Test → PASS ; `node scripts/check-theme.mjs` → PASS après mise à jour du bloc `colors:` de DESIGN.md (`background: "#fbeee3"`, `primary: "#c4532d"`, `text-accent: "#a8431f"`, etc.).
- [ ] **Step 5:** Commit `Liquid Glass: palette tokens with contrast tests`.

### Task 3: Police Nunito

**Files:**
- Create: `public/fonts/nunito-latin.woff2` (Nunito variable 200–1000, sous-ensemble latin, depuis le paquet npm `@fontsource-variable/nunito` : fichier `nunito-latin-wght-normal.woff2`, licence OFL copiée en `public/fonts/nunito-OFL.txt`)
- Modify: `app/theme.css` (`@font-face`, `--font-body`, `--font-display`, `--font-brand` → `Nunito`), `app/layout.tsx` (préchargement de la police), `scripts/build-offline.mjs` et `public/sw.js` (liste des ressources hors ligne), `docs/font-assets.md`

- [ ] **Step 1:** Vérifier que le fichier contient U+202F et les accents français : `python3 -c "from fontTools.ttLib import TTFont;c=TTFont('public/fonts/nunito-latin.woff2').getBestCmap();print(all(x in c for x in [0x202F,0xE9,0xE8,0xEA,0xE0,0xE7,0x2019,0x20AC]))"` → `True`. Sinon, garder la règle `unicode-range: U+202F` servie par Inter comme pour DM Sans.
- [ ] **Step 2:** Déclarer la police, remplacer les trois familles, précharger `/fonts/nunito-latin.woff2`, ajouter le fichier aux ressources hors ligne ; `npm run build` puis `node scripts/build-offline.mjs` → la version hors ligne change.
- [ ] **Step 3:** `npm test` → PASS (dont `launch-assets` et `parity`).
- [ ] **Step 4:** Commit `Liquid Glass: Nunito as the single typeface`.

### Task 4: Fond coloré animé

**Files:**
- Create: `app/glass-backdrop.tsx`, `app/glass.css` (importée en dernier dans `app/layout.tsx`)
- Modify: `app/budget-app.tsx` (rendre `<GlassBackdrop />` une fois, premier enfant de `.app-shell`), pages d’authentification si elles ont leur propre coquille (`app/sign-in`, `app/forgot-password`, `app/reset-password`)

**Interfaces:**
- Produces: `export default function GlassBackdrop(): JSX.Element` → `<div className="glass-backdrop" aria-hidden="true"><i /><i /><i /></div>`

- [ ] **Step 1:** CSS : `.glass-backdrop` fixe, `inset: 0`, `z-index: -1`, fond `var(--bg)`, trois taches `--wash-1..3` floutées par `filter: blur(60px)` (pas de `backdrop-filter`), positions des maquettes ; `@keyframes glass-drift` (translation ≤ 8 vw, durées 38 s / 46 s / 54 s, `alternate`, `ease-in-out`) ; `animation: none` sous `prefers-reduced-motion` ; `body { background: var(--bg) }` reste pour le repli.
- [ ] **Step 2:** Pause quand la page est cachée : `visibilitychange` pose `data-paused` sur `.glass-backdrop` → `animation-play-state: paused`.
- [ ] **Step 3:** Vérification Playwright locale (script hors dépôt) : à 390 px et 1440 px, `.glass-backdrop` existe une seule fois, son `animation-name` vaut `glass-drift` sans réduction et `none` avec `reducedMotion: "reduce"`.
- [ ] **Step 4:** Commit `Liquid Glass: drifting colour wash behind the app`.

### Task 5: Matière verre, barre du bas, en-tête, feuilles

**Files:**
- Modify: `app/glass.css`, `app/motion.css` (nouvelle courbe `--motion-spring-out: cubic-bezier(.34, 1.36, .64, 1)`), `docs/design-system.md` (tableau des propriétaires : `app/glass.css` = matière verre)

Sélecteurs à habiller (décision de ce plan ; les cartes de contenu viennent aux lots 2 à 5) :
- `.glass` (classe réutilisable des lots suivants) ;
- barre du bas : `.mobile-dock .mobile-nav.floating-nav` = capsule de verre ; `.navigation-indicator` = bulle (fond `rgba(255,255,255,.7)` clair, `.16` Nuit, ombre douce) ; l’onglet actif prend `--blue` ; le bouton `+` (`.mobile-add`) = cercle de verre contenant un disque `--action-from → --action-to` ;
- en-tête : `.topbar .icon-button`, `.clarte-header-actions .icon-button` = cercles de verre 40 px (zone tactile 44 px) ;
- fenêtres : `.modal` = feuille de verre (coins 32 px sur iPhone) ; `.modal-shade` assombrit de 18 % (clair) / 35 % (Nuit) ;
- ordinateur : `.sidebar` = plaque de verre décollée des bords (marge 12 px), élément actif en bulle ;
- appui : `.glass:active, .icon-button:active, .mobile-add:active, .floating-nav button:active` → `transform: scale(.96)` en `--motion-press` ; ouverture des fenêtres avec `--motion-spring-out`.

Recette du verre : `background: linear-gradient(160deg, rgba(255,255,255,var(--glass-a)), rgba(255,255,255,var(--glass-b))); backdrop-filter: blur(18px) saturate(170%); box-shadow: inset 0 1px 1px var(--glass-edge), inset 0 -1px 1px rgba(255,255,255,.18), 0 10px 26px var(--glass-shadow);` reflet `::before` en `radial-gradient(120% 70% at 12% -10%, var(--glass-spec), transparent 52%)`. Repli : `@supports not (backdrop-filter: blur(1px))` et `@media (prefers-reduced-transparency: reduce)` → `background: var(--glass-solid); backdrop-filter: none`.

- [ ] **Step 1:** Écrire les règles. Aucune règle `:root{...}` dans `glass.css` (propriété de `theme.css`).
- [ ] **Step 2:** `npm run build`, serveur local port 3001 ; vérification Playwright (hors dépôt) dans les 5 palettes à 390 et 1440 : la capsule, la bulle, le `+`, les boutons d’en-tête et une fenêtre ouverte ont `backdrop-filter` ≠ `none` ; le CSS compilé (`.next/static/css`) contient la media query `prefers-reduced-transparency` et la règle `@supports not (backdrop-filter` ; aucune cible < 44 px.
- [ ] **Step 3:** Les quatre suites e2e de la CI → PASS (adapter uniquement des sélecteurs si le DOM a changé ; aucun test retiré).
- [ ] **Step 4:** Commit `Liquid Glass: glass dock, header buttons, sheets and sidebar`.

### Task 6: Thèmes dans Réglages

**Files:**
- Modify: `app/theme-picker.tsx`, `app/theme-provider.tsx`, `app/layout.tsx` (script `paletteBootstrap` en ligne, juste après `launchBootstrap`), `app/glass.css` (styles du sélecteur), `lib/offline-page.ts` (lire `pecule-palette` et poser `data-palette`)
- Test: `tests/e2e/appearance.mjs` (nouveau, ajouté à la CI dans `.github/workflows/quality.yml` après `test:e2e:design`, script npm `test:e2e:appearance`)

**Interfaces:**
- Consumes: `appearanceChoices`, `choiceToStorage`, `storageToChoice`, `readPalette`, `PALETTE_KEY`, `paletteBootstrap` (Task 1).

UI : titre « Thème », un groupe radio (`role="radiogroup"`, `aria-label="Thème"`) de six tuiles 2×3 (iPhone) / 6 en ligne (ordinateur) : mini-aperçu (fond + deux taches + une capsule de verre), nom dessous, coche sur le choix courant ; sous le groupe : « Automatique suit l’iPhone : votre dernier thème clair le jour, Nuit le soir. Ce choix s’applique à cet appareil. » Choisir une tuile applique tout de suite (`setTheme(mode)`, `localStorage[PALETTE_KEY]`, `dataset.palette`) et appelle `onSaved`.

- [ ] **Step 1: Write the failing e2e** `tests/e2e/appearance.mjs` (même structure que `tests/e2e/financial-editors.mjs`, `origin` 127.0.0.1:3001) :

```js
// 390 et 1440 px
await page.goto(origin); // stockage vide
assert.equal(await html("data-palette"), "peche");
await openSettings(); await page.getByRole("radio", { name: "Lavande" }).check();
assert.equal(await html("data-palette"), "lavande"); assert.equal(await html("data-theme"), "light");
await page.reload(); assert.equal(await html("data-palette"), "lavande");
await page.getByRole("radio", { name: "Nuit" }).check(); assert.equal(await html("data-theme"), "dark");
await page.emulateMedia({ colorScheme: "dark" }); await page.getByRole("radio", { name: "Automatique" }).check();
assert.equal(await html("data-theme"), "dark");
await page.emulateMedia({ colorScheme: "light" }); assert.equal(await html("data-theme"), "light"); assert.equal(await html("data-palette"), "lavande");
// ancien utilisateur
await context.addInitScript(() => localStorage.setItem("pecule-theme", "dark")); // nouveau contexte
assert.equal(await checkedRadioName(), "Nuit");
assert.equal(axeViolations, 0);
```

- [ ] **Step 2:** Lancer → FAIL.
- [ ] **Step 3:** Implémenter le sélecteur et le script de démarrage.
- [ ] **Step 4:** `npm run -s test:e2e:appearance` → PASS ; les quatre suites CI → PASS.
- [ ] **Step 5:** Commit `Liquid Glass: theme picker with five palettes and Automatique`.

### Task 7: Couleurs système, documentation, PR

**Files:**
- Modify: `app/layout.tsx` (`themeColor` : clair `#fbeee3`, sombre `#1a1216`), `public/manifest.webmanifest` (`background_color` et `theme_color` `#fbeee3`), `DESIGN.md` (entrée « Liquid Glass, lot 1 — socle »), `docs/design-system.md` (direction : « Liquid Glass chaleureux » remplace « Revolut et Apple Wallet » ; tableau Couleur et typographie)

- [ ] **Step 1:** Mettre à jour ces fichiers ; `node scripts/check-theme.mjs` → PASS ; `npm run typecheck && npm run lint && npm test` → PASS.
- [ ] **Step 2:** Captures avant/après (main vs branche) : accueil, opérations, réglages (sélecteur), une fenêtre ouverte, en Pêche, Lavande, Menthe, Océan, Nuit, iPhone 390 et ordinateur 1440 ; relecture visuelle : aucun texte illisible, aucun chevauchement.
- [ ] **Step 3:** Push `glass-lot1`, PR « Liquid Glass, lot 1 : socle (thèmes, fond, verre, barre du bas, police) » ; attendre la CI ; envoyer les captures ; demander l’accord avant fusion.
