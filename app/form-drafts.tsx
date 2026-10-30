"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type FormSnapshot=Record<string,string[]>;
export class FormDraftStore {
  private drafts=new Map<string,FormSnapshot>();
  private revisions=new Map<string,number>();
  get(key:string){return this.drafts.get(key);}
  version(key:string){return this.revisions.get(key)??0;}
  set(key:string,value:FormSnapshot){this.drafts.set(key,value);}
  clear(key:string){this.drafts.delete(key);this.revisions.set(key,this.version(key)+1);}
  clearAll(){for(const key of this.drafts.keys())this.clear(key);}
  get dirty(){return this.drafts.size>0;}
}
const Store=createContext<FormDraftStore|null>(null);
export const FormDraftValues=createContext<FormSnapshot|undefined>(undefined);
export function FormDraftProvider({children}:{children:ReactNode}){
  const [store]=useState(()=>new FormDraftStore());
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(store.dirty){event.preventDefault();event.returnValue="";}};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[store]);
  return <Store.Provider value={store}>{children}</Store.Provider>;
}
export function useFormDraftStore(){return useContext(Store);}
export function useFormDraftValue(name:string,fallback:string){return useContext(FormDraftValues)?.[name]?.[0]??fallback;}
export function snapshotForm(form:HTMLFormElement):FormSnapshot{
  const result:FormSnapshot={};
  for(const control of form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input[name],select[name],textarea[name]')){
    if(control instanceof HTMLInputElement&&['file','password'].includes(control.type))continue;
    result[control.name]??=[];
    if(control instanceof HTMLInputElement&&['checkbox','radio'].includes(control.type)){if(control.checked)result[control.name].push(control.value);}
    else result[control.name].push(control.value);
  }
  return result;
}
export function restoreForm(form:HTMLFormElement,snapshot:FormSnapshot){
  for(const control of form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input[name],select[name],textarea[name]')){
    const values=snapshot[control.name];if(!values)continue;
    if(control instanceof HTMLInputElement){if(['file','password'].includes(control.type))continue;if(['checkbox','radio'].includes(control.type)){control.checked=values.includes(control.value);continue;}}
    control.value=values[0]??"";
  }
}
