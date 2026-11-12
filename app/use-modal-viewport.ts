"use client";
import {useLayoutEffect,type RefObject} from 'react';
/** Fit the existing sheet to the visible iOS viewport without resizing the page shell. */
export function useModalViewport(active:boolean,ref:RefObject<HTMLDivElement|null>){
 useLayoutEffect(()=>{
  if(!active||!ref.current)return;
  const surface=ref.current,viewport=window.visualViewport;let frame=0;
  const mutation=typeof MutationObserver==='undefined'?null:new MutationObserver(()=>schedule());
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>schedule());let observed:HTMLElement|null=null;
  const update=()=>{frame=0;const zoomed=(viewport?.scale??1)>1.05,height=zoomed?window.innerHeight:viewport?.height??window.innerHeight,top=zoomed?0:viewport?.offsetTop??0;
   surface.style.setProperty('--modal-viewport-height',`${Math.max(1,height)}px`);
   surface.style.setProperty('--modal-viewport-top',`${Math.max(0,top)}px`);
   const field=document.activeElement instanceof HTMLElement?document.activeElement:null;
   // Keep the compact frame until the native keyboard has actually left the viewport.
   surface.dataset.keyboardOpen=String((viewport?.scale??1)<1.1&&height<document.documentElement.clientHeight-120);
   const scroller=field?.closest<HTMLElement>('.capture-body, .panel-form-body');
   if(scroller&&!zoomed){
    const area=scroller.getBoundingClientRect(),label=field!.closest<HTMLElement>('.field'),control=field!.getBoundingClientRect(),group=label?.getBoundingClientRect(),target=group&&group.height<=area.height-16?group:control;
    const delta=target.top<area.top+8?target.top-area.top-8:target.bottom>area.bottom-8?target.bottom-area.bottom+8:0;if(delta)scroller.scrollTop+=delta;
    if(observed!==field){resize?.disconnect();mutation?.disconnect();mutation?.observe(scroller,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden']});resize?.observe(scroller);if(label)resize?.observe(label);observed=field;}
   }
   // The quick-capture preview shares the amount's focus viewport when both fit.
   // Scroll its body, never the document or a different form variant.
   if(surface.dataset.keyboardOpen==='true'&&field?.getAttribute('name')==='amount'&&scroller?.matches('.capture-body')){
    const amount=field,values=scroller.querySelector('.balance-preview-values');
    if(amount&&values){const area=scroller.getBoundingClientRect(),start=amount.getBoundingClientRect(),end=values.getBoundingClientRect();
     if(end.bottom-start.top<=area.height-12){const delta=Math.min(end.bottom-area.bottom+6,start.top-area.top-6);if(delta>0)scroller.scrollTop+=delta;}
    }
   }
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};update();
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);surface.addEventListener('focusin',schedule);surface.addEventListener('focusout',schedule);surface.addEventListener('input',schedule);
  return()=>{cancelAnimationFrame(frame);resize?.disconnect();mutation?.disconnect();viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);surface.removeEventListener('focusin',schedule);surface.removeEventListener('focusout',schedule);surface.removeEventListener('input',schedule);surface.style.removeProperty('--modal-viewport-height');surface.style.removeProperty('--modal-viewport-top');delete surface.dataset.keyboardOpen;};
 },[active,ref]);
}
