# Hygiène du dépôt

- Le paquet et les deux noms racine du lockfile deviennent `pecule-budget`, sans changer de dépendance.
- `npm test` lance l’ensemble des tests unitaires, dont les tests budgétaires d’origine ; `npm run test:budget` permet leur contrôle isolé. `npm run typecheck` lance `tsc --noEmit`.
- `.github/workflows/quality.yml` prépare Node 24, installe le lockfile, génère les types de routes Next, puis lance typecheck, lint et tous les tests. Le jeton du job est limité à la lecture du dépôt et n’est pas persisté par checkout. Aucun secret de production n’est requis, aucun déploiement n’est exécuté par ce workflow.
- `.npmrc` ne contient que des options npm publiques. Les fichiers vendor contrôlés sont les styles shadcn et leur licence, conservée. Aucun jeton ou clé privée n’a été détecté dans ces fichiers versionnés et la configuration de hosting ciblée par le brief.
- `.openai/hosting.json` contenait des identifiants d’environnement de l’ancienne cible Cloudflare/D1, pas un jeton. Il est désindexé de cette branche Vercel et ignoré localement ; le fichier local reste présent pour les outils d’environnement. La branche d’archive `main` n’est pas remplacée.
- Les fichiers .env, identifiants QA, état Vercel et sorties de tests ne sont pas versionnés.
- La version Vercel était déjà sauvegardée sur `vercel-compatibility` avant ce brief : aucun remplacement par la version Cloudflare n’a été effectué.

Les contrôles de confidentialité portent sur les fichiers actuels ciblés par le brief ; ils ne constituent pas une analyse exhaustive de l’historique Git. Les valeurs de configuration et identifiants ne sont pas imprimés dans le rapport de scan.
