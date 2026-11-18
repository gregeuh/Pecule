"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
export default function ForgotPassword(){
  const [enabled,setEnabled]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
  const feedback=useRef<HTMLDivElement>(null),lock=useRef(false);
  useEffect(()=>{let active=true;void fetch("/api/auth-options").then(r=>r.json()).then(data=>{if(active)setEnabled(data.passwordReset===true);}).catch(()=>{if(active)setEnabled(false);});return()=>{active=false;};},[]);
  function fail(message:string){setError(message);requestAnimationFrame(()=>feedback.current?.focus());}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(lock.current||!enabled)return;
    const email=String(new FormData(event.currentTarget).get("email")??"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail("Indiquez une adresse e-mail valide.");
    lock.current=true;setBusy(true);setError("");
    try{const result=await authClient.requestPasswordReset({email,redirectTo:"/reset-password"});if(result.error){fail(result.error.status===429?"Trop de demandes. Patientez une minute avant de réessayer.":"L’envoi est temporairement indisponible. Réessayez plus tard.");return;}setSent(true);}catch{fail("Impossible de joindre Pécule. Vérifiez votre connexion puis réessayez.");}finally{lock.current=false;setBusy(false);}
  }
  return <main className="auth-shell"><section className="card auth-card"><Link className="brand" href="/">pecule.</Link><h1>Retrouvez l’accès à votre compte.</h1>{enabled===null?<p role="status">Vérification de la disponibilité…</p>:!enabled?<p>L’envoi des e-mails de réinitialisation n’est pas encore disponible. Vous pouvez toujours utiliser votre mot de passe ou votre connexion Google habituelle.</p>:sent?<div role="status"><p>Si un compte correspond à cette adresse, un lien de réinitialisation vous sera envoyé. Vérifiez aussi les courriers indésirables.</p><p>Le lien est valable 30 minutes et utilisable une seule fois.</p></div>:<form noValidate onSubmit={submit} aria-busy={busy}><p>Recevez un lien pour choisir un nouveau mot de passe.</p><label className="field"><span>Adresse e-mail</span><input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} aria-invalid={!!error} aria-describedby={error?"reset-error":undefined}/></label><div className="auth-feedback">{error&&<div id="reset-error" className="form-error" role="alert" tabIndex={-1} ref={feedback}>{error}</div>}</div><button className="primary full-width" disabled={busy} type="submit">{busy?"Envoi en cours…":"Recevoir le lien"}</button></form>}<a className="auth-link" href="/sign-in">Revenir à la connexion</a></section></main>;
}
