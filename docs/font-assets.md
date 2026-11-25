# Fontes locales

Les familles approuvées restent DM Sans (texte), Inter (titres et montants) et Manrope (marque). Le navigateur ne contacte aucun fournisseur de polices. `app/theme.css` possède les trois déclarations et les rôles ; `public/offline.css` est l’équivalent autonome pour la page hors ligne.

Inter est passé de 352 240 à 200 856 octets : sous-ensemble latin variable avec français précomposé, accents combinés, devises, ponctuation et signes utilisés par les montants. Les poids variables et fonctionnalités OpenType sont conservés. Les autres écritures disposent de la pile de repli système. La licence OFL est conservée dans `public/fonts/Inter-OFL.txt` ; la source est le projet Inter : https://github.com/rsms/inter.

Reproduction depuis le fichier complet déjà présent dans l’historique du dépôt :

```sh
git show 2d0282abcdb7b7f25515f617b11099a970e9ebc6:public/fonts/inter-variable.woff2 > /tmp/pecule-inter-original.woff2
# Dans un environnement Python dédié : pip install 'fonttools[woff]'
python scripts/subset-inter.py /tmp/pecule-inter-original.woff2 public/fonts/inter-latin.woff2
npm run build
```

Le fichier porte un nouveau nom pour ne pas réutiliser une ancienne réponse en cache. Préchargement, CSS normal, CSS hors ligne et service worker pointent vers le même nom. `scripts/build-offline.mjs` inclut les octets des trois fontes dans la version du cache. Après une modification de fonte : contrôler accents français, centimes, chiffres tabulaires, graisses 400/450/500, rendu des titres, page de connexion et hors-ligne, puis exécuter `test:e2e:typography`.

## Séparateur des milliers — 25 novembre 2026

`money()` sépare les milliers par une espace fine insécable (U+202F). Le sous-ensemble DM Sans ne contient pas ce caractère : chaque appareil le dessinait avec sa police système de secours, souvent sous 2 px (« 1250,00 € »). `app/theme.css` et `public/offline.css` déclarent donc, pour la famille DM Sans, une seconde face limitée à `unicode-range: U+202F` qui pointe vers `inter-latin.woff2`, lequel contient ce glyphe (0,182 em). Les textes en DM Sans utilisent ainsi le même séparateur que les montants en Inter, sans téléchargement supplémentaire (Inter est déjà chargé). Mesuré à 12–14 px : 0,12–0,13 em avant, 0,16–0,18 em après ; hauteurs de ligne inchangées.

## Nunito (refonte Liquid Glass, 25 novembre 2026)

`public/fonts/nunito-latin.woff2` est le fichier `nunito-latin-wght-normal.woff2` du paquet npm `@fontsource-variable/nunito` 5.3.0 (Nunito variable, graisses 200 à 1000, sous-ensemble latin), licence OFL dans `public/fonts/nunito-OFL.txt`. Le sous-ensemble contient les accents français, « € », « − », « ’ », « « » » et l’espace insécable U+00A0, mais pas l’espace fine U+202F de `money()` : comme pour DM Sans, une seconde déclaration `unicode-range: U+202F` sert ce seul caractère depuis Inter (`app/theme.css`).
Vérification : `python3 -c "from fontTools.ttLib import TTFont;c=TTFont('public/fonts/nunito-latin.woff2').getBestCmap();print(0x202F in c, 0xE9 in c, 0x20AC in c)"` → `False True True`.
La page hors connexion et l’écran de lancement gardent DM Sans et Manrope jusqu’au lot 5 de la refonte.
