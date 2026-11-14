"use client";

import { useEffect, useRef } from "react";
import { motionSettings } from "./ui-motion";
import { Info, X } from "lucide-react";
import type { ConfirmationKind } from "../lib/confirmation-kind";
import ConfirmationArt from "./confirmation-art";
import { CalendarReceipt, type OccurrenceReceipt } from "./signature-interactions";
import { shortDate } from "../lib/budget";

const titles: Record<ConfirmationKind, string> = {
  occurrence: "Occurrence enregistrée", confirmation: "C’est enregistré", operation: "Opération enregistrée", recurrence: "Récurrence enregistrée",
  import: "Relevé importé", savings: "Épargne mise à jour", goal: "Objectif atteint !", settings: "Préférences enregistrées",
};
export default function BudgetNotice({ message, success, variant = "confirmation", receipt, onClose }: { message: string; success: boolean; variant?: ConfirmationKind; receipt?: OccurrenceReceipt; onClose: () => void }) {
  const surface = useRef<HTMLDivElement>(null), closing = useRef(false), animation = useRef<Animation | null>(null);
  const finish = useRef(onClose);
  useEffect(() => { finish.current = onClose; }, [onClose]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if ((media.matches || document.hidden) && closing.current) { animation.current?.cancel(); finish.current(); } };
    media.addEventListener("change", stop); document.addEventListener("visibilitychange", stop);
    return () => { animation.current?.cancel(); media.removeEventListener("change", stop); document.removeEventListener("visibilitychange", stop); };
  }, []);
  const dismiss = () => {
    if (closing.current) return;
    const element = surface.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    closing.current = true; element.dataset.motion = "closing";
    const timing = motionSettings(element), style = getComputedStyle(element);
    const motion = element.animate([{ opacity: style.opacity }, { opacity: 0 }], { duration: timing.feedback, easing: timing.exitEase, fill: "forwards" });
    animation.current = motion;
    void motion.finished.then(() => finish.current()).catch(() => {});
  };
  return <div ref={surface} className="toast" data-success={success} data-kind={success ? variant : "info"} role="status" aria-live="polite" aria-atomic="true">
    {success ? variant==="occurrence"&&receipt?<CalendarReceipt {...receipt}/>:<ConfirmationArt variant={variant==="occurrence"?"recurrence":variant} /> : <Info size={20} aria-hidden="true" />}
    <div className="notice-copy">{success && <strong>{titles[variant]}</strong>}<span>{message}</span>{success&&receipt&&<small className="calendar-date">Occurrence du {shortDate(receipt.date)}</small>}{success&&receipt&&<small className="calendar-next">{receipt.nextDate?`Prochaine échéance : ${shortDate(receipt.nextDate)}`:"Aucune autre échéance prévue sur les 400 prochains jours."}</small>}</div>
    <button type="button" aria-label="Fermer la notification" onClick={dismiss}><X size={17} /></button>
  </div>;
}
