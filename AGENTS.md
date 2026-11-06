# Pécule : cible de livraison

- L’utilisateur demande un déploiement Vercel après chaque modification livrée. Après les vérifications, procéder au déploiement sans redemander une confirmation de routine.
- Projet : `gregeuhs-projects/pecule-budget`, site `https://pecule-budget.vercel.app/`.
- La branche `vercel-compatibility` contient l’application Next.js, Better Auth et PostgreSQL/Neon compatible avec ce site. Préserver ses fonctionnalités et ses données ; ne pas la remplacer par la sauvegarde Sites/Cloudflare de `main`.
- Utiliser le checkout existant approprié et préserver tout travail local. Vérifier les nouvelles modifications distantes avant de pousser ; ne jamais forcer une mise à jour de branche.
- Si la CLI Vercel n’est pas authentifiée, utiliser l’intégration GitHub/Vercel existante lorsqu’elle peut déployer la branche. Suivre le statut du commit et vérifier le site de production ; une compilation locale ou un push ne suffit pas à déclarer la publication réussie.
- Ne pas imprimer les secrets, modifier les variables de production sans nécessité, ni toucher aux budgets personnels pour les tests. Les identifiants restent dans les paramètres sécurisés du service.
- La CLI Vercel de cette machine utilise `XDG_DATA_HOME=/workspace/.vercel-cli-data VERCEL_TELEMETRY_DISABLED=1` ; vérifier sa connexion avec `vercel whoami` sans lire son fichier d’authentification.
- Les prévisualisations ont des paramètres d’authentification et des tables distincts. Pour publier une version validée, utiliser `vercel redeploy <url-du-deploiement-valide> --environment production --scope gregeuhs-projects`, puis contrôler l’état Ready et l’alias `pecule-budget.vercel.app`. Une simple promotion de preview ne remplace pas cette reconstruction avec les paramètres de production.
- Le parcours connecté peut être vérifié par `npm run test:e2e:connected` selon `tests/e2e/README.md`. Il crée/réutilise uniquement des comptes fictifs avec opt-in explicite ; les identifiants générés ne doivent jamais être affichés ou versionnés. Le consentement Google réel reste distinct de l’ouverture de son fournisseur.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
