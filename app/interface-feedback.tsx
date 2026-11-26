"use client";
import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div className="form-error feedback-error" role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
