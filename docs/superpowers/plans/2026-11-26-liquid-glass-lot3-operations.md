# Liquid Glass — lot 3 (opérations et recherche) : plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Passer l’écran Opérations, ses filtres et la recherche globale au style des maquettes, sans changer leurs fonctions.

**Architecture:** Styles dans `app/glass.css` ; une seule classe ajoutée au balisage (`date-block` sur l’enveloppe de chaque jour dans `app/transaction-selection.tsx`). Les titres de groupe de la recherche passent en minuscules (plus de capitales espacées).

**Spec:** `docs/superpowers/specs/2026-11-25-liquid-glass-design.md` · maquettes « Opérations » et « Recherche ».

## Global Constraints

- Fonctions, filtres, sélection multiple, imports et gestes de ligne inchangés.
- Contraste 4,5:1 dans les cinq thèmes (axe 0), cibles ≥ 44 px, montants jamais tronqués, au plus deux couches de flou superposées.
- Suites CI vertes (`viewport`, `reflow`, `editors`, `design`, `appearance`).

## Review Focus

1. Sélection multiple active : cases à cocher et lignes restent lisibles et alignées dans les plaques.
2. Gestes de ligne (glisser, appui long) : l’aperçu d’opération reste au-dessus du verre.
3. Liste longue (200 opérations) : pas de flou par ligne, une plaque par jour seulement.
4. Filtre actif + recherche : pastilles « Recherche : … » lisibles sur le fond coloré.
5. Ordinateur 1100–1440 px : la barre d’outils (recherche, Filtrer, imports) tient sur une ligne ou se replie proprement.

---

### Task 1: Écran Opérations
**Files:** `app/transaction-selection.tsx` (classe `date-block`), `app/glass.css`
- Résumé du mois (`.metric-strip`) en plaque de verre, chiffres Nunito 800.
- Carte des opérations transparente ; chaque jour (`.date-block`) en plaque de verre ; en-tête du jour en libellé discret ; lignes sans fond, séparées par un filet `--glass-tint`.
- Recherche en capsule de verre (rayon 99 px), « Filtrer » et actions d’import en pastilles de verre ; pastilles de filtres actifs en verre.
- [ ] Captures 390/1440 en Pêche et Nuit ; suites CI vertes ; commit.

### Task 2: Filtres et recherche globale
**Files:** `app/glass.css`
- Feuille de filtres : sélecteur Toutes / Dépenses / Revenus en capsule avec bulle (même recette que le type de la feuille d’ajout), contrôle du mois en verre léger.
- Recherche globale : champ en capsule de verre, chaque groupe de résultats en plaque de verre, titres de groupe en minuscules (13 px, 800, couleur secondaire).
- [ ] `tests/e2e/appearance.mjs` : axe sur Opérations dans les cinq thèmes ; captures ; suites CI vertes ; commit.

### Task 3: Documentation, relecture, PR
- [ ] Entrée DESIGN.md ; `npm test`, typecheck, lint, check-theme ; relecture indépendante ; PR avec captures avant/après.
