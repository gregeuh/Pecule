# Gestes Wallet

Les gestes complètent les boutons natifs de Pécule, sans sauvegarde implicite et sans dépendance supplémentaire. Ils s’appliquent au parcours réel, en mode clair/sombre, avec les mêmes règles de confidentialité et de brouillon.

- **Accueil, contenu des onglets** : gauche vers l’onglet suivant, droite vers le précédent ; suivi du doigt et retour décéléré. Le défilement vertical et les 24 px des bords restent natifs. Sur une ligne d’opération, le swipe gauche est réservé aux actions.
- **Opération enregistrée** : maintien de 480 ms pour un aperçu montant/compte/catégorie et les actions Modifier, Dupliquer, Récurrence si éligible, Supprimer avec confirmation. Le bouton « … » donne le même accès. Déplacement ou scroll annulent le maintien. Le maintien ne mesure pas la pression physique et ne promet aucun retour haptique système.
- **Ligne, swipe gauche** : révèle Modifier et Autres actions. Un clic sur la ligne referme ces actions ; Échap referme et rend le focus à la ligne. Les échéances virtuelles et sélections de masse gardent leur interaction d’origine.
- **Compte de l’accueil** : maintien ou menu contextuel pour les raccourcis du compte. Un appui simple ouvre toujours le détail. Les couleurs personnalisées et les montants masqués restent respectés.
- **Bouton + du dock** : tirer vers le haut ouvre une dépense ; maintenir révèle Dépense/Revenu/Virement, puis glisser vers une option et relâcher ouvre le formulaire. Un clic court conserve le menu complet. Cliquer une option reste possible après relâchement. Extérieur et Échap ferment la palette.
- **En-tête de panneau** : tirer vers le bas ferme avec le ressort partagé et conserve le brouillon. Les boutons de fermeture et Échap restent disponibles ; le corps du formulaire défile normalement.
- **Onglet actif du dock** : remonter en haut. Deux appuis actifs rapprochés sur Opérations placent le focus dans la recherche.

Une duplication reprend le contexte éditorial et le montant, pour aujourd’hui, avec un brouillon distinct. Elle ne copie aucun lien de virement/récurrence/import ; les virements liés ne proposent pas la duplication d’une seule écriture. L’enregistrement reste une action explicite. La suppression réutilise la confirmation existante et traite une paire de virement selon les règles existantes.

L’aide des gestes est dans les réglages. La réduction des mouvements retire relief et translations, sans supprimer les raccourcis ni leur retour textuel. Les essais automatisés sont dans `tests/e2e/gestures.mjs` (Chromium/WebKit, 320/390/1440, clair/sombre/réduit) et les suites Wallet, menus et dock. Ils utilisent uniquement la démonstration, sans écriture serveur. Le comportement matériel final est à confirmer dans la PWA sur un iPhone réel.
