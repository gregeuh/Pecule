"use client";

import { useEffect, useRef } from "react";
import { Check, Wallet } from "lucide-react";
import confirmation from "./animations/confirmation.json";
import wallet from "./animations/wallet.json";

/** One-shot illustration, rendered locally with the official LottieFiles player. */
export default function ConfirmationArt({variant="confirmation"}:{variant?:"confirmation"|"wallet"}) {
  const container = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let player: import("@lottiefiles/dotlottie-web").DotLottie | undefined;
    const stop = () => {
      player?.destroy();
      player = undefined;
      container.current?.removeAttribute("data-ready");
    };
    const play = async () => {
      if (preference.matches || cancelled || !canvas.current) return;
      try {
        const { DotLottie } = await import("@lottiefiles/dotlottie-web");
        if (cancelled || preference.matches || !canvas.current || !container.current) return;
        DotLottie.setWasmUrl("/animations/dotlottie-player-0.81.0.wasm");
        const data = structuredClone(variant === "wallet" ? wallet : confirmation);
        const color = getComputedStyle(container.current).color.match(/[\d.]+/g)?.slice(0, 3).map(n => Number(n) / 255);
        if (color?.length === 3) for (const layer of data.layers.slice(0, variant === "wallet" ? 1 : 2)) {
          for (const shape of layer.shapes) if ("c" in shape && shape.c) shape.c.k = [...color, 1];
        }
        player = new DotLottie({ canvas: canvas.current, data, autoplay: true, loop: false,
          renderConfig: { devicePixelRatio: Math.min(devicePixelRatio || 1, 2), freezeOnOffscreen: true } });
        player.addEventListener("load", () => container.current?.setAttribute("data-ready", "true"));
        player.addEventListener("loadError", stop);
      } catch { stop(); } // The immediate SVG check remains if loading is unavailable.
    };
    const onPreference = () => { stop(); if (!preference.matches) void play(); };
    const onVisibility = () => { if (document.hidden) player?.pause(); };
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    void play();
    return () => {
      cancelled = true; stop();
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant]);

  return <span ref={container} className={`confirmation-art ${variant === "wallet" ? "wallet-art" : ""}`} aria-hidden="true">
    {variant === "wallet" ? <Wallet className="confirmation-fallback" size={32} strokeWidth={1.5} /> : <Check className="confirmation-fallback" size={25} strokeWidth={2} />}
    <canvas ref={canvas} width={96} height={96} />
  </span>;
}
