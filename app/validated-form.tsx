"use client";
import { Children, cloneElement, createContext, isValidElement, useContext, useId, useState, useLayoutEffect, useRef, type FormHTMLAttributes, type ReactNode, type ReactElement } from "react";
import { FormDraftValues, useFormDraftStore, snapshotForm, restoreForm } from "./form-drafts";
import { ErrorMessage } from "./interface-feedback";
export function revealFormControl(control:HTMLElement){
  let details=control.closest("details");
  while(details){details.dispatchEvent(new Event("pecule:reveal"));details.open=true;details=details.parentElement?.closest("details")??null;}
  control.focus();
}
const Errors=createContext<Record<string,string>>({});
export function ValidatedForm({onSubmit,children,draftKey,...props}:FormHTMLAttributes<HTMLFormElement>&{draftKey?:string}){
  const [errors,setErrors]=useState<Record<string,string>>({});
  const store=useFormDraftStore(),form=useRef<HTMLFormElement>(null),edited=useRef(false),revision=useRef(0),baseline=useRef("");
  const [reset,setReset]=useState(0),[restored,setRestored]=useState(()=>!!(draftKey&&store?.get(draftKey)));
  const snapshot=draftKey?store?.get(draftKey):undefined;
  useLayoutEffect(()=>{
    const node=form.current;if(!node||!draftKey||!store)return;
    revision.current=store.version(draftKey);edited.current=false;
    baseline.current=JSON.stringify(snapshotForm(node));const saved=store.get(draftKey);if(saved)restoreForm(node,saved);if(reset>0)node.querySelector<HTMLElement>("input:not([type=hidden]),select,textarea")?.focus();
    return()=>{if(edited.current&&revision.current===store.version(draftKey))store.set(draftKey,snapshotForm(node));};
  },[draftKey,store,reset]);
  const capture=(changed=false)=>{if(!draftKey||!store||!form.current)return;if(!changed&&revision.current!==store.version(draftKey))return;const value=snapshotForm(form.current);if(!changed&&!edited.current)return;if(!edited.current&&!store.get(draftKey)&&JSON.stringify(value)===baseline.current)return;edited.current=true;revision.current=store.version(draftKey);store.set(draftKey,value);};
  return <form {...props} data-draft-key={draftKey} ref={form} noValidate onChangeCapture={()=>capture(true)} onBlurCapture={()=>capture()} onClickCapture={()=>queueMicrotask(()=>{if(form.current&&edited.current)capture();})} onSubmit={event=>{
    const controls=[...event.currentTarget.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')];
    const invalid=controls.filter(c=>c.willValidate&&!c.checkValidity());
    if(invalid.length){event.preventDefault();const next:Record<string,string>={};for(const c of invalid)next[c.name]=c.validity.valueMissing?"Ce champ est obligatoire.":c.validity.typeMismatch?"Vérifiez le format de ce champ.":c.validity.rangeUnderflow||c.validity.rangeOverflow?"Le montant ou la date est hors des limites autorisées.":"Vérifiez la valeur de ce champ.";setErrors(next);
      revealFormControl(invalid[0]);return;}
    setErrors({});void onSubmit?.(event);
  }} onInput={()=>{capture(true);if(Object.keys(errors).length)setErrors({});}}><FormDraftValues.Provider key={reset} value={snapshot}><Errors.Provider value={errors}>{restored&&snapshot&&<p className="draft-status" role="status">Votre saisie non enregistrée a été reprise.<button type="button" className="text-button" onClick={()=>{if(draftKey)store?.clear(draftKey);edited.current=false;form.current?.reset();setRestored(false);setErrors({});setReset(n=>n+1);}}>Effacer la saisie</button></p>}{children}{Object.keys(errors).length>0&&<ErrorMessage>Vérifiez les champs signalés avant d’enregistrer.</ErrorMessage>}</Errors.Provider></FormDraftValues.Provider></form>;
}
export function FormField({label,children,hint}:{label:string;children:ReactNode;hint?:string}){
  const errors=useContext(Errors),id=useId();let name="";
  function find(nodes:ReactNode){Children.forEach(nodes,node=>{if(!isValidElement(node))return;const p=node.props as {name?:string;children?:ReactNode};if(p.name&&!name)name=p.name;else if(p.children)find(p.children);});}find(children);
  const error=errors[name];
  function annotate(nodes:ReactNode):ReactNode{return Children.map(nodes,node=>{if(!isValidElement(node))return node;const element=node as ReactElement<Record<string,unknown>>;const p=element.props;if(p.name===name&&(["input","select","textarea"].includes(String(element.type))||typeof element.type==="function"))return cloneElement(element,{id,"aria-invalid":!!error,"aria-describedby":[hint?`${id}-hint`:null,error?`${id}-error`:null].filter(Boolean).join(" ")||undefined});if(p.children)return cloneElement(element,{},annotate(p.children as ReactNode));return element;});}
  return <label className={`field ${error?"has-error":""}`} htmlFor={id}><span>{label}</span>{annotate(children)}{hint&&<small id={`${id}-hint`}>{hint}</small>}{error&&<small className="field-error" id={`${id}-error`}>{error}</small>}</label>;
}
