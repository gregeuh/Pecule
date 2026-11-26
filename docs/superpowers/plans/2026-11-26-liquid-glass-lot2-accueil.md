# Liquid Glass — lot 2 (accueil et ajout) : plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passer l’accueil et la feuille d’ajout au style des maquettes : disponible en tête avec la tirelire, comptes et blocs en verre, chiffres animés, tirelire qui réagit.

**Architecture:** Deux briques réutilisables — `AnimatedAmount` (défilement d’un montant, logique pure dans `lib/count-up.ts`) et `Piggy` (SVG, humeur et fête, logique pure dans `lib/piggy.ts`) — puis un composant `HomeHero` en tête de l’accueil. Le reste est du style dans `app/glass.css`, qui passe ses sélecteurs longs sous `:where()` (point mineur du lot 1).

**Tech Stack:** React 19, CSS, node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-25-liquid-glass-design.md` · maquettes « Pécule Liquid Glass » (écrans Accueil, Accueil jour de paie, Ajouter une dépense).

## Global Constraints

- Mêmes fonctions et mêmes données ; aucun calcul modifié (`overview`, `paydaySavings`, `tightPeriod` intacts).
- Montants masqués : aucun chiffre animé ni révélé, la tirelire ne fête rien.
- `prefers-reduced-motion` : montant affiché directement à sa valeur, tirelire immobile.
- Contraste 4,5:1 dans les cinq thèmes (axe 0 violation), cibles ≥ 44 px, montants jamais tronqués.
- Les suites CI (`viewport`, `reflow`, `editors`, `design`, `appearance`) restent vertes ; un test n’est modifié que si un libellé ou une structure change, jamais retiré.

## Review Focus

1. Lecteur d’écran pendant le défilement d’un montant : il doit entendre la valeur finale, pas une suite de nombres.
2. Changement de valeur pendant une animation (nouvelle opération enregistrée) : l’animation repart de la valeur affichée vers la nouvelle, sans saut.
3. Démonstration puis vrai budget chargé : la tirelire ne fête pas un « gain » qui n’est qu’un changement de budget.
4. Comptes avec couleurs personnalisées très claires : le texte des cartes reste lisible (règle existante `walletSurfaceStyles`).
5. Petit iPhone 320 px : héros, tirelire et montant à 7 chiffres tiennent sans débordement.

---

### Task 1: Montant animé

**Files:** Create `lib/count-up.ts`, `app/animated-amount.tsx`; Test `tests/count-up.test.mjs`

**Interfaces — Produces:**
- `countUpValue(from: number, to: number, progress: number): number` — easeOutCubic, centimes entiers, `progress` borné à [0, 1].
- `COUNT_UP_MS = 700`
- `AnimatedAmount({ cents, hidden, format }: { cents: number; hidden: boolean; format: (cents: number) => string })` : rend `<span class="animated-amount" aria-hidden="true">valeur courante</span><span class="sr-only">valeur finale</span>` ; au premier rendu et à chaque changement de `cents`, anime depuis la valeur affichée (0 au premier rendu) ; aucune animation si `hidden` ou réduction des animations.

- [ ] Test : `countUpValue(0, 10000, 0) === 0`, `(0, 10000, 1) === 10000`, `(0, 10000, .5) === 8750` (easeOutCubic), `(-500, 500, 2) === 500`, résultat toujours entier.
- [ ] RED → implémenter → GREEN → commit.

### Task 2: Tirelire

**Files:** Create `lib/piggy.ts`, `app/piggy.tsx`; Test `tests/piggy.test.mjs`; styles `app/glass.css`

**Interfaces — Produces:**
- `piggyMood(tone: "comfort" | "attention" | "negative" | null): "calm" | "worried"` (`null` = signal masqué → calm).
- `shouldCelebrate(previousSaved: number | null, saved: number, budgetKey: string, previousKey: string | null): boolean` — vrai seulement si même budget (`budgetKey` = nom + ids des objectifs) et épargne en hausse.
- `Piggy({ mood, savedCents, budgetKey, hidden, size })` : SVG de la maquette, `data-mood`, `data-celebrate` posé 1,2 s quand `shouldCelebrate` ; animation `piggy-hop` + pièce `piggy-coin` qui tombe ; sourcils et bouche inquiets en `worried` ; rien sous réduction des animations ou montants masqués.

- [ ] Tests : mood ; `shouldCelebrate(1000, 1500, "a", "a") === true`, `(1500, 1500, "a","a") === false`, `(1000, 1500, "b", "a") === false`, `(null, 1500, "a", null) === false`.
- [ ] RED → implémenter → GREEN → commit.

### Task 3: Héros de l’accueil

**Files:** Create `app/home-hero.tsx`; Modify `app/clarte-dashboard.tsx`, `app/wallet-accounts.tsx` (retirer la ligne « Disponible » de la liste, prop `available` supprimée ; `aria-label` de la liste → « Soldes et prévisions des comptes »), `tests/e2e/financial-editors.mjs` (nouveau nom de liste), `app/glass.css`

`HomeHero` (bouton plaque de verre, ouvre l’explication du calcul) : libellé « Ce qu’il vous reste jusqu’à la paie » (horizon paie avec paie connue) ou « Ce qu’il vous reste jusqu’au {date} », montant `AnimatedAmount` 34 px (iPhone) / 52 px (ordinateur), pastille « {x} € par jour · tout va bien | attention | négatif » colorée par le signal, `Piggy` à droite. Nom accessible : « {libellé} : {montant}, {x} € par jour. Comprendre le calcul ». Placé en premier dans `.wallet-home-accounts`.

- [ ] Vérification Playwright (hors dépôt) : le héros existe une fois, son texte final = `money(overview.available)`, `data-mood="worried"` quand le seuil de confort est relevé à 500 €, débordement nul à 320/390/1440.
- [ ] Suites CI vertes → commit.

### Task 4: Accueil en verre

**Files:** Modify `app/glass.css` (et `:where()` sur les sélecteurs longs du lot 1)

- Cartes de compte de la pile : verre teinté de la couleur du compte (dégradé de `--wallet-surface` existant vers transparence 70 %, reflet, coins 26 px), montant via `AnimatedAmount` (`app/wallet-accounts.tsx`).
- Liste des prévisions, vérification bancaire, résumé du mois, dernières opérations, ligne d’objectif (jauge qui se remplit à l’ouverture : `@keyframes gauge-fill` depuis 0), cartes `month-assist` : `.glass` ou recette verre ; « fin de période » en verre teinté `--caution-bg` / `--error-bg`.
- Onglets Aperçu / Activité / Prévisions : sélecteur en capsule de verre, bulle active (même style que la barre du bas).

- [ ] Captures 390 et 1440 dans les cinq thèmes ; axe 0 sur l’accueil dans chaque thème (ajouté à `tests/e2e/appearance.mjs`) ; suites CI vertes → commit.

### Task 5: Feuille d’ajout

**Files:** Modify `app/glass.css` (et `app/quick-operation-form.tsx` seulement si une classe manque)

- Sélecteur Dépense / Revenu / Virement en capsule de verre avec bulle ; montant centré en grand (Nunito 900, 44 px) ; aperçu du solde et champs en verre léger ; bouton « Enregistrer » en dégradé corail ; « Autre chose » en pastilles de verre.
- [ ] Captures et parcours `test:e2e:editors` vert → commit.

### Task 6: Tirelire branchée, documentation, PR

**Files:** Modify `app/budget-app.tsx` seulement si nécessaire ; `DESIGN.md` (entrée lot 2)

- [ ] Vérification Playwright : jour de paie (salaire saisi) → « Mettre 350 € de côté » → `data-celebrate` présent sur la tirelire puis retiré ; passage démo → aucun `data-celebrate` au chargement.
- [ ] `npm test`, typecheck, lint, check-theme, suites CI → PASS ; relecture indépendante de la branche ; PR avec captures avant/après.
