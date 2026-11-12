# Lisibilité sur iPhone — 12 novembre 2026

## Constats vérifiés

Deux audits indépendants des composants et captures, complétés par un relevé des styles calculés sur les sept pages, ont identifié :

- Métadonnées de comptes, dates, catégories et légendes souvent à 9–11 px ; montants et titres de lignes parfois à 12–13 px.
- Journal repoussé par l’introduction, l’action d’ajout en doublon et l’analyse détaillée avant les opérations.
- Sélecteur de compte tronqué à 390 px dans la saisie, alors que le compte conditionne l’opération.
- Bordure de champ sombre presque confondue avec son panneau : champ #222735, bordure #2b303d, panneau #202531.
- Actions secondaires et sélection du CSV restées petites malgré des champs à 16 px.

## Corrections

La source canonique `app/wallet.css` définit les rôles mobiles : 16 px pour corps/actions, 14 px pour métadonnées, 15 px pour labels. La navigation conserve un rôle compact explicite : 12 px, 11 px sous 360 px, avec largeur et interligne adaptés. Les textes importants se replient ; montants, titres et couleurs des comptes conservent leur hiérarchie. Les textes de graphiques sont inclus dans la même échelle.

`--control-border` distingue une zone de saisie d’un séparateur de liste : #858fa1 clair, #748097 sombre. Le formulaire statique hors connexion adapte ces valeurs. Les champs natifs et leur focus restent canoniques.

Le journal précède le bilan et son explication détaillée. Sur téléphone, l’introduction est compacte et le + global assure l’ajout. Dans la saisie, compte/date précèdent les aides et occupent chacun toute une ligne ; les soldes avant/après deviennent deux lignes lisibles. Les noms des champs, callbacks, brouillons, confirmations et calculs sont conservés.

## Vérification

`tests/e2e/mobile-readability.mjs` utilise seulement la démonstration publique : sept pages, prévisions, détail de compte, édition d’opération, ajout, options et import. Largeurs 320/390/430, clair/sombre, Chromium et WebKit. Les assertions portent sur tailles calculées, limites du viewport, présence du journal, hiérarchie des totaux, contraste des bordures, compte complet et compte/date séparés. Aucun PUT ni budget personnel.

`tests/e2e/operation-balance-preview.mjs` couvre soldes, changement de compte, dates, brouillons, confidentialité et sauvegarde enchaînée en démonstration ; les références Wallet vérifient aussi les écrans ordinateur et axe. Ces essais WebKit ne remplacent pas un test matériel dans une PWA iPhone.
