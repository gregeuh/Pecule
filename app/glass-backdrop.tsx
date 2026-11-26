"use client";
import { useEffect, useRef } from "react";

/** The colour wash behind every screen: three soft blobs that drift slowly (paused when the page is hidden). */
export default function GlassBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => ref.current?.toggleAttribute("data-paused", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return (
    <div ref={ref} className="glass-backdrop" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
