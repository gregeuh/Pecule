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

## Rappel après saisie — 10 novembre 2026

Le rappel automatique est ignoré après une nouvelle opération enregistrée avec succès pendant la journée civile Europe/Paris, même si sa date bancaire est passée ou future. Les virements et les imports ajoutant des opérations comptent aussi. La matérialisation de récurrences, les réglages, les modifications/suppressions seules, une saisie non enregistrée et une sauvegarde refusée pour conflit ne créent pas cette activité. La validation du bilan quotidien continue également de couper le rappel.

Une colonne serveur nullable `budgets.last_operation_at` est ajoutée de manière idempotente. Le timestamp est enregistré dans la même requête SQL que le budget accepté, en comparant les identifiants explicites aux opérations précédentes. Il ne provient pas du navigateur et ne modifie ni le payload exporté ni les calculs. Une suppression ultérieure conserve le signal d’activité. Les budgets antérieurs sans timestamp utilisent leurs opérations explicites datées du jour (hors historique inclus et récurrences), faute de disposer de leur heure de création passée.

Tous les appareils consultent ce signal commun. La réservation de l’envoi recontrôle le timestamp et la révision inspectée pour éviter une décision périmée par une sauvegarde concurrente. Le lendemain, le signal de la veille ne coupe plus le rappel. Les notifications de test demandées explicitement restent disponibles. Une notification déjà envoyée au service push avant l’enregistrement ne peut pas être annulée par cette condition.

Tests : `npm test` couvre la condition, le bilan, les anciens budgets et les frontières minuit Paris/horaire d’été. Les requêtes réelles de sauvegarde et de réservation sont vérifiées dans PostgreSQL embarqué, sans identifiants ni connexion à une base personnelle :

```sh
npm_config_cache=/workspace/.npm-cache npm install --prefix /tmp/pecule-reminder-sql --no-package-lock --ignore-scripts @electric-sql/pglite
PECULE_PGLITE_MODULE=/tmp/pecule-reminder-sql/node_modules/@electric-sql/pglite/dist/index.js node tests/e2e/reminder-activity-storage.mjs
```

Ce test couvre migration répétée, première sauvegarde, réglages, occurrences automatiques, saisie rétrodatée, imports, conflits/rejeu, suppression, isolation entre utilisateurs, appareils multiples, lendemain, déduplication et révision périmée. Aucun envoi push réel n’est déclenché.
