"use client";

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
  return <div className="toast" data-success={success} data-kind={success ? variant : "info"} role="status" aria-live="polite" aria-atomic="true">
    {success ? variant==="occurrence"&&receipt?<CalendarReceipt {...receipt}/>:<ConfirmationArt variant={variant==="occurrence"?"recurrence":variant} /> : <Info size={20} aria-hidden="true" />}
    <div className="notice-copy">{success && <strong>{titles[variant]}</strong>}<span>{message}</span>{success&&receipt&&<small className="calendar-date">Occurrence du {shortDate(receipt.date)}</small>}{success&&receipt&&<small className="calendar-next">{receipt.nextDate?`Prochaine échéance : ${shortDate(receipt.nextDate)}`:"Aucune autre échéance prévue sur les 400 prochains jours."}</small>}</div>
    <button type="button" aria-label="Fermer la notification" onClick={onClose}><X size={17} /></button>
  </div>;
}
