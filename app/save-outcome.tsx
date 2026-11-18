"use client";
import {useId,useLayoutEffect,useRef,type ReactNode} from 'react';
import {Check} from 'lucide-react';
import {motionSettings} from './ui-motion';
/** A confirmed result, never a progress simulation or a second save action. */
export default function SaveOutcome({title,description,children,action,onDone,secondary}:{title:string;description:string;children:ReactNode;action:string;onDone:()=>void;secondary?:ReactNode}){
 const id=useId(),root=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{const element=root.current;if(!element)return;element.querySelector<HTMLElement>('h3')?.focus({preventScroll:true});const panel=element.closest<HTMLElement>('.modal-content');if(panel)panel.scrollTop=0;
 const media=matchMedia('(prefers-reduced-motion:reduce)'),timing=motionSettings(element);
 const animation=element.animate(media.matches?[{opacity:.7},{opacity:1}]:[{opacity:.4,transform:'translateY(16px) scale(.985)'},{opacity:1,transform:'none'}],{duration:media.matches?timing.feedback:timing.layout,easing:timing.ease});
 const stop=()=>animation.cancel();media.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);return()=>{stop();media.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);};
 },[]);
 return <section ref={root} className="save-outcome" aria-labelledby={id}><span className="save-outcome-seal" aria-hidden="true"><Check size={27}/></span><h3 id={id} tabIndex={-1}>{title}</h3><p>{description}</p>{children}<div className="form-actions"><button type="button" className="primary full-width" onClick={onDone}>{action}</button>{secondary}</div></section>;
}
