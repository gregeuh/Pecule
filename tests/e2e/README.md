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

## Récupération P1

`node tests/e2e/import-recovery.mjs` vérifie en démonstration la reprise du relevé, la sélection, l’étape de confirmation et l’annulation du lot, sur ordinateur et téléphone. Aucune écriture serveur.

`node tests/e2e/budget-recovery.mjs` nécessite les mêmes variables explicites que le test connecté. Il crée/réutilise un compte fictif distinct dans `.sites-runtime/p1-recovery/<hôte>/`, dont le budget est réinitialisé pour vérifier les conflits de révision, les modifications indépendantes et la conservation après erreur 503. Ne jamais lui fournir de compte personnel. Un déploiement de prévisualisation et la production ont des identifiants isolés. Les preuves restent dans `outputs/p1-recovery/`.

La réception et l’usage réel des e-mails de réinitialisation exigent un service configuré ; voir `docs/password-reset.md`. Les tests de navigateur sans ce service vérifient uniquement l’indisponibilité explicite et les liens invalides, pas une livraison d’e-mail.

## Assistance P2

`node tests/e2e/budget-assistance.mjs` vérifie uniquement la démonstration, sur ordinateur/téléphone et dans les deux thèmes : règle de catégorie explicite, suggestion de récurrence après import historique, confirmation de création, seuil quotidien, seuil de catégorie, analyse et confidentialité lors du masquage des montants. Les barres ne révèlent aucun montant masqué. Aucune écriture serveur n’est autorisée par ce test.

## Outils bancaires complets

`npm run test:e2e:bank-tools` vérifie la démo sur ordinateur/téléphone et dans les thèmes clair/sombre. Il importe des opérations fictives sur deux comptes, rapproche un solde avec pointage paginé, modifie quarante-cinq opérations sur deux pages, déplace un lot entre comptes, détecte l’invalidation du rapprochement, reprend le brouillon après ajout d’une opération manquante, puis associe et dissocie un virement sans changer les soldes. Aucune écriture serveur n’est autorisée.

`npm run test:e2e:bank-tools:connected` utilise les mêmes opt-in et paramètres de transport que les autres tests connectés. Les identifiants restent dans `.sites-runtime/bank-tools/<hôte>/accounts.json` et ne doivent jamais être affichés. Seul le budget du compte QA généré est remplacé. Le test confirme un rapprochement depuis le navigateur, vérifie son empreinte et son historique en PostgreSQL, conserve les références et catégories d’origine lors d’une association, refuse une moitié de virement et une écriture de révision obsolète, puis vérifie la dissociation et la persistance après rechargement.

### Navigation mobile et accueil compact

`PECULE_E2E_NO_SANDBOX=1 npm run test:e2e:mobile` vérifie en démonstration les largeurs 320, 390, 600 et 1440 px, dans les deux thèmes. Le test couvre les quatre destinations, le bouton d’ajout séparé, le menu Plus et ses destinations, le focus et Échap, le détail du disponible, les montants masqués, l’ordre des sections et la disposition ordinateur. Il refuse toute écriture `/api/budget`. Pour vérifier une publication, utiliser `PECULE_E2E_BASE_URL`, avec `PECULE_E2E_NODE_TRANSPORT=1 NODE_USE_ENV_PROXY=1` si le proxy système est requis ; aucune désactivation TLS.

### Icônes personnalisées

`PECULE_E2E_NO_SANDBOX=1 npm run test:e2e:icons` vérifie le lien manuel, sa validation, son aperçu, l’édition et le retrait, le retour au catalogue, les récurrences et le repli en cas d’image inaccessible sur mobile/ordinateur et clair/sombre. Les images externes sont interceptées par des fixtures, sans requête Internet réelle vers leur hébergeur. Toute écriture d’un budget personnel est interdite ; la démo reste en mémoire. PECULE_E2E_BASE_URL et le transport Node optionnel permettent la validation d’une publication.

### Dimensions et contrôles mobiles

`PECULE_E2E_NO_SANDBOX=1 npm run test:e2e:sizing` parcourt les vues, formulaires, import, rapprochement et connexion en 320/390/600 px ainsi qu’en paysage 740 × 390, clair/sombre. Il mesure les débordements du document et des cartes/dialogues, les champs à 16 px, les cases natives à 20 px, les zones tactiles et le maintien de l’en-tête lors du défilement. Il teste aussi un nom de compte long et un gros solde, uniquement en démonstration sans PUT serveur. `PECULE_SIZING_QUICK=1` limite le contrôle à 390 px dans les deux thèmes pour vérifier une publication. Le transport Node et PECULE_E2E_BASE_URL suivent les autres tests ; aucune désactivation TLS.


Le contrôle de dimensions vérifie également les limites géométriques des éléments (même si le cadre coupe le débordement), les offsets horizontaux des pages et dialogues, les gestes tactiles horizontaux/verticaux et le zoom dans Chromium. `PECULE_E2E_ENGINE=webkit` utilise un navigateur WebKit Playwright installé : il vérifie les mêmes limites et la retenue horizontale, avec défilement programmatique, les gestes synthétiques WebKit mobiles n’étant pas disponibles. Cela ne remplace pas une vérification sur un iPhone physique.

`npm run test:e2e:viewport` mesure les limites du document et des messages de confirmation à chaque frame de leur animation normale, en 393/430 px, paysage 844 px et ordinateur 1440 px, clair/sombre. Le même script accepte `PECULE_E2E_ENGINE=webkit` avec un navigateur installé. Les écritures sont exclusivement en démonstration ; aucune requête PUT du budget n’est autorisée. Ce contrôle vise les débordements transitoires que les captures en réduction d’animations ne révèlent pas.

### Animations et confirmations

`npm run test:e2e:motion` exerce uniquement la démo anonyme, sur mobile/ordinateur,
clair/sombre, avec et sans réduction des animations : validation refusée sans
succès, opération, validations répétées, récurrence, préférences et thème local.
Il vérifie le chargement Lottie, l’absence de WASM en réduction des animations,
le repli sans WASM, la lisibilité et l’absence d’écriture API. Captures/rapports :
`outputs/motion`. WebKit : `PECULE_E2E_ENGINE=webkit` avec le navigateur installé.

Les variantes de signature sont vérifiées par `test:e2e:motion` (opération, récurrence, préférences, épargne et objectif atteint) et `test:e2e:imports` (relevé classé). Les scènes attendent le signal de fin du lecteur réel ; les tests ne modifient que la démonstration. `tests/confirmation-kind.test.mjs` contrôle le choix du retour, dont les restaurations et conflits qui ne doivent pas annoncer un faux jalon.

### Six interactions de signature

`npm run test:e2e:signature` vérifie le portefeuille du menu, le volet de
confidentialité (valeurs immédiatement masquées), l’alignement du repère de
navigation, les silhouettes d’objectifs et leur pourcentage réel, le reçu d’une
occurrence et les étapes réelles du CSV. Mobile/ordinateur, clair/sombre et
réduction des animations ; uniquement la démonstration, aucun PUT autorisé.
`PECULE_E2E_QUICK=1` limite le contrôle public à deux contextes mobiles sombres,
avec/sans animations. `PECULE_E2E_ENGINE=webkit` sélectionne WebKit.
Les rapports et captures sont dans `outputs/signature-interactions`.

### Transitions des menus

`npm run test:e2e:menus` vérifie la continuité réelle du même panneau et du même
fond, la saisie pendant le changement de menu, les fermetures, le refus d’une
sauvegarde pendant la sortie, les divulgations inversées et le retour du focus.
Clair/sombre, mobile/ordinateur et réduction des animations ; démonstration
uniquement, zéro PUT. `PECULE_E2E_QUICK=1` limite à deux profils mobiles sombres.
Rapports et captures : `outputs/menu-motion`. WebKit : `PECULE_E2E_ENGINE=webkit`.

### Régression iPhone : transparence à la fermeture

`npm run test:e2e:sheets` échantillonne les frames de quatre ouvertures/fermetures
successives de Plus/du portefeuille, aux largeurs 390 et 440 px, en clair/sombre,
avec réduction des animations et avec un contrôle ordinateur. Il refuse une
opacité inférieure à 1 du panneau mobile ou de son parent, un flou mobile et un
débordement latéral. Le voile est séparé et la sortie descendante est mesurée.
`PECULE_E2E_ENGINE=webkit` sélectionne WebKit ; `PECULE_E2E_QUICK=1` réduit à deux
profils mobiles. Rapports/captures : outputs/mobile-sheet. Démo uniquement, aucun PUT.


### Finitions Atelier et projection

`npm run test:e2e:visual` couvre 320/390/600/1440 px en clair et sombre : accueil, opérations, comptes, récurrences, épargne, répartition, réglages et formulaire. Vérifie les totaux journaliers, le filtrage et la recherche vide, la confidentialité et la projection au toucher/clavier. Aucun PUT et aucun compte personnel. `PECULE_E2E_ENGINE=webkit` utilise le moteur WebKit avec les dépendances indiquées plus haut ; `PECULE_E2E_QUICK=1` limite à 390 px dans les deux thèmes. Rapports et captures dans `outputs/visual-refinement/`. `PECULE_E2E_NODE_TRANSPORT=1 NODE_USE_ENV_PROXY=1` pour le transport HTTPS géré.


### Cohérence de l’ensemble du site

`npm run test:e2e:coherence` vérifie les sept vues, rubriques des réglages, activité dépliable des comptes, filtres et états des récurrences. En démonstration isolée, il sauvegarde une note repliée puis la relit, révèle une erreur dans un champ caché, met une récurrence en pause et crée une série terminée. Aucun compte personnel ni PUT serveur. Profils 320/390/600/1440, clair/sombre ; `PECULE_E2E_ENGINE=webkit`, `PECULE_E2E_QUICK=1` et transport Node comme pour la suite visuelle. Rapports/captures : `outputs/site-coherence/`. Le test de dimensions ouvre explicitement les options du compte avant d’inspecter ses couleurs.

La suite de cohérence couvre aussi l’historique d’import vide → import, le rejet d’un fichier de plus de 2 Mo, et les options de récurrence repliées : date de fin invalide révélée/focalisée, correction puis enregistrement avec options repliées. Les assertions d’alerte ciblent le dialogue, pour exclure l’annonceur de navigation Next.js.

### Corrections de l’audit du 29 octobre

`npm run test:e2e:audit-fixes` couvre les brouillons d’opération (y compris champs contrôlés), leur effacement, l’absence de brouillon après sauvegarde, la reprise des préférences après navigation, les totaux du mois et les en-têtes de sécurité. Quatre scénarios 390/1440 × clair/sombre ; `PECULE_E2E_ENGINE=webkit`, `PECULE_E2E_QUICK=1` et transport Node comme pour les autres suites. Les contextes sont anonymes et n’écrivent aucun PUT serveur. Les brouillons sont en mémoire seulement ; le test vérifie leur absence de localStorage. Rapports dans `outputs/audit-fixes/`.

Le seuil du test d’assistance est choisi au-dessus du disponible de démonstration : le test ne dépend plus du nombre de jours avant la paie. Les tests de synchronisation couvrent également les délais et les réponses de sauvegarde perdues ; `tests/operation-totals.test.mjs` vérifie les exclusions de virements/écritures futures et les sous-listes filtrées.
