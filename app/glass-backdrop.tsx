"use client";
import { useEffect, useRef } from "react";
import { applyPaletteThemeColor, PALETTE_KEY, readPalette } from "../lib/appearance";

/**
 * The colour wash behind every screen: three soft blobs that drift slowly (paused when the page is hidden).
 * It also follows a palette chosen in another open window of Pécule.
 */
export default function GlassBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => ref.current?.toggleAttribute("data-paused", document.hidden);
    const palette = (event: StorageEvent) => {
      if (event.key !== PALETTE_KEY) return;
      document.documentElement.dataset.palette = readPalette(event.newValue);
      applyPaletteThemeColor(event.newValue);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("storage", palette);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("storage", palette);
    };
  }, []);
  return (
    <div ref={ref} className="glass-backdrop" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
