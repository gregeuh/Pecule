# Reprise de Pécule — 26 octobre 2026

## Base retenue

Version du 23 octobre 2026, récupérée depuis le dépôt source du Site Pécule.
Commit d'origine : `e2ef315ad152c87969fd2d699d4022763707c1e1`.
Le propriétaire a autorisé la reprise de cette version le 26 octobre 2026.

Ce dépôt conserve le code original complet et permet de poursuivre le travail sans dépendre d'un dossier local sur le Mac du propriétaire.

## État du correctif prioritaire

L'audit de la version Vercel du 26 octobre signalait qu'une carte d'objectif de l'accueil présentait la réserve cumulée de tous les objectifs comme celle du projet vacances.

Cette carte n'existe pas dans la version du 23 octobre. Ici, la page Épargne présente la réserve `monthly` de chaque objectif ; le disponible soustrait la réserve cumulée calculée par `overview`. Il n'y a donc pas lieu de remplacer une valeur de démonstration par une constante de 150 €.

Les douze tests métier existants ont été relancés avec succès le 26 octobre 2026, notamment le disponible, les virements, les réserves, les récurrences et les imports CSV.

## Hébergement et données

Cette base utilise Sites/Cloudflare Workers, la connexion ChatGPT fournie par Sites et une base D1. Son URL historique est `https://pecule-budget.gregeuh.chatgpt.site`.

Le site `https://pecule-budget.vercel.app/` utilise une autre connexion et une autre base : Better Auth et Postgres/Neon. Le code de cette adaptation n'est pas contenu dans la sauvegarde du 23 octobre.

Ne pas déployer cette sauvegarde telle quelle sur Vercel : l'identité par en-têtes de Sites et le binding D1 ne sont pas disponibles sur Vercel. Ne pas traiter cette version comme une sauvegarde des données personnelles actuellement conservées sur Vercel.

## Suite du travail

- Conserver cette version comme base de référence dans `gregeuh/Pecule`.
- Pour reprendre sur Sites : conserver l'identité du Site et son accès privé.
- Pour remettre cette base sur Vercel : porter explicitement la connexion et la persistance, vérifier la compatibilité du format de budget et tester sur un compte dédié avant toute promotion en production.
- Reprendre ensuite les améliorations d'usage une par une. L'audit de la version du 26 octobre doit être réévalué sur cette base avant d'appliquer ses constats.
