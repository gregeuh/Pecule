# Revue finale Wallet — 6 novembre 2026

Périmètre : les six points demandés, dans la direction Wallet approuvée. Aucun nouveau langage visuel, service, calcul financier, schéma ou parcours de sauvegarde. Les tests ne touchent qu’à la démonstration anonyme.

## Résultat par point

| Point | Travail réalisé | Preuve durable |
|---|---|---|
| Trois niveaux de profondeur | Fond, lecture et interaction documentés ; ombres `--depth-*` conservées, matière des comptes adaptée au contraste de leur couleur personnalisée | `docs/design-system.md`, `lib/wallet-presentation.ts`, tests de matière |
| Alignement des pages | Titres, rayons, paddings et intervalles communs aux comptes, objectifs et réglages ; listes gardées calmes ; libellés de type de compte communs au détail et à la gestion | Matrice `design-finish`, galerie de 48 références |
| Détails visuels | Accent textuel clair plus contrasté, encarts d’épargne corrigés, segments inactifs opaques, logos/catégories calibrés, meilleurs replis du journal ; masquage immédiat des progressions et valeurs accessibles | Contraste axe, tests de couleurs, noms longs et recherche vide |
| Langage d’animation | Durées du Wallet et retour des swipes lus dans les tokens communs ; aucun nouvel effet ; annulations et préférence réduite conservées | Suites depth, gestes et smooth-motion |
| iPhone | Formats 320/390/600/740 px, paysage court, zoom/pan, champs, dialogues longs, dates/select natifs, clavier simulé, brouillons et WebKit vérifiés | Suites mobile-sizing et iphone-capture ; validation physique ci-dessous |
| Référence figée | DESIGN.md réconcilié avec les propriétaires actuels, guide de design, galerie et manifeste versionnés, procédure de reproduction sur un autre PC | `docs/design-reference/`, `npm run design:references -- --check` |

## Constats corrigés

La première revue a parcouru sept pages et les états vide, saisie et import dans quatre configurations, puis les écrans de connexion/récupération ont été ajoutés aux références finales. Trois familles de contraste ont été relevées en clair : encart d’épargne à 4,42:1, accent de navigation sur fond de survol à 4,34:1, et segment inactif transparent de saisie dont le fond n’était pas déterminé de façon fiable. Les encarts utilisent désormais leur texte violet adapté, l’accent textuel #1d4dd5 et les segments un fond opaque. L’action principale reste #245af3.

Les comptes et objectifs avaient encore des espacements et titres issus d’étapes précédentes. Les surfaces de lecture sont à 22/20 px de padding, rayon 16 px et titres de 18 px ; les titres de page sont à 26 px. Les logos sont contenus dans des tuiles de 36 px avec image de 26 px. Les listes ne reçoivent pas d’ombre supplémentaire.

Les couleurs de compte ne sont pas réécrites. Pour la matière, les reflets et filtres s’éloignent de la luminance du texte choisi ; le test couvre tous les gris et les couleurs de référence, y compris l’effet du filtre sur le texte. Le masquage couvre maintenant la progression visuelle et accessible des objectifs sur leurs pages et les illustrations de prévision, sans transition différée.

Le détecteur mobile historique a été corrigé pour distinguer un titre réservé aux lecteurs d’écran et le débordement décoratif du cercle Wallet d’un texte réellement coupé. Les montants et pieds de carte restent contrôlés. L’en-tête de saisie peut être relatif pour sa poignée : il reste dans le flux et ne devient ni fixed ni sticky. Les tests continuent de vérifier scroll du corps, actions visibles et champs contenus.

Le dernier contrôle WebKit a également montré qu’un relâchement pouvait être redirigé vers un bouton du nouvel aperçu. Le clic de ce maintien est désormais consommé au niveau du document ; un nouvel appui ou le clavier reste utilisable. La protection survit au démontage de la ligne source et se nettoie à la prochaine pression primaire, à une activation clavier, au changement de visibilité ou après un délai borné.

## Vérifications reproductibles

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npm run test:e2e:design` : 48 états Chromium, 390/1440 px, clair/sombre, axe et géométrie. Avec WebKit et `PECULE_E2E_QUICK=1` : 24 états, mobile sombre et ordinateur clair.
- `node tests/e2e/mobile-sizing.mjs` : huit contextes, 320/390/600/740 px, deux thèmes ; dialogues, champs, choix, zoom/pan, noms longs, import et scroll.
- `node tests/e2e/iphone-capture.mjs` : six contextes Chromium et quatre WebKit en mode rapide ; clavier simulé, saisie française, validation, favoris, brouillons et retour des soldes de démonstration.
- `node tests/e2e/wallet-depth.mjs`, `node tests/e2e/gestures.mjs` : Chromium/WebKit, clair/sombre/réduit, focus et actions préparées sans écriture automatique.
- `node tests/e2e/smooth-motion.mjs` : six contextes Chromium, continuité du dock et navigation.
- Audit statique premium strict ; intégrité des captures avec `npm run design:references -- --check`.

Les rapports d’exécution détaillés restent dans `outputs/design-finish`. La galerie et son manifeste sont versionnés : une référence n’est mise à jour qu’après revue. Les tests de maintien établissent un scroll immobile avant la pression : un maintien pendant un scroll réel continue d’être annulé. Les contrôles publics de livraison sont rejoués sur la version publiée, en démonstration. Les valeurs natives de date et les options de connexion dépendent de l’OS et de l’environnement ; aucun parcours Google ni envoi d’e-mail réel n’est déclenché par cet audit visuel.

## Validation finale sur iPhone réel — à confirmer

L’environnement permet Chromium/WebKit et la simulation de viewport/clavier, pas l’accès à un iPhone physique. Les cases ci-dessous restent volontairement ouvertes. Aucun résultat automatisé ne remplace la sensation tactile, le clavier Apple ou l’animation du système.

| Essai dans la PWA installée | Résultat attendu | État appareil |
|---|---|---|
| Ouvrir en clair puis en sombre | Aucun flash clair résiduel, textes et icônes lisibles | À confirmer |
| Descendre/remonter rapidement | Dock continu, aucune dérive horizontale | À confirmer |
| Maintenir un compte/opération, puis tenter un scroll | Aperçu volontaire ; scroll prioritaire si le doigt se déplace | À confirmer |
| Tirer le +, puis maintenir/glisser vers une option | Bon formulaire ; aucune écriture sans Enregistrer | À confirmer |
| Ouvrir une dépense et le clavier, saisir 12,34 puis annuler | Champ visible, actions atteignables, brouillon conservé | À confirmer |
| Tourner l’iPhone avec un panneau ouvert | Pas de champ coupé ni de scroll latéral | À confirmer |
| Masquer les montants et visiter Épargne/Prévisions | Ni montant, pourcentage, valeur accessible ou barre révélatrice | À confirmer |
| Activer Réduire les animations dans iOS | Actions identiques, pas d’inclinaison/recul/flou | À confirmer |

Faire les essais de saisie sans enregistrer pour ne créer aucune opération de test dans son budget. Un écart observé sur appareil doit préciser page, thème, orientation et geste ; corriger ce point avant toute nouvelle direction esthétique.
