"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { motionSettings } from "./ui-motion";

/** One persistent surface for entry, menu-to-form continuity and dismissals. */
export function useModalMotion<T>() {
  const [modal, commit] = useState<T | null>(null);
  const current = useRef<T | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null), backdropRef = useRef<HTMLDivElement>(null), shadeRef=useRef<HTMLDivElement>(null);
  const closingRef = useRef(false), version = useRef(0), animations = useRef<Animation[]>([]);
  const previous = useRef<DOMRect | null>(null), origin = useRef<DOMRect | null>(null), trigger = useRef<HTMLElement | null>(null);
  const cancel = useCallback(() => { for (const animation of animations.current) animation.cancel(); animations.current = []; }, []);
  const setModal = useCallback((next: T | null) => {
    if (next !== null) {
      version.current++; closingRef.current = false;
      previous.current = current.current ? dialogRef.current?.getBoundingClientRect() ?? null : null;
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      origin.current = trigger.current?.getBoundingClientRect() ?? null;
      cancel(); current.current = next; commit(next); return;
    }
    if (!current.current || closingRef.current) return;
    const request = ++version.current, dialog = dialogRef.current, backdrop = shadeRef.current;
    const finish = () => {
      if (request !== version.current) return;
      current.current = null;
      commit(null);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !dialog || !backdrop) { finish(); return; }
    const rect = dialog.getBoundingClientRect(), transform = getComputedStyle(dialog).transform;
    cancel(); closingRef.current = true; dialog.dataset.motion = "closing";
    const mobile=matchMedia("(max-width: 760px), (hover: none) and (pointer: coarse)").matches;
    const distance=Math.max(24,innerHeight-rect.top+8);
    const timing = motionSettings(dialog);
    const options:KeyframeAnimationOptions = {duration:timing.exit,easing:timing.exitEase,fill:"forwards"};
    const source=dialog.classList.contains("wallet-account-modal")&&trigger.current?.matches("[data-wallet-account]")&&trigger.current.isConnected?trigger.current.getBoundingClientRect():null;
    const contextual=dialog.classList.contains("context-preview-modal");
    const panel = source ? dialog.animate([
      {position:"fixed",top:`${rect.top}px`,left:`${rect.left}px`,right:"auto",bottom:"auto",margin:"0",opacity:1,transform:"none",height:`${rect.height}px`,width:`${rect.width}px`,maxWidth:`${rect.width}px`},
      {position:"fixed",top:`${source.top}px`,left:`${source.left}px`,right:"auto",bottom:"auto",margin:"0",opacity:1,transform:"none",height:`${source.height}px`,width:`${source.width}px`,maxWidth:`${source.width}px`,borderRadius:"19px"}
    ],{...options,duration:timing.walletExit,easing:timing.ease}) : dialog.animate([{opacity:1,transform,height:`${rect.height}px`,width:`${rect.width}px`,maxWidth:`${rect.width}px`},{opacity:contextual?0:mobile?1:0,transform:contextual?"translateY(10px) scale(.97)":`translateY(${mobile?distance:14}px)`,height:`${rect.height}px`,width:`${rect.width}px`,maxWidth:`${rect.width}px`}],options);
    const shade = backdrop.animate([{opacity:1},{opacity:0}],options);
    animations.current = [panel,shade];
    void Promise.allSettled([panel.finished,shade.finished]).then(finish);
  }, [cancel]);

  useLayoutEffect(() => {
    if(modal===null){cancel();closingRef.current=false;return;}
    if (!modal || !dialogRef.current || !shadeRef.current) return;
    const panel = dialogRef.current, backdrop = shadeRef.current;
    panel.scrollTop = 0;
    const before = previous.current;
    panel.dataset.motion = before ? "switching" : "opening";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { panel.dataset.motion = "idle"; return; }
    const now = panel.getBoundingClientRect(), mobile = matchMedia("(max-width: 760px), (hover: none) and (pointer: coarse)").matches;
    const timing = motionSettings(panel), ease = timing.ease;
    const request = version.current;
    if (before) {
      // Pin both rectangles during resizing; flex centering must not move the start.
      const morph = panel.animate([
        {position:"fixed",top:`${before.top}px`,left:`${before.left}px`,right:"auto",bottom:"auto",margin:"0",height:`${before.height}px`,width:`${before.width}px`,maxWidth:`${before.width}px`,transform:"none"},
        {position:"fixed",top:`${now.top}px`,left:`${now.left}px`,right:"auto",bottom:"auto",margin:"0",height:`${now.height}px`,width:`${now.width}px`,maxWidth:`${now.width}px`,transform:"none"},
      ],{duration:timing.layout,easing:ease});
      const heading = panel.querySelector(".modal-heading");
      animations.current = [morph,...(heading ? [heading.animate([{opacity:.5,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:timing.layout * .65,easing:ease})] : [])];
    } else {
      const from = origin.current;
      const x = !mobile && from && panel.classList.contains("actions-modal") ? Math.max(-24,Math.min(24,from.left+from.width/2-now.left-now.width/2)) : 0;
      const distance=Math.max(24,innerHeight-now.top+8);
      const wallet=panel.classList.contains("wallet-account-modal")&&trigger.current?.matches("[data-wallet-account]")&&from;
      const contextual=panel.classList.contains("context-preview-modal");
      const enter = wallet ? panel.animate([
        {position:"fixed",top:`${from.top}px`,left:`${from.left}px`,right:"auto",bottom:"auto",margin:"0",opacity:1,height:`${from.height}px`,width:`${from.width}px`,maxWidth:`${from.width}px`,transform:"none",borderRadius:"19px"},
        {position:"fixed",top:`${now.top}px`,left:`${now.left}px`,right:"auto",bottom:"auto",margin:"0",opacity:1,height:`${now.height}px`,width:`${now.width}px`,maxWidth:`${now.width}px`,transform:"none"}
      ],{duration:timing.walletEnter,easing:ease}) : panel.animate([{opacity:contextual?.7:mobile?1:0,transform:contextual?"translateY(14px) scale(.96)":`translate(${x}px,${mobile?distance:12}px) scale(${mobile?1:.98})`},{opacity:1,transform:"none"}],{duration:timing.enter,easing:ease});
      const shade = backdrop.animate([{opacity:0},{opacity:1}],{duration:timing.exit,easing:"ease-out"});
      animations.current = [enter,shade];
    }
    void Promise.allSettled(animations.current.map(animation=>animation.finished)).then(()=>{if(request===version.current&&!closingRef.current)panel.dataset.motion="idle";});
  }, [modal,cancel]);
  const dispose=useCallback(()=>{version.current++;cancel();},[cancel]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (media.matches) { cancel(); if(dialogRef.current)dialogRef.current.dataset.motion="idle"; } };
    const resize=()=>{cancel();if(dialogRef.current)dialogRef.current.dataset.motion="idle";};
    media.addEventListener("change",reduce);window.addEventListener("resize",resize);window.visualViewport?.addEventListener("resize",resize);
    return () => { dispose(); media.removeEventListener("change",reduce);window.removeEventListener("resize",resize);window.visualViewport?.removeEventListener("resize",resize); };
  }, [cancel,dispose]);
  return {modal,setModal,dialogRef,backdropRef,shadeRef,closingRef};
}
