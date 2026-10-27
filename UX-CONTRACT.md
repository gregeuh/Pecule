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
