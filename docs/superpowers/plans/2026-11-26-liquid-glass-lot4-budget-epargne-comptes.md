# Liquid Glass — lot 4 (budget, épargne, comptes) : plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Passer Équilibre, Récurrences, Épargne et Comptes au style des maquettes, sans changer leurs fonctions.

**Architecture:** Styles dans `app/glass.css`, limités aux pages `.app-shell.page-plan|recurring|goals|accounts` ; jauges qui se remplissent à l’ouverture (`@keyframes gauge-fill`, déjà défini au lot 2).

**Spec:** `docs/superpowers/specs/2026-11-25-liquid-glass-design.md` · maquettes « Budget · Équilibre », « Budget · Récurrences », « Épargne », « Comptes ».

## Global Constraints
- Fonctions, gestes de carte et formulaires inchangés ; contraste 4,5:1 dans les cinq thèmes (axe 0), cibles ≥ 44 px, montants entiers, au plus deux couches de flou.
- Suites CI vertes (`viewport`, `reflow`, `editors`, `design`, `appearance`).

## Review Focus
1. Récurrence en pause ou terminée : l’état reste lisible sur le verre.
2. Objectif atteint (100 %) ou dépassé : jauge pleine sans débordement.
3. Compte supprimé / zéro compte : tuile « Ajouter un compte » cohérente.
4. Montants masqués : jauges et montants ne révèlent rien.
5. Ordinateur : grilles de cartes (comptes, objectifs, récurrences sur une ligne du lot 4 précédent) gardent leur alignement.

### Task 1: Cartes en verre et jauges
**Files:** `app/glass.css`
- `.card` des quatre pages → plaque de verre (recette commune) ; carte d’introduction de l’épargne en verre teinté lavande ; pastilles « reste à mettre de côté » et marges en verre teinté.
- Boutons secondaires de ces pages en pastilles de verre ; filtres de récurrences (Toutes, Actives, En pause, Terminées) en capsule avec bulle ; sélecteur Équilibre / Récurrences déjà en capsule (lot 4 de la revue) passé en verre.
- Jauges `.progress-track > span` et `.plan-meter` qui se remplissent à l’ouverture, coins ronds.
- [ ] Captures 390/1440 en Pêche et Nuit ; suites CI ; `appearance` étendu à Budget, Récurrences, Épargne, Comptes (axe dans les cinq thèmes) ; commit.

### Task 2: Documentation, relecture, PR
- [ ] Entrée DESIGN.md ; `npm test`, typecheck, lint, check-theme ; relecture indépendante ; PR avec captures avant/après.
