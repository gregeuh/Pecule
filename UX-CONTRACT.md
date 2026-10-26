# Contrat de la migration Vercel

Source : demande du 26 octobre 2026 de déployer la base GitHub. Les fonctions de budget restent celles du 23 octobre.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | app/sign-in/page.tsx, .field | UX-CONTRACT.md | sign-in / sign-up | Browser validation, keyboard, submit and error |


La connexion et la création de compte aboutissent à /. La déconnexion nécessite une action explicite. Les erreurs conservent le formulaire. La démo reste accessible sans compte.

Les tables pecule_git_* sont séparées des anciennes tables. Les previews utilisent pecule_preview_*. Aucun compte ou budget antérieur n’est migré automatiquement. Les mots de passe sont traités exclusivement par Better Auth.

Les pages et réponses personnelles ne sont jamais mises en cache. Les contrôles, dates, sélections et calculs du budget existant ne sont pas refondus dans cette migration.
