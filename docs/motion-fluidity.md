# Fluidité de Pécule — 1er novembre 2026

Demande : adoucir le menu flottant au défilement et harmoniser les mouvements de l’application, avec priorité à la PWA iPhone.

## Mise en œuvre

- **Dock** : un ressort amorti coordonne ses dimensions. Les changements de sens conservent position et vitesse ; les petits mouvements ne changent pas son état. Pas de rendu React par image et pas de boucle au repos ou en arrière-plan. Le dock reste fixe, dans la zone sûre, et garde cinq cibles de 44 px minimum. L’indicateur actif suit sa géométrie sans seconde transition retardée. Le focus clavier montre les libellés.
- **Panneaux** : entrée décélérée de 380 ms, sortie de 240 ms, passage menu/formulaire de 320 ms. Même panneau opaque, même gestion du focus, mêmes brouillons et protections pendant la fermeture.
- **Divulgations** : ouverture de 320 ms et fermeture de 220 ms, réversibles depuis la hauteur courante.
- **Destinations** : fondu de 180 ms, sans déplacement du contenu ni attente avant interaction. Pas de révélations des cartes au défilement.
- **Retours** : pressions courtes, couleurs progressives ; notifications ancrées horizontalement pendant leur arrivée. Les illustrations existantes restent en place.
- **Accessibilité** : la réduction des animations règle immédiatement le dock, supprime les mouvements des panneaux et préserve textes et statuts. Changer cette préférence interrompt les mouvements actifs.

Propriétaires : `MobileDock`, `useModalMotion`, `AnimatedDetails`, `useViewMotion`. Les durées et courbes partagées viennent de `app/motion.css` via `motionSettings`. Pas de nouvelle dépendance, de changement des données ou des calculs.

## Vérification

`npm run test:e2e:smooth` contrôle les largeurs 320, 390 et 1 440 px dans les deux thèmes : images intermédiaires du ressort, inversion avant la fin, géométrie bornée, arrêt au repos, alignement de l’indicateur, cibles tactiles, focus clavier, réduction des animations changée en cours et navigation rapide. Les traces et captures sont produites dans `outputs/smooth-motion`.

`npm run test:e2e:menus` vérifie la continuité menu/formulaire, les interruptions, la saisie préservée, les fermetures, le retour du focus et les divulgations, sur mobile et ordinateur, y compris sans mouvement. `npm run test:e2e:motion` vérifie validation et confirmations existantes, sans toucher aux comptes personnels.

Les contrôles Chromium et WebKit sont des essais automatisés de navigateur. Ils ne mesurent pas les performances d’un véritable iPhone : le ressenti tactile final reste à confirmer sur l’appareil de l’utilisateur.
