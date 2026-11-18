# Aperçu de solde pendant l’ajout

Placement approuvé : sous le montant, dans la saisie d’une nouvelle opération. Le bloc identifie le compte et distingue « Solde actuel » de « Après cette dépense / ce revenu ». Il suit le montant, le compte, le sens et la date des contrôles réels, y compris après restauration ou effacement d’un brouillon, application d’un favori et « Enregistrer et continuer ».

## Calcul et limites

`lib/operation-balance-preview.ts` est une fonction de présentation sans écriture. Le solde actuel vient de `accountBalance` à la date courante de Pécule, avec ses récurrences matérialisées et ses règles d’historique déjà comprises dans la référence. L’effet isolé ajoute ou retire le montant validé en centimes. Aucun disponible budgétaire, autre compte ou autre mouvement futur n’est inclus.

- Montant vide, incomplet, nul, négatif ou invalide : « À préciser », sans estimation inventée.
- Date invalide ou antérieure à la référence : estimation indisponible et aide. Une référence future n’est pas présentée comme un solde courant exploitable.
- Date future : simulation de cette seule opération, sans prétendre projeter tous les mouvements jusqu’à sa date. Le solde actuel reste inchangé avant cette date.
- Date passée valide : effet sur le solde actuel à l’enregistrement, sans prétendre reconstituer un relevé historique.
- Solde estimé négatif : fond et texte d’avertissement, sans nouvelle règle de blocage, de confort ou d’autorisation.
- Montants masqués : valeurs courante/estimée masquées immédiatement et absence d’indice de signe négatif. Le montant que l’utilisateur saisit reste un champ normal, comme auparavant.

L’aperçu n’ajoute aucun champ au payload, ne sauvegarde rien et ne remplace aucune validation. Il ne s’applique pas à l’éditeur d’une opération déjà enregistrée ni au formulaire distinct de virement, pour ne pas confondre ajout, remplacement et paire de comptes.

## Intégration

`OperationBalancePreview` est enfant du `ValidatedForm` existant. Il utilise les valeurs de brouillon au premier rendu, puis lit les contrôles natifs lors des événements du formulaire. Après une restauration ou un reset, la lecture est faite après le commit des valeurs. Les listeners et lectures différées sont nettoyés au démontage. Le composant ne prend pas le contrôle des champs existants.

Le style consomme la palette Wallet et les surfaces existantes. Les chiffres ne sont pas animés ; le compte long et les grands montants restent repliables. Avec le clavier, la variante compacte réserve le plus de place possible ; le rappel de brouillon, comme les favoris, se réaffiche à la fermeture du clavier. `useModalViewport` peut faire défiler le corps pour garder le montant et les deux valeurs ensemble lorsqu’ils tiennent dans la hauteur disponible ; sinon, le champ actif garde la priorité. Le document et les autres variantes de formulaire ne sont pas redimensionnés par cet ajout.

## Vérification

Les tests unitaires comparent l’effet avec le solde canonique après ajout, couvrent revenus, historique, récurrences, autres comptes, dates, saisies incomplètes et limites de nombres sûrs, et vérifient l’absence de mutation. `tests/e2e/operation-balance-preview.mjs` vérifie le parcours réel de démonstration dans Chromium et WebKit, clair/sombre/réduit, brouillon/reset, sauvegarde en chaîne, confidentialité et axe. La suite iPhone vérifie aussi les favoris et le viewport de clavier simulé. Les références visuelles sont mises à jour selon la procédure existante.
