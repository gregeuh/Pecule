# Anticipation, imports réguliers et bilan mensuel

## Prévisions

Depuis Accueil → Prévisions → Anticiper mes soldes, choisir les comptes courants et espèces ensemble, ou un compte individuel (épargne comprise). Horizons : fin du mois, 30, 60 ou 90 jours. La projection indique le solde actuel, le solde à l’horizon, le minimum et les huit prochains mouvements connus. Tous les mouvements sont inclus dans le calcul, même si seuls les huit premiers sont listés. Un passage sous zéro est indiqué par texte, sans signal révélé lorsque les montants sont masqués.

`balanceOutlook` matérialise les récurrences et agrège les événements selon les mêmes règles que `accountBalance` : dates de référence, comptes ouverts dans le futur, opérations incluses dans la référence, échéances exclues et virements internes. Les paires de virements s’annulent dans une sélection contenant leurs deux côtés ; un virement vers l’épargne réduit bien la sélection des seuls comptes courants. Le dernier jour du mois, l’horizon « fin du mois » reste aujourd’hui, sans inventer une journée supplémentaire. Les réserves ne réalisent pas de mouvement bancaire et restent distinctes de la courbe des soldes. Aucun achat absent de Pécule n’est extrapolé.

## Import régulier

Le format peut être mémorisé au moment de confirmer un import. Seuls le compte, les noms/positions des colonnes, le mode de montant, l’ordre des dates et le choix des notes supplémentaires sont conservés. Le fichier, ses lignes et son nom ne font pas partie du profil. Le profil est réutilisé uniquement pour le même compte et le même en-tête normalisé, avec validation des index. Le mode historique/nouvelles opérations n’est jamais mémorisé. Décocher la mémorisation oublie le profil de ce compte lors de la confirmation ; aucune préférence n’est écrite avant cette confirmation.

Les suggestions d’association concernent les saisies manuelles sans récurrence, virement, objectif, import ou association antérieure : même compte et montant signé exact, date à trois jours près. Douze candidats maximum sont proposés ; ils ne sont jamais associés automatiquement et leurs lignes ne sont pas présélectionnées comme nouveaux paiements. La personne choisit d’associer ou d’ajouter. Une même opération ne peut recevoir deux lignes du même import. Le constructeur revalide la cible avant d’enregistrer et refuse un montant modifié ou une cible devenue indisponible.

Une association ajoute un `bankLinks` contenant libellé/date bancaires, référence, note, clé de déduplication et lot. Elle conserve id, montant, date, compte, catégorie, logo et note d’origine. La réimportation reconnaît ensuite la référence ou la clé bancaire, même lorsque le libellé manuel était différent. Le récapitulatif distingue ajouts et associations et montre les soldes actuels avant/après. Les associations seules ont un impact nul sur les soldes. Les données bancaires sont consultables dans le détail de l’opération. Les montants restent visibles dans ce parcours explicite de vérification, comme dans les champs financiers existants.

« Mes imports » regroupe aussi les lots contenant uniquement des associations. Annuler retire les nouvelles opérations de ce lot et les métadonnées associées de ce lot, sans supprimer les saisies manuelles d’origine. Les gardes de récurrence/virement/objectif restent actives ; un lot dont les écritures sont associées à un autre import exige de retirer cet autre lien d’abord. Les formats mémorisés sont des préférences et ne sont pas supprimés par l’annulation d’un lot.

Les champs sont optionnels pour les anciens budgets et inclus dans les sauvegardes JSON. Les clients courants déclarent leur prise en charge dans le transport. Une ancienne page conservée ouverte ne peut pas réécrire un budget contenant ces nouvelles métadonnées en les supprimant : la requête atomique est refusée, avec un message demandant de copier la saisie puis de recharger la page. Les conflits de révision gardent leur réponse 409 habituelle.

## Bilan

Opérations → Comprendre mes dépenses contient un bilan court : écarts des trois catégories ayant le plus changé, charges récurrentes déjà enregistrées, et avancement actuel des objectifs. Les remboursements réduisent les dépenses dans leur catégorie ; virements internes, revenus et épargne restent exclus selon les règles existantes. L’historique bancaire inclus dans une référence peut servir à analyser les dépenses : ce marqueur de solde ne signifie pas que l’achat n’a pas eu lieu.

Un mois en cours est comparé au même stade du mois précédent, borné au dernier jour de ce mois. Un mois terminé est comparé au mois précédent entier. Les catégories disparues participent aux écarts. En l’absence d’opérations dans l’un des deux mois, aucune tendance n’est affirmée. L’historique des six mois garde ses totaux mensuels ; les objectifs sont explicitement actuels et ne prétendent pas montrer un avancement passé. Montants et pourcentages sont masqués en mode privé.

## Preuves

`tests/outlook-review.test.mjs` compare chaque point de projection au solde canonique et couvre références futures, virements, historique, horizons bornés, mois partiels, remboursements, profils, associations, doublons et annulation. `tests/sync.test.mjs` vérifie le transport et l’erreur d’ancienne version. `tests/e2e/reminder-activity-storage.mjs` vérifie la garde atomique dans PostgreSQL embarqué, sans connexion à une base personnelle.

`tests/e2e/outlook-import-brief.mjs` parcourt les trois fonctions dans Chromium et WebKit, en 320/390/1440 px, clair/sombre et animations réduites : mapping, mémorisation, association explicite, solde avant/après, réimport, données associées, annulation, bilan, horizon/compte et confidentialité. CSV synthétiques uniquement, démonstration en mémoire et aucun PUT serveur. Les références Wallet et la suite d’export sans en-tête couvrent les parcours voisins.
