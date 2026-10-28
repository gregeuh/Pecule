"use client";

import { useEffect, useRef } from "react";
import { Check, Wallet, Repeat2, Files, Coins, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { ConfirmationKind } from "../lib/confirmation-kind";
import confirmation from "./animations/confirmation.json";
import wallet from "./animations/wallet.json";
import operation from "./animations/operation.json";
import recurrence from "./animations/recurrence.json";
import imported from "./animations/import.json";
import savings from "./animations/savings.json";
import goal from "./animations/goal.json";
import settings from "./animations/settings.json";

const animations = { confirmation, wallet, operation, recurrence, import: imported, savings, goal, settings };
const fallbackIcons = { confirmation: Check, wallet: Wallet, operation: Wallet, recurrence: Repeat2, import: Files, savings: Coins, goal: ShieldCheck, settings: SlidersHorizontal };
type ArtKind = Exclude<ConfirmationKind,"occurrence"> | "wallet";

/** Original Pécule scenes, played once with the official, locally hosted LottieFiles renderer. */
export default function ConfirmationArt({ variant = "confirmation" }: { variant?: ArtKind }) {
  const container = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const Fallback = fallbackIcons[variant];

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    let cancelled = false, generation = 0, completed = false;
    let player: import("@lottiefiles/dotlottie-web").DotLottie | undefined;
    const stop = () => {
      generation++;
      player?.destroy(); player = undefined;
      container.current?.removeAttribute("data-ready");
      container.current?.removeAttribute("data-complete");
    };
    const play = async () => {
      const current = ++generation;
      if (preference.matches || contrast.matches || cancelled || !canvas.current) return;
      try {
        const { DotLottie } = await import("@lottiefiles/dotlottie-web");
        if (cancelled || current !== generation || preference.matches || contrast.matches || !canvas.current) return;
        DotLottie.setWasmUrl("/animations/dotlottie-player-0.81.0.wasm");
        completed = false;
        const instance = new DotLottie({ canvas: canvas.current, data: JSON.stringify(animations[variant]), autoplay: !document.hidden, loop: false,
          renderConfig: { devicePixelRatio: Math.min(devicePixelRatio || 1, 2), freezeOnOffscreen: true } });
        player = instance;
        const active = () => !cancelled && current === generation && player === instance;
        instance.addEventListener("load", () => { if (active()) { container.current?.setAttribute("data-ready", "true"); if (document.hidden) instance.pause(); } });
        instance.addEventListener("complete", () => { if (active()) { completed = true; container.current?.setAttribute("data-complete", "true"); } });
        instance.addEventListener("loadError", () => { if (active()) stop(); });
      } catch { if (current === generation) stop(); } // Keep the immediate static symbol if rendering cannot start.
    };
    const onPreference = () => { stop(); if (!preference.matches && !contrast.matches) void play(); };
    const onVisibility = () => { if (document.hidden) player?.pause(); else if (!completed) player?.play(); };
    preference.addEventListener("change", onPreference);
    contrast.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    void play();
    return () => {
      cancelled = true; stop();
      preference.removeEventListener("change", onPreference);
      contrast.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant]);

  return <span ref={container} className={`confirmation-art ${variant === "wallet" ? "wallet-art" : ""}`} data-illustration={variant} aria-hidden="true">
    <Fallback className="confirmation-fallback" size={variant === "wallet" ? 36 : 30} strokeWidth={1.7} />
    <canvas ref={canvas} width={160} height={160} />
  </span>;
}
