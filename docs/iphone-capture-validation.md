# Vérification du parcours iPhone — 31 octobre 2026

## Périmètre livré

La maquette approuvée est déclinée dans les deux thèmes : comptes menant à leurs opérations, nouvelle saisie compacte, détails repliés, favoris réels, corps de dialogue défilant et actions séparées. Les comptes et montants illustratifs de la maquette ne sont pas ajoutés aux budgets. Les variantes de création, édition, versement, rapprochement et récurrence conservent leurs propriétaires de sauvegarde.

## Vérifications locales

- 135 tests unitaires réussis ; lint, compilation Next.js et TypeScript réussis.
- Audit statique strict : zéro erreur/avertissement. DESIGN.md : zéro erreur/avertissement.
- `iphone-capture.mjs` : Chromium, 320/390/1440 px, clair/sombre ; WebKit, 390/1440 px, clair/sombre. Navigation par compte, montants à virgule, brouillon et type restaurés, favori, saisie en série, validation et soldes attendus. Contrôles WCAG A/AA automatiques.
- La réduction de VisualViewport à 440 px avec décalage supérieur de 55 px est simulée dans ce test : le pied de formulaire reste dans les limites visibles et le corps conserve son défilement. Ce n’est pas une preuve de réception du clavier iOS ni un test sur appareil physique.
- `daily-capture.mjs` : quatre cas, favoris CRUD, saisie rapide, revue, rattrapage, correction guidée et confidentialité. Le favori utilisé depuis le rattrapage conserve la date sélectionnée et revient à la bonne journée après sauvegarde.
- `audit-fixes.mjs` : quatre cas pour brouillons, nettoyage après sauvegarde, réglages et totaux mensuels.
- `mobile-sizing.mjs` : huit cas, 320/390/600/740 px et deux thèmes, y compris 740 × 390. Pas de débordement horizontal, champs/contrôles natifs, cibles tactiles et accès au défilement.
- `menu-motion.mjs` : cinq cas Chromium, animations normales/réduites, continuité des menus, sortie opaque, brouillon et focus.
- `transaction-recurrence.mjs` : quatre cas, conversion dépense/revenu, garde de date future, annulation, récurrence liée et solde actuel inchangé.
- `manual-transfer.mjs` : quatre cas, deux écritures opposées, total invariant et brouillon préservé.

Tous ces parcours de navigateur locaux utilisent la démonstration et vérifient l’absence d’écriture réelle du budget personnel.

## Adaptation des tests au parcours approuvé

Les choix Dépense/Revenu des créations sont maintenant des radios natifs ; les éditions et récurrences conservent leurs listes natives. Le helper de test accepte les deux propriétaires. Les notes de création sont dans la divulgation commune, et non dans une deuxième divulgation. La nouvelle création utilise un en-tête compact et un corps interne défilant : le contrôle du défilement porte sur ce corps et sur les actions visibles. L’ancien éditeur détaillé conserve son comportement antérieur. L’accueil montre les opérations réelles d’aujourd’hui, avec repli sur les dernières opérations en l’absence d’écriture du jour ; il ne force plus artificiellement trois lignes.

## Cohérence avec DESIGN.md

| Contrat | Preuve | Résultat |
|---|---|---|
| Palette Atelier et noir neutre | Tokens existants dans `iphone-capture.css` | Conservés |
| Validation, brouillons et sauvegarde canoniques | QuickOperationForm → ValidatedForm → BudgetApp/BudgetSync | Variante de création, pas de second moteur de sauvegarde |
| Vert positif canonique | `--green` prioritaire face aux anciennes déclarations `!important` de référence | Contraste corrigé |
| Page mobile naturellement défilante | Contraintes de hauteur limitées au dialogue et à son corps | Conservée |
| Sortie opaque, réduction des animations | Propriétaire `useModalMotion` conservé | Tests réussis |

## Contrôles Vercel

Les identifiants de déploiement, vérification de l’alias et rapports distants sont conservés dans `outputs/iphone-capture`, ignoré par Git. Le contrôle connecté emploie exclusivement les comptes QA dédiés et ne prouve pas le clavier système d’un iPhone. Aucun budget personnel n’est utilisé.
