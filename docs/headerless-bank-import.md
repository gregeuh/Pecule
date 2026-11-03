# Export bancaire sans en-tête

## Profil reconnu

Le lecteur conserve les exports à en-tête existants. Un profil supplémentaire reconnaît les fichiers séparés par un délimiteur avec deux lignes de compte concordantes (date, solde, champ vide, référence), encadrant des opérations à huit colonnes. Un en-tête explicite conserve toujours la priorité. Plusieurs blocs de relevé sont refusés plutôt que mélangés.

Les colonnes reconnues sont la date et le montant signé. Les deux colonnes de description sont réunies dans le libellé, sans déduire le signe depuis leur position : un remboursement peut utiliser la première colonne. Type et champs complémentaires restent dans les notes lorsque l’option de conservation est cochée. Les champs dont la signification n’est pas fournie gardent un nom neutre ; aucun code répété n’est inventé comme référence de dédoublonnage ou catégorie.

Les deux lignes de solde ne deviennent jamais des opérations et n’ajustent pas la référence du compte. Le texte source reste dans le brouillon en mémoire. Les lignes d’opération mal formées restent visibles et invalides ; elles ne sont pas silencieusement supprimées.

## Solde et validation

Les règles existantes restent inchangées : le mode Historique accepte les opérations jusqu’à la date de référence et conserve les soldes ; le mode Nouvelles opérations accepte celles qui la suivent et affecte les soldes. Les répétitions sans référence doivent être vérifiées ; le réimport utilise le dédoublonnage existant. Le choix du compte et la confirmation finale restent explicites.

## Vérification

`tests/fixtures/headerless-account.csv` est entièrement fictif. Les tests unitaires couvrent reconnaissance, descriptions, remboursements, notes, lignes invalides, solde historique, nouvelles opérations, réimport et relevés multiples. `tests/e2e/headerless-import.mjs` couvre le parcours sur mobile/ordinateur, clair/sombre, la reprise du brouillon et le réimport. Il utilise uniquement cette fixture et la démonstration.

Aucun relevé personnel n’est versionné, intégré aux captures ou envoyé à un budget de test distant.
