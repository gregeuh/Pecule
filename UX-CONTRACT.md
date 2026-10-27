# Contrat de la migration Vercel

Source : demande du 26 octobre 2026 de déployer la base GitHub. Nouvelle demande : reproduire les fonctions et l’interface visibles de la version Vercel du 26 octobre. Sources observées : interface publique, feuille CSS et bundle client publics ; pas d’archive de code serveur récupérée.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | app/transaction-selection.tsx | UX-CONTRACT.md | page / tous les résultats filtrés | tests/e2e/bank-tools.mjs |
| Form | app/validated-form.tsx, FormField, .field | UX-CONTRACT.md | create / edit / auth | Constraint errors in French, focus and submit |
| Select/Listbox | native select | UX-CONTRACT.md | platform-owned popup | Keyboard and chosen value |
| Date | native date input | UX-CONTRACT.md | platform-owned calendar | Date bounds and keyboard |
| Scrollbar | app/reference.css | DESIGN.md | document / modal | Visible and usable |
| Toast | BudgetApp toast | UX-CONTRACT.md | success / error | Live region |
| CRUD | BudgetApp save and API revision check | app/api/budget/route.ts | create / edit / delete confirmation | Unit tests and demo browser workflow |


La connexion et la création de compte aboutissent à /. La déconnexion nécessite une action explicite. Les erreurs conservent le formulaire. La démo reste accessible sans compte.

Les tables pecule_git_* sont séparées des anciennes tables. Les previews utilisent pecule_preview_*. Aucun compte ou budget antérieur n’est migré automatiquement. Les mots de passe sont traités exclusivement par Better Auth.

Les pages et réponses personnelles ne sont jamais mises en cache. Les contrôles natifs de date et de sélection conservent leurs interactions système. Les formulaires partagent une validation explicite en français et bloquent les envois invalides.

## Répartition 50/30/20
La fonction lib/spending-plan.ts est la source des calculs : revenus réellement reçus et prévus du mois, ou montant manuel ; virements internes exclus ; un virement courant/épargne complet compte une fois et les retraits soustraient l’épargne. Les remboursements diminuent les catégories de dépense sans augmenter le revenu. Aucun solde initial ou réserve d’objectif ne compte comme nouvelle épargne. Les centimes des trois repères totalisent exactement le revenu. Les préférences sont incluses dans le budget validé et synchronisé.

## Logos et apparence
Les 3 470 entrées du catalogue et leurs logos sont stockés dans le dépôt. Les noms non reconnus ou ambigus conservent une icône générique. Un choix manuel de logo ou de catégorie prime sur la suggestion. Le thème est local à l’appareil et son mode automatique suit les changements système. Les mots de passe et données personnelles ne sont jamais dans ces préférences locales.

## Première utilisation
Le parcours propose comptes, salaire, charges, objectifs puis récapitulatif. Les étapes facultatives sont passables. Le budget est envoyé uniquement après validation finale et authentification. Les montants de démonstration ne sont jamais copiés dans le nouveau budget.

## Connexion et synchronisation
Les retours Google reviennent au formulaire ou aux réglages avec un message français connu ; aucun code d’erreur arbitraire n’est affiché. Le rattachement reste soumis à la même adresse e-mail vérifiée par Better Auth. Une réponse de chargement antérieure à une sauvegarde ne peut remplacer son résultat. Les conflits de révision refusent l’écriture et ouvrent une résolution conservant la saisie, avec relecture de la version serveur. Une session expirée propose de se reconnecter.

## Import bancaire CSV
Le composant app/bank-import.tsx et lib/bank-import.ts remplacent l’import local de BudgetApp. Lecture du fichier sur l’appareil, 2 Mo et 5 000 lignes maximum ; aucun stockage local persistant du relevé. UTF-8, Windows-1252 et UTF-16 avec BOM ; séparateur automatique ou manuel, en-tête sélectionnable, dates françaises ou américaines explicitement choisies. Montants signés ou colonnes débit/crédit ; euros uniquement ; lignes futures ou malformées exclues. Un fichier contenant plusieurs comptes doit être séparé.

Chaque ligne et son diagnostic sont accessibles par pages de 40. Les références déjà présentes sont exclues. Sans référence, les occurrences déjà comptabilisées sont dédupliquées par compte/date/libellé/montant ; les répétitions et rapprochements possibles sont décochés et soumis au choix explicite. Pas de rapprochement automatique des virements. Le récapitulatif affiche compte, période, crédits, débits et impact sur le solde, puis demande confirmation. Aucune écriture avant cette étape. Les échecs de sauvegarde conservent l’aperçu et les choix.

Les nouvelles opérations doivent suivre la date de référence. Le mode historique accepte les opérations jusqu’à cette date avec balanceIncluded=true : elles enrichissent l’historique sans modifier les soldes. Les références, lots et indicateurs historiques sont conservés par validation et sauvegarde JSON, ainsi que lors d’une modification d’opération. Les références bancaires sont uniques par compte côté serveur.

Les colonnes non associées sont conservées dans les notes avec leur intitulé lorsque la case visible correspondante est cochée (valeur initiale : cochée). La note associée et la référence bancaire unique gardent leurs rôles existants. La divulgation « Données reprises » expose le résultat avant l’enregistrement ; désactiver l’option conserve la note explicitement associée. Si la note complète dépasse 1 000 caractères, la ligne est invalide avec une action de correction ; aucun texte n’est tronqué. Les tests `tests/import.test.mjs` vérifient la conservation après validation JSON et les modes débit/crédit et historique existants.

## Code couleur du disponible

Règle validée par l’utilisateur : rouge « Négatif » si le disponible est inférieur à zéro ; orange « Attention » entre zéro et moins de 10 € par jour ; vert « Confort » à partir de 10 € par jour. `lib/available-signal.ts` possède cette classification de présentation. Le calcul existant de `overview` reste la source du disponible net et des jours de la période choisie : jusqu’à la veille de la prochaine paie, ou jusqu’à la fin du mois selon l’horizon et les données existants. Les revenus futurs et les comptes d’épargne n’augmentent pas ce disponible.

La comparaison est effectuée en centimes avant l’arrondi du montant affiché par jour : `available < 1000 × days` reste orange, l’égalité est verte. Un disponible négatif est toujours rouge, même si l’allocation quotidienne existante est ramenée à zéro. Ce repère ne modifie ni les soldes, ni les réserves, ni les opérations.

Le signal est présenté par la couleur du montant, une petite icône et un libellé discret à côté du titre. La carte conserve une surface neutre, identique pour les trois états. L’explication est portée par le nom accessible et le titre du libellé, sans paragraphe d’alerte dans la carte. L’utilisateur qui masque les montants masque aussi le statut et son explication. Un chargement en erreur ou l’absence de compte courant/espèces ne produit pas un diagnostic de confort. Les tests `tests/available-signal.test.mjs` couvrent les frontières et les horizons ; `tests/e2e/available-signal.mjs` vérifie les trois couleurs du montant, le fond neutre invariant, l’absence de badge encadré, leurs contrastes, les deux thèmes, le mobile, le masquage et les couleurs forcées, exclusivement en démonstration.

## Récupération P1

Le brouillon d’import appartient à BudgetApp et reste uniquement en mémoire de la page. Fermer par Échap, la croix ou le fond conserve fichier, compte, association de colonnes, sélection, pagination et étape. « Reprendre l’import » le retrouve ; la confirmation finale doit être cochée à nouveau. « Abandonner le brouillon » et un import réussi l’effacent. Un avertissement de fermeture de page protège le brouillon ; aucun relevé n’est écrit dans localStorage/sessionStorage. Le rechargement détruit ce brouillon.

« Mes imports » regroupe les opérations encore présentes par importBatch, affiche comptes, période, nombre et variation cumulée des soldes. Annuler demande confirmation et supprime uniquement ce lot, y compris ses opérations modifiées depuis. Les opérations historiques n’affectent pas les soldes de référence. Un lot lié ensuite à un virement, une récurrence ou un objectif est bloqué pour éviter une suppression partielle.

Une réponse 409 conserve la mutation et relit la version serveur. lib/budget-merge.ts réunit les entités distinctes à partir de la version de départ ; un même compte, opération, objectif, récurrence ou groupe de préférences modifié des deux côtés demande un choix explicite entre deux versions. Les entités financières restent atomiques, y compris suppression contre modification. La validation canonique bloque toute combinaison invalide. Une nouvelle concurrence revient au même parcours ; les formulaires d’origine restent présents et inertes pendant la résolution. Les lectures en arrière-plan sont suspendues pendant l’édition et la récupération. La sauvegarde confirmée par le serveur est seule annoncée comme enregistrée.

## Réinitialisation du mot de passe

Better Auth possède les jetons, leur expiration à 30 minutes, leur usage unique et la révocation des sessions après changement. Les formulaires /forgot-password et /reset-password réutilisent les styles d’authentification et ne conservent aucun mot de passe en stockage persistant. Le jeton du lien est retiré de l’URL après lecture ; la page n’inclut aucun service tiers. Le résultat d’une demande ne révèle pas l’existence d’un compte. L’activation nécessite RESEND_API_KEY et AUTH_EMAIL_FROM côté serveur ; en leur absence, le lien n’est pas proposé à la connexion et la route explique l’indisponibilité. Aucun envoi en production n’est déclaré validé tant qu’un fournisseur et une adresse vérifiée ne sont pas configurés.

## Assistance budgétaire P2

Les préférences categoryRules, dailyComfortCents et categoryLimits sont optionnelles et validées avec le budget ; les anciens budgets conservent leur comportement. Le seuil de confort reste 10 €/jour par défaut et peut être modifié dans les réglages ; le rouge garde la priorité si le disponible est négatif. Les alertes sont des informations dans l’application, jamais des e-mails ou notifications système. Un seuil de catégorie est atteint à l’égalité ; les remboursements le réduisent. Le masquage des montants masque les alertes et la longueur des barres d’analyse.

lib/category-rules.ts possède les règles mémorisées : enseigne identifiée ou libellé normalisé exact, séparément pour entrées et dépenses. La case « Mémoriser la catégorie » exige un choix explicite ; elle crée/remplace une règle sans modifier l’historique. La catégorie manuelle d’une opération et celle explicitement fournie par le CSV priment. Seuls les imports sans catégorie utilisent la règle puis les suggestions existantes. Les règles, limitées à 100, se retirent dans les réglages après confirmation.

lib/recurring-suggestions.ts ne crée aucune écriture. Il propose des dépenses de même montant sur un même compte, après au moins trois dates distinctes avec cadence hebdomadaire, mensuelle ou annuelle, et refuse les virements et écritures déjà associées. Les règles existantes, même en pause, suppriment les propositions équivalentes. « Vérifier » ouvre le formulaire canonique prérempli ; seule sa sauvegarde crée la règle, avec une date de début future pour éviter de recompter l’historique. Il s’agit d’un indice à vérifier, pas d’une certitude bancaire.

lib/spending-insights.ts possède l’analyse des opérations réellement présentes, jusqu’à aujourd’hui : comptes courants/espèces, dépenses nettes des remboursements dans les catégories de dépense, hors revenus, virements et groupe épargne. Les crédits sans catégorie de dépense ne sont pas imputés en remboursement. Le détail repliable « Comprendre mes dépenses » dans Opérations montre six mois, le mois précédent et les catégories par tranches de huit. Le mois courant incomplet et les limites d’un historique incomplet sont explicités. Un budget négatif par catégorie (remboursements supérieurs aux dépenses) reste visible en valeur, sans barre négative trompeuse.

BudgetPreferences possède les réglages et réutilise ValidatedForm/FormField ; RecurringSuggestions et SpendingInsights possèdent les listes bornées ; BudgetAlerts présente les seuils atteints dans l’accueil sur une surface neutre. Les préférences restent soumises à la même résolution de conflits atomique que les autres réglages.

## Rapprochement bancaire, modification groupée et virements importés

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Reconciliation | app/bank-reconciliation.tsx, lib/bank-reconciliation.ts | Compte et opérations validés | comparaison / pointage / historique | tests/bank-tools.test.mjs et tests/e2e/bank-tools-connected.mjs |
| Bulk edit | app/bulk-edit.tsx, lib/bulk-transactions.ts | Validation du budget | catégorie / compte / les deux | tests/bank-tools.test.mjs et tests/e2e/bank-tools.mjs |
| Transfer matching | app/transfer-matching.tsx, lib/transfer-matching.ts | Deux écritures opposées confirmées | proposition importée / choix manuel / dissociation | tests/bank-tools.test.mjs et tests/e2e/bank-tools-connected.mjs |

Le rapprochement compare le solde comptabilisé à une date comprise entre la référence du compte et aujourd’hui. Les opérations futures à cette date et l’historique balanceIncluded sont exclus du solde pointé. Une confirmation exige un écart exactement nul, le pointage de toutes les écritures de la période et une confirmation explicite de la référence/relevé. Aucune écriture d’ajustement n’est créée. L’ajout ou la correction d’une opération manquante revient au rapprochement avec le solde bancaire saisi et les choix conservés en mémoire. La fermeture du panneau conserve ce brouillon pendant la vie de la page ; le rechargement est protégé par un avertissement lorsque le solde bancaire a été saisi, sans stockage local persistant.

Chaque confirmation conserve date, solde bancaire, date de confirmation et empreinte SHA-256 de la référence et des écritures financières de la période. Les cinquante dernières vérifications sont conservées dans le compte. L’empreinte inclut les identifiants, dates et montants, et détecte aussi deux changements dont les montants s’annulent. Les catégories, notes et associations de virements ne modifient pas le solde et n’invalident pas ce contrôle. Une modification passée d’écriture, de compte ou de référence demande une nouvelle vérification ; l’historique précédent reste consultable et n’est jamais présenté comme une garantie actuelle.

Les opérations sont paginées par quarante. Le mode de sélection expose une case par ligne et une case de page avec état partiel. « Tous les résultats modifiables » désigne explicitement tous les résultats des filtres courants, y compris les pages suivantes. Changer les filtres réinitialise la sélection. Filtres et sélection restent en mémoire : ils portent sur un budget personnel chargé comme document complet, ne doivent pas placer de libellés/recherches bancaires dans une URL, et ne sont pas partageables. Les virements liés et les versements d’objectifs sont exclus. Une échéance récurrente est modifiée sans changer la règle. Les montants, dates, notes et métadonnées d’import restent inchangés. Le déplacement préserve le caractère historique ; une incompatibilité de date de référence ou une référence bancaire déjà présente bloque le lot entier. L’aperçu affiche les changements et leurs effets par compte avant confirmation, puis une seule écriture de budget est soumise au contrôle de révision existant.

Les propositions de virements utilisent des écritures importées, de comptes distincts, aux montants strictement opposés dans un délai choisi (trois jours par défaut, zéro à sept jours). Le calcul conserve les ambiguïtés ; aucune association automatique et aucun critère de libellé ne prouvent un virement. Le mode manuel permet des dates éloignées et des écritures non importées. Les frais ou différences de montant nécessitent des écritures distinctes ; ils ne sont jamais absorbés. Les dates, libellés, références, notes, lots et indicateurs historiques sont conservés. L’association change seulement la catégorie en Virement et ajoute un lien commun avec la catégorie d’origine de chaque écriture. Les soldes restent identiques ; les deux côtés sont exclus des revenus/dépenses et un mouvement courant/épargne compte une fois, à la date de l’écriture d’épargne, y compris à cheval sur deux mois. La dissociation, après confirmation, retire le lien et rétablit exactement les catégories d’origine en conservant les deux opérations.

L’API vérifie l’intégrité de chaque virement : deux écritures non nulles, opposées, sur des comptes distincts, sans règle récurrente associée. Une résolution de conflit qui ne conserverait qu’une moitié est invalide. Les suppressions existantes retirent les deux côtés ensemble et l’annulation d’un import contenant un virement reste bloquée tant que l’association n’est pas dissociée. Ces parcours réutilisent les dialogues, ValidatedForm/FormField, confirmations et notifications de BudgetApp. Les contrôles de date et de choix restent natifs, avec interface système acceptée.


## Apparence Atelier

La palette vert profond / abricot / lavande est commune aux six vues, aux réglages, à l’authentification et aux parcours bancaires. Elle ne change ni navigation, ni états, ni données. Le sélecteur partagé ThemePicker conserve clair / sombre / automatique, la confidentialité garde son comportement. L’abricot identifie des échéances, sans remplacer le signal financier du disponible. `app/atelier.css` est le propriétaire des adaptations visuelles ; `app/reference.css` conserve la structure. Les surfaces des champs et les icônes suivent les deux thèmes, les couleurs personnalisées enregistrées ne sont pas réécrites.

## Navigation et accueil mobiles

Source : validation utilisateur des améliorations 1 et 2 le 27 octobre 2026. Le dock comporte quatre boutons de navigation (Accueil, Opérations, Comptes, Plus) et un ajout distinct. Plus ouvre le dialogue partagé avec les destinations secondaires ; aucune fonction n’est retirée. La destination secondaire courante est indiquée dans le dialogue, et Plus reste visuellement actif. Échap, croix et fond ferment le dialogue et rendent le focus au déclencheur ; choisir une destination ferme le dialogue et place le focus sur son titre. L’arrière-plan est inerte pendant un dialogue. Le bouton d’ajout garde le parcours d’actions existant.

Sur mobile, le détail du calcul est accessible par le bouton textuel « Comprendre mon disponible » ; aucun calcul ni signal n’est changé. Les opérations récentes précèdent comptes et objectifs, avec trois lignes et Tout voir. L’absence d’échéances possède un état explicite. Les montants masqués restent masqués dans l’accueil et le détail. Les interactions et zones sûres sont vérifiées par tests/e2e/mobile-navigation.mjs en démonstration, sans écritures personnelles. La disposition ordinateur est conservée.


Le 27 octobre, l’utilisateur demande un dock qui se rétrécit à la descente et s’agrandit à la remontée. Le format compact conserve les quatre destinations et l’ajout, avec noms accessibles et cibles tactiles inchangées dans leur disponibilité. Les micro-inversions et rebonds aux limites ne doivent pas faire osciller le dock. En haut de page, au focus clavier et pendant un dialogue, la navigation est complète. La réduction des animations supprime la transition, sans modifier les accès. `tests/e2e/mobile-navigation.mjs` vérifie descente, remontée, micro-inversion, retour en haut et navigation clavier dans les deux thèmes.
