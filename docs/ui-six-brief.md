# Pécule — six évolutions UI/UX du 30 octobre 2026

Mode : Operate. Extension de l’identité Atelier validée, sans remplacement des couleurs ou des règles financières. DM Sans / Manrope, vert #235746, abricot #f5c39e, lavande #e2d6f5, fond clair #f7f5f1 et sombre #0d0e0e.

1. **Compositions par usage** : registre chronologique pour Opérations ; lignes de récurrence comparables ; projets d’épargne plus illustrés, avec une première carte plus ample. Conserver tous les états et toutes les actions.
2. **Accueil mobile court** : disponible, prochaine échéance réelle et dernières opérations ; comptes, objectif, répartition, calendrier et projection dans « Votre budget en détail ». Les revenus futurs restent explicitement hors disponible. Ordinateur : deux colonnes existantes, détail ouvert.
3. **Formulaires hiérarchisés** : montant dominant pour l’opération, sections sémantiques par tâche, aides près des champs. Les brouillons, annotations d’erreur, limites natives, valeurs par défaut et calculs restent canoniques.
4. **Actions explicites** : Modifier / Mettre en pause / Reprendre visibles ; suppression éloignée des actions sûres et toujours confirmée par le dialogue existant. Aucun geste caché comme seul accès.
5. **Filtres mobiles** : recherche toujours visible, bouton Filtrer avec nombre de critères, panneau canonique unique ; copie locale modifiable, Appliquer pour valider, fermer pour annuler. Les critères actifs restent retirables dans la liste. Ordinateur : contrôles directs.
6. **Finitions tactiles** : cibles de 44 px minimum, états pressés et focus cohérents, aucune nouvelle animation décorative. Préserver les mouvements existants, la réduction des animations et les panneaux mobiles opaques sans cadre blanc.

## Sources consultées

- Apple HIG, Search fields : https://developer.apple.com/design/human-interface-guidelines/search-fields — recherche proche du contenu, affinement du périmètre et critères visibles.
- Apple HIG, Sheets : https://developer.apple.com/design/human-interface-guidelines/sheets — une tâche ciblée, un panneau à la fois, distinction Annuler / Terminer.
- Apple HIG, Buttons : https://developer.apple.com/design/human-interface-guidelines/buttons — hiérarchie et libellés d’action.
- Nielsen Norman Group, Progressive Disclosure : https://www.nngroup.com/articles/progressive-disclosure/ — fonctions fréquentes d’abord, options secondaires à la demande.

Sources récupérées le 30 octobre, copies de travail dans outputs/ui-six/inspiration (hors Git). Aucun visuel de produit tiers n’est repris.

## Propriétaires et vérification

Palette/finitions : app/atelier.css. Formulaires : ValidatedForm, FormField, FormOptions, FormDraftProvider. Présence/focus : BudgetApp/useModalMotion. Divulgations : AnimatedDetails. Filtres : composant partagé OperationFilterControls + TransactionFilters, état confirmé de BudgetApp. Toast : BudgetNotice. Aucun nouveau moteur de composants.

Vérifier chaque point en clair/sombre, 320–1440 px, Chromium/WebKit ; recherche vide, application/annulation/réinitialisation des filtres, retrait des critères, reprise et sauvegarde de brouillon, suppression annulée, pause/reprise, confidentialité, détails d’accueil, réduction des animations, clavier et textes longs. Tests en démonstration isolée, sans PUT serveur ni budget personnel. Deux passes visuelles bornées et revue indépendante avant publication.
