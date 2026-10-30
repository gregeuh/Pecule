# Accueil : soldes par compte — 30 octobre 2026

Demande utilisateur : voir le montant de chaque compte à la place du disponible principal, sur mobile et ordinateur. La section existante Mes comptes mène désormais la lecture ; le disponible est conservé dans les détails mobiles et la colonne secondaire ordinateur. Aucune donnée ou règle financière n’est modifiée. Calcul et actions canoniques : accountBalance, éditeur de compte partagé, confidentialité globale.

Vérifications locales :

- Build Next, TypeScript, ESLint : réussis.
- Tests unitaires : 108 réussites.
- `node tests/e2e/account-home.mjs` : six scénarios Chromium 320/390/1440 × clair/sombre ; quatre WebKit 390/1440 × clair/sombre. Soldes concordants avec la page Comptes, tous types de compte, compte espèces à zéro, opérations futures exclues, montant négatif important et nom long, masquage individuel/total, éditeur et retour du focus, limites horizontales, axe WCAG A/AA sans violation détectée.
- `node tests/e2e/mobile-navigation.mjs` : huit scénarios réussis.
- `PECULE_E2E_QUICK=1 node tests/e2e/ui-six.mjs` : quatre scénarios réussis.
- `node tests/e2e/available-signal.mjs` avec Chromium système : quatre scénarios réussis ; les trois signaux, contraste, masquage et couleurs forcées restent disponibles dans le nouveau placement.
- Audit statique strict et lint DESIGN : aucune erreur/alerte. `git diff --check` : réussi.

Deux passes visuelles bornées : correction de la largeur héritée des montants mobiles, puis confirmation mobile/ordinateur, clair/sombre. Captures hors Git : outputs/account-home/final. Les tests sont anonymes, sur démonstration isolée, et refusent tout PUT serveur. Aucun budget personnel utilisé ; WebKit automatisé ne constitue pas un essai physique de la PWA iPhone.
