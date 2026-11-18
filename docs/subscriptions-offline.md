# Abonnements et saisie hors connexion

## Abonnements

Récurrences → Vos abonnements affiche les règles de dépense classées « Abonnements ». Le loyer, l’énergie et les autres charges restent dans les récurrences générales. La prévision porte sur les douze prochains mois calendaires, à partir de demain : échéances connues, modifications d’occurrence, pauses, exclusions, fin de règle et référence des comptes sont respectées. Les débits enregistrés des douze derniers mois incluent l’historique bancaire ; ce total brut n’est pas présenté comme un coût net de remboursements.

Les paiements manuels sans récurrence sont regroupés par compte et identité de libellé/enseigne. Ils peuvent servir à créer une récurrence via le formulaire existant. Leur total passé n’est pas extrapolé en contrat annuel. Un paiement supérieur ou une prochaine échéance supérieure produit un signal à vérifier, sans modifier le tarif. Les signaux monétaires disparaissent en mode privé. « Gérer » ouvre l’éditeur canonique ; une résiliation réelle se fait auprès du fournisseur.

## Saisie sans réseau

Après une lecture ou une sauvegarde authentifiée, Pécule prépare sur l’appareil une fiche minimale : identifiant de propriétaire, nom de l’espace, identifiants/noms/dates de référence des comptes. Aucun solde, historique complet, mot de passe, jeton de session ni page personnelle n’est mis en cache. Le service worker conserve seulement le formulaire statique et ses ressources publiques. Réglages indique quand ce formulaire est prêt.

Une nouvelle opération peut être conservée dans l’application ouverte sans réseau. Après fermeture ou rechargement hors connexion, le formulaire statique permet aussi d’ajouter, corriger ou retirer une saisie. Le stockage IndexedDB doit confirmer la transaction avant de vider le formulaire. En cas de quota ou de stockage indisponible, le texte reste dans le formulaire. La liste masque les montants au départ. La limite est de 500 opérations locales par appareil. Ce stockage peut être effacé par le navigateur et ne remplace pas une sauvegarde.

Les soldes affichés restent ceux confirmés par le serveur ; les saisies locales portent une mention d’attente. Les virements, modifications d’écritures existantes et réglages exigent une connexion. Si une requête de création échoue alors que le téléphone croit encore être connecté, la même opération est conservée avec ses identifiants et, le cas échéant, ses intentions de favori/catégorie, plutôt qu’un budget complet périmé.

## Reprise et conflits

La synchronisation reprend dans Pécule ouvert, connecté au même utilisateur, dès le retour du réseau ; rouvrir l’application après une saisie dans le formulaire statique. Aucun envoi en arrière-plan iOS n’est promis. Chaque reprise relit le budget et sa révision, ajoute les identifiants stables manquants et respecte la garde atomique de révision. Une réponse perdue après validation est reconnue au prochain GET sans réajouter le paiement. Les écritures concurrentes déclenchent une nouvelle lecture, jamais un remplacement aveugle du budget.

Compte supprimé, référence modifiée, identifiant de contenu différent ou préférence modifiée restent en attente avec une correction explicite. L’examen d’une collision ouvre l’écriture serveur dans l’éditeur existant. Une intention de préférence peut être décochée pour conserver seulement le paiement. L’acquittement local compare la version envoyée à la version encore stockée : une correction faite dans un autre onglet pendant l’envoi n’est pas supprimée. Retirer une saisie locale ne supprime jamais une écriture déjà reçue par le serveur.

GET identifie le propriétaire authentifié et PUT vérifie `X-Pecule-Owner`. Un ancien onglet ne peut envoyer les opérations d’un utilisateur dans le budget d’un autre, même si les comptes ont les mêmes identifiants. La déconnexion ou une session expirée verrouille la fiche locale, sans détruire les saisies de leur propriétaire. Un jeton de génération empêche une préparation asynchrone antérieure de déverrouiller ce cache après déconnexion. Seule une nouvelle réponse authentifiée peut le préparer de nouveau.

## Vérification

`tests/subscriptions-offline.test.mjs` vérifie les calculs, pauses, prix d’occurrences, séparation du loyer, références, identifiants, intentions de préférence et propriété du transport. `tests/e2e/subscriptions-offline.mjs` utilise les vrais composants, IndexedDB et service worker avec un serveur HTTP local fictif : fermeture/rechargement hors réseau, soldes inchangés avant confirmation, réponse perdue, correction concurrente, référence changée, session différente et quota. Chromium et WebKit couvrent 390 px sombre et 1440 px clair. Ce dispositif n’utilise aucun budget personnel et ne prétend pas constituer un essai sur iPhone physique. Les références visuelles et contrôles axe couvrent aussi les parcours anonymes Next.js réels.
