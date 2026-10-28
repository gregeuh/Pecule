"use client";

import { Info, X } from "lucide-react";
import type { ConfirmationKind } from "../lib/confirmation-kind";
import ConfirmationArt from "./confirmation-art";

const titles: Record<ConfirmationKind, string> = {
  confirmation: "C’est enregistré", operation: "Opération enregistrée", recurrence: "Récurrence enregistrée",
  import: "Relevé importé", savings: "Épargne mise à jour", goal: "Objectif atteint !", settings: "Préférences enregistrées",
};
export default function BudgetNotice({ message, success, variant = "confirmation", onClose }: { message: string; success: boolean; variant?: ConfirmationKind; onClose: () => void }) {
  return <div className="toast" data-success={success} data-kind={success ? variant : "info"} role="status" aria-live="polite" aria-atomic="true">
    {success ? <ConfirmationArt variant={variant} /> : <Info size={20} aria-hidden="true" />}
    <div className="notice-copy">{success && <strong>{titles[variant]}</strong>}<span>{message}</span></div>
    <button type="button" aria-label="Fermer la notification" onClick={onClose}><X size={17} /></button>
  </div>;
}
