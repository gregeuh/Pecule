# Ajout d’opération : lisibilité et clavier

Le 12 novembre, la précision utilisateur porte explicitement sur les trois dimensions : textes/couleurs, éléments coupés ou superposés, et clavier masquant la saisie. L’audit ciblé a reproduit un corps réduit à101 px dans un viewport visible de320 px : l’en-tête occupait81 px, et les actions114 px. Agrandir les textes sans modifier ce cadre ne suffisait pas.

Le mode clavier conserve les polices lisibles et les champs contrastés. Il compresse seulement l’en-tête et les actions : titre18 px, fermer/masquer le clavier44 px, Enregistrer48 px minimum. Les actions secondaires reviennent dès que le clavier est masqué. Le bouton explicite de masquage évite de dépendre d’une touche Terminé absente de certains claviers décimaux iPhone. La zone sûre supérieure est diminuée de l’offset déjà consommé par le viewport ; le cadre reste compact durant l’animation de fermeture native.

La notification après Enregistrer et continuer est maintenant dans `.capture-body`, sans bloc fixe de88 px. Son rôle, son bouton de fermeture et son illustration restent conservés. Elle peut défiler hors du champ visuel afin de donner la priorité à la nouvelle saisie.

`useModalViewport` révèle le groupe `.field` s’il tient, sinon son contrôle. Il déplace seulement `.capture-body` ou `.panel-form-body`, jamais le document via scrollIntoView. ResizeObserver et MutationObserver redéclenchent la mesure après erreurs, options ou notifications ; les événements sont regroupés par frame et tous les observateurs sont retirés au démontage. Le zoom garde sa priorité native. L’aperçu accompagne le montant lorsque les deux tiennent, sinon il reste accessible par défilement ou après masquage du clavier.

`tests/e2e/capture-clarity.mjs` couvre320/390/430 px, clair/sombre, Chromium/WebKit, viewport visible440 et320 px, offset55/0 et zone sûre simulée59 px. Chaque contrôle actif doit rester dans le corps et au-dessus des actions ; document et page ne doivent pas défiler horizontalement ou verticalement. Montant, libellé, note, validation, masquage, notification et enregistrement enchaîné sont vérifiés. Les132 contrôles de géométrie passent ; le minimum observé du corps est143 px dans le cas le plus contraint. Les essais utilisent la démo et ne constituent pas un test matériel iPhone.

La suite `iphone-capture.mjs` vérifie aussi compte, virgule décimale, favoris, brouillons, date, validation et enregistrement enchaîné. Les références clair/sombre couvrent les versions sans clavier sur téléphone et ordinateur. Aucun budget personnel n’est utilisé.
