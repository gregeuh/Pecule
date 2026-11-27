"use client";
import { ChevronDown } from "lucide-react";

/** The chevron that folds a big home card to one line, and opens it again. */
export default function FoldButton({
  collapsed,
  title,
  controls,
  onToggle,
}: {
  collapsed: boolean;
  title: string;
  controls: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="fold-button"
      aria-expanded={!collapsed}
      aria-controls={controls}
      aria-label={`${collapsed ? "Déplier" : "Réduire"} « ${title} »`}
      onClick={onToggle}
    >
      <ChevronDown size={17} aria-hidden="true" />
    </button>
  );
}
