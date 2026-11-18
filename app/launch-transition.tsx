"use client";
import {useLayoutEffect,useRef} from 'react';
import LaunchScreen from './launch-screen';
/** Decorative exit only: never delay ready data, focus, navigation or input. */
export default function LaunchTransition({fromBoot}:{fromBoot:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const node=ref.current;if(!node)return;
  const root=document.documentElement,active=fromBoot||root.dataset.peculeLaunch==='cold';
  if(!active)return;
  node.dataset.active='true';
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cards=document.querySelector<HTMLElement>('.wallet-stack');
  const animation=!reduced&&cards?cards.animate([{opacity:.5,transform:'translateY(8px) scale(.99)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'}):undefined;
  const finish=()=>{node.hidden=true;delete root.dataset.peculeLaunch;delete node.dataset.active;};
  const changed=()=>{animation?.cancel();finish();};
  const media=matchMedia('(prefers-reduced-motion:reduce)');media.addEventListener('change',changed);
  node.addEventListener('animationend',finish);
  // The CSS exit can complete before hydration on a fast anonymous launch.
  if(node.getAnimations().every(a=>a.playState==='finished'))finish();
  return()=>{animation?.cancel();node.removeEventListener('animationend',finish);media.removeEventListener('change',changed);delete root.dataset.peculeLaunch;};
 },[fromBoot]);
 return <div ref={ref} className="launch-exit" data-from-boot={fromBoot||undefined} aria-hidden="true"><LaunchScreen decorative/></div>;
}
