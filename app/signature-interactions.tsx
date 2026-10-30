"use client";

import { useLayoutEffect, useRef } from "react";

export function WalletActionIcon({ open = false }: { open?: boolean }) {
  return <svg className="wallet-action-icon" data-open={open} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path className="wallet-flap" d="M5 13V9a3 3 0 0 1 3-3h16v8" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.6"/>
    <rect x="4" y="12" width="24" height="16" rx="5" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M24 17v6M21 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M10 23v-7h3a2 2 0 0 1 0 4h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}

export function PrivacyShutter({ hidden }: { hidden: boolean }) {
  return <svg className="privacy-shutter" data-hidden={hidden} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6"/>
    <path className="privacy-door privacy-door-left" d="M3 7h8v10H3Z" fill="currentColor"/>
    <path className="privacy-door privacy-door-right" d="M13 7h8v10h-8Z" fill="currentColor"/>
  </svg>;
}

/** The same indicator follows the current destination in desktop and mobile navigation. */
export function NavigationIndicator({ active }: { active: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = marker.current, nav = element?.parentElement;
    if (!element || !nav) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = nav.querySelector<HTMLElement>('button[aria-current="page"]');
      if (!current || !current.getBoundingClientRect().width) { element.removeAttribute("data-ready"); return; }
      const box = current.getBoundingClientRect(), parent = nav.getBoundingClientRect();
      element.style.width = `${box.width}px`; element.style.height = `${box.height}px`;
      element.style.transform = `translate(${box.left-parent.left-nav.clientLeft+nav.scrollLeft}px, ${box.top-parent.top-nav.clientTop+nav.scrollTop}px)`;
      element.setAttribute("data-ready", "true");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule); observer.observe(nav);
    const current = nav.querySelector('button[aria-current="page"]'); if (current) observer.observe(current);
    window.addEventListener("resize", schedule);
    return () => { observer.disconnect(); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, [active]);
  return <span ref={marker} className="navigation-indicator" aria-hidden="true"/>;
}

const silhouettes = {
  suitcase: "M25 34h46v39H25ZM38 34v-8h20v8M36 40v27M60 40v27M32 77v3M64 77v3",
  house: "M18 47 48 23 78 47M27 42v35h42V42M41 77V57h14v20M34 47h8M57 47h6",
  shield: "M48 20 73 30 69 59Q65 73 48 82 31 73 27 59L23 30ZM35 49l9 9 18-21",
  spark: "M48 20 55 40 76 48 55 55 48 76 41 55 20 48 41 40ZM27 22v10M22 27h10M73 68v10M68 73h10",
};
export function GoalIllustration({ icon, progress }: { icon: string; progress: number }) {
  const kind = icon === "home" ? "house" : icon === "shield" ? "shield" : icon === "plane" || icon === "sun" ? "suitcase" : "spark";
  const value = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  return <svg className="goal-illustration" data-project={kind} data-progress={Math.round(value)} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <ellipse cx="48" cy="85" rx="29" ry="4" fill="currentColor" opacity=".09"/>
    <path d={silhouettes[kind]} stroke="currentColor" strokeWidth="2.5" opacity=".18" strokeLinecap="round" strokeLinejoin="round"/>
    <path className="goal-building-line" d={silhouettes[kind]} pathLength="100" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset={100-value} strokeLinecap="round" strokeLinejoin="round"/>
    <circle className="goal-piece" cx="76" cy="20" r="9" fill="var(--apricot-surface)" stroke="var(--apricot-ink)" strokeWidth="1.3" style={{opacity:value>=100?1:0}}/>
    <path className="goal-piece" d="m72 20 3 3 5-6" stroke="var(--apricot-ink)" strokeWidth="1.5" strokeLinecap="round" style={{opacity:value>=100?1:0}}/>
  </svg>;
}

export type OccurrenceReceipt = { date: string; nextDate?: string };
export function CalendarReceipt({ date, nextDate }: OccurrenceReceipt) {
  const finalDate = nextDate ?? date;
  return <span className="confirmation-art calendar-receipt" data-has-next={!!nextDate} aria-hidden="true">
    <svg viewBox="0 0 96 96" fill="none">
      <rect x="17" y="20" width="62" height="61" rx="11" fill="var(--signature-green)" stroke="var(--signature-mint)" strokeWidth="1.4"/>
      <path d="M18 38h60M33 15v13M63 15v13" stroke="var(--signature-mint)" strokeWidth="3" strokeLinecap="round"/>
      <text x="48" y="65" textAnchor="middle" fill="var(--signature-paper)" fontSize="27" fontWeight="650">{Number(finalDate.slice(8,10))}</text>
      {nextDate && <g className="calendar-old"><rect x="20" y="39" width="56" height="38" rx="5" fill="var(--signature-green)"/><text x="48" y="65" textAnchor="middle" fill="var(--signature-paper)" fontSize="27" fontWeight="650">{Number(date.slice(8,10))}</text></g>}
      <g className="calendar-stamp"><circle cx="70" cy="73" r="12" fill="var(--signature-apricot)"/><path d="m64 73 4 4 8-9" stroke="var(--signature-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
  </span>;
}
