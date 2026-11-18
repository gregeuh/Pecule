# Comptes fiables, capture et iPhone

## État de vérification

L’accueil affiche l’état du compte au premier plan ; la liste et la fiche des comptes donnent accès à « Vérifier avec ma banque ». Sans rapprochement, aucune vérification n’est revendiquée. Un rapprochement d’aujourd’hui n’est valide que si le fingerprint financier, le solde et la référence concordent encore. Une période ancienne garde sa date et indique le nombre de mouvements enregistrés depuis, sans promettre que les oublis sont impossibles. Une correction rétrodatée ou une référence modifiée invalide la preuve. Une erreur de lecture affiche un état indisponible, jamais une validation verte périmée.

La comparaison réutilise le parcours bancaire existant : même date et solde comptabilisé, écart banque − Pécule, pointage, pistes de doublons et ajout d’une opération manquante. La confirmation exige toujours écart nul et vérification de toutes les écritures. Un ajustement manuel du solde ne crée pas de preuve de rapprochement.

## Capture assistée

Les habitudes sont calculées localement sur les 120 derniers jours, avec au plus trois propositions. Elles regroupent libellé normalisé, compte et sens ; les montants proposés viennent de la dernière date, puis de la dernière insertion à date identique. Elles excluent occurrences de récurrences, virements, historique inclus dans la référence, montants nuls, comptes absents et opérations futures. Sans texte saisi, deux occurrences sont nécessaires ; en tapant dans le libellé, une opération isolée peut être retrouvée. Le compte actuellement choisi est prioritaire dans le classement. Les montants sont masqués en mode privé.

Choisir une proposition préremplit montant, libellé, catégorie, logo et compte. La date sélectionnée reste conservée. La proposition est éditable et ne devient une écriture qu’après « Enregistrer ». Le brouillon précédent est conservé par le propriétaire existant ; la clé distingue la dernière opération utilisée et la phrase analysée afin que des propositions différentes ne partagent pas un ancien brouillon. Les favoris restent des raccourcis distincts, sans enregistrement automatique d’une habitude.

La divulgation « Saisir en une phrase » accepte par exemple « 12,50 déjeuner » ou « 12,50 déjeuner sur Compte du quotidien ». Montant en euros, espaces de milliers et virgule/point sont acceptés. Le suffixe « sur » exige un nom exact ou une banque identifiant un unique compte ; une ambiguïté produit une aide. Cette grammaire limitée n’interprète pas de dates ni une instruction arbitraire. Le sens vient du choix Dépense/Revenu. Un aperçu précède le bouton de préremplissage ; Entrée applique aussi sans soumettre le formulaire financier. Tout reste dans le navigateur, sans appel à une IA.

## iPhone et preuves

Les gestes à plusieurs doigts annulent appuis longs et swipes ; un zoom actif ne déclenche pas un geste applicatif. Les panneaux acceptent le pincement natif. Le viewport du zoom ne doit pas être confondu avec l’ouverture du clavier. Les boutons restent disponibles pour chaque geste, les contrôles sont repliables et les panneaux courts en paysage gardent leur corps défilant. Les animations réduites restent respectées.

Tests unitaires : `tests/account-verification.test.mjs`, `tests/capture-suggestions.test.mjs`. Parcours anonyme : `tests/e2e/account-capture-confidence.mjs` dans Chromium et WebKit, 320/390/1440 px, clair/sombre/réduit : rapprochement réel du budget de démonstration, invalidation, habitudes, recherche, phrase invalide/valide, absence d’écriture implicite, confidentialité, multitouch simulé, paysage, reflow équivalent à 200 % et axe. Les suites iPhone, gestes et références Wallet vérifient aussi les parcours partagés.

Ces essais utilisent uniquement la démonstration en mémoire et refusent les PUT serveur. Les viewports de clavier et les événements à plusieurs doigts sont simulés ; aucune manipulation d’un iPhone physique ni certification VoiceOver n’est revendiquée.
