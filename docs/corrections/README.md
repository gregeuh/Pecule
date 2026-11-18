# Bilan des corrections du brief Pécule

Référence : PDF « Pécule : brief de corrections pour Codex », confirmé par le propriétaire. Les lots sont traités dans l’ordre P1, P2, P3, hygiène ; chacun a sa branche dédiée, ses contrôles et sa publication Vercel.

| Lot | Rapport | Branche |
|---|---|---|
| P1 — mobile | [Constats et corrections](P1.md) | `corrections/p1-mobile` |
| P2 — cohérence | [Montants, dates, icônes, marges, marque et cases](P2.md) | `corrections/p2-coherence` |
| P3 — ergonomie | [Édition, pagination, réserves et projection](P3.md) | `corrections/p3-ergonomie` |
| Hygiène | [Scripts, CI et configuration versionnée](HYGIENE.md) | `corrections/hygiene` |

## Décisions préservées

Les comptes restent en tête de l’accueil, selon le choix confirmé du propriétaire. Les calculs canoniques, le schéma, l’authentification et les montants entiers en centimes ne changent pas. L’arrondi des axes est un choix de dessin ; les soldes projetés restent exacts. Les règles existantes vers « Autres » restent conservées lorsqu’elles peuvent remplacer une proposition automatique.

## Constats non reproduits ou déjà traités

La version Vercel est déjà versionnée sur sa branche dédiée. La largeur du champ date et l’en-tête initial de l’éditeur ne débordaient plus dans les navigateurs de test de la version récente ; les contraintes sont durcies et les mesures conservées. Les derniers éléments étaient déjà visibles en fin de défilement ; le fond du dock et sa réserve sont renforcés. La carte d’objectif affiche déjà sa propre réserve, distincte du total ; le détail par objectif rend maintenant l’écart explicite.

## Preuves et limites

Chaque lot dispose des sorties TypeScript, lint, tests et compilation, de captures avant/après à 390 px en sombre (et clair), de mesures Chromium/WebKit et d’un identifiant de production avec alias contrôlé. Ces artefacts sont sous `outputs/brief-corrections`, exclus de Git pour ne pas publier de données de test ou de journaux d’environnement. Une archive de livraison contient les captures et résultats partageables.

Les tests connectés n’utilisent que des comptes QA dédiés. Le test `brief-sync.mjs` couvre le délai de rechargement de 31 secondes, l’échec hors connexion, la conservation de saisie et la sauvegarde unique après reconnexion. Aucun test de clavier matériel iPhone n’est revendiqué : les contrôles portent sur WebKit, le viewport et les mécanismes de formulaire. La validation finale sur l’appareil du propriétaire reste utile.
