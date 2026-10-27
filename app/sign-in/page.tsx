"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { authClient } from "../../lib/auth-client";
import { googleErrorMessage } from "../../lib/auth-feedback";

export default function SignIn() {
  const [google,setGoogle]=useState(false);
  const [resetEnabled,setResetEnabled]=useState(false);
  useEffect(()=>{let active=true;void fetch("/api/auth-options").then(r=>r.json()).then(data=>{if(active){setGoogle(data.google===true);setResetEnabled(data.passwordReset===true);}}).catch(()=>{});return()=>{active=false;};},[]);
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  useEffect(()=>{const message=googleErrorMessage(new URLSearchParams(window.location.search).get("error"));if(message)fail(message);},[]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Indiquez une adresse e-mail valide.");
    if (!password || (signup && (password.length < 12 || password.length > 128))) return fail("Choisissez un mot de passe de 12 à 128 caractères.");
    if (signup && !name) return fail("Indiquez votre prénom.");
    if (signup && password !== data.get("confirmation")) return fail("Les deux mots de passe doivent être identiques.");
    setError(""); setBusy(true);
    try {
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        fail(result.error.status === 429 ? "Trop de tentatives. Patientez une minute avant de réessayer." : result.error.status >= 500 ? "La connexion est temporairement indisponible. Réessayez dans un instant." : signup ? "Le compte n’a pas pu être créé. Si vous avez déjà un compte, connectez-vous." : "Vérifiez votre adresse e-mail et votre mot de passe.");
        return;
      }
      window.location.assign("/");
    } catch { fail("Impossible de joindre PECULE. Vérifiez votre connexion puis réessayez."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="card auth-card" aria-labelledby="auth-title">
    <a className="brand" href="/" aria-label="PECULE, accueil"><img src="/favicon.svg" alt="" /><span>pecule<span className="brand-dot">.</span></span></a>
    <h1 id="auth-title">{signup ? "Votre budget commence ici." : "Retrouvez votre espace."}</h1>
    <p>{signup ? "Créez votre compte pour retrouver votre budget sur tous vos appareils." : "Connectez-vous avec votre adresse e-mail."}</p>
    {google&&<button type="button" className="secondary full-width auth-google" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{const result=await authClient.signIn.social({provider:"google",callbackURL:"/",errorCallbackURL:"/sign-in"});if(result.error){fail("La connexion Google a échoué. Réessayez ou utilisez votre adresse e-mail.");setBusy(false);}}catch{fail("Impossible de joindre Google. Réessayez.");setBusy(false);}}}><img src="/brands/catalogue/google.svg" width={20} height={20} alt=""/>Continuer avec Google</button>}
    <form onSubmit={submit} noValidate aria-busy={busy}>
      {signup && <label className="field"><span>Votre prénom</span><input name="name" autoComplete="given-name" maxLength={60} required disabled={busy} /></label>}
      <label className="field"><span>Adresse e-mail</span><input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></label>
      <label className="field"><span>Mot de passe</span><input name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} required maxLength={128} disabled={busy} aria-describedby={signup ? "password-hint" : undefined} />{signup && <small id="password-hint">12 caractères minimum. Vous pouvez utiliser une phrase.</small>}</label>
      <button className="auth-link" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}</button>
      {signup && <label className="field"><span>Confirmer le mot de passe</span><input name="confirmation" type={visible ? "text" : "password"} autoComplete="new-password" required maxLength={128} disabled={busy} /></label>}
      <div className="auth-feedback">{error && <div className="form-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</div>}</div>
      <button className="primary full-width" type="submit" disabled={busy}>{busy ? "Connexion en cours…" : signup ? "Créer mon compte" : "Me connecter"}</button>
    </form>
    {!signup&&resetEnabled&&<a className="auth-link" href="/forgot-password">Mot de passe oublié ?</a>}
    <button type="button" className="auth-link" disabled={busy} onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "J’ai déjà un compte" : "Créer un compte"}</button>
    <a className="auth-link" href="/">Découvrir la démonstration</a>
  </section></main>;
}
