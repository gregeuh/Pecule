export function googleErrorMessage(code: string | null): string {
  if (!code) return "";
  if (code === "state_mismatch" || code === "state_expired" || code === "state_not_found") return "La vérification de connexion a expiré ou n’est plus valide. Relancez la connexion Google depuis cette page.";
  if (code === "access_denied") return "La connexion Google a été annulée. Vous pouvez réessayer ou utiliser votre adresse e-mail.";
  if (code === "account_not_linked") return "Connectez-vous d’abord avec votre mot de passe PECULE, puis associez Google dans les réglages pour retrouver le même budget.";
  if (code === "email_doesn't_match" || code === "email_mismatch") return "Choisissez le compte Google qui utilise la même adresse e-mail que votre compte PECULE.";
  return "La connexion Google n’a pas abouti. Réessayez ou connectez-vous avec votre adresse e-mail.";
}
