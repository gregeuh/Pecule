# Contrat de la migration Vercel

Source : demande du 26 octobre 2026 de déployer la base GitHub. Nouvelle demande : reproduire les fonctions et l’interface visibles de la version Vercel du 26 octobre. Sources observées : interface publique, feuille CSS et bundle client publics ; pas d’archive de code serveur récupérée.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
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
Les retours Google reviennent au formulaire ou aux réglages avec un message français connu ; aucun code d’erreur arbitraire n’est affiché. Le rattachement reste soumis à la même adresse e-mail vérifiée par Better Auth. Une réponse de chargement antérieure à une sauvegarde ne peut remplacer son résultat. Les conflits de révision refusent l’écriture et imposent un rechargement. Une session expirée propose de se reconnecter.

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
