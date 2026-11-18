"use client";

import { useLayoutEffect, useRef } from "react";
import { motionSettings } from "./ui-motion";

/** Short, interruptible feedback for destination or committed-filter changes. */
export function useViewMotion<T extends HTMLElement = HTMLElement>(destination: string) {
  const surface = useRef<T>(null);
  const previous = useRef(destination), continuity = useRef(1);
  useLayoutEffect(() => {
    const changed = previous.current !== destination;
    previous.current = destination;
    const element = surface.current;
    if (!element || !changed || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timing = motionSettings(element);
    const from = continuity.current < 1 ? Math.max(.86, continuity.current) : .86;
    const animation = element.animate([{ opacity: from }, { opacity: 1 }], { duration: timing.state, easing: timing.ease });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (reduced.matches || document.hidden) animation.cancel(); };
    reduced.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      continuity.current = Number(getComputedStyle(element).opacity);
      animation.cancel();
      reduced.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [destination]);
  return surface;
}
