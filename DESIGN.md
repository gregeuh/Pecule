---
version: alpha
colors:
  background: "#f7f5f1"
  surface: "#ffffff"
  ink: "#252c2b"
  muted: "#626965"
  primary: "#235746"
  apricot: "#f5c39e"
  lavender: "#e2d6f5"
  budget-negative: "#aa394e"
  budget-attention: "#984b00"
  budget-comfort: "#21634e"
typography:
  body:
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
rounded:
  card: "20px"
omitted:
  - section: spacing
    reason: Existing CSS remains the canonical implementation.
  - section: components
    reason: Existing app/globals.css owns component styles.
---

## Overview
Pécule est un outil personnel de budget en français. La demande du 26 octobre impose de retrouver l’interface visible sur pecule-budget.vercel.app à partir du code Git disponible. La référence est le tableau de bord bleu « clarté », la navigation à six vues, la répartition 50/30/20 et les thèmes clair/sombre.

## Colors
La palette canonique est désormais possédée par `app/atelier.css`, chargé après `app/reference.css` et les styles de fonctionnalité : --bg, --card, --ink, --muted et --blue. `app/reference.css` conserve la géométrie et les polices de référence. Les pages de compte utilisent ces variables et les classes .field, .primary, .card et .form-error.

## Typography
DM Sans pour le texte et Manrope pour les titres, auto-hébergées dans public/fonts, comme le site de référence. Les champs de connexion utilisent 16px pour éviter le zoom automatique sur iPhone.

## Layout
Connexion dans une carte centrée, largeur maximum 440px, marge de 20px sur téléphone. Tableau de bord en deux colonnes sur ordinateur ; navigation basse et cartes empilées sur mobile. Six vues, dont la répartition 50/30/20.

## Elevation & Depth
Conserver les ombres discrètes de la classe .card existante.

## Shapes
Les rayons et densités suivent la feuille de styles de référence. Les ajouts de formulaires réutilisent .field, .primary et .card.

## Components
Formulaires de compte : labels natifs, mot de passe masqué avec bouton d’affichage, erreurs en français, focus sur l’erreur, envoi désactivé pendant la requête. Aucun cache de pages personnelles ou de réponses API.

## Do's and Don'ts
Réutiliser les classes existantes. Ne pas introduire de connexion basée sur les en-têtes ChatGPT sur Vercel. Ne pas présenter les anciens comptes et budgets comme migrés.

## Réconciliation de la référence

Les valeurs du 23 octobre ont été remplacées par les couleurs et polices observées le 26 octobre sur le site demandé. Le tableau de bord est reproduit avec ses classes clarte-*. Les calculs et opérations CRUD conservent la base Git, et la répartition 50/30/20 suit les règles publiquement livrées par le site de référence. Le montant de la carte d’objectif est corrigé pour porter uniquement sur cet objectif.

## Import bancaire
Le parcours réutilise les champs, listes de diagnostic, boutons et récapitulatifs de l’application. app/bank-import.tsx possède le parcours ; les classes bank-import-* dans app/bank-import.css adaptent la grille de colonnes et le récapitulatif sans modifier les autres écrans. La sélection et les données du relevé restent en mémoire, jamais dans l’URL ni dans le stockage local.

La case « Conserver les colonnes supplémentaires dans les notes » et la divulgation native « Données reprises » rendent les données supplémentaires inspectables avant confirmation. Les valeurs restent du texte, avec retours à la ligne et repli des longues références ; les styles héritent des variables existantes sans nouvelle palette.

## Signal du disponible

Après retour utilisateur, le grand fond rouge/orange/vert est remplacé par la surface neutre `--card` des autres cartes. Le code couleur est limité au montant disponible et à un petit libellé avec icône, placé à côté du titre. Aucun badge encadré ni paragraphe d’alerte n’alourdit la carte. Les seuils financiers restent identiques.

`app/budget-signal.css` possède les couleurs de texte : `colors.budget-negative` → `--budget-negative-ink`, `colors.budget-attention` → `--budget-attention-ink`, `colors.budget-comfort` → `--budget-comfort-ink`. Les valeurs claires sont `#aa394e`, `#984b00` et `#21634e`. En thème sombre, les textes deviennent `#ff9cae`, `#ffdcac` et `#8addb4` sur la surface `--card`. Les contrastes sont vérifiés sur les surfaces réelles. Les autres textes, soldes de la formule et montants par jour gardent les couleurs neutres du produit.

Le libellé reste visible sans couleur et expose son explication par son nom accessible et son titre. Les couleurs forcées utilisent Canvas/CanvasText. Les montants masqués, les erreurs de chargement et les budgets sans compte courant/espèces n’exposent aucun signal financier ; le fond de la carte reste neutre dans tous les cas.

## Récupération et imports

Les reprises de brouillon, la liste des imports et la comparaison de versions utilisent les cartes neutres, les champs natifs et les confirmations existantes. Aucune grande surface de couleur n’est ajoutée. La comparaison traduit les champs financiers en français et conserve les deux versions visibles avant le choix. Les nouvelles pages de récupération de compte reprennent la carte d’authentification existante.

## Assistance budgétaire

Les analyses restent repliées par défaut dans Opérations pour préserver la densité de la page. Les barres utilisent la couleur primaire existante, sans nouvelle palette. Les propositions de récurrences reprennent les cartes neutres et les boutons secondaires. Les alertes de catégories occupent une ligne discrète sous le disponible ; aucun aplat rouge/orange/vert ne revient. Les réglages de seuil et les règles mémorisées réutilisent les cartes de réglages existantes.

## Vérification des données bancaires

Les trois parcours se trouvent dans les écrans existants : comptes pour le rapprochement, opérations pour la sélection et les virements. Les panneaux réutilisent le dialogue large et les champs natifs. app/bank-tools.css est chargé après les styles de référence et possède les listes bornées, cases à cocher, récapitulatifs neutres et actions de ces parcours. Les sélections de page et de tous les résultats sont distinctes. Les avertissements sont textuels et reprennent les composants existants ; aucun nouvel aplat de couleur ne concurrence le montant disponible. Les montants restent masqués dans les listes et récapitulatifs lorsque le mode de confidentialité est actif ; les champs de saisie restent visibles pendant leur édition explicite.


## Palette Atelier — décision du 27 octobre 2026

L’utilisateur a validé les couleurs de la deuxième proposition : vert profond, abricot et lavande. Cette livraison adopte uniquement la palette, sans réorganiser les écrans ni changer les calculs. Le sombre utilise un fond noir neutre et des surfaces charbon, sans bleu marine. La carte du disponible reste neutre pour chaque état financier.

Propriété modèle B : `app/atelier.css` → variables sémantiques existantes → composants partagés ; le présent document reflète les valeurs acceptées. L’alias historique `--blue` est conservé pour les consommateurs existants, mais porte maintenant l’accent vert profond. La projection SVG utilise également --blue, --line, --muted et --card pour sa courbe, son quadrillage et son point sélectionné. Les couleurs personnelles des comptes et des objectifs stockées dans les budgets sont préservées ; les icônes et les pistes adaptent leur surface au thème via `--item-color`. Les icônes de catégories et d’actions utilisent `--category-color` et `--category-background`, jamais un fond clair imposé en sombre.

| Rôle | Clair | Sombre | Consommateurs |
|---|---|---|---|
| colors.background → --bg | #f7f5f1 | #0d0e0e | document, dialogues |
| colors.surface → --card | #ffffff | #1a1d1c | cartes, champs, menus |
| colors.ink → --ink | #252c2b | #f2f3ef | texte principal |
| colors.muted → --muted | #626965 | #b7bdb7 | labels et descriptions |
| colors.primary → --blue | #235746 | #a4d9be | liens, navigation, focus |
| --action-bg / --on-action | #235746 / #ffffff | #a4d9be / #173b2d | boutons et ajout flottant |
| colors.apricot → --apricot-surface | #f5c39e | #3d2b21 | prévision et échéances |
| --apricot-ink / --apricot-muted | #57341f / #70492e | #ffd7b8 / #dfb99e | texte des échéances |
| colors.lavender → --lavender-surface | #e2d6f5 | #30263f | objectif et introduction épargne |
| --lavender-ink / --lavender-muted | #46345e / #635176 | #ecddff / #cbb7df | texte des objectifs |

L’abricot des échéances ne signifie pas une alerte. Les tons rouge/orange/vert du disponible restent exclusivement ceux de `app/budget-signal.css`. Les montants masqués et les trois états gardent le même fond neutre. Les couleurs forcées suivent Canvas/CanvasText. Le thème automatique est résolu avant peinture par next-themes et suit les changements de préférence système. La navigation mobile conserve sa géométrie flottante, avec un onglet actif teinté et une ombre sobre adaptée au thème.

## Navigation et accueil mobiles — 27 octobre 2026

`app/mobile-navigation.css`, chargé après Atelier, possède la structure mobile à 760 px et moins. Quatre destinations sur une seule ligne : Accueil, Opérations, Comptes, Plus. Le bouton d’ajout circulaire est distinct du groupe de navigation. Plus ouvre le dialogue canonique de BudgetApp : récurrences, épargne, répartition et réglages ; il conserve l’indication de destination courante. Les surfaces et le focus utilisent exclusivement les tokens Atelier, dans les deux thèmes.

Sur mobile, le disponible, le budget quotidien et l’horizon précèdent « Comprendre mon disponible », qui ouvre le détail existant. La formule reste visible sur ordinateur. L’ordre mobile est disponible, alertes éventuelles, échéances, trois dernières opérations, comptes, objectif, répartition, projection. Le document garde son défilement naturel et un espace inférieur réserve le dock et les zones sûres. La navigation ordinateur conserve sa disposition.


Le dock mobile est possédé par `app/mobile-dock.tsx` : défilement descendant au-delà de 80 px et 24 px de mouvement → format compact ; remontée de 12 px → format complet ; retour dans les 32 premiers pixels → complet. Le petit seuil évite les oscillations et la position est bornée aux limites du document pour ignorer le rebond élastique. L’écoute est passive et regroupée par requestAnimationFrame. Les icônes et le bouton d’ajout restent touchables (au moins 44 px) ; les noms accessibles restent présents. Le focus clavier et un dialogue ouvert imposent le format complet. L’animation de 220 ms se limite à la navigation fixe, sans déplacer le contenu ; elle est désactivée en réduction des animations. Le format ordinateur reste inchangé.

## Icônes personnalisées par lien

Le sélecteur partagé `app/merchant-fields.tsx` conserve le catalogue et ajoute un lien d’image HTTPS appliqué explicitement, un aperçu et un retrait. Les champs et actions utilisent les primitives et tokens Atelier, avec repli des textes sur mobile. `MerchantIcon` donne priorité au lien manuel, sans changer l’identité de marque ni la catégorie ; une image inaccessible revient à l’icône de catégorie. Le navigateur charge l’image avec referrerPolicy=no-referrer, sans proxy serveur ni incorporation HTML. L’aperçu annonce chargement, réussite ou échec. Le lien est porté par `customIconUrl` sur les opérations et récurrences ; il est conservé dans les budgets et sauvegardes JSON.
