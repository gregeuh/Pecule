"use client";
import { Children, cloneElement, createContext, isValidElement, useContext, useId, useState, type FormHTMLAttributes, type ReactNode, type ReactElement } from "react";
const Errors=createContext<Record<string,string>>({});
export function ValidatedForm({onSubmit,children,...props}:FormHTMLAttributes<HTMLFormElement>){
  const [errors,setErrors]=useState<Record<string,string>>({});
  return <form {...props} noValidate onSubmit={event=>{
    const controls=[...event.currentTarget.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')];
    const invalid=controls.filter(c=>c.willValidate&&!c.checkValidity());
    if(invalid.length){event.preventDefault();const next:Record<string,string>={};for(const c of invalid)next[c.name]=c.validity.valueMissing?"Ce champ est obligatoire.":c.validity.typeMismatch?"Vérifiez le format de ce champ.":c.validity.rangeUnderflow||c.validity.rangeOverflow?"Le montant ou la date est hors des limites autorisées.":"Vérifiez la valeur de ce champ.";setErrors(next);
      let details=invalid[0].closest("details");
      while(details){details.dispatchEvent(new Event("pecule:reveal"));details.open=true;details=details.parentElement?.closest("details")??null;}
      invalid[0].focus();return;}
    setErrors({});void onSubmit?.(event);
  }} onInput={()=>{if(Object.keys(errors).length)setErrors({});}}><Errors.Provider value={errors}>{children}{Object.keys(errors).length>0&&<p className="form-error" role="alert">Vérifiez les champs signalés avant d’enregistrer.</p>}</Errors.Provider></form>;
}
export function FormField({label,children,hint}:{label:string;children:ReactNode;hint?:string}){
  const errors=useContext(Errors),id=useId();let name="";
  function find(nodes:ReactNode){Children.forEach(nodes,node=>{if(!isValidElement(node))return;const p=node.props as {name?:string;children?:ReactNode};if(p.name&&!name)name=p.name;else if(p.children)find(p.children);});}find(children);
  const error=errors[name];
  function annotate(nodes:ReactNode):ReactNode{return Children.map(nodes,node=>{if(!isValidElement(node))return node;const element=node as ReactElement<Record<string,unknown>>;const p=element.props;if(p.name===name&&(["input","select","textarea"].includes(String(element.type))||typeof element.type==="function"))return cloneElement(element,{id,"aria-invalid":!!error,"aria-describedby":[hint?`${id}-hint`:null,error?`${id}-error`:null].filter(Boolean).join(" ")||undefined});if(p.children)return cloneElement(element,{},annotate(p.children as ReactNode));return element;});}
  return <label className={`field ${error?"has-error":""}`} htmlFor={id}><span>{label}</span>{annotate(children)}{hint&&<small id={`${id}-hint`}>{hint}</small>}{error&&<small className="field-error" id={`${id}-error`}>{error}</small>}</label>;
}
