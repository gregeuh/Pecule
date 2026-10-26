---
version: alpha
colors:
  background: "#f5f7fa"
  surface: "#ffffff"
  ink: "#182b45"
  muted: "#526681"
  primary: "#3559d5"
typography:
  body:
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
rounded:
  card: "20px"
omitted:
  - section: spacing
    reason: Existing CSS remains the canonical implementation.
  - section: components
    reason: Existing app/globals.css owns component styles.
---

## Overview
Pécule est un outil personnel de budget en français. La demande du 26 octobre impose de retrouver l’interface visible sur pecule-budget.vercel.app à partir du code Git disponible. La référence est le tableau de bord bleu « clarté », la navigation à six vues, la répartition 50/30/20 et les thèmes clair/sombre.

## Colors
Les variables de app/reference.css, relevées dans la feuille de styles publique du site de référence, sont la source de vérité : --bg, --card, --ink, --muted, --blue. Les pages de compte utilisent ces variables et les classes .field, .primary, .card et .form-error.

## Typography
DM Sans pour le texte et Manrope pour les titres, auto-hébergées dans public/fonts, comme le site de référence. Les champs de connexion utilisent 16px pour éviter le zoom automatique sur iPhone.

## Layout
Connexion dans une carte centrée, largeur maximum 440px, marge de 20px sur téléphone. Tableau de bord en deux colonnes sur ordinateur ; navigation basse et cartes empilées sur mobile. Six vues, dont la répartition 50/30/20.

## Elevation & Depth
Conserver les ombres discrètes de la classe .card existante.

## Shapes
Les rayons et densités suivent la feuille de styles de référence. Les ajouts de formulaires réutilisent .field, .primary et .card.

## Components
Formulaires de compte : labels natifs, mot de passe masqué avec bouton d’affichage, erreurs en français, focus sur l’erreur, envoi désactivé pendant la requête. Aucun cache de pages personnelles ou de réponses API.

## Do's and Don'ts
Réutiliser les classes existantes. Ne pas introduire de connexion basée sur les en-têtes ChatGPT sur Vercel. Ne pas présenter les anciens comptes et budgets comme migrés.

## Réconciliation de la référence

Les valeurs du 23 octobre ont été remplacées par les couleurs et polices observées le 26 octobre sur le site demandé. Le tableau de bord est reproduit avec ses classes clarte-*. Les calculs et opérations CRUD conservent la base Git, et la répartition 50/30/20 suit les règles publiquement livrées par le site de référence. Le montant de la carte d’objectif est corrigé pour porter uniquement sur cet objectif.
