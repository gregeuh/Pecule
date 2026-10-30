# Six améliorations de saisie quotidienne — 30 octobre 2026

Périmètre accepté : docs/daily-capture-brief.md. Monde Atelier et propriétaires financiers conservés. Les notifications demandent une activation volontaire par appareil ; aucune permission n’est demandée à l’ouverture du site.

## Vérifications

- `npm run build`, `npx tsc --noEmit`, `npm run lint` : réussis.
- `node --test tests/*.test.mjs` : 125 réussites. Nouveaux cas : compte préféré supprimé, modèle de favori, compatibilité des anciens budgets, signature de journée et invalidation, absence d’opération fictive, dates, conservation d’une journée ancienne, fuseau Paris/DST, allowlist push, pagination de 235 appareils (premiers ignorés) et garde de durée par lot.
- `node tests/e2e/daily-capture.mjs` : six scénarios Chromium 320/390/1440 × clair/sombre, quatre WebKit 390/1440 × clair/sombre ; favoris CRUD, reconnaissance/catégorie dépliable, compte/date, saisie continue et retour à la revue, modification, journée vide explicite, invalidation après ajout, correction guidée, confidentialité et axe WCAG A/AA sans violation détectée. Passe finale Chromium quatre scénarios après correction de cible tactile.
- Prévisualisation : mêmes quatre scénarios Chromium réussis et `capture-connected.mjs` réussi sur deux comptes QA réservés : persistance réelle du budget/revue/favori/compte, refus de permission, stockage/suppression réels des abonnements, isolation interutilisateur, cron authentifié qui ignore la journée vérifiée, refus des accès anonymes.
- Régressions : quatre scénarios d’ajustement du solde, quatre de brouillons/préférences, quatre d’outils bancaires (import, lots, rapprochement, virements), huit de dimensions (320/390/600/740), cinq de transitions par moteur Chromium/WebKit, et raccourci N sans interception dans un champ.
- Audit statique strict, lint DESIGN et `git diff --check` : aucun constat bloquant. Audit des dépendances de production : zéro vulnérabilité détectée.

## Frontières des preuves

Les tests anonymes refusent tout PUT serveur. Les essais connectés utilisent uniquement leurs comptes/budgets fictifs et des abonnements push factices supprimés après test ; aucun budget personnel n’est utilisé. Le branchement navigateur PushManager et l’affichage du succès de test sont simulés dans cette suite. L’authentification, la validation API, la base, les droits, la désactivation et la suppression sont réels. L’affichage d’une notification par iOS, application fermée, exige l’appareil et son autorisation : il n’est pas revendiqué par ces tests.

## Infrastructure et revue

VAPID et CRON_SECRET sont configurés dans les variables sécurisées Production/Preview, sans valeur dans Git ni les rapports. Les abonnements utilisent des tables distinctes par environnement, avec suppression en cascade du compte. Vercel Hobby autorise 100 jobs quotidiens : 24 cohortes UTC sont configurées, chacune une fois par jour ; seule la plage Paris choisie est traitée. Fenêtre horaire annoncée, passage été/hiver pris en compte, au maximum un rappel automatique réclamé par appareil/jour, aucun chiffre budgétaire dans le message.

Le parcours pagine tous les appareils et avance même quand la journée est déjà vérifiée. Il limite la concurrence à dix envois et vérifie sa durée avant chaque lot ; une interruption n’est pas présentée comme un succès. Les appels déjà réclamés ne sont pas renvoyés lors d’une reprise. La fonction respecte la durée maximale documentée de 300 secondes du plan Hobby.

Revue indépendante Impeccable : défaut de pagination corrigé, garde de durée par lot ajoutée, verdict final sans blocage. Documentation et comportements relus séparément. Captures/rapports hors Git dans outputs/daily-capture et outputs/capture-connected.

Sources vérifiées : https://vercel.com/docs/cron-jobs/usage-and-pricing ; https://vercel.com/docs/functions/limitations.
