"use client";
import { useRef, type ReactNode } from "react";

/**
 * A block of the iPhone home. A long press (about half a second, finger still) opens « Mon accueil »; the tap that
 * ends it does nothing else. Empty blocks (nothing to say this month) take no room.
 */
export default function HomeBlockFrame({ children, onLongPress }: { children: ReactNode; onLongPress: () => void }) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  if (!children) return null;
  return (
    <div
      className="home-block"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        cancel();
        timer.current = window.setTimeout(() => {
          fired.current = true;
          navigator.vibrate?.(10);
          onLongPress();
        }, 550);
      }}
      onPointerMove={(e) => {
        if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => {
        if (fired.current) e.preventDefault();
      }}
      onClickCapture={(e) => {
        if (!fired.current) return;
        fired.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
