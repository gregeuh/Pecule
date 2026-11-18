"use client";
import {useLayoutEffect,type RefObject} from 'react';
/** Keep recession anchored to the visible viewport even deep in a long ledger. */
export function usePreviewDepth(active:boolean,surface:RefObject<HTMLDivElement|null>){
 useLayoutEffect(()=>{
  const element=surface.current;if(!active||!element)return;
  const update=()=>{const viewport=window.visualViewport;const anchor=(viewport?.offsetTop??0)+(viewport?.height??innerHeight)*.35;element.style.setProperty('--depth-origin-y',`${anchor-element.getBoundingClientRect().top}px`);};
  update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);
  return()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};
 },[active,surface]);
}
