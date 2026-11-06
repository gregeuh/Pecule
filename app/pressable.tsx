"use client";
import {useEffect,useRef,type ButtonHTMLAttributes,type PointerEvent} from 'react';

/** Native click stays primary. Motion describes the hold, never a financial action. */
export default function Pressable({onHold,onSwipeLeft,onClick,depth=false,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{onHold?:()=>void;onSwipeLeft?:()=>void;depth?:boolean}){
 const active=useRef<{id:number;x:number;y:number;edge:boolean;target:HTMLButtonElement;rect:DOMRect;reduced:boolean}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),lift=useRef<ReturnType<typeof setTimeout>|null>(null),blocked=useRef(false);
 const clear=()=>{if(timer.current)clearTimeout(timer.current);if(lift.current)clearTimeout(lift.current);timer.current=lift.current=null;const target=active.current?.target;if(target){delete target.dataset.pressing;delete target.dataset.holding;for(const v of ['--depth-pitch','--depth-yaw','--depth-light'])target.style.removeProperty(v);}};
 const cancel=()=>{if(active.current)blocked.current=true;clear();active.current=null;};
 useEffect(()=>{
  const stop=()=>{if(active.current)blocked.current=true;if(timer.current)clearTimeout(timer.current);if(lift.current)clearTimeout(lift.current);timer.current=lift.current=null;const target=active.current?.target;if(target){delete target.dataset.pressing;delete target.dataset.holding;for(const v of ['--depth-pitch','--depth-yaw','--depth-light'])target.style.removeProperty(v);}active.current=null;};
  const media=matchMedia('(prefers-reduced-motion:reduce)');
  window.addEventListener('scroll',stop,true);window.addEventListener('resize',stop);document.addEventListener('visibilitychange',stop);media.addEventListener('change',stop);
  return()=>{stop();window.removeEventListener('scroll',stop,true);window.removeEventListener('resize',stop);document.removeEventListener('visibilitychange',stop);media.removeEventListener('change',stop);};
 },[]);
 const paint=(a:NonNullable<typeof active.current>,x:number,y:number)=>{if(!depth||a.reduced)return;const px=Math.max(-.5,Math.min(.5,(x-a.rect.left)/a.rect.width-.5)),py=Math.max(-.5,Math.min(.5,(y-a.rect.top)/a.rect.height-.5));a.target.style.setProperty('--depth-pitch',`${-py*6}deg`);a.target.style.setProperty('--depth-yaw',`${px*7}deg`);a.target.style.setProperty('--depth-light',`${120+px*24}deg`);};
 const down=(e:PointerEvent<HTMLButtonElement>)=>{
  if(!e.isPrimary||e.button!==0||props.disabled)return;e.stopPropagation();cancel();blocked.current=false;
  const target=e.currentTarget,a={id:e.pointerId,x:e.clientX,y:e.clientY,edge:e.clientX<24||e.clientX>innerWidth-24,target,rect:target.getBoundingClientRect(),reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};active.current=a;
  target.setPointerCapture(e.pointerId);target.dataset.pressing='true';paint(a,e.clientX,e.clientY);
  if(onHold){lift.current=setTimeout(()=>{if(active.current===a){delete target.dataset.pressing;target.dataset.holding='true';}},120);timer.current=setTimeout(()=>{clear();blocked.current=true;target.focus({preventScroll:true});onHold();},480);}
 };
 const move=(e:PointerEvent<HTMLButtonElement>)=>{const a=active.current;if(!a||a.id!==e.pointerId)return;if(Math.hypot(e.clientX-a.x,e.clientY-a.y)>8){clear();blocked.current=true;}else if(a.target.dataset.holding||a.target.dataset.pressing)paint(a,e.clientX,e.clientY);};
 const up=(e:PointerEvent<HTMLButtonElement>)=>{const a=active.current;if(!a||a.id!==e.pointerId)return;const dx=e.clientX-a.x,dy=e.clientY-a.y;clear();active.current=null;if(!a.edge&&onSwipeLeft&&matchMedia('(max-width:760px)').matches&&dx< -55&&Math.abs(dx)>Math.abs(dy)*1.5){blocked.current=true;onSwipeLeft();}};
 return <button aria-haspopup={onHold?"dialog":undefined} {...props} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel} onContextMenu={e=>{if(onHold){e.preventDefault();cancel();blocked.current=true;e.currentTarget.focus({preventScroll:true});onHold();}}} onClick={e=>{if(e.detail!==0&&blocked.current){blocked.current=false;e.preventDefault();e.stopPropagation();return;}onClick?.(e);}}/>;
}
