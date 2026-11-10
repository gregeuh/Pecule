# Captures de référence Wallet

Ouvrir [la galerie](index.html) ou les PNG du dossier `screenshots`. Ces références sont versionnées pour être disponibles sur les deux PC ; ce ne sont pas des données personnelles.

Le scénario `tests/e2e/design-finish.mjs` fixe le 6 novembre 2026 et utilise uniquement la démonstration anonyme. Il couvre douze états à 390 et 1440 px, en clair et sombre : sept pages, recherche vide, saisie, import, connexion et récupération. Les dialogues sont capturés dans leur viewport, les pages mobiles en entier. Les contrôles de date natifs et les options de connexion peuvent varier avec le système et l’environnement. Les captures ne prouvent pas une exécution sur iPhone physique.

## Reproduire et revoir

1. Installer les dépendances, compiler avec `npm run build`, puis démarrer le serveur de référence isolé avec `npm run design:serve-fixture` (127.0.0.1:3002). Sa date serveur et navigateur est figée ; ne pas utiliser ce serveur pour une session personnelle. Le serveur normal sur 3001 et Vercel conservent leur horloge réelle.
2. Exécuter `npm run test:e2e:design`. Chromium doit être installé : `npx playwright install chromium` si nécessaire. Le scénario utilise `/usr/bin/chromium` lorsqu’il existe, sinon le navigateur Playwright ; `PECULE_CHROMIUM_EXECUTABLE` permet de choisir un autre chemin. WebKit est sélectionnable avec `PECULE_E2E_ENGINE=webkit` et les dépendances Playwright appropriées.
3. Comparer les captures de `outputs/design-finish` avec les références existantes. Vérifier notamment la cohérence des thèmes, le focus, les longueurs de texte, les états vides et les montants masqués.
4. Après revue, exécuter `npm run design:references`, puis versionner images et manifeste avec les changements visuels. Le script refuse une capture de revue ou un rapport incomplet/en échec.
5. `npm run design:references -- --check` vérifie l’intégrité des fichiers et l’empreinte des sources visuelles. Une empreinte différente demande une revue, pas une régénération aveugle.

Pour la variante mobile/ordinateur rapide : `PECULE_E2E_QUICK=1 npm run test:e2e:design`. Elle ne remplace pas la matrice complète requise pour réécrire les références. `PECULE_DESIGN_REVIEW=1` collecte les défauts avant correction, sans les considérer comme validés. Ne jamais capturer une session personnelle ni valider automatiquement de nouvelles références après un échec.

Pour vérifier une version réelle/publication sans figer son horloge : `PECULE_DESIGN_LIVE=1 PECULE_E2E_BASE_URL=https://pecule-budget.vercel.app PECULE_E2E_QUICK=1 npm run test:e2e:design`. Ces captures ne remplacent pas les références figées. Une date imposée uniquement au navigateur provoquerait une divergence d’hydratation lorsque la date du serveur change ; le serveur de référence distinct évite cela sans modifier le code de production.
