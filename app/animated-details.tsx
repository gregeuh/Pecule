"use client";

import { useCallback, useEffect, useRef, type ComponentProps, type MouseEvent } from "react";
import { springStep } from "../lib/motion-spring";

/** Native disclosure semantics with the same non-bouncing continuity as the dock. */
export default function AnimatedDetails({ children, className, onClick, ...props }: ComponentProps<"details">) {
  const element = useRef<HTMLDetailsElement>(null);
  const desired = useRef<boolean | null>(null), frame = useRef(0);
  const motion = useRef({ position: 0, velocity: 0, target: 0 });
  const original = useRef({ height: "", overflow: "" });
  const closedHeight = useRef<number | null>(null);
  const settle = useCallback(() => {
    cancelAnimationFrame(frame.current); frame.current = 0;
    const current = element.current; if (!current || desired.current === null) return;
    current.open = desired.current;
    current.style.height = original.current.height;
    current.style.overflow = original.current.overflow;
    current.dataset.motion = "idle";
    motion.current.velocity = 0; desired.current = null;
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (media.matches || document.hidden) settle(); };
    const current = element.current;
    const reveal = () => { if (desired.current !== null) { desired.current = true; settle(); } else if (current) current.open = true; };
    // Nested options, search results and form errors can change natural height mid-flight.
    const observer = new ResizeObserver(() => {
      if (!current || desired.current !== true) return;
      const height = current.style.height;
      current.style.height = original.current.height;
      motion.current.target = current.getBoundingClientRect().height;
      current.style.height = height;
    });
    if (current) for (const child of current.children) if (child.tagName !== "SUMMARY") observer.observe(child);
    media.addEventListener("change", reduce);
    document.addEventListener("visibilitychange", reduce);
    const resize = () => { closedHeight.current = null; settle(); };
    window.addEventListener("resize", resize);
    current?.addEventListener("pecule:reveal", reveal);
    return () => {
      cancelAnimationFrame(frame.current); observer.disconnect();
      media.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", reduce);
      window.removeEventListener("resize", resize);
      current?.removeEventListener("pecule:reveal", reveal);
    };
  }, [settle]);
  const toggle = (event: MouseEvent<HTMLDetailsElement>) => {
    onClick?.(event); if (event.defaultPrevented) return;
    const current = event.currentTarget, summary = current.querySelector<HTMLElement>(":scope > summary");
    if (!summary?.contains(event.target as Node)) return;
    event.preventDefault(); summary.focus({ preventScroll: true });
    const expanded = !(desired.current ?? current.open), from = current.getBoundingClientRect().height;
    if (desired.current === null) {
      original.current = { height: current.style.height, overflow: current.style.overflow };
      motion.current.velocity = 0;
    }
    if (!current.open) closedHeight.current = from;
    cancelAnimationFrame(frame.current);
    current.style.height = original.current.height;
    const style = getComputedStyle(current), header = getComputedStyle(summary);
    const number = (value: string) => parseFloat(value) || 0;
    const closed = closedHeight.current ?? summary.getBoundingClientRect().height + number(style.paddingTop) + number(style.paddingBottom) + number(style.borderTopWidth) + number(style.borderBottomWidth) + number(header.marginTop) + number(header.marginBottom);
    current.open = true;
    const opened = current.getBoundingClientRect().height;
    desired.current = expanded;
    motion.current.position = from; motion.current.target = expanded ? opened : closed;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) { settle(); return; }
    current.style.height = `${from}px`; current.style.overflow = "clip";
    current.dataset.motion = expanded ? "opening" : "closing";
    let previous = performance.now();
    const tick = (now: number) => {
      const state = motion.current, target = state.target;
      const next = springStep(state.position, state.velocity, target, (now - previous) / 1000, expanded ? 20 : 24);
      previous = now;
      state.position = Math.max(closed, Math.min(Math.max(opened, target), next.position)); state.velocity = next.velocity;
      current.style.height = `${state.position}px`;
      if (Math.abs(state.position - target) < .2 && Math.abs(state.velocity) < 2) { settle(); return; }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  return <details {...props} className={`${className ?? ""} animated-details`} ref={element} onClick={toggle}>{children}</details>;
}
