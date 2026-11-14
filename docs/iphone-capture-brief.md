# Pécule — parcours iPhone approuvé

Le 31 octobre 2026, l’utilisateur a validé la maquette iPhone en trois colonnes, avec versions claire et sombre : accueil centré sur les comptes, saisie rapide, même saisie avec clavier ouvert. Surface en mode Operate ; il utilise surtout une PWA sur iPhone. L’identité Atelier, les soldes réels et calculs existants sont conservés. Les chiffres de la maquette ne sont pas des données à introduire dans le produit.

## Résultat attendu

- Les comptes précèdent les autres informations. Un compte mène à son historique filtré ; l’ajout depuis cet historique reprend le compte. Le bouton d’ajustement reste séparé et explicite.
- Les opérations d’aujourd’hui, ou les dernières opérations en leur absence, et la prochaine échéance restent accessibles sans déplier les analyses. La revue quotidienne et les favoris existants restent disponibles plus bas.
- La création d’opération privilégie montant, libellé, favoris existants, compte et date. Dépense et revenu sont des choix radio natifs ; Virement ouvre le formulaire dédié, sans convertir implicitement une dépense. Catégorie, logo, note et enregistrement d’un favori sont repliés ensemble, tout en restant montés dans le formulaire.
- La saisie du montant utilise le clavier décimal demandé par `inputMode`, accepte virgule/point et conserve la validation du montant en centimes. L’édition d’une opération conserve son formulaire détaillé et ses actions de récurrence/suppression.
- Le dialogue conserve un fond opaque et le dock existant. La saisie rapide a un corps défilant et une barre d’enregistrement séparée. Les dimensions de `VisualViewport`, lorsqu’elles sont disponibles, bornent le dialogue au-dessus du clavier sans fixer la hauteur des pages de l’application. Les zones sûres et le mode de réduction des animations sont respectés. La réduction de zone visible replie seulement l’affichage des raccourcis de favoris ; les champs et valeurs restent présents.
- Sauvegarde, états occupé/hors ligne, conflits, révisions, réponses incertaines et brouillons restent possédés par BudgetApp, BudgetSync et ValidatedForm. Aucun calcul bancaire, schéma de budget ou identifiant d’opération n’est modifié par cette adaptation.

## Limites de vérification

Les tests de navigateur peuvent simuler les événements et dimensions de VisualViewport ; ils ne prouvent pas l’ouverture du clavier système ni le comportement d’une version précise d’iOS sur un appareil physique. Distinguer ces preuves dans le compte rendu. Les tests n’utilisent pas les budgets personnels.
