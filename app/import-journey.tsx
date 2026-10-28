"use client";

export type ImportPhase = "choose" | "read" | "analyze" | "ready" | "review" | "saving";
const labels: Record<ImportPhase,string> = { choose:"Votre relevé, puis votre vérification",read:"Lecture du fichier sur cet appareil",analyze:"Analyse des colonnes et des opérations",ready:"Aperçu disponible · vérifiez les lignes",review:"Vérification avant enregistrement",saving:"Enregistrement des opérations…" };
export default function ImportJourney({phase,progress}:{phase:ImportPhase;progress:number|null}) {
  const step=phase==="choose"?0:phase==="read"||phase==="analyze"?1:phase==="ready"||phase==="review"?2:3;
  return <section className="import-journey" data-phase={phase} aria-label="Étapes de l’import">
    <svg className="import-journey-art" viewBox="0 0 110 88" fill="none" aria-hidden="true">
      <g className="journey-page"><rect x="17" y="12" width="35" height="45" rx="5" fill="var(--signature-paper)" stroke="var(--signature-green)" strokeWidth="1.5"/><path d="M25 25h18M25 33h18M25 41h11" stroke="var(--signature-green)" strokeWidth="2" strokeLinecap="round"/></g>
      <rect x="44" y="28" width="49" height="48" rx="8" fill="var(--signature-green)" stroke="var(--signature-mint)" strokeWidth="1.4"/>
      <path d="M55 29v46M64 44h19M64 53h19M64 62h12" stroke="var(--signature-mint)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="88" cy="24" r="8" fill="var(--signature-apricot)"/>
    </svg>
    <div className="import-journey-copy"><strong>{labels[phase]}</strong>
      <ol aria-label="Progression de l’import">{["Choisir","Lire","Vérifier","Enregistrer"].map((label,index)=><li key={label} aria-current={index===step?"step":undefined} data-passed={index<step}>{label}</li>)}</ol>
      {phase==="read" && progress!==null && <><progress max="100" value={progress} aria-label="Octets du fichier lus"/><span className="field-hint">{progress} % du fichier lu</span></>}
      {(phase==="analyze"||phase==="saving")&&<span className="field-hint" role="status">{phase==="analyze"?"Le relevé est en cours d’analyse.":"La confirmation apparaîtra après l’enregistrement."}</span>}
    </div>
  </section>;
}
