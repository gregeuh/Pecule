"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "../../lib/auth-client";
export default function SignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="auth-shell"><section className="card auth-card"><h1>Vous déconnecter ?</h1><p>Votre budget reste enregistré sur votre compte.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary full-width" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try { const result = await authClient.signOut(); if (result.error) throw new Error(); window.location.assign(new URL("/",window.location.origin).href); }
    catch { setError("La déconnexion a échoué. Réessayez."); setBusy(false); }
  }}>{busy ? "Déconnexion…" : "Me déconnecter"}</button><Link className="auth-link" href="/">Revenir à mon budget</Link></section></main>;
}
