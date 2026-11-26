# Liquid Glass — lot 5 (réglages, connexion, identité, hors connexion, finitions) : plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Terminer la refonte : Réglages et pages de connexion en verre, logo et identité (icônes, écran de démarrage) en Nunito corail, page hors connexion aux couleurs des thèmes, couleur de barre d’état par thème, synchronisation du thème entre fenêtres, petits correctifs reportés.

**Spec:** `docs/superpowers/specs/2026-11-25-liquid-glass-design.md` (lot 5 et limites connues).

## Global Constraints
- Contraste 4,5:1 (axe 0) dans les cinq thèmes, cibles ≥ 44 px ; suites CI vertes (`viewport`, `reflow`, `editors`, `design`, `appearance`) et `tests/launch-assets.test.mjs` (images régénérées, empreinte à jour).
- Aucune donnée ni fonction modifiée ; la page hors connexion garde son fonctionnement (file d’attente locale).

## Review Focus
1. Utilisateur hors connexion avec un thème Lavande ou Nuit : page lisible.
2. Icône de l’app déjà installée sur l’écran d’accueil : nouvelle icône servie (cache du service worker et du manifeste).
3. Deux fenêtres ouvertes : changer de thème dans l’une met l’autre à jour.
4. Barre d’état iPhone : couleur du thème choisi au chargement, et quand on change de thème.
5. Images de démarrage : clair = Pêche, sombre = Nuit, sans texte coupé en paysage.

### Task 1: Thème partout (barre d’état, fenêtres, tirelire)
**Files:** `lib/appearance.ts` (`paletteThemeColor(palette)`, bootstrap qui met à jour `meta[name=theme-color][media*=light]`), `app/theme-picker.tsx`, `app/glass-backdrop.tsx` (écoute `storage` sur `pecule-palette`), `app/piggy.tsx` (retirer `data-celebrate` au nettoyage) ; tests `tests/appearance.test.mjs`.
- [ ] Tests : `paletteThemeColor("lavande") === "#efeaff"`, `("rose") === "#fbeee3"` ; le bootstrap met à jour la balise ; RED → GREEN → commit.

### Task 2: Réglages et connexion
**Files:** `app/glass.css` (`.page-settings .card`, `.auth-shell .auth-card` en verre ; boutons secondaires en pastilles).
- [ ] axe sur Réglages déjà couvert par `appearance` ; e2e `design` (connexion, mot de passe oublié) vert ; captures ; commit.

### Task 3: Identité (logo, icônes, écran de démarrage)
**Files:** `app/theme.css` (`--font-brand: Nunito`), `app/launch-screen.tsx`, `app/launch.css`, `scripts/generate-launch-assets.mjs` (police Nunito, sources), `public/launch/*` régénérés, `public/icons/*` et `public/favicon.svg` (marque corail), script `scripts/generate-icons.mjs`.
- [ ] `node --test tests/launch-assets.test.mjs` vert après régénération ; captures de l’écran de démarrage clair/sombre ; commit.

### Task 4: Page hors connexion
**Files:** `public/offline.css` (Nunito, couleurs Pêche / Nuit, fonds des autres palettes via `data-palette`), `public/sw.js` et `scripts/build-offline.mjs` (police Nunito en cache).
- [ ] Captures de `/offline.html` clair, Lavande et sombre ; `npm test` ; commit.

### Task 5: Documentation, relecture, PR, fusion
- [ ] DESIGN.md et docs/design-system.md (direction finale, propriétaires) ; relecture indépendante ; PR ; CI verte ; fusion (autorisée par le propriétaire).
