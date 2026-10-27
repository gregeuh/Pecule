# Vérification du parcours connecté

Ce test utilise les vrais formulaires et l’API du déploiement choisi. Il crée deux comptes réservés aux essais avec des adresses sous `pecule.example.invalid` et des mots de passe aléatoires. Il n’utilise aucune identité Google ou donnée bancaire personnelle.

```sh
npm ci
npx playwright install chromium
PECULE_E2E_BASE_URL=https://pecule-budget.vercel.app \
PECULE_E2E_ALLOW_ACCOUNT_CREATION=1 npm run test:e2e:connected
```

L’opt-in explicite est obligatoire : le test écrit dans de vrais comptes dédiés. Les identifiants restent dans `.sites-runtime/p1-connected/<hôte>/accounts.json`, fichier local ignoré par Git et créé avec les permissions `0600`. Ne jamais le publier ni le copier dans les journaux. Les exécutions suivantes réutilisent uniquement ces comptes et refusent de réinitialiser un budget dont le nom ne correspond pas à la fixture. Les comptes et leur budget fictif sont conservés pour permettre la reproduction ; les sessions de test sont déconnectées après réussite.

Le rapport sans secrets est écrit dans `outputs/p1-connected/report.json`. Les contrôles couvrent : accès anonyme refusé, création de compte, cookies de session sécurisés, budget initial sans démonstration, import réel et conservation des métadonnées, solde, rechargement, déconnexion, mauvais mot de passe, seconde session mobile et isolation de deux utilisateurs. Une réexécution sur des comptes existants indique une reconnexion plutôt qu’une nouvelle inscription.

Le bouton Google est exercé jusqu’à l’ouverture du fournisseur ; l’URL de retour, l’état et les scopes sont vérifiés sans enregistrer leurs valeurs. **Ce contrôle ne valide pas le consentement Google, son callback réel ni le rattachement à un compte existant.** Pour ces étapes, ouvrir une fenêtre privée, se connecter volontairement via Google et vérifier le retour au budget attendu.

Pour un Chromium déjà installé, définir `PECULE_E2E_CHROMIUM=/chemin/vers/chromium`. Dans un conteneur qui l’exige, `PECULE_E2E_NO_SANDBOX=1` adapte uniquement le sandbox du navigateur.

Si le proxy TLS du cloud est approuvé par Node mais absent du magasin de Chromium, `PECULE_E2E_NODE_TRANSPORT=1 NODE_USE_ENV_PROXY=1` fait passer les requêtes par `fetch` de Node avec la vérification TLS et les autorités fournies par l’environnement. Ne pas désactiver la vérification TLS ni ignorer les erreurs HTTPS.
