# Pécule sur Vercel

Base : gregeuh/Pecule, commit f847c100de083e116714cf5b74070709f7f975ef (source du 23 octobre).

La compilation est Next.js native : `npm ci`, `npm run build`. `vercel.json` configure les paramètres.

Variables serveur : DATABASE_URL (ou POSTGRES_URL), BETTER_AUTH_SECRET, BETTER_AUTH_URL en production seulement. Les valeurs restent exclusivement sur Vercel.

La connexion par e-mail/mot de passe utilise Better Auth. Elle remplace la connexion ChatGPT propre à Sites. Les tables dédiées sont initialisées au premier appel d’authentification ; aucune table existante n’est supprimée ou modifiée. Les nouveaux comptes ne donnent pas accès aux anciens budgets. Pas de transfert automatique des utilisateurs ni des données, ni de récupération de mot de passe par e-mail tant qu’aucun service d’envoi n’est configuré.

Les previews et la production utilisent des noms de tables et de cookies différents. Pour revenir à l’ancien site, promouvoir son déploiement conservé sur Vercel. Aucun secret n’est inclus dans les sources.

## Reconstruction des fonctions du 26 octobre

Les nouveaux composants reproduisent la référence publique à partir de la base Git : tableau de bord, thème, catalogue de 3 470 logos, reconnaissance des catégories, répartition 50/30/20 et parcours initial en cinq étapes. Les ressources publiques ont été copiées dans le dépôt ; aucun téléchargement depuis l’ancien déploiement n’est requis au fonctionnement. La feuille app/reference.css conserve la référence compilée publique.

Google est activé uniquement si GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont présents dans l’environnement. Les comptes et budgets de l’ancien déploiement restent séparés ; il ne s’agit pas d’une récupération de son code serveur ou de ses données.

## Vérifications de la reconstruction

Le 26 octobre : 22 tests de domaine réussis ; compilation Next.js et TypeScript réussies ; audit statique des contrats UI sans erreur. Dans la prévisualisation, le tableau de bord et le thème sombre ont été vérifiés sur ordinateur, ainsi que le revenu manuel 50/30/20, la validation d’une opération invalide, les suggestions de catégorie, la recherche et le choix d’un logo, et l’ajout d’une opération en démonstration. Les montants fictifs ont été recalculés sans lecture ni modification d’un budget personnel. Les contrôles iPhone, la connexion Google réelle et le parcours authentifié complet restent à vérifier.
