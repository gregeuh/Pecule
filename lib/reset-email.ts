// Server-only configuration; credentials never enter browser bundles or diagnostics.
export function passwordResetEnabled() {
  return !!(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}
export async function sendPasswordResetEmail(email: string, url: string) {
  if (!passwordResetEnabled()) throw new Error("Password reset email is not configured");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("Secure reset URL required");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [email], subject: "Réinitialiser votre mot de passe Pécule", text: `Vous avez demandé à réinitialiser votre mot de passe Pécule.\n\nChoisissez un nouveau mot de passe avec ce lien, valable 30 minutes :\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message. Votre mot de passe reste inchangé.` }),
    signal: AbortSignal.timeout(10_000),
  });
  // Never log the response: it can contain recipient or provider credentials.
  if (!response.ok) throw new Error("Password reset email delivery failed");
}
