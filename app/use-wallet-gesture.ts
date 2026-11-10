"use client";

import {useEffect, useRef, type PointerEvent, type RefObject} from 'react';
import {springStep} from '../lib/motion-spring';

/** A grabbed sheet keeps its rendered position, including during its return. */
export function useWalletGesture(dialogRef: RefObject<HTMLDivElement|null>, onClose: ()=>void) {
 const state=useRef({position:0,velocity:0,frame:0});
 const drag=useRef<{pointer:number;y:number;origin:number;last:number;time:number}|null>(null);
 const stop=()=>{cancelAnimationFrame(state.current.frame);state.current.frame=0;};
 const reset=()=>{stop();drag.current=null;state.current.position=0;state.current.velocity=0;if(dialogRef.current)dialogRef.current.style.transform='';};
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const settle=()=>{cancelAnimationFrame(state.current.frame);state.current.frame=0;drag.current=null;state.current.position=0;state.current.velocity=0;if(dialogRef.current)dialogRef.current.style.transform='';};
  const additional=(event:globalThis.PointerEvent)=>{if(!event.isPrimary)settle();};
  document.addEventListener('pointerdown',additional,true);
  const hidden=()=>{if(document.hidden)settle();};
  window.addEventListener('resize',settle);media.addEventListener('change',settle);document.addEventListener('visibilitychange',hidden);
  return()=>{settle();document.removeEventListener('pointerdown',additional,true);window.removeEventListener('resize',settle);media.removeEventListener('change',settle);document.removeEventListener('visibilitychange',hidden);};
 },[dialogRef]);
 const down=(e:PointerEvent<HTMLDivElement>)=>{
  if(!e.isPrimary){reset();return;}
  if((window.visualViewport?.scale??1)>1.05||!e.isPrimary||e.button!==0||drag.current||dialogRef.current?.dataset.motion!=='idle'||e.target instanceof Element&&e.target.closest('button'))return;
  stop();drag.current={pointer:e.pointerId,y:e.clientY,origin:state.current.position,last:e.clientY,time:performance.now()};
  e.currentTarget.setPointerCapture(e.pointerId);
 };
 const move=(e:PointerEvent<HTMLDivElement>)=>{
  const d=drag.current;if((window.visualViewport?.scale??1)>1.05){reset();return;}if(!d||d.pointer!==e.pointerId||!dialogRef.current)return;
  const now=performance.now();state.current.velocity=(e.clientY-d.last)/Math.max(1,now-d.time)*1000;d.last=e.clientY;d.time=now;
  state.current.position=Math.max(0,d.origin+e.clientY-d.y);dialogRef.current.style.transform=`translateY(${state.current.position}px)`;
 };
 const release=(e:PointerEvent<HTMLDivElement>)=>{
  const d=drag.current,dialog=dialogRef.current;if(!d||d.pointer!==e.pointerId||!dialog)return;
  drag.current=null;const s=state.current;
  // A pause is not a flick: do not reuse velocity from an old pointer sample.
  if(performance.now()-d.time>100)s.velocity=0;
  if(s.position>95||s.position>20&&s.velocity>650){onClose();return;}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){reset();return;}
  s.velocity=Math.max(-800,Math.min(800,s.velocity));let previous=performance.now();
  const tick=(now:number)=>{
   const next=springStep(s.position,s.velocity,0,(now-previous)/1000);previous=now;s.position=Math.max(0,next.position);s.velocity=next.velocity;
   if(s.position<.1&&Math.abs(s.velocity)<1){reset();return;}
   dialog.style.transform=`translateY(${s.position}px)`;s.frame=requestAnimationFrame(tick);
  };
  s.frame=requestAnimationFrame(tick);
 };
 const cancel=(e:PointerEvent<HTMLDivElement>)=>{if(drag.current?.pointer===e.pointerId)reset();};
 return {onPointerDown:down,onPointerMove:move,onPointerUp:release,onPointerCancel:cancel,onLostPointerCapture:cancel};
}
