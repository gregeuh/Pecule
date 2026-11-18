"use client";

/** Shared cents-to-decimal editor; parsing remains in the canonical submit flow. */
export default function AmountInput({name,defaultValue,required=true,positive=true,...accessibility}:{name:string;defaultValue?:number;required?:boolean;positive?:boolean;id?:string;"aria-invalid"?:boolean;"aria-describedby"?:string}){return <span className="amount-input"><input {...accessibility} name={name} type="number" inputMode="decimal" step="0.01" min={positive?"0.01":undefined} max="1000000000" defaultValue={defaultValue===undefined?undefined:String(defaultValue/100)} required={required} placeholder="0,00"/><span>€</span></span>;}
