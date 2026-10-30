"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function MobileDock({ children, expanded }: { children: ReactNode; expanded: boolean }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const position = () => Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
    let previous = position(), direction = 0, distance = 0, frame = 0;
    const update = () => {
      frame = 0;
      const current = position(), delta = current - previous;
      previous = current;
      if (!mobile.matches || expanded) { direction = 0; distance = 0; return; }
      if (current <= 32) { setCompact(false); direction = 0; distance = 0; return; }
      if (!delta) return;
      const nextDirection = Math.sign(delta);
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      // Ignore tiny reversals and clamp elastic overscroll at both page edges.
      if (direction > 0 && current > 80 && distance >= 24) setCompact(true);
      if (direction < 0 && distance >= 12) setCompact(false);
    };
    const onScroll = () => { if (mobile.matches && !expanded && !frame) frame = requestAnimationFrame(update); };
    const onResize = () => { previous = position(); direction = 0; distance = 0; setCompact(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    mobile.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", onResize);
      cancelAnimationFrame(frame);
    };
  }, [expanded]);

  return <div className="mobile-dock" data-compact={compact && !expanded} inert={expanded}>{children}</div>;
}
