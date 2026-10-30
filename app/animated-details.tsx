"use client";

import { useCallback, useEffect, useRef, type ComponentProps, type MouseEvent } from "react";

/** Native disclosure semantics, with reversible height motion and no extra DOM wrapper. */
export default function AnimatedDetails({children,className,onClick,...props}:ComponentProps<"details">) {
  const element = useRef<HTMLDetailsElement>(null), animation = useRef<Animation | null>(null);
  const closedHeight=useRef<number|null>(null);
  const desired = useRef<boolean | null>(null), generation = useRef(0), overflow = useRef("");
  const settle = useCallback(() => {
    const current=element.current;if(!current)return;
    generation.current++;animation.current?.cancel();animation.current=null;
    if(desired.current!==null)current.open=desired.current;
    current.style.overflow=overflow.current;desired.current=null;
  },[]);
  const dispose=useCallback(()=>{generation.current++;animation.current?.cancel();},[]);
  useEffect(()=>{
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    const reduce=()=>{if(media.matches)settle();};media.addEventListener("change",reduce);
    const current=element.current,reveal=()=>{desired.current=true;settle();};current?.addEventListener("pecule:reveal",reveal);
    return()=>{dispose();media.removeEventListener("change",reduce);current?.removeEventListener("pecule:reveal",reveal);};
  },[settle,dispose]);
  const toggle=(event:MouseEvent<HTMLDetailsElement>)=>{
    onClick?.(event);if(event.defaultPrevented)return;
    const current=event.currentTarget,summary=current.querySelector<HTMLElement>(":scope > summary");
    if(!summary?.contains(event.target as Node))return;
    event.preventDefault();summary.focus({preventScroll:true});
    const expanded=!(desired.current??current.open),from=current.getBoundingClientRect().height;
    if(!current.open)closedHeight.current=from;
    const request=++generation.current;
    if(!animation.current)overflow.current=current.style.overflow;
    animation.current?.cancel();desired.current=expanded;
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){settle();return;}
    const style=getComputedStyle(current),header=getComputedStyle(summary);
    const number=(value:string)=>parseFloat(value)||0;
    const closed=closedHeight.current??summary.getBoundingClientRect().height+number(style.paddingTop)+number(style.paddingBottom)+number(style.borderTopWidth)+number(style.borderBottomWidth)+number(header.marginTop)+number(header.marginBottom);
    current.open=true;const opened=current.getBoundingClientRect().height;
    current.style.overflow="clip";
    const motion=current.animate([{height:`${from}px`},{height:`${expanded?opened:closed}px`}],{duration:expanded?260:170,easing:"cubic-bezier(.16,1,.3,1)"});
    animation.current=motion;
    void motion.finished.then(()=>{if(request===generation.current)settle();}).catch(()=>{});
  };
  return <details {...props} className={`${className??""} animated-details`} ref={element} onClick={toggle}>{children}</details>;
}
