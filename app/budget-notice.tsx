"use client";

import { Info, X } from "lucide-react";
import ConfirmationArt from "./confirmation-art";

export default function BudgetNotice({ message, success, onClose }: { message: string; success: boolean; onClose: () => void }) {
  return <div className="toast" data-success={success} role="status" aria-live="polite" aria-atomic="true">
    {success ? <ConfirmationArt /> : <Info size={20} aria-hidden="true" />}
    <span>{message}</span>
    <button type="button" aria-label="Fermer la notification" onClick={onClose}><X size={17} /></button>
  </div>;
}
