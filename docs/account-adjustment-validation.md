# Ajustement direct du solde — 30 octobre 2026

Demande : bouton pour ajuster le montant du compte directement. Propriétaires : AccountBalanceAdjustment et panneau/validation/brouillons/sauvegarde canoniques. La correction modifie la référence par la différence cible moins solde actuel ; aucune transaction artificielle ni modification de catégorie. L’effet sur les anciens soldes calculés est annoncé dans le formulaire.

Vérifications locales :

- Build Next, TypeScript, ESLint : réussis.
- `node --test tests/*.test.mjs` : 115 réussites, dont sept nouveaux cas de correction de référence, idempotence, limites, imports inclus dans le solde, opérations futures, récurrences et préservation des autres données.
- `node tests/e2e/account-adjustment.mjs` : six scénarios Chromium (320/390/1440, clair/sombre) et quatre WebKit (390/1440, clair/sombre). Parcours accueil/Comptes, formats français, négatif/zéro, erreurs associées/focus, annulation et reprise, effacement du brouillon, isolement par compte, confidentialité, revenus/dépenses et nombre d’opérations inchangés. Axe WCAG A/AA : aucune violation détectée sur le formulaire inspecté.
- `PECULE_E2E_QUICK=1 node tests/e2e/account-home.mjs` : quatre scénarios de non-régression réussis.
- Audit statique strict, lint DESIGN et `git diff --check` : aucune erreur/alerte.

Captures mobile/ordinateur, clair/sombre inspectées ensemble dans outputs/account-adjustment (hors Git). Tests anonymes en démonstration, absence de PUT serveur vérifiée. Aucun budget personnel utilisé. Les essais WebKit automatisés ne constituent pas un essai physique de la PWA iPhone.
