# Ouverture de Pécule

## Parcours

La maquette clair/sombre est approuvée le12 novembre2026. La marque apparaît sur le fond Wallet, avec un unique reflet court ; le fondu laisse place aux comptes. Le chargement réel, et non un minuteur, détermine le moment où l’application est disponible.

`app/loading.tsx` applique la convention Suspense de Next.js pour envoyer la marque pendant l’attente serveur. Le budget personnel utilise `LaunchScreen` pendant son GET existant. Une erreur met fin au chargement comme une réussite et retrouve les contrôles de récupération existants. L’état de lancement ne contient aucune donnée personnelle.

Lors d’un démarrage autonome, le bootstrap marque le document avant son affichage. La sortie transparente de280 ms et la mise en place des comptes ne désactivent aucun contrôle ; aucune durée minimale n’est imposée. La réduction des animations retire le déplacement et le reflet et conserve un fondu de80 ms. Le visuel est aussi masqué explicitement si les animations sont neutralisées. Les restaurations de page, retours depuis une autre application et chargements de fond ne déclenchent pas une nouvelle ouverture.

## Images iPhone

La première image appartient à iOS et ne peut être animée par JavaScript. La métadonnée `appleWebApp.startupImage` déclare56 PNG :14 formats, portrait/paysage, clair/sombre. La sélection utilise dimensions CSS, facteur de pixels, orientation et thème système. Le document web respecte ensuite le thème enregistré dans Pécule ; iOS ne lit pas cette préférence locale avant son propre écran.

`npm run assets:launch` génère les images depuis le vrai composant, le vrai CSS et les deux fontes auto-hébergées. Les PNG sont versionnés : Vercel n’a pas besoin d’un navigateur pour compiler. Le manifeste contient l’empreinte des sources et les dimensions attendues. La CI refuse des images obsolètes ou de mauvaises dimensions. La génération vérifie aussi UTF-8 et le mot « pécule. » avant chaque capture.

L’application ne contrôle pas le cache d’installation ni le snapshot système d’iOS. Une PWA déjà installée peut conserver son ancien écran initial tant qu’iOS n’a pas actualisé cette configuration ; les nouveaux visuels sont bien servis dans le document et disponibles pour les installations actualisées. Aucune suppression des données du navigateur n’est nécessaire pour le code web.

## Preuves

Le test unitaire vérifie les56 signatures/dimensions PNG et l’empreinte de source. `tests/e2e/launch.mjs` monte les vrais composants avec un serveur HTTP QA isolé, sans identifiants ni budget réel : attente observable, fin immédiate, contrôles utilisables, erreur503, animation réduite, absence de rejeu après navigation/restauration. Chromium et WebKit couvrent les quatre cas. Le HTML Next.js réel contient aussi les56 liens attendus. Les références ordinateur/téléphone et axe vérifient les pages voisines. Ces essais ne remplacent pas une observation physique de l’écran d’installation d’un iPhone.
