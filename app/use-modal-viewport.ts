"use client";
import {useLayoutEffect,type RefObject} from 'react';
/** Fit the existing sheet to the visible iOS viewport without resizing the page shell. */
export function useModalViewport(active:boolean,ref:RefObject<HTMLDivElement|null>){
 useLayoutEffect(()=>{
  if(!active||!ref.current)return;
  const surface=ref.current,viewport=window.visualViewport;let frame=0;
  const update=()=>{frame=0;const height=viewport?.height??window.innerHeight,top=viewport?.offsetTop??0;
   surface.style.setProperty('--modal-viewport-height',`${Math.max(1,height)}px`);
   surface.style.setProperty('--modal-viewport-top',`${Math.max(0,top)}px`);
   const field=document.activeElement instanceof HTMLElement?document.activeElement:null;
   const editing=!!field?.matches('input:not([type=radio]):not([type=checkbox]),textarea,[contenteditable=true]');
   surface.dataset.keyboardOpen=String(editing&&(viewport?.scale??1)<1.1&&height<document.documentElement.clientHeight-120);
   const scroller=field?.closest<HTMLElement>('.capture-body');
   if(scroller){const area=scroller.getBoundingClientRect(),control=field!.getBoundingClientRect();if(control.bottom>area.bottom||control.top<area.top)field!.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};update();
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);surface.addEventListener('focusin',schedule);surface.addEventListener('focusout',schedule);
  return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);surface.removeEventListener('focusin',schedule);surface.removeEventListener('focusout',schedule);surface.style.removeProperty('--modal-viewport-height');surface.style.removeProperty('--modal-viewport-top');delete surface.dataset.keyboardOpen;};
 },[active,ref]);
}
