# PECULE

Base du 23 octobre 2026 reprise le 26 octobre. Voir [REPRISE.md](REPRISE.md) pour la provenance, les vérifications et la distinction entre les hébergements Sites et Vercel.

Application personnelle de gestion de budget en français, pensée pour iPhone et ordinateur.

## Fonctionnement

- Chaque identité ChatGPT possède son propre budget. L’identité est fournie par Sites ; aucune identité client n’est acceptée par l’API.
- Les données sont conservées en D1, jamais dans le localStorage. La préférence de masquage des montants est locale à l’appareil.
- La révision du budget protège contre l’écrasement d’une modification provenant d’une autre session. Rechargement en arrière-plan toutes les 30 secondes quand l’onglet est visible et aucun formulaire n’est ouvert.
- La démonstration est calculée en mémoire. Elle n’est jamais enregistrée dans un nouveau budget.
- Les montants sont stockés en centimes entiers. Les virements produisent deux écritures liées et ne sont pas comptés comme revenus ou dépenses.
- Le disponible correspond aux soldes courants et espèces, moins les dépenses planifiées avant la prochaine paie (ou la fin du mois), moins les réserves d’épargne restantes. Les revenus futurs et les soldes d’épargne sont exclus.
- Le calendrier France inclut les onze jours fériés nationaux ; les spécificités régionales et calendriers employeur ne sont pas inclus. L’utilisateur peut choisir un calendrier sans jours fériés ou une date fixe.
- Les récurrences sont matérialisées automatiquement à la date prévue, après la date du solde de référence. Les montants doivent être rapprochés du relevé bancaire par l’utilisateur.
- L’import CSV comporte un aperçu, une association des colonnes, des validations et une détection des doublons exacts. Les banques avec colonnes débit et crédit séparées doivent être converties au modèle fourni.
- Les virements enregistrés et les objectifs ne déclenchent aucun mouvement bancaire. Pas de connexion bancaire automatique.

## PWA

Manifest, icônes PNG 192/512, icône Apple 180 et service worker sont fournis. Le service worker ne met jamais en cache les pages personnelles ni les réponses API. Hors connexion, il présente une page de secours ; les opérations nécessitent Internet.

Installation iPhone : ouvrir le site publié dans Safari, Partager, Sur l’écran d’accueil, Ouvrir comme app web puis Ajouter. Validation physique sur iPhone à réaliser avec le propriétaire.

## Développement et vérification

- `npm run dev -- --hostname 127.0.0.1`
- `npx tsc --noEmit`
- `node --test tests/budget.test.mjs`
- Publication via le guide Sites et `scripts/build-site.mjs` fourni par le plugin.

Les tests couvrent les jours fériés, dates de récurrence, mois courts, années bissextiles, idempotence, calcul du disponible, transferts, réserve d’épargne et CSV. Les essais locaux couvrent création, modification et conservation des données, ajout de compte, salaire au dernier jour ouvré, objectif et versement, import avec doublon et date invalide. L’API a été testée pour les réponses 401, 403, 409, 400 et la persistance. Le simulateur local dispose d’une identité fixe ; un essai avec deux identités réelles reste à faire lors de l’invitation de la deuxième personne.

Les données de test sont uniquement dans la base locale, exclue de la publication. La base de production démarre vide. Le site est privé, l’invitation du deuxième utilisateur est reportée à sa demande.
