# Fluidité des interactions de Pécule

Demande du 1er novembre 2026 : étendre la fluidité du dock validé au reste de l’application.

## Ce qui change

- Contrôles partagés : pression courte et retour décéléré, mêmes transitions de couleur et de focus dans les comptes, opérations, réglages, authentification et formulaires.
- Sélections : états des segments, filtres et types de saisie harmonisés. Les flèches de divulgation suivent le même rythme, y compris pendant le repli.
- Options, détails et outils : ressort amorti avec continuité de vitesse lors d’une inversion. La destination suit une modification de hauteur du contenu imbriqué. Les styles provisoires disparaissent au repos ; une validation ouvre immédiatement les champs nécessaires.
- Résultats : fondu bref à l’application des filtres, au changement de mois et de page d’Opérations, et au filtrage des récurrences. Pas de délai des données ni de mouvement à chaque frappe de recherche.
- Projection : le repère et le point glissent entre les jours. Les nombres, positions finales et calculs restent exacts.
- Illustrations : durées communes pour portefeuille, confidentialité, objectifs, calendrier et import ; décalage des options borné à 50 ms. Lottie utilise explicitement l’interpolation des images et un passage doux depuis son symbole de secours.
- Notifications : sortie manuelle par fondu court, interrompue proprement si la préférence change. Expiration et annonces textuelles conservent leur comportement existant.

Le dock conserve le ressort validé. Les dialogues gardent leur propriétaire, leur opacité, leur focus et les brouillons. La réduction des animations règle les états immédiatement. Aucune dépendance, aucun calcul financier ni API n’est ajouté.

## Vérification

- `npm test` : inclut les tests physiques du ressort à 30/60/120 Hz, la partition des pas, l’inversion et les pauses longues.
- `npm run test:e2e:global-motion` : parcours dédié mobile/ordinateur, clair/sombre et réduction des animations ; Chromium et WebKit.
- `npm run test:e2e:menus`, `npm run test:e2e:motion`, `npm run test:e2e:signature`, `npm run test:e2e:smooth` : régressions des panneaux, confirmations, confidentialité/import/épargne et dock.
- Types, lint, compilation et audit statique strict.

Les essais utilisent exclusivement la démonstration. Les captures et traces sont locales dans `outputs/global-motion`. Les moteurs automatisés ne remplacent pas une mesure de performance sur un véritable iPhone.
