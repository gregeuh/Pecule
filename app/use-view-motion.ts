"use client";

import { useLayoutEffect, useRef } from "react";
import { motionSettings } from "./ui-motion";

/** A brief crossfade for destination changes; never delay navigation or move controls. */
export function useViewMotion(destination: string) {
  const surface = useRef<HTMLElement>(null);
  const previous = useRef(destination);
  useLayoutEffect(() => {
    const element = surface.current;
    if (!element || previous.current === destination) return;
    previous.current = destination;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timing = motionSettings(element);
    const animation = element.animate([{ opacity: .72 }, { opacity: 1 }], { duration: 180, easing: timing.ease });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (reduced.matches) animation.cancel(); };
    reduced.addEventListener("change", stop);
    return () => { animation.cancel(); reduced.removeEventListener("change", stop); };
  }, [destination]);
  return surface;
}
