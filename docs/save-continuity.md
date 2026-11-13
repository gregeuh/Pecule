# Continuité après enregistrement

Les maquettes validées se déclinent dans les propriétaires existants : `BudgetApp.save`, le panneau partagé, les lignes `OperationGesture` et les styles Wallet.

- Une nouvelle opération confirmée rejoint sa ligne si celle-ci est déjà visible. Aucun changement de page, filtre ou défilement imposé. L’ajout en série et les retours vers le pointage gardent leur parcours, sans objet flottant par-dessus le nouveau formulaire.
- Le virement affiche les deux comptes sélectionnés avec leurs soldes actuels. Après sauvegarde confirmée, une capsule du montant relie les deux cartes pendant 520 ms, puis le panneau se ferme. Les montants passent directement à leur valeur enregistrée, sans compteur. Une date future conserve les soldes actuels : aucune prétention de débit bancaire.
- La sauvegarde reste verrouillée pendant cette confirmation pour éviter les doubles envois. Une erreur d’animation ne transforme jamais une écriture réussie en erreur financière.
- Hors ligne ou réponse incertaine : conserver le parcours de synchronisation existant, sans animation de réussite.
- Réduction des animations : confirmation textuelle existante, aucun déplacement ni attente. Les effets sont annulés au redimensionnement, à la mise en arrière-plan et au changement de préférence. L’objet du journal disparaît aussi dès une nouvelle interaction ; il est inerte, ignoré des lecteurs d’écran et respecte le masquage des montants.

Vérification dédiée : `node tests/e2e/save-continuity.mjs` (démo uniquement, aucune écriture serveur). Vérifier aussi le ressenti sur iPhone réel : Chromium mobile ne reproduit pas le clavier et le compositeur iOS.
