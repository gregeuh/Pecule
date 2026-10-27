---
version: alpha
colors:
  background: "#f5f7fa"
  surface: "#ffffff"
  ink: "#182b45"
  muted: "#526681"
  primary: "#3559d5"
  budget-negative: "#aa394e"
  budget-attention: "#984b00"
  budget-comfort: "#21634e"
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

## Import bancaire
Le parcours réutilise les champs, listes de diagnostic, boutons et récapitulatifs de l’application. app/bank-import.tsx possède le parcours ; les classes bank-import-* dans app/bank-import.css adaptent la grille de colonnes et le récapitulatif sans modifier les autres écrans. La sélection et les données du relevé restent en mémoire, jamais dans l’URL ni dans le stockage local.

La case « Conserver les colonnes supplémentaires dans les notes » et la divulgation native « Données reprises » rendent les données supplémentaires inspectables avant confirmation. Les valeurs restent du texte, avec retours à la ligne et repli des longues références ; les styles héritent des variables existantes sans nouvelle palette.

## Signal du disponible

Après retour utilisateur, le grand fond rouge/orange/vert est remplacé par la surface neutre `--card` des autres cartes. Le code couleur est limité au montant disponible et à un petit libellé avec icône, placé à côté du titre. Aucun badge encadré ni paragraphe d’alerte n’alourdit la carte. Les seuils financiers restent identiques.

`app/budget-signal.css` possède les couleurs de texte : `colors.budget-negative` → `--budget-negative-ink`, `colors.budget-attention` → `--budget-attention-ink`, `colors.budget-comfort` → `--budget-comfort-ink`. Les valeurs claires sont `#aa394e`, `#984b00` et `#21634e`. En thème sombre, les textes deviennent `#ff9cae`, `#ffdcac` et `#8addb4` sur la surface `--card`. Les contrastes sont vérifiés sur les surfaces réelles. Les autres textes, soldes de la formule et montants par jour gardent les couleurs neutres du produit.

Le libellé reste visible sans couleur et expose son explication par son nom accessible et son titre. Les couleurs forcées utilisent Canvas/CanvasText. Les montants masqués, les erreurs de chargement et les budgets sans compte courant/espèces n’exposent aucun signal financier ; le fond de la carte reste neutre dans tous les cas.

## Récupération et imports

Les reprises de brouillon, la liste des imports et la comparaison de versions utilisent les cartes neutres, les champs natifs et les confirmations existantes. Aucune grande surface de couleur n’est ajoutée. La comparaison traduit les champs financiers en français et conserve les deux versions visibles avant le choix. Les nouvelles pages de récupération de compte reprennent la carte d’authentification existante.

## Assistance budgétaire

Les analyses restent repliées par défaut dans Opérations pour préserver la densité de la page. Les barres utilisent la couleur primaire existante, sans nouvelle palette. Les propositions de récurrences reprennent les cartes neutres et les boutons secondaires. Les alertes de catégories occupent une ligne discrète sous le disponible ; aucun aplat rouge/orange/vert ne revient. Les réglages de seuil et les règles mémorisées réutilisent les cartes de réglages existantes.
