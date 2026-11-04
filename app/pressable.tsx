"use client";
import {useEffect,useRef,type ButtonHTMLAttributes,type PointerEvent} from 'react';

/** Native click remains the default; movement cancels the deliberate hold. */
export default function Pressable({onHold,onSwipeLeft,onClick,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{onHold?:()=>void;onSwipeLeft?:()=>void}){
 const active=useRef<{id:number;x:number;y:number;edge:boolean;target:HTMLButtonElement}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),blocked=useRef(false);
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;active.current?.target.removeAttribute('data-holding');};
 const cancel=()=>{clear();active.current=null;};
 useEffect(()=>{const stop=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;active.current?.target.removeAttribute('data-holding');active.current=null;};window.addEventListener('scroll',stop,true);window.addEventListener('resize',stop);document.addEventListener('visibilitychange',stop);return()=>{stop();window.removeEventListener('scroll',stop,true);window.removeEventListener('resize',stop);document.removeEventListener('visibilitychange',stop);};},[]);
 const down=(e:PointerEvent<HTMLButtonElement>)=>{
  if(!e.isPrimary||e.button!==0||props.disabled)return;e.stopPropagation();cancel();blocked.current=false;
  const target=e.currentTarget;active.current={id:e.pointerId,x:e.clientX,y:e.clientY,edge:e.clientX<24||e.clientX>innerWidth-24,target};
  target.setPointerCapture(e.pointerId);target.dataset.holding='true';
  if(onHold)timer.current=setTimeout(()=>{clear();blocked.current=true;target.focus({preventScroll:true});onHold();},480);
 };
 const move=(e:PointerEvent<HTMLButtonElement>)=>{const a=active.current;if(!a||a.id!==e.pointerId)return;if(Math.hypot(e.clientX-a.x,e.clientY-a.y)>8){clear();blocked.current=true;}};
 const up=(e:PointerEvent<HTMLButtonElement>)=>{const a=active.current;if(!a||a.id!==e.pointerId)return;const dx=e.clientX-a.x,dy=e.clientY-a.y;clear();active.current=null;if(!a.edge&&onSwipeLeft&&matchMedia('(max-width:760px)').matches&&dx< -55&&Math.abs(dx)>Math.abs(dy)*1.5){blocked.current=true;onSwipeLeft();}};
 return <button aria-haspopup={onHold?"dialog":undefined} {...props} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel} onContextMenu={e=>{if(onHold){e.preventDefault();cancel();blocked.current=true;e.currentTarget.focus({preventScroll:true});onHold();}}} onClick={e=>{if(e.detail!==0&&blocked.current){blocked.current=false;e.preventDefault();e.stopPropagation();return;}onClick?.(e);}}/>;
}
