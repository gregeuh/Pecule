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

## Calibrage mobile — 28 octobre 2026

`app/mobile-forms.css`, chargé après la structure mobile, possède les dimensions communes des contrôles jusqu’à 760 px. Les champs et filtres utilisent une police de 16 px et une hauteur de 48 px, les actions tactiles au moins 44 px. À 480 px et moins, les formulaires classiques passent sur une colonne pour garder les valeurs des dates et des listes lisibles. Les cases natives mesurent 20 px et n’héritent plus du remplissage d’un champ texte ; leurs labels donnent une zone tactile plus grande. Les couleurs sont des boutons radio sous des pastilles de 44 px. La sélection d’une opération passe par un label tactile sans changer son état ni son nom accessible.

Les actions d’Opérations forment une grille régulière 2 × 2 ; l’export possède un libellé visible. Filtres et recherche ont des dimensions communes, la pagination conserve deux actions égales sous le compteur. Les résumés financiers utilisent des lignes compactes label/montant, et les libellés et montants longs peuvent se replier sans perdre leur valeur. Les dialogues restent dans la hauteur dynamique de l’écran et conservent leur en-tête accessible pendant le défilement. Ces ajustements ne changent ni les calculs ni la palette Atelier ni la navigation adaptative.


Le cadre mobile borne explicitement html/body et les enveloppes de page à la largeur disponible. `overflow-x: clip` et `overscroll-behavior-x: none` empêchent le débordement et le rebond latéral du document ; les dialogues gardent leur défilement vertical avec une retenue horizontale indépendante. Aucun blocage du zoom ni du défilement vertical, aucune hauteur fixe du document ni nouvelle interception des gestes. Les tests contrôlent aussi les limites réelles des champs, boutons et cartes pour ne pas masquer un élément qui dépasserait simplement derrière le cadre.


La retenue horizontale s’applique aussi aux appareils tactiles en paysage large. Les champs y conservent une police de 16 px pour éviter le zoom automatique à la prise de focus. L’animation partagée des toasts conserve explicitement translateX(-50%) dans chaque image-clé ; l’ancienne animation verticale pouvait remplacer cette translation et dépasser temporairement le bord droit. `tests/e2e/mobile-viewport.mjs` mesure les limites du message à chaque frame de son apparition avec les animations actives, en portrait, paysage et sur ordinateur. Les contrôles WebKit portent sur son moteur de rendu, pas sur un iPhone physique ni son conteneur PWA.


## Défilement de la saisie d’opération — 28 octobre 2026

Retour utilisateur sur le titre fixe « Ajouter une opération » : la variante canonique `.operation-modal` laisse son en-tête défiler naturellement sur mobile, sans animation de masquage ni espace réservé au titre. Le titre et la croix reviennent en remontant. « Annuler » en bas du formulaire permet de quitter pendant la saisie sans revenir tout en haut. Les autres dialogues conservent leur comportement existant ; la variante reste possédée par le dialogue de BudgetApp et mobile-forms.css.

## Animations et confirmations — 28 octobre 2026

La confirmation de sauvegarde est le moment expressif : une illustration Lottie originale de Pécule trace une coche avec trois accents Atelier abricot/lavande, une seule fois en 800 ms. `app/confirmation-art.tsx` utilise le lecteur officiel LottieFiles, chargé à la demande, son WASM auto-hébergé et un canevas borné à 48 px. Le texte du message reste immédiat, accompagné d’une coche SVG de secours. Aucun appel à un service d’illustrations, aucune donnée budgétaire transmise. Les couleurs de la coche héritent du message ; les accents reprennent les valeurs Atelier acceptées.

`app/motion.css` possède les durées communes : pression 120 ms, arrivée 260 ms avec décélération ; dock 280 ms. Les fenêtres apparaissent depuis le bas sur mobile, plus discrètement sur ordinateur, sans retarder le focus ni la fermeture. Le titre de saisie continue de défiler naturellement. Les pages ne cachent pas leurs cartes derrière une animation de chargement. En réduction des animations, les déplacements et le lecteur Lottie sont supprimés au profit de la coche et du texte immédiats. Le lecteur s’arrête hors écran/en arrière-plan et ne boucle pas.

Le portefeuille Lottie accueille une liste d’opérations encore vide ; il se joue une fois, sans boucle. La courbe se dessine à l’ouverture de la projection, et les barres d’objectif accompagnent les mises à jour. Le franchissement d’un objectif ajoute une félicitation à la confirmation de sauvegarde.

## Signature « Les petits pas » — 28 octobre 2026

La demande suivante approfondit l’identité animée : le portefeuille vert à monogramme p et la pièce abricot deviennent les éléments communs d’une famille originale de scènes Lottie. L’opération range une pièce ; la récurrence décrit un cycle ; le relevé classe ses pages ; l’épargne construit une réserve ; les préférences déplacent leurs curseurs. Le franchissement explicite d’un objectif fait apparaître un emblème de projet et trois accents. Une seule lecture de 1,3 à 2 s, sans délai imposé à l’action. La version précédente à coche générique est remplacée.

Le canevas de confirmation mesure 72 px, 88 px pour un objectif atteint ; la scène d’accueil vide reste à 80 px. `BudgetNotice` possède le titre d’état et le message existant, lisibles indépendamment de l’illustration. Les couleurs fixes des dessins dérivent de la palette Atelier : vert #235746, reflet #34765e, tranche #173b2d, menthe #a4d9be, pièce #f5c39e et tranche #c68a5b, lavande #e2d6f5 et tranche #806a9f, papier #fffaf1. Elles restent identiques sur les surfaces de notification claire et sombre ; les textes héritent des tokens de thème. Le générateur déterministe `scripts/generate-signature-animations.py` possède les dessins, les JSON versionnés sont les ressources exécutées. Aucun nouveau moteur d’animation ni bibliothèque supplémentaire.

L’illustration reprend après un passage en arrière-plan seulement si elle n’est pas terminée. Les changements rapides de préférence invalident le chargement précédent ; aucune seconde instance du lecteur ne peut remplacer l’instance courante. Réduction des animations et couleurs forcées utilisent directement le symbole statique associé à l’action.

## Signature au fil des parcours — 28 octobre 2026

Les six prolongements validés par l’utilisateur s’appuient sur les composants partagés `app/signature-interactions.tsx`, `app/import-journey.tsx` et `app/signature-interactions.css`. Le bouton d’ajout porte le portefeuille à monogramme ; son rabat s’ouvre dans le menu, les six choix arrivent avec un décalage total plafonné à 100 ms. La fermeture et le focus restent immédiats.

Les objectifs possèdent une silhouette de valise (voyage/soleil), maison, bouclier ou étoile, dont le tracé suit le pourcentage réel borné à 0–100. La silhouette de fond rend le projet reconnaissable à 0 %. Le dessin est décoratif ; la progression chiffrée et la barre accessible restent canoniques. Les cartes et l’accueil partagent ce dessin, sans modifier les montants.

L’import présente un relevé qui rejoint son carnet entre Choisir, Lire, Vérifier et Enregistrer. FileReader fournit les octets réellement lus ; seule cette phase possède un pourcentage. Analyse et sauvegarde restent des phases sans pourcentage inventé. La sélection, les doublons, la vérification et la confirmation gardent leur comportement. Une lecture abandonnée est annulée et ses réponses tardives ignorées.

Le volet de confidentialité accompagne le remplacement immédiat des montants par les points ; sa fermeture ne retarde jamais le masquage. Le repère de navigation partagé suit la destination active sur ordinateur et mobile, avec recalcul au changement de taille et au rétrécissement du dock. Les noms, états courants et cibles tactiles sont conservés.

Lorsqu’une occurrence liée à une récurrence est effectivement sauvegardée, la confirmation montre sa date tamponnée puis la prochaine date prévue. Le calendrier lit le planning existant et respecte pauses, exclusions et fins de série ; aucune échéance n’est créée par l’animation. Le texte conserve les dates en dehors du dessin. Réduction des animations : changements d’état immédiats, tracés d’objectifs et calendrier fixes, aucun défilement animé. Les couleurs des scènes reprennent les variables --signature-green / --signature-mint / --signature-apricot / --signature-paper de la palette déjà validée.

## Continuité des menus — 28 octobre 2026

`app/use-modal-motion.ts` possède les entrées (300 ms), les changements de contenu (300 ms) et les sorties (170 ms) du dialogue canonique. Le panneau et son fond gardent leur identité DOM entre menu et formulaire ; aucun fond ne clignote et le formulaire reste utilisable. Le changement de taille anime uniquement les dimensions de ce panneau isolé, borné au viewport, avec un déplacement de continuité sur ordinateur. La nouvelle rubrique arrive sans étirer ses textes. Une nouvelle demande interrompt la précédente ; les animations annulées n’exécutent pas une ancienne fermeture.

`app/animated-details.tsx` conserve les éléments details/summary natifs, leur contenu direct et leur clavier. Il accompagne le dépliage (260 ms) et le repli (170 ms), y compris une inversion en cours de mouvement, puis rétablit la hauteur naturelle et le débordement d’origine. Catalogue, analyses, projection, réglages de répartition et détails bancaires partagent ce comportement. La réduction des animations applique directement l’état final, y compris si la préférence change pendant un mouvement.

`app/menu-motion.css` retire les anciennes animations CSS du dialogue pour éviter leur superposition avec ce propriétaire. Le focus reste piégé pendant la sortie, revient au déclencheur initial après une fermeture, et rejoint le titre de la destination choisie depuis Plus. Les boutons visibles seulement sur mobile ou dans une divulgation repliée sont exclus du parcours Tab lorsqu’ils sont cachés. Le verrou de fermeture refuse une nouvelle sauvegarde pendant la sortie, sans modifier les règles financières.

## Ajout depuis le menu flottant — 28 octobre 2026

À la demande utilisateur, les boutons « Ajouter une opération » des en-têtes ordinateur sont supprimés : le menu flottant portefeuille/+ est l’entrée globale. Les actions propres aux pages, dont « Nouvelle opération » dans Opérations et les états vides, restent disponibles.

## Fermeture des panneaux sur iPhone — 28 octobre 2026

L’enregistrement utilisateur révèle une superposition des cartes et du dock pendant la fermeture : le panneau et son parent étaient tous deux fondus, avec un backdrop-filter sur le parent. La correction sépare un voile `.modal-shade` du panneau dans le même conteneur canonique. Le parent ne change plus d’opacité. Sur téléphone et écran tactile, le panneau reste entièrement opaque et glisse depuis/vers le bas, jusqu’au-delà du viewport ; sa sortie dure 200 ms. Le voile seul change d’opacité. Le flou est désactivé sur ce voile mobile afin d’éviter la composition instable du backdrop-filter sur iOS. Les animations d’opacité du panneau sur ordinateur restent conservées.

La correction ne change ni les données ni les destinations, le focus, les cibles tactiles ou le format du dock. Le contrôleur commun conserve ses annulations, son verrou de sauvegarde pendant la sortie et l’état immédiat en réduction des animations. `tests/e2e/mobile-sheet.mjs` échantillonne chaque frame des ouvertures/fermetures répétées : opacité du panneau mobile et du parent à 1, voile séparé sans flou mobile, sortie descendante, absence de débordement horizontal. Les contrôles WebKit restent des contrôles du moteur, distincts du conteneur PWA d’un iPhone physique.

Les images finales de sortie restent appliquées jusqu’au démontage React du dialogue ; elles ne sont annulées qu’après retrait du DOM. Cela empêche un retour d’une frame à la position initiale, aussi bien sur mobile que sur ordinateur.


## Hiérarchie et surfaces Atelier — 28 octobre 2026

Les six améliorations visuelles validées ensemble conservent DM Sans / Manrope et la palette Atelier. `app/atelier.css` reste l’unique propriétaire des tokens et des finitions ; il est chargé après les règles de géométrie mobile, avant les animations et la présence des menus. Les styles de mouvement restent les seuls propriétaires des transitions de dialogue.

L’accueil affirme son titre, son disponible et son budget quotidien ; la formule se sépare par une ligne sur ordinateur et reste accessible par le lien existant sur mobile. Les sections emploient une respiration de 24–28 px et des titres de 17–18 px. Les nombres financiers utilisent des chiffres tabulaires, avec repli des valeurs longues. Le disponible conserve son fond neutre et ses couleurs de statut limitées au texte.

| Token CSS canonique | Clair | Sombre | Usage |
|---|---|---|---|
| --surface-raised | #ffffff | #242725 | dialogues, au-dessus des cartes charbon |
| --surface-inset | #efeee9 | #121413 | champs et surfaces encastrées sombres |
| --forecast-surface | #fcf0e5 | #30251e | échéances et calendrier, textes abricot |
| --goal-surface | #f2ecfa | #292232 | objectifs, textes lavande |
| --surface-shadow | 0 8px 26px #253c3009 | 0 10px 28px #00000029 | relief discret du disponible |

Les accents abricot/lavande plus saturés restent disponibles pour la date actuelle, les icônes et les contrôles. Le lien vers la répartition utilise le vert doux existant. Les icônes de catégories partagées sont possédées par `app/category-icon.tsx` et réutilisées dans l’accueil et les opérations. Leurs mélanges sont calculés sur l’élément portant --category-color, jamais sur :root, pour que les variables locales soient effectivement résolues dans les deux thèmes.

Les groupes quotidiens d’Opérations présentent date, nombre et net des opérations filtrées de la journée. Catégorie et compte sont visibles sur téléphone ; le montant reste aligné à droite. Les totaux concernent le résultat filtré complet, même si une journée est répartie sur deux pages. Aucun changement du tri ni de la pagination par quarante.

`app/projection-chart.tsx` possède la projection en lecture seule : repères visibles aujourd’hui / à trente jours / minimum avec sa date ; sélection au toucher, à la souris ou par curseur natif de 0 à 30 jours. La sélection persiste après le toucher et ne requiert pas d’infobulle. Les graduations partagent la transformation de la courbe. Le masquage couvre les nouveaux repères, le curseur accessible et le tableau alternatif. Aucune modification des calculs de solde ou de récurrences. Vérification : `tests/e2e/visual-refinement.mjs` en clair/sombre, de 320 à 1440 px, moteurs Chromium et WebKit.


## Cohérence des écrans et formulaires — 28 octobre 2026

La validation utilisateur suivante étend les finitions à toutes les vues. `atelier.css` possède une hiérarchie commune : titres de page 28–38 px, sous-titres 13–14 px, titres de section 18–20 px, montants 30–32 px ; grilles espacées de 20–24 px et contrôles de carte de 44 px minimum. Les calculs et couleurs personnelles restent ceux du budget.

Réglages utilise quatre sections natives : Apparence, Budget, Données et Compte. Les liens d’ancrage ne démontent pas les formulaires ; les sous-titres de cartes sont de niveau 3 sous les titres de section de niveau 2. Le compte Google et la déconnexion sont regroupés sous Compte ; la sauvegarde, l’export et la restauration restent sous Données, avec leur confirmation inchangée.

Les cartes de comptes partagent `AccountActivity` : divulgation native animée, trois dernières opérations et trois prochaines sur trente jours, avec états vides explicites et ouverture des éditeurs canoniques. Les filtres actifs d’Opérations sont des boutons de retrait indépendants, accompagnés d’une remise à zéro. Les objectifs affichent le montant réel restant, sans promettre de prochain virement ni de date d’atteinte.

Les récurrences présentent les états Actives / En pause / Terminées et leurs compteurs. La fin passée d’une série la classe Terminée, même si son booléen active est resté vrai. Un horizon de recherche sans occurrence ne prouve pas une fin ; son texte dit explicitement « Aucune échéance sur 12 mois ». L’aide sur les dates se déplie à la demande.

`FormOptions` réutilise AnimatedDetails pour la note, la banque/couleur et la personnalisation d’objectif. Les champs restent montés, y compris repliés, et sont soumis normalement. L’édition d’une note non vide l’ouvre initialement. `ValidatedForm` révèle les ancêtres details d’un champ invalide avant de lui donner le focus ; un événement partagé annule aussi un repli encore animé. Les formulaires de compte, de récurrence et d’objectif disposent d’Annuler, comme celui d’opération. Les états vides financiers utilisent le portefeuille déjà auto-hébergé ; recherche et erreurs gardent leur iconographie explicite, sans illustration de succès.

Sur demande utilisateur, les panneaux mobiles/tactiles n’ont plus de contour clair : `atelier.css` retire leur bordure extérieure, la surface et l’ombre assurant la séparation. Les contours des champs et leurs repères de focus restent inchangés. Les couleurs forcées conservent une bordure système pour distinguer le dialogue.

## Derniers états et options — 28 octobre 2026

Les états vides sont désormais possédés par `app/empty-state.tsx` : portefeuille local pour une absence de données financières, icône explicite pour une recherche vide, titre, explication et prochaine action. Accueil, formulaires sans compte, historique d’import et rapprochement utilisent ce composant. Aucune illustration de validation n’est utilisée pour une erreur ou un chargement.

`app/interface-feedback.tsx` possède ErrorMessage (icône d’alerte statique et texte immédiatement annoncé) et LoadingState (attente indéterminée, sans pourcentage inventé). Les messages restants héritent des mêmes espacements/tokens `.form-error`. Le chargement initial conserve le logo Pécule et un message lisible ; la réduction des animations supprime sa rotation.

Les options Jours fériés et fin de série de la récurrence partagent FormOptions ; les éléments qui fixent le rythme, le jour et la date de départ restent visibles. Une série avec fin ou calendrier personnalisé ouvre initialement ses options. `revealFormControl` possède l’ouverture et le focus des erreurs, y compris la fin antérieure au début. Les valeurs repliées sont conservées et soumises comme auparavant. La validation de bout en bout couvre cette erreur, sa correction et l’enregistrement replié, les imports vides et le rejet d’un fichier trop volumineux.
