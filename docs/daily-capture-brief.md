# Saisie quotidienne complète — six améliorations

Source : accord utilisateur explicite pour les six propositions du 30 octobre. Monde Atelier conservé ; mode Operate. L’objectif est de diminuer l’effort de saisie, puis de faciliter une revue volontaire, sans inventer des dépenses ni mesurer la qualité du budget par une série punitive.

1. Dernier compte mémorisé, date du jour, montant prioritaire et reconnaissance existante.
2. Favoris synchronisés dans le budget, créer/modifier/supprimer et préremplir une opération sans l’enregistrer silencieusement.
3. Rappel Web Push facultatif par appareil, permission à la demande, plage horaire France, test/désactivation et message neutre sur écran verrouillé. Hébergement Hobby : 24 cohortes UTC, chacune déclenchée quotidiennement, dans la limite officielle de 100 jobs ; précision horaire annoncée (documentation Vercel, usage-and-pricing du 15 juillet 2026). Aucune promesse de minute exacte.
4. Comparer le solde et retrouver les écritures manquantes avant une correction de référence explicitement assumée ; rapprochement existant réutilisé.
5. Enregistrer et continuer, date/compte conservés, revue des jours précédents et import existant avec doublons/confirmation.
6. Saisie de journée vérifiée par action explicite, statut invalidé après modification des données, dernier passage et historique de sept jours sans score punitif. Ce statut ne prétend pas être un rapprochement bancaire.

Propriétaires : BudgetApp/BudgetSync, ValidatedForm/FormField/FormDraftProvider, AnimatedDetails, BankImport, BankReconciliation. Nouveaux helpers purs capture.ts et composants liés au rituel. Budget JSON optionnel compatible avec les données existantes. Aucun chiffre bancaire personnel dans les notifications. Abonnements séparés par utilisateur/environnement en PostgreSQL. Refus d’origine, session obligatoire, endpoints push strictement limités aux fournisseurs publics reconnus, cron authentifié et dédoublonné par appareil/jour.

Vérification : unités financières et de signatures/DST, CRUD des favoris, saisie en série, brouillons/erreurs, revue/nouveau changement, correction guidée, import, permission refusée/non supportée, routes anonymes et cron sans secret, opt-in et retrait en compte QA, mobile/ordinateur, thèmes, clavier, réduction de mouvement et accessibilité. Tests de budgets fictifs uniquement. Deux passes visuelles et revue indépendante avant production.
