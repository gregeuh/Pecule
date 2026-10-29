"use client";
import { useState, useSyncExternalStore } from "react";
import { googleErrorMessage } from "../lib/auth-feedback";
let memoryPrivacy:boolean|undefined;
function privacySnapshot(){if(memoryPrivacy!==undefined)return memoryPrivacy;try{return localStorage.getItem("pecule-hide-amounts")==="1";}catch{return false;}}
function privacySubscribe(notify:()=>void){const changed=()=>{memoryPrivacy=undefined;notify();};window.addEventListener("storage",changed);window.addEventListener("pecule:privacy",notify);return()=>{window.removeEventListener("storage",changed);window.removeEventListener("pecule:privacy",notify);};}
export function usePrivacyPreference(){
  const hidden=useSyncExternalStore(privacySubscribe,privacySnapshot,()=>false);
  const setHidden=(value:boolean)=>{memoryPrivacy=value;try{localStorage.setItem("pecule-hide-amounts",value?"1":"0");}catch{/* Keep the privacy choice in memory when storage is unavailable. */}window.dispatchEvent(new Event("pecule:privacy"));};
  return [hidden,setHidden] as const;
}
function networkSubscribe(notify:()=>void){window.addEventListener("online",notify);window.addEventListener("offline",notify);return()=>{window.removeEventListener("online",notify);window.removeEventListener("offline",notify);};}
export function useNetworkOnline(){return useSyncExternalStore(networkSubscribe,()=>navigator.onLine,()=>true);}
function locationSubscribe(notify:()=>void){window.addEventListener("popstate",notify);return()=>window.removeEventListener("popstate",notify);}
const callbackSnapshot=()=>googleErrorMessage(new URLSearchParams(window.location.search).get("error"));
export function useOAuthError(){const callback=useSyncExternalStore(locationSubscribe,callbackSnapshot,()=>"");const [local,setLocal]=useState<string|null>(null);return [local??callback,setLocal] as const;}
export function useGoogleReturn(){return useSyncExternalStore(locationSubscribe,()=>new URLSearchParams(window.location.search).get("connection")==="google",()=>false);}
