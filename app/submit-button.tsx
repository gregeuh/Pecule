"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

/** Keep the action label and icon footprint stable while the request is pending. */
export default function SubmitButton({ busy = false, icon, children, disabled, className = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; icon?: ReactNode }) {
  return <button {...props} type="submit" className={className} disabled={disabled || busy} aria-busy={busy || undefined}>
    {(icon || busy) && <span className="submit-icon" aria-hidden="true">{busy ? <LoaderCircle size={17} className="spin" /> : icon}</span>}{children}
  </button>;
}
