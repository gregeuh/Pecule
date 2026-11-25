# Refonte visuelle « Liquid Glass chaleureux » — conception

Date : 25 novembre 2026. Validé en conversation avec le propriétaire du projet.
Maquettes de référence : artefact « Pécule Liquid Glass » (tous les écrans, trois teintes, iPhone et ordinateur).

## Intention

Le propriétaire trouve que Pécule « fait fait par une IA », est trop chargé et pas assez beau. Il veut un nouveau style **sur les mêmes écrans** : mêmes fonctions, même organisation, même navigation. Parmi six ambiances, il a choisi le mélange de :
- **Chaleureux** : police ronde (Nunito), tirelire comme mascotte, ton rassurant (« Ce qu’il vous reste jusqu’à la paie »), pastilles colorées ;
- **Verre** : fond de couleurs floues, cartes translucides ;
- **Liquid Glass d’Apple** : verre épais avec reflet sur le bord, barre d’onglets flottante en capsule avec l’onglet actif dans une bulle, bouton « + » rond séparé, boutons ronds en verre dans l’en-tête, feuilles en verre pour les fenêtres.

Il a rejeté le style « sobre » (blanc, lignes fines, minimal) : la refonte ne doit pas tendre vers l’austère.

## Objectifs

1. Appliquer le style des maquettes à tous les écrans : accueil, jour de paie et fin de période, opérations, ajout, recherche, budget (Équilibre, Récurrences), épargne, comptes, réglages, connexion et pages d’authentification, ordinateur (barre latérale en verre), page hors connexion.
2. **Thèmes de couleurs** dans Réglages, avec aperçu : Pêche, Lavande, Menthe, Océan (clairs ou mi-sombres), Nuit (sombre), et **Automatique** (le thème clair choisi le jour, Nuit quand l’appareil est en mode sombre). Choix par appareil, comme aujourd’hui.
3. **Animations** :
   - *Verre vivant* : la bulle de la barre du bas glisse d’un onglet à l’autre ; les éléments en verre s’enfoncent légèrement à l’appui ; les feuilles arrivent avec un léger rebond.
   - *Chiffres animés* : le disponible et les soldes défilent jusqu’à leur valeur à l’ouverture et quand ils changent ; les jauges se remplissent.
   - *Fond qui bouge* : les taches de couleur dérivent très lentement.
   - *Tirelire qui réagit* : elle saute et une pièce tombe quand on met de côté (jour de paie, versement) ; elle prend un air inquiet quand la fin de période est serrée ou négative.
4. Alléger : moins de cadres, de fonds et de petits textes ; un grand chiffre par écran quand il y en a un.

## Non-objectifs

- Pas de nouvelle fonction, pas de changement de navigation, de parcours ou de calcul.
- Pas de budget à deux, pas de changement de données ou de serveur.
- Pas de bibliothèque d’animation nouvelle si le système de mouvement existant suffit.

## Anti-objectifs (échec même si « ça marche »)

- Un texte ou un montant illisible sur le verre (contraste insuffisant), dans n’importe quel thème.
- Une application lente ou qui chauffe sur iPhone (trop de flou superposé, animations permanentes coûteuses).
- Des animations qui gênent : retard à la saisie, mouvement quand l’utilisateur a demandé « réduire les animations ».
- Un style qui retombe dans le générique (dégradés violets partout, ombres molles, phrases d’accroche).
- Mélange durable de deux styles : chaque lot doit laisser ses écrans entièrement dans le nouveau style.

## Contraintes

- Next.js 16 / React 19 ; styles en CSS (21 feuilles chargées dans `app/layout.tsx`, dont `reference.css` compilée) ; `next-themes` gère aujourd’hui `light` / `dark` / `system` avec `data-theme` sur `<html>` et la clé `pecule-theme`, lue aussi par la page hors connexion (`lib/offline-page.ts`) et l’écran de lancement.
- `app/theme.css` est le seul propriétaire de la palette ; `scripts/check-theme.mjs` (CI) vérifie que DESIGN.md reflète les jetons. Ce contrôle et DESIGN.md seront mis à jour, pas contournés.
- Les montants restent en chiffres tabulaires, jamais tronqués ; textes ≥ 12 px ; zones tactiles ≥ 44 px ; tests d’accessibilité axe (0 violation) et tests e2e de la CI (`mobile-viewport`, `desktop-reflow`, `financial-editors`, `design-finish`) doivent rester verts.
- `prefers-reduced-motion` : animations coupées ou réduites à des fondus. `prefers-reduced-transparency` et navigateurs sans `backdrop-filter` : verre remplacé par une surface opaque teintée.
  - *Limite connue (lot 1)* : Safari sur iPhone ne transmet pas encore « Réduire la transparence » (`prefers-reduced-transparency` n’est reconnu que par Chromium) et n’expose pas le mode économie d’énergie. Sur iPhone, le repli opaque ne s’applique donc qu’aux navigateurs sans `backdrop-filter`. Si le verre ou la dérive du fond pèsent sur un iPhone ancien, un réglage « Réduire la transparence » dans Pécule sera ajouté (lot 5).
- Masquage des montants : les chiffres animés et la tirelire ne révèlent rien quand les montants sont masqués.
- Images de lancement iPhone et couleur du manifeste à régénérer avec la nouvelle identité.

## Approches envisagées

1. **Par étapes (choisie)** : un socle commun, puis les écrans par groupes, chaque lot mis en ligne quand il est prêt. Risque maîtrisé et vérifiable lot par lot ; pendant quelques jours, certains écrans restent dans l’ancien style.
2. Tout d’un coup sur une branche : pas de mélange visible, mais une très grosse mise en ligne, longue à vérifier.
3. Couche par-dessus l’ancien style : la plus rapide, mais ajoute une couche de surcharge au lieu de nettoyer (contraire au lot de ménage en cours).

Le propriétaire a choisi l’approche 1.

## Découpage décidé

1. **Socle** : jetons des cinq thèmes dans `theme.css`, fond animé, matière verre (composant ou classes partagées), barre du bas en capsule avec bulle, bouton « + », boutons ronds d’en-tête, feuilles en verre, police Nunito, sélecteur de thème dans Réglages (avec Automatique), repli sans transparence. Intègre le lot de ménage (branche `lot-menage`) après vérification.
2. **Accueil et ajout** : disponible + tirelire, comptes, objectif, dernières opérations, cartes jour de paie et fin de période, feuille d’ajout ; chiffres animés et tirelire qui réagit.
3. **Opérations et recherche**.
4. **Budget, épargne, comptes** (jauges qui se remplissent).
5. **Réglages, connexion, ordinateur, hors connexion, images de lancement**, finitions d’animation et mise à jour de DESIGN.md / docs/design-system.md.

Chaque lot : branche, vérification locale avant/après (captures iPhone et ordinateur, trois thèmes au moins), tests CI verts, PR, accord du propriétaire avant fusion.

## Choix laissés au constructeur (et décisions prises par l’assistant)

- *Décision de l’assistant* : Nunito remplace DM Sans et Inter dans l’application ; Manrope n’est plus utilisée pour la marque, le logo « pécule » passe en Nunito 900.
- *Décision de l’assistant* : couleur d’action corail (#e9805f, dégradé #f29a7c → #e1704c) dans les thèmes clairs ; chaque thème garde ses couleurs de sens (vert confort, orange attention, rouge négatif) à contraste suffisant.
- *Décision de l’assistant* : les couleurs de compte choisies par l’utilisateur restent, appliquées en teinte du verre.
- *Décision de l’assistant* : « Automatique » = thème clair choisi (Pêche par défaut) + Nuit en mode sombre ; un utilisateur actuel en « Sombre » passe en Nuit, en « Clair » en Pêche.
- Au constructeur : valeurs exactes de flou, d’opacité et d’ombre par thème, à régler pour le contraste et la fluidité ; durées et courbes en réutilisant `motion.css` ; dessin final de la tirelire et de ses états.
