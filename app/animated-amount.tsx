"use client";
import { useLayoutEffect, useRef } from "react";
import { COUNT_UP_MS, countUpValue } from "../lib/count-up";

/**
 * An amount that rolls to its value when it appears or changes. Screen readers only get the final value;
 * hidden amounts and reduced motion show the value at once.
 */
export default function AnimatedAmount({
  cents,
  hidden,
  format,
}: {
  cents: number;
  hidden: boolean;
  format: (cents: number) => string;
}) {
  const visible = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const frame = useRef(0);
  useLayoutEffect(() => {
    const element = visible.current;
    if (!element) return;
    cancelAnimationFrame(frame.current);
    const from = shown.current ?? 0;
    if (hidden || from === cents || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = cents;
      element.textContent = format(cents);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = (now - start) / COUNT_UP_MS;
      const value = countUpValue(from, cents, progress);
      shown.current = value;
      element.textContent = format(value);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    element.textContent = format(from);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [cents, hidden, format]);
  return (
    <>
      <span ref={visible} className="animated-amount" aria-hidden="true">
        {format(cents)}
      </span>
      <span className="sr-only">{format(cents)}</span>
    </>
  );
}
