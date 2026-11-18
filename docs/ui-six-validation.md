# Affinement UI/UX — 30 octobre 2026

Périmètre : les six axes de docs/ui-six-brief.md. Branche de livraison : vercel-compatibility. Palette Atelier et propriétaires partagés conservés. Aucun changement de calcul, de schéma bancaire ou de dépendance.

## Vérifications locales

- `npm run build`, `npx tsc --noEmit`, `npm run lint` : réussis, aucun avertissement ESLint.
- `node --test tests/*.test.mjs` : 108 réussites.
- `node tests/e2e/ui-six.mjs`, Chromium puis WebKit : 320, 390, 600 et 1440 px, clair/sombre, seize scénarios réussis. Divulgation, annulation/application/réinitialisation des filtres, compteur, retrait de critères, recherche vide, formulaires, actions de récurrence, suppression annulée et limites horizontales. Axe WCAG A/AA : aucune violation détectée dans les états inspectés.
- `node tests/e2e/site-coherence.mjs` : huit scénarios réussis, mêmes largeurs et thèmes ; confidentialité, projection, formulaires optionnels et erreurs repliées.
- `node tests/e2e/audit-fixes.mjs` : quatre scénarios réussis ; brouillons, catégorie automatique/manuelle, préférences, totaux du mois et en-têtes.
- `PECULE_E2E_NO_SANDBOX=1 node tests/e2e/bank-tools.mjs` : quatre scénarios réussis ; imports historiques, rapprochement paginé, modification de lots et association/dissociation de virements.
- `node tests/e2e/mobile-navigation.mjs` : huit scénarios réussis ; dock directionnel, accès, focus et accueil compact.
- `node tests/e2e/mobile-sizing.mjs` : huit scénarios réussis ; 320, 390, 600, 740 px, clair/sombre, formulaires, longs libellés, montants et défilement.
- `node tests/e2e/menu-motion.mjs`, Chromium et WebKit : cinq scénarios réussis par moteur ; animations normales/réduites, interruptions, focus et brouillons.
- `node tests/e2e/mobile-sheet.mjs`, Chromium et WebKit : cinq scénarios réussis par moteur ; opacité mobile, sorties répétées et géométrie.
- `node tests/e2e/import-recovery.mjs` : deux scénarios réussis ; reprise de relevé, confirmation et annulation de lot.
- `node tests/e2e/mobile-viewport.mjs` : huit scénarios réussis ; limites de fenêtre, absence de mouvement horizontal et notifications. Le contrôle de taille vérifie au moins 16 px pour éviter le zoom iOS, et le parcours dédié vérifie les 32 px du montant.
- Audit statique strict du projet : zéro constat. `designmd lint DESIGN.md` : zéro erreur/avertissement. `git diff --check` : réussi.

Les tests navigateur utilisent exclusivement une démonstration isolée et vérifient l’absence de PUT serveur ; aucun budget personnel n’est utilisé. Les contrôles automatisés WebKit ne remplacent pas un essai sur un iPhone physique installé en PWA.

## Revue visuelle

Deux passes bornées, clair/sombre et mobile/ordinateur. Correction des métriques à 320 px et du double fond du sélecteur de logo et de la spécificité du champ montant (32 px, hauteur 74 px). Captures locales hors Git : outputs/ui-six/round-two et outputs/ui-six/review. Les captures de panneaux et d’ordinateur utilisent la taille de viewport ; une capture pleine page Chromium peut temporairement redimensionner le viewport et remonter la composition responsive.

Revue indépendante Impeccable : aucun défaut matériel bloquant dans les six axes. Documentation DESIGN.md/UX-CONTRACT.md mise à jour par une revue distincte. Inspirations et choix : docs/ui-six-brief.md.
