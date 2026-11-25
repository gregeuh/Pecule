# Pécule

Application personnelle de gestion de budget en français, pensée pour iPhone et ordinateur. La branche `main` est la version déployée en production sur Vercel : Next.js, Better Auth et PostgreSQL (Neon). Voir [VERCEL.md](VERCEL.md) pour la livraison et [REPRISE.md](REPRISE.md) pour l'historique de la base Sites/Cloudflare dont elle est issue.

## Fonctionnement

- Connexion par e-mail et mot de passe (12 caractères minimum), ou Google si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis. L'identité vient toujours de la session vérifiée côté serveur ; l'API n'accepte aucune identité envoyée par le client.
- Chaque compte possède son propre budget, enregistré en PostgreSQL (une ligne JSON par utilisateur, révision incluse). Le stockage local du navigateur ne sert qu'aux préférences de l'appareil et à la file hors ligne.
- La révision protège contre l'écrasement par une autre session : en cas de conflit l'API répond 409 et le client propose une fusion.
- Une fois connecté, téléchargez votre sauvegarde JSON depuis Réglages → Données. Le fichier de `/api/budget/export` contient la dernière version enregistrée sur le serveur et peut être restauré dans Pécule.
- La démonstration est calculée en mémoire et n'est jamais enregistrée.
- Les montants sont stockés en centimes entiers. Les virements produisent deux écritures liées et ne comptent ni comme revenus ni comme dépenses.
- Le disponible correspond aux soldes courants et espèces, moins les dépenses planifiées avant la prochaine paie (ou la fin du mois), moins les réserves d'épargne restantes. Les revenus futurs et les soldes d'épargne sont exclus.
- Le calendrier France inclut les onze jours fériés nationaux ; ni les spécificités régionales ni les calendriers employeur. Un calendrier sans jours fériés ou une date fixe restent possibles.
- Les récurrences sont matérialisées à la date prévue, après la date du solde de référence ; l'utilisateur rapproche les montants du relevé bancaire.
- L'import CSV propose aperçu, association des colonnes, validations et détection des doublons exacts. Aucune connexion bancaire automatique.
- Rappels quotidiens par notification Web Push (cron Vercel, un appel par heure UTC).

## PWA

Manifest, icônes, service worker et page hors connexion sont fournis. Le service worker ne met jamais en cache les pages personnelles ni les réponses API. Hors connexion, les saisies passent par une file locale rejouée au retour du réseau.

## Variables d'environnement (serveur)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` (ou `POSTGRES_URL`) | Base PostgreSQL. Avec Neon, utiliser l'URL « pooled ». |
| `BETTER_AUTH_SECRET` | Secret de signature des sessions. |
| `BETTER_AUTH_URL` | URL publique, en production seulement. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Connexion Google (optionnel). |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | Réinitialisation de mot de passe par e-mail (optionnel). |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` | Rappels Web Push et sécurisation des crons. |

Les valeurs restent exclusivement dans les paramètres Vercel ; ne jamais les versionner.

## Développement et vérification

- `npm ci` puis `npm run dev`
- `npx next typegen && npm run typecheck`
- `npm run lint`
- `npm test` (tests de domaine, sans base de données)
- `npm run build`
- `npm run format:check` : vérifie le formatage Prettier (`npm run format` pour l'appliquer)
- Tests d'interface : scripts `test:e2e:*` (Playwright), voir `tests/e2e/README.md`.

La CI (`.github/workflows/quality.yml`) s'exécute sur chaque push et pull request vers `main` : typage, lint, tests unitaires et un sous-ensemble des tests d'interface sur un build de production.
