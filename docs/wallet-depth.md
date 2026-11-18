# Profondeur Wallet

Intégration des maquettes du 5 novembre : lumière directionnelle et ombres sur les comptes, compression puis maintien, aperçu en deux surfaces et léger recul du fond. Les variantes sont dans `wallet-depth.css`, la séquence de maintien dans `Pressable`, l’ancrage visible dans `usePreviewDepth` et les entrées/sorties dans le propriétaire canonique `useModalMotion`.

Les listes restent au niveau de lecture. Les cartes de compte n’ont aucune rotation au repos ; leurs bandes et couleurs personnalisées restent utilisables. L’inclinaison ne concerne que l’appui actif, avec une géométrie lue une fois et un nettoyage sur toute interruption. La sélection du menu + utilise le retour partagé. Il n’existe aucune animation financière ni nouvel effet serveur.

Les aperçus réutilisent les données et formulaires existants. Confidentialité, sauvegarde, brouillons, création de récurrence, virement et confirmations restent inchangés. La réduction des mouvements retire les transformations et le flou ; les couleurs système remplacent la matière en contraste forcé.

`tests/e2e/wallet-depth.mjs` couvre Chromium/WebKit à 320/390/1440 px et la réduction des mouvements : compression/maintien, annulation et changement de préférence, nettoyage des variables, recul du fond, aperçu/éditeur, retour du focus et axe. Les suites Gestes et Wallet couvrent les raccourcis, brouillons, montants et la géométrie d’ouverture. Les tests restent en démonstration ; aucun budget personnel n’est modifié. La fluidité matérielle de la PWA reste à confirmer sur un iPhone réel.
