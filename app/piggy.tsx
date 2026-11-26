"use client";
import { useEffect, useRef } from "react";
import { shouldCelebrate, type PiggyMood } from "../lib/piggy";

/** The Pécule piggy bank. Hops and swallows a coin when savings grow in the same budget; frowns when it is tight. */
export default function Piggy({
  mood,
  savedCents,
  budgetKey,
  hidden,
  size = 64,
}: {
  mood: PiggyMood;
  savedCents: number;
  budgetKey: string;
  hidden: boolean;
  size?: number;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const previous = useRef<{ saved: number; key: string } | null>(null);
  useEffect(() => {
    const element = svg.current;
    element?.removeAttribute("data-celebrate");
    const before = previous.current;
    previous.current = { saved: savedCents, key: budgetKey };
    if (
      !element ||
      hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !shouldCelebrate(before?.saved ?? null, savedCents, budgetKey, before?.key ?? null)
    )
      return;
    element.setAttribute("data-celebrate", "true");
    const timer = setTimeout(() => element.removeAttribute("data-celebrate"), 1200);
    return () => {
      clearTimeout(timer);
      element.removeAttribute("data-celebrate");
    };
  }, [savedCents, budgetKey, hidden]);
  return (
    <svg
      ref={svg}
      className="piggy"
      data-mood={mood}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle className="piggy-coin" cx="53" cy="14" r="7" />
      <g className="piggy-body">
        <ellipse cx="52" cy="58" rx="34" ry="27" className="piggy-skin" />
        <ellipse cx="44" cy="48" rx="18" ry="9" className="piggy-shine" />
        <circle cx="80" cy="52" r="12" className="piggy-skin" />
        <ellipse cx="86" cy="54" rx="5" ry="4" className="piggy-snout" />
        <circle cx="74" cy="46" r="2.4" className="piggy-eye" />
        <path className="piggy-brow" d="M70 39 l8 3" />
        <path className="piggy-mouth" d="M76 62 q4 -3 8 0" />
        <path d="M38 35l7-9 5 10z" className="piggy-snout" />
        <rect x="32" y="80" width="8" height="12" rx="3" className="piggy-snout" />
        <rect x="58" y="80" width="8" height="12" rx="3" className="piggy-snout" />
        <rect x="45" y="31" width="16" height="4" rx="2" className="piggy-slot" />
      </g>
    </svg>
  );
}
