# Direction Wallet — 4 novembre 2026

L’utilisateur a approuvé la maquette claire/sombre et les transformations de la pile de comptes. Cette livraison intègre les éléments fonctionnels, avec les données et parcours réels : aucune valeur fictive supplémentaire n’est injectée.

## Interface

- Cartes de compte empilées, jusqu’à trois bandes visibles ; gestion et comptes supplémentaires accessibles depuis le titre. Comptes courant, épargne et espèces utilisent leur identité visuelle ; les couleurs personnalisées restent utilisables. Les anciennes couleurs de préréglage sont traduites visuellement, sans réécriture des données.
- Entrée du compte vers son dialogue, et retour à sa carte. Le geste descend l’en-tête ; Fermer et Échap restent disponibles. Le dialogue canonique garde inert, le focus, la réduction des animations et la propriété des transitions.
- Détail avec solde canonique, entrées/sorties du mois hors virements, activité et accès aux formulaires existants. Saisie, source de virement et import neuf reprennent le compte ; un brouillon d’import existant garde la priorité.
- Accueil dense : comptes, quatre actions, onglets, dépenses du mois, charges de l’horizon choisi, deux dernières opérations et objectif réel. Prévisions, projection, répartition et routines de saisie restent accessibles.
- Cobalt, or et violet ; fond clair froid et véritable fond sombre, surfaces et contrôles cohérents dans les autres pages. Palette sémantique des alertes budgétaires conservée.

## Préservation des contrats

Aucune migration, aucun changement de calcul ou de schéma. Les données financières restent en centimes et sont affichées immédiatement, sans animation des valeurs. Les formulaires, validations, rapprochement, import historique, dédoublonnage, brouillons, conflits et notifications gardent leurs propriétaires. Le total du portefeuille inclut tous les comptes ; le disponible demeure distinct et exclut les comptes d’épargne selon sa règle existante.

## Preuves

`tests/e2e/wallet.mjs` : Chromium/WebKit, 320/390/1440 px, clair/sombre, réduction des mouvements, geste, Échap/focus, opérations réelles de démonstration, confidentialité, compte source, comptes nombreux/noms longs et axe. Les tests de saisie iPhone, import sans en-tête, virements et panneaux sont adaptés au parcours approuvé et conservent leurs assertions financières. Les essais utilisent uniquement la démonstration ; aucun budget personnel n’est modifié. Le clavier reste simulé, la fluidité matérielle iPhone est à confirmer sur l’appareil.

## Passe de finition
Correction d’un saut reproduit en reprenant le panneau pendant son retour : ressort partagé, continuité de position et vitesse périmée ignorée après une pause. Rectangles de changement de dialogue fixés pendant le morphing. Fondu limité au contenu des onglets, survol des cartes sans déplacement de leurs cibles et couleurs de défilement harmonisées.

`tests/e2e/wallet-polish.mjs` vérifie la reprise dans un même événement, le déplacement suivant, le lâcher après pause, le changement dynamique de réduction des mouvements, les rectangles de transition et l’opacité de la barre d’onglets, en démonstration sur Chromium/WebKit à 390 et 1440 px. Les suites Wallet et panneaux restent les vérifications de non-régression.
