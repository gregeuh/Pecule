---
version: alpha
colors:
  background: "#f7f8fa"
  surface: "#ffffff"
  ink: "#252a37"
  muted: "#7e8492"
  primary: "#3e61e8"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
rounded:
  card: "20px"
omitted:
  - section: spacing
    reason: Existing CSS remains the canonical implementation.
  - section: components
    reason: Existing app/globals.css owns component styles.
---

## Overview
Pécule est un outil personnel de budget en français. La migration Vercel conserve l’interface du 23 octobre. Les nouvelles pages de connexion reprennent ses cartes, champs et boutons, sans refonte du tableau de bord.

## Colors
Les variables de app/globals.css sont la source de vérité : --bg, --card, --ink, --muted, --blue. Les pages de compte utilisent ces variables et les classes .field, .primary, .card et .form-error.

## Typography
Pile système Apple et Segoe UI, comme le tableau de bord existant. Les champs de connexion utilisent 16px pour éviter le zoom automatique sur iPhone.

## Layout
Connexion dans une carte centrée, largeur maximum 440px, marge de 20px sur téléphone. Aucun changement de navigation du budget.

## Elevation & Depth
Conserver les ombres discrètes de la classe .card existante.

## Shapes
Conserver le rayon de carte de 20px et les formes existantes des champs et boutons.

## Components
Formulaires de compte : labels natifs, mot de passe masqué avec bouton d’affichage, erreurs en français, focus sur l’erreur, envoi désactivé pendant la requête. Aucun cache de pages personnelles ou de réponses API.

## Do's and Don'ts
Réutiliser les classes existantes. Ne pas introduire de connexion basée sur les en-têtes ChatGPT sur Vercel. Ne pas présenter les anciens comptes et budgets comme migrés.
