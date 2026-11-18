# Continuité après enregistrement

Les maquettes validées se déclinent dans les propriétaires existants : `BudgetApp.save`, le panneau partagé, les lignes `OperationGesture` et les styles Wallet.

- Une nouvelle opération confirmée rejoint sa ligne si celle-ci est déjà visible. Aucun changement de page, filtre ou défilement imposé. L’ajout en série et les retours vers le pointage gardent leur parcours, sans objet flottant par-dessus le nouveau formulaire.
- Le virement affiche les deux comptes sélectionnés avec leurs soldes actuels. Après sauvegarde confirmée, une capsule du montant relie les deux cartes pendant 520 ms, puis le panneau se ferme. Les montants passent directement à leur valeur enregistrée, sans compteur. Une date future conserve les soldes actuels : aucune prétention de débit bancaire.
- La sauvegarde reste verrouillée pendant cette confirmation pour éviter les doubles envois. Une erreur d’animation ne transforme jamais une écriture réussie en erreur financière.
- Hors ligne ou réponse incertaine : conserver le parcours de synchronisation existant, sans animation de réussite.
- Réduction des animations : confirmation textuelle existante, aucun déplacement ni attente. Les effets sont annulés au redimensionnement, à la mise en arrière-plan et au changement de préférence. L’objet du journal disparaît aussi dès une nouvelle interaction ; il est inerte, ignoré des lecteurs d’écran et respecte le masquage des montants.

Vérification dédiée : `node tests/e2e/save-continuity.mjs` (démo uniquement, aucune écriture serveur). Vérifier aussi le ressenti sur iPhone réel : Chromium mobile ne reproduit pas le clavier et le compositeur iOS.

## Six gestes Wallet — 14 novembre 2026

- Le détail d’un compte conserve la surface partagée et révèle son activité après le début du déploiement ; celle-ci s’efface avant le retour vers la carte. Si la carte source est hors écran, la fermeture conserve le repli standard.
- Les actions d’opération se révèlent derrière la ligne, sans ajout de hauteur. Le doigt contrôle le déplacement, avec une résistance en fin de course ; relâcher confirme seulement l’ouverture du tiroir. Un déplacement vertical annule le maintien. Un geste vers la droite referme un tiroir ouvert ; sur une ligne fermée de l’accueil, il reste disponible pour revenir à l’onglet précédent. Le menu à trois points reste l’alternative tactile et clavier.
- Le maintien soulève l’aperçu depuis sa ligne, puis révèle les actions sur un second plan. Le relâchement ne choisit aucune action ; les confirmations destructives restent inchangées.
- Les onglets de l’accueil montrent la vue voisine pendant le geste. Cette vue reste inerte et masquée pour les lecteurs d’écran jusqu’à sa sélection. Les panneaux demeurent montés pour conserver leurs états. Annulation, changement de taille, passage en arrière-plan, zoom ou changement de préférence restaurent les attributs et styles d’origine.
- L’import confirmé remplace la sélection par un bilan ajouté/associé/non importé, conservé jusqu’à une action explicite. Les valeurs proviennent du lot confirmé, sans faux progrès. La sortie ouvre le compte et le mois le plus récent du lot. Les erreurs conservent la vérification et le brouillon.
- Le solde confirmé remplace son formulaire par les valeurs avant/après. Les nombres changent directement. Les vérifications et l’accord de correction restent obligatoires ; aucune écriture n’est ajoutée.

`SaveOutcome` possède les deux bilans : même animation, titre focalisé, résultat accessible, action pleine largeur. Il remplace la notification flottante pour ces deux cas. Les autres confirmations conservent `BudgetNotice`. Les animations réduites gardent les changements d’état et le résultat ; elles retirent les déplacements. Aucune bibliothèque n’est ajoutée.

Vérification : `npm run test:e2e:wallet-gestures`, sur démo uniquement, 390/1440 px, clair/sombre et réduction des animations. Le contrôle couvre les six parcours, le voisin inerte, le menu au maintien, le bilan, les filtres de sortie et l’absence de PUT serveur. Les essais automatisés ne remplacent pas un essai des gestes sur iPhone physique.
