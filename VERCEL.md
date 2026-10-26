# Pécule sur Vercel

Base : gregeuh/Pecule, commit f847c100de083e116714cf5b74070709f7f975ef (source du 23 octobre).

La compilation est Next.js native : `npm ci`, `npm run build`. `vercel.json` configure les paramètres.

Variables serveur : DATABASE_URL (ou POSTGRES_URL), BETTER_AUTH_SECRET, BETTER_AUTH_URL en production seulement. Les valeurs restent exclusivement sur Vercel.

La connexion par e-mail/mot de passe utilise Better Auth. Elle remplace la connexion ChatGPT propre à Sites. Les tables dédiées sont initialisées au premier appel d’authentification ; aucune table existante n’est supprimée ou modifiée. Les nouveaux comptes ne donnent pas accès aux anciens budgets. Pas de transfert automatique des utilisateurs ni des données, ni de récupération de mot de passe par e-mail tant qu’aucun service d’envoi n’est configuré.

Les previews et la production utilisent des noms de tables et de cookies différents. Pour revenir à l’ancien site, promouvoir son déploiement conservé sur Vercel. Aucun secret n’est inclus dans les sources.
