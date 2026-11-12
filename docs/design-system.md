# Pécule — référence Wallet stabilisée

Direction validée : Revolut et Apple Wallet, couleurs franches, lecture dense, profondeur concentrée sur les comptes et les aperçus. Le site est un outil de gestion en français, principalement utilisé dans la PWA sur iPhone. Cette référence remplace les anciennes indications Atelier ; leur historique reste dans DESIGN.md.

## Propriétaires

| Sujet | Source canonique |
|---|---|
| Palette, densité des pages, surfaces, textes, logos | `app/wallet.css` |
| Profondeur, matière et aperçu | `app/wallet-depth.css` |
| Couleurs de compte, contraste et matière personnalisée | `lib/wallet-presentation.ts` |
| Durées et courbes | `app/motion.css`, consommées par `app/ui-motion.ts` |
| Présence, ouverture et sortie des dialogues | `app/use-modal-motion.ts` |
| Gestes et appui | `Pressable`, `SwipeTabs`, `useWalletGesture` |
| Dock et indicateur | `MobileDock`, `NavigationIndicator` |
| Aperçu en ajout d’opération | `OperationBalancePreview`, `lib/operation-balance-preview.ts` (lecture seule) |
| Formulaires, validation, attente | `ValidatedForm`, `FormField`, `SubmitButton` |
| États vides, erreurs, confirmations | `EmptyState`, `interface-feedback`, `BudgetNotice` |
| Contrats de parcours et règles métier | `UX-CONTRACT.md` et bibliothèques métier qu’il référence |

Étendre ces propriétaires, sans ajouter une nouvelle palette ou une feuille de surcharge par fonctionnalité. `reference.css` et les anciennes feuilles servent encore à la structure ; leurs anciennes valeurs ne sont pas la référence de couleur.

## Couleur et typographie

| Rôle | Clair | Sombre |
|---|---|---|
| Fond | #f2f3f7 | #090b10 |
| Surface de lecture | #ffffff | #171a22 |
| Texte | #15171d | #f3f5fa |
| Texte secondaire | #626b7b | #a5aec1 |
| Accent de texte et focus | #1d4dd5 | #8caaff |
| Action principale | #245af3, texte blanc | #245af3, texte blanc |
| Comptes | cobalt #245af3, or #f4ac36, violet #8248f4 et couleurs personnalisées | mêmes identités |

L’accent textuel clair est un peu plus foncé que l’action pour garder un contraste suffisant sur les fonds de survol. Rouge/orange/vert conservent leur sens négatif/attention/confort ; `budget-signal.css` possède ces signaux. Le violet identifie l’épargne, sans devenir une alerte. Les logos gardent leur couleur de marque sur la tuile lisible existante. Les illustrations de confirmation conservent leur palette d’illustration : elle ne définit pas celle des contrôles.

DM Sans pour le texte ; Manrope pour titres et grands montants, auto-hébergées. Titres de page 26 px, titres de cartes 18 px, corps 13–14 px ; les champs gardent au moins 16 px sur téléphone. Montants avec chiffres tabulaires. Ne pas tronquer un montant ; laisser les noms importants se replier ou donner accès à leur détail.

## Surfaces, rythme et profondeur

| Niveau | Usage | Traitement |
|---|---|---|
| Fond | document et séparations | couleur de fond, aucune ombre |
| Lecture | listes, cartes de compte gérées, objectifs, réglages | surface calme, séparateurs ; pas d’ombre décorative sur toutes les cartes |
| Interaction | pile Wallet, maintien, menus, aperçus | ombres `--depth-*` et lumière bornée ; fond inerte en retrait pour l’aperçu |

Cartes de lecture : rayon `--surface-radius` 16 px, padding `--surface-padding` 22 px sur ordinateur / 20 px sur mobile. Contrôles : rayon 12 px, hauteur principale 48 px, cible compacte de 44 px. Wallet : rayon 19 px ; panneaux : 24 px. Espacements usuels 8/12/16/20/24/32 px, avec groupes plus proches que les sections. Le document garde son défilement ; seuls les corps de panneaux et tableaux qui en ont besoin possèdent leur scroll.

Les listes d’opérations et de récurrences ne doivent pas être transformées en une collection de cartes à ombre. Les actions destructives restent distinctes des actions de saisie.

## Mouvement

| Rôle | Token | Durée |
|---|---|---|
| Pression | `--motion-press` | 110 ms |
| Feedback | `--motion-feedback` | 160 ms |
| État | `--motion-state` | 240 ms |
| Retour d’appui / swipe | `--motion-release` | 260 ms |
| Géométrie | `--motion-layout` | 320 ms |
| Panneau entrée / sortie | `--motion-panel-in/out` | 380 / 240 ms |
| Wallet entrée / sortie | `--motion-wallet-in/out` | 520 / 320 ms |

La courbe commune est `--motion-settle`, la sortie `--motion-exit`. Les ressorts existants gardent leur continuité et leur vitesse ; aucun effet au scroll n’est ajouté. Compression, soulèvement à 120 ms et maintien à 480 ms décrivent le geste, pas un délai de sauvegarde. Les montants ne sont jamais interpolés. Annulation, préférence modifiée, redimensionnement et page masquée nettoient les effets temporaires.

Avec « Réduire les animations », conserver les actions et leurs retours textuels/couleurs, retirer les translations, l’inclinaison et le flou. En mode masqué, montants, pourcentages, valeurs accessibles et barres d’épargne deviennent privés immédiatement, sans transition de disparition.

## Logos, formes et états

Tuiles des logos et catégories : 36 × 36 px, rayon 11 px. Image de marque 26 × 26 px en `object-fit:contain`, sans déformation ; illustration d’objectif et icône de compte gardent leurs variantes plus grandes. Un échec d’image retrouve l’icône de catégorie. Pas de halo décoratif autour de la marque.

Tout contrôle garde son libellé, son focus, son état désactivé et son attente. Les erreurs sont textuelles et liées au champ ; les états vides proposent une prochaine action. Pas d’animation de succès sur un état vide. Pas de nouveau service d’e-mail, d’authentification ou de permission implicite pour une finition visuelle.

## iPhone, thèmes et références

Breakpoint de navigation : 760 px. Défilement vertical natif, bords réservés à iOS, alternatives par boutons aux gestes, safe areas et zoom conservés. Les date/select restent natifs : leur popup et leur rendu relèvent du système, pas d’un calendrier inventé. Le clavier virtuel est simulé dans les tests ; la matrice sur iPhone réel est dans `docs/design-final-review.md`.

Les références anonymes sont conservées dans `docs/design-reference/` avec leur manifeste, date fictive et empreintes. Elles couvrent sept pages, vide, saisie, import, connexion et récupération. Les mises à jour passent par une capture puis une revue ; elles ne sont jamais réécrites automatiquement par les tests. Voir le guide dans ce dossier pour reproduire la capture sur un autre PC.

L’ajout d’opération montre sous le montant le solde actuel du compte et l’effet isolé de la saisie. Ce bloc utilise une surface de lecture, sans ombre ni comptage animé. Il n’est pas le disponible budgétaire et n’est pas une projection globale à la date future. Voir `docs/operation-balance-preview.md`.
# Suivi et saisie iPhone

Propriétaires additionnels : `AccountVerification` pour la preuve de rapprochement, `OperationSuggestions` pour les habitudes et la recherche dans l’historique, `QuickPhrase` pour le préremplissage en une phrase. Ils utilisent les surfaces, espacements, typographies et couleurs sémantiques Wallet existants. Les montants proposés et les aperçus sont masqués immédiatement en mode privé. La liste de suggestions est dans le flux, avec des boutons natifs et sans popup flottante. Le clavier peut masquer la phrase repliée, jamais le champ en cours d’édition. Le détail est documenté dans `docs/account-capture-confidence.md`.
# Anticipation, bilan et import

`ForecastOutlook` réutilise `ProjectionChart` et les `FormField` natifs ; `MonthlyBrief` prolonge `SpendingInsights`. Les propositions d’association restent dans le flux des lignes de l’import, sans popover supplémentaire. `BankLinkDetails` réutilise le disclosure animé canonique pour les données sources. Les styles associés appartiennent à `wallet.css` et `bank-import.css`, avec la palette sémantique existante. Les références et limites fonctionnelles sont dans `docs/outlook-import-brief.md`.

### Abonnements et saisie hors connexion
`SubscriptionOverview` réutilise `.card`, les listes Wallet et l’éditeur de récurrence de BudgetApp. `PendingOperations` réutilise AnimatedDetails, ValidatedForm et la confirmation canonique pour le retrait local. `public/offline.html` est une variante statique limitée, utilisant les contrôles natifs, les fontes et les thèmes Wallet ; elle ne monte aucun second système de dialogue. Propriété des calculs : `lib/subscriptions.ts` et budget.ts. Propriété de la reprise : `useOfflineQueue`, `offline-reconcile.ts`, `offline-store.ts`, BudgetSync et API revisionnée. Vérifications : tests unitaires et `tests/e2e/subscriptions-offline.mjs`.

### Lecture iPhone
L’échelle et les adaptations mobiles sont possédées par le dernier bloc mobile de `app/wallet.css` : corps/actions16, métadonnées14, labels15 px, navigation12/11 px. `--control-border` sépare les limites de saisie des simples lignes de liste. `public/offline.css` adapte ces couleurs pour son document autonome. La taille d’un bouton ne doit pas réduire un titre de compte ni les valeurs financières. Vérification : `tests/e2e/mobile-readability.mjs` à320/390/430 px, clair/sombre, Chromium/WebKit ; référence ordinateur en parallèle.

### Ouverture Pécule
`LaunchScreen`/`launch.css` adaptent la marque et les couleurs Wallet au streaming, au boot personnel et aux PNG iOS. Le composant est public, sans données financières. `LaunchTransition` possède uniquement la sortie décorative ; BudgetApp conserve la propriété de sa disponibilité et de ses erreurs. `lib/launch-bootstrap.ts` détermine le démarrage autonome et la restauration sans stockage local supplémentaire. Les images suivent le thème système d’iOS ; le document respecte ensuite le choix du thème Pécule. Vérification : `tests/launch-assets.test.mjs`, `tests/e2e/launch.mjs` et références Wallet.
