import type { ReactNode } from "react";
import { Info, type LucideIcon } from "lucide-react";

/** A short title that stays visible; the explanation opens on demand (native details, keyboard and screen-reader ready). */
export default function InfoNote({
  title,
  icon: Icon = Info,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <details className="info-note">
      <summary>
        <Icon size={17} aria-hidden="true" />
        <span>{title}</span>
        <span className="info-note-toggle" aria-hidden="true">
          i
        </span>
      </summary>
      <div className="info-note-body">{children}</div>
    </details>
  );
}
