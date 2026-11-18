"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function MobileDock({ children, expanded }: { children: ReactNode; expanded: boolean }) {
  const [compact, setCompact] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  const motion = useRef({ position: 0, velocity: 0 });

  useEffect(() => {
    const element = dock.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 760px)");
    const target = compact && !expanded ? 1 : 0;
    let frame = 0, previous = performance.now();
    const paint = () => element.style.setProperty("--dock-collapse", String(motion.current.position));
    const settle = () => {
      cancelAnimationFrame(frame); frame = 0;
      motion.current = { position: target, velocity: 0 };
      paint(); element.removeAttribute("data-moving");
    };
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      const state = motion.current, offset = state.position - target;
      // Exact critically damped spring: preserve velocity when scrolling reverses.
      // One value owns the complete fixed dock; no React renders on animation frames.
      const frequency = target ? 18 : 20;
      const impulse = state.velocity + frequency * offset, decay = Math.exp(-frequency * dt);
      state.position = Math.max(0, Math.min(1, target + (offset + impulse * dt) * decay));
      state.velocity = (state.velocity - frequency * impulse * dt) * decay;
      paint();
      if (Math.abs(state.position - target) < .001 && Math.abs(state.velocity) < .01) { settle(); return; }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (reduced.matches || !mobile.matches || document.hidden) { settle(); return; }
      if (motion.current.position === target && motion.current.velocity === 0) { settle(); return; }
      previous = performance.now(); element.dataset.moving = "true";
      frame = requestAnimationFrame(tick);
    };
    start();
    reduced.addEventListener("change", start);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frame); element.removeAttribute("data-moving");
      reduced.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", start);
    };
  }, [compact, expanded]);

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

  return <div ref={dock} className="mobile-dock" data-compact={compact && !expanded} inert={expanded}>{children}</div>;
}
