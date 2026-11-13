"use client";
import {createContext,useContext,useRef,useState,type ReactNode} from 'react';
import {MoreHorizontal,Pencil} from 'lucide-react';
import Pressable from './pressable';
export const GestureActions=createContext<{operation:(id:string)=>void;account:(id:string)=>void}>({operation:()=>{},account:()=>{}});
export default function OperationGesture({id,label,className,children,onClick}:{id:string;label:string;className:string;children:ReactNode;onClick:()=>void}){
 const actions=useContext(GestureActions),[revealed,setRevealed]=useState(false),row=useRef<HTMLDivElement>(null);
 const preview=()=>actions.operation(id);
 return <div className="operation-gesture" ref={row} data-revealed={revealed} data-operation-id={id} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setRevealed(false);}} onKeyDown={e=>{if(e.key==='Escape'&&revealed){e.stopPropagation();setRevealed(false);row.current?.querySelector('button')?.focus();}}}>
  <Pressable type="button" className={className} onClick={()=>{if(revealed)setRevealed(false);else onClick();}} onHold={preview} onSwipeLeft={()=>setRevealed(true)}>{children}</Pressable>
  <button type="button" className="operation-more icon-button" aria-label={`Actions pour ${label}`} aria-haspopup="dialog" onClick={preview}><MoreHorizontal size={18}/></button>
  {revealed&&<div className="operation-swipe-actions" role="group" aria-label={`Actions rapides pour ${label}`}><button type="button" onClick={()=>{row.current?.querySelector('button')?.focus({preventScroll:true});setRevealed(false);onClick();}}><Pencil size={16}/>Modifier</button><button type="button" onClick={()=>{row.current?.querySelector('button')?.focus({preventScroll:true});setRevealed(false);preview();}}><MoreHorizontal size={17}/>Autres actions</button></div>}
 </div>;
}
