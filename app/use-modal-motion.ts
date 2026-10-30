"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** One persistent surface for entry, menu-to-form continuity and dismissals. */
export function useModalMotion<T>() {
  const [modal, commit] = useState<T | null>(null);
  const current = useRef<T | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null), backdropRef = useRef<HTMLDivElement>(null), shadeRef=useRef<HTMLDivElement>(null);
  const closingRef = useRef(false), version = useRef(0), animations = useRef<Animation[]>([]);
  const previous = useRef<DOMRect | null>(null), origin = useRef<DOMRect | null>(null);
  const cancel = useCallback(() => { for (const animation of animations.current) animation.cancel(); animations.current = []; }, []);
  const setModal = useCallback((next: T | null) => {
    if (next !== null) {
      version.current++; closingRef.current = false;
      previous.current = current.current ? dialogRef.current?.getBoundingClientRect() ?? null : null;
      origin.current = document.activeElement?.getBoundingClientRect() ?? null;
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
    const options:KeyframeAnimationOptions = {duration:mobile?200:170,easing:"cubic-bezier(.4,0,1,1)",fill:"forwards"};
    const panel = dialog.animate([{opacity:1,transform,height:`${rect.height}px`,width:`${rect.width}px`,maxWidth:`${rect.width}px`},{opacity:mobile?1:0,transform:`translateY(${mobile?distance:14}px)`,height:`${rect.height}px`,width:`${rect.width}px`,maxWidth:`${rect.width}px`}],options);
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
    const ease = "cubic-bezier(.16,1,.3,1)";
    const request = version.current;
    if (before) {
      const x = mobile ? 0 : before.left+before.width/2-now.left-now.width/2;
      const y = mobile ? 0 : before.top+before.height/2-now.top-now.height/2;
      const morph = panel.animate([
        {height:`${before.height}px`,width:`${before.width}px`,maxWidth:`${before.width}px`,transform:`translate(${x}px,${y}px)`},
        {height:`${now.height}px`,width:`${now.width}px`,maxWidth:`${now.width}px`,transform:"none"},
      ],{duration:300,easing:ease});
      const heading = panel.querySelector(".modal-heading");
      animations.current = [morph,...(heading ? [heading.animate([{opacity:.5,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:220,easing:ease})] : [])];
    } else {
      const from = origin.current;
      const x = !mobile && from && panel.classList.contains("actions-modal") ? Math.max(-24,Math.min(24,from.left+from.width/2-now.left-now.width/2)) : 0;
      const distance=Math.max(24,innerHeight-now.top+8);
      const enter = panel.animate([{opacity:mobile?1:0,transform:`translate(${x}px,${mobile?distance:12}px) scale(${mobile?1:.98})`},{opacity:1,transform:"none"}],{duration:300,easing:ease});
      const shade = backdrop.animate([{opacity:0},{opacity:1}],{duration:200,easing:"ease-out"});
      animations.current = [enter,shade];
    }
    void Promise.allSettled(animations.current.map(animation=>animation.finished)).then(()=>{if(request===version.current&&!closingRef.current)panel.dataset.motion="idle";});
  }, [modal,cancel]);
  const dispose=useCallback(()=>{version.current++;cancel();},[cancel]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (media.matches) { cancel(); if(dialogRef.current)dialogRef.current.dataset.motion="idle"; } };
    const resize=()=>{cancel();if(dialogRef.current)dialogRef.current.dataset.motion="idle";};
    media.addEventListener("change",reduce);window.addEventListener("resize",resize);
    return () => { dispose(); media.removeEventListener("change",reduce);window.removeEventListener("resize",resize); };
  }, [cancel,dispose]);
  return {modal,setModal,dialogRef,backdropRef,shadeRef,closingRef};
}
