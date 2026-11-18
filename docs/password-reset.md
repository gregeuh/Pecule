# Activer la réinitialisation par e-mail

Le parcours est intégré à Better Auth, mais volontairement indisponible sans expéditeur réel.

1. Créer un compte Resend et vérifier un domaine d’expédition que vous contrôlez (enregistrements DNS fournis par Resend).
2. Créer une clé limitée à l’envoi depuis ce domaine.
3. Dans les variables sécurisées du projet Vercel `gregeuhs-projects/pecule-budget`, ajouter `RESEND_API_KEY` et `AUTH_EMAIL_FROM` (par exemple `Pécule <connexion@votre-domaine.fr>`). Ne pas envoyer la clé dans la conversation ni la committer.
4. Redéployer avec l’environnement Production. Ajouter les mêmes variables à Preview uniquement si cet environnement doit envoyer de vrais e-mails.
5. Avec un compte de test que vous contrôlez : demander un lien, vérifier la réception, changer le mot de passe, vérifier que l’ancien échoue et le nouveau fonctionne, que les anciennes sessions sont révoquées et que le même lien ne fonctionne plus. Vérifier aussi un lien expiré et une adresse sans compte (même message public).

Les jetons expirent après 30 minutes. Le service ne journalise ni le lien ni le destinataire ni le détail de la réponse du fournisseur. Une erreur d’envoi produit uniquement un diagnostic générique côté serveur ; le résultat public reste identique pour protéger l’existence des comptes. Le domaine `resend.dev` ne permet pas une distribution publique normale : utiliser un domaine vérifié.
